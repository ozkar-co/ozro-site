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
data/      itemInfo_EN.lua (descripciones del cliente)
public/    estáticos del sitio
dist/      build del frontend (gitignored)
```

## Items custom (sin regenerar atlases)

La web lee los objetos directamente de MariaDB, así que los items custom no necesitan regenerar los atlases ni el `manifest.json`. Para publicar uno:

1. Insertar o actualizar el item directamente en SQL (la web detecta `item_db2_re` o `item_db2` sobre las tablas base):

```sql
INSERT INTO item_db2_re (id, name_aegis, name_english, type, weight)
VALUES (35005, 'MVP_Soul', 'Alma de MVP', 'Etc', 10)
ON DUPLICATE KEY UPDATE
  name_aegis = VALUES(name_aegis),
  name_english = VALUES(name_english),
  type = VALUES(type),
  weight = VALUES(weight);
```

2. Dejar las imágenes fuera del atlas, usando el ID del item como nombre:

```
assets/items/custom/icons/<id>.png
assets/items/custom/illustrations/<id>.png
```

Se aceptan `.png`, `.webp`, `.jpg` y `.jpeg`. El cargador busca primero en el atlas y, si el ID no está, prueba la carpeta custom antes de mostrar el placeholder. Los archivos se sirven al instante desde `/assets/items/custom/...`; no hace falta recompilar el frontend.

### Conversión única de iconos del cliente

Comando para ejecutar una vez en el servidor (requiere Pillow). Convierte los BMP custom de `ozro-cli` a PNG y deja el magenta transparente:

```bash
cd /ruta/a/ozro-site
CLIENT_PATCH=/ruta/a/ozro-cli/patch/data/texture python3 - <<'PY'
from pathlib import Path
from PIL import Image
import os

texture = Path(os.environ['CLIENT_PATCH'])
item_dir = next(texture.glob('*/item'))
collection_dir = item_dir.parent / 'collection'
out_icon = Path('assets/items/custom/icons')
out_illustration = Path('assets/items/custom/illustrations')
items = {
    35001: 'ozro_platinum_coin',
    35002: 'ozro_gold_coin',
    35003: 'ozro_silver_coin',
    35004: 'ozro_bronze_coin',
    35005: 'ozro_mvp_soul',
}
out_icon.mkdir(parents=True, exist_ok=True)
out_illustration.mkdir(parents=True, exist_ok=True)

for item_id, resource in items.items():
    for source_dir, out_dir in ((item_dir, out_icon), (collection_dir, out_illustration)):
        source = source_dir / f'{resource}.bmp'
        if not source.exists():
            continue
        image = Image.open(source).convert('RGBA')
        pixels = image.load()
        for y in range(image.height):
            for x in range(image.width):
                r, g, b, a = pixels[x, y]
                if r > 240 and g < 20 and b > 240:
                    pixels[x, y] = (r, g, b, 0)
        image.save(out_dir / f'{item_id}.png')
        print(f'{source.name} -> {out_dir}/{item_id}.png')
PY
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
python3 tools/build_map_images.py --rathena ../rathena --maps assets/maps/all-maps.json --out assets/maps
```

`tools/build_map_images.py` renderiza las vistas desde `db/map_cache.dat`; no necesita los GRF del cliente.

## Farmeo y mapa del mundo

La calculadora de farmeo usa un índice en memoria que se construye al arrancar desde MariaDB. Los datos estáticos de apoyo se regeneran con:

```bash
python3 tools/build_farming_data.py --rathena ../rathena
```

Eso escribe `assets/farming/levelPenalty.json` (desde `db/re/level_penalty.yml` + `db/import/level_penalty.yml`) y `assets/world/access.json` (distancias desde los hubs con Kafra usando `assets/world/routes.json`).

Documentación de endpoints: [doc/endpoints.md](doc/endpoints.md).

---

Desarrollado por [OzCodeX](https://github.com/ozkar-co)
