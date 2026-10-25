import * as React from "react";
import { INITIAL_CAMERA_Z } from "~/src/canvas/constants";
import { InfiniteCanvas } from "~/src/canvas/index";
import type { ArtworkItem, FocusedTarget } from "~/src/canvas/types";
import { findClosestPlaneForArtwork } from "~/src/canvas/utils";
import { getArtworks } from "~/src/data/index";
import { EditorialView } from "~/src/editorial/EditorialView";
import { BrowserWarningBanner } from "~/src/ui/BrowserWarningBanner";
import { Header } from "~/src/ui/Header";
import { PageLoader } from "~/src/ui/Loader";
import { SearchModal } from "~/src/ui/SearchModal";

export function App() {
  const [media] = React.useState<ArtworkItem[]>(() => getArtworks());
  const [textureProgress, setTextureProgress] = React.useState(0);
  const [focusedTarget, setFocusedTarget] = React.useState<FocusedTarget | null>(null);
  const [isEditorialReady, setIsEditorialReady] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0, z: INITIAL_CAMERA_Z });
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [initialVibe, setInitialVibe] = React.useState<string | null>(null);

  // Global keyboard shortcut Cmd+K / Ctrl+K or '/' to open search
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setInitialVibe(null);
        setSearchOpen((prev) => !prev);
      } else if (!isInput && e.key === "/" && !searchOpen) {
        e.preventDefault();
        setInitialVibe(null);
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  const handleFocusArtwork = React.useCallback((target: FocusedTarget) => {
    setFocusedTarget(target);
  }, []);

  const handleReturnTo3D = React.useCallback(() => {
    setIsEditorialReady(false);
    setFocusedTarget(null);
  }, []);

  const handleSelectArtworkIndex = React.useCallback(
    (index: number) => {
      const closestTarget = findClosestPlaneForArtwork(index, media, coords);
      if (closestTarget) {
        setIsEditorialReady(false);
        setFocusedTarget(closestTarget);
      }
    },
    [coords, media]
  );

  const handleSelectVibeFromEditorial = React.useCallback((vibe: string) => {
    setInitialVibe(vibe);
    setSearchOpen(true);
  }, []);

  const isFocusedMode = focusedTarget !== null;

  return (
    <>
      <BrowserWarningBanner />
      <PageLoader progress={textureProgress} />

      <Header
        coords={coords}
        hidden={isFocusedMode}
        onOpenSearch={() => {
          setInitialVibe(null);
          setSearchOpen(true);
        }}
      />

      <InfiniteCanvas
        media={media}
        focusedTarget={focusedTarget}
        isEditorialReady={isEditorialReady}
        onFocusArtwork={handleFocusArtwork}
        onEditorialReadyChange={setIsEditorialReady}
        onCoordsUpdate={setCoords}
        onTextureProgress={setTextureProgress}
      />

      <EditorialView
        target={focusedTarget}
        visible={isFocusedMode && isEditorialReady}
        onReturnTo3D={handleReturnTo3D}
        onSelectVibe={handleSelectVibeFromEditorial}
      />

      <SearchModal
        open={searchOpen}
        artworks={media}
        initialVibe={initialVibe}
        onClose={() => setSearchOpen(false)}
        onSelectArtworkIndex={handleSelectArtworkIndex}
      />
    </>
  );
}
