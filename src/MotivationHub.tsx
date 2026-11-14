import { useEffect, useState } from 'react';
import { api } from './lib';
import { Flame, Users, Sparkles, X } from 'lucide-react';
type VisitData={lastDay:string;streak:number;best:number;visits:number;invites:number;rewards:number[]};
const rewards=[{day:7,icon:'🥉',title:'Consistency Star'},{day:14,icon:'🎁',title:'Two-Week Champion'},{day:21,icon:'🚀',title:'Momentum Master'},{day:30,icon:'👑',title:'ISOMO Legend'}];
const dayKey=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Kigali'}).format(new Date());
export default function MotivationHub({userId,name}:{userId:string;name:string}){
 const storageKey='isomo_motivation_'+userId,today=dayKey();
 const [data,setData]=useState<VisitData>({lastDay:'',streak:0,best:0,visits:0,invites:0,rewards:[]});
 const [ready,setReady]=useState(false),[open,setOpen]=useState(false);
 const dismiss=()=>{try{localStorage.setItem('isomo_motivation_dismissed_'+userId+'_'+today,'1')}catch{}setOpen(false)};
 useEffect(()=>{let active=true;const load=async()=>{let old:VisitData={lastDay:'',streak:0,best:0,visits:0,invites:0,rewards:[]};try{const raw=localStorage.getItem(storageKey);if(raw)old={...old,...JSON.parse(raw)}}catch{}let cloud:any={};try{const r=await api.get('/api/progress');cloud=r.data.progress||{};if(cloud._motivation)old={...old,...cloud._motivation}}catch{}if(!active)return;if(old.lastDay!==today){const yesterday=new Date(Date.now()-86400000).toLocaleDateString('en-CA',{timeZone:'Africa/Kigali'});const streak=old.lastDay===yesterday?old.streak+1:1;old={...old,lastDay:today,streak,best:Math.max(old.best,streak),visits:old.visits+1,rewards:[...new Set([...old.rewards,...rewards.filter(r=>streak>=r.day).map(r=>r.day)])]}}setData(old);setReady(true);try{setOpen(!localStorage.getItem('isomo_motivation_dismissed_'+userId+'_'+today))}catch{setOpen(true)}try{localStorage.setItem(storageKey,JSON.stringify(old))}catch{}try{await api.post('/api/progress',{progress:{...cloud,_motivation:old}})}catch{}};load();return()=>{active=false}},[storageKey,today,userId]);
 const invite=async()=>{const code='ISOMO-'+userId.replace(/[^a-z0-9]/gi,'').slice(-6).toUpperCase();const url=window.location.origin+'/?invite='+encodeURIComponent(code);const text='Join me on ISOMO Academy DET Prep! Let us build our English skills together: '+url;try{if(navigator.share)await navigator.share({title:'Join ISOMO DET Prep',text,url});else await navigator.clipboard.writeText(text);setData(d=>{const n={...d,invites:d.invites+1};try{localStorage.setItem(storageKey,JSON.stringify(n))}catch{}api.get('/api/progress').then((r:any)=>api.post('/api/progress',{progress:{...(r.data.progress||{}),_motivation:n}})).catch(()=>{});return n})}catch(e:any){if(e?.name!=='AbortError')return}};
 if(!ready||!open)return null;
 const power=data.streak+Math.floor(data.invites/3);
 return <div className="motivation-popup-backdrop" role="presentation" onClick={dismiss}>
  <section className="motivation-popup" role="dialog" aria-modal="true" aria-label="Welcome back and learning streak">
   <button className="motivation-popup-close" type="button" aria-label="Close welcome message" onClick={dismiss}><X size={18}/></button>
   <div className="motivation-kicker">✦ YOUR ISOMO JOURNEY ✦</div>
   <h2>Welcome back, {name.trim().split(/\s+/)[0]}! 🌟</h2>
   <p className="motivation-popup-message">Your visit makes a difference. Every time you return, you strengthen a habit that can open new doors. Keep showing up — your future self will thank you!</p>
   <div className="motivation-popup-stats">
    <div className="motivation-stat"><strong><Flame size={20} style={{display:'inline',verticalAlign:'-3px'}}/> {data.streak}</strong><span>day streak</span></div>
    <div className="motivation-stat"><strong>{data.visits}</strong><span>learning visits</span></div>
    <div className="motivation-stat"><strong>{data.best}</strong><span>personal best</span></div>
    <div className="motivation-stat"><strong>{power}</strong><span>streak power</span></div>
   </div>
   <div className="motivation-kicker">YOUR REWARD MILESTONES</div>
   <div className="motivation-rewards">{rewards.map(r=><div key={r.day} className={'motivation-reward '+(data.rewards.includes(r.day)?'earned':'')}><span>{r.icon}</span><strong>{r.day}-day gift</strong><small>{data.rewards.includes(r.day)?'UNLOCKED · '+r.title:r.title}</small></div>)}</div>
   {data.streak>=7&&<div className="motivation-toast">🎉 {data.streak>=14?'Your 14-day gift is unlocked! You are building an excellent habit.':'You earned your first 7-day badge! Come back tomorrow to protect your streak.'}</div>}
   <div className="motivation-invite"><div><strong><Users size={16} style={{display:'inline',verticalAlign:'-3px'}}/> Grow your learning circle</strong><p>Invite friends to learn with you. Every 3 invitations shared adds a bonus point to your streak power.</p></div><button className="btn" type="button" onClick={invite}>Invite a friend <Sparkles size={15}/></button></div>
   <div className="motivation-popup-hint">Tap anywhere to continue learning</div>
  </section>
 </div>;
}
