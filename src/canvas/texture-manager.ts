import * as THREE from "three";
import { resolveArtworkUrl } from "~/src/utils";
import type { ArtworkItem } from "./types";

/**
 * Niveles de detalle (LOD) de las texturas, de menor a mayor resolución (lado largo en px).
 * Los archivos se generan con `npm run lod` en `public/artworks/lod/<nivel>/`.
 */
export const LOD_LEVELS = [256, 512, 1024] as const;
export type LodLevel = (typeof LOD_LEVELS)[number];

// Limit simultaneous decode/fetch work to avoid frame hitches.
const MAX_CONCURRENT_LOADS = 4;
// Texturas *distintas* que se entregan a la escena por frame (cada una implica una subida a la GPU).
const MAX_NEW_TEXTURES_PER_FRAME = 2;
// Tope de callbacks por frame (varios planos comparten una misma textura y solo actualizan su material).
const MAX_CALLBACKS_PER_FRAME = 60;
// Tiempo que una textura sin uso se mantiene antes de liberarse de la GPU.
const IDLE_DISPOSE_MS = 15_000;
const SWEEP_INTERVAL_MS = 5_000;

type Entry = {
  key: string;
  priority: number;
  texture: THREE.Texture;
  loaded: boolean;
  started: boolean;
  /** Ya se entregó a algún plano, es decir, ya se subió (o se está subiendo) a la GPU. */
  delivered: boolean;
  refs: number;
  idleSince: number;
  callbacks: Set<() => void>;
};

export type TextureHandle = {
  texture: THREE.Texture;
  /** Indica a la caché que esta textura ya no se usa. Es idempotente. */
  release: () => void;
};

const cache = new Map<string, Entry>();
const queue: Entry[] = [];
const readyQueue: Array<{ entry: Entry; cb: () => void }> = [];
let activeLoads = 0;
let sweepTimer: ReturnType<typeof setInterval> | null = null;

const lodUrl = (resolvedUrl: string, level: LodLevel): string => {
  const marker = "./artworks/";
  if (resolvedUrl.startsWith(marker)) {
    return `${marker}lod/${level}/${resolvedUrl.slice(marker.length).replace(/\.[^./]+$/, ".webp")}`;
  }
  // Imágenes externas: no hay versiones LOD, se reduce en el navegador.
  return resolvedUrl;
};

const loadBitmap = async (url: string, maxSide: number): Promise<ImageBitmap> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const full = await createImageBitmap(blob, { imageOrientation: "flipY" });
  const side = Math.max(full.width, full.height);
  if (side <= maxSide) return full;

  const scale = maxSide / side;
  const resized = await createImageBitmap(full, {
    imageOrientation: "none",
    resizeWidth: Math.round(full.width * scale),
    resizeHeight: Math.round(full.height * scale),
    resizeQuality: "high",
  });
  full.close();
  return resized;
};

const pumpQueue = () => {
  while (activeLoads < MAX_CONCURRENT_LOADS && queue.length > 0) {
    // Primero los niveles más bajos: así las obras aparecen rápido y luego ganan nitidez.
    let best = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i]!.priority < queue[best]!.priority) best = i;
    }
    const entry = queue.splice(best, 1)[0]!;

    // Si nadie la necesita ya (el usuario se movió), no se descarga.
    if (entry.refs <= 0) {
      cache.delete(entry.key);
      continue;
    }

    entry.started = true;
    activeLoads++;
    const level = LOD_LEVELS[entry.priority]!;

    loadBitmap(entry.key, level)
      .then((bitmap) => {
        entry.texture.image = bitmap;
        entry.texture.needsUpdate = true;
        entry.loaded = true;
        entry.callbacks.forEach((cb) => readyQueue.push({ entry, cb }));
        entry.callbacks.clear();
      })
      .catch((err) => {
        console.error("Texture load failed:", entry.key, err);
        cache.delete(entry.key);
      })
      .finally(() => {
        activeLoads--;
        pumpQueue();
      });
  }
};

const sweep = () => {
  const now = performance.now();
  for (const [key, entry] of cache) {
    if (entry.refs > 0 || !entry.loaded || now - entry.idleSince < IDLE_DISPOSE_MS) continue;
    const image = entry.texture.image as ImageBitmap | undefined;
    entry.texture.dispose();
    image?.close?.();
    cache.delete(key);
  }
};

const ensureSweeper = () => {
  if (sweepTimer === null && typeof setInterval !== "undefined") {
    sweepTimer = setInterval(sweep, SWEEP_INTERVAL_MS);
  }
};

const createEntry = (key: string, priority: number): Entry => {
  const texture = new THREE.Texture();
  texture.flipY = false; // el bitmap ya se decodifica volteado
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  texture.colorSpace = THREE.SRGBColorSpace;

  return {
    key,
    priority,
    texture,
    loaded: false,
    started: false,
    delivered: false,
    refs: 0,
    idleSince: performance.now(),
    callbacks: new Set(),
  };
};

/**
 * Pide la textura de una obra en un nivel de detalle. Aumenta su contador de uso:
 * hay que llamar a `release()` cuando deje de usarse.
 * `onReady` se llama cuando la textura está cargada, repartido en el tiempo (ver `flushReadyTextures`).
 */
export const acquireTexture = (item: ArtworkItem, level: LodLevel, onReady?: () => void): TextureHandle => {
  const key = lodUrl(resolveArtworkUrl(item.url), level);
  let entry = cache.get(key);

  if (!entry) {
    entry = createEntry(key, LOD_LEVELS.indexOf(level));
    cache.set(key, entry);
    queue.push(entry);
  }

  const owned = entry;
  owned.refs++;
  ensureSweeper();

  let released = false;
  const guarded = () => {
    if (!released) onReady?.();
  };

  if (onReady) {
    if (owned.loaded) readyQueue.push({ entry: owned, cb: guarded });
    else owned.callbacks.add(guarded);
  }

  pumpQueue();

  return {
    texture: owned.texture,
    release: () => {
      if (released) return;
      released = true;
      owned.callbacks.delete(guarded);
      owned.refs--;
      if (owned.refs <= 0) owned.idleSince = performance.now();
    },
  };
};

/**
 * Entrega a la escena un máximo de texturas por frame. Se llama desde un `useFrame`,
 * para evitar que muchas subidas a la GPU coincidan en un mismo frame.
 */
export const flushReadyTextures = () => {
  let newTextures = 0;
  let callbacks = 0;

  while (readyQueue.length > 0 && callbacks < MAX_CALLBACKS_PER_FRAME) {
    const item = readyQueue[0]!;

    if (!item.entry.delivered) {
      if (newTextures >= MAX_NEW_TEXTURES_PER_FRAME) break;
      newTextures++;
      item.entry.delivered = true;
    }

    readyQueue.shift();
    callbacks++;
    try {
      item.cb();
    } catch (err) {
      console.error(`Callback failed: ${JSON.stringify(err)}`);
    }
  }
};
