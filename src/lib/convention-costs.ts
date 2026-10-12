export interface CostItem { id: string; title: string; amount: number; split?: 'team'|'selected'; participant_ids?: string[] }
export interface CostParticipant {id:string;name:string;is_manager?:boolean}
export interface CostDraft { id: string; title: string; amount: string; split?: 'team'|'selected'; participant_ids?:string[] }
export const legacyCostKeys = ['booth_fee','accommodation_fee','travel_fee','food_fee'] as const;
export function costTotal(items: CostItem[]): number {
  return items.reduce((sum,item)=>sum+Math.round(Number(item.amount)*100),0)/100;
}
export function conventionCostTotal(convention: any): number {
  if (Array.isArray(convention?.cost_items)) return costTotal(convention.cost_items);
  return legacyCostKeys.reduce((sum,key)=>sum+Math.round(Number(convention?.[key]||0)*100),0)/100;
}
export function validateCostDrafts(rows: CostDraft[]): CostItem[] {
  return rows.filter(row=>row.title.trim()||row.amount.trim()).map(row=>{
    const title=row.title.trim(); const amount=Number(row.amount);
    if(!title||title.length>200) throw new Error('title');
    if(!row.amount.trim()||!Number.isFinite(amount)||amount<0||amount>1000000000||Math.abs(amount*100-Math.round(amount*100))>1e-6) throw new Error('amount');
    const split=row.split||'team';const participants=[...new Set(row.participant_ids||[])];if(split==='selected'&&!participants.length)throw new Error('participants');return {id:row.id,title,amount:Math.round(amount*100)/100,split,participant_ids:split==='team'?[]:participants};
  });
}

export function costShares(items:CostItem[],participants:CostParticipant[]):Record<string,number>{
 const cents:Record<string,number>={};for(const person of participants)cents[person.id]=0;
 for(const item of items){const ids=[...new Set(item.split==='selected'?item.participant_ids||[]:participants.map(p=>p.id))];if(!ids.length)continue;const amount=Math.round(Number(item.amount)*100),base=Math.floor(amount/ids.length),remainder=amount-base*ids.length;ids.forEach((id,i)=>{cents[id]=(cents[id]||0)+base+(i<remainder?1:0);});}
 return Object.fromEntries(Object.entries(cents).map(([id,value])=>[id,value/100]));
}
