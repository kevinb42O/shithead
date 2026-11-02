import {ATTACK} from './combat-timing.js';

// Public visual identity only; nothing here changes attack rules or event order.
const profile=(family,material,weight=1)=>Object.freeze({family,material,weight,...ATTACK});
export const ATTACK_PROFILES=Object.freeze({
  physical:profile('cut','impact'),heavy:profile('crush','impact',1.5),
  fire:profile('flame','fire',1.1),mordren:profile('soul-cleave','fire',1.7),
  shadow:profile('shade','shadow'),celestial:profile('star','arcane'),
});
const groups={
  physical:['tavern-rat','mouse-guard','fox-cutpurse','hedgehog-watchman','stoat-gambler','hare-runner','raccoon-scavenger','sootpaw-lookout','gutterglass-duelist'],
  heavy:['barroom-bruiser','badger-sentinel','ironjaw-bouncer'],
  fire:['cinder-rat','wickrunner-bat'],
  shadow:['raven-cutpurse','vesper-blackpaw-king','ashveil-acolyte','gravewax-collector','debt-eater','mother-nox-bellkeeper'],
  celestial:['owl-apprentice','toad-brewer','lantern-moth','bell-tower-marksman','nightglass-diviner','orun-eclipse-warden'],
  mordren:['mordren-ashen-host'],
};
export const CREW_ATTACKS=Object.freeze(Object.fromEntries(Object.entries(groups).flatMap(([family,ids])=>ids.map(id=>[id,family]))));
export function attackProfile(card){return ATTACK_PROFILES[CREW_ATTACKS[card]]||ATTACK_PROFILES.physical;}
