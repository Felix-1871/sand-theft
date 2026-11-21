export const GOAL = 5000000;
export const LOCATIONS = [
  { name:'The Sandbox', short:'Playground sandbox', supply:250, unlock:0, icon:'🪣', badge:'THE HUMBLE BEGINNING', caption:'THE SAND IS RIGHT THERE. JUST TAKE IT.', empty:'The children will adapt.' },
  { name:'The Beach', short:'The beach', supply:1500, unlock:100, icon:'⛱️', badge:'A PUBLIC NUISANCE', caption:'A SANDBOX WITH EXCELLENT PUBLIC TRANSPORT LINKS.', empty:'The beach is now a concept.' },
  { name:'The Desert', short:'The desert', supply:10000, unlock:600, icon:'🌵', badge:'BUSINESS IS BOOMING', caption:'FINDERS KEEPERS, SAY THE CAMELS.', empty:'It was mostly sand anyway.' },
  { name:'The Seabed', short:'The seabed', supply:7000000, unlock:4000, icon:'🐟', badge:'PERFECTLY NORMAL BEHAVIOUR', caption:'THE FISH HAVE BEEN INFORMED.', empty:'The ocean floor is now an ocean basement.' }
];
export const UPGRADES = [
  {name:'Bucket',cost:20,loc:0,icon:'🪣',description:'3 sand per click',flavor:'Your pockets have been promoted to management.',click:3},
  {name:'Suspicious Helper',cost:100,loc:0,icon:'🥸',description:'+2 sand per second',flavor:'Asks no questions. Answers even fewer.',rate:2},
  {name:'Wheelbarrow',cost:300,loc:1,icon:'🛒',description:'+10 sand per second',flavor:'A company vehicle.',rate:10},
  {name:'Excavator',cost:1000,loc:2,icon:'🚜',description:'+50 sand per second',flavor:'For delicate playground work.',rate:50},
  {name:'Sand Barge',cost:3000,loc:2,icon:'🚢',description:'+200 sand per second',flavor:'Technically, it floats.',rate:200},
  {name:'Extremely Large Vacuum',cost:10000,loc:3,icon:'🧹',description:'+1,000 sand per second',flavor:'DO NOT USE ON CURTAINS.',rate:1000}
];
export const CONTRACTS = [
  {name:'The sandbox audit',unlock:100,cost:50,flavor:'A very important person needs a bucket. No questions.'},
  {name:'Beachfront paperwork',unlock:600,cost:500,flavor:'The forms demand sand. Do not ask why.'},
  {name:'A discreet delivery',unlock:4000,cost:5000,flavor:'Drop it behind the suspicious-looking dune.'},
  {name:'The mayor’s bunker',unlock:25000,cost:50000,flavor:'Officially, this bunker does not exist.'},
  {name:'International sand summit',unlock:200000,cost:200000,flavor:'The delegates insist on sitting directly on the merchandise.'},
  {name:'A favour for the moon',unlock:1000000,cost:600000,flavor:'The moon is short on sand. Apparently.'},
  {name:'The great sand shortage',unlock:2000000,cost:200000,flavor:'A crisis of our own making is still a crisis.'},
  {name:'The suspicious hourglass',unlock:3000000,cost:300000,flavor:'Someone ordered a very, very large egg timer.'},
  {name:'One last favour',unlock:4000000,cost:400000,flavor:'A glass housewarming gift for the inspector.'}
];
export const RESEARCH = [
  {name:'Scoop School',icon:'🖐️',description:'+15 sand per click per rank',max:4,flavor:'A certified diploma in taking handfuls.'},
  {name:'Machine Union',icon:'⚙️',description:'+20% machine output per rank',max:4,flavor:'Turns out machines work harder with a union.'},
  {name:'Creative Accounting',icon:'📋',description:'15% cheaper equipment per rank',max:4,flavor:'The numbers have been asked to cooperate.'}
];
export function initialState(){return {version:3,sand:0,total:0,remaining:LOCATIONS.map(l=>l.supply),selected:0,owned:[],contracts:[],research:[0,0,0],pendingLocations:[],ending:false};}
export function migrateState(saved){
  if(!saved||!Array.isArray(saved.remaining)||saved.remaining.length!==LOCATIONS.length||!Array.isArray(saved.owned)||!Number.isFinite(saved.sand)||!Number.isFinite(saved.total)||saved.sand<0||saved.total<0||!Number.isInteger(saved.selected)||!LOCATIONS[saved.selected]||!saved.owned.every(n=>Number.isInteger(n)&&UPGRADES[n]))return initialState();
  const state={...initialState(),...saved,ending:false,version:3};
  if(!saved.version){const oldSupplies=[250,1500,10000,100000];if(!saved.remaining.every((n,i)=>Number.isFinite(n)&&n>=0&&n<=oldSupplies[i]))return initialState();state.remaining=LOCATIONS.map((l,i)=>l.supply-(oldSupplies[i]-saved.remaining[i]));state.contracts=[];state.research=[0,0,0];}
  if(saved.version!==3&&Array.isArray(state.pendingLocations)&&state.pendingLocations.length===0){const lastUnlocked=LOCATIONS.reduce((last,l,i)=>state.total>=l.unlock?i:last,0);if(lastUnlocked>state.selected&&state.remaining[lastUnlocked]>0)state.pendingLocations=[lastUnlocked];}
  if(!state.remaining.every((n,i)=>Number.isFinite(n)&&n>=0&&n<=LOCATIONS[i].supply)||!Array.isArray(state.contracts)||!state.contracts.every((n,i,a)=>Number.isInteger(n)&&CONTRACTS[n]&&a.indexOf(n)===i)||!Array.isArray(state.research)||state.research.length!==RESEARCH.length||!state.research.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=RESEARCH[i].max)||state.research.reduce((a,b)=>a+b,0)>state.contracts.length||!Array.isArray(state.pendingLocations)||!state.pendingLocations.every((n,i,a)=>Number.isInteger(n)&&n>0&&LOCATIONS[n]&&state.total>=LOCATIONS[n].unlock&&(i===0||a[i-1]<n)))return initialState();
  return state;
}
export function newlyUnlocked(before,after){return LOCATIONS.map((location,index)=>({location,index})).filter(({location,index})=>index>0&&before<location.unlock&&after>=location.unlock).map(({index})=>index);}
export function unlocked(state,index){return !!LOCATIONS[index]&&state.total>=LOCATIONS[index].unlock;}
export function clickPower(state){return (state.owned.includes(0)?3:1)+state.research[0]*15;}
export function rate(state){return state.owned.reduce((sum,i)=>sum+(UPGRADES[i]?.rate||0),0)*(1+state.research[1]*.2);}
export function upgradeCost(state,index){return Math.ceil(UPGRADES[index].cost*(1-state.research[2]*.15));}
export function permits(state){return state.contracts.length-state.research.reduce((a,b)=>a+b,0);}
export function collect(state,amount){if(state.ending||!Number.isFinite(amount)||amount<=0)return 0;const i=state.selected;const taken=Math.min(amount,state.remaining[i]);state.remaining[i]=Math.max(0,state.remaining[i]-taken);state.sand+=taken;state.total+=taken;return taken;}
export function select(state,index){if(!Number.isInteger(index)||!LOCATIONS[index]||!unlocked(state,index)||state.ending)return false;state.selected=index;return true;}
export function purchase(state,index){const u=UPGRADES[index];if(!u||state.ending||state.owned.includes(index)||!unlocked(state,u.loc)||state.sand<upgradeCost(state,index))return false;state.sand-=upgradeCost(state,index);state.owned.push(index);return true;}
export function completeContract(state,index){const c=CONTRACTS[index];if(!c||state.ending||state.contracts.includes(index)||state.total<c.unlock||state.sand<c.cost)return false;state.sand-=c.cost;state.contracts.push(index);return true;}
export function research(state,index){const r=RESEARCH[index];if(!r||state.ending||permits(state)<1||state.research[index]>=r.max)return false;state.research[index]++;return true;}
export function build(state){if(state.ending||state.sand<GOAL)return false;state.ending=true;return true;}
