import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=35;

/** Verified postcode coordinates + named OpenStreetMap supermarket POIs via Photon. */
const chains=[
 {id:'aldi',query:'Aldi',re:/\baldi\b/i},
 {id:'lidl',query:'Lidl',re:/\blidl\b/i},
 {id:'tesco',query:'Tesco',re:/\btesco\b/i},
 {id:'asda',query:'Asda',re:/\basda\b/i},
 {id:'morrisons',query:'Morrisons',re:/\bmorrisons\b/i},
 {id:'sainsburys',query:'Sainsbury',re:/sainsbury/i},
 {id:'iceland',query:'Iceland',re:/\biceland\b|\bfood warehouse\b/i},
 {id:'waitrose',query:'Waitrose',re:/\bwaitrose\b/i}
];
const valid=/^(?:GIR\s?0AA|[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})$/i;
const distanceKm=(lat1:number,lon1:number,lat2:number,lon2:number)=>{
 const rad=Math.PI/180,lat=(lat2-lat1)*rad,lon=(lon2-lon1)*rad;
 const a=Math.sin(lat/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(lon/2)**2;
 return 6371*2*Math.asin(Math.min(1,Math.sqrt(a)));
};
type Branch={id:string;retailerId:string;name:string;address:string;distanceKm:number;latitude:number;longitude:number};
type Feature={geometry?:{type:string;coordinates?:number[]};properties?:Record<string,string|number>};
type FeatureCollection={features?:Feature[]};
async function findRetailer(chain:typeof chains[number],latitude:number,longitude:number):Promise<Branch[]>{
 const params=new URLSearchParams({q:chain.query,lat:String(latitude),lon:String(longitude),limit:'90',osm_tag:'shop:supermarket'});
 const response=await fetch('https://photon.komoot.io/api/?'+params,{
  headers:{Accept:'application/json','User-Agent':'TrolleyScout/0.4 (grocery location preview)'},
  signal:AbortSignal.timeout(8500),next:{revalidate:21600}
 });
 if(!response.ok)throw new Error('Location source '+response.status);
 const data=await response.json() as FeatureCollection;
 const result:Branch[]=[];
 for(const feature of data.features??[]){
  const p=feature.properties??{},point=feature.geometry?.coordinates;
  if(!Array.isArray(point)||point.length<2)continue;
  const [longitude2,latitude2]=point;
  if(!Number.isFinite(latitude2)||!Number.isFinite(longitude2))continue;
  if(p.osm_key!=='shop'||p.osm_value!=='supermarket')continue;
  const name=String(p.name||p.brand||'');
  if(!chain.re.test(name))continue;
  const dist=distanceKm(latitude,longitude,latitude2,longitude2);
  if(dist>8)continue;
  const osmType=String(p.osm_type||'N');
  const objectType=osmType==='W'?'way':osmType==='R'?'relation':'node';
  const objectId=p.osm_id;
  if(!objectId)continue;
  const address=[
   [p.housenumber,p.street].filter(Boolean).join(' '),
   p.city||p.county||p.district,
   p.postcode
  ].filter(Boolean).join(', ');
  result.push({
   id:objectType+'-'+objectId,retailerId:chain.id,
   name:name.slice(0,100),address:address||'Address not mapped',
   distanceKm:Math.round(dist*10)/10,latitude:latitude2,longitude:longitude2
  });
 }
 const seen=new Set<string>();
 return result.sort((a,b)=>a.distanceKm-b.distanceKm).filter(b=>{
  const key=Math.round(b.latitude*1200)+':'+Math.round(b.longitude*1200);
  if(seen.has(key))return false;seen.add(key);return true;
 }).slice(0,15);
}
export async function GET(request:NextRequest){
 const postcode=(request.nextUrl.searchParams.get('postcode')||'').trim().toUpperCase().replace(/\s+/g,'');
 if(postcode.length>8||!valid.test(postcode))
  return NextResponse.json({error:'Enter a valid full UK postcode.'},{status:400,headers:{'Cache-Control':'no-store'}});
 try{
  const response=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(postcode),{
   headers:{Accept:'application/json'},signal:AbortSignal.timeout(6500),next:{revalidate:86400}
  });
  if(response.status===404)return NextResponse.json({error:'Postcode not found.'},{status:404});
  if(!response.ok)throw new Error('Postcode service unavailable');
  const p=(await response.json())?.result;
  const latitude=p?.latitude,longitude=p?.longitude;
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw new Error('Postcode has no coordinates');
  // Two batches avoid overloading the volunteer-run public geocoder.
  const all:Branch[]=[];
  let answered=0;
  for(let i=0;i<chains.length;i+=4){
   const batch=await Promise.allSettled(chains.slice(i,i+4).map(c=>findRetailer(c,latitude,longitude)));
   for(const item of batch)if(item.status==='fulfilled'){all.push(...item.value);answered++}
  }
  if(!answered)throw new Error('Store map data unavailable');
  const branches=all.sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,90);
  return NextResponse.json({
   postcode:p.postcode,area:[p.admin_ward,p.admin_district].filter(Boolean).join(', '),
   radiusKm:8,distanceType:'straight-line',source:'OpenStreetMap contributors (Photon)',
   updatedAt:new Date().toISOString(),branches,
   foundRetailers:[...new Set(branches.map(b=>b.retailerId))]
  },{headers:{'Cache-Control':'public, s-maxage=21600, stale-while-revalidate=86400'}});
 }catch(error){
  console.error('Nearby store lookup error',error instanceof Error?error.message:'Unknown');
  return NextResponse.json({error:'Could not load nearby stores right now. Please retry.'},{
   status:503,headers:{'Cache-Control':'no-store'}
  });
 }
}
