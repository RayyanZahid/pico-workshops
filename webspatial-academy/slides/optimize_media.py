#!/usr/bin/env python3
"""optimize_media.py: slide-sized WebP copies of the deck's big images.

    python slides/optimize_media.py      # then: node slides/build.mjs

For every image the deck references (read from deck.json) that is over 400 KB, write
slides/media/<name>.webp at most 1600 px wide, quality 82. build.mjs serves the copy
when it exists and falls back to the original otherwise. The source captures in
assets/ and labs/ are never modified, and credits still come from the original path.
Re-run after new media lands; unchanged copies are skipped.
"""
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "media")
MAX_W, QUALITY, MIN_BYTES = 1600, 82, 400_000


def main() -> int:
    deck = json.load(open(os.path.join(HERE, "deck.json"), encoding="utf8"))
    srcs = {m["src"] for s in deck["slides"] for m in s.get("media", []) if m.get("type") == "image" and m.get("src")}
    srcs |= {m["poster"] for s in deck["slides"] for m in s.get("media", []) if m.get("poster")}
    os.makedirs(OUT, exist_ok=True)
    before = after = 0
    for rel in sorted(srcs):
        src = os.path.normpath(os.path.join(HERE, rel))
        if not os.path.exists(src) or os.path.getsize(src) < MIN_BYTES or not src.lower().endswith((".png", ".jpg", ".jpeg")):
            continue
        dst = os.path.join(OUT, os.path.splitext(os.path.basename(src))[0] + ".webp")
        before += os.path.getsize(src)
        if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
            im = Image.open(src)
            im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
            if im.width > MAX_W:
                im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
            im.save(dst, "WEBP", quality=QUALITY, method=6)
        after += os.path.getsize(dst)
    print(f"optimized: {before / 1048576:.1f} MB of originals -> {after / 1048576:.1f} MB of WebP in slides/media/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
