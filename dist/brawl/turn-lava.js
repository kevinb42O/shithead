// Original generated artwork, baked into a seamless animated WebP material.
// Swap to its still frame while hidden or reduced-motion is requested, so
// the browser does not keep decoding an invisible animation.
const root='/assets/tavern-brawl/midnight/materials/';
export function createTurnLava(image){
  let moving=null;
  const set=animate=>{
    if(moving===animate)return;
    moving=animate;image.src=root+(animate?'molten-lava-loop.webp':'molten-lava-still.webp');
    image.dataset.motion=animate?'flowing':'still';
  };
  set(false);
  return {update(active,reduced){set(active&&!reduced);},destroy(){set(false);}};
}
