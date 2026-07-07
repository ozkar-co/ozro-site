# OzRo — Sitio web

Sitio web del servidor privado OzRo. Los datos de juego (objetos, monstruos, rankings, estado) vienen de la API en `ozro-backup`. El hosting estático usa Firebase.

## Inicio rápido

```bash
git clone https://github.com/ozcodx/ozro-site.git
cd ozro-site
npm install
cp .env.example .env
npm run dev
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | Base URL de la API (producción: `https://ozro-api.ozkr.net`) |

## Desarrollo

```bash
npm run dev      # http://localhost:5173
npm run build    # compila a dist/
npm run preview  # previsualiza el build
```

## Despliegue

Requiere [Firebase CLI](https://firebase.google.com/docs/cli) autenticado con el proyecto `oz-ragnarok`:

```bash
npm run deploy
```

## Datos estáticos (`public/data/`)

Solo se usan **imágenes** empaquetadas en JSON (iconos, ilustraciones, sprites de monstruos):

- `images_descriptor.json` — mapa item id → batch de icono/ilustración
- `mob-images-descriptor.json` — mapa mob id → batch de sprite
- `icons_batch_*.json`, `illustrations_batch_*.json`, `mob_sprites_batch_*.json`

La base de datos de items/mobs y la búsqueda se resuelven contra la API (`/items`, `/mobs`).

---

Desarrollado por [OzCodeX](https://github.com/ozkar-co)
