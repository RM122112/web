#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_TAG="denkspiele-web:1.0.0"
PLATFORM="linux/arm64"
PACKAGE_DIR="$ROOT_DIR/pi-paket"
ARCHIVE_NAME="denkspiele-web-1.0.0-linux-arm64.tar.gz"
ARCHIVE_PATH="$PACKAGE_DIR/$ARCHIVE_NAME"
COMPOSE_TEMPLATE="$ROOT_DIR/deploy/pi/docker-compose.yml"
HANDOVER_TEMPLATE="$ROOT_DIR/deploy/pi/UEBERGABE.md"

if ! command -v docker >/dev/null 2>&1; then
  echo "Fehler: Docker ist nicht installiert oder nicht im PATH."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Fehler: Docker-Daemon ist nicht erreichbar."
  exit 1
fi

if ! grep -q "image: $IMAGE_TAG" "$COMPOSE_TEMPLATE"; then
  echo "Fehler: deploy/pi/docker-compose.yml nutzt nicht das erwartete Image-Tag $IMAGE_TAG."
  exit 1
fi

rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

echo "Baue Image $IMAGE_TAG für $PLATFORM ..."
docker buildx build --platform "$PLATFORM" --load --tag "$IMAGE_TAG" "$ROOT_DIR"

echo "Exportiere Image-Archiv ..."
docker save "$IMAGE_TAG" | gzip -9 > "$ARCHIVE_PATH"

cp "$COMPOSE_TEMPLATE" "$PACKAGE_DIR/docker-compose.yml"

ARCHIVE_SIZE="$(du -h "$ARCHIVE_PATH" | awk '{print $1}')"
sed \
  -e "s|__ARCHIVE_NAME__|$ARCHIVE_NAME|g" \
  -e "s|__ARCHIVE_SIZE__|$ARCHIVE_SIZE|g" \
  "$HANDOVER_TEMPLATE" > "$PACKAGE_DIR/UEBERGABE.md"

echo "Paket fertig: $PACKAGE_DIR"
ls -lh "$PACKAGE_DIR"
