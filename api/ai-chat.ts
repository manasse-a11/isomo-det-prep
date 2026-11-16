type ChatMessage = { role: 'user' | 'model'; parts: { text: string }[] };

const limits = new Map<string, { count: number; resetAt: number }>();

function reply(res: any, status: number, body: Record<string, unknown>) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').json(body);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { error: 'Use POST to send a message.' });
  }

  const authorization = String(req.headers.authorization || '');
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!accessToken || !supabaseUrl || !supabaseAnonKey) {
    return reply(res, 401, { error: 'Please sign in again to use the ISOMO AI Coach.' });
  }

  try {
    const identity = await fetch(supabaseUrl.replace(/\/$/, '') + '/auth/v1/user', {
      headers: { apikey: supabaseAnonKey, Authorization: 'Bearer ' + accessToken },
    });
    if (!identity.ok) return reply(res, 401, { error: 'Your session has expired. Please sign in again.' });
    const user = await identity.json();
    if (!user?.id) return reply(res, 401, { error: 'Your account could not be verified.' });

    const functionUrl = process.env.VITE_SUPABASE_FUNCTION_URL;
    if (functionUrl) {
      const access = await fetch(functionUrl.replace(/\/$/, '') + '/api/access/status', {
        headers: { apikey: supabaseAnonKey, Authorization: 'Bearer ' + accessToken },
      });
      if (access.ok) {
        const accessData = await access.json();
        if (accessData?.status && accessData.status !== 'approved') {
          return reply(res, 403, { error: 'AI Coach access is available after your ISOMO account is approved.' });
        }
      }
    }

    if (!geminiKey) {
      return reply(res, 503, {
        error: 'The in-app AI Coach is ready, but its secure Gemini key has not been added to the server yet. Ask the ISOMO administrator to add GEMINI_API_KEY in Vercel Project Settings → Environment Variables.',
        needsSetup: true,
      });
    }

    const now = Date.now();
    const previous = limits.get(user.id);
    if (previous && previous.resetAt > now && previous.count >= 12) {
      return reply(res, 429, { error: 'You have reached the short-term AI message limit. Please wait a minute and try again.' });
    }
    limits.set(user.id, previous && previous.resetAt > now
      ? { count: previous.count + 1, resetAt: previous.resetAt }
      : { count: 1, resetAt: now + 60_000 });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const history: ChatMessage[] = messages
      .filter((m: any) => (m?.role === 'user' || m?.role === 'model') && typeof m?.text === 'string')
      .slice(-16)
      .map((m: any) => ({ role: m.role, parts: [{ text: String(m.text).slice(0, 7000) }] }));

    if (!history.length || history[history.length - 1].role !== 'user') {
      return reply(res, 400, { error: 'Write a message before sending it to your coach.' });
    }
    const totalChars = history.reduce((sum, item) => sum + item.parts[0].text.length, 0);
    if (totalChars > 30_000) return reply(res, 413, { error: 'This conversation is too long. Start a new chat to continue.' });

    const study = body.studyContext && typeof body.studyContext === 'object' ? body.studyContext : {};
    const studySummary = [
      'Programme focus: ' + String(study.programme || 'DET and SAT preparation').slice(0, 80),
      'Current English level: ' + String(study.level || 'Not specified').slice(0, 60),
      'Target DET score: ' + String(study.target || 'Not specified').slice(0, 20),
      'Daily study time: ' + String(study.minutes || 'Not specified').slice(0, 20),
      'Previous marks: ' + String(study.marks || 'Not provided').slice(0, 700),
      'Learning progress: ' + String(study.progress || 'Not provided').slice(0, 700),
    ].join('\n');

    const systemInstruction = [
      'You are ISOMO AI Study Coach, a patient, rigorous and encouraging tutor embedded inside ISOMO Prep Center.',
      'Support Duolingo English Test (DET), SAT, academic English, writing, reading, listening, speaking, vocabulary, grammar, research skills and study planning.',
      'Ask one question at a time during interactive drills and wait for the learner to answer. Give specific feedback using evidence from the learner\'s response. Explain corrections and provide a chance to retry.',
      'Use clear international English and adapt explanations to the learner\'s level. Be accurate, constructive and concise unless depth is requested.',
      'Never claim that practice estimates are official DET or College Board scores. Do not invent official rules, answer keys, citations or sources. State uncertainty honestly.',
      'Protect learner privacy. Do not ask for passwords, authentication codes, or unnecessary sensitive personal information.',
      'Use this learner context to personalise teaching, but do not repeat private profile details unless they are directly relevant:',
      studySummary,
    ].join('\n\n');

    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const upstream = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: history,
          generationConfig: { temperature: 0.65, maxOutputTokens: 1400 },
        }),
      },
    );

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      if (upstream.status === 429) {
        return reply(res, 429, { error: 'Gemini free-tier capacity is temporarily exhausted. Please wait and try again later.' });
      }
      console.error('Gemini request failed:', upstream.status, result?.error?.message || 'Unknown provider error');
      return reply(res, 502, { error: 'The AI service could not complete that response. Please try again shortly.' });
    }

    const answer = (result?.candidates?.[0]?.content?.parts || [])
      .map((part: any) => typeof part.text === 'string' ? part.text : '')
      .join('')
      .trim();
    if (!answer) return reply(res, 502, { error: 'The AI service returned an empty response. Please try again.' });
    return reply(res, 200, { text: answer, model });
  } catch (error: any) {
    console.error('ISOMO AI Coach error:', error?.message || error);
    return reply(res, 500, { error: 'The AI Coach encountered a temporary error. Please try again.' });
  }
}
