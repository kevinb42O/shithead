// Original native-alpha paintings, sampled directly: no extracted luminance,
// recoloring or additive compositing that would erase the dark smoke interiors.
export const MATERIAL_ASSETS = [
  'assets/tavern-brawl/midnight/materials/combat-atlas-v2.png',
  'assets/tavern-brawl/midnight/materials/combat-smoke-v2.png'
];
export const MATERIAL_CELLS=Object.freeze({cut:0,impact:1,shadow:2,arcane:3,ward:4,heal:5});
// Artwork cores differ inside their cells; align the hot point, not the bitmap center.
const anchors={impact:[.18,.55],arcane:[.84,.50],ward:[.47,.51]};
export function createCombatMaterials(ctx){
  const images=MATERIAL_ASSETS.map(src=>{const image=new Image();image.src=src;return image;});
  function cell(image,cols,rows,index,x,y,w,h,angle,alpha,anchor=[.5,.5]){
    if(!ctx||!image.complete||!image.naturalWidth||alpha<=0)return false;
    const sw=image.naturalWidth/cols,sh=image.naturalHeight/rows;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=Math.min(1,alpha);
    ctx.globalCompositeOperation='source-over';
    ctx.drawImage(image,index%cols*sw,Math.floor(index/cols)*sh,sw,sh,-w*anchor[0],-h*anchor[1],w,h);
    ctx.restore();return true;
  }
  function stamp(kind,x,y,w,h,angle=0,alpha=1){
    return cell(images[0],3,2,MATERIAL_CELLS[kind]??0,x,y,w,h,angle,alpha,anchors[kind]);
  }
  function smoke(t,x,y,w,h,angle=0,alpha=1){
    // Crossfade adjacent frames, retaining a finite final dissolution.
    const frame=Math.max(0,Math.min(7,t*7)),index=Math.floor(frame),q=frame-index;
    const available=cell(images[1],4,2,index,x,y,w,h,angle,alpha*(1-q));
    if(q>0&&index<7)cell(images[1],4,2,index+1,x,y,w,h,angle,alpha*q);
    return available;
  }
  return {stamp,smoke,ready:()=>Promise.all(images.map(i=>i.decode().catch(()=>{})))};
}
