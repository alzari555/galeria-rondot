import { AlertCircle, X } from "lucide-react";
import * as React from "react";
import { checkSamsungForcedDarkMode } from "~/src/mobile-guards";

export function BrowserWarningBanner() {
  const [showWarning, setShowWarning] = React.useState(false);

  React.useEffect(() => {
    // Check after DOM has stabilized
    const timer = setTimeout(() => {
      const isDismissed = sessionStorage.getItem("dismiss_samsung_dark_warn") === "1";
      if (!isDismissed && checkSamsungForcedDarkMode()) {
        setShowWarning(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("dismiss_samsung_dark_warn", "1");
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        maxWidth: "min(92vw, 560px)",
        backgroundColor: "#16181f",
        color: "#ffffff",
        padding: "10px 14px",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "12px",
        lineHeight: "1.35",
        fontFamily: "var(--sans)",
      }}
    >
      <AlertCircle size={18} style={{ flexShrink: 0, color: "#f59e0b" }} />
      <div style={{ flex: 1 }}>
        <strong>Modo oscuro forzado de Samsung detectado:</strong> altera los colores y contrastes
        originales de las pinturas. Recomendamos tocar <strong>Menú ☰ → Desactivar modo oscuro</strong>.
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar aviso"
        style={{
          background: "none",
          border: "none",
          color: "#a0a5b5",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
