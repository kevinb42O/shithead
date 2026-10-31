#!/usr/bin/env python3
"""Generate favicons and PWA icons from the Shithead mascot image."""

import os
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
SOURCE_IMAGE = os.path.join(PROJECT_ROOT, "dist", "assets", "shithead-mascot.png")
ASSETS_DIR = os.path.join(PROJECT_ROOT, "dist", "assets")
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")

THEME_COLOR = (23, 62, 50, 255)  # #173e32

def make_icon(src_img, size, padding_ratio=0.04, bg_color=None):
    bbox = src_img.getbbox()
    cropped = src_img.crop(bbox)
    bw, bh = cropped.size

    canvas = Image.new("RGBA", (size, size), bg_color if bg_color else (0, 0, 0, 0))
    target_content_size = int(size * (1.0 - 2 * padding_ratio))
    scale = target_content_size / max(bw, bh)
    new_w, new_h = max(1, int(round(bw * scale))), max(1, int(round(bh * scale)))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas

def main():
    if not os.path.exists(SOURCE_IMAGE):
        raise FileNotFoundError(f"Source mascot not found at {SOURCE_IMAGE}")

    src = Image.open(SOURCE_IMAGE).convert("RGBA")

    # 1. Favicon PNGs
    fav16 = make_icon(src, 16, padding_ratio=0.0)
    fav32 = make_icon(src, 32, padding_ratio=0.03)
    fav48 = make_icon(src, 48, padding_ratio=0.03)

    fav16.save(os.path.join(ASSETS_DIR, "favicon-16x16.png"), format="PNG")
    fav32.save(os.path.join(ASSETS_DIR, "favicon-32x32.png"), format="PNG")
    print("Saved favicon-16x16.png and favicon-32x32.png")

    # 2. Multi-resolution ICO (16, 32, 48)
    ico_imgs = [fav16, fav32, fav48]
    ico_dist_path = os.path.join(DIST_DIR, "favicon.ico")
    ico_assets_path = os.path.join(ASSETS_DIR, "favicon.ico")
    fav32.save(ico_dist_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav16, fav48])
    fav32.save(ico_assets_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav16, fav48])
    print("Saved favicon.ico to dist/ and dist/assets/")

    # 3. Apple Touch Icon (180x180, themed background)
    apple_touch = make_icon(src, 180, padding_ratio=0.10, bg_color=THEME_COLOR)
    apple_touch.save(os.path.join(ASSETS_DIR, "apple-touch-icon.png"), format="PNG")
    print("Saved apple-touch-icon.png")

    # 4. Standard PWA icons (transparent background, any purpose)
    icon192 = make_icon(src, 192, padding_ratio=0.05)
    icon512 = make_icon(src, 512, padding_ratio=0.05)
    icon192.save(os.path.join(ASSETS_DIR, "icon-192.png"), format="PNG")
    icon512.save(os.path.join(ASSETS_DIR, "icon-512.png"), format="PNG")
    print("Saved icon-192.png and icon-512.png")

    # 5. Maskable PWA icons (padded safe zone with theme background)
    maskable192 = make_icon(src, 192, padding_ratio=0.15, bg_color=THEME_COLOR)
    maskable512 = make_icon(src, 512, padding_ratio=0.15, bg_color=THEME_COLOR)
    maskable192.save(os.path.join(ASSETS_DIR, "icon-maskable-192.png"), format="PNG")
    maskable512.save(os.path.join(ASSETS_DIR, "icon-maskable-512.png"), format="PNG")
    print("Saved icon-maskable-192.png and icon-maskable-512.png")

if __name__ == "__main__":
    main()
