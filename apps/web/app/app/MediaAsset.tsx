'use client';
import {ImageIcon} from 'lucide-react';
import {useEffect,useRef,useState} from 'react';

type MediaPhoto={src:string;page:string;credit:string;license:string};
type MediaResult={photo:MediaPhoto|null};
type Props={id:string;kind:'product'|'logo';alt:string;fallback:string;size?:'small'|'large'};
const cache=new Map<string,MediaPhoto|null>();
const pending=new Map<string,Promise<MediaPhoto|null>>();
async function resolve(key:string,id:string,kind:Props['kind']):Promise<MediaPhoto|null>{
 if(cache.has(key))return cache.get(key)??null;
 const existing=pending.get(key);if(existing)return existing;
 const request=fetch('/api/media?kind='+kind+'&id='+encodeURIComponent(id))
  .then(async r=>{if(!r.ok)throw new Error('Image lookup failed');const data=await r.json() as MediaResult;const photo=data.photo&&/^https:\/\//.test(data.photo.src)?data.photo:null;cache.set(key,photo);return photo;})
  .catch(()=>null).finally(()=>pending.delete(key));
 pending.set(key,request);return request;
}
export default function MediaAsset({id,kind,alt,fallback,size='small'}:Props){
 const ref=useRef<HTMLSpanElement>(null);
 const [photo,setPhoto]=useState<MediaPhoto|null>(()=>cache.get(kind+':'+id)??null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let active=true;const el=ref.current;if(!el)return;
  const key=kind+':'+id;
  const load=()=>{resolve(key,id,kind).then(p=>{if(active){setPhoto(p);setFailed(false)}})};
  if(typeof IntersectionObserver==='undefined'){load();return()=>{active=false}};
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load()}},{rootMargin:'240px'});
  observer.observe(el);
  return()=>{active=false;observer.disconnect()};
 },[id,kind]);
 return <span ref={ref} className={'v2-media v2-media-'+kind+' '+(size==='large'?'v2-media-large':'')} title={photo?photo.credit+' · '+photo.license:alt}>
   {photo&&!failed?<img src={photo.src} alt={alt} loading="lazy" decoding="async" onError={()=>setFailed(true)} referrerPolicy="no-referrer"/>:<span className="v2-media-fallback" aria-label={kind==='product'?'Product image not yet available':alt}>{kind==='product'?<ImageIcon size={size==='large'?44:19} strokeWidth={1.5}/>:fallback}</span>}
  </span>;
}
