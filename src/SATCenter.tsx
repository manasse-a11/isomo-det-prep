import { useState } from 'react';
import { ArrowLeft, BookOpen, Calculator, GraduationCap, Library, Sparkles } from 'lucide-react';
import SATQuest from './SATQuest';
import SATVocabTrainer from './SATVocabTrainer';

export default function SATCenter({userId,onBack}:{userId:string;onBack:()=>void}) {
  const [section,setSection]=useState<'home'|'quest'|'vocabulary'>('home');
  if(section==='quest') return <SATQuest userId={userId} onBack={()=>setSection('home')}/>;
  if(section==='vocabulary') return <SATVocabTrainer userId={userId} onBack={()=>setSection('home')}/>;
  return <main className="page sat-center-page">
    <div className="sat-center-heading">
      <button className="btn outline" onClick={onBack}><ArrowLeft size={16}/> Back</button>
      <div className="sat-center-kicker"><GraduationCap size={17}/> ISOMO ACADEMY · SAT WORLD</div>
      <h1>Welcome to SAT World.</h1>
      <p>Build confidence through focused practice, clear explanations and academic vocabulary.</p>
    </div>
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
