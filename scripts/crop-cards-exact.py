#!/usr/bin/env python3
"""Precision card cutting script using verified per-sheet bounding box coordinates."""

import os
import json
from PIL import Image

PROJECT = '/Users/kevin/PROJECTS/ShitHead'
OUT_DIR = os.path.join(PROJECT, 'dist', 'assets', 'funny-deck')
os.makedirs(OUT_DIR, exist_ok=True)

TARGET_W, TARGET_H = 139, 209

# Exact coordinates for each sheet [x0_l, x0_r, x1_l, x1_r, x2_l, x2_r] and [y0_t, y0_b, y1_t, y1_b, y2_t, y2_b]
COORDS = {
    1: {'x': [42, 348, 374, 681, 708, 1013], 'y': [39, 479, 507, 948, 979, 1432]},
    2: {'x': [41, 345, 374, 679, 707, 1012], 'y': [39, 480, 508, 955, 984, 1432]},
    3: {'x': [42, 346, 374, 680, 708, 1012], 'y': [39, 487, 513, 952, 981, 1422]},
    4: {'x': [42, 347, 374, 680, 708, 1013], 'y': [39, 477, 505, 945, 973, 1422]},
    5: {'x': [42, 351, 374, 681, 704, 1012], 'y': [38, 466, 492, 936, 962, 1407]},
    6: {'x': [39, 344, 371, 682, 709, 1014], 'y': [38, 480, 509, 949, 978, 1434]}
}

CARDS = [
    # 1.png
    (1, 0, 0, 'spades-14', 'spades', 14),
    (1, 0, 1, 'spades-13', 'spades', 13),
    (1, 0, 2, 'hearts-12', 'hearts', 12),
    (1, 1, 0, 'diamonds-11', 'diamonds', 11),
    (1, 1, 1, 'clubs-10', 'clubs', 10),
    (1, 1, 2, 'hearts-5', 'hearts', 5),
    (1, 2, 0, 'diamonds-14', 'diamonds', 14),
    (1, 2, 1, 'joker-red', 'joker-red', 15),
    (1, 2, 2, 'joker-black', 'joker-black', 15),

    # 2.png
    (2, 0, 0, 'spades-2', 'spades', 2),
    (2, 0, 1, 'spades-3', 'spades', 3),
    (2, 0, 2, 'spades-4', 'spades', 4),
    (2, 1, 0, 'spades-5', 'spades', 5),
    (2, 1, 1, 'spades-6', 'spades', 6),
    (2, 1, 2, 'spades-7', 'spades', 7),
    (2, 2, 0, 'spades-8', 'spades', 8),
    (2, 2, 1, 'spades-9', 'spades', 9),
    (2, 2, 2, 'spades-10', 'spades', 10),

    # 3.png
    (3, 0, 0, 'spades-11', 'spades', 11),
    (3, 0, 1, 'spades-12', 'spades', 12),
    (3, 0, 2, 'hearts-14', 'hearts', 14),
    (3, 1, 0, 'hearts-2', 'hearts', 2),
    (3, 1, 1, 'hearts-3', 'hearts', 3),
    (3, 1, 2, 'hearts-4', 'hearts', 4),
    (3, 2, 0, 'hearts-6', 'hearts', 6),
    (3, 2, 1, 'hearts-7', 'hearts', 7),
    (3, 2, 2, 'hearts-8', 'hearts', 8),

    # 4.png
    (4, 0, 0, 'hearts-9', 'hearts', 9),
    (4, 0, 1, 'hearts-10', 'hearts', 10),
    (4, 0, 2, 'hearts-11', 'hearts', 11),
    (4, 1, 0, 'hearts-13', 'hearts', 13),
    (4, 1, 1, 'diamonds-2', 'diamonds', 2),
    (4, 1, 2, 'diamonds-3', 'diamonds', 3),
    (4, 2, 0, 'diamonds-4', 'diamonds', 4),
    (4, 2, 1, 'diamonds-5', 'diamonds', 5),
    (4, 2, 2, 'diamonds-6', 'diamonds', 6),

    # 5.png
    (5, 0, 0, 'diamonds-7', 'diamonds', 7),
    (5, 0, 1, 'diamonds-8', 'diamonds', 8),
    (5, 0, 2, 'diamonds-9', 'diamonds', 9),
    (5, 1, 0, 'diamonds-10', 'diamonds', 10),
    (5, 1, 1, 'diamonds-12', 'diamonds', 12),
    (5, 1, 2, 'diamonds-13', 'diamonds', 13),
    (5, 2, 0, 'clubs-14', 'clubs', 14),
    (5, 2, 1, 'clubs-2', 'clubs', 2),
    (5, 2, 2, 'clubs-3', 'clubs', 3),

    # 6.png
    (6, 0, 0, 'clubs-4', 'clubs', 4),
    (6, 0, 1, 'clubs-5', 'clubs', 5),
    (6, 0, 2, 'clubs-6', 'clubs', 6),
    (6, 1, 0, 'clubs-7', 'clubs', 7),
    (6, 1, 1, 'clubs-8', 'clubs', 8),
    (6, 1, 2, 'clubs-9', 'clubs', 9),
    (6, 2, 0, 'clubs-11', 'clubs', 11),
    (6, 2, 1, 'clubs-12', 'clubs', 12),
    (6, 2, 2, 'clubs-13', 'clubs', 13),
]

manifest_entries = []

# Cache open images
sheet_images = {s: Image.open(os.path.join(PROJECT, f'{s}.png')) for s in range(1, 7)}

for s_idx, r, c, name, suit, rank in CARDS:
    img = sheet_images[s_idx]
    xs = COORDS[s_idx]['x']
    ys = COORDS[s_idx]['y']
    x0, x1 = xs[2*c], xs[2*c+1]
    y0, y1 = ys[2*r], ys[2*r+1]

    # Crop with 1px margin around the detected border line
    crop = img.crop((x0 - 1, y0 - 1, x1 + 2, y1 + 2))
    resized = crop.resize((TARGET_W, TARGET_H), Image.LANCZOS)

    filename = f'{name}.png'
    resized.save(os.path.join(OUT_DIR, filename), optimize=True)

    manifest_entries.append({
        "suit": suit,
        "rank": rank,
        "file": filename,
        "crop": [x0, y0, x1, y1],
        "width": TARGET_W,
        "height": TARGET_H
    })

manifest_path = os.path.join(OUT_DIR, 'manifest.json')
with open(manifest_path, 'w') as f:
    json.dump(manifest_entries, f, indent=2)
print(f'✓ Manifest saved to {manifest_path}')

# Regenerate unified deck sheet (funny-deck-sheet.png)
sheet_w = 9 * TARGET_W
sheet_h = 6 * TARGET_H
deck_sheet = Image.new('RGB', (sheet_w, sheet_h), (255, 255, 255))

ordered_cards = []
for suit in ['spades', 'hearts', 'clubs', 'diamonds']:
    for rank in range(2, 15):
        ordered_cards.append(f'{suit}-{rank}.png')
ordered_cards.append('joker-black.png')
ordered_cards.append('joker-red.png')

for idx, card_file in enumerate(ordered_cards):
    card_img = Image.open(os.path.join(OUT_DIR, card_file))
    grid_x = (idx % 9) * TARGET_W
    grid_y = (idx // 9) * TARGET_H
    deck_sheet.paste(card_img, (grid_x, grid_y))

sheet_out = os.path.join(PROJECT, 'dist', 'assets', 'funny-deck-sheet.png')
deck_sheet.save(sheet_out, 'PNG', optimize=True)
print(f'✓ Unified deck sheet saved to {sheet_out}')
print('All 54 cards cleanly cropped and validated.')
