import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { catalogue, stores } from '@trolleyscout/core/phase1';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Only editorially approved images are shown.
 * Never select a random image through keyword search at request time.
 */
export async function GET(request:NextRequest){
 const id=request.nextUrl.searchParams.get('id')||'';
 const kind=request.nextUrl.searchParams.get('kind')==='logo'?'logo':'product';
 const valid=kind==='logo'?stores.some(s=>s.id===id):catalogue.some(p=>p.id===id);
 if(!valid)return NextResponse.json({error:'Unknown asset'},{status:404});
 const response={source:'reviewed-media-catalogue',kind,id,photo:null as null|{src:string;page:string;credit:string;license:string},status:'pending'};
 if(!process.env.DATABASE_URL)return NextResponse.json(response,{headers:{'Cache-Control':'no-store'}});
 try{
  const sql=neon(process.env.DATABASE_URL);
  const assets=await sql`SELECT source_url,file_page_url,credit,license,review_status
   FROM public.media_assets
   WHERE asset_key=${kind+':'+id}
   LIMIT 1` as unknown as Array<{source_url:string|null;file_page_url:string|null;credit:string|null;license:string|null;review_status:string}>;
  const asset=assets[0];
  if(asset?.review_status==='approved'&&asset.source_url?.startsWith('https://')){
   response.photo={src:asset.source_url,page:asset.file_page_url||'',credit:asset.credit||'',license:asset.license||''};
   response.status='approved';
  }
  return NextResponse.json(response,{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=120'}});
 }catch{
  return NextResponse.json(response,{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
