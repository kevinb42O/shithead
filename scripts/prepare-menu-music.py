# Optional tools: pip install numpy soundfile imageio-ffmpeg
# Usage: python3 scripts/prepare-menu-music.py /path/to/Celebration.mp3
import sys,pathlib,tempfile,subprocess
import numpy as np
import soundfile as sf
import imageio_ffmpeg
ff=imageio_ffmpeg.get_ffmpeg_exe()
output=pathlib.Path(__file__).resolve().parents[1]/'dist/assets/audio/tavern-celebration.mp3'
with tempfile.TemporaryDirectory() as temp:
    wav=pathlib.Path(temp)/'source.wav'
    subprocess.run([ff,'-loglevel','error','-y','-i',sys.argv[1],str(wav)],check=True)
    a,sr=sf.read(wav,always_2d=True);n=int(sr*2.5);t=np.linspace(0,1,n)[:,None]
    loop=np.concatenate([a[n:-n],a[-n:]*(1-t)+a[:n]*t]);sf.write(wav,loop,sr)
    subprocess.run([ff,'-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','160k',str(output)],check=True)
