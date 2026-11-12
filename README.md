# Portafolio — Vicente González

Portafolio personal de una página para un estudiante de Ingeniería Civil Informática de la Universidad San Sebastián, Concepción. Construido con HTML, CSS y JavaScript sin frameworks ni paso de compilación.

## Ver el sitio

Desde esta carpeta:

```bash
python3 -m http.server 4173
```

Luego abre `http://localhost:4173/`.

También puedes abrir `index.html` directamente, aunque un servidor local es recomendable para probar la descarga del CV y las fuentes.

## Archivos

| Archivo | Contenido |
| --- | --- |
| `index.html` | Estructura, textos, proyectos y enlaces |
| `styles.css` | Sistema visual, layout Bento, responsive, modal y estados |
| `app.js` | Navegación, contadores, gráficos de actividad, kanban y ficha de proyecto |
| `assets/CV-Vicente-Gonzalez.pdf` | CV descargable de una página |
| `assets/cv-source.html` | Fuente imprimible para regenerar el CV |
| `assets/favicon.svg` | Favicon |

## Personalización rápida

Los proyectos, métricas, reconocimientos y enlaces son **datos de ejemplo**; revísalos antes de publicar:

1. **Identidad y contacto** — el nombre y el correo ya están actualizados en `index.html` y en el CV.
2. **Redes** — los enlaces de GitHub apuntan por ahora a `github.com`; reemplázalos por el perfil y los repositorios reales cuando estén disponibles.
3. **CV** — reemplaza `assets/CV-Vicente-Gonzalez.pdf` y ajusta `assets/cv-source.html`. Para regenerarlo, abre ese HTML en Chrome e imprime a PDF (A4, sin márgenes adicionales, con gráficos de fondo activados).
4. **Proyectos** — las tarjetas están en `index.html`; las fichas del modal están en el objeto `projects` de `app.js` (la clave debe coincidir con `data-project`).
5. **Roadmap** — los objetivos iniciales están en `defaults` dentro de `app.js`. El progreso y los movimientos se guardan en `localStorage` con la clave `vicentegonzalez-roadmap-v1`.
6. **Actividad** — los totales y el gráfico de commits son datos deterministas generados en `app.js`. Para conectar datos reales, reemplaza `buildActivity()` por una llamada a la API o a un JSON propio.
7. **Colores y tipografía** — los tokens están al inicio de `styles.css` (`--red: #c80000`, `--mono`, `--sans`).

## Interacciones incluidas

- Navegación con sección activa, progreso de scroll y menú móvil.
- Animaciones de entrada, contadores y respeto por `prefers-reduced-motion`.
- Reloj de Concepción, Chile.
- Gráfico de commits de las últimas 20 semanas.
- Filtros del roadmap, botones de estado, drag & drop, reset y persistencia local.
- Ficha de proyecto con cierre por Escape, clic en el fondo o botón, trampa de foco y restauración del foco.
- Descarga del CV y accesos directos de contacto.

## Notas

- El diseño usa blanco y negro, acento rojo `#C80000`, bordes de 1 px, tarjetas cuadradas y botones pill. Los degradados presentes son tramas y patrones de puntos, no gradientes decorativos.
- Las fuentes Inter y JetBrains Mono se cargan desde Google Fonts; si no hay conexión, se usan las familias de respaldo del sistema.
- El proyecto no depende de npm ni de un bundler. No hay tests automatizados ni repositorio Git inicializado.
