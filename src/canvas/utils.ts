import * as THREE from "three";
import { hashString, seededRandom } from "~/src/utils";
import { CHUNK_SIZE } from "./constants";
import type { ArtworkItem, FocusedTarget, PlaneData } from "./types";

const MAX_PLANE_CACHE = 256;
const planeCache = new Map<string, PlaneData[]>();

const touchPlaneCache = (key: string) => {
  const v = planeCache.get(key);
  if (!v) {
    return;
  }

  planeCache.delete(key);
  planeCache.set(key, v);
};

const evictPlaneCache = () => {
  while (planeCache.size > MAX_PLANE_CACHE) {
    const firstKey = planeCache.keys().next().value as string | undefined;
    if (!firstKey) break;
    planeCache.delete(firstKey);
  }
};

export const getChunkUpdateThrottleMs = (isZooming: boolean, zoomSpeed: number): number => {
  if (zoomSpeed > 1.0) {
    return 500;
  }

  if (isZooming) {
    return 400;
  }

  return 100;
};

export const calculateDisplayScale = (media: ArtworkItem, baseScale: THREE.Vector3): THREE.Vector3 => {
  if (media.width && media.height) {
    const aspect = media.width / media.height;
    return new THREE.Vector3(baseScale.y * aspect, baseScale.y, 1);
  }
  return baseScale.clone();
};

export const generateChunkPlanes = (cx: number, cy: number, cz: number): PlaneData[] => {
  const planes: PlaneData[] = [];
  const seed = hashString(`${cx},${cy},${cz}`);

  // ITEMS_PER_CHUNK = 5
  for (let i = 0; i < 5; i++) {
    const s = seed + i * 1000;
    const r = (n: number) => seededRandom(s + n);
    const size = 12 + r(4) * 8;

    planes.push({
      id: `${cx}-${cy}-${cz}-${i}`,
      position: new THREE.Vector3(
        cx * CHUNK_SIZE + r(0) * CHUNK_SIZE,
        cy * CHUNK_SIZE + r(1) * CHUNK_SIZE,
        cz * CHUNK_SIZE + r(2) * CHUNK_SIZE
      ),
      scale: new THREE.Vector3(size, size, 1),
      mediaIndex: Math.floor(r(5) * 1_000_000),
    });
  }

  return planes;
};

export const generateChunkPlanesCached = (cx: number, cy: number, cz: number): PlaneData[] => {
  const key = `${cx},${cy},${cz}`;
  const cached = planeCache.get(key);
  if (cached) {
    touchPlaneCache(key);
    return cached;
  }

  const planes = generateChunkPlanes(cx, cy, cz);
  planeCache.set(key, planes);
  evictPlaneCache();
  return planes;
};

export const shouldThrottleUpdate = (lastUpdateTime: number, throttleMs: number, currentTime: number): boolean => {
  return currentTime - lastUpdateTime >= throttleMs;
};

/**
 * Finds the closest deterministic plane in the 3D grid that displays the requested artwork.
 * Searches outward in concentric chunk shells around the camera's current base position.
 */
export const findClosestPlaneForArtwork = (
  artworkIndex: number,
  media: ArtworkItem[],
  cameraPos: { x: number; y: number; z: number }
): FocusedTarget | null => {
  if (!media.length || artworkIndex < 0 || artworkIndex >= media.length) {
    return null;
  }

  const artwork = media[artworkIndex];
  if (!artwork) return null;

  const baseCx = Math.floor(cameraPos.x / CHUNK_SIZE);
  const baseCy = Math.floor(cameraPos.y / CHUNK_SIZE);
  const baseCz = Math.floor(cameraPos.z / CHUNK_SIZE);

  let bestPlane: PlaneData | null = null;
  let bestDistSq = Number.POSITIVE_INFINITY;

  // Search up to radius 4 chunks around current position
  for (let radius = 0; radius <= 4; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) !== radius) continue;

          const planes = generateChunkPlanesCached(baseCx + dx, baseCy + dy, baseCz + dz);
          for (const plane of planes) {
            if (plane.mediaIndex % media.length === artworkIndex) {
              const distSq =
                (plane.position.x - cameraPos.x) ** 2 +
                (plane.position.y - cameraPos.y) ** 2 +
                (plane.position.z - cameraPos.z) ** 2;
              if (distSq < bestDistSq) {
                bestDistSq = distSq;
                bestPlane = plane;
              }
            }
          }
        }
      }
    }

    if (bestPlane && radius >= 1) {
      break;
    }
  }

  if (!bestPlane) {
    // Fallback to chunk (0,0,0) first plane
    const fallbackPlanes = generateChunkPlanesCached(baseCx, baseCy, baseCz);
    bestPlane = fallbackPlanes[0]!;
  }

  const displayScale = calculateDisplayScale(artwork, bestPlane.scale);

  return {
    planeId: bestPlane.id,
    artwork,
    position: {
      x: bestPlane.position.x,
      y: bestPlane.position.y,
      z: bestPlane.position.z,
    },
    displayScale: {
      x: displayScale.x,
      y: displayScale.y,
    },
  };
};
