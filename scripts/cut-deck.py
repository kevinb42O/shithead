"""Cut all 54 faces. Run from any directory: python3 scripts/cut-deck.py.

Requires Pillow; preserves the source sheet and records exact crop coordinates.
"""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
destination = root / "dist/assets/funny-deck"
destination.mkdir(parents=True, exist_ok=True)
sheet = Image.open(root / "dist/assets/funny-deck-sheet.png").convert("RGB")
cards = [(suit, rank) for suit in ("spades", "hearts", "clubs", "diamonds")
         for rank in range(2, 15)] + [("joker-black", 15), ("joker-red", 15)]
manifest = []
for i, (suit, rank) in enumerate(cards):
    col, row = i % 9, i // 9
    box = (round(col * sheet.width / 9), round(row * sheet.height / 6),
           round((col + 1) * sheet.width / 9), round((row + 1) * sheet.height / 6))
    name = f"{suit}-{rank}.png" if rank != 15 else f"{suit}.png"
    face = sheet.crop(box)
    face.save(destination / name, optimize=True)
    manifest.append({"suit": suit, "rank": rank, "file": name, "crop": box,
                     "width": face.width, "height": face.height})
(destination / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Cut {len(manifest)} cards from {sheet.width} × {sheet.height} into {destination}")
