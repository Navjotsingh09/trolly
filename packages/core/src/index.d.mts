export type Retailer={id:string;name:string};
export type Product={id:string;name:string;detail:string;emoji:string;prices:(number|null)[]};
export type BasketResult=Retailer&{totalPence:number;matched:number;required:number;complete:boolean};
export const retailers:Retailer[];
export const products:Product[];
export function formatGBP(pence:number):string;
export function calculateBaskets(items:Record<string,number>):BasketResult[];
