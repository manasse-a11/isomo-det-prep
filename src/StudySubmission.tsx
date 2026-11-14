import { useEffect, useState } from 'react';
import { Clock3, ImagePlus, Send, CheckCircle2 } from 'lucide-react';
import { api, supabase } from './lib';

type Props = { user:any; cohort:string; resourceTitle:string; resourceUrl:string; onSubmitted?:()=>void };
export default function StudySubmission({user,cohort,resourceTitle,resourceUrl,onSubmitted}:Props){
 const key='isomo_long_video_start_'+(user?.userId||'guest')+'_'+encodeURIComponent(resourceUrl);
 const [startedAt,setStartedAt]=useState<number>(()=>Number(localStorage.getItem(key))||0);
 const [seconds,setSeconds]=useState(()=>startedAt?Math.max(0,2700-Math.floor((Date.now()-startedAt)/1000)):2700);
 const [file,setFile]=useState<File|null>(null);
 const [reflection,setReflection]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [done,setDone]=useState(false);
 useEffect(()=>{if(!startedAt)return;const update=()=>setSeconds(Math.max(0,2700-Math.floor((Date.now()-startedAt)/1000)));update();const timer=window.setInterval(update,1000);return()=>window.clearInterval(timer)},[startedAt]);
 const start=()=>{const now=Date.now();localStorage.setItem(key,String(now));setStartedAt(now);setSeconds(2700);setMessage('The 45-minute practice timer has started. Complete your own practice, then upload a screenshot.');};
 const submit=async()=>{
  if(!user||!cohort){setMessage('Sign in and select your cohort before submitting.');return;}
  if(seconds>0){setMessage('Complete the full 45 minutes of independent practice before submitting.');return;}
  if(!file){setMessage('Please attach a screenshot of your completed practice.');return;}
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){setMessage('Use a JPG, PNG or WebP screenshot up to 10 MB.');return;}
  setBusy(true);setMessage('');
  try{
   const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
   const path=user.userId+'/'+crypto.randomUUID()+'.'+ext;
   const {error:uploadError}=await supabase.storage.from('study-evidence').upload(path,file,{contentType:file.type,upsert:false});
   if(uploadError)throw uploadError;
   await api.post('/api/study-submissions',{cohort,task_type:'long_video_practice',skill:'Integrated DET skills',resource_title:resourceTitle,resource_url:resourceUrl,practice_minutes:45,reflection,screenshot_path:path});
   localStorage.removeItem(key);setDone(true);setFile(null);setReflection('');
   setMessage('Your 45-minute practice evidence has been sent to your teacher dashboard.');
   onSubmitted?.();
  }catch(e:any){setMessage(e?.message||'The submission could not be sent. Please try again.');}
  finally{setBusy(false);}
 };
 const clock=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 return <section className="panel study-submission-panel">
  <div className="eyebrow dark">45-MINUTE INDEPENDENT PRACTICE</div><h3>Watch, practise, document and submit</h3>
  <p><strong>After watching “{resourceTitle}”, complete 45 minutes of free DET practice.</strong> Work independently on the skills covered by the lesson. Take a screenshot of your completed practice and send it here for your teacher to review.</p>
  {!startedAt||done?<button className="btn primary" onClick={()=>{setDone(false);start()}}><Clock3 size={16}/>{done?'Start another 45-minute practice':'Start 45-minute practice'}</button>:<>
   <div className="study-timer"><Clock3 size={18}/><strong>{clock}</strong><span>{seconds>0?'Time remaining':'Practice period complete — attach your screenshot'}</span></div>
   <label className="profile-field-label">Screenshot of completed practice</label>
   <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/>
   <label className="profile-field-label">What did you practise or learn? (optional)</label>
   <textarea className="teacher-input" rows={3} value={reflection} onChange={e=>setReflection(e.target.value)} placeholder="Briefly describe the exercises you completed..."/>
   <button className="btn primary" disabled={busy||seconds>0||!file} onClick={submit}><Send size={16}/>{busy?'Submitting…':'Send screenshot to teacher dashboard'}</button>
  </>}
  {message&&<div className="note-box">{message}</div>}
  <p className="score-disclaimer"><ImagePlus size={14}/> Your screenshot is stored privately and is visible only to you and authorised teachers. Do not upload sensitive personal information.</p>
 </section>;
}
