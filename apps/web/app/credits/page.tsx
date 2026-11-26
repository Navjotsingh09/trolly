import { neon } from '@neondatabase/serverless';
import Link from 'next/link';
export const metadata={title:'Image credits | TrolleyScout'};
export const dynamic='force-dynamic';
export const runtime='nodejs';
type Asset={asset_key:string;source_url:string|null;file_page_url:string|null;credit:string|null;license:string|null};
export default async function Credits(){
 let records:Asset[]=[];let error=false;
 try {
  if(process.env.DATABASE_URL){
   const sql=neon(process.env.DATABASE_URL);
   records=await sql`SELECT asset_key,source_url,file_page_url,credit,license FROM public.media_assets WHERE source_url IS NOT NULL ORDER BY asset_key` as Asset[];
  }
 }catch{error=true}
 return <main style={{maxWidth:880,margin:'0 auto',padding:'48px 20px',fontFamily:'Arial,sans-serif',lineHeight:1.65,color:'#17432d'}}>
 <Link href="/app">← Back to TrolleyScout</Link>
 <h1>Photo and supermarket logo credits</h1>
 <p>TrolleyScout sources preview product photography and retailer logo files from Wikimedia Commons. Photo filenames, creators and the applicable reuse terms are linked below. These images illustrate product categories; they do not imply that a named supermarket stocks or sells that exact pack.</p>
 <p>Pictures load on demand. This page lists images that have been retrieved and cached so far. Individual files retain their stated terms and authorship. TrolleyScout is independent of the supermarkets shown.</p>
 {error&&<p>Image credits are temporarily unavailable.</p>}
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:12}}>
 {records.map(a=><article key={a.asset_key} style={{border:'1px solid #dce7dd',borderRadius:14,padding:14,overflowWrap:'anywhere'}}>
 <div style={{display:'flex',alignItems:'center',gap:12}}>
 <img src={a.source_url!} alt={a.asset_key} width={64} height={64} style={{objectFit:'contain',borderRadius:8}}/>
 <strong>{a.asset_key.replace(':',' · ')}</strong>
 </div>
 <p style={{fontSize:12,marginBottom:8}}>Creator: {a.credit||'Wikimedia Commons contributors'}</p>
 <p style={{fontSize:12}}>Terms: {a.license||'See file page'}</p>
 {a.file_page_url&&<a href={a.file_page_url} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:'#1a724c'}}>Original file and full terms</a>}
 </article>)}
 </div>
 {!records.length&&!error&&<p>No photos have been cached yet. Browse the app to load photos, then refresh this page.</p>}
 </main>
}
