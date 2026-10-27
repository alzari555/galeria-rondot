import * as THREE from "three";
import { resolveArtworkUrl } from "~/src/utils";
import type { ArtworkItem } from "./types";

// Max texture side in the 3D scene. The original images (~1600px) are downscaled
// off the main thread to cut decode time and GPU memory (~9MB -> ~4MB per texture).
const MAX_TEXTURE_SIZE = 1024;
// Limit simultaneous decode/upload work to avoid frame hitches.
const MAX_CONCURRENT_LOADS = 3;

const textureCache = new Map<string, THREE.Texture>();
const loadCallbacks = new Map<string, Set<(tex: THREE.Texture) => void>>();
const loadedKeys = new Set<string>();

const queue: Array<() => Promise<void>> = [];
let activeLoads = 0;

const pumpQueue = () => {
  while (activeLoads < MAX_CONCURRENT_LOADS && queue.length > 0) {
    const job = queue.shift();
    if (!job) break;
    activeLoads++;
    job().finally(() => {
      activeLoads--;
      pumpQueue();
    });
  }
};

const loadBitmap = async (url: string): Promise<ImageBitmap> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const full = await createImageBitmap(blob, { imageOrientation: "flipY" });
  const maxSide = Math.max(full.width, full.height);
  if (maxSide <= MAX_TEXTURE_SIZE) return full;

  const scale = MAX_TEXTURE_SIZE / maxSide;
  const resized = await createImageBitmap(full, {
    imageOrientation: "none",
    resizeWidth: Math.round(full.width * scale),
    resizeHeight: Math.round(full.height * scale),
    resizeQuality: "high",
  });
  full.close();
  return resized;
};

export const getTexture = (item: ArtworkItem, onLoad?: (texture: THREE.Texture) => void): THREE.Texture => {
  const resolvedUrl = resolveArtworkUrl(item.url);
  const key = resolvedUrl;
  const existing = textureCache.get(key);

  if (existing) {
    if (onLoad) {
      if (loadedKeys.has(key)) {
        onLoad(existing);
      } else {
        loadCallbacks.get(key)?.add(onLoad);
      }
    }
    return existing;
  }

  const callbacks = new Set<(tex: THREE.Texture) => void>();
  if (onLoad) callbacks.add(onLoad);
  loadCallbacks.set(key, callbacks);

  const texture = new THREE.Texture();
  texture.flipY = false; // bitmap is already flipped at decode time
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);

  queue.push(async () => {
    try {
      const bitmap = await loadBitmap(key);
      texture.image = bitmap;
      texture.needsUpdate = true;
      loadedKeys.add(key);

      loadCallbacks.get(key)?.forEach((cb) => {
        try {
          cb(texture);
        } catch (err) {
          console.error(`Callback failed: ${JSON.stringify(err)}`);
        }
      });
    } catch (err) {
      console.error("Texture load failed:", key, err);
    } finally {
      loadCallbacks.delete(key);
    }
  });
  pumpQueue();

  return texture;
};
