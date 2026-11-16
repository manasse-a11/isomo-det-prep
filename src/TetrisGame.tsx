import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, Pause, Play, RotateCw, ChevronLeft, ChevronRight, ChevronDown, Zap, RotateCcw as Restart } from 'lucide-react';

type Cell = string | null;
type Piece = { shape: number[][]; color: string; x: number; y: number; type: string };
const W = 10, H = 20;
const SHAPES: Record<string, number[][]> = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
};
const COLORS: Record<string,string> = { I:'#38bdf8', O:'#facc15', T:'#a78bfa', S:'#4ade80', Z:'#fb7185', J:'#60a5fa', L:'#fb923c' };
const emptyBoard = (): Cell[][] => Array.from({length:H},()=>Array<Cell>(W).fill(null));
const randomPiece = (): Piece => { const type=Object.keys(SHAPES)[Math.floor(Math.random()*7)]; return {type,shape:SHAPES[type],color:COLORS[type],x:Math.floor((W-SHAPES[type][0].length)/2),y:0}; };
const rotateShape = (shape:number[][]) => shape[0].map((_,i)=>shape.map(row=>row[i]).reverse());
const fits = (board:Cell[][],p:Piece,x=p.x,y=p.y,shape=p.shape) => shape.every((row,dy)=>row.every((v,dx)=>!v || (x+dx>=0 && x+dx<W && y+dy<H && (y+dy<0 || !board[y+dy][x+dx]))));
const merge = (board:Cell[][],p:Piece) => { const next=board.map(r=>[...r]); p.shape.forEach((row,dy)=>row.forEach((v,dx)=>{if(v && p.y+dy>=0 && p.y+dy<H) next[p.y+dy][p.x+dx]=p.color;})); return next; };
const styles: Record<string,CSSProperties> = {
  control:{border:'1px solid var(--line,#d5dee5)',borderRadius:12,background:'var(--surface,#fff)',padding:'12px 15px',fontWeight:800,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,color:'var(--text,#172b3a)'},
  stat:{background:'var(--panel,#f1f5f7)',borderRadius:12,padding:'12px 15px',minWidth:85,textAlign:'center'},
};
export default function TetrisGame({userId,onBack,onStudySkill}:{userId:string;onBack:()=>void;onStudySkill:(skill:string)=>void}) {
 const [board,setBoard]=useState<Cell[][]>(emptyBoard);
 const [piece,setPiece]=useState<Piece>(randomPiece);
 const [next,setNext]=useState<Piece>(randomPiece);
 const [score,setScore]=useState(0);
 const [lines,setLines]=useState(0);
 const [level,setLevel]=useState(1);
 const [playing,setPlaying]=useState(true);
 const [paused,setPaused]=useState(false);
 const [over,setOver]=useState(false);
 const [best,setBest]=useState(()=>Number(localStorage.getItem('isomo_tetris_best_'+userId)||0));
 const dragPointer=useRef<number|null>(null);
 const boardRef=useRef<HTMLDivElement|null>(null);
 const speed=Math.max(75,800-(level-1)*65);
 const gameOver=useCallback(()=>{setOver(true);setPlaying(false);setPaused(false);setBest(old=>{const n=Math.max(old,score);localStorage.setItem('isomo_tetris_best_'+userId,String(n));return n;});},[score,userId]);
 const spawn=useCallback((b:Cell[][],p:Piece)=>{const fresh={...p,x:Math.floor((W-p.shape[0].length)/2),y:0};if(!fits(b,fresh,fresh.x,fresh.y)){gameOver();return null;}return fresh;},[gameOver]);
 const lockPiece=useCallback((b:Cell[][],p:Piece)=>{const merged=merge(b,p);const kept=merged.filter(row=>row.some(cell=>!cell));const cleared=H-kept.length;const nextBoard=[...Array.from({length:cleared},()=>Array<Cell>(W).fill(null)),...kept];setBoard(nextBoard);if(cleared){const points=[0,100,300,500,800][cleared]||800;setScore(s=>s+points*level);setLines(n=>{const total=n+cleared;setLevel(Math.floor(total/10)+1);return total;});}const fresh=spawn(nextBoard,next);if(fresh){setPiece(fresh);setNext(randomPiece());}},[level,next,spawn]);
 const moveDown=useCallback(()=>{if(!playing||paused||over)return;if(fits(board,piece,piece.x,piece.y+1))setPiece({...piece,y:piece.y+1});else lockPiece(board,piece);},[board,lockPiece,over,paused,piece,playing]);
 const move=(dx:number)=>{if(!playing||paused||over)return;setPiece(p=>fits(board,p,p.x+dx,p.y)?{...p,x:p.x+dx}:p);};
 const rotate=()=>{if(!playing||paused||over)return;setPiece(p=>{const shape=rotateShape(p.shape);for(const kick of [0,-1,1,-2,2])if(fits(board,p,p.x+kick,p.y,shape))return {...p,shape,x:p.x+kick};return p;});};
 const hardDrop=()=>{if(!playing||paused||over)return;let y=piece.y;while(fits(board,piece,piece.x,y+1))y++;setScore(s=>s+(y-piece.y)*2);lockPiece(board,{...piece,y});};
 useEffect(()=>{if(!playing||paused||over)return;const timer=window.setInterval(moveDown,speed);return()=>window.clearInterval(timer);},[moveDown,over,paused,playing,speed]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' ','a','A','d','D','s','S','w','W'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')move(-1);else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')move(1);else if(e.key==='ArrowDown'||e.key==='s'||e.key==='S')moveDown();else if(e.key==='ArrowUp'||e.key==='w'||e.key==='W')rotate();else if(e.key===' ')hardDrop();else if(e.key==='Escape')setPaused(v=>!v);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});

 const startDrag=(e:ReactPointerEvent<HTMLDivElement>)=>{if(!playing||paused||over)return;e.preventDefault();dragPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);dragTo(e.clientX,e.clientY);};
 const dragTo=(clientX:number,clientY:number)=>{const el=boardRef.current;if(!el||dragPointer.current===null)return;const rect=el.getBoundingClientRect();const cellWidth=rect.width/W;const cellHeight=rect.height/H;const targetX=Math.round((clientX-rect.left)/cellWidth-(piece.shape[0].length/2));const targetY=Math.round((clientY-rect.top)/cellHeight-(piece.shape.length/2));setPiece(p=>{const x=Math.max(0,Math.min(W-p.shape[0].length,targetX));const y=Math.max(0,Math.min(H-p.shape.length,targetY));return fits(board,p,x,y)?{...p,x,y}:p;});};
 const moveDrag=(e:ReactPointerEvent<HTMLDivElement>)=>{if(dragPointer.current!==e.pointerId)return;e.preventDefault();dragTo(e.clientX,e.clientY);};
 const endDrag=(e:ReactPointerEvent<HTMLDivElement>)=>{if(dragPointer.current!==e.pointerId)return;dragPointer.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};

 const reset=()=>{setBoard(emptyBoard());setPiece(randomPiece());setNext(randomPiece());setScore(0);setLines(0);setLevel(1);setOver(false);setPaused(false);setPlaying(true);};
 const display=useMemo(()=>{const grid=board.map(r=>[...r]);piece.shape.forEach((row,dy)=>row.forEach((v,dx)=>{if(v&&piece.y+dy>=0&&piece.y+dy<H&&piece.x+dx>=0&&piece.x+dx<W)grid[piece.y+dy][piece.x+dx]=piece.color;}));return grid;},[board,piece]);
 return <div className="page arcade-page">
  <div className="arcade-top"><button className="btn outline" onClick={onBack}><ArrowLeft size={16}/> Back</button><div><span>ISOMO ACADEMY · ARCADE</span><h1>ISOMO TETRIS</h1><p>Stack the falling blocks, clear lines and beat your high score.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span style={styles.stat}>🏆 Best<br/><b>{best}</b></span><span style={styles.stat}>⭐ Score<br/><b>{score}</b></span></div></div>
  <section className="arcade-panel" style={{maxWidth:850,margin:'0 auto'}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><span>LEVEL {level}</span><h2 style={{margin:'5px 0'}}>Fit the blocks. Clear the lines.</h2><p style={{margin:0}}>Drag a falling block up, down, left or right to position it. Use the controls or keyboard to rotate and drop.</p></div><div style={{display:'flex',gap:8}}><span style={styles.stat}>Lines<br/><b>{lines}</b></span><span style={styles.stat}>Speed<br/><b>{level}×</b></span></div></div>
   <div style={{display:'flex',justifyContent:'center',gap:22,alignItems:'flex-start',flexWrap:'wrap',marginTop:20}}>
    <div style={{position:'relative',padding:7,borderRadius:12,background:'#0b1220',boxShadow:'0 10px 28px #0003'}}>
     <div ref={boardRef} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} role="grid" aria-label="Tetris game board — drag the falling block in any direction to position it" style={{display:'grid',gridTemplateColumns:'repeat(10,minmax(0,1fr))',gap:2,width:'min(66vw,300px)',aspectRatio:'1 / 2',touchAction:'none',cursor:dragPointer.current!==null?'grabbing':'grab',userSelect:'none'}}>
      {display.flatMap((row,y)=>row.map((cell,x)=><div role="gridcell" key={y+'-'+x} style={{background:cell||'#182235',borderRadius:3,border:cell?'1px solid #ffffff40':'1px solid #26344a',boxShadow:cell?'inset 0 0 7px #ffffff40':'none'}}/>))}
     </div>
     {(paused||over)&&<div style={{position:'absolute',inset:7,display:'grid',placeContent:'center',textAlign:'center',background:'#07101ddd',color:'white',borderRadius:9,padding:18}}><h2 style={{margin:'0 0 8px'}}>{over?'Game over':'Paused'}</h2><p>{over?'You scored '+score+' points.':'Take a breather.'}</p><button className="btn primary" onClick={over?reset:()=>setPaused(false)}>{over?'Play again':'Resume'}</button></div>}
    </div>
    <div style={{display:'grid',gap:12,minWidth:125}}>
     <div style={{...styles.stat,textAlign:'left'}}><b>Next block</b><div style={{display:'grid',gridTemplateColumns:'repeat(4,22px)',gap:3,marginTop:10,minHeight:48}}>{Array.from({length:8},(_,i)=>{const y=Math.floor(i/4),x=i%4;const cell=next.shape[y]?.[x];return <span key={i} style={{width:22,height:22,borderRadius:3,background:cell?next.color:'transparent'}}/>})}</div></div>
     <span style={styles.stat}>Score<br/><b>{score}</b></span><span style={styles.stat}>Lines<br/><b>{lines}</b></span><span style={styles.stat}>Level<br/><b>{level}</b></span>
     <button style={styles.control} onClick={()=>setPaused(v=>!v)}>{paused?<Play size={17}/>:<Pause size={17}/>} {paused?'Resume':'Pause'}</button>
     <button style={styles.control} onClick={reset}><Restart size={17}/> Restart</button>
    </div>
   </div>
   <div style={{display:'flex',justifyContent:'center',gap:9,flexWrap:'wrap',marginTop:18}}>
    <button style={styles.control} onClick={()=>move(-1)} aria-label="Move left"><ChevronLeft/></button><button style={styles.control} onClick={()=>rotate()} aria-label="Rotate block"><RotateCw/></button><button style={styles.control} onClick={()=>move(1)} aria-label="Move right"><ChevronRight/></button><button style={styles.control} onClick={moveDown} aria-label="Move down"><ChevronDown/></button><button style={styles.control} onClick={hardDrop}><Zap size={17}/> Drop</button>
   </div>
   {over&&<div style={{textAlign:'center',marginTop:15}}><h3>Great effort! Your score: {score}</h3><button className="btn primary" onClick={reset}>Play again</button></div>}
   <p className="arcade-disclaimer" style={{marginTop:15}}>Every 10 cleared lines increases the level and makes the blocks fall faster. Drag blocks in all four directions with your finger or mouse; keyboard and touch controls are also available.</p>
   <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}><button className="btn outline" onClick={()=>onStudySkill('Vocabulary')}>Practise vocabulary</button><button className="btn outline" onClick={()=>setPaused(v=>!v)}>{paused?'Resume':'Pause'} game</button></div>
  </section>
 </div>;
}
