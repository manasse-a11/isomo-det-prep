import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Pause, Play, HelpCircle, X, Sparkles, Trophy } from 'lucide-react';

type Tile={id:number;kind:number;special?:'row'|'column'|'bomb'};
const ICONS=['🍓','🍋','🍇','🍊','🍏','🫐'];
const COLORS=['#ff7193','#ffd34e','#b28aff','#ff9b55','#8edb70','#72c8ff'];
const N=8, TARGETS=[900,1500,2200,3000,4000,5200];
const makeTile=(id:number):Tile=>({id,kind:Math.floor(Math.random()*ICONS.length)});
const findMatches=(b:Tile[][])=>{
 const found=new Set<string>();
 for(let r=0;r<N;r++){let start=0;while(start<N){let end=start+1;while(end<N&&b[r][end].kind===b[r][start].kind)end++;if(end-start>=3)for(let c=start;c<end;c++)found.add(r+','+c);start=end;}}
 for(let c=0;c<N;c++){let start=0;while(start<N){let end=start+1;while(end<N&&b[end][c].kind===b[start][c].kind)end++;if(end-start>=3)for(let r=start;r<end;r++)found.add(r+','+c);start=end;}}
 return found;
};
const hasMove=(b:Tile[][])=>{for(let r=0;r<N;r++)for(let c=0;c<N;c++)for(const [dr,dc] of [[0,1],[1,0]]){const rr=r+dr,cc=c+dc;if(rr>=N||cc>=N)continue;const cp=b.map(row=>row.slice());[cp[r][c],cp[rr][cc]]=[cp[rr][cc],cp[r][c]];if(findMatches(cp).size)return true;}return false;};
const freshBoard=()=>{let b:Tile[][],id=0,tries=0;do{b=Array.from({length:N},()=>Array.from({length:N},()=>makeTile(id++)));tries++;}while((findMatches(b).size||!hasMove(b))&&tries<200);return b;};
export default function CandyMatch({onBack}:{onBack:()=>void}){
 const [board,setBoard]=useState<Tile[][]>(()=>freshBoard()),[score,setScore]=useState(0),[moves,setMoves]=useState(30),[level,setLevel]=useState(1),[target,setTarget]=useState(TARGETS[0]),[selected,setSelected]=useState<[number,number]|null>(null),[busy,setBusy]=useState(false),[paused,setPaused]=useState(false),[over,setOver]=useState(false),[won,setWon]=useState(false),[sound,setSound]=useState(true),[help,setHelp]=useState(false),[notice,setNotice]=useState('Swap two neighbouring sweets to match three or more.'),[clearing,setClearing]=useState<string[]>([]),[combo,setCombo]=useState(0);
 const idRef=useRef(100),touchRef=useRef<{r:number;c:number;x:number;y:number}|null>(null),audioRef=useRef<AudioContext|null>(null),busyRef=useRef(false);
 const css={'--candy-bg':'#211044','--candy-panel':'#32165d','--candy-accent':'#ffdc67','--candy-line':'#68449a'} as CSSProperties;
 const feedback=useCallback((clear=false)=>{if(typeof navigator!=='undefined'&&'vibrate'in navigator)navigator.vibrate(clear?[18,24,45]:10);if(!sound)return;try{const AC=window.AudioContext||(window as any).webkitAudioContext;const ctx=audioRef.current??new AC();audioRef.current=ctx;[clear?660:440,clear?880:550].forEach((hz,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.0001,ctx.currentTime+i*.045);g.gain.exponentialRampToValueAtTime(clear?.045:.025,ctx.currentTime+i*.045+.01);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+i*.045+.12);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+i*.045);o.stop(ctx.currentTime+i*.045+.13);});}catch{}},[sound]);
 const cascade=useCallback(async(initial:Tile[][],firstMatches:Set<string>)=>{
   busyRef.current=true;setBusy(true);let current=initial.map(r=>r.slice()),matches=firstMatches,total=0,chain=0;
   while(matches.size&&chain<12){
     chain++;total+=matches.size*(10+Math.max(0,chain-1)*5);setCombo(chain);setClearing([...matches]);feedback(true);
     await new Promise(res=>window.setTimeout(res,230));
     const removed=new Set(matches);
     for(let c=0;c<N;c++){let write=N-1;for(let r=N-1;r>=0;r--)if(!removed.has(r+','+c)){current[write][c]=current[r][c];write--;}for(let r=write;r>=0;r--)current[r][c]=makeTile(idRef.current++);}
     setBoard(current.map(r=>r.slice()));setClearing([]);await new Promise(res=>window.setTimeout(res,150));matches=findMatches(current);
   }
   setScore(s=>s+total);setCombo(0);
   if(!hasMove(current)){current=freshBoard();setBoard(current);setNotice('No moves left — the sweets have been reshuffled!');}
   busyRef.current=false;setBusy(false);
 },[feedback]);
 const swap=useCallback(async(a:[number,number],b:[number,number])=>{
   if(busyRef.current||paused||over)return;
   const [r1,c1]=a,[r2,c2]=b;if(Math.abs(r1-r2)+Math.abs(c1-c2)!==1)return;
   const next=board.map(row=>row.slice());[next[r1][c1],next[r2][c2]]=[next[r2][c2],next[r1][c1]];
   const matches=findMatches(next);
   if(!matches.size){setSelected(null);setNotice('Almost! Try a swap that makes a line of three.');feedback(false);return;}
   setBoard(next);setSelected(null);setMoves(v=>Math.max(0,v-1));setNotice('Sweet! Keep the chain going.');await cascade(next,matches);
 },[board,paused,over,cascade,feedback]);
 const tap=(r:number,c:number)=>{if(busy||paused||over)return;if(!selected){setSelected([r,c]);return;}const [sr,sc]=selected;if(sr===r&&sc===c){setSelected(null);return;}if(Math.abs(sr-r)+Math.abs(sc-c)===1)swap([sr,sc],[r,c]);else setSelected([r,c]);};
 const pointerDown=(e:ReactPointerEvent<HTMLButtonElement>,r:number,c:number)=>{touchRef.current={r,c,x:e.clientX,y:e.clientY};};
 const pointerUp=(e:ReactPointerEvent<HTMLButtonElement>,r:number,c:number)=>{const start=touchRef.current;touchRef.current=null;if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.max(Math.abs(dx),Math.abs(dy))>18){const rr=start.r+(Math.abs(dy)>Math.abs(dx)?Math.sign(dy):0),cc=start.c+(Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0);if(rr>=0&&rr<N&&cc>=0&&cc<N)swap([start.r,start.c],[rr,cc]);}else tap(r,c);};
 const restart=()=>{setBoard(freshBoard());setScore(0);setMoves(30);setSelected(null);setBusy(false);busyRef.current=false;setOver(false);setWon(false);setCombo(0);setNotice('New round! Match three or more sweets.');};
 useEffect(()=>{if(over)return;if(score>=target){setWon(true);setOver(true);setNotice('Level complete! Sweet victory!');}else if(moves===0&&!busy){setOver(true);setWon(false);setNotice('Out of moves. Try again!');}},[score,target,moves,busy,over]);
 const nextLevel=()=>{const next=level+1;setLevel(next);setTarget(TARGETS[Math.min(next-1,TARGETS.length-1)]+(next>TARGETS.length?(next-TARGETS.length)*1000:0));setScore(0);setMoves(30);setBoard(freshBoard());setOver(false);setWon(false);setNotice('Level '+next+' — reach your target!');};
 const shuffle=()=>{if(busy||paused||over)return;setBoard(freshBoard());setSelected(null);setMoves(v=>Math.max(0,v-1));setNotice('Board shuffled. Find a new match!');};
 return <div className="page arcade-page"><style>{`
 .candy-game{max-width:850px;margin:0 auto;padding:clamp(13px,3vw,25px);border-radius:27px;color:#fff;background:radial-gradient(ellipse at 50% 0%,#6936a2 0%,#35165f 42%,#1a1037 100%);box-shadow:0 24px 65px #160b3260;border:1px solid #9865c5}
 .candy-game button{font:inherit}.candy-game button:focus-visible{outline:3px solid #ffe98a;outline-offset:3px}
 .candy-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.candy-title{font-weight:1000;letter-spacing:1px;font-size:clamp(23px,5vw,37px);text-shadow:0 3px 0 #8d3c9e,0 6px 18px #160b32}
 .candy-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}.candy-stat{background:linear-gradient(180deg,#7141a2,#47226f);border:1px solid #a477cf;border-radius:15px;padding:9px;text-align:center;box-shadow:inset 0 2px #ffffff20}.candy-stat small{display:block;color:#e5cfff;font-weight:800;font-size:11px;letter-spacing:1px}.candy-stat b{font-size:clamp(20px,4vw,28px);font-weight:1000;color:#fff}
 .candy-progress{height:13px;border-radius:20px;background:#160d31;overflow:hidden;border:1px solid #9163bd}.candy-progress>span{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,#62e6db,#b5f66b,#ffe36d);transition:width .35s ease}
 .candy-board{width:min(94vw,510px);aspect-ratio:1;margin:16px auto;padding:7px;display:grid;grid-template-columns:repeat(8,1fr);gap:4px;border-radius:19px;background:linear-gradient(145deg,#f4c4ff,#a66ed6 45%,#6835a2);box-shadow:inset 0 3px 8px #fff9,0 13px 35px #110824aa;touch-action:pan-y;user-select:none}
 .candy-tile{min-width:0;min-height:0;border:0;border-radius:11px;display:grid;place-items:center;position:relative;background:linear-gradient(145deg,#ffffff24,#ffffff08);box-shadow:inset 0 1px 2px #ffffff35;cursor:pointer;padding:0;transition:transform .13s,filter .13s,background .13s}
 .candy-tile:active{transform:scale(.91)}.candy-tile.selected{background:#fff7;box-shadow:0 0 0 3px #fff,0 0 18px #ffe46b;transform:scale(1.06);z-index:1}
 .candy-tile span{font-size:clamp(21px,5.5vw,43px);line-height:1;filter:drop-shadow(0 3px 2px #27103b66);transition:transform .16s}.candy-tile.clearing span{animation:candy-pop .22s ease forwards}
 @keyframes candy-pop{50%{transform:scale(1.35) rotate(12deg);filter:brightness(1.8)}100%{transform:scale(.1);opacity:0}}
 .candy-control{border:1px solid #b58bd7;background:linear-gradient(180deg,#7545a5,#4c2875);color:white;border-radius:13px;padding:10px 13px;min-height:43px;font-weight:850;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;box-shadow:0 3px 0 #2b1449}
 .candy-control:disabled{opacity:.45;cursor:not-allowed}.candy-primary{background:linear-gradient(180deg,#ffe98b,#ffbd4b);color:#51275d;border-color:#fff0b0}
 .candy-note{min-height:26px;text-align:center;font-weight:750;color:#ffe9a8;margin:8px 0}.candy-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}
 .candy-overlay{position:absolute;inset:0;z-index:4;display:grid;place-items:center;text-align:center;padding:20px;border-radius:18px;background:#24103beF;backdrop-filter:blur(5px)}
 @media(max-width:480px){.candy-board{gap:3px;padding:5px;border-radius:14px}.candy-tile{border-radius:7px}.candy-stats{gap:5px}.candy-stat{padding:8px 4px}}
 @media(prefers-reduced-motion:reduce){.candy-game *, .candy-game *:before{animation:none!important;transition:none!important}}
 `}</style>
 <section className="candy-game">
  <div className="candy-head"><button className="candy-control" onClick={onBack}><ArrowLeft size={17}/> Arcade</button><div style={{textAlign:'center',flex:1,minWidth:180}}><div className="candy-title">🍬 SWEET MATCH 🍭</div><div style={{fontSize:12,color:'#ead4ff',fontWeight:800,letterSpacing:2}}>MATCH · BLAST · CELEBRATE</div></div><div style={{display:'flex',gap:7}}><button className="candy-control" onClick={()=>setSound(v=>!v)} aria-label="Toggle sound">{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button><button className="candy-control" onClick={()=>setHelp(true)} aria-label="How to play"><HelpCircle size={17}/></button></div></div>
  <div className="candy-stats"><div className="candy-stat"><small>LEVEL</small><b>{level}</b></div><div className="candy-stat"><small>SCORE</small><b>{score.toLocaleString()}</b></div><div className="candy-stat"><small>MOVES</small><b>{moves}</b></div></div>
  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,fontWeight:850,marginBottom:6,color:'#f3ddff'}}><span>LEVEL GOAL</span><span>{Math.min(score,target).toLocaleString()} / {target.toLocaleString()}</span></div><div className="candy-progress"><span style={{width:Math.min(100,score/target*100)+'%'}}/></div>
  <div style={{position:'relative'}}><div className="candy-board" role="grid" aria-label="Candy match game board">{board.map((row,r)=>row.map((tile,c)=><button key={tile.id} role="gridcell" aria-label={ICONS[tile.kind]+' at row '+(r+1)+', column '+(c+1)} className={'candy-tile '+(selected?.[0]===r&&selected?.[1]===c?'selected':'')+(clearing.includes(r+','+c)?' clearing':'')} onPointerDown={e=>pointerDown(e,r,c)} onPointerUp={e=>pointerUp(e,r,c)} onPointerCancel={()=>{touchRef.current=null;}} disabled={busy||paused||over}><span>{ICONS[tile.kind]}</span></button>))}</div>
  {(paused||over)&&<div className="candy-overlay"><div><div style={{fontSize:48,marginBottom:8}}>{won?'🏆':paused?'⏸️':'🍬'}</div><h2 style={{fontSize:27,margin:'0 0 8px'}}>{won?'Level complete!':paused?'Game paused':'Round over'}</h2><p style={{color:'#ecdafa'}}>{won?'You reached '+target.toLocaleString()+' points!':paused?'Take a break — your sweets are waiting.':'You scored '+score.toLocaleString()+' points.'}</p><button className="candy-control candy-primary" onClick={won?nextLevel:paused?()=>setPaused(false):restart}>{won?'Next level':paused?'Resume':'Play again'}</button></div></div>}</div>
  <div className="candy-note" aria-live="polite">{combo>1?'✨ '+combo+'× SWEET COMBO! ✨':notice}</div>
  <div className="candy-actions"><button className="candy-control" onClick={()=>setPaused(v=>!v)} disabled={over}>{paused?<Play size={17}/>:<Pause size={17}/>} {paused?'Resume':'Pause'}</button><button className="candy-control" onClick={shuffle} disabled={busy||paused||over}>🔀 Shuffle · 1 move</button><button className="candy-control" onClick={restart}><RotateCcw size={17}/> Restart</button></div>
  <div style={{textAlign:'center',fontSize:12,color:'#dfc7f5',marginTop:15}}>Swipe a sweet toward a neighbour, or tap two adjacent sweets. Match 3 or more to score!</div>
 </section>
 {help&&<div role="dialog" aria-modal="true" aria-labelledby="candy-help" style={{position:'fixed',inset:0,zIndex:1000,background:'#090515cc',display:'grid',placeItems:'center',padding:18}} onPointerDown={e=>{if(e.target===e.currentTarget)setHelp(false);}}><div style={{maxWidth:420,width:'100%',background:'#32165d',color:'white',border:'1px solid #a477cf',borderRadius:20,padding:22}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 id="candy-help">How to play</h2><button className="candy-control" onClick={()=>setHelp(false)}><X size={18}/></button></div><p>Swap two neighbouring sweets to make a horizontal or vertical line of at least three matching symbols.</p><ul style={{lineHeight:1.8}}><li>Every valid swap uses one move.</li><li>Longer matches and chain reactions earn more points.</li><li>Reach the level goal before you run out of moves.</li><li>Use Shuffle if you want a fresh board (costs one move).</li></ul><button className="candy-control candy-primary" style={{width:'100%'}} onClick={()=>setHelp(false)}>Let's play!</button></div></div>}
 </div>;
}
