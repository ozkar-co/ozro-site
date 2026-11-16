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
./run.sh        # compila dist/ y arranca web + API en http://localhost:3001
```

`run.sh` instala dependencias si faltan, compila siempre el frontend y arranca el proceso.

## Desarrollo de la UI

Con el proceso principal corriendo (`./run.sh`), se puede usar Vite con proxy a la API:

```bash
npm run dev     # http://localhost:5173
```

El proxy de `/api` y `/assets` está configurado en `vite.config.ts`.

## Actualizar el despliegue

```bash
git pull
# reiniciar el proceso; run.sh compila el frontend al arrancar
```

## Backups

La tarea de backup corre dentro del mismo proceso (diario 3 AM, completo domingos 4 AM). **Todos los backups incluyen todas las tablas de la base de datos**, sin listas manuales; los archivos se guardan en `backups/`.

Cada backup incluye la **estructura** (`CREATE TABLE`) y los datos de todas las tablas, por lo que es autocontenido:

```
backups/AAAAMMDD_HHMMSS_full/
├── full_backup.sql   # Restauración completa (estructura + datos)
├── schema/           # CREATE TABLE por tabla
├── sql/              # Estructura + datos por tabla
├── json/             # Datos en JSON
└── metadata.json
```

Restaurar un backup completo sin depender de otra base de datos:

```bash
mysql -u USER -p < backups/AAAAMMDD_HHMMSS_full/full_backup.sql
```

`full_backup.sql` crea la base de datos si no existe y usa el nombre de `MARIADB_DATABASE`.

## Estructura

```
server/    API Express, servicios MariaDB y tareas
src/       frontend React
assets/    atlases WebP, manifest y assets del juego
public/    estáticos del sitio
dist/      build del frontend (gitignored)
```

## Spawns y mapas

La tabla `mob_spawn`, los JSON de `/assets/spawns` y las vistas de `/assets/maps` se generan desde rAthena:

```bash
cd ../rathena
python3 tools/mob_spawns.py --out /tmp/ozro-spawns
mysql -u USER -p rathena < /tmp/ozro-spawns/mob_spawn.sql

cd ../ozro-site
rm -rf assets/spawns && mkdir -p assets/spawns
cp -r /tmp/ozro-spawns/web/spawns/* assets/spawns/
python3 tools/build_map_images.py --rathena ../rathena --maps assets/spawns/maps.json --out assets/maps
```

`tools/build_map_images.py` renderiza las vistas desde `db/map_cache.dat`; no necesita los GRF del cliente.

Documentación de endpoints: [doc/endpoints.md](doc/endpoints.md).

---

Desarrollado por [OzCodeX](https://github.com/ozkar-co)
