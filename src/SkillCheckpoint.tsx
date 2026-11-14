import { useEffect, useMemo, useState } from 'react';
import { Clock3, ShieldCheck, X } from 'lucide-react';

type Question = { q: string; options: string[]; answer: number };
const banks: Record<string, Question[]> = {
  Reading: [
    { q: 'Which sentence best states a passage’s central idea?', options: ['A minor example from paragraph two', 'The main claim supported throughout the passage', 'A personal reaction unrelated to the text', 'A detail that appears only once'], answer: 1 },
    { q: 'What is the strongest evidence for an inference?', options: ['A guess based on the title', 'A detail directly supporting the conclusion', 'An unrelated statistic', 'A personal opinion'], answer: 1 },
    { q: 'Choose the correct word: The findings were ___ with earlier research.', options: ['consistent', 'consistently', 'consistency', 'consist'], answer: 0 },
    { q: 'In context, “mitigate” most nearly means:', options: ['increase', 'make less severe', 'ignore', 'measure'], answer: 1 },
    { q: 'Which strategy best helps with a C-test gap?', options: ['Guess from the first letter only', 'Use grammar, word form and surrounding meaning', 'Ignore the sentence', 'Choose the longest word'], answer: 1 },
    { q: 'A reliable summary should:', options: ['Add new opinions', 'Include every minor detail', 'Present the central points accurately and concisely', 'Copy one sentence only'], answer: 2 },
    { q: 'Which is the best transition for a contrast?', options: ['Furthermore', 'For example', 'Nevertheless', 'Similarly'], answer: 2 },
    { q: 'When selecting real words, you should:', options: ['Select every unfamiliar-looking string', 'Check spelling and lexical knowledge carefully', 'Choose only short words', 'Ignore word forms'], answer: 1 }
  ],
  Listening: [
    { q: 'When listening to an academic talk, what should notes prioritise?', options: ['Every word verbatim', 'Main claims, reasons, examples and transitions', 'Only the speaker’s accent', 'Unrelated background sounds'], answer: 1 },
    { q: 'Which detail is most important in a conversation summary?', options: ['The speakers’ main purpose and agreed next steps', 'Every hesitation', 'The room description', 'The exact number of pauses'], answer: 0 },
    { q: 'In dictation, which small words are often missed?', options: ['Articles and prepositions', 'Only nouns', 'Only long adjectives', 'Proper names only'], answer: 0 },
    { q: 'If you miss one phrase, the best approach is to:', options: ['Stop listening completely', 'Keep following the speaker for the next idea', 'Invent a sentence', 'Restart the recording without reading context'], answer: 1 },
    { q: 'A speaker says “however”. This usually signals:', options: ['A contrast', 'A repetition', 'A conclusion only', 'A list of names'], answer: 0 },
    { q: 'Which practice builds listening flexibility?', options: ['Listening to one familiar speaker only', 'Using varied accents and natural speaking speeds', 'Avoiding transcripts forever', 'Listening without checking understanding'], answer: 1 },
    { q: 'In a discussion, tone and emphasis can help identify:', options: ['The speaker’s attitude or intention', 'The exact spelling of every word', 'The length of the recording', 'The microphone brand'], answer: 0 },
    { q: 'A good final check of a dictated sentence includes:', options: ['Articles, verb endings, plurals and punctuation', 'Font size only', 'Paragraph colour', 'Word count only'], answer: 0 }
  ],
  Writing: [
    { q: 'A strong opening sentence should:', options: ['Introduce a clear response to the prompt', 'Repeat the prompt without an answer', 'Add unrelated background', 'Present several contradictory claims'], answer: 0 },
    { q: 'Which sentence has correct subject–verb agreement?', options: ['The results shows a trend.', 'The results show a trend.', 'The results showing a trend.', 'The results has show a trend.'], answer: 1 },
    { q: 'The best support for an argument is:', options: ['A relevant reason and specific example', 'A repeated claim', 'An unrelated anecdote', 'A list of difficult words'], answer: 0 },
    { q: 'Which connector indicates cause?', options: ['Although', 'Consequently', 'Because', 'Meanwhile'], answer: 2 },
    { q: 'A coherent paragraph should:', options: ['Develop one controlling idea logically', 'Contain unrelated sentences', 'Avoid transitions', 'Use only short fragments'], answer: 0 },
    { q: 'Which is the most precise academic expression?', options: ['Things got bad', 'The situation deteriorated', 'Stuff was not good', 'It was kind of bad'], answer: 1 },
    { q: 'When revising, you should check:', options: ['Task relevance, organisation, grammar and vocabulary', 'Only the title', 'Only the number of commas', 'Only the final sentence'], answer: 0 },
    { q: 'A conclusion should usually:', options: ['Introduce an unrelated argument', 'Synthesize the response’s main point', 'Copy the first sentence exactly', 'Add unsupported statistics'], answer: 1 }
  ],
  Speaking: [
    { q: 'A clear spoken response usually begins by:', options: ['Answering the prompt directly', 'Apologising repeatedly', 'Listing unrelated facts', 'Waiting silently'], answer: 0 },
    { q: 'If you need time to organise an answer, you should:', options: ['Use a brief natural transition and continue', 'Remain silent for most of the time', 'Repeat one word', 'Change the topic'], answer: 0 },
    { q: 'Which delivery feature improves intelligibility?', options: ['Consistent clarity, appropriate pace and word stress', 'Speaking as quickly as possible', 'Whispering', 'Avoiding pauses completely'], answer: 0 },
    { q: 'A developed opinion response should include:', options: ['A position, reasons and examples', 'Only “yes” or “no”', 'A memorised unrelated story', 'A list of vocabulary'], answer: 0 },
    { q: 'When describing a photograph, focus on:', options: ['Visible people, actions, setting and relationships', 'Imagined events outside the image', 'Only your personal memories', 'Unrelated opinions'], answer: 0 },
    { q: 'Which approach helps maintain fluency?', options: ['Organise ideas into a simple sequence', 'Memorise every sentence word for word', 'Stop after each word', 'Use complex words without knowing them'], answer: 0 },
    { q: 'If you make a small speaking error, you should:', options: ['Correct it briefly if needed and continue', 'Restart the entire answer', 'Stop the recording', 'Repeat the error many times'], answer: 0 },
    { q: 'A strong final sentence should:', options: ['Complete the idea naturally', 'Introduce an unrelated topic', 'Repeat the same phrase several times', 'End mid-sentence'], answer: 0 }
  ]
};

export default function SkillCheckpoint({ area, onPass, onCancel }: { area: string; onPass: () => void; onCancel: () => void }) {
  const questions = useMemo(() => banks[area] || banks.Reading, [area]);
  const [startedAt, setStartedAt] = useState(() => {
    const key = 'isomo_checkpoint_start_' + area;
    const saved = Number(localStorage.getItem(key));
    if (saved && Date.now() - saved < 24 * 60 * 60 * 1000) return saved;
    const next = Date.now();
    localStorage.setItem(key, String(next));
    return next;
  });
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem('isomo_checkpoint_answers_' + area) || '{}'); } catch { return {}; }
  });
  const [seconds, setSeconds] = useState(1200);
  const [result, setResult] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setSeconds(Math.max(0, 1200 - Math.floor((Date.now() - startedAt) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);
  useEffect(() => {
    localStorage.setItem('isomo_checkpoint_answers_' + area, JSON.stringify(answers));
  }, [answers, area]);
  const finish = () => {
    if (seconds > 0 || Object.keys(answers).length !== questions.length) return;
    const score = Math.round(questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0) / questions.length * 100);
    setResult(score);
    if (score >= 70) {
      localStorage.removeItem('isomo_checkpoint_start_' + area);
      localStorage.removeItem('isomo_checkpoint_answers_' + area);
      onPass();
    }
  };
  const retry = () => {
    const next = Date.now();
    localStorage.setItem('isomo_checkpoint_start_' + area, String(next));
    localStorage.removeItem('isomo_checkpoint_answers_' + area);
    setStartedAt(next); setAnswers({}); setResult(null);
  };
  const clock = String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0');
  return <div className="checkpoint-backdrop"><section className="checkpoint-modal" role="dialog" aria-modal="true" aria-label={area + ' skill checkpoint'}>
    <div className="checkpoint-top"><span><ShieldCheck size={17}/> SKILL PROGRESSION CHECKPOINT</span><button className="btn outline" onClick={onCancel} aria-label="Close checkpoint"><X size={16}/></button></div>
    <h2>{area}: 20-minute mastery test</h2>
    <p>Complete all eight questions. The full 20-minute assessment period must elapse before submission. You need at least 70% to unlock your next skill. Your answers are saved on this device while the test is open.</p>
    <div className="checkpoint-clock"><Clock3 size={19}/><strong>{clock}</strong><span>{seconds > 0 ? 'Time remaining' : 'You may submit now'}</span></div>
    {result !== null ? <div className="note-box"><strong>Your score: {result}%</strong><p>{result >= 70 ? 'Checkpoint passed.' : 'You need 70% to move to the next skill.'}</p>{result < 70 && <button className="btn primary" onClick={retry}>Retake 20-minute test</button>}</div> : <>
      <div className="checkpoint-questions">{questions.map((q,i)=><fieldset key={i}><legend>{i+1}. {q.q}</legend>{q.options.map((option,j)=><label key={j}><input type="radio" name={'checkpoint-'+i} checked={answers[i]===j} onChange={()=>setAnswers(p=>({...p,[i]:j}))}/>{option}</label>)}</fieldset>)}</div>
      <div className="checkpoint-actions"><span>{Object.keys(answers).length}/{questions.length} answered</span><button className="btn primary" disabled={seconds > 0 || Object.keys(answers).length !== questions.length} onClick={finish}>Submit checkpoint</button></div>
    </>}
  </section></div>;
}
