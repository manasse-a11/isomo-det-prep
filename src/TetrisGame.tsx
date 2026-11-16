import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, Pause, Play, RotateCw, RotateCcw, Check, Undo2, Volume2, VolumeX, Sparkles, Trophy, HelpCircle, X, Palette } from 'lucide-react';

type Cell = string | null;
type Shape = number[][];
type Piece = { id: number; shape: Shape; color: string; type: string };
type Snapshot = { board: Cell[][]; score: number; placed: number; pieces: Piece[]; combo: number };
type Theme = { name:string; bg:string; board:string; cell:string; line:string; accent:string; muted:string; colors:string[] };
const SIZE = 10;
const SHAPES: Record<string, Shape> = {
  I:[[1,1,1,1]], O:[[1,1],[1,1]], T:[[0,1,0],[1,1,1]], S:[[0,1,1],[1,1,0]],
  Z:[[1,1,0],[0,1,1]], J:[[1,0,0],[1,1,1]], L:[[0,0,1],[1,1,1]],
  DOT:[[1]], DUO:[[1,1]], TRIO:[[1,1,1]], V:[[1,0],[1,1]], BIG:[[1,1],[1,1],[1,1]]
};
const THEMES: Theme[] = [
  {name:'Midnight',bg:'#0b1220',board:'#111c30',cell:'#1b2940',line:'#2b3b55',accent:'#7c9cff',muted:'#9eacc2',colors:['#38bdf8','#a78bfa','#4ade80','#fb7185','#facc15','#fb923c','#60a5fa']},
  {name:'Aurora',bg:'#071d24',board:'#0c2930',cell:'#153943',line:'#24505a',accent:'#5eead4',muted:'#9ac7c8',colors:['#2dd4bf','#a3e635','#67e8f9','#c4b5fd','#f0abfc','#bef264','#5eead4']},
  {name:'Sunset',bg:'#281426',board:'#3a1d31',cell:'#4b2940',line:'#70405c',accent:'#fb9a77',muted:'#d6a5b9',colors:['#fb7185','#fda4af','#fdba74','#f9a8d4','#c4b5fd','#facc15','#fb923c']},
  {name:'Classic',bg:'#17202a',board:'#202b36',cell:'#2d3946',line:'#435262',accent:'#f6c85f',muted:'#bdc7d2',colors:['#38bdf8','#facc15','#a78bfa','#4ade80','#fb7185','#60a5fa','#fb923c']}
];
const emptyBoard = (): Cell[][] => Array.from({length:SIZE},()=>Array<Cell>(SIZE).fill(null));
const randomPiece = (id:number, theme:Theme):Piece => {
  const keys=Object.keys(SHAPES), type=keys[Math.floor(Math.random()*keys.length)];
  return {id,type,shape:SHAPES[type],color:theme.colors[Math.floor(Math.random()*theme.colors.length)]};
};
const fits = (board:Cell[][],shape:Shape,x:number,y:number) => shape.every((row,dy)=>row.every((v,dx)=>!v||(x+dx>=0&&x+dx<SIZE&&y+dy>=0&&y+dy<SIZE&&!board[y+dy][x+dx])));
const stat: CSSProperties = {background:'var(--game-card)',border:'1px solid var(--game-line)',borderRadius:14,padding:'10px 14px',minWidth:82,textAlign:'center'};
export default function TetrisGame({userId,onBack,onStudySkill}:{userId:string;onBack:()=>void;onStudySkill:(skill:string)=>void}) {
  const [board,setBoard]=useState<Cell[][]>(emptyBoard);
  const [pieces,setPieces]=useState<Piece[]>(()=>Array.from({length:3},(_,i)=>randomPiece(i,THEMES[0])));
  const [selected,setSelected]=useState<number|null>(null);
  const [score,setScore]=useState(0),[placed,setPlaced]=useState(0),[combo,setCombo]=useState(0);
  const [paused,setPaused]=useState(false),[over,setOver]=useState(false),[help,setHelp]=useState(false);
  const [themeIndex,setThemeIndex]=useState(0),[sound,setSound]=useState(true);
  const [clearing,setClearing]=useState<string[]>([]),[celebrate,setCelebrate]=useState(false);
  const [notice,setNotice]=useState('Choose one of your three pieces and place it anywhere on the board.');
  const [best,setBest]=useState(()=>Number(localStorage.getItem('isomo_tetris_best_'+userId)||0));
  const [preview,setPreview]=useState<{x:number;y:number}|null>(null);
  const history=useRef<Snapshot[]>([]),boardRef=useRef<HTMLDivElement|null>(null),dragRef=useRef<{pointerId:number;index:number;grabX:number;grabY:number}|null>(null),hoverRef=useRef<{x:number;y:number}|null>(null),audioRef=useRef<AudioContext|null>(null),pieceId=useRef(3);
  const theme=THEMES[themeIndex];
  const css={'--game-bg':theme.bg,'--game-board':theme.board,'--game-cell':theme.cell,'--game-line':theme.line,'--game-accent':theme.accent,'--game-muted':theme.muted,'--game-card':themeIndex===2?'#4a2940':themeIndex===1?'#10313a':themeIndex===3?'#263441':'#17243a','--game-text':'#f4f7fb'} as CSSProperties;
  const feedback=useCallback((kind:'place'|'clear'|'error'='place')=>{
    if(typeof navigator!=='undefined'&&'vibrate'in navigator)navigator.vibrate(kind==='clear'?[25,35,55]:kind==='place'?12:30);
    if(!sound)return;
    try{const AC=window.AudioContext||(window as any).webkitAudioContext;if(!AC)return;const ctx=audioRef.current??new AC();audioRef.current=ctx;const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=kind==='clear'?kind==='place'?740:520:kind==='place'?520:150;gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(kind==='clear'?.075:.045,ctx.currentTime+.012);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+(kind==='clear'?.28:.12));osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+(kind==='clear'?.3:.14));}catch{}
  },[sound]);
  const updateBest=useCallback((n:number)=>setBest(old=>{const v=Math.max(old,n);localStorage.setItem('isomo_tetris_best_'+userId,String(v));return v;}),[userId]);
  const canPlaceAny=(b:Cell[][],list:Piece[])=>list.some(p=>p.shape.some((row,y)=>row.some((v,x)=>v&&Array.from({length:SIZE},(_,r)=>r).some(r=>Array.from({length:SIZE},(_,c)=>c).some(c=>fits(b,p.shape,c-x,r-y))))));
  const placePiece=useCallback((index:number,x:number,y:number)=>{
    if(paused||over||clearing.length)return;
    const p=pieces[index];if(!p)return;
    if(!fits(board,p.shape,x,y)){feedback('error');setNotice('That space is occupied. Try another position.');return;}
    history.current=[...history.current.slice(-29),{board:board.map(r=>[...r]),score,placed,pieces:pieces.map(v=>({...v})),combo}];
    const merged=board.map(r=>[...r]);
    p.shape.forEach((row,dy)=>row.forEach((v,dx)=>{if(v)merged[y+dy][x+dx]=p.color;}));
    const fullRows=merged.map((r,i)=>r.every(Boolean)?i:-1).filter(i=>i>=0);
    const fullCols=Array.from({length:SIZE},(_,c)=>c).filter(c=>merged.every(r=>r[c]));
    const cleared=new Set<string>();
    fullRows.forEach(r=>Array.from({length:SIZE},(_,c)=>cleared.add(r+','+c)));
    fullCols.forEach(c=>Array.from({length:SIZE},(_,r)=>cleared.add(r+','+c)));
    const lines=fullRows.length+fullCols.length, cellsCleared=cleared.size;
    const nextCombo=lines?combo+1:0, gained=p.shape.flat().filter(Boolean).length*5+(lines?lines*100+Math.max(0,lines-1)*50+(combo?combo*40:0):0);
    const nextScore=score+gained,nextPlaced=placed+1;
    const remaining=pieces.filter((_,i)=>i!==index);
    let nextPieces=remaining;
    if(remaining.length===0)nextPieces=Array.from({length:3},()=>randomPiece(pieceId.current++,theme));
    setScore(nextScore);setPlaced(nextPlaced);setCombo(nextCombo);setSelected(null);setPreview(null);updateBest(nextScore);
    if(lines){
      setClearing([...cleared]);setCelebrate(true);setThemeIndex(v=>(v+1)%THEMES.length);feedback('clear');
      setNotice('Amazing! '+lines+' line'+(lines>1?'s':'')+' cleared together'+(nextCombo>1?' · '+nextCombo+'× combo':'')+'!');
      window.setTimeout(()=>{
        const clean=merged.map((row,r)=>row.map((cell,c)=>cleared.has(r+','+c)?null:cell));
        const recolored=clean.map((row,r)=>row.map((cell,c)=>cell?THEMES[(themeIndex+1)%THEMES.length].colors[(r*3+c+nextPlaced)%THEMES[(themeIndex+1)%THEMES.length].colors.length]:null));
        setBoard(recolored);setClearing([]);setCelebrate(false);
        if(!canPlaceAny(recolored,nextPieces)){setOver(true);setNotice('No more pieces fit. Excellent build!');}
      },360);
    }else{
      setBoard(merged);feedback('place');setNotice('Nice placement. Complete a full row or column to clear it.');
      if(!canPlaceAny(merged,nextPieces)){setOver(true);setNotice('No more pieces fit. Excellent build!');}
    }
    setPieces(nextPieces);
  },[paused,over,clearing.length,pieces,board,score,placed,combo,feedback,updateBest,theme,themeIndex]);
  const reset=()=>{history.current=[];pieceId.current=3;setBoard(emptyBoard());setPieces(Array.from({length:3},(_,i)=>randomPiece(i,theme)));setScore(0);setPlaced(0);setCombo(0);setSelected(null);setOver(false);setPaused(false);setClearing([]);setCelebrate(false);setNotice('New board ready. Choose any of your three pieces.');};
  const undo=()=>{if(paused||over||clearing.length||!history.current.length)return;const prev=history.current.pop()!;setBoard(prev.board);setScore(prev.score);setPlaced(prev.placed);setPieces(prev.pieces);setCombo(prev.combo);setOver(false);setSelected(null);setNotice('Last move undone.');feedback('place');};
  const rotateSelected=()=>{if(selected===null||paused||over)return;const p=pieces[selected];if(!p)return;const rotated=p.shape[0].map((_,i)=>p.shape.map(row=>row[i]).reverse());setPieces(list=>list.map((v,i)=>i===selected?{...v,shape:rotated}:v));setNotice('Piece rotated. Place it wherever it fits.');};
  const targetFromPointer=(clientX:number,clientY:number,grabX:number,grabY:number)=>{
    const el=boardRef.current;if(!el)return null;const rect=el.getBoundingClientRect(),cellW=(rect.width-14-((SIZE-1)*3))/SIZE,cellH=(rect.height-14-((SIZE-1)*3))/SIZE;
    const x=Math.floor((clientX-rect.left-7)/ (cellW+3))-grabX,y=Math.floor((clientY-rect.top-7)/(cellH+3))-grabY;
    return {x,y};
  };
  const onPieceDown=(e:ReactPointerEvent<HTMLDivElement>,index:number,dx:number,dy:number)=>{
    if(paused||over||clearing.length)return;e.preventDefault();setSelected(index);dragRef.current={pointerId:e.pointerId,index,grabX:dx,grabY:dy};hoverRef.current=null;e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPieceMove=(e:ReactPointerEvent<HTMLDivElement>)=>{const d=dragRef.current;if(!d||d.pointerId!==e.pointerId)return;e.preventDefault();const pos=targetFromPointer(e.clientX,e.clientY,d.grabX,d.grabY);if(pos){hoverRef.current=pos;setPreview(pos);}};
  const onPieceUp=(e:ReactPointerEvent<HTMLDivElement>)=>{const d=dragRef.current;if(!d||d.pointerId!==e.pointerId)return;dragRef.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);const pos=hoverRef.current;hoverRef.current=null;setPreview(null);if(pos)placePiece(d.index,pos.x,pos.y);};
  const onPieceCancel=(e:ReactPointerEvent<HTMLDivElement>)=>{if(dragRef.current?.pointerId===e.pointerId){dragRef.current=null;hoverRef.current=null;setPreview(null);setNotice('Move cancelled. Your piece is still available.');}};
  const onBoardTap=(e:ReactPointerEvent<HTMLDivElement>)=>{if(selected===null||paused||over||clearing.length)return;const p=pieces[selected];if(!p)return;const pos=targetFromPointer(e.clientX,e.clientY,0,0);if(pos)placePiece(selected,pos.x,pos.y);};
  const display=useMemo(()=>{const grid=board.map(r=>[...r]);if(preview&&selected!==null&&pieces[selected]){const p=pieces[selected];p.shape.forEach((row,dy)=>row.forEach((v,dx)=>{if(v&&preview.y+dy>=0&&preview.y+dy<SIZE&&preview.x+dx>=0&&preview.x+dx<SIZE&&grid[preview.y+dy][preview.x+dx]===null)grid[preview.y+dy][preview.x+dx]='preview';}));}return grid;},[board,preview,selected,pieces]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setPaused(v=>!v);if(e.key==='z'||e.key==='Z')undo();if((e.key==='r'||e.key==='R')&&selected!==null)rotateSelected();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
  return <div className="page arcade-page" style={css}>
    <style>{`
      .isomo-game{max-width:980px;margin:0 auto;color:var(--game-text);background:linear-gradient(145deg,var(--game-bg),color-mix(in srgb,var(--game-bg),var(--game-accent) 15%));border:1px solid var(--game-line);border-radius:24px;padding:clamp(14px,3vw,26px);box-shadow:0 22px 65px #0002;transition:background .35s ease}
      .isomo-game button:focus-visible{outline:3px solid var(--game-accent);outline-offset:3px}.isomo-game button:active{transform:scale(.97)}
      .isomo-game .game-board{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:3px;width:min(88vw,430px);aspect-ratio:1;background:var(--game-board);padding:7px;border:1px solid var(--game-line);border-radius:17px;box-shadow:0 15px 40px #0005;touch-action:pan-y;user-select:none;-webkit-user-select:none}
      .isomo-game .game-cell{min-width:0;min-height:0;border-radius:4px;transition:background .2s ease,box-shadow .2s ease,transform .2s ease}.isomo-game .game-cell.preview{background:#ffffff75!important;border:1px dashed #fff!important;box-shadow:0 0 12px #fff8}
      .isomo-game .game-cell.clearing{animation:blast .36s ease both}
      @keyframes blast{0%{transform:scale(1);filter:brightness(1)}45%{transform:scale(.82);filter:brightness(2.3)}100%{transform:scale(.2);opacity:0}}
      .isomo-game .piece-tray{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px}
      .isomo-game .piece-card{min-height:106px;border:1px solid var(--game-line);background:var(--game-card);border-radius:16px;padding:10px;display:grid;place-items:center;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;transition:transform .16s,border-color .16s,background .3s}
      .isomo-game .piece-card.selected{border:2px solid var(--game-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--game-accent),transparent 75%);transform:translateY(-3px)}
      .isomo-game .piece-card:active{cursor:grabbing}.isomo-game .piece-cell{width:clamp(15px,4vw,23px);aspect-ratio:1;border-radius:5px;box-shadow:inset 0 0 5px #ffffff55}
      .isomo-game .game-card{background:var(--game-card);border:1px solid var(--game-line);border-radius:16px;padding:14px}
      .isomo-game .game-btn{border:1px solid var(--game-line);border-radius:13px;background:var(--game-card);color:var(--game-text);padding:11px 13px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-weight:750;cursor:pointer}
      .isomo-game .game-primary{background:var(--game-accent);color:#07111e;border-color:transparent}.isomo-game .game-muted{color:var(--game-muted)}
      .isomo-game select{background:var(--game-card);color:var(--game-text);border:1px solid var(--game-line);border-radius:11px;padding:9px}
      .isomo-game .celebrate{animation:celebrate .55s ease}@keyframes celebrate{0%{filter:brightness(1)}35%{filter:brightness(1.7) saturate(1.5)}100%{filter:brightness(1)}}
      @media(max-width:620px){.isomo-game .game-layout{gap:14px!important}.isomo-game .game-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}.isomo-game .piece-tray{gap:7px}.isomo-game .piece-card{min-height:90px;padding:6px}}
      @media(prefers-reduced-motion:reduce){.isomo-game *, .isomo-game *:before{animation:none!important;transition:none!important}}
    `}</style>
    <div className="arcade-top" style={{marginBottom:16}}><button className="btn outline" onClick={onBack}><ArrowLeft size={16}/> Back</button><div><span>ISOMO ACADEMY · ARCADE</span><h1>ISOMO BLOCK BLAST</h1><p>Fit pieces, clear rows and columns, build combos.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span style={stat}>🏆 Best<br/><b>{best}</b></span><span style={stat}>⭐ Score<br/><b>{score}</b></span></div></div>
    <section className={'isomo-game '+(celebrate?'celebrate':'')}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:16}}>
        <div><div style={{fontSize:12,fontWeight:850,letterSpacing:1.3,color:'var(--game-accent)'}}>BLOCK PUZZLE · {placed} PIECES PLACED</div><h2 style={{fontSize:'clamp(19px,3vw,25px)',margin:'5px 0'}}>Clear the board. Chase a combo!</h2><p className="game-muted" style={{margin:0,fontSize:13}}>Place pieces anywhere they fit. Complete rows and columns to blast them away.</p></div>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}><label className="game-muted" htmlFor="game-theme"><Palette size={16}/><span className="sr-only">Theme</span></label><select id="game-theme" value={themeIndex} onChange={e=>setThemeIndex(Number(e.target.value))} aria-label="Choose game theme">{THEMES.map((t,i)=><option value={i} key={t.name}>{t.name}</option>)}</select><button className="game-btn" onClick={()=>setSound(v=>!v)} aria-label={sound?'Mute game sounds':'Enable game sounds'}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button><button className="game-btn" onClick={()=>setHelp(true)} aria-label="How to play"><HelpCircle size={17}/></button></div>
      </div>
      <div className="game-layout" style={{display:'flex',justifyContent:'center',alignItems:'flex-start',gap:22,flexWrap:'wrap'}}>
        <div style={{position:'relative'}}>
          <div ref={boardRef} onPointerDown={onBoardTap} role="grid" aria-label="10 by 10 block puzzle board. Select a piece then tap a position, or drag a piece from the tray." className="game-board">
            {display.flatMap((row,y)=>row.map((cell,x)=><div role="gridcell" aria-label={cell&&cell!=='preview'?'Occupied block':'Empty cell'} key={y+'-'+x} className={'game-cell '+(cell==='preview'?'preview':'')+' '+(clearing.includes(y+','+x)?'clearing':'')} style={{background:cell==='preview'?'#ffffff75':cell||'var(--game-cell)',border:cell?'1px solid #ffffff65':'1px solid var(--game-line)',boxShadow:cell&&cell!=='preview'?'inset 0 0 9px #ffffff35':'none'}}/>))}
          </div>
          {(paused||over)&&<div style={{position:'absolute',inset:0,display:'grid',placeContent:'center',textAlign:'center',background:'#07101deF',color:'white',borderRadius:17,padding:20,zIndex:2}}><Sparkles size={28} style={{margin:'0 auto 8px',color:'var(--game-accent)'}}/><h2 style={{margin:'0 0 8px'}}>{over?'Board complete!':'Game paused'}</h2><p>{over?'You placed '+placed+' pieces and scored '+score+'.':'Your board is safe. Resume whenever you are ready.'}</p><button className="game-btn game-primary" onClick={over?reset:()=>setPaused(false)}>{over?'Play again':'Resume'}</button></div>}
          <div className="piece-tray">{pieces.map((p,index)=><div key={p.id} className={'piece-card '+(selected===index?'selected':'')} onClick={()=>setSelected(index)} onPointerDown={e=>{const box=e.currentTarget.getBoundingClientRect(),w=box.width/5,h=box.height/4;const dx=Math.max(0,Math.min(p.shape[0].length-1,Math.floor((e.clientX-box.left)/w)));const dy=Math.max(0,Math.min(p.shape.length-1,Math.floor((e.clientY-box.top)/h)));onPieceDown(e,index,dx,dy);}} onPointerMove={onPieceMove} onPointerUp={onPieceUp} onPointerCancel={onPieceCancel} aria-label={'Select or drag piece '+(index+1)}>{p.shape.map((row,r)=><div key={r} style={{display:'flex',gap:3,justifyContent:'center'}}>{row.map((v,c)=><span key={c} className="piece-cell" style={{background:v?p.color:'transparent',boxShadow:v?'inset 0 0 5px #ffffff55':'none'}}/>)}</div>)}</div>)}</div>
          <p className="game-muted" style={{textAlign:'center',fontSize:12,margin:'8px 0 0'}}>Drag a piece onto the board, or tap a piece then tap its starting cell.</p>
        </div>
        <div className="game-side" style={{display:'grid',gap:10,minWidth:145,maxWidth:190}}>
          <div className="game-card"><div className="game-muted" style={{fontSize:12}}>SCORE</div><div style={{fontSize:27,fontWeight:900}}>{score}</div></div>
          <div className="game-card"><div className="game-muted" style={{fontSize:12}}>BEST SCORE</div><div style={{fontSize:25,fontWeight:900}}>{best}</div></div>
          <div className="game-card"><div className="game-muted" style={{fontSize:12}}>COMBO</div><div style={{fontSize:25,fontWeight:900,color:'var(--game-accent)'}}>{combo?combo+'×':'—'}</div></div>
          <button className="game-btn" onClick={()=>setPaused(v=>!v)}>{paused?<Play size={17}/>:<Pause size={17}/>} {paused?'Resume':'Pause'}</button>
          <button className="game-btn" onClick={rotateSelected} disabled={selected===null} style={{opacity:selected===null?.45:1}}><RotateCw size={17}/> Rotate</button>
          <button className="game-btn" onClick={undo} disabled={!history.current.length||paused||over||!!clearing.length} style={{opacity:history.current.length&&!paused&&!over&&!clearing.length?1:.45}}><Undo2 size={17}/> Undo</button>
          <button className="game-btn" onClick={reset}><RotateCcw size={17}/> New game</button>
        </div>
      </div>
      <div aria-live="polite" className="game-muted" style={{textAlign:'center',fontSize:13,minHeight:22,marginTop:14}}>{notice}</div>
      <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginTop:10}}><button className="btn outline" onClick={()=>onStudySkill('Vocabulary')}>Practise vocabulary</button><button className="btn outline" onClick={()=>{setOver(true);updateBest(score);setNotice('Game finished. Great work!');}}>Finish game</button></div>
      <p className="game-muted" style={{fontSize:12,textAlign:'center',margin:'14px 0 0'}}>Tip: plan ahead. Clearing several rows or columns in one move earns a bigger score and combo.</p>
    </section>
    {help&&<div role="dialog" aria-modal="true" aria-labelledby="game-help-title" style={{position:'fixed',inset:0,zIndex:1000,background:'#020817bb',display:'grid',placeItems:'center',padding:18}} onPointerDown={e=>{if(e.target===e.currentTarget)setHelp(false);}}><div style={{background:'var(--surface,#fff)',color:'var(--text,#172b3a)',borderRadius:20,padding:22,maxWidth:440,width:'100%',boxShadow:'0 24px 80px #0006'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 id="game-help-title" style={{margin:0}}>How to play</h2><button className="game-btn" onClick={()=>setHelp(false)} aria-label="Close help"><X size={18}/></button></div><ul style={{lineHeight:1.8,paddingLeft:20}}><li>You get three different pieces at a time. Drag any piece onto an empty area.</li><li>You can also tap a piece, then tap the board where its top-left corner should go.</li><li>Fill an entire horizontal row or vertical column to clear it.</li><li>Rows and columns completed by the same move clear together for a bigger score.</li><li>Every clear triggers a bright color burst and changes the board theme. Consecutive clears build combos.</li><li>Rotate a selected piece, undo a move, or change the theme whenever you like.</li></ul><button className="game-btn game-primary" style={{width:'100%'}} onClick={()=>setHelp(false)}>Let’s play</button></div></div>}
  </div>;
}
