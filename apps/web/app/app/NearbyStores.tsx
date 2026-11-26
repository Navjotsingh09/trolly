'use client';
import {useEffect,useMemo,useState} from 'react';
import {MapPin,RefreshCw,ExternalLink,CheckCircle2,AlertCircle} from 'lucide-react';
import {stores} from '@trolleyscout/core/phase1';
import MediaAsset from './MediaAsset';

export type NearbyBranch={id:string;retailerId:string;name:string;address:string;distanceKm:number;latitude:number;longitude:number};
type Reply={postcode:string;area:string;radiusKm:number;distanceType:'straight-line';source:string;updatedAt:string;branches:NearbyBranch[];foundRetailers:string[]};
type Props={
 postcode:string;
 selectedStores:string[];
 onSelect:(storeId:string,enabled:boolean)=>void;
 chosenBranches:Record<string,string>;
 onChooseBranch:(storeId:string,branchId:string)=>void;
 onUseNearby:(ids:string[])=>void;
 onShowAll:()=>void;
};
export default function NearbyStores({postcode,selectedStores,onSelect,chosenBranches,onChooseBranch,onUseNearby,onShowAll}:Props){
 const [data,setData]=useState<Reply|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setData(null);setError('');setLoading(true);
  fetch('/api/nearby-stores?postcode='+encodeURIComponent(postcode),{signal:controller.signal})
   .then(async r=>{const payload=await r.json();if(!r.ok)throw new Error(payload.error||'Nearby store search is unavailable');return payload as Reply})
   .then(reply=>{if(!controller.signal.aborted)setData(reply)})
   .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Could not fetch nearby supermarkets')})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[postcode,retry]);
 const groups=useMemo(()=>{
  if(!data)return [];
  return stores.map(s=>{
   const branches=data.branches.filter(b=>b.retailerId===s.id).sort((a,b)=>a.distanceKm-b.distanceKm);
   const chosen=branches.find(b=>b.id===chosenBranches[s.id])??branches[0];
   return {store:s,branches,chosen};
  }).filter(x=>x.branches.length).sort((a,b)=>a.chosen.distanceKm-b.chosen.distanceKm);
 },[data,chosenBranches]);
 const distance=(km:number)=> (km*0.621371).toFixed(1)+' miles';
 return <section className="v2-panel v2-nearby" aria-label="Nearby supermarkets">
  <div className="v2-nearby-heading"><MapPin size={20}/><h2>Supermarkets near you</h2></div>
  <p>Real branch locations near <strong>{postcode}</strong>. Choose the shops you can reach to update your basket comparison.</p>
  {loading&&<div className="v2-nearby-loading" role="status"><RefreshCw size={18} className="v2-spin"/> Finding nearby branches…</div>}
  {!loading&&error&&<div className="v2-nearby-error" role="alert"><AlertCircle size={19}/><span>{error}</span><button onClick={()=>setRetry(n=>n+1)}>Retry</button></div>}
  {!loading&&data&&<><div className="v2-nearby-count"><CheckCircle2 size={16}/><span>{data.branches.length} mapped branches · {groups.length} supermarket chains · within {data.radiusKm} km</span></div>
   {!groups.length&&<p className="v2-muted">No participating supermarket branches were found in the map data within 8 km. You can still choose supermarkets under My stores.</p>}
   {groups.length>0&&<div className="v2-nearby-actions"><button onClick={()=>onUseNearby(groups.map(g=>g.store.id))}>Compare these {groups.length} nearby chains</button><button onClick={onShowAll}>Show all 8</button></div>}
   {groups.map(({store,branches,chosen})=><div className="v2-nearby-store" key={store.id}>
    <div className="v2-nearby-main">
      <MediaAsset id={store.id} kind="logo" alt={store.name+' logo'} fallback={store.name[0]}/>
      <div className="v2-nearby-name"><strong>{store.name}</strong><small>{distance(chosen.distanceKm)} away · straight line</small></div>
      <label className="v2-nearby-toggle" aria-label={'Include '+store.name+' in basket comparison'}>
        <input type="checkbox" checked={selectedStores.includes(store.id)} onChange={e=>onSelect(store.id,e.target.checked)}/>
        <span aria-hidden="true"/>
      </label>
    </div>
    {branches.length>1?<label className="v2-nearby-branches">Choose a branch<select aria-label={store.name+' nearby branch'} value={chosen.id} onChange={e=>onChooseBranch(store.id,e.target.value)}>
      {branches.slice(0,12).map(b=><option key={b.id} value={b.id}>{b.name} · {distance(b.distanceKm)}</option>)}
    </select></label>:<div className="v2-nearby-branch-name">{chosen.name}</div>}
    <div className="v2-nearby-address">
      <span>{chosen.address}</span>
      <a href={'https://www.openstreetmap.org/?mlat='+chosen.latitude+'&mlon='+chosen.longitude+'#map=17/'+chosen.latitude+'/'+chosen.longitude}
        target="_blank" rel="noopener noreferrer" aria-label={'View '+store.name+' '+chosen.name+' on the map'}>Map <ExternalLink size={13}/></a>
    </div>
   </div>)}
   <p className="v2-nearby-note">Branch locations from OpenStreetMap contributors. Distances are straight-line estimates, not walking or driving distances. Some stores or addresses may be missing. Selecting a branch filters by supermarket chain; <strong>basket prices are still fictional national examples, not prices at this branch.</strong></p>
  </>}
 </section>
}
