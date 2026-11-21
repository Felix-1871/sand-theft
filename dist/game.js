import {GOAL,LOCATIONS,UPGRADES,CONTRACTS,RESEARCH,initialState,migrateState,newlyUnlocked,unlocked,clickPower,rate,upgradeCost,permits,collect,select,purchase,completeContract,research,build} from './engine.js';
import {sceneArt,houseArt} from './art.js';
const $=id=>document.getElementById(id);
const fmt=n=>Math.floor(n+1e-7).toLocaleString('en-US');
const saveKey='sand-theft-save-v1';
let state=initialState(), soundOn=true, audio, last=performance.now(), sceneKey='', endingStep=0, messageTimer;
try{state=migrateState(JSON.parse(localStorage.getItem(saveKey)));}catch{}
const save=()=>{try{localStorage.setItem(saveKey,JSON.stringify(state));}catch{}};
function sound(kind){if(!soundOn)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.type=kind==='win'?'triangle':'sine';osc.frequency.setValueAtTime(kind==='gather'?340:kind==='buy'?530:360,t);osc.frequency.exponentialRampToValueAtTime(kind==='gather'?230:kind==='buy'?820:700,t+.12);gain.gain.setValueAtTime(.035,t);gain.gain.exponentialRampToValueAtTime(.001,t+.16);osc.connect(gain).connect(audio.destination);osc.start(t);osc.stop(t+.17);}catch{}}
function message(text){$('message').textContent=text;clearTimeout(messageTimer);messageTimer=setTimeout(()=>{$('message').textContent='The dream is within reach. Probably.'},6500);}
$('upgrades').innerHTML=UPGRADES.map((u,i)=>`<button class="upgrade" id="up-${i}" title="${u.flavor}"><span class="up-icon">${u.icon}</span><span class="up-info"><strong>${u.name}</strong><small id="up-detail-${i}">${u.description}</small></span><span class="cost" id="up-cost-${i}"></span></button>`).join('');
$('contracts').innerHTML=CONTRACTS.map((c,i)=>`<button class="contract" id="contract-${i}" title="${c.flavor}"><span class="contract-icon">✉</span><span class="contract-copy"><strong>${c.name}</strong><small id="contract-detail-${i}"></small></span><span class="contract-price" id="contract-price-${i}"></span></button>`).join('');
$('research').innerHTML=RESEARCH.map((r,i)=>`<button class="research-item" id="research-${i}" title="${r.flavor}"><span class="up-icon">${r.icon}</span><span class="research-copy"><strong>${r.name} <span id="research-rank-${i}"></span></strong><small>${r.description}</small></span><span class="research-price" id="research-price-${i}"></span></button>`).join('');
UPGRADES.forEach((u,i)=>$(`up-${i}`).addEventListener('click',()=>{tick();if(state.pendingLocations.length)return;if(purchase(state,i)){sound('buy');message(u.flavor);render();save();}}));
CONTRACTS.forEach((c,i)=>$(`contract-${i}`).addEventListener('click',()=>{tick();if(state.pendingLocations.length)return;if(completeContract(state,i)){sound('buy');message(`${c.flavor} One permit acquired.`);render();save();}}));
RESEARCH.forEach((r,i)=>$(`research-${i}`).addEventListener('click',()=>{tick();if(state.pendingLocations.length)return;if(research(state,i)){sound('buy');message(r.flavor);render();save();}}));
const locationDescriptions=[
  '',
  'You have outgrown the sandbox. Fortunately, somebody left an entire beach unattended.',
  'The beach was only the beginning. The desert has sand as far as the eye can see.',
  'The surface is not enough. There is sand under the sea, and the fish cannot stop you.'
];
function showLocationModal(){
  if(!state.pendingLocations.length||$('location-dialog').open)return;
  const index=state.pendingLocations[0],loc=LOCATIONS[index];
  $('location-dialog-art').innerHTML=sceneArt(index,0);
  $('location-dialog-title').textContent=`Next stop: ${loc.name}`;
  $('location-dialog-description').textContent=locationDescriptions[index];
  $('location-dialog').showModal();$('location-continue').focus();
}
function checkChanges(beforeTotal,beforeRemaining){
  const locations=newlyUnlocked(beforeTotal,state.total);
  if(beforeRemaining>0&&state.remaining[state.selected]<=0)message(LOCATIONS[state.selected].empty);
  if(locations.length){state.pendingLocations.push(...locations);save();showLocationModal();}
}
$('location-dialog').addEventListener('cancel',event=>event.preventDefault());
$('location-continue').addEventListener('click',()=>{
  const index=state.pendingLocations.shift();if(index===undefined)return;
  select(state,index);sceneKey='';last=performance.now();$('location-dialog').close();
  message(`${LOCATIONS[index].short} unlocked. New sand just dropped.`);render();save();
  if(state.pendingLocations.length)showLocationModal();else $('gather').focus();
});
function tick(){const now=performance.now(),dt=Math.max(0,(now-last)/1000);last=now;if(document.hidden||state.ending||state.pendingLocations.length)return;const old=state.total,remaining=state.remaining[state.selected];collect(state,rate(state)*dt);checkChanges(old,remaining);}
function render(){const loc=LOCATIONS[state.selected],remaining=state.remaining[state.selected],ratio=remaining/loc.supply,level=remaining<=0?2:ratio<=.5?1:0;
$('sand-count').textContent=fmt(state.sand);$('rate-count').textContent=fmt(rate(state));$('total-count').textContent=fmt(state.total);$('scene-title').textContent=loc.name;$('scene-badge').textContent=loc.badge;$('scene-caption').textContent=loc.caption;$('remaining').textContent=`${fmt(remaining)} / ${fmt(loc.supply)}`;$('remaining-fill').style.width=`${ratio*100}%`;$('click-power').textContent=`+${clickPower(state)} PER CLICK`;$('gather').disabled=remaining<=0;$('gather').setAttribute('aria-label',remaining<=0?'This location is empty':`Steal sand, ${clickPower(state)} per click`);
const key=`${state.selected}-${level}`;if(sceneKey!==key){$('scene-art').innerHTML=sceneArt(state.selected,level);sceneKey=key;}
UPGRADES.forEach((u,i)=>{const button=$(`up-${i}`),owned=state.owned.includes(i),open=unlocked(state,u.loc);button.disabled=owned||!open||state.sand<upgradeCost(state,i);button.classList.toggle('owned',owned);$(`up-detail-${i}`).textContent=open?u.description:'Unlocks with progress';const cost=$(`up-cost-${i}`);cost.textContent=owned?'OWNED':`◆ ${fmt(upgradeCost(state,i))}`;cost.classList.toggle('owned-label',owned);});
CONTRACTS.forEach((c,i)=>{const button=$(`contract-${i}`),done=state.contracts.includes(i),open=state.total>=c.unlock;button.disabled=done||!open||state.sand<c.cost;button.classList.toggle('done',done);$(`contract-detail-${i}`).textContent=done?'Permit collected':open?'Reward: 1 permit':`Unlock at ${fmt(c.unlock)} total`;$(`contract-price-${i}`).textContent=done?'DONE':`◆ ${fmt(c.cost)}`;});
$('permits').textContent=`${permits(state)} ${permits(state)===1?'PERMIT':'PERMITS'}`;
RESEARCH.forEach((r,i)=>{const button=$(`research-${i}`),max=state.research[i]>=r.max;button.disabled=max||permits(state)<1;$(`research-rank-${i}`).textContent=`${state.research[i]}/${r.max}`;$(`research-price-${i}`).textContent=max?'MAX':'1 PERMIT';});
$('goal-count').innerHTML=`${fmt(state.sand)} <span>/ ${fmt(GOAL)}</span>`;$('goal-fill').style.width=`${Math.min(100,state.sand/GOAL*100)}%`;$('build').disabled=state.sand<GOAL;
}
$('gather').addEventListener('click',()=>{tick();if(state.pendingLocations.length)return;const old=state.total,remaining=state.remaining[state.selected],n=collect(state,clickPower(state));if(n){sound('gather');if(old===0)message('You have acquired sand. Nobody saw anything.');checkChanges(old,remaining);const el=$('floating-gain');el.textContent=`+${fmt(n)}`;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}render();});
$('sound-toggle').addEventListener('click',()=>{soundOn=!soundOn;$('sound-toggle').textContent=soundOn?'♪':'♩';$('sound-toggle').setAttribute('aria-label',soundOn?'Turn sound off':'Turn sound on');});
const endingFrames=[{title:'AT LAST. THE FUTURE.',text:'The sand is yours. The dream is real. Behold: a house made entirely of glass.'},{title:'A ROOM WITH A VIEW.',text:'“Why can I see the toilet from the street?” asks absolutely everyone.'},{title:'A MINOR DESIGN FLAW.',text:'The curtains fell down. It is forty degrees inside. Something has begun to crack.'},{title:'THE DREAM HAS BEEN REALISED.',text:'A bird hits the wall. Another crack. Somewhere, a child wants their sandbox back.'}];
function showEnding(){const f=endingFrames[endingStep];$('ending-art').innerHTML=houseArt(endingStep);$('ending-content').innerHTML=`<h2>${f.title}</h2><p>${f.text}</p>`;$('ending-next').innerHTML=endingStep===endingFrames.length-1?'PLAY AGAIN <span>✦</span>':'CONTINUE <span>✦</span>';}
$('build').addEventListener('click',()=>{tick();if(state.pendingLocations.length)return;if(build(state)){sound('win');endingStep=0;showEnding();$('ending').hidden=false;$('ending-next').focus();}});
$('ending-next').addEventListener('click',()=>{if(endingStep<endingFrames.length-1){endingStep++;sound('buy');showEnding();}else{state=initialState();sceneKey='';last=performance.now();$('ending').hidden=true;message('A dream. A sandbox. Absolutely no permission.');save();render();$('gather').focus();}});
document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden)save();});
window.addEventListener('pagehide',save);
setInterval(()=>{tick();render();},100);setInterval(save,3000);render();showLocationModal();
