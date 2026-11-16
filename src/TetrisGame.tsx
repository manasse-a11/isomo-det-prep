import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, Pause, Play, RotateCw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, RotateCcw, Check, Undo2, Volume2, VolumeX, Sparkles, Trophy, HelpCircle, X, Palette, Save } from 'lucide-react';

type Cell = string | null;
type Piece = { shape: number[][]; color: string; x: number; y: number; type: string };
type Snapshot = { board: Cell[][]; score: number; placed: number };
type ThemeName = 'Midnight' | 'Aurora' | 'Sunset' | 'Classic';
const W = 10, H = 20;
const SHAPES: Record<string, number[][]> = {
 I:[[1,1,1,1]], O:[[1,1],[1,1]], T:[[0,1,0],[1,1,1]], S:[[0,1,1],[1,1,0]],
 Z:[[1,1,0],[0,1,1]], J:[[1,0,0],[1,1,1]], L:[[0,0,1],[1,1,1]],
};
const COLORS: Record<string,string> = { I:'#38bdf8', O:'#facc15', T:'#a78bfa', S:'#4ade80', Z:'#fb7185', J:'#60a5fa', L:'#fb923c' };
const THEMES: Record<ThemeName,{bg:string;board:string;cell:string;line:string;accent:string;muted:string}> = {
 Midnight:{bg:'#0b1220',board:'#111c30',cell:'#1b2940',line:'#2b3b55',accent:'#7c9cff',muted:'#9eacc2'},
 Aurora:{bg:'#071d24',board:'#0c2930',cell:'#153943',line:'#24505a',accent:'#5eead4',muted:'#9ac7c8'},
 Sunset:{bg:'#281426',board:'#3a1d31',cell:'#4b2940',line:'#70405c',accent:'#fb9a77',muted:'#d6a5b9'},
 Classic:{bg:'#17202a',board:'#202b36',cell:'#2d3946',line:'#435262',accent:'#f6c85f',muted:'#bdc7d2'},
};
const emptyBoard = (): Cell[][] => Array.from({length:H},()=>Array<Cell>(W).fill(null));
const randomPiece = (): Piece => { const type=Object.keys(SHAPES)[Math.floor(Math.random()*7)]; return {type,shape:SHAPES[type],color:COLORS[type],x:Math.floor((W-SHAPES[type][0].length)/2),y:0}; };
const rotateShape = (shape:number[][]) => shape[0].map((_,i)=>shape.map(row=>row[i]).reverse());
const fits = (board:Cell[][],p:Piece,x=p.x,y=p.y,shape=p.shape) => shape.every((row,dy)=>row.every((v,dx)=>!v || (x+dx>=0 && x+dx<W && y+dy>=0 && y+dy<H && !board[y+dy][x+dx])));
const merge = (board:Cell[][],p:Piece) => { const next=board.map(r=>[...r]); p.shape.forEach((row,dy)=>row.forEach((v,dx)=>{if(v)next[p.y+dy][p.x+dx]=p.color;})); return next; };
const control: CSSProperties = {border:'1px solid var(--game-line)',borderRadius:13,background:'var(--game-card)',padding:'11px 14px',fontWeight:750,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,color:'var(--game-text)',minHeight:44,transition:'transform .15s ease, border-color .15s ease'};
const stat: CSSProperties = {background:'var(--game-card)',border:'1px solid var(--game-line)',borderRadius:14,padding:'11px 15px',minWidth:88,textAlign:'center'};
export default function TetrisGame({userId,onBack,onStudySkill}:{userId:string;onBack:()=>void;onStudySkill:(skill:string)=>void}) {
 const [board,setBoard]=useState<Cell[][]>(emptyBoard);
 const [piece,setPiece]=useState<Piece>(randomPiece);
 const [next,setNext]=useState<Piece>(randomPiece);
 const [score,setScore]=useState(0),[placed,setPlaced]=useState(0);
 const [paused,setPaused]=useState(false),[over,setOver]=useState(false);
 const [best,setBest]=useState(()=>Number(localStorage.getItem('isomo_tetris_best_'+userId)||0));
 const [theme,setTheme]=useState<ThemeName>('Midnight');
 const [sound,setSound]=useState(true),[help,setHelp]=useState(false),[notice,setNotice]=useState('Drag a block to position it, then release to place.');
 const dragPointer=useRef<number|null>(null), boardRef=useRef<HTMLDivElement|null>(null);
 const grabOffset=useRef({x:0,y:0}), history=useRef<Snapshot[]>([]);
 const audioRef=useRef<AudioContext|null>(null);
 const palette=THEMES[theme];
 const feedback=useCallback((kind:'place'|'error'|'undo'='place')=>{
   if(typeof navigator!=='undefined' && 'vibrate' in navigator) navigator.vibrate(kind==='place'?18:kind==='undo'?12:35);
   if(!sound)return;
   try { const AudioCtx=window.AudioContext || (window as any).webkitAudioContext; if(!AudioCtx)return; const ctx=audioRef.current??new AudioCtx();audioRef.current=ctx;
     const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=kind==='place'?kind==='undo'?460:520:150;
     gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.055,ctx.currentTime+.012);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.12);
     osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.13);
   } catch {}
 },[sound]);
 const gameOver=useCallback((finalScore:number)=>{setOver(true);setPaused(false);setBest(old=>{const n=Math.max(old,finalScore);localStorage.setItem('isomo_tetris_best_'+userId,String(n));return n;});},[userId]);
 const spawn=useCallback((b:Cell[][],p:Piece)=>{const startX=Math.floor((W-p.shape[0].length)/2);for(let y=0;y<=H-p.shape.length;y++){for(let dx=0;dx<W;dx++){const x=(startX+dx)% (W-p.shape[0].length+1);if(fits(b,p,x,y))return {...p,x,y};}}return null;},[]);
 const lockPiece=useCallback((b:Cell[][],p:Piece)=>{
   const nextBoard=merge(b,p),nextScore=score+10,nextPlaced=placed+1;
   history.current=[...history.current.slice(-29),{board:b.map(r=>[...r]),score,placed}];
   setBoard(nextBoard);setScore(nextScore);setPlaced(nextPlaced);feedback('place');
   const fresh=spawn(nextBoard,next);
   if(fresh){setPiece(fresh);setNext(randomPiece());setNotice('Block placed. Your next piece is ready.');}
   else {gameOver(nextScore);setNotice('No open position remains. Build complete!');}
 },[feedback,gameOver,next,placed,score,spawn]);
 const move=(dx:number,dy:number)=>{if(paused||over)return;setPiece(p=>{const x=p.x+dx,y=p.y+dy;return fits(board,p,x,y)?{...p,x,y}:p;});};
 const placeCurrent=()=>{if(paused||over)return;if(fits(board,piece,piece.x,piece.y))lockPiece(board,piece);else feedback('error');};
 const rotate=()=>{if(paused||over)return;setPiece(p=>{const shape=rotateShape(p.shape);for(const kick of [0,-1,1,-2,2])if(fits(board,p,p.x+kick,p.y,shape))return {...p,shape,x:p.x+kick};return p;});feedback('place');};
 const undo=()=>{if(paused||over||!history.current.length)return;const prev=history.current.pop()!;setBoard(prev.board);setScore(prev.score);setPlaced(prev.placed);setOver(false);setNotice('Last placement undone.');feedback('undo');};
 const reset=()=>{history.current=[];setBoard(emptyBoard());setPiece(randomPiece());setNext(randomPiece());setScore(0);setPlaced(0);setOver(false);setPaused(false);setNotice('Fresh board. Start building!');};
 const startDrag=(e:ReactPointerEvent<HTMLDivElement>)=>{if(paused||over)return;e.preventDefault();dragPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);const rect=e.currentTarget.getBoundingClientRect(),cw=rect.width/W,ch=rect.height/H;const col=Math.floor((e.clientX-rect.left)/cw),row=Math.floor((e.clientY-rect.top)/ch);grabOffset.current={x:Math.max(0,Math.min(piece.shape[0].length-1,col-piece.x)),y:Math.max(0,Math.min(piece.shape.length-1,row-piece.y))};dragTo(e.clientX,e.clientY);};
 const dragTo=(clientX:number,clientY:number)=>{const el=boardRef.current;if(!el||dragPointer.current===null)return;const rect=el.getBoundingClientRect(),cw=rect.width/W,ch=rect.height/H;const col=Math.floor((clientX-rect.left)/cw),row=Math.floor((clientY-rect.top)/ch);const x=Math.max(0,Math.min(W-piece.shape[0].length,col-grabOffset.current.x)),y=Math.max(0,Math.min(H-piece.shape.length,row-grabOffset.current.y));setPiece(p=>fits(board,p,x,y)?{...p,x,y}:p);};
 const moveDrag=(e:ReactPointerEvent<HTMLDivElement>)=>{if(dragPointer.current!==e.pointerId)return;e.preventDefault();dragTo(e.clientX,e.clientY);};
 const endDrag=(e:ReactPointerEvent<HTMLDivElement>)=>{if(dragPointer.current!==e.pointerId)return;dragPointer.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);placeCurrent();};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' ','a','A','d','D','s','S','w','W','z','Z'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')move(-1,0);else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')move(1,0);else if(e.key==='ArrowDown'||e.key==='s'||e.key==='S')move(0,1);else if(e.key==='ArrowUp')move(0,-1);else if(e.key==='w'||e.key==='W')rotate();else if(e.key===' '||e.key==='Enter')placeCurrent();else if(e.key==='z'||e.key==='Z')undo();else if(e.key==='Escape')setPaused(v=>!v);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 const display=useMemo(()=>{const grid=board.map(r=>[...r]);piece.shape.forEach((row,dy)=>row.forEach((v,dx)=>{if(v&&piece.y+dy>=0&&piece.y+dy<H&&piece.x+dx>=0&&piece.x+dx<W)grid[piece.y+dy][piece.x+dx]=piece.color;}));return grid;},[board,piece]);
 const css={'--game-bg':palette.bg,'--game-board':palette.board,'--game-cell':palette.cell,'--game-line':palette.line,'--game-accent':palette.accent,'--game-muted':palette.muted,'--game-card':theme==='Sunset'?'#4a2940':theme==='Aurora'?'#10313a':theme==='Classic'?'#263441':'#17243a','--game-text':'#f4f7fb'} as CSSProperties;
 return <div className="page arcade-page" style={css}>
  <style>{`
   .isomo-game{max-width:980px;margin:0 auto;color:var(--game-text);background:linear-gradient(145deg,var(--game-bg),color-mix(in srgb,var(--game-bg),var(--game-accent) 12%));border:1px solid var(--game-line);border-radius:24px;padding:clamp(14px,3vw,26px);box-shadow:0 22px 65px #0002}
   .isomo-game button:focus-visible{outline:3px solid var(--game-accent);outline-offset:3px}
   .isomo-game button:active{transform:scale(.96)}
   .isomo-game .game-board{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:3px;width:min(72vw,340px);aspect-ratio:1/2;background:var(--game-board);padding:7px;border:1px solid var(--game-line);border-radius:17px;box-shadow:0 15px 40px #0005;touch-action:none;user-select:none;cursor:grab}
   .isomo-game .game-cell{min-width:0;min-height:0;border-radius:4px;transition:background .09s ease,box-shadow .09s ease}
   .isomo-game .game-cell.active{box-shadow:inset 0 0 0 2px #ffffffa0,0 0 10px #ffffff55;animation:blockPulse 1.6s ease-in-out infinite alternate}
   @keyframes blockPulse{from{filter:brightness(1)}to{filter:brightness(1.2)}}
   .isomo-game .game-card{background:var(--game-card);border:1px solid var(--game-line);border-radius:16px;padding:14px}
   .isomo-game .game-btn{border:1px solid var(--game-line);border-radius:13px;background:var(--game-card);color:var(--game-text);padding:11px 13px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-weight:750;cursor:pointer}
   .isomo-game .game-primary{background:var(--game-accent);color:#07111e;border-color:transparent}
   .isomo-game .game-muted{color:var(--game-muted)}
   .isomo-game select{background:var(--game-card);color:var(--game-text);border:1px solid var(--game-line);border-radius:11px;padding:9px}
   @media(max-width:620px){.isomo-game .game-board{width:min(82vw,330px)}.isomo-game .game-layout{gap:14px!important}.isomo-game .game-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}.isomo-game .game-side .game-card{min-width:0}}
   @media(prefers-reduced-motion:reduce){.isomo-game *, .isomo-game *:before{animation:none!important;transition:none!important}}
  `}</style>
  <div className="arcade-top" style={{marginBottom:16}}><button className="btn outline" onClick={onBack}><ArrowLeft size={16}/> Back</button><div><span>ISOMO ACADEMY · ARCADE</span><h1>ISOMO TETRIS</h1><p>Build freely. Place every block exactly where you want.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span style={stat}>🏆 Best<br/><b>{best}</b></span><span style={stat}>⭐ Score<br/><b>{score}</b></span></div></div>
  <section className="isomo-game">
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:18}}>
    <div><div style={{fontSize:12,fontWeight:850,letterSpacing:1.3,color:'var(--game-accent)'}}>FREE BUILD · {placed} BLOCKS PLACED</div><h2 style={{fontSize:'clamp(19px,3vw,25px)',margin:'5px 0'}}>Your board. Your rules.</h2><p className="game-muted" style={{margin:0,fontSize:13}}>No falling blocks. No timer. No pressure.</p></div>
    <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
     <label className="game-muted" htmlFor="game-theme" style={{display:'flex',gap:6,alignItems:'center'}}><Palette size={16}/><span className="sr-only">Theme</span></label>
     <select id="game-theme" value={theme} onChange={e=>setTheme(e.target.value as ThemeName)} aria-label="Choose game theme">{Object.keys(THEMES).map(t=><option key={t}>{t}</option>)}</select>
     <button className="game-btn" onClick={()=>setSound(v=>!v)} aria-label={sound?'Mute game sounds':'Enable game sounds'}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button>
     <button className="game-btn" onClick={()=>setHelp(true)} aria-label="How to play"><HelpCircle size={17}/></button>
    </div>
   </div>
   <div className="game-layout" style={{display:'flex',justifyContent:'center',alignItems:'flex-start',gap:24,flexWrap:'wrap'}}>
    <div style={{position:'relative'}}>
     <div ref={boardRef} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} role="grid" aria-label="Free-build board. Drag the active piece to a free position and release to place." className="game-board">
      {display.flatMap((row,y)=>row.map((cell,x)=><div role="gridcell" aria-label={cell?'Occupied block':'Empty cell'} key={y+'-'+x} className={'game-cell '+(piece.shape.some((r,dy)=>r.some((v,dx)=>v&&piece.x+dx===x&&piece.y+dy===y))?'active':'')} style={{background:cell||'var(--game-cell)',border:cell?'1px solid #ffffff65':'1px solid var(--game-line)',boxShadow:cell?'inset 0 0 9px #ffffff35':'none'}}/>))}
     </div>
     {(paused||over)&&<div style={{position:'absolute',inset:0,display:'grid',placeContent:'center',textAlign:'center',background:'#07101deF',color:'white',borderRadius:17,padding:20,zIndex:2}}><Sparkles size={28} style={{margin:'0 auto 8px',color:'var(--game-accent)'}}/><h2 style={{margin:'0 0 8px'}}>{over?'Build complete!':'Game paused'}</h2><p>{over?'You placed '+placed+' blocks and scored '+score+'.':'Your board is safe. Resume whenever you are ready.'}</p><button className="game-btn game-primary" onClick={over?reset:()=>setPaused(false)}>{over?'Build again':'Resume'}</button></div>}
    </div>
    <div className="game-side" style={{display:'grid',gap:10,minWidth:150,maxWidth:220}}>
     <div className="game-card"><div style={{fontSize:12,fontWeight:800,letterSpacing:1,color:'var(--game-muted)'}}>UP NEXT</div><div style={{display:'grid',gridTemplateColumns:'repeat(4,22px)',gap:3,marginTop:10,minHeight:48}}>{Array.from({length:8},(_,i)=>{const cell=next.shape[Math.floor(i/4)]?.[i%4];return <span key={i} style={{width:22,height:22,borderRadius:5,background:cell?next.color:'transparent',boxShadow:cell?'inset 0 0 5px #ffffff55':'none'}}/>})}</div></div>
     <div className="game-card"><div className="game-muted" style={{fontSize:12}}>SCORE</div><div style={{fontSize:25,fontWeight:900}}>{score}</div></div>
     <div className="game-card"><div className="game-muted" style={{fontSize:12}}>BLOCKS PLACED</div><div style={{fontSize:25,fontWeight:900}}>{placed}</div></div>
     <button className="game-btn" onClick={()=>setPaused(v=>!v)}>{paused?<Play size={17}/>:<Pause size={17}/>} {paused?'Resume':'Pause'}</button>
     <button className="game-btn" onClick={undo} disabled={!history.current.length||paused||over} style={{opacity:history.current.length&&!paused&&!over?1:.45}}><Undo2 size={17}/> Undo</button>
     <button className="game-btn" onClick={reset}><RotateCcw size={17}/> New board</button>
    </div>
   </div>
   <div style={{display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap',marginTop:17}}>
    <button className="game-btn" onClick={()=>move(-1,0)} aria-label="Move left"><ChevronLeft/></button><button className="game-btn" onClick={()=>move(0,-1)} aria-label="Move up"><ChevronUp/></button><button className="game-btn" onClick={rotate} aria-label="Rotate block"><RotateCw/></button><button className="game-btn" onClick={()=>move(0,1)} aria-label="Move down"><ChevronDown/></button><button className="game-btn" onClick={()=>move(1,0)} aria-label="Move right"><ChevronRight/></button><button className="game-btn game-primary" onClick={placeCurrent}><Check size={17}/> Place block</button>
   </div>
   <div aria-live="polite" className="game-muted" style={{textAlign:'center',fontSize:13,minHeight:20,marginTop:12}}>{notice}</div>
   <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginTop:12}}><button className="btn outline" onClick={()=>onStudySkill('Vocabulary')}>Practise vocabulary</button><button className="btn outline" onClick={()=>{gameOver(score);setNotice('Build finished. Great work!');}}>Finish build</button></div>
   <p className="game-muted" style={{fontSize:12,textAlign:'center',margin:'16px 0 0'}}>Keyboard: arrows or WASD to move · W to rotate · Enter/Space to place · Z to undo · Esc to pause.</p>
  </section>
  {help&&<div role="dialog" aria-modal="true" aria-labelledby="game-help-title" style={{position:'fixed',inset:0,zIndex:1000,background:'#020817bb',display:'grid',placeItems:'center',padding:18}} onPointerDown={e=>{if(e.target===e.currentTarget)setHelp(false);}}><div style={{background:'var(--surface,#fff)',color:'var(--text,#172b3a)',borderRadius:20,padding:22,maxWidth:420,width:'100%',boxShadow:'0 24px 80px #0006'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 id="game-help-title" style={{margin:0}}>How to play</h2><button className="game-btn" onClick={()=>setHelp(false)} aria-label="Close help"><X size={18}/></button></div><ul style={{lineHeight:1.8,paddingLeft:20}}><li>Drag the glowing piece to any open place on the board.</li><li>Release your finger or mouse to place it permanently.</li><li>Use the arrows or directional buttons if you prefer not to drag.</li><li>Rotate pieces, undo your last placement, or change the theme.</li><li>There is no timer and blocks never fall automatically.</li></ul><button className="game-btn game-primary" style={{width:'100%'}} onClick={()=>setHelp(false)}>Let’s build</button></div></div>}
 </div>;
}
