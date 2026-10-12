import assert from 'node:assert/strict';
import {costTotal,conventionCostTotal,validateCostDrafts,costShares} from '../src/lib/convention-costs.ts';
const row=(title,amount,id=title)=>({id,title,amount:String(amount)});
const items=validateCostDrafts([row('Noélie ticket',120),row('Mike ticket',120),row('Manager pass',0),row('Apartment',315.75)]);
assert.equal(costTotal(items),555.75);
assert.equal(costTotal([{id:'a',title:'A',amount:.1},{id:'b',title:'B',amount:.2}]),.3);
assert.equal(conventionCostTotal({booth_fee:100,accommodation_fee:200}),300);
assert.equal(conventionCostTotal({booth_fee:100,accommodation_fee:200,cost_items:items}),555.75,'legacy fields must not be counted a second time');
assert.equal(conventionCostTotal({booth_fee:100,cost_items:[]}),0,'an explicitly empty manual list means zero');
assert.deepEqual(validateCostDrafts([row('', '')]),[]);
assert.throws(()=>validateCostDrafts([row('',100)]));
for(const amount of [-1,'',.005,Infinity,'not a price'])assert.throws(()=>validateCostDrafts([row('Ticket',amount)]));
assert.equal(validateCostDrafts([row('Free manager badge',0)])[0].amount,0);
console.log('PASS: person-specific prices, zero fees, exact cents, legacy compatibility, no duplicate costs, invalid input');

const team=[{id:'manager',name:'Manager'},{id:'noelie',name:'Noélie'},{id:'mike',name:'Mike'}];
const splitItems=validateCostDrafts([
 {...row('Shared apartment',300),split:'team'},
 {...row('Noélie ticket',120),split:'selected',participant_ids:['noelie']},
 {...row('Artist booth',240),split:'selected',participant_ids:['noelie','mike']},
 {...row('Free manager badge',0),split:'selected',participant_ids:['manager']}
]);
assert.deepEqual(costShares(splitItems,team),{manager:100,noelie:340,mike:220});
const centsShares=costShares([{id:'a',title:'Shared',amount:100,split:'team'}],team);
assert.deepEqual(centsShares,{manager:33.34,noelie:33.33,mike:33.33});
assert.equal(Math.round(Object.values(centsShares).reduce((a,b)=>a+b,0)*100),10000);
assert.throws(()=>validateCostDrafts([{...row('Ticket',10),split:'selected',participant_ids:[]}]));
assert.deepEqual(costShares([{id:'a',title:'Ticket',amount:10,split:'selected',participant_ids:['mike','mike']}],team),{manager:0,noelie:0,mike:10});
console.log('PASS: team and selected-person splitting, free badge, duplicate participants, exact cent conservation');
