#!/bin/bash
# Renders scripts/hero/render.html to public/images/home-holder.png at 2x with
# a transparent background. Needs Google Chrome and network access (three.js
# loads from cdnjs). Run from the repo root after changing the render.
set -euo pipefail
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="$(pwd)/public/images/home-holder.png"
PROFILE="$(mktemp -d)"
rm -f "$OUT"
"$CH" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader \
  --hide-scrollbars --window-size=1040,780 --force-device-scale-factor=2 \
  --default-background-color=00000000 --user-data-dir="$PROFILE" \
  --screenshot="$OUT" "file://$(pwd)/scripts/hero/render.html" >/dev/null 2>&1 &
pid=$!
for i in $(seq 1 40); do sleep 1; [ -s "$OUT" ] && break; done
sleep 2; kill $pid 2>/dev/null || true; sleep 2
rm -rf "$PROFILE" 2>/dev/null || true
[ -s "$OUT" ] && echo "wrote $OUT" || { echo "render failed" >&2; exit 1; }
