import { run } from "~/src/utils";

export const CHUNK_SIZE = 110;
export const RENDER_DISTANCE = 2;
export const CHUNK_FADE_MARGIN = 1;
export const MAX_VELOCITY = 3.2;
export const DEPTH_FADE_START = 140;
export const DEPTH_FADE_END = 260;
export const INVIS_THRESHOLD = 0.01;
export const KEYBOARD_SPEED = 0.18;
export const VELOCITY_LERP = 0.16;
export const VELOCITY_DECAY = 0.9;
export const INITIAL_CAMERA_Z = 50;

// LOD de texturas: distancia (unidades del mundo) para subir de nivel 256→512 y 512→1024,
// y distancia (algo mayor) para bajar de nivel, para evitar parpadeos entre niveles.
export const LOD_UP_DISTANCES = [60, 25] as const;
export const LOD_DOWN_DISTANCES = [68, 30] as const;

// Gravitational Field parameters (Diegetic centering without UI)
export const GRAVITY_NDC_RADIUS = 0.34;
export const GRAVITY_MIN_DEPTH = 6;
export const GRAVITY_MAX_DEPTH = 52;
export const GRAVITY_CAPTURE_SECONDS = 1.35;

export type ChunkOffset = {
  dx: number;
  dy: number;
  dz: number;
  dist: number;
};

export const CHUNK_OFFSETS: ChunkOffset[] = run(() => {
  const maxDist = RENDER_DISTANCE + CHUNK_FADE_MARGIN;
  const offsets: ChunkOffset[] = [];
  for (let dx = -maxDist; dx <= maxDist; dx++) {
    for (let dy = -maxDist; dy <= maxDist; dy++) {
      for (let dz = -maxDist; dz <= maxDist; dz++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
        if (dist > maxDist) continue;
        offsets.push({ dx, dy, dz, dist });
      }
    }
  }
  return offsets;
});
