import { AlertTriangle, X } from "lucide-react";
import * as React from "react";
import { isSamsungBrowser } from "~/src/mobile-guards";

export function BrowserWarningBanner() {
  const [showWarning, setShowWarning] = React.useState(false);

  React.useEffect(() => {
    // If URL has force parameter, always show
    const forceShow =
      typeof window !== "undefined" &&
      (window.location.search.includes("samsung") || window.location.search.includes("banner"));

    const isDismissed =
      !forceShow && sessionStorage.getItem("dismiss_samsung_dark_warn") === "1";

    if (!isDismissed && isSamsungBrowser()) {
      setShowWarning(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("dismiss_samsung_dark_warn", "1");
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <aside
      aria-label="Aviso de compatibilidad de navegador"
      style={{
        position: "fixed",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100000,
        width: "calc(100% - 32px)",
        maxWidth: "520px",
        backgroundColor: "#16181f",
        color: "#ffffff",
        padding: "12px 16px",
        borderRadius: "14px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.12)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "13px",
        lineHeight: "1.4",
        fontFamily: "var(--sans)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <AlertTriangle
        size={22}
        style={{ flexShrink: 0, color: "#f59e0b" }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "#ffffff", marginBottom: "2px" }}>
          Navegador Samsung detectado
        </div>
        <div style={{ color: "#d1d5db", fontSize: "12px" }}>
          Si ves colores invertidos o grisáceos: tocá <strong>Menú ☰ → Desactivar modo oscuro</strong> para ver los pigmentos y contrastes reales.
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar aviso"
        style={{
          background: "rgba(255, 255, 255, 0.12)",
          border: "none",
          borderRadius: "999px",
          color: "#ffffff",
          cursor: "pointer",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <X size={15} />
      </button>
    </aside>
  );
}
