// Single source for the expansion's rules metadata. Artwork contains no rules text.
const crew=(id,name,cost,attack,health,faction,rarity,text,extra={})=>({id,name,cost,attack,health,faction,rarity,type:'crew',text,effect:{kind:'vanilla'},...extra});
const trick=(id,name,cost,faction,rarity,text,effect)=>({id,name,cost,faction,rarity,type:'trick',text,effect});
const item=(id,name,cost,faction,rarity,text,effect)=>({...trick(id,name,cost,faction,rarity,text,effect),type:'equipment'});
export const expansionCards=[
 crew('cinder-rat','Cinder Rat',1,1,2,'neutral','common','Last Orders: add 1 coin to the shared pot.',{deathEffects:[{kind:'pot',amount:1}]}),
 crew('wickrunner-bat','Wickrunner Bat',2,2,2,'neutral','common','Skirmish.',{keywords:['skirmish']}),
 crew('ironjaw-bouncer','Ironjaw Bouncer',4,4,5,'neutral','rare','Guard.',{keywords:['guard']}),
 crew('lantern-moth','Lantern Moth',2,1,3,'neutral','common','Battlecry: restore 2 health to your hero.',{effect:{trigger:'play',kind:'heal',amount:2}}),
 crew('bell-tower-marksman','Bell-Tower Marksman',4,3,4,'neutral','rare','Battlecry: deal 2 damage to an enemy crew member.',{effect:{trigger:'play',kind:'damage',target:'enemy-crew',amount:2}}),
 item('black-iron-buckler','Black-Iron Buckler',2,'neutral','common','Give a friendly crew member +1 health and Ward.',{kind:'buff',target:'friendly-crew',health:1,ward:true}),
 trick('shatter-the-seal','Shatter the Seal',3,'neutral','rare',"Remove an enemy crew member’s Guard and Ward. Deal 2 damage to it.",{kind:'sequence',steps:[{kind:'strip-protection',target:'enemy-crew'},{kind:'damage',target:'enemy-crew',amount:2}]}),
 trick('furnace-burst','Furnace Burst',5,'neutral','rare','Deal 3 damage to all enemy crew members.',{kind:'damage',target:'enemy-row',amount:3}),
 trick('the-bell-tolls','The Bell Tolls',7,'neutral','epic','Deal 5 damage to all crew members.',{kind:'damage',target:'all-crew',amount:5}),
 crew('mordren-ashen-host','Mordren, Ashen Host',8,6,8,'neutral','legendary','Guard. Battlecry: deal 3 damage to all other crew members.',{shortName:'Mordren',keywords:['guard'],effect:{trigger:'play',kind:'damage',target:'other-crew',amount:3}}),
 crew('sootpaw-lookout','Sootpaw Lookout',2,2,3,'fox','common','Setup: add 2 coins to the shared pot.',{setupEffect:{kind:'pot',amount:2}}),
 trick('cut-the-purse','Cut the Purse',2,'fox','common','Deal 2 damage to an enemy crew member. Add 1 coin to the shared pot.',{kind:'sequence',steps:[{kind:'damage',target:'enemy-crew',amount:2},{kind:'pot',amount:1}]}),
 crew('gutterglass-duelist','Gutterglass Duelist',3,3,3,'fox','rare','Skirmish. Setup: gain +1 attack.',{keywords:['skirmish'],setupEffect:{kind:'self-buff',attack:1}}),
 trick('house-edge','House Edge',3,'fox','epic','Spend 6 pot coins. Draw 2 cards. Give your crew +1 attack this turn.',{kind:'sequence',potMinimum:6,steps:[{kind:'spend-pot',amount:6},{kind:'draw',count:2},{kind:'row-buff',attack:1,duration:'turn'}]}),
 crew('vesper-blackpaw-king','Vesper, Blackpaw King',6,5,5,'fox','legendary','Skirmish. Setup: gain Ward.',{shortName:'Vesper',keywords:['skirmish'],setupEffect:{kind:'self-buff',ward:true}}),
 crew('ashveil-acolyte','Ashveil Acolyte',2,1,3,'owl','common','Ward.',{keywords:['ward']}),
 trick('moonlit-stitch','Moonlit Stitch',1,'owl','common','Restore 3 health to a friendly crew member.',{kind:'heal-crew',target:'friendly-crew',amount:3}),
 crew('nightglass-diviner','Nightglass Diviner',3,2,4,'owl','rare','Battlecry: look at your top 2 cards. Draw one. Put the other on the bottom.',{effect:{trigger:'play',kind:'divine'}}),
 trick('sealed-constellation','Sealed Constellation',5,'owl','epic','Give a friendly crew member +2/+3 and Ward.',{kind:'buff',target:'friendly-crew',attack:2,health:3,ward:true}),
 crew('orun-eclipse-warden','Orun, Eclipse Warden',7,4,8,'owl','legendary','Guard. Ward. Battlecry: restore 4 health to your hero.',{shortName:'Orun',keywords:['guard','ward'],effect:{trigger:'play',kind:'heal',amount:4}}),
 crew('gravewax-collector','Gravewax Collector',3,3,3,'raven','rare','Last Orders: draw a card.',{deathEffects:[{kind:'draw',count:1}]}),
 crew('debt-eater','Debt-Eater',5,4,5,'raven','rare','After another friendly crew member dies, gain +1/+2. Once per turn.',{deathObserver:{attack:1,health:2}}),
 trick('collect-the-debt','Collect the Debt',4,'raven','epic','Destroy a damaged enemy crew member. Deal 2 damage to your hero.',{kind:'sequence',steps:[{kind:'destroy',target:'damaged-enemy-crew'},{kind:'damage',target:'own-hero',amount:2}]}),
 item('funeral-velvet','Funeral Velvet',3,'raven','epic','Give a friendly crew member +2 health and “Last Orders: restore 4 health to your hero.”',{kind:'buff',target:'friendly-crew',health:2,deathEffect:{kind:'heal',amount:4}}),
 crew('mother-nox-bellkeeper','Mother Nox, Bellkeeper',8,5,8,'raven','legendary','Battlecry: sacrifice another friendly crew member to deal 4 damage to the enemy hero and restore 4 health to yours.',{shortName:'Mother Nox',effect:{trigger:'play',kind:'sacrifice-drain',target:'friendly-crew',amount:4}})
].map(c=>({...c,shortName:c.shortName||({'wickrunner-bat':'Wickrunner','ironjaw-bouncer':'Ironjaw','bell-tower-marksman':'Marksman','sootpaw-lookout':'Sootpaw','gutterglass-duelist':'Gutterglass','ashveil-acolyte':'Ashveil','nightglass-diviner':'Nightglass','gravewax-collector':'Gravewax'}[c.id]),set:'after-midnight',art:`expansions/after-midnight/cards/${c.id}.png`,status:'playable-v3'}));
const paired=(pairs,singles)=>[...pairs.flatMap(id=>[id,id]),...singles];
export const featuredDecks={
 fox:paired(['tavern-rat','fox-cutpurse','sootpaw-lookout','cut-the-purse','gutterglass-duelist','pilfer','ironjaw-bouncer','shatter-the-seal'],['house-edge','vesper-blackpaw-king','mordren-ashen-host','furnace-burst']),
 owl:paired(['tavern-rat','owl-apprentice','ashveil-acolyte','nightglass-diviner','badger-sentinel','bar-fight','shatter-the-seal','hearth-lantern'],['moonlit-stitch','sealed-constellation','orun-eclipse-warden','mordren-ashen-host']),
 raven:paired(['cinder-rat','tavern-rat','gravewax-collector','raven-cutpurse','barroom-bruiser','debt-eater','funeral-velvet','collect-the-debt'],['raven-bargain','the-bell-tolls','mother-nox-bellkeeper','mordren-ashen-host'])
};
