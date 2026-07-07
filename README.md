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

## Datos estáticos (assets desde API)

Iconos, ilustraciones y sprites de monstruos se sirven como **atlases WebP** desde `ozro-backup` (`/assets/*`), generados con la herramienta GRF en `ozro-cli/tools/grf`:

```bash
cd ozro-cli && npm run assets
```

Variables: `VITE_ASSETS_URL` (default: `VITE_API_URL/assets`).

La base de datos de items/mobs y la búsqueda se resuelven contra la API (`/items`, `/mobs`).

---

Desarrollado por [OzCodeX](https://github.com/ozkar-co)
