import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { catalogue, stores } from '@trolleyscout/core/phase1';
export const runtime='nodejs';
export const dynamic='force-dynamic';

const productSearch:Record<string,string>={
  milk:'milk carton isolated photograph', 'whole-milk':'whole milk carton photograph',
  eggs:'six eggs carton photograph',butter:'butter block photograph',
  cheddar:'cheddar cheese block photograph',yogurt:'plain yogurt bowl photograph',
  'oat-milk':'oat milk carton photograph',bread:'wholemeal sliced bread loaf photo',
  'white-bread':'white sliced bread loaf photo',bagels:'plain bagel bread photo',
  croissants:'croissant pastry food photo',wraps:'tortilla wraps food photo',
  bananas:'bananas fruit photo',apples:'gala red apples fruit photo',
  tomatoes:'cherry tomatoes photo',potatoes:'white potatoes food photo',
  carrots:'carrots vegetable photo',onions:'brown onions food photo',
  broccoli:'broccoli vegetable photo',spinach:'spinach leaves vegetable photo',
  strawberries:'strawberries fruit photo',oranges:'oranges fruit photo',
  chicken:'raw chicken breast food photo',beef:'beef mince food photo',
  salmon:'salmon fillets food photo',sausages:'pork sausages food photo',
  tuna:'canned tuna fish photo',bacon:'bacon slices food photo',
  peas:'green peas photo',chips:'frozen oven chips french fries photo',
  pizza:'margherita pizza food photo','ice-cream':'vanilla ice cream photo',
  'fish-fingers':'fish fingers food photo',pasta:'penne pasta food photo',
  rice:'basmati rice grain food photo',flour:'plain flour bag photo',
  sugar:'white sugar food photo','olive-oil':'olive oil bottle photo',
  cereal:'corn flakes cereal bowl photo',beans:'baked beans food photo',
  'tomato-sauce':'tomato ketchup bottle photo',tea:'black tea bag photograph',
  coffee:'instant coffee granules jar photo',water:'water bottle photo',
  'orange-juice':'orange juice glass carton photo','apple-juice':'apple juice glass photo',
  cola:'cola soft drink glass photo',lemonade:'lemonade drink glass photo',
  squash:'orange squash cordial bottle photograph',
  detergent:'laundry detergent bottle photo','dish-soap':'washing up liquid bottle photo',
  'toilet-roll':'toilet paper rolls photograph',
  'kitchen-roll':'paper towels rolls photo','bin-bags':'black rubbish bin bags photo',
  shampoo:'shampoo bottle photograph',toothpaste:'toothpaste tube photograph',
  soap:'hand soap dispenser photograph',deodorant:'deodorant spray can photo',
  nappies:'baby disposable diapers nappies photo',wipes:'baby wet wipes packet photograph',
  'baby-food':'baby food fruit puree pouch photo','baby-bath':'baby wash bottle photograph'
};
const logoSearch:Record<string,string>={
 tesco:'Tesco 2016 logo',sainsburys:"Sainsbury's Logo",aldi:'Aldi Süd logo',
 asda:'Asda logo',lidl:'Lidl logo',morrisons:'Morrisons logo',
 iceland:'Iceland supermarket logo',waitrose:'Waitrose & Partners logo'
};
const getText=(v:unknown)=>typeof v==='string'?v:'';
const plain=(v:unknown)=>getText(v).replace(/<[^>]*>/g,' ').replace(/&[^; ]+;/g,' ').replace(/\s+/g,' ').trim().slice(0,160);
type Photo={src:string;page:string;credit:string;license:string};
function choose(data:any,kind:string,term:string):Photo|null {
 const pages=Object.values(data?.query?.pages??{}) as any[];
 const accepted=pages.map(p=>{
  const info=p?.imageinfo?.[0],meta=info?.extmetadata??{};
  const url=getText(info?.thumburl||info?.url),license=plain(meta.LicenseShortName?.value||meta.UsageTerms?.value);
  const name=getText(p?.title).replace(/^File:/i,'');
  const isPhoto=/\.(jpg|jpeg|png|webp)$/i.test(name);
  const isLogo=/\.(svg|png|jpg|jpeg|webp)$/i.test(name);
  const free=/CC0|CC BY|Public domain|PD-|GFDL/i.test(license);
  const lower=name.toLowerCase();
  const banned=kind==='product'&&/logo|icon|flag|map|diagram|stamp|poster|illustration|drawing|animation|symbol|coat.of.arms|screenshot/i.test(lower);
  if(!url||!/^https:\/\//.test(url)||!free||banned||!(kind==='logo'?isLogo:isPhoto))return null;
  let score=0;
  for(const word of term.toLowerCase().split(/\s+/).filter(x=>x.length>3))if(lower.includes(word))score+=3;
  if(kind==='logo'&&/logo/i.test(lower))score+=14;
  if(kind==='logo'&&/2016|2026|2025|2024|2023|partners/i.test(lower))score+=3;
  if(kind==='product'&&/photo|fresh|food|fruit|vegetable/i.test(lower))score+=3;
  if(kind==='product'&&/packag|brand|shop|old|1950|advert/i.test(lower))score-=4;
  return {score,photo:{src:url,page:getText(info?.descriptionurl)||'https://commons.wikimedia.org/wiki/'+encodeURIComponent(getText(p.title).replace(/ /g,'_')),credit:plain(meta.Artist?.value||meta.Credit?.value||'Wikimedia Commons contributor'),license}};
 }).filter(Boolean) as {score:number;photo:Photo}[];
 accepted.sort((a,b)=>b.score-a.score);
 return accepted[0]?.photo??null;
}
export async function GET(request:NextRequest){
 const id=request.nextUrl.searchParams.get('id')||'';
 const kind=request.nextUrl.searchParams.get('kind')==='logo'?'logo':'product';
 const valid=kind==='logo'?stores.some(s=>s.id===id):catalogue.some(p=>p.id===id);
 if(!valid)return NextResponse.json({error:'Unknown asset'},{status:404});
 const key=kind+':'+id;
 const term=kind==='logo'?logoSearch[id]:productSearch[id];
 const fallback={source:'wikimedia-commons',kind,id,photo:null};
 if(!term)return NextResponse.json(fallback);
 const database=process.env.DATABASE_URL;
 let sql:ReturnType<typeof neon>|undefined;
 try {
  if(database){
   sql=neon(database);
   const saved=await sql`SELECT source_url,file_page_url,credit,license,updated_at FROM public.media_assets WHERE asset_key=${key} AND updated_at > now()-interval '21 days' LIMIT 1`;
   if(saved.length)return NextResponse.json({...fallback,photo:saved[0].source_url?{src:saved[0].source_url,page:saved[0].file_page_url,credit:saved[0].credit,license:saved[0].license}:null},{headers:{'Cache-Control':'public, max-age=86400, s-maxage=604800'}});
  }
  const params=new URLSearchParams({action:'query',format:'json',generator:'search',gsrsearch:kind==='logo'?'File:'+term:'File:'+term,gsrnamespace:'6',gsrlimit:'10',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'480',origin:'*'});
  const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params,{signal:AbortSignal.timeout(9000),headers:{'User-Agent':'TrolleyScout/0.2 (grocery comparison demo; Wikimedia Commons attribution)',Accept:'application/json'},next:{revalidate:86400}});
  if(!response.ok)throw new Error('Media source unavailable');
  const result=await response.json();
  const photo=choose(result,kind,term);
  if(sql){
   await sql`INSERT INTO public.media_assets(asset_key,source_url,file_page_url,credit,license,query_text,updated_at) VALUES(${key},${photo?.src||null},${photo?.page||null},${photo?.credit||null},${photo?.license||null},${term},now()) ON CONFLICT(asset_key) DO UPDATE SET source_url=excluded.source_url,file_page_url=excluded.file_page_url,credit=excluded.credit,license=excluded.license,query_text=excluded.query_text,updated_at=now()`.catch(()=>{});
  }
  return NextResponse.json({...fallback,photo},{headers:{'Cache-Control':'public,max-age=86400,s-maxage=604800'}});
 }catch{
  return NextResponse.json(fallback,{headers:{'Cache-Control':'public,max-age=120,s-maxage=300'}});
 }
}
