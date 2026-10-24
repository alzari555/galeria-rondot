import fs from "node:fs";
import path from "node:path";

const manifestPath = "C:\\Users\\migue\\.gemini\\antigravity\\brain\\41d80aaf-649e-465e-91f9-7f87d0d184ec\\scratch\\infinite-canvas\\src\\artworks\\manifest.json";
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const copiedFiles = fs.readdirSync("./public/artworks").filter((f) => f.endsWith(".jpg"));

const curatedMetadata = [
  {
    title: "Silencio en el Valle de Cobre",
    artist: "Miguel Rondot",
    year: "2025",
    technique: "Óleo y pigmentos minerales sobre lino belga",
    dimensions: "140 × 110 cm",
    status: "disponible",
    price: "USD 2,400",
    vibes: ["Calma", "Naturaleza", "Dorados", "Melancolía"],
    tags: ["paisaje", "valle", "cobre", "luz", "atardecer", "oleo", "calma"],
    story: "Una meditación sobre la quietud crepuscular cuando los últimos rayos oblicuos del sol transforman la bruma de la montaña en una lámina de oro envejecido. La superposición de veladuras al óleo permite que la luz parezca emanar desde el interior mismo de la trama del lino."
  },
  {
    title: "Vigilia Nocturna I",
    artist: "Miguel Rondot",
    year: "2025",
    technique: "Óleo sobre lienzo de algodón de alto gramaje",
    dimensions: "160 × 95 cm",
    status: "disponible",
    price: "USD 3,100",
    vibes: ["Nocturno", "Intenso", "Introspección", "Sombra"],
    tags: ["nocturno", "figura", "claroscuro", "sombra", "vigilia", "intenso"],
    story: "Inspirada en la tradición tenebrista pero ejecutada con una sensibilidad contemporánea, esta pieza explora el umbral entre la vigilia y el sueño. El contraste dramático invita al espectador a detenerse y habitar el silencio de la escena."
  },
  {
    title: "Estudio para una Geometría del Viento",
    artist: "Miguel Rondot",
    year: "2024",
    technique: "Técnica mixta, acrílico y grafito sobre madera",
    dimensions: "120 × 90 cm",
    status: "reservado",
    price: "USD 1,850",
    vibes: ["Movimiento", "Calma", "Efémero", "Aire"],
    tags: ["viento", "geometria", "abstracto", "cielo", "nubes", "movimiento"],
    story: "Las corrientes invisibles del aire dejan su rastro sobre las formas orgánicas. Esta obra captura el instante exacto en que la tensión atmosférica cede paso a la serenidad después de la tormenta."
  },
  {
    title: "El Molino de Agua y la Niebla",
    artist: "Miguel Rondot",
    year: "2024",
    technique: "Óleo con espátula sobre lienzo",
    dimensions: "130 × 95 cm",
    status: "disponible",
    price: "USD 2,600",
    vibes: ["Naturaleza", "Nostalgia", "Agua", "Tierra"],
    tags: ["agua", "molino", "bosque", "rio", "naturaleza", "rojo", "otoño"],
    story: "El sonido constante del agua corriendo bajo la estructura de madera se traduce aquí en pinceladas densas y matéricas. Los tonos rojizos de la cubierta dialogan con los verdes profundos del musgo húmedo."
  },
  {
    title: "Arquitectura de la Memoria",
    artist: "Miguel Rondot",
    year: "2023",
    technique: "Óleo y encáustica fría sobre tela",
    dimensions: "150 × 120 cm",
    status: "coleccion_privada",
    price: "Colección Privada (Buenos Aires)",
    vibes: ["Clásico", "Dorados", "Tiempo", "Melancolía"],
    tags: ["arquitectura", "ruinas", "memoria", "tiempo", "clasico", "historia"],
    story: "Los vestigios arquitectónicos funcionan como metáfora de la memoria humana: aquello que permanece en pie frente a la erosión del tiempo adquiere una dignidad irrepetible."
  },
  {
    title: "Retrato del Eco",
    artist: "Miguel Rondot",
    year: "2025",
    technique: "Óleo sobre tabla preparada al gesso",
    dimensions: "80 × 65 cm",
    status: "disponible",
    price: "USD 1,500",
    vibes: ["Introspección", "Retrato", "Sombra", "Íntimo"],
    tags: ["retrato", "mirada", "rostro", "intimo", "sombra", "luz"],
    story: "Un estudio íntimo de la mirada humana donde la mitad del rostro emerge de la penumbra mientras la otra se funde con el fondo, sugiriendo que toda identidad guarda una zona de misterio inaccesible."
  },
  {
    title: "Horizonte Atlántico en Invierno",
    artist: "Miguel Rondot",
    year: "2025",
    technique: "Óleo sobre lino crudo",
    dimensions: "180 × 110 cm",
    status: "disponible",
    price: "USD 3,400",
    vibes: ["Mar", "Calma", "Inmensidad", "Frío"],
    tags: ["mar", "oceano", "horizonte", "invierno", "azul", "gris", "olas"],
    story: "La línea del horizonte divide dos inmensidades de plomo y plata. Concebida durante los meses de invierno frente a la costa, la obra busca transmitir la fuerza hipnótica de la marea alta."
  },
  {
    title: "Naturaleza Muerta con Higos y Cristal",
    artist: "Miguel Rondot",
    year: "2024",
    technique: "Óleo a la prima sobre lienzo",
    dimensions: "90 × 70 cm",
    status: "disponible",
    price: "USD 1,650",
    vibes: ["Íntimo", "Dorados", "Clásico", "Textura"],
    tags: ["bodegon", "naturaleza muerta", "frutas", "cristal", "mesa", "luz"],
    story: "Los objetos cotidianos dispuestos sobre una mesa de madera cobran una presencia casi sagrada cuando la luz lateral atraviesa el cristal tallado y acaricia la piel de los frutos."
  },
  {
    title: "Fragmento de un Jardín Secreto",
    artist: "Miguel Rondot",
    year: "2025",
    technique: "Óleo y temple sobre tela",
    dimensions: "110 × 110 cm",
    status: "reservado",
    price: "USD 2,100",
    vibes: ["Naturaleza", "Esperanza", "Floral", "Calma"],
    tags: ["jardin", "flores", "botanica", "verde", "secreto", "primavera"],
    story: "Una inmersión en el follaje silvestre donde la escala invita a perderse entre tallos, hojas y destellos florales que parecen respirar al ritmo de la brisa."
  },
  {
    title: "Crónica de la Luz Oblicua",
    artist: "Miguel Rondot",
    year: "2023",
    technique: "Óleo sobre lienzo",
    dimensions: "145 × 105 cm",
    status: "coleccion_privada",
    price: "Colección Privada (Madrid)",
    vibes: ["Dorados", "Melancolía", "Tarde", "Clásico"],
    tags: ["luz", "tarde", "sol", "dorado", "interior", "ventana"],
    story: "El instante efímero de las cinco de la tarde en que un rayo de sol proyecta geometrías cálidas sobre los muros encalados de una habitación silenciosa."
  },
  {
    title: "Preludio de Tormenta en la Pampa",
    artist: "Miguel Rondot",
    year: "2025",
    technique: "Óleo sobre lino",
    dimensions: "200 × 120 cm",
    status: "disponible",
    price: "USD 3,900",
    vibes: ["Intenso", "Naturaleza", "Inmensidad", "Tierra"],
    tags: ["pampa", "tormenta", "cielo", "llanura", "campo", "nubes", "dramatico"],
    story: "En la llanura infinita el cielo ocupa cuatro quintas partes del universo visual. Esta obra de gran formato registra el momento sobrecogedor en que el frente de tormenta avanza sobre el pastizal."
  },
  {
    title: "variaciones sobre el Azul de Prusia",
    artist: "Miguel Rondot",
    year: "2024",
    technique: "Óleo y pigmento puro sobre tela",
    dimensions: "100 × 100 cm",
    status: "disponible",
    price: "USD 1,950",
    vibes: ["Nocturno", "Calma", "Introspección", "Frío"],
    tags: ["azul", "prusia", "monocromo", "noche", "profundidad", "abstracto"],
    story: "Un viaje cromático hacia las profundidades del pigmento Azul de Prusia, donde las variaciones de saturación e impasto generan una topografía cambiante según el ángulo del observador."
  }
];

const catalog = copiedFiles.map((filename, idx) => {
  const url = `artworks/${filename}`;
  const found = manifest.find((m) => m.url === url);
  const meta = curatedMetadata[idx % curatedMetadata.length];
  const suffix = idx >= curatedMetadata.length ? ` (Serie II · N° ${idx - curatedMetadata.length + 1})` : "";

  return {
    id: `obra-${String(idx + 1).padStart(2, "0")}`,
    catalogCode: `RON-${String(101 + idx)}`,
    url: `./artworks/${filename}`,
    title: `${meta.title}${suffix}`,
    artist: meta.artist,
    year: meta.year,
    technique: meta.technique,
    dimensions: meta.dimensions,
    status: idx % 5 === 4 ? "coleccion_privada" : idx % 4 === 2 ? "reservado" : "disponible",
    price: meta.price,
    vibes: meta.vibes,
    tags: meta.tags,
    story: meta.story,
    width: found?.width || 512,
    height: found?.height || 512,
  };
});

fs.writeFileSync("./src/data/artworks.json", JSON.stringify({ items: catalog }, null, 2), "utf8");
console.log(`Generated ${catalog.length} artworks in src/data/artworks.json`);
