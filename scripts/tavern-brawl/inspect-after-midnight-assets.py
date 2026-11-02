"""Read-only pixel QA and metadata. Artwork is generated; this script never repaints pixels."""
from pathlib import Path
from PIL import Image
from collections import deque
import json,hashlib
base=Path(__file__).resolve().parents[2]/'dist/assets/tavern-brawl'
exp=base/'expansions/after-midnight'
catalog=json.loads((base/'cards.json').read_text())
entries=[];layouts={}
for c in catalog['cards']:
 if c.get('set')!='after-midnight':continue
 runtime=exp/'cards'/f'{c["id"]}.png';master=exp/'masters'/runtime.name
 im=Image.open(runtime).convert('RGBA');w,h=im.size;pixels=im.load();a=im.getchannel('A');hist=a.histogram()
 # Largest sapphire component in the reserved cost region, excluding frame/background.
 candidates=set()
 for y in range(int(h*.015),int(h*.18)):
  for x in range(int(w*.015),int(w*.28)):
   r,g,b,alpha=pixels[x,y]
   if alpha>128 and b>r*1.45 and b>g*1.13 and b>80:candidates.add((x,y))
 best=[]
 while candidates:
  first=candidates.pop();q=deque([first]);component=[first]
  while q:
   x,y=q.popleft()
   for p in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
    if p in candidates:candidates.remove(p);q.append(p);component.append(p)
  if len(component)>len(best):best=component
 if not best:raise RuntimeError('No sapphire gem '+c['id'])
 xs=[p[0] for p in best];ys=[p[1] for p in best]
 cost={'x':round((min(xs)+max(xs))/2/w,5),'y':round((min(ys)+max(ys))/2/h,5)}
 layout={'cost':cost,'name':{'x':.5,'y':.70},'rules':{'x':.5,'y':.83}}
 if c['type']=='crew':layout.update({'attack':{'x':.13,'y':.707},'health':{'x':.86,'y':.707}})
 # Match the live tier seal to its painted socket instead of adding a second badge.
 points=set()
 for y in range(int(h*.02),int(h*.20)):
  for x in range(int(w*.78),int(w*.985)):
   r,g,b,alpha=pixels[x,y]
   match=(max(r,g,b)-min(r,g,b)<27 and 85<(r+g+b)/3<225) if c['rarity']=='common' else (g>r*1.3 and b>r*1.3 and g>75) if c['rarity']=='rare' else (r>g*1.2 and b>g*1.4 and b>85)
   if alpha>200 and match:points.add((x,y))
 components=[]
 while points:
  first=points.pop();q=deque([first]);part=[first]
  while q:
   x,y=q.popleft()
   for point in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
    if point in points:points.remove(point);q.append(point);part.append(point)
  xx=[p[0] for p in part];yy=[p[1] for p in part];bw=max(xx)-min(xx)+1;bh=max(yy)-min(yy)+1
  if len(part)>20 and .5<bw/bh<1.8 and bw<w*.15 and bh<h*.12:components.append((len(part),min(xx),max(xx),min(yy),max(yy)))
 if components and c['rarity']!='legendary':
  _,x0,x1,y0,y1=max(components)
  layout['rarity']={'x':round((x0+x1)/2/w,5),'y':round((y0+y1)/2/h,5),'width':round(min(.13,max(.065,(x1-x0)/w+.035)),5)}
 layouts[c['id']]=layout
 masterIm=Image.open(master);mw,mh=masterIm.size
 entry={'id':c['id'],'file':c['art'],'master':str(master.relative_to(base)),'prompt':str((exp/'prompts'/f'{c["id"]}.prompt.txt').relative_to(base)),'width':w,'height':h,'masterWidth':mw,'masterHeight':mh,'bytes':runtime.stat().st_size,'sha256':hashlib.sha256(runtime.read_bytes()).hexdigest(),'clearAlphaFraction':round(sum(hist[:16])/(w*h),6),'transparentFraction':round(sum(hist[:255])/(w*h),6),'parchmentMinimumAlpha':min(pixels[x,y][3] for y in range(int(h*.80),int(h*.93)) for x in range(int(w*.25),int(w*.75))),'layout':layout}
 if entry['parchmentMinimumAlpha']<240:raise RuntimeError('Transparent parchment '+c['id'])
 if entry['clearAlphaFraction']<.001:raise RuntimeError('Missing outer alpha '+c['id'])
 entries.append(entry)
(exp/'manifest.json').write_text(json.dumps({'version':1,'tool':'built-in image_gen','count':len(entries),'cards':entries},indent=2)+'\n')
(exp/'layouts.json').write_text(json.dumps(layouts,indent=2)+'\n')
manifest=json.loads((base/'manifest.json').read_text())
manifest['sources']=[s for s in manifest['sources'] if not s['file'].startswith('expansions/after-midnight/')]
manifest['sprites']=[s for s in manifest['sprites'] if not s['file'].startswith('expansions/after-midnight/')]
for e in entries:
 manifest['sources'].append({'id':e['id']+'-master','file':e['master'],'prompt':e['prompt'],'width':e['masterWidth'],'height':e['masterHeight']})
 manifest['sprites'].append({'id':e['id'],'file':e['file'],'source':e['master'],'width':e['width'],'height':e['height'],'bytes':e['bytes'],'crop':[0,0,e['masterWidth'],e['masterHeight']],'transparentFraction':e['transparentFraction']})
(base/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'cards':len(entries),'runtimeMB':round(sum(e['bytes'] for e in entries)/1048576,2),'clearAlphaRange':[min(e['clearAlphaFraction'] for e in entries),max(e['clearAlphaFraction'] for e in entries)],'minimumParchmentAlpha':min(e['parchmentMinimumAlpha'] for e in entries)}))
