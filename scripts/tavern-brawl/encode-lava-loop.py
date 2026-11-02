"""Encode the rendered flow frames as the production looping material."""
from pathlib import Path
from PIL import Image
frames = [Image.open(p).convert('RGB') for p in sorted(Path('.impeccable/build/lava-animation').glob('*.png'))]
if len(frames) != 96:
    raise SystemExit('Run node scripts/tavern-brawl/build-lava-loop.mjs first.')
out = Path('dist/assets/tavern-brawl/midnight/materials')
frames[0].save(out / 'molten-lava-loop.webp', save_all=True, append_images=frames[1:], duration=83, loop=0, quality=82, method=4)
frames[0].save(out / 'molten-lava-still.webp', quality=90, method=6)
