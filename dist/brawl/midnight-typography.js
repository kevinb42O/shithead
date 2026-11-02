// Fit live rules into the dark lower face. Names, numbers and abilities remain
// semantic text; no game data is baked into the generated illustrations.
const layouts=new Map();
const ready=Promise.all([document.fonts.load('500 100px DM'),document.fonts.load('700 100px DM')]);
const keywords=/(Battlecry:|Last Orders:|Setup:|\bGuard\b|\bWard\b|\bSkirmish\b)/g;
let context;
export function styleCardName(node,card){
  node.style.setProperty('--midnight-name-size',`${card.name.length>24?5.7:card.name.length>17?6.5:7.4}cqw`);
  return node;
}

export function styleCardText(node,card){
  const keywordOnly=/^(Guard|Ward|Skirmish)\.$/.test(card.text);
  node.classList.toggle('is-keyword-only',keywordOnly);
  ready.then(()=>{
    context||=document.createElement('canvas').getContext('2d');
    const key=card.type+':'+card.text;
    if(!layouts.has(key)){
      let result;
      // Measure in a 1000px-wide card, including the actual keyword weight.
      // The rules recess runs from 74.5% to 94%; lower lines sit between
      // the stat sockets. Search balanced wraps at the largest fitting size.
      const words=card.text.match(/Last Orders:|\S+/g)||[];
      for(let size=keywordOnly?9.2:8;size>=3.1;size-=.1){
        const lineHeight=size*10*1.16;
        const measure=line=>line.split(keywords).reduce((width,part)=>{
          context.font=`${/^(Battlecry:|Last Orders:|Setup:|Guard|Ward|Skirmish)$/.test(part)?750:500} ${size*10}px DM`;
          return width+context.measureText(part).width;
        },0);
        const maxLines=Math.floor(292/lineHeight);
        for(let count=1;count<=maxLines&&!result;count++){
          const memo=new Map();
          function arrange(start,row){
            if(row===count)return start===words.length?{cost:0,lines:[]}:null;
            const key=start+':'+row;
            if(memo.has(key))return memo.get(key);
            const limit=card.type==='crew'&&(row+1)*lineHeight>120?490:820;
            let best=null;
            for(let end=start+1;end<=words.length;end++){
              const line=words.slice(start,end).join(' '),width=measure(line);
              if(width>limit)break;
              const tail=arrange(end,row+1);
              if(!tail)continue;
              const cost=((limit-width)/limit)**2+tail.cost;
              if(!best||cost<best.cost)best={cost,lines:[line,...tail.lines]};
            }
            memo.set(key,best);return best;
          }
          const fitted=arrange(0,0);
          if(fitted)result={size,lines:fitted.lines};
        }
        if(result)break;
      }
      layouts.set(key,result||{size:3.1,lines:[card.text]});
    }
    const {size,lines}=layouts.get(key);
    node.style.setProperty('--midnight-rules-size',size.toFixed(2)+'cqw');
    node.replaceChildren(...lines.map(line=>{const row=document.createElement('span');row.className='rules-line';for(const part of line.split(keywords)){const child=document.createElement(/^(Battlecry:|Last Orders:|Setup:|Guard|Ward|Skirmish)$/.test(part)?'strong':'span');child.textContent=part;row.append(child);}return row;}));
  });
  return node;
}
