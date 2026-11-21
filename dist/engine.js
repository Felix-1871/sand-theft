export const GOAL = 60000;
export const LOCATIONS = [
  { name:'The Sandbox', short:'Playground sandbox', supply:250, unlock:0, icon:'🪣', badge:'THE HUMBLE BEGINNING', caption:'THE SAND IS RIGHT THERE. JUST TAKE IT.', empty:'The children will adapt.' },
  { name:'The Beach', short:'The beach', supply:1500, unlock:100, icon:'⛱️', badge:'A PUBLIC NUISANCE', caption:'A SANDBOX WITH EXCELLENT PUBLIC TRANSPORT LINKS.', empty:'The beach is now a concept.' },
  { name:'The Desert', short:'The desert', supply:10000, unlock:600, icon:'🌵', badge:'BUSINESS IS BOOMING', caption:'FINDERS KEEPERS, SAY THE CAMELS.', empty:'It was mostly sand anyway.' },
  { name:'The Seabed', short:'The seabed', supply:100000, unlock:4000, icon:'🐟', badge:'PERFECTLY NORMAL BEHAVIOUR', caption:'THE FISH HAVE BEEN INFORMED.', empty:'The ocean floor is now an ocean basement.' }
];
export const UPGRADES = [
  {name:'Bucket',cost:20,loc:0,icon:'🪣',description:'+3 sand per click',flavor:'Your pockets have been promoted to management.',click:3},
  {name:'Suspicious Helper',cost:100,loc:0,icon:'🥸',description:'+2 sand per second',flavor:'Asks no questions. Answers even fewer.',rate:2},
  {name:'Wheelbarrow',cost:300,loc:1,icon:'🛒',description:'+10 sand per second',flavor:'A company vehicle.',rate:10},
  {name:'Excavator',cost:1000,loc:2,icon:'🚜',description:'+50 sand per second',flavor:'For delicate playground work.',rate:50},
  {name:'Sand Barge',cost:3000,loc:2,icon:'🚢',description:'+200 sand per second',flavor:'Technically, it floats.',rate:200},
  {name:'Extremely Large Vacuum',cost:10000,loc:3,icon:'🧹',description:'+1,000 sand per second',flavor:'DO NOT USE ON CURTAINS.',rate:1000}
];
export function initialState(){return {sand:0,total:0,remaining:LOCATIONS.map(l=>l.supply),selected:0,owned:[],ending:false};}
export function unlocked(state,index){return state.total>=LOCATIONS[index].unlock;}
export function clickPower(state){return state.owned.includes(0)?3:1;}
export function rate(state){return state.owned.reduce((sum,i)=>sum+(UPGRADES[i]?.rate||0),0);}
export function collect(state,amount){if(state.ending||!Number.isFinite(amount)||amount<=0)return 0;const i=state.selected;const taken=Math.min(amount,state.remaining[i]);state.remaining[i]=Math.max(0,state.remaining[i]-taken);state.sand+=taken;state.total+=taken;return taken;}
export function select(state,index){if(!Number.isInteger(index)||!LOCATIONS[index]||!unlocked(state,index)||state.ending)return false;state.selected=index;return true;}
export function purchase(state,index){const u=UPGRADES[index];if(!u||state.ending||state.owned.includes(index)||!unlocked(state,u.loc)||state.sand<u.cost)return false;state.sand-=u.cost;state.owned.push(index);return true;}
export function build(state){if(state.ending||state.sand<GOAL)return false;state.ending=true;return true;}
