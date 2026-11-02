import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const base=fileURLToPath(new URL('../../dist/assets/tavern-brawl/',import.meta.url));
const manifest=JSON.parse(await readFile(path.join(base,'manifest.json'),'utf8'));
const binary='/Users/kevin/.codex/skills/impeccable/scripts/impeccable';
for(const asset of [...manifest.sources,...manifest.sprites]){
  const prompt=(await readFile(path.join(base,asset.prompt),'utf8')).trimEnd();
  execFileSync(binary,['embed-prompt',path.join(base,asset.file),'--prompt',prompt],{stdio:'pipe'});
}
execFileSync(binary,['embed-prompt',path.join(base,'reference/gameplay-concept.png'),'--prompt','Origin: the original approved Tavern Brawl gameplay concept generated with the built-in image_gen tool in this chat on 2026-11-02; retained unchanged as the art-direction reference.'],{stdio:'pipe'});
console.log(`Embedded generation prompts in ${manifest.sources.length+manifest.sprites.length} artwork files and origin in the approved reference.`);
