import type * as THREE from "three";

export type ArtworkStatus = "disponible" | "reservado" | "coleccion_privada";

export type ArtworkItem = {
  id: string;
  catalogCode: string;
  url: string;
  image?: string;
  title: string;
  artist: string;
  year: string;
  technique: string;
  dimensions: string;
  status: ArtworkStatus;
  price: string;
  vibes: string[];
  tags: string[];
  story: string;
  width: number;
  height: number;
};

export type FocusedTarget = {
  planeId: string;
  artwork: ArtworkItem;
  position: { x: number; y: number; z: number };
  displayScale: { x: number; y: number };
};

export type GazeStatus = {
  planeId: string | null;
  artwork: ArtworkItem | null;
  progress: number;
};

export type InfiniteCanvasProps = {
  media: ArtworkItem[];
  focusedTarget: FocusedTarget | null;
  isEditorialReady: boolean;
  onFocusArtwork: (target: FocusedTarget) => void;
  onEditorialReadyChange: (ready: boolean) => void;
  onGazeUpdate?: (status: GazeStatus) => void;
  onCoordsUpdate?: (coords: { x: number; y: number; z: number }) => void;
  onTextureProgress?: (progress: number) => void;
  cameraFov?: number;
  cameraNear?: number;
  cameraFar?: number;
  fogNear?: number;
  fogFar?: number;
  backgroundColor?: string;
  fogColor?: string;
};

export type ChunkData = {
  key: string;
  cx: number;
  cy: number;
  cz: number;
};

export type PlaneData = {
  id: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  mediaIndex: number;
};
