import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';

const validFormat=(value:string)=>/^(?:GIR\s?0AA|[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})$/i.test(value);

export async function GET(request:NextRequest){
 const input=(request.nextUrl.searchParams.get('postcode')||'').trim().toUpperCase().replace(/\s+/g,'');
 if(input.length>8||!validFormat(input)){
  return NextResponse.json({valid:false,error:'Enter a full UK postcode, for example B67 7BX.'},{status:400,headers:{'Cache-Control':'no-store'}});
 }
 try{
  const response=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(input),{
    headers:{Accept:'application/json'},signal:AbortSignal.timeout(7000),next:{revalidate:86400}
  });
  if(response.status===404)return NextResponse.json({valid:false,error:'This postcode was not found. Check the letters and numbers.'},{status:404,headers:{'Cache-Control':'no-store'}});
  if(!response.ok)throw new Error('Postcode service unavailable');
  const data=await response.json();
  const result=data?.result;
  if(data?.status!==200||!result||typeof result.postcode!=='string')throw new Error('Unexpected postcode response');
  const publicResult={
    valid:true,postcode:result.postcode,
    district:typeof result.admin_district==='string'?result.admin_district:null,
    ward:typeof result.admin_ward==='string'?result.admin_ward:null,
    region:typeof result.region==='string'?result.region:null,
    country:typeof result.country==='string'?result.country:null,
    outcode:typeof result.outcode==='string'?result.outcode:null
  };
  return NextResponse.json(publicResult,{headers:{'Cache-Control':'public, s-maxage=86400, stale-while-revalidate=604800'}});
 }catch{
  return NextResponse.json({valid:null,error:'The postcode checker is temporarily unavailable. Please try again.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
