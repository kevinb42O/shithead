"""Measure sapphire centers from original artwork; never modify image pixels.

Read a JSON array of artwork paths from stdin and emit centers keyed by path.
Catalog generation uses this for every set, so generic layout defaults cannot
silently override calibrated gem positions when cards are added or rebuilt.
"""
import json
import sys
from pathlib import Path
from PIL import Image

base = Path(__file__).resolve().parents[2] / 'dist/assets/tavern-brawl'
centers = {}
for art in json.load(sys.stdin):
    with Image.open(base / art) as source:
        image = source.convert('RGBA')
    width, height = image.size
    pixels = image.load()
    candidates = set()
    for y in range(int(height * .015), int(height * .17)):
        for x in range(int(width * .015), int(width * .27)):
            r, g, b, alpha = pixels[x, y]
            if alpha > 128 and b > 95 and b > r * 1.35 and b > g * 1.08:
                candidates.add((x, y))
    largest = []
    while candidates:
        pending = [candidates.pop()]
        component = []
        while pending:
            x, y = pending.pop()
            component.append((x, y))
            for neighbor in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
                if neighbor in candidates:
                    candidates.remove(neighbor)
                    pending.append(neighbor)
        if len(component) > len(largest):
            largest = component
    if len(largest) < width * height * .001:
        raise ValueError(f'No reliable sapphire cost gem in {art}')
    xs, ys = zip(*largest)
    centers[art] = {
        'x': round((min(xs) + max(xs)) / (2 * width), 5),
        'y': round((min(ys) + max(ys)) / (2 * height), 5),
    }
json.dump(centers, sys.stdout)
