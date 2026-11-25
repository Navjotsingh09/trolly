import test from 'node:test';
import assert from 'node:assert/strict';
import {bestSplit,catalogue,compareBasket,priceFor,loyaltySchemes,historyFor,validatedShareItems} from './phase1.mjs';
const own={milk:{quantity:1,tier:'Own-label',variant:'standard'},bread:{quantity:1,tier:'Own-label',variant:'standard'}};
test('catalogue spans 10 categories and at least 60 items',()=>{assert.ok(catalogue.length>=60);assert.ok(new Set(catalogue.map(p=>p.category)).size>=10)});
test('loyalty affects Tesco and may change ranks',()=>{
 const withCard=compareBasket(own,{loyalty:['tesco']}).find(s=>s.storeId==='tesco');
 const without=compareBasket(own,{loyalty:[]}).find(s=>s.storeId==='tesco');
 assert.ok(withCard.totalPence<without.totalPence);
 assert.equal(withCard.withoutLoyaltyPence,without.totalPence);
 assert.equal(loyaltySchemes.length,5);
});
test('computed unit price gives a large pack discount',()=>{
 const small=priceFor('milk','aldi',{variant:'standard'});
 const big=priceFor('milk','aldi',{variant:'large'});
 assert.ok(big.unitPricePence<small.unitPricePence);
 assert.equal(big.unitPricePence,Math.round(big.effectivePence/2.272));
});
test('tiers recalculate pence totals',()=>{
 const ownPrice=compareBasket(own).find(x=>x.storeId==='aldi').totalPence;
 const value=compareBasket({...own,milk:{...own.milk,tier:'Value'}}).find(x=>x.storeId==='aldi').totalPence;
 assert.ok(value<ownPrice);
});
test('unavailable items do not count toward complete baskets',()=>{
 const basket={...own,tomatoes:{quantity:1,tier:'Own-label',variant:'standard'}};
 const iceland=compareBasket(basket).find(x=>x.storeId==='iceland');
 assert.equal(iceland.complete,false);
 assert.equal(iceland.matched,2);
});
test('store selection excludes unselected supermarket',()=>{
 assert.deepEqual(compareBasket(own,{stores:['tesco']}).map(x=>x.storeId),['tesco']);
});
test('split totals equal sum of chosen assignment totals',()=>{
 const split=bestSplit(own);
 assert.ok(split);
 assert.equal(split.totalPence,split.assignments.reduce((sum,x)=>sum+x.pricePence,0));
 assert.ok(split.savingsPence>=0);
});
test('share import guards against invalid products and quantities',()=>{
 const data=validatedShareItems({milk:{quantity:2,tier:'Value',variant:'large'},bad:{quantity:300},bread:{quantity:-1}});
 assert.deepEqual(Object.keys(data),['milk']);
});
test('price history contains exactly twelve simulated weeks',()=>{
 assert.equal(historyFor('milk','aldi').length,12);
});
