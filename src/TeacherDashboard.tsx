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
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [cohort, setCohort] = useState(cohorts[0]);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementCohort, setAnnouncementCohort] = useState('');
  const [cohortFilter, setCohortFilter] = useState('All cohorts');
  const isAdmin = user?.role === 'admin' || String(user?.email || '').toLowerCase() === ADMIN_EMAIL;
  const isTeacher = isAdmin || user?.role === 'teacher';

  const loadOverview = async () => {
    setBusy(true);
    try { const { data } = await api.get('/api/teacher/overview'); setOverview(data); }
    catch { setMessage('Teacher analytics could not be loaded. Confirm that you are signed in with the authorised teacher account.'); }
    finally { setBusy(false); }
  };
  const loadAccessRequests = async () => { try { const { data } = await api.get('/api/admin/access-requests'); setAccessRequests(data.requests || []); } catch { setMessage('The access approval list could not be loaded.'); } };
  const reviewAccess = async (userId: string, decision: 'approved'|'rejected') => { setBusy(true); try { await api.post('/api/admin/access-requests', { userId, decision }); setMessage('Access request ' + decision + '.'); await loadAccessRequests(); } catch (error:any) { setMessage(error?.message || 'The access request could not be updated.'); } finally { setBusy(false); } };
  useEffect(() => { if (isTeacher) loadOverview(); if (isAdmin) loadAccessRequests(); }, [user?.userId, isAdmin, isTeacher]);

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
  const publishAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) { setMessage('Enter an announcement title and message.'); return; }
    setBusy(true);
    try { await api.post('/api/announcements', { title: announcementTitle.trim(), message: announcementMessage.trim(), cohort: announcementCohort }); setAnnouncementTitle(''); setAnnouncementMessage(''); setMessage('Announcement published successfully.'); }
    catch (error:any) { setMessage(error?.message || 'Announcement could not be published.'); }
    finally { setBusy(false); }
  };
  const downloadPdf = () => {
    if (!overview) return;
    const rows = overview.students.filter((s:any)=>cohortFilter==='All cohorts'||s.cohort===cohortFilter).map((s:any)=>'<tr><td>'+String(s.name||'Student').replace(/[&<>]/g,'')+'</td><td>'+String(s.cohort||'—')+'</td><td>'+s.average+'%</td><td>'+s.practiceCount+'</td><td>'+String(s.growth??'—')+'</td><td>'+String((s.supportNeeds||[]).map((x:any)=>label(x.skill)+' '+x.score+'%').join(', ')||'—')+'</td></tr>').join('');
    const w=window.open('','_blank'); if(!w){setMessage('Allow pop-ups to create the PDF report.');return;}
    w.document.write('<html><head><title>ISOMO cohort report</title><style>body{font:12px Arial;padding:28px;color:#183b3b}h1{color:#087f78}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd8d5;padding:8px;text-align:left}th{background:#e8f3ef}</style></head><body><h1>ISOMO Academy · DET Prep</h1><h2>Student performance report</h2><p>Generated '+new Date().toLocaleString()+' · '+cohortFilter+'</p><table><thead><tr><th>Student</th><th>Cohort</th><th>Average</th><th>Activities</th><th>Growth</th><th>Support needs</th></tr></thead><tbody>'+rows+'</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>'); w.document.close();
  };
  const downloadReport = () => {
    if (!overview) return;
    const rows = [['Student','Cohort','Practice average','Practice activities','Growth','Support needs','Baseline','Midline','Endline']];
    overview.students.filter((s:any)=>cohortFilter==='All cohorts'||s.cohort===cohortFilter).forEach((s: any) => {
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

  if (!isTeacher) return <div className="page narrow"><div className="panel teacher-panel"><h2>Teacher access is restricted</h2><p>This management portal is available only to approved ISOMO teachers.</p></div></div>;
  return <div className="page">
    <div className="page-intro"><div className="eyebrow dark">RESTRICTED · TEACHER MANAGEMENT</div><h1>ISOMO management portal.</h1><p>Manage cohorts, monitor student growth, identify support needs and assign learning materials. This account is for teaching and administration—not student tests or lessons.</p><button className="btn primary" onClick={onViewAsStudent}>View as a student <Users size={15}/></button><p className="score-disclaimer">Opens a read-only preview of the learner experience. It does not switch your account role or let you submit student tests.</p></div>
    {isAdmin && <section className="panel access-requests-panel"><div className="section-heading"><div><div className="eyebrow dark">ADMINISTRATOR CONTROL</div><h2>Account approval requests</h2><p>Only your administrator account can approve or reject new logins.</p></div><button className="btn outline" onClick={loadAccessRequests}><RefreshCw size={14}/> Refresh</button></div>{accessRequests.length === 0 ? <p>No account requests yet.</p> : <div className="access-request-list">{accessRequests.map((r:any)=><div className="access-request-row" key={r.user_id}><div><strong>{r.email}</strong><span>{String(r.requested_role).toUpperCase()} · {new Date(r.created_at).toLocaleString()}</span></div><span className={'access-status '+r.status}>{r.status}</span>{r.status === 'pending' && <div className="access-actions"><button className="btn primary" disabled={busy} onClick={()=>reviewAccess(r.user_id,'approved')}>Approve</button><button className="btn outline" disabled={busy} onClick={()=>reviewAccess(r.user_id,'rejected')}>Reject</button></div>}</div>)}</div>}</section>}
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-icon teal"><Users/></div><div className="stat-label">Student accounts with records</div><div className="stat-value">{summary.students}</div></div>
      <div className="stat-card"><div className="stat-icon gold"><Activity/></div><div className="stat-label">Recorded app activities</div><div className="stat-value">{overview?.activityCount || 0}</div></div>
      <div className="stat-card"><div className="stat-icon purple"><Target/></div><div className="stat-label">Assessment submissions</div><div className="stat-value">{summary.assessments}</div></div>
    </div>
    {message && <div className="note-box">{message}</div>}
    <div className="panel teacher-panel"><div className="panel-head"><div><div className="eyebrow dark">WHOLE-APP OVERSIGHT</div><h3>Student growth and support tracker</h3></div><div><button className="btn outline" onClick={loadOverview} disabled={busy}><RefreshCw size={14}/> Refresh</button> <select className="teacher-input" value={cohortFilter} onChange={e=>setCohortFilter(e.target.value)}><option>All cohorts</option>{cohorts.map(x=><option key={x}>{x}</option>)}</select> <button className="btn outline" onClick={downloadPdf} disabled={!overview}><Download size={14}/> PDF</button> <button className="btn primary" onClick={downloadReport} disabled={!overview}><Download size={14}/> Excel / CSV</button></div></div>
      <p className="score-disclaimer"><ShieldCheck size={14}/> Teacher-only view. Student records are retrieved through server-side administrator permission checks.</p>
      {overview?.students?.length ? <div className="class-list">{overview.students.map((s: any) => <div className="class-row" key={s.userId}><div style={{flex:1,minWidth:0}}><strong>{s.name || 'Student'} · {s.cohort || 'Cohort not selected'}</strong><span>Practice average: {s.average}% · Activities: {s.practiceCount} · {s.assessments?.length || 0} milestone tests</span><div className="mini-track"><span style={{width:s.average+'%'}}/></div><div className="support-chips">{(s.supportNeeds || []).length ? s.supportNeeds.map((x: any) => <span key={x.skill}>{label(x.skill)} · {x.score}%</span>) : <span>No low-scoring skill flagged yet</span>}</div></div><div style={{textAlign:'right'}}><strong>{s.growth === null ? '—' : (s.growth > 0 ? '+' : '') + s.growth}</strong><span>Growth pts</span><button className="btn outline" onClick={() => setSelected(selected?.userId === s.userId ? null : s)}>{selected?.userId === s.userId ? 'Close' : 'Details'}</button></div></div>)}</div> : <p>{busy ? 'Loading student records…' : 'No student activity has been recorded yet.'}</p>}
      {selected && <div className="note-box"><strong>{selected.name} · individual support plan</strong><p>Cohort: {selected.cohort || 'Not selected'}</p><p>Skill scores: {Object.entries(selected.skills || {}).map(([k,v]) => label(k)+': '+v+'%').join(' · ') || 'No skill practice scores yet'}</p><p>Priority support: {(selected.supportNeeds || []).map((x: any) => label(x.skill)+' ('+x.score+'%)').join(', ') || 'Continue monitoring progress.'}</p><p>Assessment growth: {selected.assessments?.map((a: any) => a.stage+': '+a.overall+'/160').join(' → ') || 'Complete the baseline assessment first.'}</p><p>Suggested action: assign a focused video or reading, add a guided practice task, then compare the learner's next scored attempt.</p></div>}
    </div>
    <div className="panel teacher-panel"><div className="panel-head"><div><div className="eyebrow dark">LIVE ACTIVITY FEED</div><h3>Recent app activity</h3></div><span className="estimate-pill">{overview?.activities?.length || 0} EVENTS</span></div>{overview?.activities?.length ? <div className="class-list">{overview.activities.slice(0,30).map((a: any) => <div className="class-row" key={a.id}><div><strong>{a.name || 'Student'} · {label(a.activityType)}</strong><span>{label(a.skill || a.details || 'App activity')} {a.score !== null && a.score !== undefined ? '· '+a.score+'%' : ''}</span></div><span>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</span></div>)}</div> : <p>No activity events yet.</p>}</div>
    <div className="panel teacher-panel"><div className="panel-head"><div><div className="eyebrow dark">ASSESSMENT REPORTS</div><h3>Baseline · Midline · Endline</h3></div></div>{overview?.assessments?.length ? <div className="class-list">{overview.assessments.slice(0,50).map((a: any) => <div className="class-row" key={a.id}><div><strong>{a.name} · {label(a.stage)}</strong><span>Overall {a.overall}/160 · R {a.reading} · L {a.listening} · W {a.writing} · S {a.speaking}</span><span>{(a.recommendations || []).join(' · ')}</span></div><span>{new Date(a.createdAt).toLocaleDateString()}</span></div>)}</div> : <p>Milestone reports will appear as students complete each assessment.</p>}</div>
    <div className="panel teacher-panel"><div className="eyebrow dark">TEACHING RESOURCES</div><h2><BookOpen size={20}/> Assign additional materials</h2><p>Publish a reading, listening task, video lesson or other HTTPS resource to one cohort. Students see only materials assigned to their selected cohort.</p><div className="teacher-grid"><input className="teacher-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Material title"/><select className="teacher-input" value={cohort} onChange={e=>setCohort(e.target.value)}>{cohorts.map(x=><option key={x}>{x}</option>)}</select><input className="teacher-input" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https:// resource link"/><input className="teacher-input" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What should students learn or do?"/></div><button className="btn primary" disabled={busy || !title.trim() || !url.trim()} onClick={assignMaterial}><Plus size={15}/> Assign material</button></div>
    {isAdmin && <div className="panel teacher-panel"><div className="eyebrow dark">SCHOOL-WIDE COMMUNICATION</div><h3>Publish a student announcement</h3><p>Share deadlines, study guidance or important updates with all students or a selected cohort.</p><div className="teacher-grid"><input className="teacher-input" value={announcementTitle} onChange={e=>setAnnouncementTitle(e.target.value)} placeholder="Announcement title"/><select className="teacher-input" value={announcementCohort} onChange={e=>setAnnouncementCohort(e.target.value)}><option value="">All cohorts</option>{cohorts.map(x=><option key={x}>{x}</option>)}</select><textarea className="teacher-input" value={announcementMessage} onChange={e=>setAnnouncementMessage(e.target.value)} placeholder="Write your announcement..." rows={3}/></div><button className="btn primary" disabled={busy||!announcementTitle.trim()||!announcementMessage.trim()} onClick={publishAnnouncement}><Plus size={15}/> Publish announcement</button></div>}
  </div>;
}
