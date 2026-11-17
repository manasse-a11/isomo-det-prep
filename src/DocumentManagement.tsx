import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import './dms.css';
import { supabase } from './lib';
import { Archive, CalendarClock, FilePlus2, FileText, Link2, RefreshCw, Search, Trash2, ClipboardList, CheckCircle2 } from 'lucide-react';

type Doc = {
  id: string; document_code: string; title: string; document_type: string;
  department: string | null; owner_name: string | null; version: string;
  status: string; confidentiality: string; storage_url: string | null;
  review_date: string | null; last_reviewed: string | null; notes: string | null;
  updated_at: string;
};
type Task = {
  id: string; task_code: string; document_id: string | null; document_title: string | null;
  action_required: string; assigned_to: string | null; due_date: string | null;
  priority: string; progress: string; comments: string | null;
};

const inputClass = 'teacher-input';
const docStatuses = ['Draft','Received','In Review','Pending Approval','Approved','Published','Archived','Expired'];
const taskStatuses = ['Not Started','In Progress','Waiting','Completed','On Hold'];

export default function DocumentManagement() {
  const [tab, setTab] = useState<'documents'|'tasks'>('documents');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Doc|null>(null);
  const [showDocForm, setShowDocForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [docForm, setDocForm] = useState({title:'',document_type:'Policy',department:'',owner_name:'',version:'1.0',status:'Draft',confidentiality:'Internal',storage_url:'',review_date:'',notes:''});
  const [taskForm, setTaskForm] = useState({document_id:'',document_title:'',action_required:'Review document',assigned_to:'',due_date:'',priority:'Normal',progress:'Not Started',comments:''});

  const load = useCallback(async () => {
    const [d,t] = await Promise.all([
      supabase.from('isomo_documents').select('*').order('updated_at',{ascending:false}),
      supabase.from('isomo_document_tasks').select('*').order('created_at',{ascending:false})
    ]);
    if (d.error) throw d.error;
    if (t.error) throw t.error;
    setDocs((d.data||[]) as Doc[]);
    setTasks((t.data||[]) as Task[]);
  },[]);

  useEffect(() => {
    let alive = true;
    const initial = async () => {
      try { await load(); } catch (e:any) { if (alive) setMessage(e?.message || 'Could not load the document register.'); }
    };
    initial();
    const channel = supabase.channel('isomo-dms-live')
      .on('postgres_changes',{event:'*',schema:'public',table:'isomo_documents'},()=>{ if(alive) load().catch(()=>{}); })
      .on('postgres_changes',{event:'*',schema:'public',table:'isomo_document_tasks'},()=>{ if(alive) load().catch(()=>{}); })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  },[load]);

  const visibleDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter(d => !q || [d.document_code,d.title,d.document_type,d.department,d.owner_name,d.status].some(v=>String(v||'').toLowerCase().includes(q)));
  },[docs,search]);

  const openNewDoc = () => {
    setEditing(null);
    setDocForm({title:'',document_type:'Policy',department:'',owner_name:'',version:'1.0',status:'Draft',confidentiality:'Internal',storage_url:'',review_date:'',notes:''});
    setShowDocForm(true);
  };
  const saveDoc = async (e:FormEvent) => {
    e.preventDefault();
    if (!docForm.title.trim()) { setMessage('Enter a document title.'); return; }
    if (docForm.storage_url && !/^https:\/\//i.test(docForm.storage_url)) { setMessage('Storage link must begin with https://'); return; }
    setBusy(true); setMessage('');
    const payload = {...docForm,title:docForm.title.trim(),document_code:editing?.document_code || 'ISOMO-DOC-'+Date.now().toString(36).toUpperCase(),review_date:docForm.review_date || null};
    const result = editing
      ? await supabase.from('isomo_documents').update(payload).eq('id',editing.id)
      : await supabase.from('isomo_documents').insert(payload);
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    setShowDocForm(false); setEditing(null); setMessage(editing ? 'Document updated.' : 'Document registered.');
    await load();
  };
  const editDoc = (d:Doc) => {
    setEditing(d);
    setDocForm({title:d.title,document_type:d.document_type,department:d.department||'',owner_name:d.owner_name||'',version:d.version,status:d.status,confidentiality:d.confidentiality,storage_url:d.storage_url||'',review_date:d.review_date||'',notes:d.notes||''});
    setShowDocForm(true);
  };
  const deleteDoc = async (d:Doc) => {
    if (!window.confirm('Delete '+d.title+' from the register?')) return;
    const {error} = await supabase.from('isomo_documents').delete().eq('id',d.id);
    setMessage(error?.message || 'Document record deleted.');
    if (!error) await load();
  };
  const saveTask = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.action_required.trim()) { setMessage('Enter the action required.'); return; }
    setBusy(true);
    const selected = docs.find(d=>d.id===taskForm.document_id);
    const {error} = await supabase.from('isomo_document_tasks').insert({
      ...taskForm, task_code:'ISOMO-TASK-'+Date.now().toString(36).toUpperCase(),
      document_id:taskForm.document_id || null,
      document_title:selected?.title || taskForm.document_title || null,
      due_date:taskForm.due_date || null
    });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setShowTaskForm(false);
    setTaskForm({document_id:'',document_title:'',action_required:'Review document',assigned_to:'',due_date:'',priority:'Normal',progress:'Not Started',comments:''});
    setMessage('Task created.');
    await load();
  };
  const updateTask = async (task:Task, progress:string) => {
    const {error} = await supabase.from('isomo_document_tasks').update({progress}).eq('id',task.id);
    setMessage(error?.message || 'Task status updated.');
    if (!error) await load();
  };
  const deleteTask = async (task:Task) => {
    if (!window.confirm('Delete this task?')) return;
    const {error} = await supabase.from('isomo_document_tasks').delete().eq('id',task.id);
    setMessage(error?.message || 'Task deleted.');
    if (!error) await load();
  };
  const exportCsv = () => {
    const rows = [['Document ID','Title','Type','Department','Owner','Version','Status','Confidentiality','Storage Link','Review Date','Notes'],...docs.map(d=>[d.document_code,d.title,d.document_type,d.department||'',d.owner_name||'',d.version,d.status,d.confidentiality,d.storage_url||'',d.review_date||'',d.notes||''])];
    const csv = rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a'); a.href=url; a.download='isomo-document-register.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const overdue = tasks.filter(t=>t.due_date && t.due_date < new Date().toISOString().slice(0,10) && t.progress!=='Completed').length;
  return <section className="panel teacher-panel isomo-dms">
    <div className="panel-head"><div><div className="eyebrow dark">TEACHER-ONLY · LIVE WORKSPACE</div><h2><Archive size={21}/> Document Management System</h2><p>Register, locate, review and track ISOMO documents. Changes sync live for authorised teachers.</p></div><button className="btn outline" onClick={()=>load().then(()=>setMessage('Register refreshed.')).catch((e:any)=>setMessage(e.message))}><RefreshCw size={14}/> Refresh</button></div>
    <div className="stats-grid dms-stats">
      <div className="stat-card"><div className="stat-icon teal"><FileText/></div><div className="stat-label">Documents</div><div className="stat-value">{docs.length}</div></div>
      <div className="stat-card"><div className="stat-icon gold"><CalendarClock/></div><div className="stat-label">Awaiting review</div><div className="stat-value">{docs.filter(d=>['In Review','Pending Approval'].includes(d.status)).length}</div></div>
      <div className="stat-card"><div className="stat-icon purple"><ClipboardList/></div><div className="stat-label">Open tasks</div><div className="stat-value">{tasks.filter(t=>t.progress!=='Completed').length}</div></div>
      <div className="stat-card"><div className="stat-icon gold"><CalendarClock/></div><div className="stat-label">Overdue tasks</div><div className="stat-value">{overdue}</div></div>
    </div>
    <div className="dms-toolbar">
      <div className="dms-tabs"><button className={'btn '+(tab==='documents'?'primary':'outline')} onClick={()=>setTab('documents')}><FileText size={15}/> Document register</button><button className={'btn '+(tab==='tasks'?'primary':'outline')} onClick={()=>setTab('tasks')}><ClipboardList size={15}/> Task tracker</button></div>
      {tab==='documents' ? <div className="dms-actions"><label className="dms-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents"/></label><button className="btn outline" onClick={exportCsv}>Export CSV</button><button className="btn primary" onClick={openNewDoc}><FilePlus2 size={15}/> Add document</button></div> : <button className="btn primary" onClick={()=>setShowTaskForm(true)}><FilePlus2 size={15}/> Add task</button>}
    </div>
    {message && <div className="note-box" role="status">{message}</div>}
    {showDocForm && <form className="panel dms-form" onSubmit={saveDoc}>
      <h3>{editing?'Edit document':'Register a document'}</h3>
      <div className="teacher-grid">
        <input className={inputClass} required placeholder="Document title" value={docForm.title} onChange={e=>setDocForm(p=>({...p,title:e.target.value}))}/>
        <select className={inputClass} value={docForm.document_type} onChange={e=>setDocForm(p=>({...p,document_type:e.target.value}))}>{['Policy','Form','Report','Agreement','Certificate','Invoice','Letter','Minutes','Procedure','Other'].map(v=><option key={v}>{v}</option>)}</select>
        <input className={inputClass} placeholder="Department / owner" value={docForm.department} onChange={e=>setDocForm(p=>({...p,department:e.target.value}))}/>
        <input className={inputClass} placeholder="Responsible person" value={docForm.owner_name} onChange={e=>setDocForm(p=>({...p,owner_name:e.target.value}))}/>
        <input className={inputClass} placeholder="Version (e.g. 1.0)" value={docForm.version} onChange={e=>setDocForm(p=>({...p,version:e.target.value}))}/>
        <select className={inputClass} value={docForm.status} onChange={e=>setDocForm(p=>({...p,status:e.target.value}))}>{docStatuses.map(v=><option key={v}>{v}</option>)}</select>
        <select className={inputClass} value={docForm.confidentiality} onChange={e=>setDocForm(p=>({...p,confidentiality:e.target.value}))}>{['Public','Internal','Confidential','Restricted'].map(v=><option key={v}>{v}</option>)}</select>
        <input className={inputClass} type="date" value={docForm.review_date} onChange={e=>setDocForm(p=>({...p,review_date:e.target.value}))}/>
        <input className={inputClass} type="url" placeholder="Google Drive / secure file URL (https://)" value={docForm.storage_url} onChange={e=>setDocForm(p=>({...p,storage_url:e.target.value}))}/>
        <textarea className={inputClass} rows={2} placeholder="Notes" value={docForm.notes} onChange={e=>setDocForm(p=>({...p,notes:e.target.value}))}/>
      </div>
      <div className="access-actions"><button className="btn primary" disabled={busy}>{busy?'Saving…':'Save document'}</button><button type="button" className="btn outline" onClick={()=>setShowDocForm(false)}>Cancel</button></div>
    </form>}
    {showTaskForm && <form className="panel dms-form" onSubmit={saveTask}>
      <h3>Create a document task</h3>
      <div className="teacher-grid">
        <select className={inputClass} value={taskForm.document_id} onChange={e=>setTaskForm(p=>({...p,document_id:e.target.value}))}><option value="">No linked document</option>{docs.map(d=><option key={d.id} value={d.id}>{d.document_code} · {d.title}</option>)}</select>
        <input className={inputClass} required placeholder="Action required" value={taskForm.action_required} onChange={e=>setTaskForm(p=>({...p,action_required:e.target.value}))}/>
        <input className={inputClass} placeholder="Assign to" value={taskForm.assigned_to} onChange={e=>setTaskForm(p=>({...p,assigned_to:e.target.value}))}/>
        <input className={inputClass} type="date" value={taskForm.due_date} onChange={e=>setTaskForm(p=>({...p,due_date:e.target.value}))}/>
        <select className={inputClass} value={taskForm.priority} onChange={e=>setTaskForm(p=>({...p,priority:e.target.value}))}>{['Low','Normal','High','Urgent'].map(v=><option key={v}>{v}</option>)}</select>
        <textarea className={inputClass} rows={2} placeholder="Comments / next step" value={taskForm.comments} onChange={e=>setTaskForm(p=>({...p,comments:e.target.value}))}/>
      </div>
      <div className="access-actions"><button className="btn primary" disabled={busy}>{busy?'Saving…':'Create task'}</button><button type="button" className="btn outline" onClick={()=>setShowTaskForm(false)}>Cancel</button></div>
    </form>}
    {tab==='documents' ? <div className="dms-table-wrap"><table className="dms-table"><thead><tr><th>Document</th><th>Type / Owner</th><th>Status</th><th>Confidentiality</th><th>Review date</th><th>File</th><th>Actions</th></tr></thead><tbody>
      {visibleDocs.map(d=><tr key={d.id}><td><strong>{d.title}</strong><small>{d.document_code} · v{d.version}</small></td><td>{d.document_type}<small>{d.department||d.owner_name||'—'}</small></td><td><span className={'dms-status '+d.status.toLowerCase().replace(/\s/g,'-')}>{d.status}</span></td><td>{d.confidentiality}</td><td>{d.review_date||'—'}</td><td>{d.storage_url?<a href={d.storage_url} target="_blank" rel="noreferrer"><Link2 size={14}/> Open</a>:'—'}</td><td><div className="dms-row-actions"><button className="btn outline" onClick={()=>editDoc(d)}>Edit</button><button className="btn outline" aria-label={'Delete '+d.title} onClick={()=>deleteDoc(d)}><Trash2 size={14}/></button></div></td></tr>)}
      {!visibleDocs.length && <tr><td colSpan={7} className="dms-empty">No documents found. Add your first document record.</td></tr>}
    </tbody></table></div> : <div className="dms-table-wrap"><table className="dms-table"><thead><tr><th>Task</th><th>Document</th><th>Assigned to</th><th>Due</th><th>Priority</th><th>Progress</th><th>Action</th></tr></thead><tbody>
      {tasks.map(t=><tr key={t.id}><td><strong>{t.action_required}</strong><small>{t.task_code}</small></td><td>{t.document_title||'—'}</td><td>{t.assigned_to||'—'}</td><td>{t.due_date||'—'}</td><td>{t.priority}</td><td><select className={inputClass} value={t.progress} onChange={e=>updateTask(t,e.target.value)}>{taskStatuses.map(v=><option key={v}>{v}</option>)}</select></td><td><button className="btn outline" onClick={()=>deleteTask(t)} aria-label="Delete task"><Trash2 size={14}/></button></td></tr>)}
      {!tasks.length && <tr><td colSpan={7} className="dms-empty">No tasks yet. Add a task to track document work.</td></tr>}
    </tbody></table></div>}
    <p className="score-disclaimer"><CheckCircle2 size={14}/> Access is enforced by Supabase Row Level Security: only approved teacher and administrator accounts can read or change these records. Documents remain in their secured Drive or file location; this register stores metadata and links.</p>
  </section>;
}
