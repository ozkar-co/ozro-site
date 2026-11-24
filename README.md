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

### Master World Dataset (`ozro_*`)

`/database`, mobs/items/drops/spawns/farming y el radar MVP leen **solo tablas `ozro_*`** (Master World Dataset de `ozro-data`). No se aplican rates al vuelo ni se consulta `mob_db_re` / `item_db_re_*` para el mundo.

1. En el mismo MySQL: `ozro-data` → `pipeline.py schema --reset` + `pipeline.py sync`
2. Arranca ozro-site (detecta `ozro_mobs`, `ozro_items`, … al boot)
3. Referencia de tablas/flags: `ozro-data/DATA.md`

Tablas live de rAthena (`login`, `char`, `mvplog`, …) siguen usándose para jugadores, rankings y estado MVP en tiempo real. Assets visuales (mapas webp, atlases) siguen en `assets/`.

Assets de sprites/mapas/farming se generan **solo desde ozro-cli** (`tools/build_web_atlases.py`, `build_map_images.py`, `build_farming_data.py`, `build_transport_map.mjs`, `build_card_book.py`) y se copian a `assets/`. Este repo no tiene generadores.

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
data/      itemInfo_EN.lua (descripciones del cliente)
public/    estáticos del sitio
dist/      build del frontend (gitignored)
```

## Descripciones de items

Las descripciones visibles del cliente salen de `data/itemInfo_EN.lua`. La web las lee sin cargar el archivo entero en cada búsqueda:

- Al arrancar, el servidor construye en memoria un índice `ID -> rango de bytes`.
- `GET /api/items/:id/description` lee solo el bloque de ese item y devuelve `identified` y `unidentified` como arrays de líneas.
- El frontend no pide descripciones durante la búsqueda: el botón **Ver descripción** de cada item las solicita bajo demanda y luego el navegador mantiene el resultado en caché.

Para actualizar las descripciones, reemplaza `data/itemInfo_EN.lua` y reinicia el sitio. El índice se reconstruye en cada arranque. Si el archivo no existe, el endpoint devuelve `503` con un hint y el resto de la web sigue funcionando.

## Spawns y mapas

La tabla `mob_spawn`, los JSON de `/assets/spawns` y las vistas de `/assets/maps` se generan desde rAthena:

```bash
cd ../rathena
python3 tools/mob_spawns.py --out /tmp/ozro-spawns
mysql -u USER -p rathena < /tmp/ozro-spawns/mob_spawn.sql

cd ../ozro-site
rm -rf assets/spawns && mkdir -p assets/spawns
cp -r /tmp/ozro-spawns/web/spawns/* assets/spawns/

cd ../ozro-cli
python3 tools/build_map_images.py --rathena ../rathena \
  --maps ../ozro-site/assets/maps/all-maps.json \
  --out ../ozro-site/assets/maps
```

`ozro-cli/tools/build_map_images.py` renderiza las vistas desde `db/map_cache.dat`.

## Farmeo y mapa del mundo

La calculadora de farmeo usa un índice en memoria que se construye al arrancar desde MariaDB. Los datos estáticos de apoyo se regeneran con:

```bash
cd ../ozro-cli
python3 tools/build_farming_data.py --rathena ../rathena
```

Eso escribe en ozro-site `assets/farming/levelPenalty.json` y `assets/world/access.json`.

Documentación de endpoints: [doc/endpoints.md](doc/endpoints.md).

---

Desarrollado por [OzCodeX](https://github.com/ozkar-co)
