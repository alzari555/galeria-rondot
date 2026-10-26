/**
 * Galería Rondot — Custom Editorial Mode Preview Template for Sveltia CMS
 * Matches the aesthetic, typography and structure of the 3D gallery's Editorial Mode.
 */

// SVG Icon definitions using SVG strings compatible with HTM
const ICONS = {
  whatsapp: `
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  `,
  mail: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  `,
  copy: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  `,
  arrowDown: `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  `,
  arrowUp: `
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m18 15-6-6-6 6" />
    </svg>
  `,
  imagePlaceholder: `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  `
};

const STATUS_CONFIG = {
  disponible: {
    label: "Disponible para adquisición",
    dotClass: "status-available",
    ctaLabel: "Consultar adquisición por WhatsApp",
  },
  reservado: {
    label: "Obra actualmente reservada",
    dotClass: "status-reserved",
    ctaLabel: "Consultar lista de espera por WhatsApp",
  },
  coleccion_privada: {
    label: "En colección privada",
    dotClass: "status-private",
    ctaLabel: "Consultar por obra similar o encargo",
  },
};

/**
 * Safely resolves an image path into a displayable URL,
 * using getAsset (for blob uploads) or path normalization for local/GH Pages.
 */
function resolveArtworkImage(rawPath, getAsset) {
  if (!rawPath) return "";
  if (typeof rawPath === "object" && rawPath.url) return rawPath.url;

  if (typeof getAsset === "function") {
    try {
      const asset = getAsset(rawPath);
      if (asset) {
        if (asset.url) return asset.url;
        if (typeof asset.toString === "function") {
          const str = asset.toString();
          if (str && str !== "[object Object]") return str;
        }
      }
    } catch {
      // Fall through to path resolution
    }
  }

  if (typeof rawPath === "string") {
    if (
      rawPath.startsWith("blob:") ||
      rawPath.startsWith("http://") ||
      rawPath.startsWith("https://") ||
      rawPath.startsWith("data:")
    ) {
      return rawPath;
    }

    const origin = window.location.origin;
    const base = window.location.pathname.replace(/\/admin(\/.*)?$/, "");
    const clean = rawPath.replace(/^\.?\/?/, "");
    return `${origin}${base}/${clean}`;
  }

  return "";
}

/**
 * Normalizes vibes array from various potential formats (Immutable List, Array, string)
 */
function normalizeVibes(vibes) {
  if (!vibes) return ["Original", "Galería"];
  if (typeof vibes.toJS === "function") vibes = vibes.toJS();
  if (Array.isArray(vibes)) {
    const filtered = vibes.filter(Boolean);
    return filtered.length > 0 ? filtered : ["Original", "Galería"];
  }
  if (typeof vibes === "string") {
    const list = vibes.split(",").map((v) => v.trim()).filter(Boolean);
    return list.length > 0 ? list : ["Original", "Galería"];
  }
  return ["Original", "Galería"];
}

/**
 * Main Editorial Preview Component registered with Sveltia CMS
 */
function ArtworkEditorialPreview(props) {
  const { entry, getAsset } = props;
  const html = window.html;

  // Extract entry data (Immutable Map -> JS Object)
  let data = {};
  if (entry && typeof entry.toJS === "function") {
    const js = entry.toJS();
    data = js.data || js;
  } else if (entry && entry.data) {
    data = entry.data;
  } else if (entry && typeof entry.get === "function") {
    const d = entry.get("data");
    data = d && typeof d.toJS === "function" ? d.toJS() : {};
  }

  // Field values with defaults
  const catalogCode = data.catalogCode || "RON-125";
  const title = data.title || "Obra sin título";
  const artist = data.artist || "Miguel Rondot";
  const year = data.year || "2026";
  const dimensions = data.dimensions || "120 × 90 cm";
  const technique = data.technique || "Óleo sobre lienzo";
  const statusKey = data.status || "disponible";
  const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.disponible;
  const price = data.price || "Consultar";
  const story = data.story || "Aquí se desplegará la nota curatorial e historia de la obra en el modo editorial de la galería...";
  const vibes = normalizeVibes(data.vibes);
  const imageUrl = resolveArtworkImage(data.image, getAsset);
  const hasImage = Boolean(imageUrl && imageUrl.trim());

  // Commercial action links
  const whatsappMsg = encodeURIComponent(
    `Hola! Estuve recorriendo la Galería Rondot 3D y me gustaría consultar por la obra "${title}" (Ref: ${catalogCode}, ${dimensions}).`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMsg}`;
  const mailtoUrl = `mailto:contacto@galeriarondot.art?subject=${encodeURIComponent(
    `Consulta de Obra: ${title} (${catalogCode})`
  )}&body=${whatsappMsg}`;

  // Interactive handlers
  const handleScrollToSheet = (e) => {
    e.preventDefault();
    const sheet = document.getElementById("editorial-sheet");
    if (sheet) sheet.scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyRef = (e) => {
    e.preventDefault();
    const btn = e.currentTarget;
    const refText = `${title} (${catalogCode}) — ${dimensions}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refText);
    }
    const originalText = btn.innerHTML;
    btn.innerText = "¡Copiado!";
    setTimeout(() => {
      btn.innerHTML = originalText;
    }, 1800);
  };

  return html`
    <div class="editorial-preview-root">
      <!-- Curator Info Bar -->
      <header class="preview-banner">
        <div class="preview-banner-badge">
          <span class="preview-banner-dot"></span>
          <span>MODO EDITORIAL · VISTA PREVIA EN VIVO</span>
        </div>
        <span class="preview-banner-hint">Haz clic en cualquier texto para saltar al campo</span>
      </header>

      <!-- Stage 1: Hero Exhibition Wall (Framed Presentation in 3D Gallery) -->
      <section class="hero-stage">
        <div class="hero-frame-container" data-key-path="image" title="Haga clic para editar la imagen de la obra">
          <div class="hero-frame">
            ${hasImage
              ? html`<img
                  src="${imageUrl}"
                  alt="${title}"
                  class="hero-artwork-img"
                  loading="eager"
                />`
              : html`<div class="hero-artwork-placeholder">
                  <div dangerouslySetInnerHTML=${{ __html: ICONS.imagePlaceholder }}></div>
                  <span>Seleccione o suba la fotografía de la obra en el panel izquierdo</span>
                </div>`}
          </div>
        </div>

        <button
          type="button"
          class="scroll-prompt"
          onClick=${handleScrollToSheet}
          title="Deslizar hacia abajo para ver la ficha editorial"
        >
          <div class="scroll-prompt-meta">
            <span data-key-path="catalogCode">#${catalogCode}</span>
            <span>·</span>
            <span data-key-path="dimensions">${dimensions}</span>
          </div>
          <div class="scroll-prompt-title" data-key-path="title">${title}</div>
          <div class="scroll-prompt-action">
            <span>Deslizar hacia abajo para ficha técnica y disponibilidad</span>
            <span dangerouslySetInnerHTML=${{ __html: ICONS.arrowDown }}></span>
          </div>
        </button>
      </section>

      <!-- Stage 2: Editorial Scroll Sheet (Kugiri Layout) -->
      <article id="editorial-sheet" class="editorial-sheet">
        <div class="editorial-container">
          <!-- Masthead -->
          <header class="masthead">
            <div class="meta-row">
              <span class="catalog-chip" data-key-path="catalogCode" title="Editar Código de Catálogo">
                CATÁLOGO #${catalogCode}
              </span>

              <span class="status-badge" data-key-path="status" title="Editar Estado Comercial">
                <span class="status-dot ${statusInfo.dotClass}"></span>
                <span>${statusInfo.label}</span>
              </span>
            </div>

            <h1 class="title" data-key-path="title" title="Editar Título de la Obra">
              ${title}
            </h1>

            <p class="artist-line">
              Por <strong data-key-path="artist">${artist}</strong> — <span data-key-path="year">${year}</span>
            </p>
          </header>

          <!-- Content Grid: Curatorial Story + Specifications -->
          <div class="content-grid">
            <!-- Left Column: Curatorial Story & Image Showcase -->
            <div class="story-column">
              <h2 class="section-label">Nota Curatorial</h2>

              <p class="story-lede" data-key-path="story" title="Editar Nota Curatorial">
                ${story}
              </p>

              <p class="curatorial-note">
                Cada pieza de la colección Galería Rondot se entrega con certificado de autenticidad firmado por el
                autor y registro en el archivo permanente de la galería. El montaje y enmarcado de conservación pueden
                coordinarse de acuerdo con el espacio de destino.
              </p>

              <div class="artwork-preview-card" data-key-path="image" title="Editar Imagen">
                ${hasImage
                  ? html`<img
                      src="${imageUrl}"
                      alt="${title}"
                      class="artwork-preview-img"
                      loading="lazy"
                    />`
                  : html`<div class="hero-artwork-placeholder">
                      <div dangerouslySetInnerHTML=${{ __html: ICONS.imagePlaceholder }}></div>
                      <span>Sin fotografía seleccionada</span>
                    </div>`}
              </div>
            </div>

            <!-- Right Column: Specs & Acquisition Actions -->
            <aside class="specs-column">
              <div class="specs-card">
                <h2 class="section-label">Especificaciones de la Obra</h2>

                <dl class="spec-list">
                  <div class="spec-item" data-key-path="dimensions" title="Editar Dimensiones">
                    <dt class="spec-term">Dimensiones</dt>
                    <dd class="spec-desc-mono">${dimensions}</dd>
                  </div>

                  <div class="spec-item" data-key-path="technique" title="Editar Técnica y Soporte">
                    <dt class="spec-term">Técnica y Soporte</dt>
                    <dd class="spec-desc">${technique}</dd>
                  </div>

                  <div class="spec-item" data-key-path="year" title="Editar Año">
                    <dt class="spec-term">Año de Realización</dt>
                    <dd class="spec-desc-mono">${year}</dd>
                  </div>

                  <div class="spec-item" data-key-path="price" title="Editar Disponibilidad y Precio">
                    <dt class="spec-term">Disponibilidad y Valor</dt>
                    <dd class="spec-desc-mono">${statusInfo.label} · ${price}</dd>
                  </div>

                  <div class="spec-item" data-key-path="vibes" title="Editar Atmósferas / Vibes">
                    <dt class="spec-term">Atmósfera / Vibes</dt>
                    <dd class="vibes-list">
                      ${vibes.map(
                        (vibe) => html`<span class="vibe-pill">#${vibe}</span>`
                      )}
                    </dd>
                  </div>
                </dl>

                <!-- Commercial Call to Action -->
                <div class="cta-group">
                  <a
                    href="${whatsappUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-primary"
                    title="Simular consulta vía WhatsApp"
                  >
                    <span dangerouslySetInnerHTML=${{ __html: ICONS.whatsapp }}></span>
                    <span>${statusInfo.ctaLabel}</span>
                  </a>

                  <div class="secondary-actions">
                    <a
                      href="${mailtoUrl}"
                      class="btn-secondary"
                      title="Simular consulta por correo"
                    >
                      <span dangerouslySetInnerHTML=${{ __html: ICONS.mail }}></span>
                      <span>Consultar por Correo</span>
                    </a>

                    <button
                      type="button"
                      class="btn-secondary"
                      onClick=${handleCopyRef}
                      title="Copiar referencia de la obra"
                    >
                      <span dangerouslySetInnerHTML=${{ __html: ICONS.copy }}></span>
                      <span>Ref</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <!-- Bottom Return Section -->
          <div class="bottom-return-section">
            <button
              type="button"
              class="btn-return-3d"
              onClick=${handleScrollToTop}
              title="Volver a la parte superior"
            >
              <span dangerouslySetInnerHTML=${{ __html: ICONS.arrowUp }}></span>
              <span>Volver a la Galería en 3D</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  `;
}

// Register preview style and template once Sveltia CMS is loaded
function initEditorialPreview() {
  const CMS = window.CMS;
  const html = window.html;

  if (!CMS || !html) {
    setTimeout(initEditorialPreview, 50);
    return;
  }

  // Register custom stylesheet for the preview iframe
  CMS.registerPreviewStyle("./preview.css");

  // Register the editorial preview component for the 'artworks' collection
  CMS.registerPreviewTemplate("artworks", ArtworkEditorialPreview);
  console.info("Galería Rondot: Preview modo editorial registrado en Sveltia CMS");
}

initEditorialPreview();
