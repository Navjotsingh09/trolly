import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'TrolleyScout — Your shop. Your savings.',description:'Build a shopping list and explore supermarket basket comparison. Illustrative prices only.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en-GB"><body>{children}</body></html>}
