/** Fictional demo prices; never present as actual retailer quotes. */
export const retailers=[{id:"aldi",name:"Aldi"},{id:"lidl",name:"Lidl"},{id:"tesco",name:"Tesco"},{id:"asda",name:"Asda"},{id:"morrisons",name:"Morrisons"},{id:"sainsburys",name:"Sainsbury’s"},{id:"iceland",name:"Iceland"},{id:"waitrose",name:"Waitrose"}];
export const products=[
{id:"milk",name:"Semi-skimmed milk",detail:"2 pints",emoji:"🥛",prices:[119,125,135,130,139,145,135,159]},
{id:"bread",name:"Wholemeal bread",detail:"800g",emoji:"🍞",prices:[105,115,139,130,145,149,159,169]},
{id:"eggs",name:"Free-range eggs",detail:"6 medium",emoji:"🥚",prices:[169,175,195,189,199,209,205,235]},
{id:"bananas",name:"Bananas",detail:"5 pack",emoji:"🍌",prices:[105,115,129,119,139,129,139,155]},
{id:"pasta",name:"Penne pasta",detail:"500g",emoji:"🍝",prices:[75,79,95,89,99,105,110,125]},
{id:"tomatoes",name:"Cherry tomatoes",detail:"250g",emoji:"🍅",prices:[79,85,99,95,109,115,null,135]},
{id:"butter",name:"Salted butter",detail:"250g",emoji:"🧈",prices:[189,195,215,205,220,225,229,259]},
{id:"apples",name:"Royal Gala apples",detail:"6 pack",emoji:"🍎",prices:[135,139,160,155,165,175,179,199]}
];
export const formatGBP=p=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(p/100);
export function calculateBaskets(items){return retailers.map((store,index)=>{let totalPence=0,matched=0,required=0;for(const product of products){const quantity=items[product.id]||0;if(!Number.isInteger(quantity)||quantity<=0)continue;required++;const price=product.prices[index];if(typeof price==="number"){matched++;totalPence+=price*quantity;}}return {...store,totalPence,matched,required,complete:required>0&&required===matched};}).sort((a,b)=>Number(b.complete)-Number(a.complete)||a.totalPence-b.totalPence)}
