# Galería Rondot — Espacio Expositivo 3D Infinito

Un espacio tridimensional infinito, determinista y fluido para la exhibición y comercialización de obra artística, construido con **React 19**, **Three.js / React Three Fiber** y dirección tipográfica editorial inspirada en [Kugiri](https://edoardolunardi.github.io/kugiri/).

---

## Características Principales

- **Espacio 3D Infinito Determinista**: Basado en una grilla de voxeles (`chunks`) con generación pseudoaleatoria consistente. Visitar las mismas coordenadas $(X, Y, Z)$ siempre presenta las mismas obras en la misma disposición.
- **Transición 3D → Vista Editorial con Scroll**:
  - **Enfoque por Mirada (*Gaze Dwell*)**: Si centras una obra en pantalla con un nivel de zoom cercano durante ~1.6 segundos, un halo circular de carga anticipa la transición y centra la obra automáticamente.
  - **Enfoque por Clic o Tap Limpio**: Discrimina entre un gesto de arrastre (*drag*) y un clic/tap intencional ($\Delta < 6\text{px}$).
  - **Disolución a Blanco y Scroll Vertical**: Al enfocarse, el entorno 3D se difumina suavemente hacia un fondo papel blanco (`#fafafc`), habilitando el scroll vertical natural para leer la ficha técnica, estado de disponibilidad, nota curatorial y consultar por **WhatsApp** o **Correo**.
  - **Retorno Natural al 3D**: Haciendo scroll hacia arriba hasta el tope, presionando `Esc` o pulsando el botón accesible **"↑ Volver a la Galería en 3D"** al pie de la ficha.
- **Buscador Cinematográfico y Sistema de "Vibes" (`⌘K` o `/`)**:
  - Búsqueda instantánea por título, código de catálogo, técnica o *tags* invisibles.
  - Filtrado por **"Vibes"** (atmósferas como *Calma*, *Nocturno*, *Dorados*, *Naturaleza*, *Introspección*). Al elegir una obra, la cámara vuela suavemente por el espacio 3D hasta centrarla.
- **Controles Multi-Dispositivo**:
  - **Desktop**: Arrastre con inercia, **rueda del ratón**, **pellizco en trackpad** (*pinch-to-zoom*), paralaje de cursor (*drift*) y teclas `WASD` / `QE`.
  - **Móvil y Tablet**: Deslizamiento con 1 dedo para pan con inercia y pellizco con 2 dedos para zoom en profundidad.
- **Cero Mantenimiento con Sveltia CMS & GitHub Pages**:
  - Panel de administración estático en `/admin` (`public/admin/index.html` y `public/admin/config.yml`) que hace commits directamente al repositorio de GitHub sin necesidad de servidores ni bases de datos.

---

## Desarrollo Local

```bash
npm install
npm run dev
```

Para compilar la versión estática de producción:

```bash
npm run build
```

---

## Configuración de Sveltia CMS en GitHub Pages

1. Edita `public/admin/config.yml` y reemplaza `repo: miguelrondot/galeria-rondot` por el nombre exacto de tu repositorio en GitHub (`usuario/repositorio`).
2. Al desplegar en GitHub Pages, navega a `https://tu-dominio/admin/` e inicia sesión con tu cuenta de GitHub para agregar o editar obras visualmente.

---

## Backlog / Futuras Expansiones

- **Atmósfera Sonora & Latidos de Luz (Baja Prioridad)**: Módulo opcional desacoplado para conectar audio ambiental (vía API de YouTube o pista generativa) con pulsos de luz difuminados en la niebla de fondo del espacio 3D.
