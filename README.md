# OzRo — Sitio web

Sitio y API del servidor privado OzRo en un **único proceso** Express. El frontend (React + Vite) se compila a `dist/` y el servidor lo sirve junto con `/api/*` y `/assets/*`.

- Producción: `https://ro.ozkr.net`
- API: `https://ro.ozkr.net/api/*`
- Assets del juego: `https://ro.ozkr.net/assets/*`

## Requisitos

- Node.js 18+
- MariaDB

## Configuración

```bash
cp .env.example .env
```

Edita `.env` con las credenciales de MariaDB y el puerto (`API_PORT`, por defecto 3001).

## Ejecutar

```bash
npm install
npm run build   # compila a dist/
./run.sh        # web + API en http://localhost:3001
```

`run.sh` instala dependencias si faltan, compila si no existe `dist/` y arranca el proceso.

## Desarrollo de la UI

Con el proceso principal corriendo (`./run.sh`), se puede usar Vite con proxy a la API:

```bash
npm run dev     # http://localhost:5173
```

El proxy de `/api` y `/assets` está configurado en `vite.config.ts`.

## Actualizar el despliegue

```bash
git pull
npm run build
# reiniciar el proceso
```

## Backups

La tarea de backup corre dentro del mismo proceso (diario 3 AM, completo domingos 4 AM). Las tablas se configuran en `backup.conf` y los archivos se guardan en `backups/`.

## Estructura

```
server/    API Express, servicios MariaDB y tareas
src/       frontend React
assets/    atlases WebP, manifest y assets del juego
public/    estáticos del sitio
dist/      build del frontend (gitignored)
```

Documentación de endpoints: [doc/endpoints.md](doc/endpoints.md).

---

Desarrollado por [OzCodeX](https://github.com/ozkar-co)
