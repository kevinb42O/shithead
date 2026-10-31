# Usage: PYTHONPATH=/path/to/tools python3 scripts/prepare-hearthstone-audio.py /path/to/extracted/archive
# Optional preparation dependency: imageio-ffmpeg, soundfile. Runtime has no dependencies.
import sys,pathlib,json,subprocess,hashlib
import imageio_ffmpeg,soundfile as sf
root=pathlib.Path(sys.argv[1])/'General SFX';out=pathlib.Path(__file__).resolve().parents[1]/'dist/assets/audio'
out.mkdir(parents=True,exist_ok=True)
sources={
'hs-card-play-1':'play_card_from_hand_1','hs-card-play-2':'play_card_from_hand_2',
'hs-card-select':'collection_manager_pick_up_card','hs-card-drop':'collection_manager_drop_card',
'hs-card-draw-1':'draw_card_and_add_to_hand_1','hs-card-draw-2':'draw_card_and_add_to_hand_3',
'hs-card-deal':'FX_GameStart20_CardDealSingle','hs-card-return':'FX_GameStart30_CardReplaceSingle',
'hs-card-gather':'FX_GameStart09_CardsOntoTable','hs-card-shuffle':'FX_MulliganCoin09_DeckShuffle',
'hs-hover':'Small_Mouseover','hs-click':'Small_Click','hs-click-2':'tiny_button_press_1',
'hs-open':'collection_manager_book_open','hs-close':'collection_manager_book_close',
'hs-confirm':'deck_select_button_press','hs-back':'Back_Click','hs-reject':'collection_manager_card_move_invalid_or_click',
'hs-turn':'ALERT_YourTurn_0v2','hs-coin-flip':'FX_MulliganCoin03_CoinFlip','hs-coin-drop':'FX_MulliganCoin01_HeroCoinDrop',
'hs-frost':'FX_FreezeEvent_SpellImpact','hs-wind':'WoW_whirlwindshort','hs-free':'mana_crystal_refresh',
'hs-arcane':'mass_DE_arcane_flyover_1','hs-tension':'card_limit_lock','hs-fizzle':'Shared_Shadow_FizzleHigh_1',
'hs-relief':'mana_crystal_add','hs-victory':'victory_screen_start','hs-defeat':'defeat_screen_start',
'hs-reward':'game_end_reward','hs-page':'collection_manager_book_page_flip_forward',
'hs-hellfire':'CS2_062_Warlock_Hellfire_Cast','hs-toggle-on':'checkbox_toggle_on','hs-toggle-off':'checkbox_toggle_off'
}
ff=imageio_ffmpeg.get_ffmpeg_exe();manifest=[]
for name,original in sources.items():
 p=root/(original+'.ogg');target=out/(name+'.mp3');a,sr=sf.read(p)
 subprocess.run([ff,'-loglevel','error','-y','-i',str(p),'-codec:a','libmp3lame','-b:a','192k',str(target)],check=True)
 manifest.append(dict(file=target.name,source='General SFX/'+p.name,author='Blizzard Entertainment',game='Hearthstone',license='Proprietary — Blizzard Entertainment; all rights reserved',url='https://sounds.spriters-resource.com/pc_computer/hearthstone/asset/396767/',duration=round(len(a)/sr,3),sourceSha256=hashlib.sha256(p.read_bytes()).hexdigest()))
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(len(manifest),'Hearthstone samples;',sum(p.stat().st_size for p in out.glob('hs-*.mp3')),'bytes')
