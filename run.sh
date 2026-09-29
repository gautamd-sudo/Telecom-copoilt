#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  printf 'Error: Docker is not installed or is not on PATH.\n' >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  printf 'Error: Compose file not found: %s\n' "$COMPOSE_FILE" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  printf '%s\n' \
    'Error: Docker is unavailable for the current user.' \
    'Start Docker and ensure your user can access the Docker socket, then run this script again.' >&2
  exit 1
fi

cd "$ROOT_DIR"
exec docker compose -f "$COMPOSE_FILE" up --build "$@"