import React,{useEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Plus,Trash2,Save,Loader2,DollarSign} from 'lucide-react';
import {supabase} from '../lib/supabase';
import {costShares,costTotal,legacyCostKeys,validateCostDrafts} from '../lib/convention-costs';
import type {CostDraft,CostItem,CostParticipant} from '../lib/convention-costs';
const inputClass='w-full px-3 py-2 border border-zinc-300 dark:border-hermes-teal/30 rounded-none bg-white/40 dark:bg-hermes-darkBg/60 text-zinc-900 dark:text-hermes-ivory focus:outline-none focus:ring-1 focus:ring-hermes-blue dark:focus:ring-hermes-teal';
export function ConventionCosts({convention,readOnly=false,onSaved,onTotalChange}:{convention:any;readOnly?:boolean;onSaved?:(value:any)=>void;onTotalChange?:(total:number)=>void}){
 const {t,i18n}=useTranslation();const [rows,setRows]=useState<CostDraft[]>([]);const [revision,setRevision]=useState(0);const [dirty,setDirty]=useState(false);const dirtyRef=useRef(false);const loadedId=useRef('');const [saving,setSaving]=useState(false);const [notice,setNotice]=useState('');const [error,setError]=useState('');
 const [participants,setParticipants]=useState<CostParticipant[]>([]);const [participantsReady,setParticipantsReady]=useState(false);
 useEffect(()=>{let active=true;setParticipantsReady(false);supabase.rpc('get_convention_cost_participants',{p_convention:convention.id}).then(({data,error})=>{if(active){if(error)setError(t('conventionCosts.participantsFailed'));else {setParticipants(data||[]);setParticipantsReady(true);}}});return()=>{active=false;};},[convention]);
 const money=(value:number)=>new Intl.NumberFormat(i18n.language,{style:'currency',currency:'EUR'}).format(value);
 useEffect(()=>{
   const changedEvent=loadedId.current!==convention.id;
   if(!changedEvent&&dirtyRef.current)return;
   loadedId.current=convention.id;
   const items:CostItem[]=Array.isArray(convention.cost_items)?convention.cost_items:legacyCostKeys.filter(key=>Number(convention[key]||0)!==0).map(key=>({id:'legacy-'+key,title:t('conventionCosts.'+key),amount:Number(convention[key]),split:'team',participant_ids:[]}));
   setRows(items.map(item=>({...item,amount:String(item.amount)})));setRevision(convention.cost_items_revision||0);setDirty(false);dirtyRef.current=false;setNotice('');setError('');
 },[convention.id,convention.cost_items_revision,convention.cost_items]);
 const total=costTotal(rows.map(row=>({id:row.id,title:row.title,amount:Number.isFinite(Number(row.amount))&&Number(row.amount)>=0?Number(row.amount):0})));
 const previewItems:CostItem[]=rows.map(row=>({...row,amount:Number.isFinite(Number(row.amount))&&Number(row.amount)>=0?Number(row.amount):0}));const shares=costShares(previewItems,participants);
 useEffect(()=>{onTotalChange?.(total);},[total,onTotalChange]);
 function edit(next:CostDraft[]){setRows(next);setDirty(true);dirtyRef.current=true;setNotice('');setError('');}
 async function save(e:React.FormEvent){e.preventDefault();setError('');setNotice('');let items:CostItem[];try{items=validateCostDrafts(rows);}catch(e:any){setError(t(e.message==='participants'?'conventionCosts.chooseParticipants':'conventionCosts.invalid'+(e.message==='title'?'Title':'Amount')));return;}
  setSaving(true);try{const {data,error}=await supabase.rpc('save_convention_costs',{p_convention:convention.id,p_expected:revision,p_items:items}).single();if(error)throw error;setRows(items.map(item=>({...item,amount:String(item.amount)})));setRevision((data as any).cost_items_revision);setDirty(false);dirtyRef.current=false;onSaved?.(data);setNotice(t('conventionCosts.saved'));}catch(e:any){setError(e.message?.includes('COST_CONFLICT')?t('conventionCosts.conflict'):t('conventionCosts.saveFailed'));}finally{setSaving(false);}
 }
 return <section className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg rounded-none overflow-hidden">
  <div className="p-4 border-b border-zinc-200 dark:border-hermes-teal/30 bg-zinc-50 dark:bg-hermes-darkBg"><h2 className="text-lg font-bold text-zinc-900 dark:text-hermes-ivory flex items-center gap-2"><DollarSign className="w-5 h-5 text-zinc-500 dark:text-hermes-teal"/>{t('conventionCosts.heading')}</h2><p className="text-sm text-zinc-500 dark:text-hermes-teal mt-1">{t(readOnly?'conventionCosts.shared':'conventionCosts.hint')}</p></div>
  <form className="p-4 space-y-4" onSubmit={save}>
   {rows.length===0&&<p className="text-sm text-zinc-500 dark:text-hermes-teal">{t('conventionCosts.empty')}</p>}
   {rows.map((row,index)=><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end border-b border-zinc-200/50 dark:border-hermes-teal/20 pb-3" key={row.id}>
    <label className="block text-xs font-bold text-zinc-700 dark:text-hermes-ivoryDim"><span className="block mb-1">{t('conventionCosts.title')}</span>{readOnly?<p className="text-sm font-normal py-2 break-words">{row.title}</p>:<input aria-label={t('conventionCosts.title')+' '+(index+1)} maxLength={200} value={row.title} disabled={saving} placeholder={t('conventionCosts.titlePlaceholder')} className={inputClass} onChange={e=>edit(rows.map((r,i)=>i===index?{...r,title:e.target.value}:r))}/>}</label>
    <label className="block text-xs font-bold text-zinc-700 dark:text-hermes-ivoryDim"><span className="block mb-1">{t('conventionCosts.amount')} (€)</span>{readOnly?<p className="text-sm font-normal py-2">{money(Number(row.amount))}</p>:<input aria-label={t('conventionCosts.amount')+' '+(index+1)+' (€)'} type="number" min="0" max="1000000000" step="0.01" value={row.amount} disabled={saving} placeholder="0.00" className={inputClass} onChange={e=>edit(rows.map((r,i)=>i===index?{...r,amount:e.target.value}:r))}/>}</label>
    <div className="text-xs text-zinc-700 dark:text-hermes-ivoryDim"><span className="block mb-1 font-bold">{t('conventionCosts.paidBy')}</span>{readOnly?<p className="py-2 text-sm">{row.split==='selected'?(row.participant_ids||[]).map(id=>participants.find(p=>p.id===id)?.name||t('conventionCosts.formerParticipant')).join(', '):t('conventionCosts.sharedByAll')}</p>:<><select aria-label={t('conventionCosts.paidBy')+' '+(index+1)} className={inputClass} disabled={saving} value={row.split||'team'} onChange={e=>edit(rows.map((r,i)=>i===index?{...r,split:e.target.value as 'team'|'selected',participant_ids:[]}:r))}><option value="team">{t('conventionCosts.sharedByAll')}</option><option value="selected">{t('conventionCosts.choosePeople')}</option></select>{row.split==='selected'&&<div className="flex flex-wrap gap-2 mt-2">{participants.map(person=><label className="inline-flex items-center gap-1 font-normal" key={person.id}><input type="checkbox" disabled={saving} checked={(row.participant_ids||[]).includes(person.id)} onChange={e=>edit(rows.map((r,i)=>i===index?{...r,participant_ids:e.target.checked?[...(r.participant_ids||[]),person.id]:(r.participant_ids||[]).filter(id=>id!==person.id)}:r))}/>{person.name}</label>)}</div>}</>}</div>
    {!readOnly&&<button type="button" disabled={saving} aria-label={t('conventionCosts.remove')+' '+(index+1)} title={t('conventionCosts.remove')} className="p-2.5 text-zinc-400 hover:text-red-600" onClick={()=>edit(rows.filter((_,i)=>i!==index))}><Trash2 className="w-5 h-5"/></button>}
   </div>)}
   <div className="border-t border-zinc-200 dark:border-hermes-teal/30 pt-4 flex flex-wrap items-center justify-between gap-4">
    <div>{!readOnly&&<button type="button" disabled={saving} onClick={()=>edit([...rows,{id:crypto.randomUUID(),title:'',amount:'',split:'team',participant_ids:[]}])} className="hermes-btn-secondary flex items-center gap-2 px-3 py-2"><Plus className="w-4 h-4"/>{t('conventionCosts.add')}</button>}</div>
    <p className="text-lg font-bold text-zinc-900 dark:text-hermes-ivory">{t('conventionCosts.total')} : <span data-testid="cost-total">{money(total)}</span></p>
   </div>
   <div className='border-t border-zinc-200 dark:border-hermes-teal/30 pt-3'><h3 className='text-sm font-bold text-zinc-900 dark:text-hermes-ivory mb-2'>{t('conventionCosts.eachShare')}</h3><div className='flex flex-wrap gap-x-6 gap-y-2'>{Object.entries(shares).map(([id,value])=><p key={id} className='text-sm text-zinc-700 dark:text-hermes-ivoryDim'>{participants.find(p=>p.id===id)?.name||t('conventionCosts.formerParticipant')} : <strong>{money(value)}</strong></p>)}</div><p className='text-xs text-zinc-500 dark:text-hermes-teal mt-2'>{t('conventionCosts.equalSplit')}</p></div>
   {!readOnly&&<div className="flex flex-wrap items-center justify-end gap-3">{dirty&&<span className="text-xs text-zinc-500 dark:text-hermes-teal">{t('conventionCosts.unsaved')}</span>}<button type="submit" disabled={saving||!dirty||!participantsReady} className="hermes-btn-primary flex items-center gap-2 px-4 py-2">{saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}{t('conventionCosts.save')}</button></div>}
   {notice&&<p role="status" className="text-sm text-green-700 dark:text-green-400">{notice}</p>}{error&&<p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
  </form>
 </section>;
}
