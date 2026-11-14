import {useMemo,useState} from 'react';
import {Bot,ExternalLink,Copy,Check,BookOpen,Mic,PenLine,Headphones,Volume2,Sparkles,ShieldCheck,GraduationCap,Target,Clock3,BarChart3,ClipboardCheck} from 'lucide-react';

const providers=[
 {name:'ChatGPT',tag:'General tutor',detail:'Step-by-step explanations, practice questions and writing feedback.',url:'https://chatgpt.com/',icon:'✳'},
 {name:'Google Gemini',tag:'Study and research',detail:'Explain concepts, brainstorm, review notes and explore topics.',url:'https://gemini.google.com/app',icon:'✦'},
 {name:'Claude',tag:'Writing and reasoning',detail:'Work through longer responses, structure ideas and get detailed feedback.',url:'https://claude.ai/new',icon:'◈'},
 {name:'Microsoft Copilot',tag:'Web-connected help',detail:'Ask questions, research topics and practise in the Microsoft ecosystem.',url:'https://copilot.microsoft.com/',icon:'▦'},
 {name:'Perplexity',tag:'Research with sources',detail:'Explore a topic and check the sources behind the answer.',url:'https://www.perplexity.ai/',icon:'◉'},
 {name:'DeepSeek',tag:'Reasoning practice',detail:'Ask for alternative explanations and step-by-step problem solving.',url:'https://chat.deepseek.com/',icon:'⌘'},
 {name:'Mistral Le Chat',tag:'Extra AI tutor',detail:'Try another assistant for explanations, rewriting and practice.',url:'https://chat.mistral.ai/',icon:'✧'},
 {name:'Meta AI',tag:'Quick questions',detail:'A further assistant for everyday English questions where available.',url:'https://www.meta.ai/',icon:'∞'}
];
const tasks=[
 {label:'Speaking: describe a photo',icon:Mic,prompt:'Run a DET-style Describe the Photo speaking drill. Present one vivid but realistic scene in words, give me 30 seconds to prepare and 90 seconds to respond. Wait for my answer. Then assess relevance, detail, organisation, grammar, vocabulary, fluency and pronunciation only where audio is available. Quote specific weak phrases, explain corrections and give me one focused repeat drill.'},
 {label:'Speaking: extended response',icon:Mic,prompt:'Coach me through a DET-style extended speaking response. Ask one open question, wait for my complete answer and then give criterion-based feedback on idea development, coherence, grammatical range, vocabulary precision and fluency. Identify filler words and unsupported claims. Show a stronger outline, not a memorised script, and ask me to try again.'},
 {label:'Interactive speaking',icon:Mic,prompt:'Simulate an interactive speaking conversation. Ask one natural follow-up question at a time. Adapt each next question to my previous answer. After five turns, evaluate responsiveness, clarity, elaboration, grammar and vocabulary. Give concise corrections and a second-round challenge.'},
 {label:'Writing: photo description',icon:PenLine,prompt:'Give me one DET-style photo-description writing task. Ask me to describe only details supported by the image description you provide. Wait for my response. Review accuracy, specificity, sentence variety, grammar, vocabulary and mechanics. Quote errors, explain why they are errors, and ask me to revise before showing a model response.'},
 {label:'Writing: extended response',icon:PenLine,prompt:'Act as a rigorous DET writing tutor. Give me a realistic opinion or experience prompt. Wait for my draft. Assess task fulfilment, development, organisation, cohesion, grammar, vocabulary and mechanics separately. Identify the three most important revisions, explain each with examples from my text, then ask me to submit a revised version.'},
 {label:'Reading comprehension',icon:BookOpen,prompt:'Give me a challenging academic reading passage of 180–230 words followed by questions on main idea, supporting detail, inference, vocabulary in context and author purpose. Ask one question at a time and do not reveal answers early. Explain the evidence for each answer and track my error patterns.'},
 {label:'Listening and note-taking',icon:Headphones,prompt:'Create a natural academic mini-lecture or conversation suitable for text-to-speech. First provide the listening text separately so I can use Read Aloud; do not show it again while quizzing me. Ask five questions about key details, sequence, inference, speaker purpose and summary. After I answer, diagnose missed information and teach a note-taking method.'},
 {label:'Vocabulary and collocations',icon:Sparkles,prompt:'Teach me five high-utility academic English words. For each, give pronunciation guidance, part of speech, plain-English definition, common collocations, one natural example and a common misuse. Quiz me with contextual gap-fill and sentence creation. Revisit missed words later in this session.'},
 {label:'Grammar clinic',icon:ClipboardCheck,prompt:'Diagnose my English grammar through a short adaptive quiz. Test sentence boundaries, verb tense and agreement, articles, prepositions, clauses, punctuation and complex sentence construction. Ask one item at a time, explain each correction and finish with a personalised 10-minute drill.'},
 {label:'Seven-day study plan',icon:GraduationCap,prompt:'Build a practical seven-day DET preparation plan using my target score, current score, daily study time and weakest skills. For every day specify the skill, exact task, time allocation, success criteria, free resource suggestion and reflection question. Include a midweek checkpoint and final timed review. Do not promise a score outcome.'},
 {label:'Full diagnostic',icon:BarChart3,prompt:'Conduct a balanced English diagnostic for DET preparation. Test reading, listening, writing and speaking with one task at a time. Do not give hints before my response. After each section, explain observed strengths and gaps. At the end provide a cautious skill profile, three priorities and a two-week practice sequence. Do not claim this is an official DET score.'},
 {label:'Research and academic English',icon:BookOpen,prompt:'Help me improve academic English for university study. Give me a short research-based topic, teach me to distinguish claims from evidence, practise paraphrasing without plagiarism, evaluate source credibility and write a concise synthesis. Ask me to attempt each step before giving feedback.'}
];

export default function AIStudyCoach({user,priorMarks,progress,onPractice}:any){
 const [selected,setSelected]=useState(0);
 const [task,setTask]=useState(0);
 const [extra,setExtra]=useState('');
 const [copied,setCopied]=useState(false);
 const [target,setTarget]=useState('120');
 const [minutes,setMinutes]=useState('45');
 const [level,setLevel]=useState('Upper-intermediate');
 const [showProfile,setShowProfile]=useState(false);
 const activeTask=tasks[task];
 const marks=priorMarks&&typeof priorMarks==='object'?Object.entries(priorMarks).filter(([k,v]:any)=>!String(k).startsWith('_')&&Number.isFinite(Number(v))):[];
 const progressEntries=progress&&typeof progress==='object'?Object.entries(progress).filter(([k,v]:any)=>!String(k).startsWith('_')&&Number.isFinite(Number(v))):[];
 const profile=marks.length?marks.map(([k,v])=>k+': '+v+'/160').join(', '):'No baseline score has been entered yet.';
 const progressSummary=progressEntries.length?progressEntries.slice(0,8).map(([k,v])=>k+': '+v).join(', '):'No recorded skill progress supplied.';
 const prompt=useMemo(()=>[
 activeTask.prompt,
 'STUDENT STUDY PROFILE:',
 'English level: '+level+'. Target DET score: '+target+'/160. Available study time: '+minutes+' minutes per day.',
 'Baseline skill scores: '+profile,
 'Recorded progress context: '+progressSummary,
 'PERSONALISED COACHING RULES: Use clear international English. Explain unfamiliar terms. Be supportive but rigorous. Ask one question at a time and wait for my response. Give evidence-based feedback with examples from my own answer. Distinguish practice estimates from official DET scores. Do not invent official test rules.',
 extra.trim()?'ADDITIONAL CONTEXT FROM ME: '+extra.trim():''
 ].filter(Boolean).join('\n\n'),[activeTask,level,target,minutes,profile,progressSummary,extra]);
 const copy=async()=>{try{await navigator.clipboard.writeText(prompt);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}catch{setCopied(false);}};
 const openProvider=()=>window.open(providers[selected].url,'_blank','noopener,noreferrer');
 return <div className="page ai-coach-page">
  <div className="page-intro"><div className="eyebrow dark">ISOMO INTELLIGENCE · FREE AI LEARNING DESK</div><h1>Your AI Study Coach.</h1><p>A structured learning desk for independent practice, feedback and study planning. ISOMO prepares a personalised prompt; the external assistant you choose provides the conversation.</p></div>
  <section className="ai-free-banner"><div className="ai-free-banner-icon"><ShieldCheck size={22}/></div><div><strong>No paid AI API is used by ISOMO.</strong><p>These assistants open on their own websites. Free access, sign-in requirements, availability and message limits are controlled by each provider and can change. ISOMO does not require an AI subscription or API key.</p></div></section>
  <div className="ai-study-profile">
   <div className="ai-study-profile-head"><div><div className="eyebrow dark">YOUR STUDY SETTINGS</div><h3><Target size={17}/> Personalise every session</h3></div><button type="button" className="text-button" onClick={()=>setShowProfile(!showProfile)}>{showProfile?'Hide score context':'View score context'}</button></div>
   <div className="ai-profile-fields">
    <label>Current English level<select value={level} onChange={e=>setLevel(e.target.value)}><option>Beginner</option><option>Elementary</option><option>Intermediate</option><option>Upper-intermediate</option><option>Advanced</option></select></label>
    <label>Target DET score<select value={target} onChange={e=>setTarget(e.target.value)}>{['85','95','105','115','120','125','130','135','140','145','150','155','160'].map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Daily study time<select value={minutes} onChange={e=>setMinutes(e.target.value)}>{['15','30','45','60','90','120'].map(x=><option key={x} value={x}>{x} minutes</option>)}</select></label>
   </div>
   {showProfile&&<div className="ai-score-context"><strong>Baseline scores</strong><p>{profile}</p><strong>Progress context</strong><p>{progressSummary}</p><small>Only available data is added to the prompt. Check the generated prompt before sharing it with an external service.</small></div>}
  </section>
  <div className="ai-free-layout">
   <section className="panel ai-free-main">
    <div className="panel-head"><div><div className="eyebrow dark">CHOOSE YOUR ASSISTANT</div><h3><Bot size={18}/> Free AI assistants</h3></div><span className="ai-free-pill">External tools · Free tiers</span></div>
    <div className="ai-provider-grid">{providers.map((p,i)=><button type="button" key={p.name} className={'ai-provider-card '+(selected===i?'selected':'')} onClick={()=>setSelected(i)}><span className="ai-provider-symbol">{p.icon}</span><span className="ai-provider-copy"><strong>{p.name}</strong><small>{p.tag}</small><span>{p.detail}</span></span>{selected===i&&<Check size={16} className="ai-provider-check"/>}</button>)}</div>
    <div className="ai-provider-action"><div><strong>{providers[selected].name} selected</strong><p>Copy your personalised task prompt, then open this assistant and paste it into the chat.</p></div><button className="btn primary" onClick={openProvider}>Open {providers[selected].name} <ExternalLink size={15}/></button></div>
   </section>
   <aside className="panel ai-edge-panel"><div className="eyebrow dark">MICROSOFT EDGE SUPPORT</div><h3><Volume2 size={18}/> Read aloud and listen</h3><p>Microsoft Edge includes a built-in Read Aloud feature. Open a lesson or passage in Edge, then select <strong>Read aloud</strong> from the browser menu or right-click menu where available.</p><small className="ai-edge-readaloud-note">Use Read Aloud to hear passages, practise listening for key ideas and compare your pronunciation with natural speech.</small><div className="ai-edge-tip"><strong>Also try Copilot in Edge</strong><span>Ask Copilot to explain a webpage, define vocabulary or create follow-up comprehension questions. Availability depends on your browser, device and region.</span><a href="https://copilot.microsoft.com/" target="_blank" rel="noreferrer">Open Copilot <ExternalLink size={12}/></a></div></aside>
  </div>
  <section className="panel ai-prompt-panel">
   <div className="panel-head"><div><div className="eyebrow dark">ISOMO PROMPT LIBRARY · 12 GUIDED WORKFLOWS</div><h3><Sparkles size={18}/> Start a focused learning session</h3></div><span className="ai-free-pill"><Clock3 size={12}/> {minutes} min/day</span></div>
   <p className="ai-prompt-intro">Choose a detailed coach workflow. The prompt includes your selected level, target score, daily study time and any baseline or progress data available to the app.</p>
   <div className="ai-task-grid">{tasks.map((t,i)=>{const Icon=t.icon;return <button type="button" key={t.label} className={'ai-task-button '+(task===i?'selected':'')} onClick={()=>setTask(i)}><Icon size={17}/><span>{t.label}</span>{task===i&&<Check size={14}/>}</button>})}</div>
   <label className="ai-prompt-label" htmlFor="ai-extra-context">Add your challenge, question or practice response (optional)</label>
   <textarea id="ai-extra-context" className="ai-prompt-textarea" rows={4} value={extra} onChange={e=>setExtra(e.target.value)} placeholder="Example: I can speak fluently, but I struggle to develop examples and use varied sentence structures."/>
   <div className="ai-prompt-preview"><div className="eyebrow dark">PERSONALISED PROMPT PREVIEW</div><p>{prompt}</p></div>
   <div className="ai-prompt-actions"><button type="button" className="btn outline" onClick={copy}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'Copied':'Copy full prompt'}</button><button type="button" className="btn primary" onClick={()=>{copy();openProvider();}}>Copy and open {providers[selected].name} <ExternalLink size={15}/></button></div>
   <p className="ai-coach-disclaimer">AI responses can be inaccurate. Verify test rules using official DET materials. Do not paste passwords, private student records or sensitive personal information into external AI tools. Remove any personal details from your answer before sharing it.</p>
  </section>
  <section className="panel ai-local-practice"><div className="eyebrow dark">PRACTISE INSIDE ISOMO</div><h3>Keep learning without an AI account</h3><p>Use ISOMO's own practice, vocabulary notebook, timed mock tests, browser speech tools and progress tracking. These activities do not require a paid AI service.</p><div className="ai-quick-links"><button onClick={()=>onPractice('Speaking')}><Mic size={15}/> Speaking practice</button><button onClick={()=>onPractice('Writing')}><PenLine size={15}/> Writing practice</button><button onClick={()=>onPractice('Reading')}><BookOpen size={15}/> Reading practice</button><button onClick={()=>onPractice('Listening')}><Headphones size={15}/> Listening practice</button></div></section>
 </div>;
}
