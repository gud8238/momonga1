export async function createAudio(){
 let manifest={files:{},voices:{}},enabled=false,bgm=null,effect=null,currentMusic='',currentEffect='',voice=null,lastCue=0,wasFlying=false,wasMoving=false;
 const shots=new Set();
 const button=document.querySelector('#sound'),status=document.querySelector('#audio-status');
 try{const response=await fetch('./assets/audio/manifest.json');if(response.ok)manifest=await response.json();}catch{}
 const available=Object.keys(manifest.files).length>0;
 status.textContent=available?'':'음원 생성 대기 · API 키 설정 필요';
 function play(file,loop,volume){const audio=new Audio(`./assets/audio/${file}`);audio.loop=loop;audio.volume=volume;audio.play().catch(()=>{});return audio;}
 button.onclick=()=>{if(!available){status.textContent='Gemini API 키 설정 후 음원을 생성해 주세요.';return;}enabled=!enabled;button.textContent=enabled?'소리 끄기':'소리 켜기';if(!enabled){for(const shot of shots)shot.pause();shots.clear();bgm?.pause();effect?.pause();voice?.pause();currentMusic='';currentEffect='';}};
 function speak(text){const file=manifest.voices[text];if(file){voice?.pause();voice=play(file,false,.8);}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const shot of shots)shot.pause();shots.clear();bgm?.pause();effect?.pause();voice?.pause();currentMusic='';currentEffect='';}});
 return {sfx(name,volume=.6){if(!enabled||document.hidden)return;const file=manifest.files[name];if(!file)return;const shot=play(file,false,volume);shots.add(shot);shot.onended=()=>shots.delete(shot);shot.onerror=()=>shots.delete(shot);},update(map,night,moving,flying){if(!enabled||document.hidden)return;const now=performance.now();if(now-lastCue>12000&&((flying&&!wasFlying)||(moving&&!wasMoving&&!flying))){const lines=flying?['날아오른다! 슈우웅!','우와, 높이 날아간다!']:['사뿐사뿐, 같이 가자!','나 좀 봐, 엄청 귀엽지?'];speak(lines[Math.floor(Math.random()*lines.length)]);lastCue=now;}wasFlying=flying;wasMoving=moving;const preferred=`${map}-${night?'night':'day'}`;const music=manifest.files[preferred]?preferred:night?'night':map;
  if(music!==currentMusic){bgm?.pause();currentMusic=music;const file=manifest.files[music];bgm=file?play(file,true,.42):null;}
  const next=flying?'flight':moving?'footsteps':'';if(next!==currentEffect){effect?.pause();currentEffect=next;const file=manifest.files[next];effect=file?play(file,true,.20):null;}
 },say(text){if(!enabled)return;lastCue=performance.now();speak(text);}};
}
