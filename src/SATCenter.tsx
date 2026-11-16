import { useState } from 'react';
import { ArrowLeft, BookOpen, Calculator, GraduationCap, Library, Save, Sparkles } from 'lucide-react';
import SATQuest from './SATQuest';
import SATVocabTrainer from './SATVocabTrainer';

type SATPreviousScores = { readingWriting: number | ''; math: number | '' };

export default function SATCenter({userId,onBack,scores,onSaveScores}:{userId:string;onBack:()=>void;scores:SATPreviousScores;onSaveScores:(scores:SATPreviousScores)=>Promise<void>}) {
  const [section,setSection]=useState<'home'|'quest'|'vocabulary'>('home');
  const [draft,setDraft]=useState<SATPreviousScores>(scores || {readingWriting:'',math:''});
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const update=(key:keyof SATPreviousScores,raw:string)=>{
    if(raw!=='' && (!Number.isFinite(Number(raw)) || Number(raw)>800)) {
      setMessage('SAT section scores cannot exceed 800.');
      return;
    }
    setDraft(current=>({...current,[key]:raw===''?'':Number(raw)}));
    setMessage('');
  };
  const valid=(value:number|'')=>value!=='' && Number(value)>=200 && Number(value)<=800;
  const overall=valid(draft.readingWriting)&&valid(draft.math)?Number(draft.readingWriting)+Number(draft.math):null;
  const save=async()=>{
    const entered=[draft.readingWriting,draft.math].filter(value=>value!=='');
    if(!entered.length){setMessage('Enter at least one previous SAT section score.');return;}
    if(entered.some(value=>!valid(value))){setMessage('Each entered SAT section score must be between 200 and 800.');return;}
    setSaving(true);setMessage('');
    try{await onSaveScores(draft);setMessage('Your previous SAT scores have been saved.');}
    catch{setMessage('Your scores could not sync. Please try again.');}
    finally{setSaving(false);}
  };
  if(section==='quest') return <SATQuest userId={userId} onBack={()=>setSection('home')}/>;
  if(section==='vocabulary') return <SATVocabTrainer userId={userId} onBack={()=>setSection('home')}/>;
  return <main className="page sat-center-page">
    <div className="sat-center-heading">
      <button className="btn outline" onClick={onBack}><ArrowLeft size={16}/> Back</button>
      <div className="sat-center-kicker"><GraduationCap size={17}/> ISOMO ACADEMY · SAT WORLD</div>
      <h1>Welcome to SAT World.</h1>
      <p>Build confidence through focused practice, clear explanations and academic vocabulary.</p>
    </div>
    <section className="sat-previous-score-panel">
      <div className="sat-previous-score-copy"><div className="sat-center-kicker">YOUR STARTING POINT</div><h2>Enter your previous SAT scores</h2><p>Choose any section scores you already have. Each section accepts 200–800. You can leave a field blank and update it later.</p></div>
      <div className="sat-previous-fields">
        <label><span>Reading & Writing</span><input type="number" min="200" max="800" step="1" inputMode="numeric" placeholder="200–800" value={draft.readingWriting} onChange={e=>update('readingWriting',e.target.value)} onBlur={()=>{if(draft.readingWriting!==''&&!valid(draft.readingWriting))setMessage('Reading & Writing must be between 200 and 800.')}}/></label>
        <label><span>Math</span><input type="number" min="200" max="800" step="1" inputMode="numeric" placeholder="200–800" value={draft.math} onChange={e=>update('math',e.target.value)} onBlur={()=>{if(draft.math!==''&&!valid(draft.math))setMessage('Math must be between 200 and 800.')}}/></label>
      </div>
      <div className="sat-previous-total"><span>Automatic overall SAT score</span><strong>{overall??'—'}<small> / 1600</small></strong><p>{overall!==null?'Reading & Writing + Math':'Enter both section scores to calculate your total.'}</p></div>
      <div className="sat-previous-save"><button className="btn primary" onClick={save} disabled={saving}><Save size={15}/>{saving?'Saving…':'Save previous scores'}</button>{message&&<span role="status">{message}</span>}</div>
    </section>
    <div className="sat-center-grid">
      <button className="sat-center-card sat-card-blue" onClick={()=>setSection('quest')}>
        <span className="sat-card-icon"><Calculator size={27}/></span><span className="sat-card-label">PRACTICE & DIAGNOSTICS</span>
        <strong>SAT Quest</strong><span>Practise Reading & Writing and Math with timed questions, explanations and a performance review.</span><em>Start SAT practice <span>→</span></em>
      </button>
      <button className="sat-center-card sat-card-violet" onClick={()=>setSection('vocabulary')}>
        <span className="sat-card-icon"><Library size={27}/></span><span className="sat-card-label">ACADEMIC WORD POWER</span>
        <strong>Vocabulary Rush</strong><span>Explore the full 611-word library, study definitions and train with timed vocabulary rounds.</span><em>Play Vocabulary Rush <span>→</span></em>
      </button>
    </div>
    <div className="sat-center-note"><Sparkles size={18}/><p><strong>Make every session count.</strong> Review explanations after each practice set and revisit unfamiliar words before moving to the next challenge.</p></div>
  </main>;
}
