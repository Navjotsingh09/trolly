'use client';
import { useEffect, useMemo, useState } from 'react';
import { calculateBaskets, formatGBP, products, retailers } from '@trolleyscout/core';
import { ShoppingBasket, Search, ChartNoAxesColumnIncreasing, UserRound, Minus, Plus, ChevronRight, Heart, ArrowLeft, MapPin, Sparkles, ArrowUpRight, Check, SlidersHorizontal, X, Sun, Moon, Home, ArrowRight, ShoppingCart } from 'lucide-react';
import './preview.css';
type Tab='home'|'list'|'compare'|'account';
type Counts=Record<string,number>;
const categories=['All','Dairy','Bakery','Fruit & veg','Pantry'];
const category=(id:string)=>['milk','eggs','butter'].includes(id)?'Dairy':id==='bread'?'Bakery':['bananas','tomatoes','apples'].includes(id)?'Fruit & veg':'Pantry';
const initial:Counts={milk:1,bread:1,eggs:1,bananas:1,pasta:1};
export default function AppPreview(){
 const [tab,setTab]=useState<Tab>('home');
 const [basket,setBasket]=useState<Counts>(initial);
 const [search,setSearch]=useState('');
 const [filter,setFilter]=useState('All');
 const [store,setStore]=useState<string|null>(null);
 const [product,setProduct]=useState<string|null>(null);
 const [favorites,setFavorites]=useState<string[]>([]);
 const [postcode,setPostcode]=useState('');
 const [postcodeTouched,setPostcodeTouched]=useState(false);
 const [undoItem,setUndoItem]=useState<{id:string;quantity:number}|null>(null);
 const [night,setNight]=useState(false);
 const [hydrated,setHydrated]=useState(false);
 const [toast,setToast]=useState('');
 const list=useMemo(()=>products.filter(p=>(basket[p.id]||0)>0),[basket]);
 const totals=useMemo(()=>calculateBaskets(basket),[basket]);
 const complete=totals.filter(r=>r.complete);
 const cheapest=complete[0];
 const highest=complete[complete.length-1];
 const count=Object.values(basket).reduce((s,n)=>s+n,0);
 const distinctCount=list.length;
 const postcodeValid=!postcode.trim()||/^(GIR\\s?0AA|(?:[A-Z]{1,2}[0-9][0-9A-Z]?)[ ]?[0-9][A-Z]{2})$/i.test(postcode.trim());
 const comparePrices=(selected:(typeof products)[number])=>retailers.map((r,i)=>({...r,price:selected.prices[i]})).sort((a,b)=>(a.price===null?1:0)-(b.price===null?1:0)||(a.price??Infinity)-(b.price??Infinity)||a.name.localeCompare(b.name));
 useEffect(()=>{try{const raw=localStorage.getItem('trolleyscout-preview');if(raw){const obj=JSON.parse(raw);if(obj.basket&&typeof obj.basket==='object'){const b:Counts={};for(const p of products){const v=obj.basket[p.id];if(Number.isInteger(v)&&v>0&&v<100)b[p.id]=v;}setBasket(b);}if(Array.isArray(obj.favorites))setFavorites(obj.favorites.filter((x:unknown)=>typeof x==='string'));if(typeof obj.postcode==='string')setPostcode(obj.postcode.slice(0,10));setNight(!!obj.night);}}catch{}setHydrated(true)},[]);
 useEffect(()=>{if(hydrated)try{localStorage.setItem('trolleyscout-preview',JSON.stringify({basket,favorites,postcode,night}));}catch{}},[hydrated,basket,favorites,postcode,night]);
 function quantity(id:string,diff:number){const previous=basket[id]||0;const next=Math.max(0,Math.min(99,previous+diff));if(previous>0&&next===0)setUndoItem({id,quantity:previous});else setUndoItem(null);setBasket(prev=>{const n={...prev};if(next)n[id]=next;else delete n[id];return n;})}
 function navigate(to:Tab){setTab(to);setSearch('');setStore(null);setProduct(null);document.querySelector('.ts-body')?.scrollTo({top:0,behavior:'instant'})}
 function toggleFavorite(id:string){setFavorites(a=>a.includes(id)?a.filter(v=>v!==id):[...a,id])}
 function notify(message:string){setToast(message);window.setTimeout(()=>setToast(''),2800)}
 useEffect(()=>{if(!store&&!product)return;function onKey(e:KeyboardEvent){if(e.key==='Escape'){setStore(null);setProduct(null);}}document.addEventListener('keydown',onKey);return ()=>document.removeEventListener('keydown',onKey)},[store,product]);
 const displayed=products.filter(p=>(filter==='All'||category(p.id)===filter)&&p.name.toLowerCase().includes(search.toLowerCase()));
 const selectedStore=totals.find(s=>s.id===store);
 const selectedProduct=products.find(p=>p.id===product);
 const row=(p:(typeof products)[number])=><article className="ts-product" key={p.id}>
  <button className="ts-product-main" onClick={()=>setProduct(p.id)} aria-label={'Compare '+p.name}><span className="ts-product-emoji">{p.emoji}</span><span className="ts-product-info"><strong>{p.name}</strong><small>{p.detail}</small></span></button>
  <div className="ts-counter"><button onClick={()=>quantity(p.id,-1)} aria-label={'Remove '+p.name}><Minus size={15}/></button><span>{basket[p.id]||0}</span><button onClick={()=>quantity(p.id,1)} aria-label={'Add '+p.name}><Plus size={15}/></button></div>
  <button className={'ts-heart '+(favorites.includes(p.id)?'is-favourite':'')} onClick={()=>toggleFavorite(p.id)} aria-label={'Favourite '+p.name}><Heart size={17} fill={favorites.includes(p.id)?'currentColor':'none'}/></button>
 </article>;
 return <main className={'ts-preview '+(night?'ts-night':'')}>
  <div className="ts-app">
   <header className="ts-top"><div className="ts-brand">trolleyscout<span>.</span></div><div className="ts-tag"><span className="ts-dot"/> INTERACTIVE DEMO</div></header>
   <div className="ts-body">
    {tab==='home'&&<>
      <div className="ts-overline">YOUR EVERYDAY SHOP, SORTED</div><h1>Shop smart.<br/><span>Spend less.</span></h1><p className="ts-lead">One beautiful list. A smarter way to compare Britain’s supermarkets.</p>
      <div className="ts-highlight"><div className="ts-orb ts-orb-one"/><div className="ts-orb ts-orb-two"/><div className="ts-highlight-content"><span className="ts-highlight-kicker">YOUR WEEKLY SHOP</span><h2>{distinctCount} products.<br/>{count} total items.</h2><p>Find the lowest complete basket with one tap.</p><button className="ts-light-btn" onClick={()=>navigate('compare')}>Compare my basket <ArrowUpRight size={18}/></button></div><div className="ts-highlight-mark"><ShoppingBasket size={110} strokeWidth={.8}/></div></div>
      <div className="ts-section-head"><h3>Discover groceries</h3><span>{products.length} essentials</span></div>
      <label className="ts-search"><Search size={21}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search groceries…" aria-label="Search groceries"/></label>
      <div className="ts-categories">{categories.map(c=><button key={c} onClick={()=>setFilter(c)} className={c===filter?'active':''}>{c}</button>)}</div>
      <div className="ts-product-list">{displayed.length?displayed.map(row):<div className="ts-empty">No groceries found. Try another search.</div>}</div>
    </>}
    {tab==='list'&&<>
      <div className="ts-overline">WEEKLY ESSENTIALS</div><h1>Your list<span>.</span></h1><p className="ts-lead">Your shopping, organised beautifully.</p>
      <div className="ts-summary"><div><span>IN YOUR TROLLEY</span><strong>{distinctCount} products</strong><small>{count} total units</small></div><ShoppingBasket size={46}/></div>
      <div className="ts-section-head"><h3>Everything you need</h3><button className="ts-link" onClick={()=>navigate('home')}>Add items <Plus size={16}/></button></div>
      {list.length?<div className="ts-product-list">{list.map(row)}</div>:<div className="ts-empty"><ShoppingBasket size={34}/>Your trolley is empty.<button className="ts-main-btn" onClick={()=>navigate('home')}>Browse groceries</button></div>}
      {count>0&&<><button className="ts-main-btn" onClick={()=>navigate('compare')}>Compare {distinctCount} products <ArrowRight size={18}/></button><button className="ts-clear" onClick={()=>{if(confirm('Remove every item from your trolley?'))setBasket({});setUndoItem(null)}}>Clear shopping list</button></>}
    </>}
    {tab==='compare'&&<>
      <div className="ts-overline">THE SMARTER COMPARISON</div><h1>Better basket<span>.</span></h1><p className="ts-lead">Compare complete example baskets across eight UK supermarkets.</p>
      <div className="ts-winning"><span className="ts-highlight-kicker">LOWEST COMPLETE EXAMPLE BASKET</span><strong>{cheapest?formatGBP(cheapest.totalPence):'—'}</strong><span>{cheapest?cheapest.name+' · '+cheapest.matched+' of '+cheapest.required+' products':'Add some items to get started'}</span>{cheapest&&highest&&highest.totalPence>cheapest.totalPence&&<div className="ts-savings"><Sparkles size={16}/> Example price spread {formatGBP(highest.totalPence-cheapest.totalPence)}</div>}</div>
      <div className="ts-section-head"><h3>Supermarket ranking</h3><span>{complete.length} complete</span></div><p className="ts-help-text">Try adding cherry tomatoes to see how an incomplete supermarket basket is handled.</p>
      <div className="ts-results">{totals.map((r,i)=><button key={r.id} className={'ts-result '+(i===0&&r.complete?'ts-result-best':'')} onClick={()=>setStore(r.id)}><span className="ts-store-avatar">{r.name.slice(0,1).toUpperCase()}</span><span className="ts-store-text"><strong>{r.name}{i===0&&r.complete&&<span className="ts-best">BEST</span>}</strong><small>{r.matched}/{r.required} matched{!r.complete?' · incomplete':''}</small></span><span className="ts-result-price"><strong>{formatGBP(r.totalPence)}</strong>{!r.complete&&<small>Partial only</small>}</span><ChevronRight size={16}/></button>)}</div>
      <button className="ts-secondary-btn" onClick={()=>navigate('list')}>Edit shopping list <ArrowRight size={18}/></button>
    </>}
    {tab==='account'&&<>
      <div className="ts-overline">PERSONALISE YOUR SHOP</div><h1>Made for you<span>.</span></h1><p className="ts-lead">A few little details make shopping feel easier.</p>
      <div className="ts-settings"><div className="ts-setting-title"><MapPin size={23}/><div><strong>Your shopping postcode</strong><small>Saved for later — no live local pricing yet</small></div></div><input value={postcode} onChange={e=>{setPostcode(e.target.value.toUpperCase().slice(0,10));setPostcodeTouched(true)}} onBlur={()=>setPostcodeTouched(true)} aria-invalid={postcodeTouched&&!postcodeValid} placeholder="e.g. B67 7BX" aria-label="Postcode"/>{postcodeTouched&&!postcodeValid&&<p className="ts-field-error" role="alert">Enter a valid UK postcode, e.g. B67 7BX.</p>}<div className="ts-line"/><div className="ts-setting-title"><Moon size={23}/><div><strong>Dark appearance</strong><small>Choose the look that suits you</small></div><button aria-label="Toggle dark mode" aria-pressed={night} className={'ts-switch '+(night?'on':'')} onClick={()=>setNight(v=>!v)}><span/></button></div><div className="ts-line"/><div className="ts-setting-title"><Heart size={23}/><div><strong>Favourite groceries</strong><small>{favorites.length} saved {favorites.length===1?'product':'products'}</small></div></div>{favorites.length>0&&<div className="ts-favorites">{products.filter(p=>favorites.includes(p.id)).map(p=><button onClick={()=>setProduct(p.id)} key={p.id}>{p.emoji} {p.name} <ChevronRight size={14}/></button>)}</div>}</div>
      <div className="ts-membership"><div className="ts-overline">FUTURE MEMBERSHIP IDEA</div><h3>Little price.<br/>Big possibilities.</h3><p>Our proposed 1p/month membership is not available yet. This demo never charges you.</p><span className="ts-unavailable">Coming later — no payment is available</span></div>
    </>}
    <p className="ts-disclaimer">DEMONSTRATION PRICES ONLY. All supermarket figures are fictional examples, not live prices or purchasing advice. No real payment is taken.</p>
   </div>
   {undoItem&&<div className="ts-undo" role="status"><span>{products.find(p=>p.id===undoItem.id)?.name} removed</span><button onClick={()=>{setBasket(prev=>({...prev,[undoItem.id]:undoItem.quantity}));setUndoItem(null)}}>Undo</button><button aria-label="Dismiss undo" onClick={()=>setUndoItem(null)}><X size={14}/></button></div>}
   <nav className="ts-nav" aria-label="App navigation">
     <button aria-current={tab==='home'?'page':undefined} onClick={()=>navigate('home')}><Home size={23}/><span>Explore</span></button>
     <button aria-current={tab==='list'?'page':undefined} onClick={()=>navigate('list')}><ShoppingBasket size={23}/><span>My list</span>{distinctCount>0&&<b className="ts-count">{distinctCount}</b>}</button>
     <button aria-current={tab==='compare'?'page':undefined} onClick={()=>navigate('compare')}><ChartNoAxesColumnIncreasing size={23}/><span>Compare</span></button>
     <button aria-current={tab==='account'?'page':undefined} onClick={()=>navigate('account')}><UserRound size={23}/><span>You</span></button>
   </nav>
  </div>
  {selectedStore&&<div className="ts-modal-backdrop" onClick={()=>setStore(null)}><section role="dialog" aria-modal="true" aria-label={selectedStore.name+' basket details'} className="ts-sheet" onClick={e=>e.stopPropagation()}><div className="ts-sheet-heading"><div><div className="ts-overline">BASKET BREAKDOWN</div><h2>{selectedStore.name}</h2></div><button onClick={()=>setStore(null)} aria-label="Close"><X size={20}/></button></div><div className="ts-sheet-scroll">{products.filter(p=>basket[p.id]>0).map(p=>{const idx=retailers.findIndex(s=>s.id===selectedStore.id);const price=p.prices[idx];return <div className="ts-sheet-row" key={p.id}><span>{p.emoji}</span><div><strong>{p.name}</strong><small>{basket[p.id]} × {p.detail}</small></div><b>{typeof price==='number'?formatGBP(price*basket[p.id]):'Unavailable'}</b></div>})}</div><div className="ts-sheet-total"><span>{selectedStore.complete?'Basket total':'Matched items (partial)'}</span><strong>{formatGBP(selectedStore.totalPence)}</strong></div><p className="ts-disclaimer">Fictional prices and product matches, for demonstration only.</p></section></div>}
  {selectedProduct&&<div className="ts-modal-backdrop" onClick={()=>setProduct(null)}><section role="dialog" aria-modal="true" aria-label={selectedProduct.name+' retailer prices'} className="ts-sheet" onClick={e=>e.stopPropagation()}><div className="ts-sheet-heading"><div><div className="ts-overline">PRODUCT COMPARISON</div><h2>{selectedProduct.name}</h2><p>{selectedProduct.detail}</p></div><button onClick={()=>setProduct(null)} aria-label="Close"><X size={20}/></button></div><div className="ts-sheet-scroll">{comparePrices(selectedProduct).map((r,i)=><div className={'ts-sheet-row '+(i===0&&r.price!==null?'ts-lowest':'')} key={r.id}><span className="ts-store-avatar">{r.name[0]}</span><div><strong>{r.name}</strong>{i===0&&r.price!==null&&<small>Lowest example price</small>}</div><b>{typeof r.price==='number'?formatGBP(r.price):'Unavailable'}</b></div>)}</div><button className="ts-main-btn" onClick={()=>{quantity(selectedProduct.id,1);setProduct(null);notify('Added to My list')}}>Add to my list <Plus size={18}/></button><p className="ts-disclaimer">Illustrative prices only.</p></section></div>}
  {!!toast&&<div className="ts-toast"><Check size={16}/>{toast}</div>}
 </main>
}
