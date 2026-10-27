import { KeyboardControls, useKeyboardControls, useProgress } from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { useIsTouchDevice } from "~/src/use-is-touch-device";
import { clamp, lerp } from "~/src/utils";
import {
  CHUNK_FADE_MARGIN,
  CHUNK_OFFSETS,
  CHUNK_SIZE,
  DEPTH_FADE_END,
  DEPTH_FADE_START,
  GRAVITY_CAPTURE_SECONDS,
  GRAVITY_MAX_DEPTH,
  GRAVITY_MIN_DEPTH,
  GRAVITY_NDC_RADIUS,
  INITIAL_CAMERA_Z,
  INVIS_THRESHOLD,
  KEYBOARD_SPEED,
  LOD_DOWN_DISTANCES,
  LOD_UP_DISTANCES,
  MAX_VELOCITY,
  RENDER_DISTANCE,
  VELOCITY_DECAY,
  VELOCITY_LERP,
} from "./constants";
import styles from "./style.module.css";
import {
  acquireTexture,
  flushReadyTextures,
  LOD_LEVELS,
  type LodLevel,
  type TextureHandle,
} from "./texture-manager";
import type { ArtworkItem, ChunkData, FocusedTarget, GazeStatus, InfiniteCanvasProps, PlaneData } from "./types";
import { calculateDisplayScale, generateChunkPlanesCached, getChunkUpdateThrottleMs, shouldThrottleUpdate } from "./utils";

const PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1);

/**
 * Elige el nivel de textura según la distancia a la cámara.
 * Los umbrales para subir y bajar de nivel son distintos (histéresis) para evitar cambios de ida y vuelta.
 */
const pickLodLevel = (dist: number, current: LodLevel): LodLevel => {
  const idx = LOD_LEVELS.indexOf(current);

  // Subir de nivel (acercarse)
  if (idx < 2 && dist < LOD_UP_DISTANCES[idx]!) {
    // Si está muy cerca, salta directo al nivel que corresponde.
    return dist < LOD_UP_DISTANCES[1]! ? LOD_LEVELS[2] : LOD_LEVELS[1];
  }

  // Bajar de nivel (alejarse)
  if (idx > 0 && dist > LOD_DOWN_DISTANCES[idx - 1]!) {
    return LOD_LEVELS[idx - 1]!;
  }

  return current;
};

const KEYBOARD_MAP = [
  { name: "forward", keys: ["w", "W", "ArrowUp"] },
  { name: "backward", keys: ["s", "S", "ArrowDown"] },
  { name: "left", keys: ["a", "A", "ArrowLeft"] },
  { name: "right", keys: ["d", "D", "ArrowRight"] },
  { name: "up", keys: ["e", "E"] },
  { name: "down", keys: ["q", "Q"] },
];

type KeyboardKeys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

const getTouchDistance = (touches: Touch[]) => {
  if (touches.length < 2) {
    return 0;
  }

  const [t1, t2] = touches;
  if (!t1 || !t2) return 0;
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

type CameraGridState = {
  cx: number;
  cy: number;
  cz: number;
  camZ: number;
  focusBlend: number;
  focusedPlaneId: string | null;
  exitedPlaneId: string | null;
};

function MediaPlane({
  planeId,
  position,
  scale,
  media,
  chunkCx,
  chunkCy,
  chunkCz,
  cameraGridRef,
  onSelect,
}: {
  planeId: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  media: ArtworkItem;
  chunkCx: number;
  chunkCy: number;
  chunkCz: number;
  cameraGridRef: React.RefObject<CameraGridState>;
  onSelect: (target: FocusedTarget) => void;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const localState = React.useRef<{
    opacity: number;
    frame: number;
    ready: boolean;
    hovered: boolean;
    level: LodLevel;
  }>({ opacity: 0, frame: 0, ready: false, hovered: false, level: LOD_LEVELS[0] });
  const lodRef = React.useRef<{ held: TextureHandle | null; pending: TextureHandle | null }>({
    held: null,
    pending: null,
  });
  const pointerDownRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  const displayScale = React.useMemo(() => {
    return calculateDisplayScale(media, scale);
  }, [media, scale]);

  useFrame(({ camera }) => {
    const material = materialRef.current;
    const mesh = meshRef.current;
    const state = localState.current;

    if (!material || !mesh) {
      return;
    }

    state.frame = (state.frame + 1) & 1;

    const cam = cameraGridRef.current;
    const isFocusedSelf = cam.focusedPlaneId === planeId;
    const isExitedSelf = cam.exitedPlaneId === planeId;

    if (!isFocusedSelf && !isExitedSelf && state.opacity < INVIS_THRESHOLD && !mesh.visible && state.frame === 0) {
      return;
    }

    const dist = Math.max(Math.abs(chunkCx - cam.cx), Math.abs(chunkCy - cam.cy), Math.abs(chunkCz - cam.cz));
    const absDepth = Math.abs(position.z - cam.camZ);

    if (!isFocusedSelf && !isExitedSelf && absDepth > DEPTH_FADE_END + 50) {
      state.opacity = 0;
      material.opacity = 0;
      material.depthWrite = false;
      mesh.visible = false;
      return;
    }

    const gridFade =
      dist <= RENDER_DISTANCE ? 1 : Math.max(0, 1 - (dist - RENDER_DISTANCE) / Math.max(CHUNK_FADE_MARGIN, 0.0001));

    const depthFade =
      absDepth <= DEPTH_FADE_START
        ? 1
        : Math.max(0, 1 - (absDepth - DEPTH_FADE_START) / Math.max(DEPTH_FADE_END - DEPTH_FADE_START, 0.0001));

    let target = Math.min(gridFade, depthFade * depthFade);

    // Keep the focused or just-exited artwork fully visible so it never blinks or turns transparent
    if (isFocusedSelf || isExitedSelf) {
      target = 1;
    } else if (cam.focusBlend > 0.001) {
      target *= Math.max(0, 1 - cam.focusBlend * 1.15);
    }

    state.opacity = target < INVIS_THRESHOLD && state.opacity < INVIS_THRESHOLD ? 0 : lerp(state.opacity, target, 0.18);

    const isFullyOpaque = state.opacity > 0.99;
    material.opacity = isFullyOpaque ? 1 : state.opacity;
    material.depthWrite = isFullyOpaque;
    mesh.visible = state.opacity > INVIS_THRESHOLD;

    // LOD: la resolución de la textura depende de la distancia a la cámara.
    if (mesh.visible && state.ready && !lodRef.current.pending) {
      const dist = camera.position.distanceTo(mesh.position);
      const wanted = pickLodLevel(dist, state.level);

      if (wanted !== state.level) {
        const handle: TextureHandle = acquireTexture(media, wanted, () => {
          const lod = lodRef.current;
          if (lod.pending !== handle) return;
          const mat = materialRef.current;
          if (mat) mat.map = handle.texture;
          lod.held?.release();
          lod.held = handle;
          lod.pending = null;
          localState.current.level = wanted;
        });
        lodRef.current.pending = handle;
      }
    }
  });

  React.useEffect(() => {
    const state = localState.current;
    state.ready = false;
    state.opacity = 0;
    state.level = LOD_LEVELS[0];
    setIsReady(false);

    const material = materialRef.current;

    if (material) {
      material.opacity = 0;
      material.depthWrite = false;
      material.map = null;
    }

    // Siempre se empieza por el nivel más liviano para que la obra aparezca rápido.
    const handle = acquireTexture(media, LOD_LEVELS[0], () => {
      state.ready = true;
      setIsReady(true);
    });
    const lod = lodRef.current;
    lod.held = handle;

    setTexture(handle.texture);

    return () => {
      lod.held?.release();
      lod.pending?.release();
      lod.held = null;
      lod.pending = null;
    };
  }, [media]);

  React.useEffect(() => {
    const material = materialRef.current;
    const mesh = meshRef.current;
    const state = localState.current;

    if (!material || !mesh || !texture || !isReady || !state.ready) {
      return;
    }

    material.map = texture;
    material.opacity = state.opacity;
    material.depthWrite = state.opacity >= 1;
    mesh.scale.copy(displayScale);
  }, [displayScale, texture, isReady]);

  const handlePointerDown = React.useCallback((e: ThreeEvent<PointerEvent>) => {
    if (localState.current.opacity < 0.25) return;
    pointerDownRef.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      time: performance.now(),
    };
  }, []);

  const handlePointerUp = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const down = pointerDownRef.current;
      pointerDownRef.current = null;
      if (!down || localState.current.opacity < 0.25) return;

      const dx = e.nativeEvent.clientX - down.x;
      const dy = e.nativeEvent.clientY - down.y;
      const dist = Math.hypot(dx, dy);
      const elapsed = performance.now() - down.time;

      // Clean click or tap that did not attempt a drag gesture
      if (dist < 6 && elapsed < 380) {
        e.stopPropagation();
        onSelect({
          planeId,
          artwork: media,
          position: { x: position.x, y: position.y, z: position.z },
          displayScale: { x: displayScale.x, y: displayScale.y },
        });
      }
    },
    [displayScale.x, displayScale.y, media, onSelect, planeId, position.x, position.y, position.z]
  );

  if (!texture || !isReady) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={displayScale}
      visible={false}
      geometry={PLANE_GEOMETRY}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <meshBasicMaterial ref={materialRef} transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Chunk({
  cx,
  cy,
  cz,
  media,
  cameraGridRef,
  onSelect,
}: {
  cx: number;
  cy: number;
  cz: number;
  media: ArtworkItem[];
  cameraGridRef: React.RefObject<CameraGridState>;
  onSelect: (target: FocusedTarget) => void;
}) {
  const [planes, setPlanes] = React.useState<PlaneData[] | null>(null);

  React.useEffect(() => {
    let canceled = false;
    const run = () => !canceled && setPlanes(generateChunkPlanesCached(cx, cy, cz));

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run, { timeout: 100 });

      return () => {
        canceled = true;
        cancelIdleCallback(id);
      };
    }

    const id = setTimeout(run, 0);
    return () => {
      canceled = true;
      clearTimeout(id);
    };
  }, [cx, cy, cz]);

  if (!planes) {
    return null;
  }

  return (
    <group>
      {planes.map((plane) => {
        const mediaItem = media[plane.mediaIndex % media.length];

        if (!mediaItem) {
          return null;
        }

        return (
          <MediaPlane
            key={plane.id}
            planeId={plane.id}
            position={plane.position}
            scale={plane.scale}
            media={mediaItem}
            chunkCx={cx}
            chunkCy={cy}
            chunkCz={cz}
            cameraGridRef={cameraGridRef}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}

type ControllerState = {
  velocity: { x: number; y: number; z: number };
  targetVel: { x: number; y: number; z: number };
  basePos: { x: number; y: number; z: number };
  drift: { x: number; y: number };
  mouse: { x: number; y: number };
  lastMouse: { x: number; y: number };
  scrollAccum: number;
  isDragging: boolean;
  lastTouches: Touch[];
  lastTouchDist: number;
  lastChunkKey: string;
  lastChunkUpdate: number;
  pendingChunk: { cx: number; cy: number; cz: number } | null;
  focusBlend: number;
  editorialSignaled: boolean;
  gravityPlaneId: string | null;
  gravityTime: number;
  exitedPlaneId: string | null;
  cooldownPlaneId: string | null;
  cooldownExitPos: { x: number; y: number; z: number } | null;
  lastCoordsReport: number;
};

const createInitialState = (camZ: number): ControllerState => ({
  velocity: { x: 0, y: 0, z: 0 },
  targetVel: { x: 0, y: 0, z: 0 },
  basePos: { x: 0, y: 0, z: camZ },
  drift: { x: 0, y: 0 },
  mouse: { x: 0, y: 0 },
  lastMouse: { x: 0, y: 0 },
  scrollAccum: 0,
  isDragging: false,
  lastTouches: [],
  lastTouchDist: 0,
  lastChunkKey: "",
  lastChunkUpdate: 0,
  pendingChunk: null,
  focusBlend: 0,
  editorialSignaled: false,
  gravityPlaneId: null,
  gravityTime: 0,
  exitedPlaneId: null,
  cooldownPlaneId: null,
  cooldownExitPos: null,
  lastCoordsReport: 0,
});

const tempProjectVec = new THREE.Vector3();

function SceneController({
  media,
  focusedTarget,
  cameraFov = 60,
  onFocusArtwork,
  onEditorialReadyChange,
  onGazeUpdate,
  onCoordsUpdate,
  onTextureProgress,
}: {
  media: ArtworkItem[];
  focusedTarget: FocusedTarget | null;
  cameraFov?: number;
  onFocusArtwork: (target: FocusedTarget) => void;
  onEditorialReadyChange: (ready: boolean) => void;
  onGazeUpdate?: (status: GazeStatus) => void;
  onCoordsUpdate?: (coords: { x: number; y: number; z: number }) => void;
  onTextureProgress?: (progress: number) => void;
}) {
  const { camera, gl } = useThree();
  const isTouchDevice = useIsTouchDevice();
  const [, getKeys] = useKeyboardControls<keyof KeyboardKeys>();

  const state = React.useRef<ControllerState>(createInitialState(INITIAL_CAMERA_Z));
  const cameraGridRef = React.useRef<CameraGridState>({
    cx: 0,
    cy: 0,
    cz: 0,
    camZ: camera.position.z,
    focusBlend: 0,
    focusedPlaneId: null,
    exitedPlaneId: null,
  });

  const [chunks, setChunks] = React.useState<ChunkData[]>([]);

  const { progress } = useProgress();
  const maxProgress = React.useRef(0);

  React.useEffect(() => {
    const rounded = Math.round(progress);

    if (rounded > maxProgress.current) {
      maxProgress.current = rounded;
      onTextureProgress?.(rounded);
    }
  }, [progress, onTextureProgress]);

  const prevFocusedTargetRef = React.useRef<FocusedTarget | null>(null);

  React.useEffect(() => {
    if (!focusedTarget) {
      state.current.editorialSignaled = false;
      onEditorialReadyChange(false);

      // If user just exited an artwork, protect it from background-fade and set cooldown
      if (prevFocusedTargetRef.current) {
        state.current.exitedPlaneId = prevFocusedTargetRef.current.planeId;
        state.current.cooldownPlaneId = prevFocusedTargetRef.current.planeId;
        state.current.cooldownExitPos = {
          x: state.current.basePos.x,
          y: state.current.basePos.y,
          z: state.current.basePos.z,
        };
        state.current.gravityPlaneId = null;
        state.current.gravityTime = 0;
      }
    } else {
      state.current.exitedPlaneId = null;
      state.current.gravityPlaneId = null;
      state.current.gravityTime = 0;
      onGazeUpdate?.({ planeId: null, artwork: null, progress: 0 });
    }

    prevFocusedTargetRef.current = focusedTarget;
  }, [focusedTarget, onEditorialReadyChange, onGazeUpdate]);

  React.useEffect(() => {
    const canvas = gl.domElement;
    const s = state.current;
    canvas.style.cursor = "grab";

    const setCursor = (cursor: string) => {
      canvas.style.cursor = cursor;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (cameraGridRef.current.focusedPlaneId) return;
      s.isDragging = true;
      s.lastMouse = { x: e.clientX, y: e.clientY };
      setCursor("grabbing");
    };

    const onMouseUp = () => {
      s.isDragging = false;
      setCursor("grab");
    };

    const onMouseLeave = () => {
      s.mouse = { x: 0, y: 0 };
      s.isDragging = false;
      setCursor("grab");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (cameraGridRef.current.focusedPlaneId) return;
      s.mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };

      if (s.isDragging) {
        s.targetVel.x -= (e.clientX - s.lastMouse.x) * 0.025;
        s.targetVel.y += (e.clientY - s.lastMouse.y) * 0.025;
        s.lastMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (cameraGridRef.current.focusedPlaneId) return;
      e.preventDefault();
      // Support both mouse wheel and trackpad pinch-to-zoom (which fires wheel with ctrlKey)
      const factor = e.ctrlKey ? 0.018 : 0.006;
      s.scrollAccum += e.deltaY * factor;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (cameraGridRef.current.focusedPlaneId) return;
      e.preventDefault();
      s.lastTouches = Array.from(e.touches) as Touch[];
      s.lastTouchDist = getTouchDistance(s.lastTouches);
      setCursor("grabbing");
    };

    const onTouchMove = (e: TouchEvent) => {
      if (cameraGridRef.current.focusedPlaneId) return;
      e.preventDefault();
      const touches = Array.from(e.touches) as Touch[];

      if (touches.length === 1 && s.lastTouches.length >= 1) {
        const [touch] = touches;
        const [last] = s.lastTouches;

        if (touch && last) {
          s.targetVel.x -= (touch.clientX - last.clientX) * 0.022;
          s.targetVel.y += (touch.clientY - last.clientY) * 0.022;
        }
      } else if (touches.length === 2 && s.lastTouchDist > 0) {
        const dist = getTouchDistance(touches);
        s.scrollAccum += (s.lastTouchDist - dist) * 0.0065;
        s.lastTouchDist = dist;
      }

      s.lastTouches = touches;
    };

    const onTouchEnd = (e: TouchEvent) => {
      s.lastTouches = Array.from(e.touches) as Touch[];
      s.lastTouchDist = getTouchDistance(s.lastTouches);
      setCursor("grab");
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const s = state.current;
    const now = performance.now();
    const dt = Math.min(delta, 0.1);

    flushReadyTextures();

    const keys = getKeys();

    if (focusedTarget) {
      // Smoothly center the focused artwork and dissolve surrounding 3D world to flat white
      const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      const vFovRad = (cameraFov * Math.PI) / 180;
      const halfTan = Math.tan(vFovRad / 2);

      const distForHeight = focusedTarget.displayScale.y / 2 / (halfTan * 0.56);
      const distForWidth = focusedTarget.displayScale.x / 2 / (halfTan * aspect * 0.72);
      const idealDistZ = Math.max(distForHeight, distForWidth, 14);

      const targetX = focusedTarget.position.x;
      const targetY = focusedTarget.position.y;
      const targetZ = focusedTarget.position.z + idealDistZ;

      s.velocity.x = 0;
      s.velocity.y = 0;
      s.velocity.z = 0;
      s.targetVel.x = 0;
      s.targetVel.y = 0;
      s.targetVel.z = 0;
      s.scrollAccum = 0;

      const flyLerp = 1 - Math.exp(-5.5 * dt);
      s.basePos.x = lerp(s.basePos.x, targetX, flyLerp);
      s.basePos.y = lerp(s.basePos.y, targetY, flyLerp);
      s.basePos.z = lerp(s.basePos.z, targetZ, flyLerp);
      s.drift.x = lerp(s.drift.x, 0, flyLerp);
      s.drift.y = lerp(s.drift.y, 0, flyLerp);

      s.focusBlend = lerp(s.focusBlend, 1, 1 - Math.exp(-4.8 * dt));
      camera.position.set(s.basePos.x + s.drift.x, s.basePos.y + s.drift.y, s.basePos.z);

      const distToTarget = Math.hypot(
        s.basePos.x - targetX,
        s.basePos.y - targetY,
        s.basePos.z - targetZ
      );

      if (!s.editorialSignaled && distToTarget < 0.85 && s.focusBlend > 0.88) {
        s.editorialSignaled = true;
        s.focusBlend = 1;
        onEditorialReadyChange(true);
      }
    } else {
      // Free 3D flight navigation
      s.focusBlend = lerp(s.focusBlend, 0, 1 - Math.exp(-6.0 * dt));

      const { forward, backward, left, right, up, down } = keys;
      if (forward) s.targetVel.z -= KEYBOARD_SPEED;
      if (backward) s.targetVel.z += KEYBOARD_SPEED;
      if (left) s.targetVel.x -= KEYBOARD_SPEED;
      if (right) s.targetVel.x += KEYBOARD_SPEED;
      if (down) s.targetVel.y -= KEYBOARD_SPEED;
      if (up) s.targetVel.y += KEYBOARD_SPEED;

      const isZooming = Math.abs(s.velocity.z) > 0.05;
      const zoomFactor = clamp(s.basePos.z / 50, 0.3, 2.0);
      const driftAmount = 8.0 * zoomFactor;
      const driftLerp = isZooming ? 0.2 : 0.12;

      if (s.isDragging) {
        // Freeze drift during drag
      } else if (isTouchDevice) {
        s.drift.x = lerp(s.drift.x, 0, driftLerp);
        s.drift.y = lerp(s.drift.y, 0, driftLerp);
      } else {
        s.drift.x = lerp(s.drift.x, s.mouse.x * driftAmount, driftLerp);
        s.drift.y = lerp(s.drift.y, s.mouse.y * driftAmount, driftLerp);
      }

      s.targetVel.z += s.scrollAccum;
      s.scrollAccum *= 0.8;

      s.targetVel.x = clamp(s.targetVel.x, -MAX_VELOCITY, MAX_VELOCITY);
      s.targetVel.y = clamp(s.targetVel.y, -MAX_VELOCITY, MAX_VELOCITY);
      s.targetVel.z = clamp(s.targetVel.z, -MAX_VELOCITY, MAX_VELOCITY);

      s.velocity.x = lerp(s.velocity.x, s.targetVel.x, VELOCITY_LERP);
      s.velocity.y = lerp(s.velocity.y, s.targetVel.y, VELOCITY_LERP);
      s.velocity.z = lerp(s.velocity.z, s.targetVel.z, VELOCITY_LERP);

      s.basePos.x += s.velocity.x;
      s.basePos.y += s.velocity.y;
      s.basePos.z += s.velocity.z;

      camera.position.set(s.basePos.x + s.drift.x, s.basePos.y + s.drift.y, s.basePos.z);

      s.targetVel.x *= VELOCITY_DECAY;
      s.targetVel.y *= VELOCITY_DECAY;
      s.targetVel.z *= VELOCITY_DECAY;
    }

    const cx = Math.floor(s.basePos.x / CHUNK_SIZE);
    const cy = Math.floor(s.basePos.y / CHUNK_SIZE);
    const cz = Math.floor(s.basePos.z / CHUNK_SIZE);

    if (s.focusBlend < 0.005) {
      s.exitedPlaneId = null;
    }

    cameraGridRef.current = {
      cx,
      cy,
      cz,
      camZ: s.basePos.z,
      focusBlend: s.focusBlend,
      focusedPlaneId: focusedTarget?.planeId ?? null,
      exitedPlaneId: s.exitedPlaneId,
    };

    if (now - s.lastCoordsReport > 140) {
      s.lastCoordsReport = now;
      onCoordsUpdate?.({
        x: Math.round(s.basePos.x),
        y: Math.round(s.basePos.y),
        z: Math.round(s.basePos.z),
      });
    }

    // Diegetic Gravitational Field: when user is looking near an artwork at low speed,
    // gently pull and center the image as if caught in a gravitational orbit
    const isActivelySteering =
      s.isDragging ||
      keys.forward ||
      keys.backward ||
      keys.left ||
      keys.right ||
      keys.up ||
      keys.down ||
      Math.abs(s.scrollAccum) > 0.08;

    // Clear cooldown once the user has moved away from the exit position
    if (s.cooldownPlaneId && s.cooldownExitPos) {
      const distFromExit = Math.hypot(
        s.basePos.x - s.cooldownExitPos.x,
        s.basePos.y - s.cooldownExitPos.y,
        s.basePos.z - s.cooldownExitPos.z
      );
      if (distFromExit > 14) {
        s.cooldownPlaneId = null;
        s.cooldownExitPos = null;
      }
    }

    if (isActivelySteering) {
      s.gravityPlaneId = null;
      s.gravityTime = 0;
    } else if (!focusedTarget && media.length > 0) {
      let candidatePlane: PlaneData | null = null;
      let candidateDist = GRAVITY_NDC_RADIUS;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            const planes = generateChunkPlanesCached(cx + dx, cy + dy, cz + dz);
            for (const plane of planes) {
              if (plane.id === s.cooldownPlaneId) {
                continue;
              }

              const depthInFront = camera.position.z - plane.position.z;
              if (depthInFront < GRAVITY_MIN_DEPTH || depthInFront > GRAVITY_MAX_DEPTH) {
                continue;
              }

              tempProjectVec.copy(plane.position).project(camera);
              const ndcDist = Math.hypot(tempProjectVec.x, tempProjectVec.y);
              if (ndcDist < candidateDist) {
                candidateDist = ndcDist;
                candidatePlane = plane;
              }
            }
          }
        }
      }

      if (candidatePlane) {
        const artwork = media[candidatePlane.mediaIndex % media.length] ?? null;

        if (artwork) {
          if (s.gravityPlaneId === candidatePlane.id) {
            s.gravityTime += dt;
          } else {
            s.gravityPlaneId = candidatePlane.id;
            s.gravityTime = dt * 0.4;
          }

          const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
          const vFovRad = (cameraFov * Math.PI) / 180;
          const halfTan = Math.tan(vFovRad / 2);
          const displayScale = calculateDisplayScale(artwork, candidatePlane.scale);
          const distForHeight = displayScale.y / 2 / (halfTan * 0.56);
          const distForWidth = displayScale.x / 2 / (halfTan * aspect * 0.72);
          const idealDistZ = Math.max(distForHeight, distForWidth, 14);

          const targetX = candidatePlane.position.x;
          const targetY = candidatePlane.position.y;
          const targetZ = candidatePlane.position.z + idealDistZ;

          const proximity = Math.pow(1 - clamp(candidateDist / GRAVITY_NDC_RADIUS, 0, 1), 1.2);
          const timeStrength = clamp(s.gravityTime / GRAVITY_CAPTURE_SECONDS, 0, 1);
          const pull = (0.28 + 0.72 * timeStrength) * (0.35 + 0.65 * proximity);

          // Diegetic magnetic alignment toward artwork center
          const pullRate = 1 - Math.exp(-3.2 * pull * dt);
          s.basePos.x = lerp(s.basePos.x, targetX, pullRate);
          s.basePos.y = lerp(s.basePos.y, targetY, pullRate);
          s.basePos.z = lerp(s.basePos.z, targetZ, pullRate * 0.65);
          s.drift.x = lerp(s.drift.x, 0, pullRate * 2.0);
          s.drift.y = lerp(s.drift.y, 0, pullRate * 2.0);

          s.velocity.x *= 1 - 0.22 * pull;
          s.velocity.y *= 1 - 0.22 * pull;
          s.velocity.z *= 1 - 0.22 * pull;

          // Gravitational capture complete: locks into focused artwork
          if (s.gravityTime >= GRAVITY_CAPTURE_SECONDS || (candidateDist < 0.075 && s.gravityTime > 0.65)) {
            s.gravityPlaneId = null;
            s.gravityTime = 0;
            onFocusArtwork({
              planeId: candidatePlane.id,
              artwork,
              position: {
                x: candidatePlane.position.x,
                y: candidatePlane.position.y,
                z: candidatePlane.position.z,
              },
              displayScale: {
                x: displayScale.x,
                y: displayScale.y,
              },
            });
          }
        }
      } else if (s.gravityTime > 0) {
        s.gravityPlaneId = null;
        s.gravityTime = Math.max(0, s.gravityTime - dt * 2.5);
      }
    }

    const key = `${cx},${cy},${cz}`;
    if (key !== s.lastChunkKey) {
      s.pendingChunk = { cx, cy, cz };
      s.lastChunkKey = key;
    }

    const isZooming = Math.abs(s.velocity.z) > 0.05;
    const throttleMs = focusedTarget ? 80 : getChunkUpdateThrottleMs(isZooming, Math.abs(s.velocity.z));

    if (s.pendingChunk && shouldThrottleUpdate(s.lastChunkUpdate, throttleMs, now)) {
      const { cx: ucx, cy: ucy, cz: ucz } = s.pendingChunk;
      s.pendingChunk = null;
      s.lastChunkUpdate = now;

      setChunks(
        CHUNK_OFFSETS.map((o) => ({
          key: `${ucx + o.dx},${ucy + o.dy},${ucz + o.dz}`,
          cx: ucx + o.dx,
          cy: ucy + o.dy,
          cz: ucz + o.dz,
        }))
      );
    }
  });

  React.useEffect(() => {
    const s = state.current;
    s.basePos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };

    setChunks(
      CHUNK_OFFSETS.map((o) => ({
        key: `${o.dx},${o.dy},${o.dz}`,
        cx: o.dx,
        cy: o.dy,
        cz: o.dz,
      }))
    );
  }, [camera]);

  return (
    <>
      {chunks.map((chunk) => (
        <Chunk
          key={chunk.key}
          cx={chunk.cx}
          cy={chunk.cy}
          cz={chunk.cz}
          media={media}
          cameraGridRef={cameraGridRef}
          onSelect={onFocusArtwork}
        />
      ))}
    </>
  );
}

export function InfiniteCanvasScene({
  media,
  focusedTarget,
  onFocusArtwork,
  onEditorialReadyChange,
  onGazeUpdate,
  onCoordsUpdate,
  onTextureProgress,
  cameraFov = 60,
  cameraNear = 1,
  cameraFar = 500,
  fogNear = 120,
  fogFar = 320,
  backgroundColor = "#fafafc",
  fogColor = "#fafafc",
}: InfiniteCanvasProps) {
  const isTouchDevice = useIsTouchDevice();
  const dpr = Math.min(window.devicePixelRatio || 1, isTouchDevice ? 1.25 : 1.5);

  if (!media.length) {
    return null;
  }

  return (
    <KeyboardControls map={KEYBOARD_MAP}>
      <div className={styles.container}>
        <Canvas
          camera={{ position: [0, 0, INITIAL_CAMERA_Z], fov: cameraFov, near: cameraNear, far: cameraFar }}
          dpr={dpr}
          flat
          gl={{ antialias: true, powerPreference: "high-performance" }}
          className={styles.canvas}
        >
          <color attach="background" args={[backgroundColor]} />
          <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
          <SceneController
            media={media}
            focusedTarget={focusedTarget}
            cameraFov={cameraFov}
            onFocusArtwork={onFocusArtwork}
            onEditorialReadyChange={onEditorialReadyChange}
            onGazeUpdate={onGazeUpdate}
            onCoordsUpdate={onCoordsUpdate}
            onTextureProgress={onTextureProgress}
          />
        </Canvas>
      </div>
    </KeyboardControls>
  );
}
