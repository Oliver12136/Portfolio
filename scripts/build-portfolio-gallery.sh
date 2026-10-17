#!/bin/sh
# Rebuild the local gallery derivatives from the portfolio PNG originals.
# Requires curl and libwebp's cwebp. Run from the repository root.
set -eu

output_dir="web/assets/portfolio-gallery"
temporary_dir="$(mktemp -d)"
trap 'rm -rf "$temporary_dir"' EXIT HUP INT TERM
mkdir -p "$output_dir"

for number in $(seq 1 22) 25 26; do
  original="$temporary_dir/$number.png"
  curl --fail --location --silent --show-error --retry 3 \
    "https://assets.oghuzhan.work/$number.png" -o "$original"
  cwebp -quiet -mt -q 90 -resize 2560 0 "$original" -o "$output_dir/$number-display.webp"
  cwebp -quiet -mt -q 92 -resize 4096 0 "$original" -o "$output_dir/$number-viewer.webp"
  cwebp -quiet -mt -q 92 -resize 8192 0 "$original" -o "$output_dir/$number-detail.webp"
done

for name in M1 M2 M3 M4 M5; do
  cwebp -quiet -mt -q 90 "web/assets/MCI/$name.png" -o "$output_dir/$name-display.webp"
done
