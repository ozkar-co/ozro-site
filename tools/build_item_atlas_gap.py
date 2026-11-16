#!/usr/bin/env python3
"""Fill missing item atlas pages from the active client GRFs.

For every server item that has a client item/collection asset but is absent
from the current website atlas, this script extracts the BMP, packs new
atlas_override pages and appends them to assets/manifest.json.

It also writes assets/items/item-images.json with per-item client asset
coverage (icon, collection, sprite) for every itemInfo entry. The taxonomy
generator uses that file for the *_no_image categories.
"""
from __future__ import annotations

import argparse
import io
import json
import math
import re
import sys
from pathlib import Path

from PIL import Image

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
DEFAULT_CLIENT = Path('/mnt/games/OzRo')
DEFAULT_OZRO_CLI = ROOT / 'ozro-cli'
CLIENT_GRFS = ['gefenia.grf', 'renewal2021.grf', 'resources2021.grf', 'data.grf', 'rdata.grf']


def load_grfs(client_dir: Path, ozro_cli: Path):
    sys.path.insert(0, str(ozro_cli / 'tools'))
    from grf import Grf  # noqa: PLC0415

    result = []
    for name in CLIENT_GRFS:
        path = client_dir / name
        if path.exists():
            result.append(Grf(path))
    return result


def parse_iteminfo(path: Path) -> dict[int, dict[str, object]]:
    data = path.read_bytes()
    entries: dict[int, dict[str, object]] = {}
    for match in re.finditer(rb'\[(\d+)\]\s*=\s*\{(.*?)\n\t\}', data, re.S):
        item_id = int(match.group(1))
        body = match.group(2)
        res = re.search(rb'(?<!un)identifiedResourceName\s*=\s*"([^"]*)"', body)
        name = re.search(rb'identifiedDisplayName\s*=\s*"([^"]*)"', body)
        if not res:
            continue
        resource = None
        for encoding in ('cp949', 'euc-kr', 'latin1'):
            try:
                resource = res.group(1).decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        entries[item_id] = {
            'resource': resource or '',
            'unidentified': bool(
                name and name.group(1).decode('latin1').lower().startswith('unidentified')
            ),
        }
    return entries


def overlay_files(patch_dir: Path, kind: str) -> set[str]:
    return {path.name.lower() for path in patch_dir.glob(f'texture/*/{kind}/*.bmp')}


def overlay_sprites(patch_dir: Path) -> set[str]:
    return {path.name.lower() for path in patch_dir.rglob('sprite/**/*.spr')}


def load_atlas_ids(category: str) -> set[int]:
    folder = SITE / 'assets' / 'items' / category
    ids: set[int] = set()
    for path in folder.glob('*.json'):
        ids |= {int(key) for key in json.loads(path.read_text())}
    for path in (folder / 'custom').glob('*'):
        if path.suffix.lower() in {'.png', '.webp', '.jpg', '.jpeg'}:
            try:
                ids.add(int(path.stem))
            except ValueError:
                continue
    return ids


def read_grf(grfs, name: str) -> bytes | None:
    for grf in grfs:
        try:
            entry = grf.find(name)
            return grf.read(entry)
        except Exception:  # noqa: BLE001
            continue
    return None


def has_grf(grfs, name: str) -> bool:
    for grf in grfs:
        try:
            grf.find(name)
            return True
        except Exception:  # noqa: BLE001
            continue
    return False


def to_rgba(data: bytes, kind: str) -> Image.Image | None:
    image = Image.open(io.BytesIO(data))
    if kind == 'item':
        if image.size != (24, 24):
            return None
        image = image.convert('RGBA')
        pixels = image.load()
        for y in range(image.height):
            for x in range(image.width):
                r, g, b, _ = pixels[x, y]
                if r > 240 and g < 20 and b > 240:
                    pixels[x, y] = (r, g, b, 0)
        return image
    if image.size != (75, 100):
        return None
    return image.convert('RGBA')


def pack(category, items, cols, cw, ch, stride_x, stride_y, page_width, per_page, first_page, lossless):
    pages = []
    ids = sorted(items)
    for index, start in enumerate(range(0, len(ids), per_page)):
        chunk = ids[start:start + per_page]
        rows = math.ceil(len(chunk) / cols)
        page = Image.new('RGBA', (page_width, rows * stride_y - (stride_y - ch)), (0, 0, 0, 0))
        mapping = {}
        for position, item_id in enumerate(chunk):
            x = (position % cols) * stride_x
            y = (position // cols) * stride_y
            page.paste(items[item_id], (x, y))
            mapping[str(item_id)] = {'x': x, 'y': y, 'w': cw, 'h': ch, 'page': first_page + index}
        number = first_page + index
        image_name = f'items/{category}/atlas_override_{number}.webp'
        mapping_name = f'items/{category}/atlas_override_{number}.json'
        image_path = SITE / 'assets' / image_name
        mapping_path = SITE / 'assets' / mapping_name
        if lossless:
            page.save(image_path, 'WEBP', lossless=True, method=6)
        else:
            page.save(image_path, 'WEBP', quality=88, method=6)
        mapping_path.write_text(json.dumps(mapping, separators=(',', ':')))
        pages.append({
            'page': number,
            'image': image_name,
            'mapping': mapping_name,
            'count': len(chunk),
            'width': page.width,
            'height': page.height,
        })
        print(f'wrote {image_name} {page.size} ({len(chunk)} items)')
    return pages


def main() -> int:
    parser = argparse.ArgumentParser(description='Fill missing item atlas pages')
    parser.add_argument('--client-dir', type=Path, default=DEFAULT_CLIENT)
    parser.add_argument('--ozro-cli', type=Path, default=DEFAULT_OZRO_CLI)
    args = parser.parse_args()

    grfs = load_grfs(args.client_dir, args.ozro_cli)
    if not grfs:
        print(f'no GRFs found in {args.client_dir}', file=sys.stderr)
        return 1

    iteminfo_path = SITE / 'data' / 'itemInfo_EN.lua'
    taxonomy_path = SITE / 'assets' / 'items' / 'taxonomy.json'
    info = parse_iteminfo(iteminfo_path)
    server_ids = {int(key) for key in json.loads(taxonomy_path.read_text())['items']}
    icon_atlas = load_atlas_ids('icons')
    illustration_atlas = load_atlas_ids('illustrations')

    patch_dir = args.ozro_cli / 'patch' / 'data'
    overlay_icons = overlay_files(patch_dir, 'item')
    overlay_illustrations = overlay_files(patch_dir, 'collection')
    overlay_sprite_files = overlay_sprites(patch_dir)

    coverage = {}
    need_icons = {}
    need_illustrations = {}
    for item_id in sorted(info):
        base = str(info[item_id]['resource']).rsplit('/', 1)[-1].lower()
        icon = base + '.bmp' in overlay_icons or has_grf(
            grfs, f'data/texture/유저인터페이스/item/{base}.bmp'
        )
        collection = base + '.bmp' in overlay_illustrations or has_grf(
            grfs, f'data/texture/유저인터페이스/collection/{base}.bmp'
        )
        sprite = base + '.spr' in overlay_sprite_files or has_grf(
            grfs, f'data/sprite/아이템/{base}.spr'
        )
        coverage[str(item_id)] = {'icon': icon, 'collection': collection, 'sprite': sprite}

        if item_id not in server_ids:
            continue
        if item_id not in icon_atlas:
            data = read_grf(grfs, f'data/texture/유저인터페이스/item/{base}.bmp')
            image = to_rgba(data, 'item') if data else None
            if image:
                need_icons[item_id] = image
        if item_id not in illustration_atlas:
            data = read_grf(grfs, f'data/texture/유저인터페이스/collection/{base}.bmp')
            image = to_rgba(data, 'collection') if data else None
            if image:
                need_illustrations[item_id] = image

    image_index = SITE / 'assets' / 'items' / 'item-images.json'
    image_index.write_text(
        json.dumps(coverage, ensure_ascii=False, separators=(',', ':')) + '\n',
        encoding='utf-8',
    )
    print(f'wrote {image_index.relative_to(SITE)} ({len(coverage)} items)')

    manifest_path = SITE / 'assets' / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    icon_pages = pack(
        'icons', need_icons, 85, 24, 24, 24, 24, 2048, 7225,
        max(page['page'] for page in manifest['items']['icons']['pages']) + 1, True,
    )
    illustration_pages = pack(
        'illustrations', need_illustrations, 53, 75, 100, 76, 101, 4027, 2120,
        max(page['page'] for page in manifest['items']['illustrations']['pages']) + 1, False,
    )
    manifest['items']['icons']['pages'].extend(icon_pages)
    manifest['items']['illustrations']['pages'].extend(illustration_pages)
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'icons added: {len(need_icons)}; illustrations added: {len(need_illustrations)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
