"""Reproduce native-alpha crops and the small CC0 supporting flame flipbook."""
from pathlib import Path
from PIL import Image
import io
import json
import zipfile

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'artifacts/tavern-brawl/attack-research'
DEST = ROOT / 'dist/assets/tavern-brawl/midnight/materials'
REGIONS = {
    'soul-cleave': (0, 0, 512, 512),
    'furnace-impact': (512, 0, 1024, 512),
    'coal-ash': (1024, 0, 1536, 512),
    'soul-a': (0, 512, 512, 1024),
    'soul-b': (520, 512, 960, 1024),
    'furnace-scorch': (970, 600, 1536, 920),
}
DEST.mkdir(parents=True, exist_ok=True)
image = Image.open(SOURCE / 'mordren-soul-vfx-source-v1.png')
assert image.mode == 'RGBA' and image.size == (1536, 1024)
for name, region in REGIONS.items():
    image.crop(region).save(DEST / f'{name}-v1.png', optimize=True)
(DEST / 'mordren-soul-vfx-regions-v1.json').write_text(json.dumps({
    'source': 'artifacts/tavern-brawl/attack-research/mordren-soul-vfx-source-v1.png',
    'regions': REGIONS,
    'processing': 'Rectangular extraction only. Native RGBA and alpha preserved.',
}, indent=2) + '\n')

with zipfile.ZipFile(SOURCE / 'cethiel-fire-slash.zip') as archive:
    names = sorted(n for n in archive.namelist()
                   if n.startswith('Alternative 3/1/') and n.endswith('.png'))
    assert len(names) == 6
    strip = Image.new('RGBA', (192 * len(names), 192))
    for i, name in enumerate(names):
        frame = Image.open(io.BytesIO(archive.read(name))).convert('RGBA')
        frame.thumbnail((192, 192))
        strip.alpha_composite(frame, (192 * i + (192 - frame.width) // 2,
                                     (192 - frame.height) // 2))
    strip.save(DEST / 'cethiel-flame-slash.png', optimize=True)
print('Prepared six original RGBA crops and a six-frame CC0 flame strip.')
