import { useCallback, useEffect, useState } from 'react';
import { api } from './lib';
import { Send, RefreshCw, ExternalLink, MessageCircle } from 'lucide-react';

const cohorts = ['Cohort I','Cohort II','Cohort III','Cohort IV','Cohort V','Cohort VI','Cohort VII','Isomo Circles','IRIS'];

export default function CohortChat({ user, isAdmin }: { user:any; isAdmin:boolean }) {
  const [cohort,setCohort] = useState(String(user?.cohort || ''));
  const [messages,setMessages] = useState<any[]>([]);
  const [draft,setDraft] = useState('');
  const [googleUrl,setGoogleUrl] = useState<string|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const load = useCallback(async () => {
    try {
      const suffix = isAdmin && cohort ? '?cohort='+encodeURIComponent(cohort) : '';
      const {data} = await api.get('/api/chat/messages'+suffix);
      setMessages(data.messages || []);
      setGoogleUrl(data.googleChatUrl || null);
      if (data.cohort && !cohort) setCohort(data.cohort);
      setError('');
    } catch(e:any) { setError(e?.message || 'Chat could not be loaded.'); }
  },[cohort,isAdmin]);
  useEffect(() => { load(); const timer=window.setInterval(load,6000); return () => window.clearInterval(timer); },[load]);
  const send = async (event:any) => {
    event.preventDefault();
    if(!draft.trim() || busy) return;
    setBusy(true); setError('');
    try {
      await api.post('/api/chat/messages',{message:draft.trim(),...(isAdmin?{cohort}:{})});
      setDraft('');
      await load();
    } catch(e:any) { setError(e?.message || 'Message could not be sent.'); }
    finally { setBusy(false); }
  };
  return <section className="page">
    <div className="panel teacher-panel" style={{maxWidth:900,margin:'0 auto'}}>
      <div className="eyebrow dark"><MessageCircle size={15}/> COHORT COMMUNITY</div>
      <h2>ISOMO Cohort Chat</h2>
      <p>Discuss lessons, share ideas and ask questions with members of your assigned cohort. Messages refresh automatically.</p>
      {isAdmin && <label style={{display:'block',margin:'12px 0'}}>View cohort <select className="teacher-input" value={cohort} onChange={e=>setCohort(e.target.value)}><option value="">Choose a cohort</option>{cohorts.map(c=><option key={c}>{c}</option>)}</select></label>}
      {googleUrl && <p><a className="btn outline" href={googleUrl} target="_blank" rel="noreferrer">Open the same cohort in Google Chat <ExternalLink size={15}/></a></p>}
      {cohort && <div className="eyebrow dark">{cohort.toUpperCase()}</div>}
      <div style={{height:380,overflowY:'auto',border:'1px solid var(--line, #dce3e8)',borderRadius:12,padding:14,margin:'14px 0',background:'var(--surface, #fff)'}} aria-live="polite">
        {!messages.length && <p className="score-disclaimer">No messages yet. Start the conversation.</p>}
        {messages.map(m=><div key={m.id} style={{marginBottom:14,maxWidth:'88%'}}>
          <strong style={{fontSize:13}}>{m.sender_name || 'Scholar'}</strong>
          <div style={{padding:'9px 12px',borderRadius:12,background:'var(--panel, #f1f5f7)',whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{m.message}</div>
          <small style={{color:'var(--muted, #687780)'}}>{new Date(m.created_at).toLocaleString()}</small>
        </div>)}
      </div>
      <form onSubmit={send} style={{display:'flex',gap:8}}>
        <input className="teacher-input" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={2000} placeholder="Write a message to your cohort…" aria-label="Message" />
        <button className="btn primary" disabled={!draft.trim() || busy || (isAdmin && !cohort)}><Send size={16}/> Send</button>
        <button type="button" className="btn outline" onClick={load} aria-label="Refresh chat"><RefreshCw size={16}/></button>
      </form>
      {error && <p role="alert" className="score-disclaimer">{error}</p>}
      <p className="score-disclaimer">Cohort privacy is enforced by the ISOMO server. Google Chat currently opens the matching group; automatic cross-posting is not active until Google authorizes an integration.</p>
    </div>
  </section>;
}
