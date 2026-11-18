export const items = {
 herb: {name:'반짝풀',icon:'🌿',price:5},
 pudding: {name:'숲속 푸딩',icon:'🍮',price:12},
 riceball: {name:'호수 주먹밥',icon:'🍙',price:15},
 scale: {name:'세이렌의 비늘',icon:'🪸',price:140},
 breath: {name:'아노코의 숨결',icon:'💠',price:100}
};
export function createInventory(){
 const state={items:{},money:0,quest:'none',collected:0};
 // Remove only the obsolete save from earlier versions. This session stays in memory.
 try{localStorage.removeItem('momonga-save-v1');}catch{}
 const panel=document.querySelector('#inventory'),list=document.querySelector('#inventory-list');
 function save(){render();}
 function render(){document.querySelector('#money').textContent=state.money+' 코인';list.replaceChildren();
  for(const [id,item] of Object.entries(items)){const row=document.createElement('li');row.textContent=`${item.icon} ${item.name} × ${state.items[id]||0}`;list.append(row);}
 }
 document.querySelector('#bag').onclick=()=>{panel.hidden=!panel.hidden;render();};document.querySelector('#close-inventory').onclick=()=>panel.hidden=true;
 render();
 return {state,save,add(id,count=1){if(!items[id]||count<=0)return;state.items[id]=(state.items[id]||0)+count;save();},sell(){let earned=0;for(const [id,item] of Object.entries(items)){if(id==='herb'&&state.quest!=='complete')continue;earned+=(state.items[id]||0)*item.price;state.items[id]=0;}state.money+=earned;save();return earned;}};
}
