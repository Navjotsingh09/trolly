import test from 'node:test';import assert from 'node:assert/strict';import {calculateBaskets,formatGBP} from './index.mjs';
test('empty basket is not complete',()=>assert.equal(calculateBaskets({})[0].complete,false));
test('unavailable items produce incomplete baskets',()=>assert.equal(calculateBaskets({tomatoes:1}).at(-1).id,'iceland'));
test('quantities use precise pence',()=>assert.equal(calculateBaskets({milk:2}).find(s=>s.id==='aldi').totalPence,238));
test('GBP formatting',()=>assert.equal(formatGBP(125),'£1.25'));
