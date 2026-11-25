/** All prices are fabricated demo values. Nothing is scraped or quoted from retailers. */
export const DEMO_SOURCE = 'fictional-demonstration';
export const stores = [
 {id:'aldi',name:'Aldi',factor:0.89},
 {id:'lidl',name:'Lidl',factor:0.92,scheme:'Lidl Plus'},
 {id:'tesco',name:'Tesco',factor:1.09,scheme:'Tesco Clubcard'},
 {id:'asda',name:'Asda',factor:1.01},
 {id:'morrisons',name:'Morrisons',factor:1.13,scheme:'Morrisons More'},
 {id:'sainsburys',name:"Sainsbury's",factor:1.12,scheme:"Sainsbury's Nectar"},
 {id:'iceland',name:'Iceland',factor:1.03},
 {id:'waitrose',name:'Waitrose',factor:1.34,scheme:'myWaitrose'}
];
const rows=[
 // id,name,category,pack label,base pence,emoji,measurable quantity,unit (kg/litre/item)
 ['milk','Semi-skimmed milk','Dairy','2 pints',129,'🥛',1.136,'litre'],
 ['whole-milk','Whole milk','Dairy','2 pints',132,'🥛',1.136,'litre'],
 ['eggs','Free-range eggs','Dairy','6 pack',179,'🥚',6,'item'],
 ['butter','Salted butter','Dairy','250g',215,'🧈',0.25,'kg'],
 ['cheddar','Mature cheddar','Dairy','400g',279,'🧀',0.4,'kg'],
 ['yogurt','Natural yoghurt','Dairy','500g',139,'🥣',0.5,'kg'],
 ['oat-milk','Oat drink','Dairy','1 litre',189,'🥛',1,'litre'],
 ['bread','Wholemeal bread','Bakery','800g',145,'🍞',0.8,'kg'],
 ['white-bread','White sliced bread','Bakery','800g',119,'🍞',0.8,'kg'],
 ['bagels','Plain bagels','Bakery','5 pack',159,'🥯',5,'item'],
 ['croissants','Croissants','Bakery','4 pack',175,'🥐',4,'item'],
 ['wraps','Tortilla wraps','Bakery','8 pack',139,'🫓',8,'item'],
 ['bananas','Bananas','Fruit & veg','5 pack',129,'🍌',5,'item'],
 ['apples','Gala apples','Fruit & veg','6 pack',179,'🍎',6,'item'],
 ['tomatoes','Cherry tomatoes','Fruit & veg','250g',119,'🍅',0.25,'kg'],
 ['potatoes','White potatoes','Fruit & veg','2kg',235,'🥔',2,'kg'],
 ['carrots','Carrots','Fruit & veg','1kg',69,'🥕',1,'kg'],
 ['onions','Brown onions','Fruit & veg','1kg',109,'🧅',1,'kg'],
 ['broccoli','Broccoli','Fruit & veg','1 head',89,'🥦',1,'item'],
 ['spinach','Baby spinach','Fruit & veg','200g',135,'🥬',0.2,'kg'],
 ['strawberries','Strawberries','Fruit & veg','400g',289,'🍓',0.4,'kg'],
 ['oranges','Oranges','Fruit & veg','5 pack',219,'🍊',5,'item'],
 ['chicken','Chicken breast','Meat & fish','650g',489,'🍗',0.65,'kg'],
 ['beef','Beef mince','Meat & fish','500g',439,'🥩',0.5,'kg'],
 ['salmon','Salmon fillets','Meat & fish','2 pack',539,'🐟',2,'item'],
 ['sausages','Pork sausages','Meat & fish','8 pack',279,'🌭',8,'item'],
 ['tuna','Tuna chunks','Meat & fish','4 tins',395,'🐟',4,'item'],
 ['bacon','Back bacon','Meat & fish','300g',319,'🥓',0.3,'kg'],
 ['peas','Frozen peas','Frozen','1kg',179,'🫛',1,'kg'],
 ['chips','Oven chips','Frozen','1.5kg',275,'🍟',1.5,'kg'],
 ['pizza','Margherita pizza','Frozen','1 pizza',225,'🍕',1,'item'],
 ['ice-cream','Vanilla ice cream','Frozen','1 litre',269,'🍨',1,'litre'],
 ['fish-fingers','Fish fingers','Frozen','10 pack',219,'🐟',10,'item'],
 ['pasta','Penne pasta','Cupboard','500g',95,'🍝',0.5,'kg'],
 ['rice','Basmati rice','Cupboard','500g',169,'🍚',0.5,'kg'],
 ['flour','Plain flour','Cupboard','1.5kg',139,'🌾',1.5,'kg'],
 ['sugar','Granulated sugar','Cupboard','1kg',119,'🍬',1,'kg'],
 ['olive-oil','Olive oil','Cupboard','500ml',529,'🫒',0.5,'litre'],
 ['cereal','Corn flakes','Cupboard','500g',199,'🥣',0.5,'kg'],
 ['beans','Baked beans','Cupboard','400g',99,'🥫',0.4,'kg'],
 ['tomato-sauce','Tomato ketchup','Cupboard','500g',169,'🍅',0.5,'kg'],
 ['tea','Breakfast tea','Cupboard','80 bags',255,'🫖',80,'item'],
 ['coffee','Instant coffee','Cupboard','100g',375,'☕',0.1,'kg'],
 ['water','Still water','Drinks','2 litre',89,'💧',2,'litre'],
 ['orange-juice','Orange juice','Drinks','1 litre',175,'🧃',1,'litre'],
 ['apple-juice','Apple juice','Drinks','1 litre',159,'🧃',1,'litre'],
 ['cola','Cola','Drinks','2 litre',199,'🥤',2,'litre'],
 ['lemonade','Lemonade','Drinks','2 litre',119,'🍋',2,'litre'],
 ['squash','Orange squash','Drinks','1 litre',149,'🍊',1,'litre'],
 ['detergent','Laundry detergent','Household','1.5 litre',445,'🧺',1.5,'litre'],
 ['dish-soap','Washing-up liquid','Household','500ml',115,'🫧',0.5,'litre'],
 ['toilet-roll','Toilet rolls','Household','9 pack',425,'🧻',9,'item'],
 ['kitchen-roll','Kitchen towels','Household','2 pack',225,'🧻',2,'item'],
 ['bin-bags','Bin bags','Household','20 pack',235,'🗑️',20,'item'],
 ['shampoo','Shampoo','Toiletries','400ml',295,'🧴',0.4,'litre'],
 ['toothpaste','Toothpaste','Toiletries','75ml',179,'🪥',0.075,'litre'],
 ['soap','Hand soap','Toiletries','250ml',139,'🧼',0.25,'litre'],
 ['deodorant','Deodorant','Toiletries','150ml',225,'🧴',0.15,'litre'],
 ['nappies','Nappies','Baby','40 pack',519,'👶',40,'item'],
 ['wipes','Baby wipes','Baby','60 pack',115,'👶',60,'item'],
 ['baby-food','Baby fruit puree','Baby','4 pouches',385,'🍼',4,'item'],
 ['baby-bath','Baby wash','Baby','400ml',335,'🛁',0.4,'litre']
];
const overrides={
 milk:[{id:'standard',label:'2 pints',measure:1.136,priceFactor:1},{id:'large',label:'4 pints',measure:2.272,priceFactor:1.72}],
 rice:[{id:'standard',label:'500g',measure:0.5,priceFactor:1},{id:'large',label:'1kg',measure:1,priceFactor:1.76}],
 eggs:[{id:'standard',label:'6 pack',measure:6,priceFactor:1},{id:'large',label:'12 pack',measure:12,priceFactor:1.8}],
 cereal:[{id:'standard',label:'500g',measure:0.5,priceFactor:1},{id:'large',label:'1kg',measure:1,priceFactor:1.79}],
 pasta:[{id:'standard',label:'500g',measure:0.5,priceFactor:1},{id:'large',label:'1kg',measure:1,priceFactor:1.84}]
};
export const catalogue=rows.map(([id,name,category,pack,basePence,emoji,measure,unit],i)=>({
 id,name,category,pack,basePence,emoji,measure,unit,gtin:null,
 variants:overrides[id]||[{id:'standard',label:pack,measure,priceFactor:1}],
 tiers:['Value','Own-label','Branded'],
 demoIndex:i
}));
export const storeIds=stores.map(s=>s.id);
export const loyaltySchemes=stores.filter(s=>s.scheme).map(s=>({id:s.id,name:s.scheme}));
export const categories=[...new Set(catalogue.map(p=>p.category))];
export const money=p=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(p/100);
export const postcodeDistrict=text=>text.replace(/\s+/g,'').toUpperCase().slice(0,-3);
export function priceFor(productId,storeId,options={}){
 const p=catalogue.find(x=>x.id===productId), store=stores.find(x=>x.id===storeId);
 if(!p||!store)return null;
 const variant=p.variants.find(v=>v.id===(options.variant||'standard'))||p.variants[0];
 const tier=options.tier||'Own-label';
 // A few absent products demonstrate incomplete baskets.
 if((productId==='tomatoes'&&storeId==='iceland')||(productId==='baby-bath'&&storeId==='aldi'))return null;
 const zigzag=1+(((p.demoIndex*7+stores.indexOf(store)*11)%17)-8)/45;
 const tierFactor=tier==='Value'?0.77:tier==='Branded'?1.48:1;
 const shelfPricePence=Math.max(10,Math.round(p.basePence*store.factor*zigzag*tierFactor*variant.priceFactor));
 const eligible=!!store.scheme&&p.demoIndex%3===0;
 const loyaltyPricePence=eligible?Math.max(1,Math.round(shelfPricePence*0.81)):null;
 const hasCard=!!options.loyalty?.includes(storeId);
 const effectivePence=hasCard&&loyaltyPricePence!==null?loyaltyPricePence:shelfPricePence;
 // Deliberately simulated freshness: never pass these dates off as actual retailer checks.
 const daysOld=(p.demoIndex+stores.indexOf(store)*3)%11;
 const capturedAt=new Date(Date.now()-daysOld*86400000).toISOString();
 return {productId,retailer:storeId,retailerSku:'DEMO-'+productId+'-'+storeId,gtin:null,
 packSize:variant.label,unit:p.unit,measure:variant.measure,tier,variant:variant.id,
 shelfPricePence,loyaltyPricePence,loyaltyScheme:store.scheme||null,
 effectivePence,unitPricePence:Math.round(effectivePence/variant.measure),
 capturedAt,daysOld,source:DEMO_SOURCE};
}
export function compareBasket(items,preferences={}){
 const selected=stores.filter(s=>!preferences.stores||preferences.stores.includes(s.id));
 return selected.map(store=>{
 let totalPence=0,withoutLoyaltyPence=0,matched=0,required=0;
 const lines=[];
 for(const [id,entry] of Object.entries(items)){
  if(!entry||!Number.isInteger(entry.quantity)||entry.quantity<=0)continue;
  const p=catalogue.find(x=>x.id===id);
  if(!p)continue;
  required++;
  const quote=priceFor(id,store.id,{variant:entry.variant,tier:entry.tier,loyalty:preferences.loyalty||[]});
  if(quote){matched++;totalPence+=quote.effectivePence*entry.quantity;withoutLoyaltyPence+=quote.shelfPricePence*entry.quantity;}
  lines.push({product:p,entry,quote});
 }
 return {storeId:store.id,name:store.name,scheme:store.scheme||null,totalPence,
  withoutLoyaltyPence,matched,required,complete:required>0&&matched===required,lines};
 }).sort((a,b)=>Number(b.complete)-Number(a.complete)||a.totalPence-b.totalPence||a.name.localeCompare(b.name));
}
export function bestSplit(items,preferences={}){
 const candidates=compareBasket(items,preferences);
 const complete=candidates.filter(s=>s.complete);
 if(!complete.length)return null;
 const bestSingle=complete[0];
 let winner=null;
 for(let i=0;i<complete.length;i++)for(let j=i+1;j<complete.length;j++){
  const a=complete[i],b=complete[j];let totalPence=0;
  const assignments=[];
  for(const line of a.lines){
   const other=b.lines.find(v=>v.product.id===line.product.id);
   if(!line.quote||!other?.quote)continue;
   const from=line.quote.effectivePence<=other.quote.effectivePence?a:b;
   const price=from===a?line.quote.effectivePence:other.quote.effectivePence;
   totalPence+=price*line.entry.quantity;
   assignments.push({id:line.product.id,storeId:from.storeId,pricePence:price*line.entry.quantity});
  }
  if(!winner||totalPence<winner.totalPence)winner={storeIds:[a.storeId,b.storeId],names:[a.name,b.name],totalPence,assignments};
 }
 if(!winner)return null;
 return {...winner,savingsPence:bestSingle.totalPence-winner.totalPence,visible:bestSingle.totalPence-winner.totalPence>=300};
}
export function historyFor(productId,storeId,options={}){
 const now=priceFor(productId,storeId,options);
 if(!now)return [];
 // Twelve reproducible synthetic weekly prices, not live history.
 return Array.from({length:12},(_,i)=>({week:i+1,pricePence:Math.max(10,Math.round(now.effectivePence*(1+((i*13+productId.length)%17-8)/100)))}));
}
export function validatedShareItems(raw){
 const entries={};
 if(!raw||typeof raw!=='object')return entries;
 for(const p of catalogue){
  const e=raw[p.id];
  if(e&&Number.isInteger(e.quantity)&&e.quantity>0&&e.quantity<=99){
   entries[p.id]={quantity:e.quantity,tier:['Value','Own-label','Branded'].includes(e.tier)?e.tier:'Own-label',variant:p.variants.some(v=>v.id===e.variant)?e.variant:'standard'};
  }
 }
 return entries;
}
