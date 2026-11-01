// Integrate acceleration, sustained rotation and friction into one continuous spin.
// Linear keyframe timing prevents easing from hiding all the turns at the start.
export function fateNeedleMotion(destination) {
 const duration=6000, acceleration=.5, cruise=2.3, braking=3.2;
 const start=-35, end=2880+((destination%360)+360)%360;
 const area=acceleration/2+cruise+braking/2;
 const keyframes=Array.from({length:121},(_,i)=>{
  const t=duration*i/120/1000;
  let distance;
  if(t<acceleration) distance=t*t/(2*acceleration);
  else if(t<acceleration+cruise) distance=acceleration/2+t-acceleration;
  else {
   const u=t-acceleration-cruise;
   distance=acceleration/2+cruise+u-u*u/(2*braking);
  }
  return {transform:`rotate(${i===120?end:start+(end-start)*distance/area}deg)`,offset:i/120};
 });
 return {keyframes,options:{duration,easing:'linear',fill:'forwards'}};
}
