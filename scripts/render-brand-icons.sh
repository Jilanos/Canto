#!/usr/bin/env bash
# Rasterises the Canto emblem into the PNG sizes the PWA manifest needs.
#
# Run manually when public/brand/canto-emblem.svg changes, then commit the PNGs.
# They are committed rather than generated at build time so that neither the CI nor
# the production image needs an SVG rasteriser.
#
#   ./scripts/render-brand-icons.sh
#
# Requires Docker; the rasteriser runs in a throwaway Alpine container.
set -euo pipefail

cd "$(dirname "$0")/.."
BRAND_DIR="public/brand"
EMBLEM="$BRAND_DIR/canto-emblem.svg"
BACKGROUND="#0d1117"

[ -f "$EMBLEM" ] || { echo "missing $EMBLEM" >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Wraps the emblem on the app's own background at a given scale. Launcher icons are
# opaque because a transparent PNG is composited on whatever the platform chooses,
# and the gold rim of this emblem disappears on white.
wrap() {
  local scale="$1" out="$2"
  local size=1024
  local inner offset
  inner=$(awk -v s="$size" -v k="$scale" 'BEGIN { printf "%d", s * k }')
  offset=$(awk -v s="$size" -v i="$inner" 'BEGIN { printf "%d", (s - i) / 2 }')
  {
    printf '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 %d %d" width="%d" height="%d">\n' "$size" "$size" "$size" "$size"
    printf '  <rect width="%d" height="%d" fill="%s"/>\n' "$size" "$size" "$BACKGROUND"
    printf '  <image x="%d" y="%d" width="%d" height="%d" xlink:href="canto-emblem.svg"/>\n' "$offset" "$offset" "$inner" "$inner"
    printf '</svg>\n'
  } > "$out"
}

cp "$EMBLEM" "$WORK/canto-emblem.svg"
# 0.82 for launcher icons; 0.62 for the maskable one, which platforms crop to a
# circle covering roughly 80% of the square.
wrap 0.82 "$WORK/icon.svg"
wrap 0.62 "$WORK/maskable.svg"

render() {
  local src="$1" size="$2" out="$3"
  docker run --rm -v "$WORK:/work" -w /work alpine:3.20 sh -c \
    "apk add --no-cache rsvg-convert >/dev/null 2>&1 && rsvg-convert --width=$size --height=$size --format=png --output=/work/$out /work/$src"
}

render icon.svg 192 icon-192.png
render icon.svg 512 icon-512.png
render icon.svg 180 apple-touch-icon-180.png
render maskable.svg 512 maskable-512.png

for file in icon-192.png icon-512.png apple-touch-icon-180.png maskable-512.png; do
  cp "$WORK/$file" "$BRAND_DIR/$file"
  echo "brand: wrote $BRAND_DIR/$file ($(stat -c%s "$BRAND_DIR/$file") bytes)"
done
