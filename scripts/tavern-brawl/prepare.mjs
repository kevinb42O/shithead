import { readFile, writeFile, copyFile, mkdir, stat, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=fileURLToPath(new URL('../../',import.meta.url));
const base=path.join(root,'dist/assets/tavern-brawl');
const sources=JSON.parse(await readFile(path.join(base,'sources.json'),'utf8'));
const {cards}=JSON.parse(await readFile(path.join(base,'cards.json'),'utf8'));
const configurations={
  heroes:{columns:3,rows:1,directory:'heroes',names:['fox','owl','raven']},
  'card-back':{columns:1,rows:1,directory:'ui',names:['card-back']},
  'ui-controls':{columns:'auto:2',rows:3,directory:'ui',names:['button-emerald','button-gold','button-disabled','turn-banner','nameplate','energy-housing']},
  'ui-tokens':{columns:'auto:3',rows:3,directory:'ui',names:['energy-on','energy-off','health','attack','portrait-rim','coin','spell','guard','equipment']},
  'ui-pot':{columns:2,rows:1,directory:'ui',names:['pot-full','pot-empty']},
  'ui-finish':{columns:'auto:2',rows:1,directory:'ui',names:['result-crest','reward-chest']},
  'ui-effects':{columns:3,rows:2,directory:'ui',names:['fx-impact','fx-sand','fx-heal','fx-smoke','fx-arcane','fx-sparks']},
  title:{columns:1,rows:1,directory:'ui',names:['title']}
};
for(let i=0;i<6;i++) {
  const group=cards.slice(i*4,i*4+4);
  configurations[path.basename(group[0].sheet,'.png')]={columns:2,rows:2,directory:'cards',names:group.map(c=>c.id)};
}
const exists=async file=>access(file).then(()=>true,()=>false);
const manifest={version:1,generator:'built-in image_gen',scope:'first-playable-art-pack',sources:[],sprites:[]};
for(const source of sources) {
  const board=source.id.startsWith('board-');
  const relative=`${board?'boards':'sheets'}/${source.id}.png`;
  const destination=path.join(base,relative);
  await mkdir(path.dirname(destination),{recursive:true});
  if(!await exists(destination)) await copyFile(source.source,destination);
  const header=await readFile(destination);
  const width=header.readUInt32BE(16),height=header.readUInt32BE(20);
  manifest.sources.push({id:source.id,file:relative,width,height,bytes:(await stat(destination)).size,prompt:`sheets/${source.id}.prompt.txt`,transparentRequested:source.transparent});
  const config=configurations[source.id];
  if(!config) continue;
  const folder=path.join(base,config.directory);
  const cropFile=path.join(folder,`${source.id}.crops.json`);
  if(!await exists(cropFile)) {
    if((await Promise.all(config.names.map(n=>exists(path.join(folder,n+'.png'))))).some(Boolean))
      throw Error(`Partial extraction exists for ${source.id}; move it aside before rerunning.`);
    execFileSync('swift',[path.join(root,'scripts/tavern-brawl/slice.swift'),destination,String(config.columns),String(config.rows),folder,config.names.join(',')],{stdio:'inherit'});
  }
  const crops=JSON.parse(await readFile(cropFile,'utf8'));
  for(const crop of crops) manifest.sprites.push({...crop,file:`${config.directory}/${crop.file}`,source:relative,prompt:`sheets/${source.id}.prompt.txt`});
}
await writeFile(path.join(base,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Prepared ${manifest.sources.length} source images and ${manifest.sprites.length} extracted PNGs.`);
