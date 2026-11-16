import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RotateCcw, Undo2, Lightbulb, Volume2, VolumeX, Pause, Play, HelpCircle, X } from 'lucide-react';
type Tubes=string[][];
const CAP=4, COLORS=['#ff5c7a','#35b8ef','#ffc83d','#9874ed','#43c98a','#ff914d','#e96acb','#9bcf39','#4778ed','#ef795f','#26c6b8','#b77a48'];
const NAMES=['Rose','Sky','Sunshine','Violet','Mint','Peach','Orchid','Lime','Blue','Coral','Turquoise','Caramel'];
const colourCount=(level:number)=>Math.min(COLORS.length,5+Math.floor((level-1)/2));
const copy=(t:Tubes):Tubes=>t.map(x=>[...x]);
const run=(x:string[])=>{let n=1;for(let i=x.length-2;i>=0&&x[i]===x[x.length-1];i--)n++;return x.length?n:0;};
const valid=(t:Tubes,a:number,b:number)=>a!==b&&t[a].length>0&&t[b].length<CAP&&(!t[b].length||t[a][t[a].length-1]===t[b][t[b].length-1]);
const complete=(t:Tubes)=>t.every(x=>!x.length||(x.length===CAP&&x.every(v=>v===x[0])));
function puzzle(level:number){
 const count=colourCount(level);
 const t:Tubes=Array.from({length:count+2},(_,i)=>i<count?Array(CAP).fill(COLORS[i]):[]);
 // Scramble a solved board only with moves whose exact reverse remains legal.
 // This guarantees that every generated board has a known solution.
 const target=22+level*8;
 let lastFrom=-1,made=0,attempts=0;
 while(made<target&&attempts<target*30){
  attempts++;
  const options:{a:number;b:number;max:number}[]=[];
  for(let a=0;a<t.length;a++){
   const length=run(t[a]);
   const reversibleMax=length===t[a].length?length:length-1;
   if(reversibleMax<1)continue;
   for(let b=0;b<t.length;b++){
    if(!valid(t,a,b)||b===lastFrom)continue;
    const max=Math.min(reversibleMax,3,CAP-t[b].length);
    if(max>0)options.push({a,b,max});
   }
  }
  if(!options.length)break;
  const move=options[Math.floor(Math.random()*options.length)];
  const n=1+Math.floor(Math.random()*move.max);
  const colour=t[move.a][t[move.a].length-1];
  for(let k=0;k<n;k++)t[move.a].pop();
  for(let k=0;k<n;k++)t[move.b].push(colour);
  lastFrom=move.a;
  made++;
 }
 return t;
}
export default function WaterSort({onBack}:{onBack:()=>void}){
 const [level,setLevel]=useState(1),[tubes,setTubes]=useState<Tubes>(()=>puzzle(1)),[selected,setSelected]=useState<number|null>(null),[moves,setMoves]=useState(0),[history,setHistory]=useState<Tubes[]>([]),[paused,setPaused]=useState(false),[won,setWon]=useState(false),[help,setHelp]=useState(false),[sound,setSound]=useState(true),[hint,setHint]=useState<[number,number]|null>(null),[pouring,setPouring]=useState<number|null>(null);
 const names=useMemo(()=>new Map(COLORS.map((c,i)=>[c,NAMES[i]])),[]);
 const play=useCallback((ok=true)=>{if(ok&&typeof navigator!=='undefined'&&navigator.vibrate)navigator.vibrate(16);if(!sound)return;try{const C=window.AudioContext||(window as any).webkitAudioContext,ctx=new C(),o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=ok?620:260;g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.04,ctx.currentTime+.015);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.16);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.17);o.onended=()=>ctx.close();}catch{}},[sound]);
 const pour=useCallback((a:number,b:number)=>{if(!valid(tubes,a,b))return false;const t=copy(tubes),n=Math.min(run(t[a]),CAP-t[b].length),c=t[a][t[a].length-1];for(let i=0;i<n;i++)t[a].pop();for(let i=0;i<n;i++)t[b].push(c);setHistory(h=>[...h.slice(-39),copy(tubes)]);setTubes(t);setMoves(m=>m+1);setSelected(null);setHint(null);setPouring(b);window.setTimeout(()=>setPouring(null),350);play();return true;},[tubes,play]);
 const tap=(i:number)=>{if(paused||won)return;if(selected===null){if(tubes[i].length)setSelected(i);return;}if(selected===i){setSelected(null);return;}if(!pour(selected,i)){if(tubes[i].length)setSelected(i);else{setSelected(null);play(false);}}};
 const restart=()=>{setTubes(puzzle(level));setMoves(0);setHistory([]);setSelected(null);setHint(null);setPaused(false);setWon(false);};
 const undo=()=>{if(!history.length||paused||won)return;setTubes(copy(history[history.length-1]));setHistory(h=>h.slice(0,-1));setMoves(m=>Math.max(0,m-1));setSelected(null);setHint(null);};
 const showHint=()=>{for(let a=0;a<tubes.length;a++)for(let b=0;b<tubes.length;b++)if(valid(tubes,a,b)){setHint([a,b]);setSelected(a);return;}};
 useEffect(()=>{if(complete(tubes)&&!won){setWon(true);setSelected(null);play();}},[tubes,won,play]);
 const next=()=>{const l=level+1;setLevel(l);setTubes(puzzle(l));setMoves(0);setHistory([]);setSelected(null);setHint(null);setWon(false);};
 const count=Math.min(10,3+Math.floor((level-1)/2));
 return <div className="page arcade-page"><style>{`
 .water-game{max-width:980px;margin:auto;padding:clamp(14px,3vw,26px);border-radius:28px;color:#26364b;background:linear-gradient(145deg,#f5fbff,#e8f4fa 55%,#f7faff);border:1px solid #d5e6ef;box-shadow:0 24px 65px #193c5520}
 .water-game button{font:inherit}.water-game button:focus-visible{outline:3px solid #ffe58b;outline-offset:4px}
 .water-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.water-title{font-size:clamp(23px,5vw,36px);font-weight:1000;text-align:center;text-shadow:0 3px #145078,0 7px 18px #06172a}.water-sub{text-align:center;font-size:11px;letter-spacing:2.4px;color:#bcecff;font-weight:850}
 .water-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:19px 0}.water-stat{border:1px solid #5797b8;background:linear-gradient(#235879,#173d5b);border-radius:15px;text-align:center;padding:10px}.water-stat small{display:block;color:#b9e7fa;font-size:11px;font-weight:850;letter-spacing:1px}.water-stat b{font-size:25px}
 .water-stage{min-height:330px;padding:30px 12px 34px;border-radius:22px;background:linear-gradient(155deg,#e7f2f7,#f8fcff 52%,#eaf5fa);border:1px solid #d7e8ef;display:flex;align-items:flex-end;justify-content:center;align-content:center;flex-wrap:wrap;gap:clamp(13px,2.8vw,25px);position:relative;overflow:hidden}
 .water-tube{height:clamp(142px,23vw,178px);width:clamp(38px,6vw,52px);position:relative;border:3px solid #a9c4d2;border-top:0;border-radius:4px 4px 19px 19px;background:linear-gradient(90deg,#ffffffb8,#ffffff40 38%,#ffffffa0);box-shadow:inset 5px 0 9px #ffffffb0,inset -5px 0 9px #9ab2c044,0 8px 15px #31556a20;cursor:pointer;display:flex;flex-direction:column-reverse;padding:4px 3px 5px;transition:transform .2s,border-color .2s;touch-action:manipulation}
 .water-tube:before{content:'';position:absolute;top:-4px;left:-4px;right:-4px;height:7px;border:2px solid #9eb9c8;border-radius:8px;background:#ffffffb8}.water-tube.selected{transform:translateY(-15px);border-color:#ffe58b;filter:drop-shadow(0 0 10px #ffe58b99)}.water-tube.hint-source{border-color:#75f0d0;filter:drop-shadow(0 0 10px #75f0d0aa)}.water-tube.pouring{animation:tube-pour .34s ease}
 @keyframes tube-pour{50%{transform:translateY(-8px) rotate(7deg)}}.water-layer{height:25%;width:100%;flex:none;border-radius:4px;background:linear-gradient(90deg,#ffffff48,transparent 32%,#00000014 85%),var(--liquid);border-top:1px solid #ffffff55;box-shadow:inset 0 3px 5px #ffffff32}
 .water-btn{border:1px solid #c9dce6;background:linear-gradient(#ffffff,#edf5f9);color:#345269;border-radius:13px;padding:10px 14px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-weight:850;cursor:pointer;box-shadow:0 3px 8px #284b5e12}.water-btn:disabled{opacity:.4;cursor:not-allowed}.water-btn.primary{background:linear-gradient(#ffe99b,#ffbf59);color:#3b3440;border-color:#fff0b8}
 .water-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap;margin-top:17px}.water-note{text-align:center;min-height:27px;margin:13px 0 2px;color:#c7efff;font-size:13px;font-weight:750}.water-overlay{position:absolute;inset:0;z-index:3;display:grid;place-items:center;text-align:center;padding:18px;background:#081c31ef;backdrop-filter:blur(6px)}.water-overlay-card{max-width:360px}.water-overlay-card h2{font-size:29px;margin:6px 0}.water-overlay-card p{color:#c4e7f6}
 @media(max-width:480px){.water-stage{gap:11px;padding:25px 5px;min-height:300px}.water-tube{height:138px;width:36px}.water-stats{gap:5px}.water-stat{padding:8px 4px}.water-stat b{font-size:21px}}
 @media(prefers-reduced-motion:reduce){.water-game *{animation:none!important;transition:none!important}}
 `}</style>
 <section className="water-game">
  <div className="water-top"><button className="water-btn" onClick={onBack}><ArrowLeft size={17}/> Arcade</button><div><div className="water-title">💧 WATER SORT</div><div className="water-sub">POUR · SORT · RELAX</div></div><div style={{display:'flex',gap:7}}><button className="water-btn" aria-label="Toggle sound" onClick={()=>setSound(v=>!v)}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button><button className="water-btn" aria-label="How to play" onClick={()=>setHelp(true)}><HelpCircle size={17}/></button></div></div>
  <div className="water-stats"><div className="water-stat"><small>LEVEL</small><b>{level}</b></div><div className="water-stat"><small>MOVES</small><b>{moves}</b></div><div className="water-stat"><small>COLOURS</small><b>{count}</b></div></div>
  <div style={{textAlign:'center',fontWeight:850,color:'#55788d',fontSize:13,marginBottom:10}}>Sort each colour into its own tube</div>
  <div className="water-stage">{tubes.map((tube,i)=><button key={i} className={'water-tube'+(selected===i?' selected':'')+(hint?.[0]===i?' hint-source':'')+(pouring===i?' pouring':'')} onClick={()=>tap(i)} aria-label={'Tube '+(i+1)+', '+tube.length+' layers'+(tube.length?' top colour '+names.get(tube[tube.length-1]):', empty')} aria-pressed={selected===i}>{tube.map((c,j)=><span key={j} className="water-layer" style={{'--liquid':c} as React.CSSProperties}/>)}</button>)}
   {(paused||won)&&<div className="water-overlay"><div className="water-overlay-card"><div style={{fontSize:54}}>{won?'🏆':'⏸️'}</div><h2>{won?'Beautifully sorted!':'Take a breather'}</h2><p>{won?'Every colour is in its own tube. Ready for a trickier puzzle?':'Your puzzle is paused. Pick up right where you left off.'}</p><button className="water-btn primary" onClick={won?next:()=>setPaused(false)}>{won?'Next level':'Resume'}</button></div></div>}
  </div>
  <div className="water-note" aria-live="polite">{hint?'Hint: move the top colour from tube '+(hint[0]+1)+' to tube '+(hint[1]+1)+'.':'Tap a tube to lift it, then tap another tube to pour.'}</div>
  <div className="water-actions"><button className="water-btn" onClick={undo} disabled={!history.length||paused||won}><Undo2 size={17}/> Undo</button><button className="water-btn" onClick={showHint} disabled={paused||won}><Lightbulb size={17}/> Hint</button><button className="water-btn" onClick={()=>setPaused(v=>!v)} disabled={won}>{paused?<Play size={17}/>:<Pause size={17}/>} {paused?'Resume':'Pause'}</button><button className="water-btn" onClick={restart}><RotateCcw size={17}/> Restart</button></div>
  <p style={{textAlign:'center',fontSize:12,color:'#7894a5',margin:'16px 0 0'}}>Only matching top colours can be poured together. Each tube holds four layers. Empty tubes are your space to think!</p>
 </section>
 {help&&<div role="dialog" aria-modal="true" aria-labelledby="water-help" style={{position:'fixed',inset:0,zIndex:1000,background:'#061426dd',display:'grid',placeItems:'center',padding:18}} onPointerDown={e=>{if(e.target===e.currentTarget)setHelp(false);}}><div style={{maxWidth:420,width:'100%',background:'#f4f9fc',color:'#263f53',border:'1px solid #c7dce7',borderRadius:20,padding:22}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 id="water-help">How to play</h2><button className="water-btn" onClick={()=>setHelp(false)}><X size={18}/></button></div><p>Sort the coloured layers so every non-empty tube contains just one colour.</p><ul style={{lineHeight:1.9}}><li>Tap a tube to pick it up, then tap a destination.</li><li>Pour only onto the same top colour or into an empty tube.</li><li>A tube can hold up to four layers.</li><li>Use Undo to reverse a move, or Hint for a suggested pour.</li><li>Complete the puzzle to unlock more colours and tubes.</li></ul><button className="water-btn primary" style={{width:'100%'}} onClick={()=>setHelp(false)}>Let's play!</button></div></div>}
 </div>;
}