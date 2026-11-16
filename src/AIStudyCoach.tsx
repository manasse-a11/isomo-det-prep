import {useEffect,useMemo,useRef,useState} from 'react';
import {Bot,Send,Trash2,BookOpen,Mic,PenLine,Headphones,Volume2,Sparkles,ShieldCheck,GraduationCap,Target,Clock3,BarChart3,ClipboardCheck,StopCircle,MessageCircle,Loader2} from 'lucide-react';
import {supabase} from './lib';

type ChatLine={role:'user'|'model';text:string;time:number};
const tasks=[
 {label:'Speaking: describe a photo',icon:Mic,prompt:'Run a DET-style Describe the Photo speaking drill. Present one vivid but realistic scene in words, give me 30 seconds to prepare and 90 seconds to respond. Wait for my answer. Then assess relevance, detail, organisation, grammar, vocabulary and fluency. Give me one focused repeat drill.'},
 {label:'Speaking: extended response',icon:Mic,prompt:'Coach me through a DET-style extended speaking response. Ask one open question, wait for my complete answer and then give criterion-based feedback on idea development, coherence, grammatical range, vocabulary precision and fluency. Show a stronger outline and ask me to try again.'},
 {label:'Interactive speaking',icon:Mic,prompt:'Simulate an interactive speaking conversation. Ask one natural follow-up question at a time. Adapt each next question to my previous answer. After five turns, evaluate responsiveness, clarity, elaboration, grammar and vocabulary.'},
 {label:'Writing: photo description',icon:PenLine,prompt:'Give me one DET-style photo-description writing task. Describe a realistic image in words, wait for my response, then review accuracy, specificity, sentence variety, grammar, vocabulary and mechanics. Quote errors and ask me to revise.'},
 {label:'Writing: extended response',icon:PenLine,prompt:'Act as a rigorous DET writing tutor. Give me a realistic opinion or experience prompt. Wait for my draft. Assess task fulfilment, development, organisation, cohesion, grammar, vocabulary and mechanics separately. Identify the three most important revisions, explain each and ask for a revised version.'},
 {label:'Reading comprehension',icon:BookOpen,prompt:'Give me a challenging academic reading passage of 180–230 words followed by questions on main idea, supporting detail, inference, vocabulary in context and author purpose. Ask one question at a time and do not reveal answers early.'},
 {label:'Listening and note-taking',icon:Headphones,prompt:'Create a natural academic mini-lecture or conversation suitable for text-to-speech. Ask five questions about key details, sequence, inference, speaker purpose and summary. After I answer, diagnose missed information and teach me a note-taking method.'},
 {label:'Vocabulary and collocations',icon:Sparkles,prompt:'Teach me five high-utility academic English words. For each, give pronunciation guidance, part of speech, plain-English definition, common collocations, one natural example and a common misuse. Quiz me in context.'},
 {label:'Grammar clinic',icon:ClipboardCheck,prompt:'Diagnose my English grammar through a short adaptive quiz. Test sentence boundaries, verb tense and agreement, articles, prepositions, clauses, punctuation and complex sentence construction. Ask one item at a time, explain corrections and finish with a personalised drill.'},
 {label:'Seven-day study plan',icon:GraduationCap,prompt:'Build a practical seven-day preparation plan using my target, current level, daily study time and weakest skills. Specify each day’s task, time allocation, success criteria, free resources and reflection question. Do not promise a score outcome.'},
 {label:'Full diagnostic',icon:BarChart3,prompt:'Conduct a balanced English diagnostic for DET preparation. Test reading, listening, writing and speaking with one task at a time. Do not give hints before my response. At the end provide a cautious skill profile, three priorities and a two-week practice sequence. Do not claim this is an official DET score.'},
 {label:'SAT Reading & Writing',icon:BookOpen,prompt:'Coach me for the digital SAT Reading and Writing section. Give me one original, challenging question at a time across Information and Ideas, Craft and Structure, Expression of Ideas and Standard English Conventions. Wait for my answer, explain the evidence and why distractors are wrong, and adapt difficulty.'},
 {label:'SAT Math',icon:BarChart3,prompt:'Coach me for digital SAT Math. Give me one original question at a time across Algebra, Advanced Math, Problem-Solving and Data Analysis, and Geometry and Trigonometry. Wait for my answer, show a clear solution, explain common traps and adapt difficulty.'},
 {label:'Research and academic English',icon:BookOpen,prompt:'Help me improve academic English for university study. Teach me to distinguish claims from evidence, practise paraphrasing without plagiarism, evaluate source credibility and write a concise synthesis. Ask me to attempt each step before giving feedback.'}
];
const greeting:ChatLine={role:'model',text:'Hello! I’m your ISOMO AI Study Coach. We can work on DET, SAT, academic English, writing, reading, speaking, grammar or a study plan. Choose a guided activity or ask me anything to begin.',time:Date.now()};

export default function AIStudyCoach({user,priorMarks,progress,onPractice}:any){
 const [programme,setProgramme]=useState('DET');
 const [task,setTask]=useState(0);
 const [target,setTarget]=useState('120');
 const [minutes,setMinutes]=useState('45');
 const [level,setLevel]=useState('Upper-intermediate');
 const [extra,setExtra]=useState('');
 const [draft,setDraft]=useState('');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [messages,setMessages]=useState<ChatLine[]>([greeting]);
 const [showProfile,setShowProfile]=useState(false);
 const endRef=useRef<HTMLDivElement|null>(null);
 const textareaRef=useRef<HTMLTextAreaElement|null>(null);
 const storageKey='isomo-ai-coach-'+String(user?.userId||user?.email||'scholar');
 const marks=useMemo(()=>priorMarks&&typeof priorMarks==='object'?Object.entries(priorMarks).filter(([k,v]:any)=>!String(k).startsWith('_')&&v!==''&&Number.isFinite(Number(v))).map(([k,v])=>k+': '+v).join(', '):'',[priorMarks]);
 const progressSummary=useMemo(()=>progress&&typeof progress==='object'?Object.entries(progress).filter(([k,v]:any)=>!String(k).startsWith('_')&&Number.isFinite(Number(v))).slice(0,10).map(([k,v])=>k+': '+v).join(', '):'',[progress]);
 const studyContext=useMemo(()=>({programme,level,target,minutes,marks:marks||'No previous marks entered',progress:progressSummary||'No progress data yet'}),[programme,level,target,minutes,marks,progressSummary]);

 useEffect(()=>{
  try{const saved=localStorage.getItem(storageKey);if(saved){const parsed=JSON.parse(saved);if(Array.isArray(parsed)&&parsed.length)setMessages(parsed.slice(-60));}}
  catch{/* Start a fresh local conversation if saved history is unavailable. */}
 },[storageKey]);
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(messages.slice(-60)));}catch{/* Storage may be disabled or full. */}},[messages,storageKey]);
 useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth',block:'end'});},[messages,busy]);

 const send=async(textOverride?:string)=>{
  const text=(textOverride??draft).trim();
  if(!text||busy)return;
  const userLine:ChatLine={role:'user',text,time:Date.now()};
  const next=[...messages,userLine].slice(-60);
  setMessages(next);setDraft('');setNotice('');setBusy(true);
  try{
   const {data:{session},error}=await supabase.auth.getSession();
   if(error||!session?.access_token)throw new Error('Your sign-in session has expired. Please sign in again.');
   const response=await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({messages:next.filter(m=>m!==greeting).slice(-16).map(m=>({role:m.role,text:m.text})),studyContext})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(result.error||'The AI Coach could not respond. Please try again.');
   setMessages(current=>[...current,{role:'model',text:String(result.text||''),time:Date.now()}].slice(-60));
  }catch(error:any){
   setNotice(error?.message||'A connection error occurred. Please try again.');
  }finally{setBusy(false);textareaRef.current?.focus();}
 };
 const startTask=()=>send(tasks[task].prompt+(extra.trim()?'\n\nMy additional context: '+extra.trim():''));
 const clearChat=()=>{
  if(!window.confirm('Clear this conversation from this device?'))return;
  setMessages([{...greeting,time:Date.now()}]);setNotice('');
 };
 const speak=(text:string)=>{
  if(!('speechSynthesis' in window)){setNotice('Read aloud is not available in this browser.');return;}
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='en-US';utterance.rate=0.94;window.speechSynthesis.speak(utterance);
 };
 const stopSpeaking=()=>window.speechSynthesis?.cancel();
 const handleKey=(event:React.KeyboardEvent<HTMLTextAreaElement>)=>{
  if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();void send();}
 };

 return <div className="page ai-coach-page ai-workspace">
  <div className="page-intro"><div className="eyebrow dark">ISOMO INTELLIGENCE · BUILT INTO PREP CENTER</div><h1>Your AI Study Coach.</h1><p>Ask questions, practise and receive personalised feedback without leaving ISOMO Prep Center.</p></div>
  <section className="ai-workspace-banner"><span><Bot size={24}/></span><div><strong>Gemini AI · In-app tutor</strong><p>Your conversation stays in this workspace. The assistant uses your selected study context to personalise support.</p></div><span className="ai-workspace-badge"><ShieldCheck size={14}/> Secure server connection</span></section>
  <div className="ai-study-profile ai-workspace-settings">
   <div className="ai-study-profile-head"><div><div className="eyebrow dark">YOUR LEARNING CONTEXT</div><h3><Target size={17}/> Personalise your coach</h3></div><button type="button" className="text-button" onClick={()=>setShowProfile(!showProfile)}>{showProfile?'Hide settings':'Edit settings'}</button></div>
   <div className="ai-profile-fields">
    <label>Programme<select value={programme} onChange={e=>setProgramme(e.target.value)}><option>DET</option><option>SAT</option><option>General academic English</option></select></label>
    <label>Current level<select value={level} onChange={e=>setLevel(e.target.value)}><option>Beginner</option><option>Elementary</option><option>Intermediate</option><option>Upper-intermediate</option><option>Advanced</option></select></label>
    {programme==='DET'&&<label>Target DET score<select value={target} onChange={e=>setTarget(e.target.value)}>{['85','95','105','115','120','125','130','135','140','145','150','155','160'].map(x=><option key={x}>{x}</option>)}</select></label>}
    <label>Daily study time<select value={minutes} onChange={e=>setMinutes(e.target.value)}>{['15','30','45','60','90','120'].map(x=><option key={x} value={x}>{x} minutes</option>)}</select></label>
   </div>
   {showProfile&&<div className="ai-score-context"><strong>Previous skill marks</strong><p>{marks||'No previous marks have been entered.'}</p><strong>Recorded learning progress</strong><p>{progressSummary||'No progress data is available yet.'}</p><small>Only relevant learning context is sent to Gemini with your message. Do not include passwords or highly sensitive personal information.</small></div>}
  </div>
  <div className="ai-workspace-grid">
   <aside className="panel ai-guided-panel">
    <div className="eyebrow dark">GUIDED PRACTICE</div><h3><Sparkles size={18}/> Choose a learning activity</h3>
    <div className="ai-task-grid">{tasks.map((t,i)=>{const Icon=t.icon;return <button type="button" key={t.label} className={'ai-task-button '+(task===i?'selected':'')} onClick={()=>setTask(i)}><Icon size={16}/><span>{t.label}</span></button>})}</div>
    <label className="ai-prompt-label" htmlFor="ai-extra-context">Add a focus or question (optional)</label>
    <textarea id="ai-extra-context" className="ai-prompt-textarea" rows={3} value={extra} onChange={e=>setExtra(e.target.value)} placeholder="What would you like the coach to focus on?"/>
    <button type="button" className="btn primary full" disabled={busy} onClick={startTask}><Sparkles size={15}/> Start guided activity</button>
    <div className="ai-edge-tip"><strong>Read responses aloud</strong><span>Use the speaker control on any AI response to hear natural English pronunciation.</span></div>
   </aside>
   <section className="panel ai-chat-panel">
    <div className="ai-chat-header"><div><div className="eyebrow dark">LIVE LEARNING CONVERSATION</div><h3><span className="ai-online-dot"/> ISOMO AI Coach</h3><small>Gemini · {programme} support · Chat stays inside the app</small></div><button type="button" className="ai-clear-button" onClick={clearChat} disabled={busy} title="Clear conversation"><Trash2 size={16}/><span>Clear</span></button></div>
    <div className="ai-chat-messages" aria-live="polite">
     {messages.map((message,index)=><div key={message.time+'-'+index} className={'ai-chat-row '+(message.role==='user'?'from-user':'from-coach')}><div className="ai-chat-avatar">{message.role==='user'?'You':<Bot size={17}/>}</div><div className="ai-chat-bubble"><div className="ai-chat-message-text">{message.text}</div>{message.role==='model'&&<button type="button" className="ai-speak-button" onClick={()=>speak(message.text)}><Volume2 size={14}/> Read aloud</button>}<time>{new Date(message.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time></div></div>)}
     {busy&&<div className="ai-chat-row from-coach"><div className="ai-chat-avatar"><Bot size={17}/></div><div className="ai-chat-bubble ai-thinking"><Loader2 size={16}/> Thinking and preparing your response…</div></div>}
     <div ref={endRef}/>
    </div>
    {notice&&<div className="ai-chat-notice" role="status">{notice}</div>}
    <div className="ai-chat-compose"><textarea ref={textareaRef} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={handleKey} rows={2} maxLength={7000} placeholder="Ask your coach anything… (Enter to send, Shift + Enter for a new line)" disabled={busy}/><button type="button" className="ai-send-button" onClick={()=>void send()} disabled={busy||!draft.trim()} aria-label="Send message">{busy?<Loader2 size={19}/>:<Send size={19}/>}</button></div>
    <div className="ai-chat-foot"><span><ShieldCheck size={13}/> Your chat history is stored on this device.</span><span>AI can make mistakes. Verify important information.</span></div>
   </section>
  </div>
  <section className="panel ai-local-practice"><div className="eyebrow dark">MORE PRACTICE INSIDE ISOMO</div><h3>Turn feedback into progress</h3><p>Continue with targeted exercises in the learning centre. Your practice records remain connected to your ISOMO account.</p><div className="ai-quick-links"><button onClick={()=>onPractice('Speaking')}><Mic size={15}/> Speaking practice</button><button onClick={()=>onPractice('Writing')}><PenLine size={15}/> Writing practice</button><button onClick={()=>onPractice('Reading')}><BookOpen size={15}/> Reading practice</button><button onClick={()=>onPractice('Listening')}><Headphones size={15}/> Listening practice</button></div></section>
  <p className="ai-coach-disclaimer">Gemini is provided through Google’s free API tier when available. Usage limits and model availability are controlled by Google. Do not enter passwords, authentication codes or sensitive personal records. ISOMO practice estimates are not official DET or SAT scores.</p>
 </div>;
}
