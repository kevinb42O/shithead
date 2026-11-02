import test from 'node:test';
import assert from 'node:assert/strict';
import {furnaceBounds} from '../dist/brawl/furnace-burst.js';

test('Furnace Burst follows either affected row and stays within the viewport',()=>{
 for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]){
  for(const top of [height*.21,height*.45]){
   const row={left:width*.13,right:width*.87,width:width*.74,top,height:height*.20};
   const b=furnaceBounds(row,{width,height});
   assert(b.left>=0&&b.left+b.width<=width);assert(b.top>=0&&b.top+b.height<height);
   assert(b.floor>=row.top&&b.floor<=row.top+row.height);
   assert(Math.abs(b.top+b.height*.81-b.floor)<.001,'flame floor is anchored to the row');
   assert(b.height<=height*.29);
  }
 }
});
