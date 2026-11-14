#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
    echo "Error: .env no encontrado en $ROOT" >&2
    echo "Copia .env.example y configura MariaDB + API_PORT." >&2
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo "Error: node no está instalado o no está en PATH." >&2
    exit 1
fi

if [[ ! -d node_modules ]]; then
    echo "Instalando dependencias..."
    npm install
fi

echo "Compilando el sitio..."
npm run build

PORT="$(grep -E '^API_PORT=' .env 2>/dev/null | cut -d= -f2- | tr -d '[:space:]"' || true)"
PORT="${PORT:-3001}"

echo "Iniciando ozro-site (web + API) en puerto ${PORT}..."
exec node server/index.js
