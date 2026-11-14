import {useMemo,useState} from 'react';
import {Bot,ExternalLink,Copy,Check,BookOpen,Mic,PenLine,Headphones,Volume2,Sparkles,ShieldCheck,Globe,GraduationCap} from 'lucide-react';

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
 {label:'Speaking coach',icon:Mic,prompt:'Act as my Duolingo English Test speaking coach. Give me one realistic practice prompt. Wait for my answer. Then assess relevance, development, organisation, grammar, vocabulary and fluency. Give specific corrections, a stronger example answer, and one short drill. Do not claim to predict my official DET score.'},
 {label:'Writing reviewer',icon:PenLine,prompt:'Act as my academic English and DET writing tutor. Ask me to write a response to one realistic practice prompt. After I submit it, give criterion-based feedback on task fulfilment, coherence, grammar, vocabulary, sentence variety and mechanics. Quote my errors, explain corrections, and give a revised example while preserving my ideas. Do not write the response before I try.'},
 {label:'Reading tutor',icon:BookOpen,prompt:'Act as my advanced English reading tutor for DET preparation. Give me a short challenging passage and five questions testing main idea, detail, inference, vocabulary in context and writer purpose. Ask one question at a time, wait for my answer, explain mistakes and gradually increase difficulty.'},
 {label:'Listening tutor',icon:Headphones,prompt:'Act as my DET listening tutor. Create a short natural spoken-English listening exercise that I can use with text-to-speech or read-aloud. Ask comprehension questions one at a time. Test key details, inference, speaker purpose and note-taking. Explain my mistakes after I answer.'},
 {label:'Vocabulary builder',icon:Sparkles,prompt:'Be my advanced English vocabulary coach. Teach me five useful academic words with simple definitions, collocations and natural example sentences. Then quiz me one item at a time, correct my answers and schedule a short spaced-revision review.'},
 {label:'7-day study plan',icon:GraduationCap,prompt:'Create a realistic seven-day Duolingo English Test preparation plan for me. Balance reading, listening, writing and speaking. Include daily 30–60 minute sessions, exact activities, timed practice, reflection and one progress checkpoint. Start with a diagnostic if you do not have evidence about my level. Keep all activities free.'}
];

export default function AIStudyCoach({user,priorMarks,progress,onPractice}:any){
 const [selected,setSelected]=useState(0);
 const [task,setTask]=useState(0);
 const [extra,setExtra]=useState('');
 const [copied,setCopied]=useState(false);
 const [showPrivacy,setShowPrivacy]=useState(false);
 const activeTask=tasks[task];
 const prompt=useMemo(()=>activeTask.prompt+(extra.trim()?'\n\nMy question or context: '+extra.trim():''),[activeTask,extra]);
 const copy=async()=>{try{await navigator.clipboard.writeText(prompt);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}catch{setCopied(false);}};
 const openProvider=()=>window.open(providers[selected].url,'_blank','noopener,noreferrer');
 return <div className="page ai-coach-page">
  <div className="page-intro"><div className="eyebrow dark">ISOMO INTELLIGENCE · FREE AI LEARNING DESK</div><h1>Your AI Study Coach.</h1><p>Use established AI assistants on their free plans. ISOMO prepares expert DET-learning prompts; the selected assistant provides the conversation.</p></div>
  <section className="ai-free-banner"><div className="ai-free-banner-icon"><ShieldCheck size={22}/></div><div><strong>No paid AI API is used by ISOMO.</strong><p>These tools are opened on their own websites. Their free plans may have usage limits, and each provider controls its own terms and availability. You do not need to buy a subscription to use this ISOMO section.</p></div></section>
  <div className="ai-free-layout">
   <section className="panel ai-free-main">
    <div className="panel-head"><div><div className="eyebrow dark">CHOOSE YOUR ASSISTANT</div><h3><Bot size={18}/> Free AI assistants</h3></div><span className="ai-free-pill">External tools · Free tiers</span></div>
    <div className="ai-provider-grid">{providers.map((p,i)=><button type="button" key={p.name} className={'ai-provider-card '+(selected===i?'selected':'')} onClick={()=>setSelected(i)}><span className="ai-provider-symbol">{p.icon}</span><span className="ai-provider-copy"><strong>{p.name}</strong><small>{p.tag}</small><span>{p.detail}</span></span>{selected===i&&<Check size={16} className="ai-provider-check"/>}</button>)}</div>
    <div className="ai-provider-action"><div><strong>{providers[selected].name} selected</strong><p>Copy a learning prompt below, then open this assistant and paste it into the chat.</p></div><button className="btn primary" onClick={openProvider}>Open {providers[selected].name} <ExternalLink size={15}/></button></div>
   </section>
   <aside className="panel ai-edge-panel"><div className="eyebrow dark">MICROSOFT EDGE SUPPORT</div><h3><Volume2 size={18}/> Read aloud and listen</h3><p>Microsoft Edge includes a built-in Read Aloud feature. Open a lesson or passage in Edge, then select <strong>Read aloud</strong> from the browser menu or right-click menu where available.</p><a href="https://support.microsoft.com/en-us/microsoft-edge/listen-to-your-word-documents-with-read-aloud-9a5d5b2a-7d3d-4c61-9b6a-1b2b7e3c8d3a" target="_blank" rel="noreferrer">Learn about Read Aloud <ExternalLink size={13}/></a><div className="ai-edge-tip"><strong>Also try Copilot in Edge</strong><span>Open Copilot in Edge for webpage explanations and study questions. Availability depends on your browser, device and region.</span><a href="https://copilot.microsoft.com/" target="_blank" rel="noreferrer">Open Copilot <ExternalLink size={12}/></a></div></aside>
  </div>
  <section className="panel ai-prompt-panel">
   <div className="panel-head"><div><div className="eyebrow dark">ISOMO PROMPT LIBRARY</div><h3><Sparkles size={18}/> Start a focused learning session</h3></div></div>
   <p className="ai-prompt-intro">Choose a coach task. ISOMO will prepare a detailed prompt for the external assistant you selected.</p>
   <div className="ai-task-grid">{tasks.map((t,i)=>{const Icon=t.icon;return <button type="button" key={t.label} className={'ai-task-button '+(task===i?'selected':'')} onClick={()=>setTask(i)}><Icon size={17}/><span>{t.label}</span>{task===i&&<Check size={14}/>}</button>})}</div>
   <label className="ai-prompt-label" htmlFor="ai-extra-context">Add your own question or practice response (optional)</label>
   <textarea id="ai-extra-context" className="ai-prompt-textarea" rows={4} value={extra} onChange={e=>setExtra(e.target.value)} placeholder="For example: I find it difficult to develop examples in speaking answers. Help me practise…"/>
   <div className="ai-prompt-preview"><div className="eyebrow dark">READY-TO-USE PROMPT</div><p>{prompt}</p></div>
   <div className="ai-prompt-actions"><button type="button" className="btn outline" onClick={copy}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'Copied':'Copy prompt'}</button><button type="button" className="btn primary" onClick={()=>{copy();openProvider();}}>Copy and open {providers[selected].name} <ExternalLink size={15}/></button></div>
   <p className="ai-coach-disclaimer">AI responses can be inaccurate. Verify DET rules using official Duolingo English Test materials. Never paste passwords, private student records or sensitive personal information into external AI tools.</p>
  </section>
  <section className="panel ai-local-practice"><div className="eyebrow dark">PRACTISE INSIDE ISOMO</div><h3>Keep learning without an AI account</h3><p>ISOMO's own question banks, skill practice, vocabulary notebook, timed mock tests, browser speech tools and progress tracking remain available without an AI subscription.</p><div className="ai-quick-links"><button onClick={()=>onPractice('Speaking')}><Mic size={15}/> Speaking practice</button><button onClick={()=>onPractice('Writing')}><PenLine size={15}/> Writing practice</button><button onClick={()=>onPractice('Reading')}><BookOpen size={15}/> Reading practice</button><button onClick={()=>onPractice('Listening')}><Headphones size={15}/> Listening practice</button></div></section>
 </div>;
}
