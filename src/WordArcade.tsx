import { useState } from 'react';
import { ArrowLeft, Candy, Gamepad2, Sparkles, Droplets, GraduationCap } from 'lucide-react';
import TetrisGame from './TetrisGame';
import CandyMatch from './CandyMatch';
import WaterSort from './WaterSort';
import SATQuest from './SATQuest';

export default function WordArcade({userId,onBack,onStudySkill}:{userId:string;name:string;progress:Record<string,any>;onBack:()=>void;onStudySkill:(skill:string)=>void}) {
 const [game,setGame]=useState<'menu'|'blocks'|'candy'|'water'|'sat'>('menu');
 if(game==='blocks')return <TetrisGame userId={userId} onBack={()=>setGame('menu')} onStudySkill={onStudySkill}/>;
 if(game==='candy')return <CandyMatch onBack={()=>setGame('menu')}/>;
 if(game==='water')return <WaterSort onBack={()=>setGame('menu')}/>;
 if(game==='sat')return <SATQuest userId={userId} onBack={()=>setGame('menu')}/>;
 return <div className="page arcade-page" style={{maxWidth:980,margin:'0 auto'}}>
  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}><button className="btn outline" onClick={onBack}><ArrowLeft size={17}/> Back</button><div><div style={{fontSize:12,fontWeight:850,letterSpacing:1.5,opacity:.7}}>ISOMO ACADEMY · PLAY & LEARN</div><h1 style={{margin:'3px 0'}}>Word Arcade</h1><p style={{margin:0,opacity:.72}}>Choose a game and enjoy a quick brain break.</p></div></div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))',gap:18}}>
   <button onClick={()=>setGame('blocks')} style={{textAlign:'left',padding:0,border:0,borderRadius:22,overflow:'hidden',cursor:'pointer',background:'linear-gradient(145deg,#152c52,#101827)',color:'white',boxShadow:'0 14px 35px #0002'}}>
    <div style={{padding:22,minHeight:230,display:'flex',flexDirection:'column',justifyContent:'space-between',background:'radial-gradient(circle at 85% 15%,#436ab8,#152c52 52%,#101827)'}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:900,letterSpacing:1}}>BLOCK PUZZLE</span><Gamepad2 size={25}/></div><div style={{display:'flex',justifyContent:'center',gap:6,transform:'rotate(-8deg)'}}>{['#38bdf8','#a78bfa','#4ade80','#fb7185'].map((c,i)=><span key={i} style={{width:43,height:43,borderRadius:9,background:c,boxShadow:'inset 0 3px 8px #fff8,0 5px 12px #0004'}}/>)}</div><div><h2 style={{fontSize:26,margin:'0 0 5px'}}>ISOMO Block Blast</h2><p style={{margin:0,color:'#d5e2ff'}}>Fit pieces, clear rows and columns, build combos.</p></div></div><div style={{padding:'13px 22px',fontWeight:850,background:'#0c1729'}}>Play Block Blast →</div>
   </button>
   <button onClick={()=>setGame('candy')} style={{textAlign:'left',padding:0,border:0,borderRadius:22,overflow:'hidden',cursor:'pointer',background:'linear-gradient(145deg,#6936a2,#211044)',color:'white',boxShadow:'0 14px 35px #0002'}}>
    <div style={{padding:22,minHeight:230,display:'flex',flexDirection:'column',justifyContent:'space-between',background:'radial-gradient(circle at 85% 15%,#b477d8,#6936a2 48%,#211044)'}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:900,letterSpacing:1}}>MATCH THREE</span><Candy size={25}/></div><div style={{display:'flex',justifyContent:'center',gap:10,fontSize:42,filter:'drop-shadow(0 5px 5px #27103b66)'}}><span>🍓</span><span>🍋</span><span>🍇</span><span>🍊</span></div><div><h2 style={{fontSize:26,margin:'0 0 5px'}}>Sweet Match</h2><p style={{margin:0,color:'#f0dcff'}}>Swap colourful sweets, make matches and trigger cascades.</p></div></div><div style={{padding:'13px 22px',fontWeight:850,background:'#35165f'}}>Play Sweet Match →</div>
   </button>


   <button onClick={()=>setGame('sat')} style={{textAlign:'left',padding:0,border:0,borderRadius:22,overflow:'hidden',cursor:'pointer',background:'linear-gradient(145deg,#173c72,#101a35)',color:'white',boxShadow:'0 14px 35px #0002'}}>
    <div style={{padding:22,minHeight:230,display:'flex',flexDirection:'column',justifyContent:'space-between',background:'radial-gradient(circle at 85% 15%,#6d91e6,#294c91 48%,#101a35)'}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:900,letterSpacing:1}}>SAT EXAM TRAINING</span><GraduationCap size={27}/></div><div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:13,fontSize:35}}><span>📖</span><span>✍️</span><span>➗</span><span>🏆</span></div><div><h2 style={{fontSize:26,margin:'0 0 5px'}}>SAT Quest</h2><p style={{margin:0,color:'#e0eaff'}}>Challenge yourself in SAT Reading & Writing and Math. Learn from every answer.</p></div></div><div style={{padding:'13px 22px',fontWeight:850,background:'#172e5a'}}>Start SAT practice →</div>
   </button>

   <button onClick={()=>setGame('water')} style={{textAlign:'left',padding:0,border:0,borderRadius:22,overflow:'hidden',cursor:'pointer',background:'linear-gradient(145deg,#155d82,#0c233d)',color:'white',boxShadow:'0 14px 35px #0002'}}>
    <div style={{padding:22,minHeight:230,display:'flex',flexDirection:'column',justifyContent:'space-between',background:'radial-gradient(circle at 85% 15%,#48a9ce,#155d82 48%,#0c233d)'}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:900,letterSpacing:1}}>SORT & RELAX</span><Droplets size={25}/></div><div style={{display:'flex',justifyContent:'center',alignItems:'end',gap:12,height:76}}>{[['#ff6384','#42c7f4','#ffd34e'],['#9b7cff','#53d69a'],['#ff9852','#ed75df','#a8dc55']].map((colors,i)=><div key={i} style={{width:25,height:65,border:'2px solid #d7f4ffbb',borderTop:0,borderRadius:'3px 3px 12px 12px',display:'flex',flexDirection:'column-reverse',padding:2,background:'#ffffff18',boxShadow:'inset 2px 0 5px #fff5'}}>{colors.map((c,j)=><span key={j} style={{height:'25%',background:c,borderRadius:3}}/>)}</div>)}</div><div><h2 style={{fontSize:26,margin:'0 0 5px'}}>Water Sort</h2><p style={{margin:0,color:'#d4f2ff'}}>Pour colourful layers into matching tubes. Relax, plan and solve.</p></div></div><div style={{padding:'13px 22px',fontWeight:850,background:'#0a304a'}}>Play Water Sort →</div>
   </button>
  </div>
  <p style={{textAlign:'center',opacity:.65,fontSize:13,marginTop:20}}><Sparkles size={14} style={{verticalAlign:'middle'}}/> More games and challenges will appear here.</p>
 </div>;
}
