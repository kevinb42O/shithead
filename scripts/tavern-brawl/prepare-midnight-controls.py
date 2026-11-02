"""Extract native-alpha control paintings; trim canvas, never scale the art.

Exact prompts and original generated masters stay beside the source atlases.
Run from the project root with Pillow, as for the existing card-art pipeline.
"""
from pathlib import Path
from PIL import Image, PngImagePlugin
import json

BASE=Path(__file__).resolve().parents[2]/'dist/assets/tavern-brawl/midnight'
SOURCE=BASE/'sources'
OUT=BASE/'ui'
OUT.mkdir(exist_ok=True)
manifest={}

def save(source,name,rect=None):
    im=Image.open(SOURCE/(source+'.png')).convert('RGBA')
    if rect: im=im.crop(rect)
    # The silhouette has antialiased alpha and contact shadows. A threshold is
    # used ONLY to find the empty canvas box; all retained alpha stays untouched.
    box=im.getchannel('A').point(lambda p:255 if p>16 else 0).getbbox()
    x0,y0,x1,y1=box
    box=(max(0,x0-3),max(0,y0-3),min(im.width,x1+3),min(im.height,y1+3))
    im=im.crop(box)
    info=PngImagePlugin.PngInfo()
    info.add_text('generation-prompt',(SOURCE/(source+'.prompt.txt')).read_text())
    info.add_text('provenance',f'Original built-in ImageGen; native alpha. Source {source}.png; atlas region {rect}; transparent-canvas trim {box}. No resampling or repainting.')
    im.save(OUT/(name+'.png'),pnginfo=info,optimize=True)
    manifest[name]={'source':source,'region':rect,'trim':box,'size':list(im.size)}

save('player-station-v2','player-station-v2')
save('end-turn-v2','end-turn-v2')
for source,names in [('power-icons-v2',['power-fox-v2','power-owl-v2','power-raven-v2']),('energy-gems-v2',['energy-lit-v2','energy-spent-v2','energy-locked-v2'])]:
    im=Image.open(SOURCE/(source+'.png'))
    for i,name in enumerate(names):save(source,name,(round(i*im.width/3),0,round((i+1)*im.width/3),im.height))
(OUT/'controls-v2.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({name:row['size'] for name,row in manifest.items()}))
