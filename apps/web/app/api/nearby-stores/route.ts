import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=35;

/**
 * Locations: postcodes.io (postcode -> coordinates), OpenStreetMap Overpass
 * (mapped supermarket branches). Distances are straight-line, NOT travel times.
 * Does not provide retailer prices or guarantee that every branch is mapped.
 */
const chains=[
 {id:'aldi',re:/\baldi\b/i},{id:'lidl',re:/\blidl\b/i},
 {id:'tesco',re:/\btesco\b|\bone stop\b/i},
 {id:'asda',re:/\basda\b/i},
 {id:'morrisons',re:/\bmorrisons\b|\bmorrisons daily\b/i},
 {id:'sainsburys',re:/sainsbury/i},
 {id:'iceland',re:/\biceland\b|\bfood warehouse\b/i},
 {id:'waitrose',re:/\bwaitrose\b/i}
];
const postcodePattern=/^(?:GIR\s?0AA|[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})$/i;
const haversine=(a:number,b:number,c:number,d:number)=>{const rad=Math.PI/180,lat=(c-a)*rad,lng=(d-b)*rad;const h=Math.sin(lat/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(lng/2)**2;return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)))};
function chainFor(t:Record<string,string>):string|null{
 const text=[t.brand,t.name,t.operator,t['brand:wikidata']].filter(Boolean).join(' ');
 // Match explicit actual retailer branding, not unrelated independent stores.
 for(const c of chains)if(c.re.test(text))return c.id;
 return null;
}
type OsmNode={type:string;id:number;lat?:number;lon?:number;center?:{lat:number;lon:number};tags?:Record<string,string>};
type Result={id:string;retailerId:string;name:string;address:string;distanceKm:number;latitude:number;longitude:number};
function normalize(elements:OsmNode[],latitude:number,longitude:number):Result[]{
 const matches:Result[]=[];const seen=new Set<string>();
 for(const item of elements){
  const tags=item.tags??{},retailerId=chainFor(tags);
  if(!retailerId)continue;
  const lat=item.lat??item.center?.lat,lon=item.lon??item.center?.lon;
  if(typeof lat!=='number'||typeof lon!=='number')continue;
  const distance=haversine(latitude,longitude,lat,lon);
  if(distance>8.1)continue;
  // Deduplicate map node/way representations of one physical branch within 80m.
  const dedup=retailerId+':'+Math.round(lat*1000)+':'+Math.round(lon*1000);
  if(seen.has(dedup))continue;seen.add(dedup);
  const address=[
    [tags['addr:housenumber'],tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:suburb']||tags['addr:city']||tags['addr:town']||tags['addr:place'],
    tags['addr:postcode']
  ].filter(Boolean).join(', ');
  matches.push({id:item.type+'-'+item.id,retailerId,name:tags.name||tags.brand||retailerId,
   address:address||'Address not listed in OpenStreetMap',
   distanceKm:Math.round(distance*10)/10,latitude:lat,longitude:lon});
 }
 return matches.sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,90);
}
export async function GET(request:NextRequest){
 const postcode=(request.nextUrl.searchParams.get('postcode')||'').replace(/\s+/g,'').toUpperCase().trim();
 if(!postcodePattern.test(postcode)||postcode.length>8)
  return NextResponse.json({error:'Enter a valid full UK postcode.'},{status:400,headers:{'Cache-Control':'no-store'}});
 try{
  const lookup=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(postcode),
   {headers:{Accept:'application/json'},signal:AbortSignal.timeout(6500),next:{revalidate:86400}});
  if(lookup.status===404)return NextResponse.json({error:'Postcode not found.'},{status:404});
  if(!lookup.ok)throw new Error('Postcode lookup unavailable');
  const postcodeResult=(await lookup.json())?.result;
  const latitude=postcodeResult?.latitude,longitude=postcodeResult?.longitude;
  if(typeof latitude!=='number'||typeof longitude!=='number')throw new Error('No postcode coordinates');
  const query='[out:json][timeout:16];(nwr["shop"="supermarket"](around:8000,'+latitude+','+longitude+');nwr["shop"="convenience"]["brand"](around:8000,'+latitude+','+longitude+'););out center tags;';
  let elements:OsmNode[]|null=null;
  for(const origin of ['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter']){
   try{
    const response=await fetch(origin,{method:'POST',body:new URLSearchParams({data:query}),
     headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json','User-Agent':'TrolleyScout/0.3 (nearby supermarket finder; info at trolleyscout.vercel.app)'},
     signal:AbortSignal.timeout(18000),cache:'no-store'});
    if(!response.ok)continue;
    const raw=await response.json();
    if(Array.isArray(raw.elements)){elements=raw.elements;break}
   }catch{/* fallback to alternate public endpoint */}
  }
  if(!elements)throw new Error('Store map service temporarily unavailable');
  const branches=normalize(elements,latitude,longitude);
  return NextResponse.json({
   postcode:postcodeResult.postcode,
   area:[postcodeResult.admin_ward,postcodeResult.admin_district].filter(Boolean).join(', '),
   radiusKm:8, distanceType:'straight-line', source:'OpenStreetMap contributors',
   updatedAt:new Date().toISOString(),branches,
   foundRetailers:[...new Set(branches.map(b=>b.retailerId))]
  },{headers:{'Cache-Control':'public, s-maxage=21600, stale-while-revalidate=86400'}});
 }catch{
  return NextResponse.json({error:'Could not load nearby stores right now. Please retry.'},
   {status:503,headers:{'Cache-Control':'no-store'}});
 }
}
