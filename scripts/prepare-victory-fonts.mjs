// Self-host Google Fonts. Runtime never contacts a font service.
import {mkdir,writeFile} from 'node:fs/promises';
const directory = new URL('../dist/assets/fonts/',import.meta.url);
await mkdir(directory,{recursive:true});
const faces = [
  {name:'Cinzel Decorative',query:'Cinzel+Decorative:wght@900',file:'cinzel-decorative-black-latin.woff2',license:'cinzeldecorative'},
  {name:'Cinzel',query:'Cinzel:wght@700',file:'cinzel-bold-latin.woff2',license:'cinzel'},
  {name:'Cormorant Garamond',query:'Cormorant+Garamond:ital,wght@1,600',file:'cormorant-garamond-semibold-italic-latin.woff2',license:'cormorantgaramond'},
];
const sources = await Promise.allSettled(faces.map(async face => {
  const source=`https://fonts.googleapis.com/css2?family=${face.query}&display=swap`;
  const cssResponse=await fetch(source,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}});
  if(!cssResponse.ok)throw Error(`Font CSS failed: ${face.name}`);
  const css=await cssResponse.text();
  const latin=css.match(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/);
  const url=latin?.[1].match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/)?.[1];
  if(!url)throw Error(`No Latin WOFF2 for ${face.name}: ${css}`);
  const [fontResponse,licenseResponse] = await Promise.all([
    fetch(url),fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${face.license}/OFL.txt`)
  ]);
  if(!fontResponse.ok||!licenseResponse.ok)throw Error(`Font download failed: ${face.name}`);
  const data=Buffer.from(await fontResponse.arrayBuffer());
  if(data.subarray(0,4).toString()!=='wOF2')throw Error(`Invalid WOFF2: ${face.name}`);
  await writeFile(new URL(face.file,directory),data);
  await writeFile(new URL(`${face.license}-OFL.txt`,directory),await licenseResponse.text());
  return {...face,source,url,bytes:data.length};
}));
for(const source of sources)if(source.status==='rejected')throw source.reason;
const manifest=sources.map(s=>s.value);
await writeFile(new URL('victory-fonts.sources.json',directory),JSON.stringify(manifest,null,2)+'\n');
console.log(manifest.map(f=>`${f.name}: ${(f.bytes/1024).toFixed(1)} KiB`).join('\n'));
