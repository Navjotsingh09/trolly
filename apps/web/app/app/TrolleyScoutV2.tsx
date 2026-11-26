'use client';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,BadgePercent,Barcode,Bell,Check,CheckCheck,ChevronDown,ChevronRight,ClipboardCheck,Copy,Heart,Info,ListPlus,MapPin,Minus,Moon,Plus,Search,Share2,ShoppingBag,ShoppingBasket,Sparkles,Store,Trash2,X} from 'lucide-react';
import {bestSplit,catalogue,categories,compareBasket,historyFor,loyaltySchemes,money,priceFor,stores,validatedShareItems} from '@trolleyscout/core/phase1';
import type {ListEntry,ListItems,Product,BasketRow,Tier} from '@trolleyscout/core/phase1';
import './v2.css';
import MediaAsset from './MediaAsset';
type Tab='discover'|'lists'|'compare'|'you';
type CustomItem={id:string;name:string};
type GroceryList={id:string;name:string;items:ListItems;checked:Record<string,boolean>;custom:CustomItem[]};
type Notice={label:string;undo?:{lists:GroceryList[];activeId:string};priority:number};
type VerifiedPostcode={valid:true;postcode:string;district:string|null;ward:string|null;region:string|null;country:string|null;outcode:string|null};
const aisleOrder=['Fruit & veg','Bakery','Dairy','Meat & fish','Frozen','Cupboard','Drinks','Household','Toiletries','Baby','Custom'];
const stableCustom=(value:unknown,index:number):CustomItem|null=>{if(typeof value==='string')return {id:'custom-legacy-'+index+'-'+value.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,24),name:value.slice(0,70)};if(value&&typeof value==='object'&&typeof (value as CustomItem).name==='string'){const item=value as CustomItem;return {id:typeof item.id==='string'&&/^custom-[a-zA-Z0-9-]{1,100}$/.test(item.id)?item.id:'custom-legacy-'+index,name:item.name.slice(0,70)}}return null};
const normalizeCustom=(raw:unknown):CustomItem[]=>Array.isArray(raw)?raw.slice(0,40).map(stableCustom).filter((x):x is CustomItem=>x!==null):[];
const checkedLabel=(days:number)=>days===0?'Demo checked today':days===1?'Demo checked 1 day ago':'Demo checked '+days+' days ago';
const initial:ListItems={milk:{quantity:1,tier:'Own-label',variant:'standard'},bread:{quantity:1,tier:'Own-label',variant:'standard'},eggs:{quantity:1,tier:'Own-label',variant:'standard'},bananas:{quantity:1,tier:'Own-label',variant:'standard'},pasta:{quantity:1,tier:'Own-label',variant:'standard'}};
const demoList:GroceryList={id:'weekly',name:'Weekly essentials',items:initial,checked:{},custom:[]};
const key='trolleyscout-phase1';
function postcodeFormat(s:string){const raw=s.replace(/\s/g,'').toUpperCase();return raw.length>3?raw.slice(0,-3)+' '+raw.slice(-3):raw;}
function validPostcode(s:string){return !s.trim()||/^(?:GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test(s.trim())}
function shareEncode(list:GroceryList){const payload=JSON.stringify({name:list.name,items:list.items,custom:list.custom});const b=new TextEncoder().encode(payload);return btoa(Array.from(b,c=>String.fromCharCode(c)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function shareDecode(s:string):GroceryList|null{try{if(s.length>15000)return null;const bin=atob(s.replace(/-/g,'+').replace(/_/g,'/'));const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));const raw=JSON.parse(new TextDecoder().decode(bytes));if(!raw||typeof raw.name!=='string')return null;const items=validatedShareItems(raw.items),custom=normalizeCustom(raw.custom);if(!Object.keys(items).length&&!custom.length)return null;return {id:'import-'+Date.now(),name:(raw.name.trim().slice(0,34)||'Shopping list')+' (shared)',items,custom,checked:{}};}catch{return null}}
const tiers:Tier[]=['Value','Own-label','Branded'];
const showUnit=(p:Product,pence:number)=>money(pence)+'/'+(p.unit==='item'?'item':p.unit==='kg'?'kg':'litre');
export default function TrolleyScout(){
 const [tab,setTab]=useState<Tab>('discover'),[lists,setLists]=useState<GroceryList[]>([demoList]),[activeId,setActiveId]=useState('weekly');
 const [loyalty,setLoyalty]=useState<string[]>([]),[selectedStores,setSelectedStores]=useState<string[]>(stores.map(x=>x.id));
 const [budget,setBudget]=useState(''),[postcode,setPostcode]=useState(''),[night,setNight]=useState(false);
 const [postcodeInfo,setPostcodeInfo]=useState<VerifiedPostcode|null>(null),[postcodeError,setPostcodeError]=useState(''),[postcodeChecking,setPostcodeChecking]=useState(false),[postcodeCheckKey,setPostcodeCheckKey]=useState(0);
 const [query,setQuery]=useState(''),[category,setCategory]=useState('All'),[productId,setProductId]=useState<string|null>(null),[storeId,setStoreId]=useState<string|null>(null);
 const [remoteCatalogue,setRemoteCatalogue]=useState<Product[]|null>(null);
 const [shopMode,setShopMode]=useState(false),[alerts,setAlerts]=useState<string[]>([]),[editor,setEditor]=useState<'new'|'rename'|null>(null),[nameDraft,setNameDraft]=useState('');
 const [notice,setNotice]=useState<Notice|null>(null),[ready,setReady]=useState(false),[info,setInfo]=useState(false);
 const contentRef=useRef<HTMLDivElement>(null),lastFocus=useRef<HTMLElement|null>(null);
 const viewCatalogue=remoteCatalogue??catalogue;
 const postcodeConfirmed=postcodeInfo!==null&&postcodeInfo.postcode.replace(/\s/g,'')===postcode.replace(/\s/g,'').toUpperCase();
 const list=lists.find(x=>x.id===activeId)||lists[0];
 const items=list.items;
 const matches=useMemo(()=>compareBasket(items,{stores:selectedStores,loyalty}),[items,selectedStores,loyalty]);
 const best=matches.find(x=>x.complete);
 const worst=matches.filter(x=>x.complete).at(-1);
 const split=useMemo(()=>bestSplit(items,{stores:selectedStores,loyalty}),[items,selectedStores,loyalty]);
 const units=Object.values(items).reduce((a,b)=>a+b.quantity,0);
 const productCount=Object.keys(items).length;
 const selected=productId?viewCatalogue.find(x=>x.id===productId):undefined;
 const store=storeId?matches.find(x=>x.storeId===storeId):undefined;
 const budgetPence=budget?Math.round(Number(budget)*100):null;
 const available=viewCatalogue.filter(p=>(category==='All'||p.category===category)&&p.name.toLowerCase().includes(query.trim().toLowerCase()));
 const unmatched=query.trim().length>0&&!viewCatalogue.some(p=>p.name.toLowerCase().includes(query.trim().toLowerCase()));
 const cheapestQuote=(id:string,tier:Tier='Own-label',variant:string='standard')=>stores.filter(x=>selectedStores.includes(x.id)).map(store=>({store,quote:priceFor(id,store.id,{tier,variant,loyalty})})).filter((x):x is {store:typeof stores[number];quote:NonNullable<ReturnType<typeof priceFor>>}=>x.quote!==null).sort((a,b)=>a.quote.effectivePence-b.quote.effectivePence||stores.findIndex(s=>s.id===a.store.id)-stores.findIndex(s=>s.id===b.store.id))[0]??null;
 const selectedDetail=selected?cheapestQuote(selected.id,items[selected.id]?.tier||'Own-label',items[selected.id]?.variant||'standard'):null;

 useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw){const p=JSON.parse(raw);
  if(Array.isArray(p.lists)&&p.lists.length){const valid=p.lists.slice(0,20).map((x:any,i:number)=>({id:typeof x.id==='string'?x.id:'list-'+i,name:String(x.name||'Shopping list').slice(0,45),items:validatedShareItems(x.items),checked:x.checked&&typeof x.checked==='object'?x.checked:{},custom:normalizeCustom(x.custom)}));setLists(valid);setActiveId(valid.some((v:GroceryList)=>v.id===p.activeId)?p.activeId:valid[0].id);}
  if(Array.isArray(p.loyalty))setLoyalty(p.loyalty.filter((x:unknown)=>typeof x==='string'&&loyaltySchemes.some(s=>s.id===x)));
  if(Array.isArray(p.selectedStores))setSelectedStores(stores.filter(s=>p.selectedStores.includes(s.id)).map(s=>s.id));
  if(typeof p.budget==='string')setBudget(p.budget);
  if(typeof p.postcode==='string'&&validPostcode(p.postcode))setPostcode(postcodeFormat(p.postcode));
  if(Array.isArray(p.alerts))setAlerts(p.alerts.filter((x:unknown)=>typeof x==='string'));
  setNight(!!p.night);
 }else{const old=localStorage.getItem('trolleyscout-preview');if(old){const p=JSON.parse(old);if(p.basket){const items:ListItems={};for(const [id,q]of Object.entries(p.basket)){if(viewCatalogue.some(x=>x.id===id)&&Number.isInteger(q)&&Number(q)>0)items[id]={quantity:Number(q),tier:'Own-label',variant:'standard'};}if(Object.keys(items).length)setLists([{...demoList,items}]);}if(typeof p.postcode==='string')setPostcode(postcodeFormat(p.postcode));setNight(!!p.night);}}
  const shared=new URLSearchParams(location.search).get('list');if(shared){const incoming=shareDecode(shared);if(incoming){setLists(old=>[...old,incoming]);setActiveId(incoming.id);setTab('lists');setNotice({label:'Shared list imported',priority:0});}else setNotice({label:'That list link couldn’t be opened',priority:0});history.replaceState(null,'',location.pathname);}
 }catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(key,JSON.stringify({lists,activeId,loyalty,selectedStores,budget,postcode:postcodeConfirmed?postcodeInfo!.postcode:'',night,alerts}));}catch{}},[ready,lists,activeId,loyalty,selectedStores,budget,postcode,postcodeConfirmed,postcodeInfo,night,alerts]);
 useEffect(()=>{
  if(!ready)return;
  const candidate=postcode.trim().toUpperCase().replace(/\s+/g,'');
  if(!candidate){setPostcodeInfo(null);setPostcodeError('');setPostcodeChecking(false);return;}
  if(!validPostcode(candidate)){setPostcodeInfo(null);setPostcodeError('Enter a full UK postcode, e.g. B67 7BX.');setPostcodeChecking(false);return;}
  if(postcodeConfirmed){setPostcodeError('');setPostcodeChecking(false);return;}
  const controller=new AbortController();
  setPostcodeChecking(true);setPostcodeError('');
  const timeout=window.setTimeout(async()=>{
   try{
    const response=await fetch('/api/postcode?postcode='+encodeURIComponent(candidate),{signal:controller.signal});
    const data=await response.json();
    if(controller.signal.aborted)return;
    if(!response.ok||data.valid!==true){setPostcodeInfo(null);setPostcodeError(typeof data.error==='string'?data.error:'Postcode not found.');return;}
    setPostcodeInfo(data as VerifiedPostcode);setPostcodeError('');
   }catch(e){if(!controller.signal.aborted){setPostcodeInfo(null);setPostcodeError('Could not check the postcode. Please try again.');}}
   finally{if(!controller.signal.aborted)setPostcodeChecking(false);}
  },postcodeCheckKey?80:450);
  return()=>{controller.abort();window.clearTimeout(timeout)};
 },[postcode,ready,postcodeCheckKey,postcodeConfirmed]);
 useEffect(()=>{const controller=new AbortController();fetch('/api/catalogue',{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error('Catalogue unavailable');return r.json()}).then(data=>{if(Array.isArray(data.catalogue)&&data.catalogue.length>=60&&data.metadata?.source==='fictional-demonstration'){setRemoteCatalogue(data.catalogue as Product[])}}).catch(()=>{});return ()=>controller.abort()},[]);
 useEffect(()=>{if(!notice)return;const timeout=window.setTimeout(()=>setNotice(null),6000);return()=>window.clearTimeout(timeout)},[notice]);
 useEffect(()=>{if(!productId&&!storeId&&!info)return;function close(e:KeyboardEvent){if(e.key==='Escape'){setProductId(null);setStoreId(null);setInfo(false);lastFocus.current?.focus()}}window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[productId,storeId,info]);
 const change=(update:(current:GroceryList)=>GroceryList)=>setLists(old=>old.map(x=>x.id===list.id?update(x):x));
 const setItems=(fn:(prev:ListItems)=>ListItems)=>change(l=>({...l,items:fn(l.items)}));
 function qty(id:string,n:number){const prev=items[id]?.quantity||0;const next=Math.max(0,Math.min(99,prev+n));if(prev>0&&!next)showUndo('Product removed');setItems(old=>{const result={...old};if(!next)delete result[id];else result[id]={quantity:next,tier:old[id]?.tier||'Own-label',variant:old[id]?.variant||'standard'};return result;});}
 function patch(id:string,key:'tier'|'variant',value:string){setItems(old=>({...old,[id]:{quantity:old[id]?.quantity||1,tier:key==='tier'?value as Tier:old[id]?.tier||'Own-label',variant:key==='variant'?value:old[id]?.variant||'standard'}}));}
 function selectTab(next:Tab){setTab(next);contentRef.current?.scrollTo({top:0,behavior:'auto'})}
 function modal(open:(id:string)=>void,id:string){lastFocus.current=document.activeElement as HTMLElement;open(id)}
 function closeModal(){setProductId(null);setStoreId(null);setInfo(false);lastFocus.current?.focus()}
 function toggle(id:string,arr:string[],setter:(a:string[])=>void){setter(stores.some(s=>s.id===id)?stores.filter(s=>(arr.includes(s.id)) !== (s.id===id)).map(s=>s.id):arr.includes(id)?arr.filter(x=>x!==id):[...arr,id])}
 function snack(text:string){setNotice(old=>old?.priority===1?old:{label:text,priority:0})}
 function showUndo(label:string){setNotice({label,undo:{lists,activeId},priority:1})}
 function newList(){const name=nameDraft.trim().slice(0,45);if(!name)return;const id='list-'+Date.now();setLists(old=>[...old,{id,name,items:{},checked:{},custom:[]}]);setActiveId(id);setEditor(null);setNameDraft('');setShopMode(false);}
 function renameList(){const name=nameDraft.trim().slice(0,45);if(!name)return;change(l=>({...l,name}));setEditor(null);setNameDraft('')}
 function duplicate(){const id='list-'+Date.now();setLists(old=>[...old,{...list,id,name:list.name+' copy',checked:{}}]);setActiveId(id);snack('List duplicated')}
 function deleteList(){if(lists.length===1){snack('Keep at least one list');return;}showUndo('List deleted');setLists(lists.filter(l=>l.id!==list.id));setActiveId(lists.find(l=>l.id!==list.id)!.id)}
 function clearList(){showUndo('Shopping list cleared');change(l=>({...l,items:{},custom:[],checked:{}}));}
 function checked(id:string){change(l=>({...l,checked:{...l.checked,[id]:!l.checked[id]}}))}
 function removeCustom(id:string){change(l=>{const next={...l.checked};delete next[id];return {...l,custom:l.custom.filter(x=>x.id!==id),checked:next}})}
 function finishShop(){change(l=>({...l,checked:{}}));setShopMode(false);snack('Shop finished; ticks cleared')}
 async function share(){const url=location.origin+'/app?list='+shareEncode(list);try{if(navigator.share){await navigator.share({title:'TrolleyScout — '+list.name,url});return}await navigator.clipboard.writeText(url);snack('Share link copied')}catch(e){if((e as Error).name==='AbortError')return;try{await navigator.clipboard.writeText(url);snack('Share link copied')}catch{snack('Could not copy link')}}}
 const heading=(eyebrow:string,title:string,body:string)=><header className="v2-heading"><span className="v2-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{body}</p></header>;
 function productRow(p:Product,compact=false){
  const e=items[p.id],lowest=cheapestQuote(p.id,e?.tier||'Own-label',e?.variant||'standard');
  return <article key={p.id} className="v2-product">
   <button className="v2-product-info" onClick={()=>modal(setProductId,p.id)} aria-label={'View '+p.name+' prices'}><MediaAsset id={p.id} kind="product" alt={p.name+' photo'} fallback={p.emoji}/><span><strong>{p.name}</strong><small>{e?.tier||'Own-label'} · {p.variants.find(v=>v.id===(e?.variant||'standard'))?.label||p.pack}</small>{compact&&lowest&&<small>From {money(lowest.quote.effectivePence)} at {lowest.store.name} · demo</small>}</span></button>
   <div className="v2-counter"><button aria-label={'Remove one '+p.name} onClick={()=>qty(p.id,-1)}><Minus size={17}/></button><b>{e?.quantity||0}</b><button aria-label={'Add one '+p.name} onClick={()=>qty(p.id,1)}><Plus size={17}/></button></div>
  </article>;
 }
 const lineDetails=(line:BasketRow['lines'][number])=>{
  const {product:p,entry:e,quote:q}=line;const usedLoyalty=!!q&&q.loyaltyPricePence!==null&&loyalty.includes(store!.storeId);const saving=e.tier==='Value'?0:(q?.effectivePence||0)-(priceFor(p.id,store!.storeId,{tier:'Value',variant:e.variant,loyalty})?.effectivePence||0);
  return <div key={p.id} className="v2-breakdown-line"><MediaAsset id={p.id} kind="product" alt={p.name+' photo'} fallback={p.emoji}/><div className="v2-line-text"><strong>{p.name}</strong><small>{e.quantity} × {q?.packSize||p.pack} · {e.tier}</small>{q&&<small>{showUnit(p,q.unitPricePence)} · {q.daysOld>7?'May be out of date':checkedLabel(q.daysOld)}</small>}{usedLoyalty&&<small className="v2-loyalty-tag">{q.loyaltyScheme} price · {money(q.effectivePence)} (shelf {money(q.shelfPricePence)})</small>}{!q&&<small>Not sold here</small>}{saving>0&&<button className="v2-swap" onClick={()=>{patch(p.id,'tier','Value');snack('Swapped to Value tier')}}>Swap to Value, save {money(saving*e.quantity)} <ArrowRight size={12}/></button>}</div><b>{q?money(q.effectivePence*e.quantity):'Not sold here'}</b></div>;
 };
 const num=Number(budget),hasBudget=budget.trim()!==''&&Number.isFinite(num)&&num>=0&&num<=10000;
 return <main className={'v2-page '+(night?'v2-dark':'')}><div className="v2-phone">
  <header className="v2-top"><b>trolleyscout<span>.</span></b><small>{remoteCatalogue?'● NEON DEMO DATA':'● DEMO PRICES'}</small></header>
  <div className="v2-scroll" ref={contentRef}>
   {tab==='discover'&&<>
    {heading('BETTER EVERYDAY SHOPPING','Shop smarter.','Make one list. See what your shopping could cost.')}
    <div className="v2-hero"><div className="v2-hero-orb"/><span>YOUR SHOPPING LIST</span><strong>{productCount} products<br/>{units} total units</strong><p>Compare eight fictional supermarket price sets, personalised to your cards.</p><button onClick={()=>selectTab('compare')}>Compare my basket <ArrowUpRight size={18}/></button></div>
    <div className="v2-section-head"><h2>Discover groceries</h2><span>{viewCatalogue.length} products</span></div>
    <label className="v2-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search for milk, chicken, rice…" aria-label="Search groceries"/></label>
    <div className="v2-chips">{['All',...categories].map(c=><button key={c} onClick={()=>setCategory(c)} className={category===c?'v2-active':''}>{c}</button>)}</div>
    {unmatched&&<button className="v2-addcustom" onClick={()=>{const item=query.trim().slice(0,70);if(list.custom.some(c=>c.name.toLowerCase()===item.toLowerCase())){snack('Already in your list');return;}change(l=>({...l,custom:[...l.custom,{id:'custom-'+crypto.randomUUID(),name:item}]}));setQuery('');snack('Custom item added — no price comparison')}}><Plus size={18}/> Add “{query.trim().slice(0,50)}” as a custom item</button>}
    <div className="v2-products">{available.map(p=>productRow(p,true))}</div>
   </>}
   {tab==='lists'&&<>
    {heading('SHOPPING MADE SIMPLE','My lists.','Save more than one list and keep track as you shop.')}
    <div className="v2-list-tools"><select aria-label="Current shopping list" value={activeId} onChange={e=>{setActiveId(e.target.value);setShopMode(false)}}>{lists.map(l=><option value={l.id} key={l.id}>{l.name}</option>)}</select><button aria-label="New list" onClick={()=>{setNameDraft('');setEditor('new')}}><Plus size={20}/></button><button aria-label="Rename list" onClick={()=>{setNameDraft(list.name);setEditor('rename')}}><ListPlus size={19}/></button></div>
    {editor&&<div className="v2-editor"><input autoFocus aria-label="List name" placeholder="List name" maxLength={45} value={nameDraft} onChange={e=>setNameDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')(editor==='new'?newList:renameList)()}}/><button onClick={editor==='new'?newList:renameList}>Save</button><button onClick={()=>setEditor(null)} aria-label="Cancel"><X size={17}/></button></div>}
    <div className="v2-list-actions"><button onClick={duplicate}><Copy size={17}/> Duplicate</button><button onClick={share}><Share2 size={17}/> Share</button><button onClick={deleteList}><Trash2 size={17}/> Delete</button></div>
    <div className="v2-summary"><div><span>IN YOUR TROLLEY</span><strong>{productCount} products</strong><small>{units} total units · {list.custom.length} custom</small></div><ShoppingBag size={36}/></div>
    <div className="v2-section-head"><h2>{shopMode?'Shop mode':'Your essentials'}</h2><button className="v2-text-btn" onClick={()=>selectTab('discover')}>Add products <Plus size={16}/></button></div>
    {shopMode?<><p className="v2-muted">Tick off items as you shop. Completed items move to the bottom.</p><button className="v2-secondary" onClick={()=>setShopMode(false)}> <ArrowLeft size={18}/> Back to list — keep ticks</button>{(()=>{const all=[...viewCatalogue.filter(p=>items[p.id]).map(p=>({id:p.id,name:p.name,category:p.category,emoji:p.emoji,quantity:items[p.id].quantity,isCustom:false})),...list.custom.map(c=>({id:c.id,name:c.name,category:'Custom',emoji:'📝',quantity:0,isCustom:true}))];return all.sort((a,b)=>Number(!!list.checked[a.id])-Number(!!list.checked[b.id])||aisleOrder.indexOf(a.category)-aisleOrder.indexOf(b.category)||a.name.localeCompare(b.name)).map((p,i,ordered)=>{const done=!!list.checked[p.id];const prev=ordered[i-1];const heading=!prev||!!list.checked[prev.id]!==done||prev.category!==p.category;return <React.Fragment key={p.id}>{heading&&<h3 className="v2-aisle">{done?'Completed · ':''}{p.category}</h3>}<button role="checkbox" aria-checked={done} className={'v2-checkrow '+(done?'v2-checked':'')} onClick={()=>checked(p.id)}><span className="v2-checkicon">{done?<Check size={17}/>:null}</span><span><strong>{p.name}</strong><small>{p.isCustom?'Your item':p.quantity+' units'}</small></span></button></React.Fragment>})})()}<button className="v2-primary" onClick={finishShop}>Finish shop <CheckCheck size={19}/></button></>:
    <>{viewCatalogue.filter(p=>items[p.id]).map(p=><div className="v2-listitem" key={p.id}>{productRow(p)}<div className="v2-variants"><label>Tier<select aria-label={p.name+' brand tier'} value={items[p.id].tier} onChange={e=>patch(p.id,'tier',e.target.value)}>{tiers.map(t=><option key={t}>{t}</option>)}</select></label>{p.variants.length>1&&<label>Pack<select aria-label={p.name+' pack size'} value={items[p.id].variant} onChange={e=>patch(p.id,'variant',e.target.value)}>{p.variants.map(v=><option value={v.id} key={v.id}>{v.label}</option>)}</select></label>}</div></div>)}
    {list.custom.map(custom=><div className="v2-custom" key={custom.id}><span>📝</span><div><strong>{custom.name}</strong><small>Not price-compared</small></div><button aria-label={'Remove '+custom.name} onClick={()=>removeCustom(custom.id)}><X size={18}/></button></div>)}
    {!productCount&&!list.custom.length&&<p className="v2-empty">Your list is empty. Add a few groceries in Explore.</p>}
    {(productCount>0||list.custom.length>0)&&<><button className="v2-primary" onClick={()=>setShopMode(true)}>Start shopping <ClipboardCheck size={19}/></button><button className="v2-secondary" onClick={()=>selectTab('compare')}>Compare my basket <ArrowRight size={19}/></button><button className="v2-muted-action" onClick={clearList}>Clear shopping list</button></>}
    </>}
   </>}
   {tab==='compare'&&<>
    {heading('WHOLE BASKET COMPARISON','Compare stores.','Your prices, your loyalty cards, your supermarket choices.')}
    <div className="v2-best"><span>LOWEST COMPLETE DEMO BASKET</span><strong>{best?money(best.totalPence):'—'}</strong><small>{best?best.name+' · '+best.matched+'/'+best.required+' products matched':'No complete basket'}</small>{best&&worst&&worst.totalPence>best.totalPence&&<b>Example difference {money(worst.totalPence-best.totalPence)}</b>}</div>
    {hasBudget&&best&&<div className={'v2-budget '+(best.totalPence>Math.round(num*100)?'v2-over':'')}>{money(Math.abs(Math.round(num*100)-best.totalPence))} {best.totalPence>Math.round(num*100)?'over':'under'} weekly budget</div>}
    {split?.visible&&<div className="v2-split"><Sparkles size={24}/><div><strong>Two shops could save {money(split.savingsPence)}</strong><p>{split.names.join(' + ')} = {money(split.totalPence)}. Worth considering if both are on your route.</p><details><summary>See item assignments</summary>{split.assignments.map(x=><div key={x.id}>{viewCatalogue.find(p=>p.id===x.id)?.name}: {stores.find(s=>s.id===x.storeId)?.name}, {money(x.pricePence)}</div>)}</details></div></div>}
    <div className="v2-section-head"><h2>Supermarket ranking</h2><span>{matches.filter(x=>x.complete).length} complete</span></div>
    <p className="v2-muted">{matches.some(x=>!x.complete&&x.required>0)?'“Partial only” means some products have no price. That total is not a full-basket comparison.':'Try adding cherry tomatoes — Iceland will have an incomplete demo basket.'}</p>
    {matches.length?matches.map((r,i)=><button key={r.storeId} className={'v2-store '+(i===0&&r.complete?'v2-winner':'')} onClick={()=>modal(setStoreId,r.storeId)}><MediaAsset id={r.storeId} kind="logo" alt={r.name+' logo'} fallback={r.name[0]}/><span className="v2-store-text"><strong>{r.name}{i===0&&r.complete&&<em>BEST</em>}</strong><small>{r.matched}/{r.required} matched{r.complete?'':' · incomplete'}</small>{r.withoutLoyaltyPence!==r.totalPence&&<small>With {r.scheme}: {money(r.totalPence)} · without {money(r.withoutLoyaltyPence)}</small>}</span><span className="v2-store-price"><strong>{money(r.totalPence)}</strong>{!r.complete&&<small>Partial only</small>}</span><ChevronRight size={18}/></button>):<p className="v2-empty">Choose at least one store in You to see prices.</p>}
    <p className="v2-disclaimer">All prices, loyalty discounts, timestamps and histories are fictional demonstrations. No retailer prices are live. <a href="/credits" target="_blank" rel="noopener noreferrer">Photo credits</a></p>
   </>}
   {tab==='you'&&<>
    {heading('PERSONALISED COMPARISONS','Your choices.','Choose the cards and supermarkets that matter to you.')}
    <section className="v2-panel"><h2><BadgePercent size={20}/> My loyalty cards</h2><p>Only apply example member prices when you have the card.</p>{loyaltySchemes.map(s=><label className="v2-toggle" key={s.id}><span>{s.name}</span><input type="checkbox" checked={loyalty.includes(s.id)} onChange={()=>toggle(s.id,loyalty,setLoyalty)}/><i/></label>)}</section>
    <section className="v2-panel"><h2><Store size={20}/> My stores</h2><p>Only include supermarkets you can actually visit.</p>{stores.map(s=><label className="v2-toggle" key={s.id}><MediaAsset id={s.id} kind="logo" alt={s.name+' logo'} fallback={s.name[0]}/><span>{s.name}</span><input type="checkbox" checked={selectedStores.includes(s.id)} onChange={()=>{if(selectedStores.length===1&&selectedStores.includes(s.id)){snack('Choose at least one supermarket');return}toggle(s.id,selectedStores,setSelectedStores)}}/><i/></label>)}</section>
    <section className="v2-panel"><h2><ShoppingBasket size={20}/> Weekly budget</h2><label className="v2-field">Your budget (£)<input type="number" inputMode="decimal" step="0.01" min="0" max="10000" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g. 65.00"/></label>{budget&&(!Number.isFinite(num)||num<0||num>10000)&&<p className="v2-invalid">Enter a budget between £0 and £10,000.</p>}</section>
    <section className="v2-panel"><h2><MapPin size={20}/> Shopping postcode</h2><p>Check your UK postcode to confirm your shopping area. Local supermarket prices are not yet connected.</p><label className="v2-field">UK postcode<input value={postcode} maxLength={10} autoComplete="postal-code" aria-invalid={!!postcodeError||!!postcode.trim()&&!validPostcode(postcode)} aria-describedby="postcode-status" onChange={e=>{setPostcode(e.target.value.toUpperCase());setPostcodeInfo(null);setPostcodeError('')}} onBlur={()=>{if(validPostcode(postcode))setPostcode(postcodeFormat(postcode))}} placeholder="e.g. B67 7BX" aria-label="Shopping postcode"/></label><button className="v2-postcode-check" disabled={!postcode.trim()||!validPostcode(postcode)||postcodeChecking} onClick={()=>setPostcodeCheckKey(n=>n+1)}>{postcodeChecking?'Checking postcode…':postcodeConfirmed?'Check again':'Check postcode'}</button><div id="postcode-status" aria-live="polite">{postcodeChecking&&<p className="v2-postcode-feedback">Checking against UK postcode records…</p>}{!postcodeChecking&&postcodeError&&<p className="v2-invalid" role="alert">{postcodeError}</p>}{!postcodeChecking&&postcodeConfirmed&&<div className="v2-postcode-success"><strong>✓ Postcode recognised: {postcodeInfo!.postcode}</strong><span>{[postcodeInfo!.ward,postcodeInfo!.district,postcodeInfo!.region||postcodeInfo!.country].filter((x,i,a)=>x&&a.indexOf(x)===i).join(' · ')}</span><small>Area confirmed. Prices are still national fictional examples.</small></div>}</div></section>
    <section className="v2-panel"><h2><Moon size={20}/> Appearance and alerts</h2><label className="v2-toggle"><span>Dark mode</span><input type="checkbox" checked={night} onChange={()=>setNight(x=>!x)}/><i/></label><p>{alerts.length} price drop alert{alerts.length===1?'':'s'} saved locally. No notifications are sent yet.</p></section>
    <section className="v2-panel"><h2><Sparkles size={20}/> Membership</h2><p>Our 1p/month membership is an idea for the future. Subscriptions and payments are not enabled in this demo.</p></section>
   </>}
  </div>
  <nav className="v2-nav" aria-label="TrolleyScout app navigation">
   {([{id:'discover',label:'Explore',icon:Search},{id:'lists',label:'My list',icon:ShoppingBasket},{id:'compare',label:'Compare',icon:Store},{id:'you',label:'You',icon:Heart}] as const).map(x=><button key={x.id} aria-current={tab===x.id?'page':undefined} onClick={()=>selectTab(x.id)}><x.icon size={21}/><span>{x.label}</span>{x.id==='lists'&&productCount>0&&<b className="v2-list-badge">{productCount}</b>}</button>)}
  </nav>
 </div>
 {(store||selected||info)&&<div className="v2-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeModal()}}><section className="v2-sheet" role="dialog" aria-modal="true" aria-label={store?'Basket breakdown':selected?'Product prices':'How it works'}>
  <header><div><span className="v2-eyebrow">FICTIONAL PRICE DEMO</span><h2>{store?.name||selected?.name||'About these prices'}</h2></div><button aria-label="Close panel" onClick={closeModal}><X size={22}/></button></header>
  {store&&<><p className="v2-muted">{store.matched}/{store.required} products priced · {store.complete?'Complete basket':'Incomplete — partial total only'}</p><div className="v2-sheet-scroll">{store.lines.map(lineDetails)}</div><div className="v2-total"><span>{store.complete?'Total':'Matched items only'}</span><strong>{money(store.totalPence)}</strong></div>{store.withoutLoyaltyPence!==store.totalPence&&<p className="v2-muted">With {store.scheme}: {money(store.totalPence)} · without: {money(store.withoutLoyaltyPence)}</p>}</>}
  {selected&&<><div className="v2-photo-hero"><MediaAsset id={selected.id} kind="product" alt={selected.name+' product photograph'} fallback={selected.emoji} size="large"/></div><p className="v2-muted">{selected.pack} · {items[selected.id]?.tier||'Own-label'} · Prices by retailer</p><div className="v2-sheet-scroll">{stores.filter(s=>selectedStores.includes(s.id)).map(s=>{const tier=items[selected.id]?.tier||'Own-label',variant=items[selected.id]?.variant||'standard',q=priceFor(selected.id,s.id,{tier,variant,loyalty});return {s,q}}).sort((a,b)=>(a.q?.effectivePence??Infinity)-(b.q?.effectivePence??Infinity)).map(({s,q},i)=><div className={'v2-price-row '+(i===0&&q?'v2-lowest':'')} key={s.id}><MediaAsset id={s.id} kind="logo" alt={s.name+' logo'} fallback={s.name[0]}/><span><strong>{s.name}</strong>{i===0&&q&&<small>Lowest example price</small>}{q&&<small>{showUnit(selected,q.unitPricePence)}</small>}{q && q.daysOld>7&&<small className="v2-stale">May be out of date</small>}{q&&<small>{checkedLabel(q.daysOld)}</small>}{q?.loyaltyPricePence!==null&&q?.loyaltyScheme&&<small>{q.loyaltyScheme}: {money(q.loyaltyPricePence)} · shelf: {money(q.shelfPricePence)}</small>}</span><b>{q?money(q.effectivePence):'Not sold here'}</b></div>)}</div>
   <div className="v2-history"><span className="v2-eyebrow">12-WEEK FICTIONAL PRICE HISTORY</span>{(()=>{const chosen=selectedDetail;const h=chosen?historyFor(selected.id,chosen.store.id,{loyalty,variant:items[selected.id]?.variant,tier:items[selected.id]?.tier}):[];if(!h.length)return <p>Not available</p>;const min=Math.min(...h.map(x=>x.pricePence)),max=Math.max(...h.map(x=>x.pricePence));const points=h.map((x,i)=>[i*19,46-((x.pricePence-min)/(max-min||1))*35].join(',')).join(' ');return <><svg width="100%" height="62" viewBox="0 0 210 62" role="img" aria-label={chosen?.store.name+' fictional price over 12 weeks, from '+money(h[0].pricePence)+' to '+money(h.at(-1)!.pricePence)}><polyline points={points} fill="none" stroke="#56A973" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><small>{chosen?.store.name} · illustrative 12-week trend {h.at(-1)!.pricePence===min?'· Price dropped':''}</small></>})()}</div>
   {selected.variants.length>1&&<div className="v2-packvalue"><strong>Pack-size value · {selectedDetail?.store.name||'No store available'}</strong>{selected.variants.map(v=>{const cheapest=selectedDetail?priceFor(selected.id,selectedDetail.store.id,{variant:v.id,loyalty,tier:items[selected.id]?.tier}):null;const base=selectedDetail?priceFor(selected.id,selectedDetail.store.id,{variant:'standard',loyalty,tier:items[selected.id]?.tier}):null;return <span key={v.id}>{v.label}: {cheapest?money(cheapest.effectivePence)+' · '+showUnit(selected,cheapest.unitPricePence):'Not sold here'} {v.id!=='standard'&&cheapest&&base&&cheapest.unitPricePence<base.unitPricePence?' · Better value per '+selected.unit:''}</span>})}</div>}
   <label className="v2-toggle v2-alert"><span><Bell size={17}/> Alert me if price drops <small>Saved on device only — no notifications yet</small></span><input type="checkbox" checked={alerts.includes(selected.id)} onChange={()=>toggle(selected.id,alerts,setAlerts)}/><i/></label>
   <button className="v2-primary" onClick={()=>{qty(selected.id,1);closeModal();snack('Added to My list')}}>Add to My list <Plus size={20}/></button>
  </>}
  {info&&<p>Fictional demonstration prices; real retailer feeds are not connected.</p>}
  <p className="v2-disclaimer">Demonstration prices only. Not real retailer offers. <a href="/credits" target="_blank" rel="noopener noreferrer">Photo credits</a></p>
 </section></div>}
 {notice&&<div className="v2-toast" role="status"><span>{notice.label}</span>{notice.undo&&<button onClick={()=>{setLists(notice.undo!.lists);setActiveId(notice.undo!.activeId);setNotice(null)}}>Undo</button>}<button aria-label="Dismiss" onClick={()=>setNotice(null)}><X size={17}/></button></div>}
 </main>;
}
