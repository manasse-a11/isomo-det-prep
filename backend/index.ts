import { router, json, error, ai, db, requireAuth, requireAdminEmailAllowlist } from '@appdeploy/sdk';

const ADMIN_EMAILS = ['manasse@icircles.rw'];
const schema = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 0, maximum: 100 },
    feedback: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    improvements: { type: 'array', items: { type: 'string' } },
  },
  required: ['score', 'feedback', 'strengths', 'improvements'],
  additionalProperties: false,
};

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'ISOMO DET Prep ready' })],
  'POST /api/assess': [
    requireAuth(),
    async ({ body }) => {
      const input = body as { kind?: string; prompt?: string; response?: string; audio?: string; mimeType?: string };
      if (!input || !['writing', 'speaking'].includes(input.kind || '') || !input.prompt) return error('A valid task type and prompt are required.', 400);
      if (!input.audio && (!input.response || input.response.trim().length < 8)) return error('Please provide a fuller response before requesting feedback.', 400);
      if (input.audio && input.audio.length > 2600000) return error('Recording is too large. Please record a shorter answer.', 413);
      const rubric = input.kind === 'writing'
        ? 'Assess task fulfilment, relevance and development, discourse coherence, grammatical range and accuracy, vocabulary range and precision, spelling and punctuation.'
        : 'Assess task fulfilment, relevance and development, coherence, grammatical range and accuracy, vocabulary range and precision, fluency, intelligibility and pronunciation where audio evidence permits.';
      const prompt = [
        'You are an experienced English-language assessment coach supporting learners preparing for the Duolingo English Test.',
        'Evaluate this ORIGINAL practice response using a transparent teaching rubric. Do not claim to reproduce or predict the official DET grading engine.',
        'Return a fair score from 0 to 100. Score language proficiency and task fulfilment, not learner identity or accent identity.',
        rubric,
        'Give specific constructive feedback. List two or three observed strengths and two or three actionable improvements. If audio is supplied, assess audible speech; do not invent pronunciation observations if audio is unclear.',
        'Task prompt: ' + input.prompt,
        input.audio ? 'The learner supplied an audio recording. Assess the audio directly.' : 'Learner response: ' + input.response,
        'Use the required JSON schema.',
      ].join('\n\n');
      try {
        const result = await ai.generate({ prompt, audios: input.audio ? [{ data: input.audio, mimeType: input.mimeType || 'audio/webm' }] : undefined, schema, maxTokens: 700, temperature: 0.2, thinkingMode: 'FAST' });
        const parsed = JSON.parse(result.text);
        return json({
          score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
          feedback: String(parsed.feedback || 'Review the criteria and practise again.').slice(0, 1600),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3).map(String) : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3).map(String) : [],
        });
      } catch (e) {
        console.error('AI assessment failed', e);
        return error('The assessor is temporarily unavailable. Please try again.', 503);
      }
    },
  ],
  'GET /api/profile': [
    requireAuth(),
    async ({ user }) => {
      const [record] = await db.get<{ cohort?: string }>('isomo_profiles', [user!.userId]);
      return json({ cohort: record?.cohort || null });
    },
  ],
  'POST /api/profile': [
    requireAuth(),
    async ({ body, user }) => {
      const cohort = String((body as { cohort?: string })?.cohort || '');
      const allowed = ['Cohort I','Cohort II','Cohort III','Cohort IV','Cohort V','Cohort VI','Cohort VII','Isomo Circles','IRIS'];
      if (!allowed.includes(cohort)) return error('Select a valid cohort.', 400);
      const id = user!.userId;
      const [created] = await db.tx.add('isomo_profiles', [{ id, cohort, updatedAt: Date.now() }]);
      if (!created) {
        const [updated] = await db.tx.update('isomo_profiles', [{ id, record: { cohort, updatedAt: Date.now() } }], { patch: true });
        if (!updated) return error('Could not save your cohort.', 503);
      }
      return json({ saved: true, cohort });
    },
  ],
  'GET /api/assignments': [
    requireAuth(),
    async ({ user }) => {
      const [profile] = await db.get<{ cohort?: string }>('isomo_profiles', [user!.userId]);
      if (!profile?.cohort) return json({ assignments: [] });
      const records = await db.list('isomo_assignments', { filter: { cohort: profile.cohort }, limit: 100 });
      return json({ assignments: records.items.sort((a: any, b: any) => b.createdAt - a.createdAt) });
    },
  ],
  'POST /api/assignments': [
    requireAuth(),
    requireAdminEmailAllowlist(ADMIN_EMAILS),
    async ({ body, user }) => {
      const input = body as { title?: string; url?: string; description?: string; cohort?: string };
      const title = String(input?.title || '').trim().slice(0, 120);
      const url = String(input?.url || '').trim();
      const description = String(input?.description || '').trim().slice(0, 400);
      const cohort = String(input?.cohort || '');
      const allowed = ['Cohort I','Cohort II','Cohort III','Cohort IV','Cohort V','Cohort VI','Cohort VII','Isomo Circles','IRIS'];
      if (!title || !/^https:\/\//i.test(url) || !allowed.includes(cohort)) return error('Provide a title, secure HTTPS resource link and valid cohort.', 400);
      const id = 'assign_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
      const [created] = await db.add('isomo_assignments', [{ id, title, url, description, cohort, assignedBy: user!.userId, createdAt: Date.now() }]);
      if (!created) return error('Could not assign this material.', 503);
      return json({ saved: true, id });
    },
  ],
  'GET /api/progress': [
    requireAuth(),
    async ({ user }) => {
      const [record] = await db.get<{ progress?: Record<string, number> }>('isomo_progress', [user!.userId]);
      return json({ progress: record?.progress || {} });
    },
  ],
  'POST /api/progress': [
    requireAuth(),
    async ({ body, user }) => {
      const input = body as { progress?: Record<string, number> };
      if (!input?.progress || typeof input.progress !== 'object' || Array.isArray(input.progress)) return error('A valid progress record is required.', 400);
      const id = user!.userId;
      const record = { progress: input.progress, updatedAt: Date.now() };
      const [created] = await db.tx.add('isomo_progress', [{ id, ...record }]);
      if (!created) {
        const [updated] = await db.tx.update('isomo_progress', [{ id, record }], { patch: true });
        if (!updated) return error('Could not save progress. Please retry.', 503);
      }
      return json({ saved: true });
    },
  ],
  'POST /api/activity': [
    requireAuth(),
    async ({ body, user }) => {
      const input = body as { activityType?: string; skill?: string; score?: number; details?: string };
      if (!input?.activityType || !['skill_practice', 'resource_opened', 'test_started', 'test_completed', 'recommendation_viewed'].includes(input.activityType)) return error('Invalid activity type.', 400);
      const id = user!.userId + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      const [created] = await db.add('isomo_activity', [{ id, userId: user!.userId, name: user!.name || user!.email || 'Student', activityType: input.activityType, skill: String(input.skill || '').slice(0, 80), score: typeof input.score === 'number' ? Math.max(0, Math.min(100, input.score)) : null, details: String(input.details || '').slice(0, 240), createdAt: Date.now() }]);
      if (!created) return error('Could not save this activity.', 503);
      return json({ saved: true });
    },
  ],
  'POST /api/assessment': [
    requireAuth(),
    async ({ body, user }) => {
      const input = body as { stage?: string; overall?: number; reading?: number; listening?: number; writing?: number; speaking?: number; items?: unknown[]; recommendations?: string[] };
      if (!input || !['baseline', 'midline', 'endline', 'practice'].includes(input.stage || '')) return error('Invalid assessment stage.', 400);
      const id = user!.userId + '_' + input.stage + '_' + Date.now().toString(36);
      const [created] = await db.add('isomo_assessments', [{ id, userId: user!.userId, name: user!.name || user!.email || 'Student', stage: input.stage, overall: Number(input.overall) || 0, reading: Number(input.reading) || 0, listening: Number(input.listening) || 0, writing: Number(input.writing) || 0, speaking: Number(input.speaking) || 0, items: Array.isArray(input.items) ? input.items.slice(0, 24) : [], recommendations: Array.isArray(input.recommendations) ? input.recommendations.slice(0, 8) : [], createdAt: Date.now() }]);
      if (!created) return error('Could not save the assessment report.', 503);
      return json({ saved: true });
    },
  ],
  'GET /api/journey': [
    requireAuth(),
    async ({ user }) => {
      const [record] = await db.get<{ stage?: string }>('isomo_journey', [user!.userId]);
      return json({ stage: record?.stage || 'baseline' });
    },
  ],
  'POST /api/journey': [
    requireAuth(),
    async ({ body, user }) => {
      const stage = String((body as { stage?: string })?.stage || '');
      if (!['baseline', 'skills', 'midline', 'endline', 'complete'].includes(stage)) return error('Invalid learning stage.', 400);
      const id = user!.userId;
      const [created] = await db.tx.add('isomo_journey', [{ id, stage, updatedAt: Date.now() }]);
      if (!created) {
        const [updated] = await db.tx.update('isomo_journey', [{ id, record: { stage, updatedAt: Date.now() } }], { patch: true });
        if (!updated) return error('Could not update your learning pathway.', 503);
      }
      return json({ saved: true, stage });
    },
  ],
  'GET /api/my-report': [
    requireAuth(),
    async ({ user }) => {
      const [activity, assessments] = await Promise.all([
        db.list('isomo_activity', { filter: { userId: user!.userId }, limit: 100 }),
        db.list('isomo_assessments', { filter: { userId: user!.userId }, limit: 50 }),
      ]);
      return json({ activity: activity.items, assessments: assessments.items });
    },
  ],
  'GET /api/teacher/overview': [
    requireAuth(),
    requireAdminEmailAllowlist(ADMIN_EMAILS),
    async () => {
      const [progress, activity, assessments, classes, members, profiles] = await Promise.all([
        db.list('isomo_progress', { limit: 500 }),
        db.list('isomo_activity', { limit: 500 }),
        db.list('isomo_assessments', { limit: 300 }),
        db.list('isomo_classes', { limit: 100 }),
        db.list('isomo_members', { limit: 500 }),
        db.list('isomo_profiles', { limit: 500 }),
      ]);
      const students = new Map<string, any>();
      for (const member of members.items as any[]) {
        students.set(member.userId, { userId: member.userId, name: member.name || 'Student', average: 0, skills: {}, lastActive: member.joinedAt || null, practiceCount: 0, assessments: [] });
      }
      for (const row of progress.items as any[]) {
        const vals = Object.entries(row.progress || {}).filter(([k, v]: any) => !k.startsWith('_') && typeof v === 'number');
        students.set(row.id, { userId: row.id, name: row.name || 'Student', average: vals.length ? Math.round(vals.reduce((n: number, [, v]: any) => n + v, 0) / vals.length) : 0, skills: Object.fromEntries(vals), lastActive: row.updatedAt || null, practiceCount: 0, assessments: [] });
      }
      for (const row of activity.items as any[]) {
        const s = students.get(row.userId) || { userId: row.userId, name: row.name || 'Student', average: 0, skills: {}, lastActive: null, practiceCount: 0, assessments: [] };
        s.practiceCount += 1; s.lastActive = Math.max(s.lastActive || 0, row.createdAt || 0); students.set(row.userId, s);
      }
      for (const row of assessments.items as any[]) {
        const s = students.get(row.userId) || { userId: row.userId, name: row.name || 'Student', average: 0, skills: {}, lastActive: null, practiceCount: 0, assessments: [] };
        s.assessments.push({ stage: row.stage, overall: row.overall, reading: row.reading, listening: row.listening, writing: row.writing, speaking: row.speaking, createdAt: row.createdAt, recommendations: row.recommendations || [] });
        s.lastActive = Math.max(s.lastActive || 0, row.createdAt || 0); students.set(row.userId, s);
      }
      const cohortByUser = new Map((profiles.items as any[]).map(p => [p.id, p.cohort]));
      const studentRows = Array.from(students.values()).map(s => {
        s.assessments.sort((a: any, b: any) => a.createdAt - b.createdAt);
        const lowSkills = Object.entries(s.skills).filter(([, v]: any) => v < 70).sort((a: any, b: any) => a[1] - b[1]).map(([k, v]) => ({ skill: k, score: v }));
        const baseline = s.assessments.find((a: any) => a.stage === 'baseline');
        const latest = [...s.assessments].filter((a: any) => ['midline','endline'].includes(a.stage)).pop();
        return { ...s, cohort: cohortByUser.get(s.userId) || null, growth: baseline && latest ? latest.overall - baseline.overall : null, supportNeeds: lowSkills.slice(0, 4) };
      }).sort((a, b) => a.average - b.average);
      return json({ students: studentRows, activities: activity.items.sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, 100), assessments: assessments.items.sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, 100), classes: classes.items, memberCount: members.items.length, activityCount: activity.items.length });
    },
  ],
  'POST /api/classes': [
    requireAuth(),
    requireAdminEmailAllowlist(ADMIN_EMAILS),
    async ({ body, user }) => {
      const input = body as { className?: string };
      const className = String(input?.className || '').trim().slice(0, 100);
      if (!className) return error('A class name is required.', 400);
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const [id] = await db.add('isomo_classes', [{ id: code, code, className, ownerId: user!.userId, ownerName: user!.name || user!.email || 'Teacher', createdAt: Date.now() }]);
      if (!id) return error('Could not create the class. Please try again.', 503);
      return json({ code, className });
    },
  ],
  'GET /api/classes': [
    requireAuth(),
    async ({ user }) => {
      const [owned, memberships] = await Promise.all([
        db.list('isomo_classes', { filter: { ownerId: user!.userId }, limit: 100 }),
        db.list('isomo_members', { filter: { userId: user!.userId }, limit: 100 }),
      ]);
      const joined = memberships.items.length ? await db.get('isomo_classes', memberships.items.map((x: any) => String(x.classCode))) : [];
      return json({ owned: owned.items, joined: joined.filter(Boolean) });
    },
  ],
  'POST /api/classes/join': [
    requireAuth(),
    async ({ body, user }) => {
      const code = String((body as { code?: string })?.code || '').trim().toUpperCase();
      if (!/^[A-Z0-9]{5,8}$/.test(code)) return error('Enter a valid class code.', 400);
      const [klass] = await db.get<{ code: string; className: string }>('isomo_classes', [code]);
      if (!klass) return error('Class not found.', 404);
      const id = code + '_' + user!.userId;
      const [created] = await db.add('isomo_members', [{ id, classCode: code, userId: user!.userId, name: user!.name || user!.email || 'Student', joinedAt: Date.now() }]);
      return json({ joined: true, alreadyMember: !created, className: klass.className });
    },
  ],
  'GET /api/classes/:code/report': [
    requireAuth(),
    requireAdminEmailAllowlist(ADMIN_EMAILS),
    async ({ params, user }) => {
      const code = String(params.code || '').toUpperCase();
      const [klass] = await db.get<{ ownerId: string; className: string }>('isomo_classes', [code]);
      if (!klass || klass.ownerId !== user!.userId) return error('Class report access denied.', 403);
      const members = await db.list('isomo_members', { filter: { classCode: code }, limit: 100 });
      const records = await Promise.all(members.items.map((m: any) => db.get<{ progress?: Record<string, number> }>('isomo_progress', [m.userId])));
      const students = members.items.map((m: any, i: number) => {
        const p = records[i][0]?.progress || {};
        const values = Object.values(p).filter((v: any) => typeof v === 'number');
        return { userId: m.userId, name: m.name, average: values.length ? Math.round(values.reduce((a: number, b: any) => a + b, 0) / values.length) : 0, mastered: values.filter((v: any) => v >= 80).length };
      });
      return json({ className: klass.className, students });
    },
  ],
,

  'GET /api/vocabulary': [requireAuth(), async ({ user }) => {
    const [record] = await db.get<{ words?: unknown[] }>('isomo_vocabulary', [user!.userId]);
    return json({ words: Array.isArray(record?.words) ? record.words : [] });
  }],
  'POST /api/vocabulary': [requireAuth(), async ({ body, user }) => {
    const input = body as { words?: any[] };
    if (!Array.isArray(input?.words) || input.words.length > 300) return error('A valid vocabulary list is required (maximum 300 words).', 400);
    const words = input.words.slice(0,300).map((w:any)=>({id:String(w.id||'').slice(0,80),word:String(w.word||'').trim().slice(0,80),meaning:String(w.meaning||'').trim().slice(0,240),example:String(w.example||'').slice(0,300),dueAt:Math.max(0,Number(w.dueAt)||Date.now()),interval:Math.max(0,Math.min(30,Number(w.interval)||0)),addedAt:Math.max(0,Number(w.addedAt)||Date.now())})).filter(w=>w.id&&w.word&&w.meaning);
    const id=user!.userId, record={words,updatedAt:Date.now()};
    const [created]=await db.tx.add('isomo_vocabulary',[{id,...record}]);
    if(!created){const [updated]=await db.tx.update('isomo_vocabulary',[{id,record}],{patch:true});if(!updated)return error('Could not save your vocabulary notebook.',503);}
    return json({saved:true,count:words.length});
  }],
  'GET /api/announcements': [requireAuth(), async ({ user }) => {
    const [profile]=await db.get<{cohort?:string}>('isomo_profiles',[user!.userId]);
    const records=await db.list('isomo_announcements',{limit:100});
    const announcements=records.items.filter((a:any)=>a.published!==false&&(!a.cohort||a.cohort===profile?.cohort)).sort((a:any,b:any)=>b.createdAt-a.createdAt).slice(0,30);
    return json({announcements});
  }],
  'POST /api/announcements': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ body, user }) => {
    const input=body as {title?:string;message?:string;cohort?:string}, title=String(input?.title||'').trim().slice(0,120), message=String(input?.message||'').trim().slice(0,1000), cohort=String(input?.cohort||'');
    const allowed=['','Cohort I','Cohort II','Cohort III','Cohort IV','Cohort V','Cohort VI','Cohort VII','Isomo Circles','IRIS'];
    if(!title||!message||!allowed.includes(cohort))return error('Provide a title, message and valid cohort.',400);
    const id='announcement_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
    const [created]=await db.add('isomo_announcements',[{id,title,message,cohort:cohort||null,published:true,createdBy:user!.userId,createdAt:Date.now()}]);
    if(!created)return error('Could not publish the announcement.',503);
    return json({published:true,id});
  }],
});