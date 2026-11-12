import { useEffect, useMemo, useState } from 'react';
import { api } from './lib';
import { Users, Plus, RefreshCw, Download, ShieldCheck, Activity, Target, BookOpen } from 'lucide-react';

type Props = { user: any; progress: Record<string, number>; onViewAsStudent: () => void };
const ADMIN_EMAIL = 'manasse@icircles.rw';
const cohorts = ['Cohort I','Cohort II','Cohort III','Cohort IV','Cohort V','Cohort VI','Cohort VII','Isomo Circles','IRIS'];
const label = (key: string) => key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function TeacherDashboard({ user, onViewAsStudent }: Props) {
  const [overview, setOverview] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [cohort, setCohort] = useState(cohorts[0]);
  const isAdmin = String(user?.email || '').toLowerCase() === ADMIN_EMAIL;

  const loadOverview = async () => {
    setBusy(true);
    try { const { data } = await api.get('/api/teacher/overview'); setOverview(data); }
    catch { setMessage('Teacher analytics could not be loaded. Confirm that you are signed in with the authorised teacher account.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (isAdmin) loadOverview(); }, [user?.userId, isAdmin]);

  const assignMaterial = async () => {
    if (!title.trim() || !/^https:\/\//i.test(url.trim())) { setMessage('Enter a material title and a valid HTTPS link.'); return; }
    setBusy(true); setMessage('');
    try {
      await api.post('/api/assignments', { title: title.trim(), url: url.trim(), description: description.trim(), cohort });
      setTitle(''); setUrl(''); setDescription('');
      setMessage('Material assigned to ' + cohort + '. Students in that cohort will see it in their learning library.');
    } catch { setMessage('The material could not be assigned. Check the link and try again.'); }
    finally { setBusy(false); }
  };
  const downloadReport = () => {
    if (!overview) return;
    const rows = [['Student','Cohort','Practice average','Practice activities','Growth','Support needs','Baseline','Midline','Endline']];
    overview.students.forEach((s: any) => {
      const scores = Object.fromEntries((s.assessments || []).map((a: any) => [a.stage, a.overall]));
      rows.push([s.name, s.cohort || '', s.average, s.practiceCount, s.growth ?? 'Not yet available', (s.supportNeeds || []).map((x: any) => label(x.skill) + ': ' + x.score).join('; '), scores.baseline ?? '', scores.midline ?? '', scores.endline ?? '']);
    });
    const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const objectUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = objectUrl; a.download = 'isomo-student-progress-report.csv'; a.click(); URL.revokeObjectURL(objectUrl);
  };
  const summary = useMemo(() => {
    const students = overview?.students || [];
    return { students: students.length, active: students.filter((s: any) => s.practiceCount > 0).length, support: students.filter((s: any) => (s.supportNeeds || []).length > 0).length, assessments: overview?.assessments?.length || 0 };
  }, [overview]);

  if (!isAdmin) return <div className="page narrow"><div className="panel teacher-panel"><h2>Teacher access is restricted</h2><p>This management portal is available only to the authorised ISOMO teacher account.</p></div></div>;
  return <div className="page">
    <div className="page-intro"><div className="eyebrow dark">RESTRICTED · TEACHER MANAGEMENT</div><h1>ISOMO management portal.</h1><p>Manage cohorts, monitor student growth, identify support needs and assign learning materials. This account is for teaching and administration—not student tests or lessons.</p><button className="btn primary" onClick={onViewAsStudent}>View as a student <Users size={15}/></button><p className="score-disclaimer">Opens a read-only preview of the learner experience. It does not switch your account role or let you submit student tests.</p></div>
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-icon teal"><Users/></div><div className="stat-label">Student accounts with records</div><div className="stat-value">{summary.students}</div></div>
      <div className="stat-card"><div className="stat-icon gold"><Activity/></div><div className="stat-label">Recorded app activities</div><div className="stat-value">{overview?.activityCount || 0}</div></div>
      <div className="stat-card"><div className="stat-icon purple"><Target/></div><div className="stat-label">Assessment submissions</div><div className="stat-value">{summary.assessments}</div></div>
    </div>
    {message && <div className="note-box">{message}</div>}
    <div className="panel teacher-panel"><div className="panel-head"><div><div className="eyebrow dark">WHOLE-APP OVERSIGHT</div><h3>Student growth and support tracker</h3></div><div><button className="btn outline" onClick={loadOverview} disabled={busy}><RefreshCw size={14}/> Refresh</button> <button className="btn primary" onClick={downloadReport} disabled={!overview}><Download size={14}/> Export report</button></div></div>
      <p className="score-disclaimer"><ShieldCheck size={14}/> Teacher-only view. Student records are retrieved through server-side administrator permission checks.</p>
      {overview?.students?.length ? <div className="class-list">{overview.students.map((s: any) => <div className="class-row" key={s.userId}><div style={{flex:1,minWidth:0}}><strong>{s.name || 'Student'} · {s.cohort || 'Cohort not selected'}</strong><span>Practice average: {s.average}% · Activities: {s.practiceCount} · {s.assessments?.length || 0} milestone tests</span><div className="mini-track"><span style={{width:s.average+'%'}}/></div><div className="support-chips">{(s.supportNeeds || []).length ? s.supportNeeds.map((x: any) => <span key={x.skill}>{label(x.skill)} · {x.score}%</span>) : <span>No low-scoring skill flagged yet</span>}</div></div><div style={{textAlign:'right'}}><strong>{s.growth === null ? '—' : (s.growth > 0 ? '+' : '') + s.growth}</strong><span>Growth pts</span><button className="btn outline" onClick={() => setSelected(selected?.userId === s.userId ? null : s)}>{selected?.userId === s.userId ? 'Close' : 'Details'}</button></div></div>)}</div> : <p>{busy ? 'Loading student records…' : 'No student activity has been recorded yet.'}</p>}
      {selected && <div className="note-box"><strong>{selected.name} · individual support plan</strong><p>Cohort: {selected.cohort || 'Not selected'}</p><p>Skill scores: {Object.entries(selected.skills || {}).map(([k,v]) => label(k)+': '+v+'%').join(' · ') || 'No skill practice scores yet'}</p><p>Priority support: {(selected.supportNeeds || []).map((x: any) => label(x.skill)+' ('+x.score+'%)').join(', ') || 'Continue monitoring progress.'}</p><p>Assessment growth: {selected.assessments?.map((a: any) => a.stage+': '+a.overall+'/160').join(' → ') || 'Complete the baseline assessment first.'}</p><p>Suggested action: assign a focused video or reading, add a guided practice task, then compare the learner's next scored attempt.</p></div>}
    </div>
    <div className="panel teacher-panel"><div className="panel-head"><div><div className="eyebrow dark">LIVE ACTIVITY FEED</div><h3>Recent app activity</h3></div><span className="estimate-pill">{overview?.activities?.length || 0} EVENTS</span></div>{overview?.activities?.length ? <div className="class-list">{overview.activities.slice(0,30).map((a: any) => <div className="class-row" key={a.id}><div><strong>{a.name || 'Student'} · {label(a.activityType)}</strong><span>{label(a.skill || a.details || 'App activity')} {a.score !== null && a.score !== undefined ? '· '+a.score+'%' : ''}</span></div><span>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</span></div>)}</div> : <p>No activity events yet.</p>}</div>
    <div className="panel teacher-panel"><div className="panel-head"><div><div className="eyebrow dark">ASSESSMENT REPORTS</div><h3>Baseline · Midline · Endline</h3></div></div>{overview?.assessments?.length ? <div className="class-list">{overview.assessments.slice(0,50).map((a: any) => <div className="class-row" key={a.id}><div><strong>{a.name} · {label(a.stage)}</strong><span>Overall {a.overall}/160 · R {a.reading} · L {a.listening} · W {a.writing} · S {a.speaking}</span><span>{(a.recommendations || []).join(' · ')}</span></div><span>{new Date(a.createdAt).toLocaleDateString()}</span></div>)}</div> : <p>Milestone reports will appear as students complete each assessment.</p>}</div>
    <div className="panel teacher-panel"><div className="eyebrow dark">TEACHING RESOURCES</div><h2><BookOpen size={20}/> Assign additional materials</h2><p>Publish a reading, listening task, video lesson or other HTTPS resource to one cohort. Students see only materials assigned to their selected cohort.</p><div className="teacher-grid"><input className="teacher-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Material title"/><select className="teacher-input" value={cohort} onChange={e=>setCohort(e.target.value)}>{cohorts.map(x=><option key={x}>{x}</option>)}</select><input className="teacher-input" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https:// resource link"/><input className="teacher-input" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What should students learn or do?"/></div><button className="btn primary" disabled={busy || !title.trim() || !url.trim()} onClick={assignMaterial}><Plus size={15}/> Assign material</button></div>
  </div>;
}
