import { useEffect, useMemo, useRef, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import TeacherDashboard from './TeacherDashboard';
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  Home,
  Menu,
  Mic,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  PenLine,
  X,
  GraduationCap,
  ExternalLink,
  Pause,
  BarChart3,
} from 'lucide-react';

type Skill = {
  id: string;
  title: string;
  area: string;
  icon: any;
  desc: string;
  time: string;
  task: string;
  prompt: string;
  sample?: string;
  options?: string[];
  answer?: number;
};
type Result = {
  score: number;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
};
const skills: Skill[] = [
  {
    id: 'read-select',
    title: 'Read and Select',
    area: 'Reading',
    icon: BookOpen,
    desc: 'Recognise real English words quickly and accurately.',
    time: '5 sec / item',
    task: 'Choose the real English word(s).',
    prompt: 'Which of these are real English words?',
    options: [
      'abundant',
      'flinter',
      'resilient',
      'morpicate',
      'coherent',
      'bravish',
    ],
    answer: 0,
  },
  {
    id: 'fill-blanks',
    title: 'Fill in the Blanks',
    area: 'Reading',
    icon: BookOpen,
    desc: 'Use grammar, vocabulary and context to complete sentences.',
    time: '20 sec / item',
    task: 'Complete the sentence with the best word.',
    prompt:
      'Although the proposal was initially ___, the team revised it after receiving feedback.',
    options: ['flawed', 'flaw', 'flawing', 'flawlessly'],
    answer: 0,
  },
  {
    id: 'read-complete',
    title: 'Read and Complete',
    area: 'Reading',
    icon: BookOpen,
    desc: 'Restore missing letters using syntax and meaning.',
    time: '3 min / passage',
    task: 'Type the missing word.',
    prompt:
      'Urban gardens can improve food security while strengthening neighb___ connections. They also provide spaces where residents can exch___ knowledge and cultivate a shared sense of responsib___.',
    sample: 'neighbourhood · exchange · responsibility',
  },
  {
    id: 'interactive-reading',
    title: 'Interactive Reading',
    area: 'Reading',
    icon: BookOpen,
    desc: 'Understand passages, locate evidence and infer the main idea.',
    time: '7–8 min / set',
    task: 'Read, interpret and select the best answer.',
    prompt:
      'Community libraries are changing their role. In addition to lending books, many now provide internet access, language classes and quiet study spaces. These services are especially valuable in areas where households have limited access to digital tools. By adapting to local needs, libraries remain relevant while supporting lifelong learning.',
    options: [
      'Libraries are becoming less useful because people use the internet.',
      'Libraries are expanding services to meet educational and digital needs.',
      'Libraries should stop lending printed books.',
      'Language classes are the only important library service.',
    ],
    answer: 1,
  },
  {
    id: 'listen-type',
    title: 'Listen and Type',
    area: 'Listening',
    icon: Headphones,
    desc: 'Capture spoken English accurately, including small grammatical words.',
    time: '1 min / item',
    task: 'Listen to the sentence, then type exactly what you hear.',
    prompt:
      'The research findings were presented at an international conference last week.',
    sample:
      'The research findings were presented at an international conference last week.',
  },
  {
    id: 'interactive-listening',
    title: 'Interactive Listening',
    area: 'Listening',
    icon: Headphones,
    desc: 'Follow an academic conversation, respond naturally and summarise.',
    time: '7–8 min / set',
    task: 'Listen to a short scenario and answer the comprehension question.',
    prompt:
      'A student meets a lecturer to discuss a group research project. The lecturer suggests narrowing the topic because the original question covers too many countries and time periods.',
    options: [
      'The student should broaden the research question.',
      'The student should narrow the topic to make it manageable.',
      'The student should abandon the project.',
      'The lecturer will complete the research.',
    ],
    answer: 1,
  },
  {
    id: 'write-photo',
    title: 'Write About the Photo',
    area: 'Writing',
    icon: PenLine,
    desc: 'Describe visible details precisely and develop a coherent response.',
    time: '1 min',
    task: 'Write a detailed description based only on the scene.',
    prompt:
      'Imagine a photograph showing three university students collaborating around a laptop in a bright library. One student is taking notes while another points to a chart on the screen.',
  },
  {
    id: 'interactive-writing',
    title: 'Interactive Writing',
    area: 'Writing',
    icon: PenLine,
    desc: 'Develop a clear position, support it and extend your argument.',
    time: '5 min + 3 min',
    task: 'Write a developed response to the prompt.',
    prompt:
      'Some people believe universities should prioritise practical skills, while others argue that theoretical knowledge is equally important. Which view do you support? Explain your reasoning with examples.',
  },
  {
    id: 'speak-photo',
    title: 'Speak About the Photo',
    area: 'Speaking',
    icon: Mic,
    desc: 'Speak fluently and organise a vivid, accurate description.',
    time: '90 sec',
    task: 'Record or type a spoken response.',
    prompt:
      'Describe a scene in which volunteers are planting trees beside a school. Explain what is happening and why the activity may matter to the community.',
  },
  {
    id: 'read-speak',
    title: 'Read, Then Speak',
    area: 'Speaking',
    icon: Mic,
    desc: 'Build a spontaneous, extended response with examples.',
    time: '90 sec',
    task: 'Speak about the topic with a clear beginning, development and conclusion.',
    prompt:
      'Do you think young people learn more from formal education or from practical experience? Explain your opinion and give examples.',
  },
  {
    id: 'interactive-speaking',
    title: 'Interactive Speaking',
    area: 'Speaking',
    icon: Mic,
    desc: 'Respond naturally to follow-up questions in a simulated conversation.',
    time: '35 sec / response',
    task: 'Answer as if speaking with an interviewer.',
    prompt:
      'Your class is planning a community project. What problem would you choose to address, and why?',
  },
  {
    id: 'writing-sample',
    title: 'Writing Sample',    area: 'Writing',
    icon: PenLine,
    desc: 'Produce a sustained, organised academic response.',
    time: '5 min',
    task: 'Write a complete response with examples.',
    prompt:
      'Describe a skill you learned outside the classroom. How has it influenced the way you approach challenges?',
  },
  {
    id: 'speaking-sample',
    title: 'Speaking Sample',
    area: 'Speaking',
    icon: Mic,
    desc: 'Deliver a clear extended response suitable for an academic audience.',
    time: '3 min',
    task: 'Speak at length, developing your ideas with examples.',
    prompt:
      'Talk about a person who has positively influenced your education. What did you learn from this person, and how have you applied it?',
  },
];
const resources = [
  {
    name: 'DET Official Handbook',
    kind: 'DET · official guide',
    detail: 'Official explanations of question types, timing, scoring and preparation strategies.',
    url: 'https://englishtest-static.duolingo.com/media/resources/GPN%20The%20DET%20Handbook.pdf',
  },
  {
    name: 'DET Official Sample Questions',
    kind: 'DET · official practice',
    detail: 'Official sample questions and practice material for familiarising yourself with DET task formats.',
    url: 'https://englishtest-static.duolingo.com/media/resources/GPN%20DET%20Sample%20Questions%20-%20Full.pdf',
  },
  {
    name: 'DET Official Practice Test',
    kind: 'DET · official practice',
    detail: 'Take the free adaptive practice test and receive an estimated score range.',
    url: 'https://testcenter.zendesk.com/hc/en-us/articles/360011076591-The-Practice-Test-Prepare-to-take-the-Duolingo-English-Test-and-estimate-your-score',
  },
  {
    name: 'DET Official Test Structure and Question Types',
    kind: 'DET · official guide',
    detail: 'Review the current test stages, question families and adaptive format.',
    url: 'https://testcenter.zendesk.com/hc/en-us/articles/39104891663245-Test-Structure',
  },
  {
    name: 'DET Official Scoring Guide',
    kind: 'DET · official scoring',
    detail: 'Understand how different question types and open responses are evaluated.',
    url: 'https://testcenter.zendesk.com/hc/en-us/articles/39104960626189-How-the-Items-Are-Scored',
  },
  {
    name: 'DET Official Readiness and Preparation Hub',
    kind: 'DET · official resource hub',
    detail: 'Start from the test maker’s preparation hub for current readiness information and resources.',
    url: 'https://englishtest.duolingo.com/prepare',
  },
  {
    name: 'Arno DET Preparation Platform',
    kind: 'Arno · practice platform',
    detail: 'Explore Arno’s DET practice, mock tests, vocabulary tools and writing and speaking feedback. Some features may require an account or subscription.',
    url: 'https://goarno.io/',
  },
  {
    name: 'Arno Full DET Practice Test Walkthrough',
    kind: 'Arno · YouTube lesson',
    detail: 'Watch Arno work through a full DET practice test and explain strategies across the major question types.',
    url: 'https://www.youtube.com/watch?v=uVu3L63evW0',
  },
  {
    name: 'Arno: All DET Question Types Explained',
    kind: 'Arno · YouTube lesson',
    detail: 'A guided overview of the DET question types and how they fit into the test.',
    url: 'https://www.youtube.com/watch?v=70k6WSDuidU',
  },
  {
    name: 'Quill Full Activity Library',
    kind: 'Quill · free practice library',
    detail: 'Browse Quill’s literacy activities for grammar, sentence construction, proofreading, reading and evidence-based writing.',
    url: 'https://www.quill.org/',
  },
  {
    name: 'Quill Grammar',
    kind: 'Quill · grammar',
    detail: 'Practise grammar and mechanics, including punctuation, sentence structure and usage.',
    url: 'https://www.quill.org/grammar',
  },
  {
    name: 'Quill Proofreader',
    kind: 'Quill · editing',
    detail: 'Edit passages and practise identifying grammatical and mechanical errors.',
    url: 'https://www.quill.org/proofreader',
  },
  {
    name: 'Quill Reading for Evidence',
    kind: 'Quill · reading and writing',
    detail: 'Read nonfiction texts, support claims with textual evidence and revise written explanations.',
    url: 'https://www.quill.org/reading-for-evidence',
  },
  {
    name: 'Quill Connect',
    kind: 'Quill · sentence construction',
    detail: 'Combine ideas into more precise, varied and complex sentences.',
    url: 'https://www.quill.org/connect',
  },
  {
    name: 'Quill Teacher and Student Activity Guide',
    kind: 'Quill · resource directory',
    detail: 'Learn about Quill’s free literacy tools, activity types and classroom use.',
    url: 'https://www.quill.org/faq',
  },
  {
    name: 'YouTube: Arno DET Preparation Videos',
    kind: 'YouTube · Arno',
    detail: 'Use this Arno practice walkthrough as a starting point, then explore related DET lessons and question-type tutorials.',
    url: 'https://www.youtube.com/watch?v=uVu3L63evW0',
  },
  {
    name: 'YouTube: Official Duolingo English Test Channel',
    kind: 'YouTube · official DET',
    detail: 'Browse official DET walkthroughs, announcements and preparation videos.',
    url: 'https://www.youtube.com/@DuolingoEnglishTest/videos',
  },
  {
    name: 'YouTube: DET Question-Type Tutorials',
    kind: 'YouTube · DET practice',
    detail: 'Find demonstrations and practice lessons for each DET question type. Check upload dates against the current test format.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+current+question+types+tutorial',
  },
  {
    name: 'YouTube: DET Speaking and Writing Practice',
    kind: 'YouTube · productive skills',
    detail: 'Explore sample responses, timed speaking drills, writing demonstrations and feedback lessons.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+speaking+writing+practice+sample+answers',
  },
  {
    name: 'YouTube: Academic Listening and Reading',
    kind: 'YouTube · receptive skills',
    detail: 'Build listening comprehension, note-taking, inference and academic reading skills.',
    url: 'https://www.youtube.com/results?search_query=advanced+academic+English+listening+reading+comprehension+practice',
  },
  {
    name: 'College Board SAT Reading and Writing',
    kind: 'College Board · academic skills',
    detail: 'Practise information and ideas, craft and structure, expression of ideas and Standard English conventions. These are transferable English skills, not DET questions.',
    url: 'https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing',
  },
  {
    name: 'College Board Student Question Bank',
    kind: 'College Board · official practice',
    detail: 'Access thousands of official SAT Suite questions and filter Reading and Writing practice by domain, skill and difficulty.',
    url: 'https://satsuite.collegeboard.org/practice/student-question-bank',
  },
  {
    name: 'College Board Reading and Writing Question Bank',
    kind: 'College Board · reading and writing',
    detail: 'Practise evidence, inference, central ideas, vocabulary in context, text structure, transitions and grammar conventions.',
    url: 'https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing',
  },
  {
    name: 'College Board Bluebook Practice Tests',
    kind: 'College Board · mock tests',
    detail: 'Use official digital SAT practice tests to build stamina, test-interface familiarity and timed reading skills.',
    url: 'https://satsuite.collegeboard.org/practice/practice-tests/bluebook',
  },
  {
    name: 'College Board SAT Practice and Preparation',
    kind: 'College Board · resource hub',
    detail: 'Find study plans, practice tests, question banks, targeted practice and educator resources.',
    url: 'https://satsuite.collegeboard.org/practice',
  },
  {
    name: 'Khan Academy Official SAT Reading and Writing',
    kind: 'College Board partner · free lessons',
    detail: 'Use the College Board partnership course for structured reading, vocabulary, grammar and writing practice.',
    url: 'https://www.khanacademy.org/sat-reading-and-writing',
  },
  {
    name: 'College Board Question of the Day',
    kind: 'College Board · daily practice',
    detail: 'Complete a short official Reading and Writing question to build a consistent practice habit.',
    url: 'https://qotd.collegeboard.org/',
  },
  {
    name: 'Official DET practice and readiness',
    kind: 'Official guide',
    detail: 'Understand the current test format, rules and question types.',
    url: 'https://englishtest.duolingo.com/prepare',
  },
  {
    name: 'DET 2026 Scoring Guide for Teachers',
    kind: 'Teacher resource',
    detail: 'Official scoring criteria, task formats and sample responses.',
    url: 'https://englishtest-static.duolingo.com/media/resources/DET_Scoring%20Guide%20for%20Teachers%20%282026%29.pdf',
  },
  {
    name: 'Official DET 2025 test walkthrough',
    kind: 'YouTube · official',
    detail: 'Watch the official Duolingo English Test walkthrough covering the current test experience and task types.',
    url: 'https://www.youtube.com/watch?v=VttOg1fbsa8',  },
  {
    name: 'DET complete course: all question types and full practice',
    kind: 'YouTube · full course',
    detail: 'A long-form course covering the task families, strategies and a full practice test. Compare advice with current official guidance.',
    url: 'https://www.youtube.com/watch?v=v5SsL7Oqxrg',
  },
  {
    name: 'Official Duolingo English Test video library',
    kind: 'YouTube · official channel',
    detail: 'Find official walkthroughs, announcements and preparation videos from the test maker.',
    url: 'https://www.youtube.com/@DuolingoEnglishTest/videos',
  },
  {
    name: 'Read and Select: advanced vocabulary practice',
    kind: 'YouTube · reading',
    detail: 'Practise recognising real English words, spelling patterns and advanced vocabulary under time pressure.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Read+and+Select+advanced+practice',
  },
  {
    name: 'Fill in the Blanks: grammar and context',
    kind: 'YouTube · reading',
    detail: 'Learn to use sentence structure, collocations, word forms and context to complete missing words.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Fill+in+the+Blanks+lesson+practice',
  },
  {
    name: 'Read and Complete: C-test strategies',
    kind: 'YouTube · reading',
    detail: 'Build accuracy with word endings, prefixes, suffixes, grammar and context clues.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Read+and+Complete+C-test+practice',
  },
  {
    name: 'Interactive Reading: complete question-set walkthrough',
    kind: 'YouTube · reading',
    detail: 'Practise identifying main ideas, selecting evidence, completing summaries and understanding implications.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Interactive+Reading+new+format+practice',
  },
  {
    name: 'Listen and Type: dictation accuracy drills',
    kind: 'YouTube · listening',
    detail: 'Train careful listening for articles, prepositions, verb endings, plurals and sentence punctuation.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Listen+and+Type+dictation+practice',
  },
  {
    name: 'Interactive Listening: conversation and summary practice',
    kind: 'YouTube · listening',
    detail: 'Follow a conversation, track speaker intentions, complete responses and summarise key information.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Interactive+Listening+new+format+practice',
  },
  {
    name: 'Listening practice with British, American and international accents',
    kind: 'YouTube · listening',
    detail: 'Develop comprehension across different speaking speeds, accents and natural connected speech.',
    url: 'https://www.youtube.com/results?search_query=English+listening+practice+different+accents+British+American+advanced',
  },
  {
    name: 'Write About the Photo: high-scoring descriptions',
    kind: 'YouTube · writing',
    detail: 'Practise precise observation, specific vocabulary, sentence variety and coherent photo descriptions.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Write+About+the+Photo+practice+145+160',
  },
  {
    name: 'Interactive Writing: plan, develop and extend',
    kind: 'YouTube · writing',
    detail: 'Learn to answer the first prompt clearly and develop the follow-up with relevant detail and examples.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Interactive+Writing+new+format+practice',
  },
  {
    name: 'Writing Sample: extended academic responses',
    kind: 'YouTube · writing',
    detail: 'Build a clear position, logical paragraphs, relevant examples, accurate grammar and a strong conclusion.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Writing+Sample+high+score+examples',
  },
  {
    name: 'Speak About the Photo: fluent visual descriptions',
    kind: 'YouTube · speaking',
    detail: 'Practise describing people, places, actions and relationships with detail and natural fluency.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Speak+About+the+Photo+practice',
  },
  {
    name: 'Read, Then Speak: organise an extended response',
    kind: 'YouTube · speaking',
    detail: 'Turn a written prompt into a structured spoken answer with a clear point, support and examples.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Read+Then+Speak+practice',
  },
  {
    name: 'Interactive Speaking: follow-up response drills',
    kind: 'YouTube · speaking',
    detail: 'Practise responding directly, extending ideas and maintaining coherence across follow-up questions.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Interactive+Speaking+practice+new+format',
  },
  {
    name: 'Speaking Sample: extended responses and delivery',
    kind: 'YouTube · speaking',
    detail: 'Improve response organisation, pronunciation, pace, clarity and the development of examples.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+Speaking+Sample+high+score+examples',
  },
  {
    name: 'Advanced vocabulary for 145–160 performance',
    kind: 'YouTube · vocabulary',
    detail: 'Build precise academic and general vocabulary through meaning, collocations and use in context.',
    url: 'https://www.youtube.com/results?search_query=advanced+English+vocabulary+for+Duolingo+English+Test+145+160',
  },
  {
    name: 'Academic grammar and complex sentence control',
    kind: 'YouTube · grammar',
    detail: 'Review clauses, agreement, tense consistency, articles, prepositions and sentence variety.',
    url: 'https://www.youtube.com/results?search_query=advanced+English+grammar+for+Duolingo+English+Test',
  },
  {
    name: 'Pronunciation, stress and connected speech',
    kind: 'YouTube · pronunciation',
    detail: 'Practise word stress, sentence stress, intonation and clear connected speech.',
    url: 'https://www.youtube.com/results?search_query=English+pronunciation+stress+intonation+connected+speech+advanced',
  },
  {
    name: 'Fluency: speak naturally without long pauses',
    kind: 'YouTube · fluency',
    detail: 'Develop idea generation, linking expressions, pacing and confident spontaneous speech.',
    url: 'https://www.youtube.com/results?search_query=English+speaking+fluency+advanced+spontaneous+speaking+practice',
  },
  {
    name: 'Timed DET practice tests and exam simulations',
    kind: 'YouTube · mock tests',
    detail: 'Watch complete practice simulations and practise managing time across mixed question types.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+full+mock+test+2026',
  },
  {
    name: 'DET scoring criteria and response analysis',
    kind: 'YouTube · scoring',
    detail: 'Understand how language proficiency, content, coherence and delivery affect performance.',
    url: 'https://www.youtube.com/results?search_query=Duolingo+English+Test+scoring+criteria+response+analysis',
  },
  {
    name: 'Academic listening: lectures and note-taking',
    kind: 'YouTube · academic English',
    detail: 'Listen for claims, supporting details, examples and transitions in short academic talks.',
    url: 'https://www.youtube.com/results?search_query=academic+English+listening+lecture+note+taking+practice',
  },
  {
    name: 'Critical reading: inference and evidence',
    kind: 'YouTube · academic English',
    detail: 'Practise distinguishing facts from opinions, drawing inferences and locating textual evidence.',
    url: 'https://www.youtube.com/results?search_query=advanced+English+reading+comprehension+inference+evidence',
  },
  {
    name: 'BBC Learning English',
    kind: 'Audio · listening',
    detail: 'Short listening lessons, vocabulary and pronunciation practice.',
    url: 'https://www.bbc.co.uk/learningenglish',
  },
  {
    name: 'VOA Learning English',
    kind: 'Audio · reading',
    detail: 'Accessible news, slow-speed audio and transcripts.',
    url: 'https://learningenglish.voanews.com/',
  },
  {
    name: 'TED-Ed',
    kind: 'Video · critical thinking',
    detail: 'Short educational videos with ideas worth discussing.',
    url: 'https://ed.ted.com/',
  },
  {
    name: 'TED Talks',
    kind: 'Video · speaking',
    detail: 'Listen to structured arguments and practise summarising them.',
    url: 'https://www.ted.com/talks',
  },
  {
    name: 'Project Gutenberg',
    kind: 'Reading',
    detail: 'Free public-domain literature for reading fluency.',
    url: 'https://www.gutenberg.org/',
  },
  {
    name: 'Breaking News English',
    kind: 'Reading · listening',
    detail: 'Levelled news lessons with audio and comprehension activities.',
    url: 'https://breakingnewsenglish.com/',
  },
];
const mockItems = [
  {
    type: 'Read and Select',
    area: 'Reading',
    q: 'Select the real English word.',
    opts: ['meticulous', 'drandish', 'eloquent', 'plimsy'],
    a: [0, 2],
    seconds: 25,
  },
  {
    type: 'Fill in the Blanks',
    area: 'Reading',
    q: 'The findings were ___ with the original hypothesis.',
    opts: ['consistent', 'consistency', 'consistently', 'consisting'],
    a: 0,
    seconds: 45,
  },
  {    type: 'Listen and Type',
    area: 'Listening',
    q: 'Listen and type the sentence.',
    audio:
      'A thoughtful response considers evidence from more than one perspective.',
    seconds: 60,
  },
  {
    type: 'Interactive Reading',
    area: 'Reading',
    q: 'A city introduced protected cycling lanes. After one year, bicycle use increased and local shops reported more visitors. What is the best supported conclusion?',
    opts: [
      'Cycling lanes may benefit mobility and local commerce.',
      'All residents stopped using cars.',
      'The city reduced the number of shops.',
      'Cycling is the only form of transport.',
    ],
    a: 0,
    seconds: 90,
  },
  {
    type: 'Write About the Photo',
    area: 'Writing',
    q: 'Describe a busy outdoor market where vendors arrange fresh produce and customers compare prices.',
    seconds: 150,
    open: true,
  },
  {
    type: 'Interactive Listening',
    area: 'Listening',
    q: 'A student says the group presentation is too long. The tutor suggests removing repeated examples and keeping the strongest evidence. What should the group do?',
    opts: [
      'Add more examples.',
      'Remove repetition and prioritise strong evidence.',
      'Cancel the presentation.',
      'Speak more slowly without editing.',
    ],
    a: 1,
    seconds: 90,
  },
  {
    type: 'Read and Complete',
    area: 'Reading',
    q: 'Complete the missing word: Effective communication depends on careful listen___ and thoughtful responses.',
    expected: 'listening',
    seconds: 90,
  },
  {
    type: 'Interactive Speaking',
    area: 'Speaking',
    q: 'What makes a team work effectively when members disagree?',
    seconds: 120,
    open: true,
  },
  {
    type: 'Interactive Writing',
    area: 'Writing',
    q: 'Should schools require students to complete community service? Present a position and support it with reasons.',
    seconds: 210,
    open: true,
  },
  {
    type: 'Listen and Type',
    area: 'Listening',
    q: 'Listen and type the sentence.',
    audio:
      'The committee postponed its decision until further evidence became available.',
    seconds: 60,
  },
  {
    type: 'Speak About the Photo',
    area: 'Speaking',
    q: 'Describe a group of learners discussing a map during an outdoor field activity.',
    seconds: 120,
    open: true,
  },
  {
    type: 'Fill in the Blanks',
    area: 'Reading',
    q: 'The speaker offered a ___ explanation that addressed the audience’s concerns.',
    opts: ['comprehensive', 'comprehend', 'comprehension', 'comprehensively'],
    a: 0,
    seconds: 45,
  },
  {
    type: 'Read, Then Speak',
    area: 'Speaking',
    q: 'Is curiosity more important than intelligence in learning? Explain your view with examples.',
    seconds: 150,
    open: true,
  },
  {
    type: 'Interactive Reading',
    area: 'Reading',
    q: 'Researchers found that students who explained ideas to peers remembered concepts longer. What does this suggest?',
    opts: [
      'Teaching others can reinforce learning.',
      'Group work always replaces reading.',
      'Memory cannot be improved.',
      'Only advanced students benefit.',
    ],
    a: 0,
    seconds: 90,
  },
  {
    type: 'Writing Sample',
    area: 'Writing',
    q: 'Describe a challenge in your community and propose a realistic solution.',
    seconds: 210,
    open: true,
  },
  {
    type: 'Interactive Speaking',
    area: 'Speaking',
    q: 'How would you persuade classmates to participate in a new school initiative?',
    seconds: 120,
    open: true,
  },
  {
    type: 'Listen and Type',
    area: 'Listening',
    q: 'Listen and type the sentence.',
    audio:
      'Students benefit when feedback is specific, timely, and actionable.',
    seconds: 60,
  },
  {
    type: 'Speaking Sample',
    area: 'Speaking',
    q: 'Describe an experience that changed how you understand leadership.',
    seconds: 180,
    open: true,
  },
];
const bankTopics = [
  "urban transport and public space",
  "community libraries and digital access",
  "renewable energy in rural communities",
  "biodiversity and conservation",
  "public health communication",
  "financial literacy for young adults",
  "agricultural innovation and food security",
  "water conservation and sanitation",
  "artificial intelligence in education",
  "language learning and memory",
  "ethical leadership in organisations",
  "inclusive design in public services",
  "climate adaptation in African cities",
  "entrepreneurship and local markets",
  "scientific research and evidence",
  "teamwork in multicultural settings",
  "the value of public parks",
  "media literacy and misinformation",
  "vocational education and employment",
  "historic preservation and tourism",
  "ocean pollution and coastal livelihoods",
  "mental health awareness at school",
  "the role of museums in society",
  "remote work and collaboration",
  "the impact of sleep on learning",
  "public transport affordability",
  "responsible use of social media",
  "the importance of early childhood reading",
  "community-based tourism",
  "the economics of recycling",
  "urban farming and nutrition",
  "disaster preparedness and resilience",
  "the future of electric mobility",
  "language diversity and identity",
  "open educational resources",
  "water harvesting in dry seasons",
  "the role of debate in critical thinking",
  "digital privacy and personal data",
  "the benefits of physical activity",
  "women in science and technology",
  "local manufacturing and supply chains",
  "the history of public health",
  "wildlife corridors and land use",
  "sustainable building materials",
  "the value of volunteering",
  "accessibility in higher education",
  "the psychology of motivation",
  "research ethics and consent",
  "community radio and civic information",
  "the relationship between art and science"
];
const expandedMockBank = Array.from({ length: 200 }, (_, i) => {
  const topic = bankTopics[i % bankTopics.length];
  const difficulty = 1 + (Math.floor(i / 40) % 5);
  const variant = Math.floor(i / 50);
  if (variant === 0) {
    return {
      id: 'bank-reading-' + i,
      type: 'Interactive Reading',
      area: 'Reading',
      difficulty,
      q: 'A short research summary examines ' + topic + '. Which conclusion is most reasonable?',
      opts: [
        'The topic can be understood by considering evidence, context and possible trade-offs.',
        'The topic has no relationship to people or communities.',        'One example proves that every situation has the same outcome.',
        'Further evidence is never useful when discussing this topic.',
      ],
      a: 0,
      seconds: 75,
    };
  }
  if (variant === 1) {
    const audio = 'Researchers examining ' + topic + ' emphasised the importance of reliable evidence, careful planning, and cooperation among local communities.';
    return {
      id: 'bank-listening-' + i,
      type: 'Listen and Type',
      area: 'Listening',
      difficulty,
      q: 'Listen carefully and type the sentence exactly as you hear it.',
      audio,
      expected: audio.toLowerCase(),
      seconds: 75,
    };
  }
  if (variant === 2) {
    return {
      id: 'bank-writing-' + i,
      type: 'Writing Sample',
      area: 'Writing',
      difficulty,
      q: 'Explain why ' + topic + ' matters. Develop a clear position, support it with a relevant example, and consider one possible limitation or alternative perspective.',
      open: true,
      seconds: 150,
    };
  }
  return {
    id: 'bank-speaking-' + i,
    type: 'Speaking Sample',
    area: 'Speaking',
    difficulty,
    q: 'Speak about ' + topic + '. Explain the issue, give a specific example, and describe what you think should happen next.',
    open: true,
    seconds: 120,
  };
});
const allMockItems = [...mockItems, ...expandedMockBank];

const targetScore = 145;
const initialProgress: Record<string, number> = {};
function estimateObjective(answer: string, item: any) {
  if (item.a instanceof Array) {
    const chosen = answer.split(',').map(Number);
    return chosen.length === item.a.length &&
      chosen.every((n: number) => item.a.includes(n))
      ? 100
      : Math.max(
          0,
          100 -
            Math.abs(chosen.length - item.a.length) * 20 -
            chosen.filter((n: number) => !item.a.includes(n)).length * 35
        );
  }
  if (typeof item.a === 'number') return Number(answer) === item.a ? 100 : 0;
  return answer.trim().toLowerCase() === item.expected ? 100 : 0;
}
function App() {
  const [tab, setTab] = useState('Home');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [assessmentStage, setAssessmentStage] = useState('baseline');
  const [assessmentType, setAssessmentType] = useState('baseline');
  const [active, setActive] = useState<Skill | null>(null);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [mock, setMock] = useState(false);
  const [mockIndex, setMockIndex] = useState(0);
  const [mockAnswer, setMockAnswer] = useState('');
  const [mockSelected, setMockSelected] = useState<number[]>([]);
  const [mockSeconds, setMockSeconds] = useState(45 * 60);
  const [mockScores, setMockScores] = useState<any[]>([]);
  const [difficulty, setDifficulty] = useState(2);
  const [mockDone, setMockDone] = useState(false);
  const [recording, setRecording] = useState(false);
  const [media, setMedia] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [notice, setNotice] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [integrityWarning, setIntegrityWarning] = useState('');
  const [warningCount, setWarningCount] = useState(0);
  const warningOpenRef = useRef(false);
  const cameraPreviewRef = useRef<HTMLVideoElement | null>(null);
  const [user, setUser] = useState<any>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [sessionItems, setSessionItems] = useState<any[]>(mockItems);
  const [guestMode, setGuestMode] = useState(false);
  const [studentPreview, setStudentPreview] = useState(false);
  const [cohort, setCohort] = useState('');
  const [needsCohort, setNeedsCohort] = useState(false);
  const [assignedMaterials, setAssignedMaterials] = useState<any[]>([]);
  const isTeacherAccount = String(user?.email || '').toLowerCase() === 'manasse@icircles.rw';
  const isTeacher = isTeacherAccount && !studentPreview;
  useEffect(() => { if (user && isTeacher) setTab('Teacher dashboard'); }, [user?.userId, isTeacher]);
  useEffect(() => {
    let mounted = true;
    auth.getUser().then(async current => {
      if (!mounted) return;
      setUser(current);
      if (current) {
        try {
          const [{ data }, journey, report, profile, assigned] = await Promise.all([
            api.get('/api/progress'),
            api.get('/api/journey'),
            api.get('/api/my-report'),
            api.get('/api/profile'),
            api.get('/api/assignments'),
          ]);
          if (mounted && data.progress) setProgress(data.progress);
          if (mounted) setAssessmentStage(journey.data.stage || 'baseline');
          if (mounted) setHistory((report.data.assessments || []).sort((a: any,b: any)=>b.createdAt-a.createdAt).map((x: any)=>({...x,date:new Date(x.createdAt).toISOString()})));
          if (mounted) { setCohort(profile.data.cohort || ''); setNeedsCohort(!profile.data.cohort && String(current.email || '').toLowerCase() !== 'manasse@icircles.rw'); setAssignedMaterials(assigned.data.assignments || []); }
          if (mounted) setCloudLoaded(true);
        } catch {
          if (mounted) setNotice('Your account is signed in, but cloud progress could not be loaded.');
        }
      }
      if (mounted) setAccountReady(true);
    }).catch(() => { if (mounted) setAccountReady(true); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (user && accountReady && cloudLoaded) {
      api.post('/api/progress', { progress }).catch(() =>
        setNotice('Progress remains saved on this device. Cloud sync will retry next time you practise.')
      );
    }
  }, [progress, user, accountReady, cloudLoaded]);
  useEffect(() => {
    if (!mock || mockDone) return;
    const t = setInterval(() => setMockSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [mock, mockDone]);
  useEffect(() => {
    if (!cameraStream || !cameraPreviewRef.current) return;
    cameraPreviewRef.current.srcObject = cameraStream;
    cameraPreviewRef.current.play().catch(() => {});
  }, [cameraStream, mock]);
  useEffect(() => {
    if (!mock) return;
    const warn = (message: string) => {
      if (warningOpenRef.current) return;
      warningOpenRef.current = true;
      setWarningCount(count => count + 1);
      setIntegrityWarning(message);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') warn('You left the test tab or switched to another window. Return to the test and keep your attention on the screen. Your practice test has not been cancelled.');
    };
    const onBlur = () => warn('The test window lost focus. Keep the test window active and avoid using other applications. Your practice test will continue.');
    const onFullscreen = () => {
      if (!document.fullscreenElement) warn('Full-screen mode was exited. Return to full-screen mode and continue your practice test.');
    };
    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      warn('Pasting answers is not allowed in DET-style practice. Write your response independently. Your practice test will continue.');
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ['c', 'v', 'x'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        warn('Copying, cutting or pasting during the test is not allowed in DET-style practice. Continue with your own response.');
      }
    };
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      warn('Keep the test focused and do not use browser context-menu tools during this practice session.');
    };
    const videoTrack = cameraStream?.getVideoTracks()[0];
    const onCameraEnded = () => warn('The camera feed has stopped. Check your camera connection and allow access again before your next practice test. This session is not cancelled.');
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('blur', onBlur);
    window.addEventListener('keydown', onKeyDown);
    videoTrack?.addEventListener('ended', onCameraEnded);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('keydown', onKeyDown);
      videoTrack?.removeEventListener('ended', onCameraEnded);
    };
  }, [mock, cameraStream]);
  useEffect(() => {
    if (mock && mockSeconds === 0 && !mockDone) finishMock();
  }, [mockSeconds, mock, mockDone]);
  const completed = skills.filter(s => (progress[s.id] || 0) >= 70).length;
  const average = skills.length
    ? Math.round(
        skills.reduce((n, s) => n + (progress[s.id] || 0), 0) / skills.length      )
    : 0;
  const estimated = Math.min(
    160,
    Math.max(10, Math.round((85 + average * 0.75) / 5) * 5)
  );
  const saveCohort = async () => {
    if (!cohort) return;
    try { await api.post('/api/profile', { cohort }); setNeedsCohort(false); setNotice('Welcome to ISOMO Academy. Your cohort has been saved.'); }
    catch { setNotice('We could not save your cohort. Please try again.'); }
  };
  const updateJourney = (stage: string) => {
    setAssessmentStage(stage);
    if (user) api.post('/api/journey', { stage }).catch(() => setNotice('Your learning stage could not be synced. Please refresh while signed in.'));
  };
  const saveSkillScore = (skillId: string, score: number) => {
    setProgress(p => ({ ...p, [skillId]: Math.max(p[skillId] || 0, score) }));
    api.post('/api/activity', { activityType: 'skill_practice', skill: skillId, score }).catch(() => {});
    const attempted = new Set([...Object.keys(progress).filter(k => skills.some(s => s.id === k)), skillId]);
    if (assessmentStage === 'skills' && attempted.size >= skills.length) updateJourney('endline');
    else if (assessmentStage === 'skills' && attempted.size >= Math.ceil(skills.length / 2)) updateJourney('midline');
  };
  const startSkill = (s: Skill) => {
    if (studentPreview) { setNotice('Student preview is read-only. Sign in with a student account to complete practice and save scores.'); return; }
    if (!user) { setNotice('Please sign in before starting your private baseline assessment and saving your progress.'); return; }
    if (['baseline','midline','endline'].includes(assessmentStage)) { beginMock(assessmentStage); return; }
    setActive(s);
    setAnswer('');
    setChecked([]);
    setResult(null);
    setAudioUrl('');
    setTab('Practice');
  };
  const assess = async (
    kind: string,
    prompt: string,
    response: string,
    audioBase64?: string,
    mimeType?: string
  ) => {
    setBusy(true);
    setResult(null);
    try {
      const { data } = await api.post('/api/assess', {
        kind,
        prompt,
        response,
        audio: audioBase64,
        mimeType,
      });
      setResult(data as Result);
      return data as Result;
    } catch (e) {
      setNotice(
        'AI feedback is temporarily unavailable. Your answer is saved locally; please try the assessment again.'
      );
      const fallback: Result = {
        score: Math.max(
          35,
          Math.min(80, Math.round(response.trim().split(/\s+/).length * 1.4))
        ),
        feedback:
          'A local practice estimate is shown because the AI assessor could not be reached. This is not a calibrated DET score. Review the task rubric and try again.',
        strengths: ['You attempted the task.'],
        improvements: [
          'Retry AI feedback when the connection is available.',
          'Develop your response with specific details and examples.',
        ],
      };
      setResult(fallback);
      return fallback;
    } finally {
      setBusy(false);
    }
  };
  const submitSkill = async () => {
    if (!active) return;
    if (
      [
        'read-select',
        'fill-blanks',
        'interactive-reading',
        'interactive-listening',
        'read-complete',
        'listen-type',
      ].includes(active.id)
    ) {
      const score =
        active.id === 'read-select'
          ? checked.includes(0) && checked.includes(2) && checked.length === 2
            ? 100
            : Math.max(0, 100 - checked.length * 20)
          : estimateObjective(answer, { a: active.answer });
      setResult({
        score,
        feedback:
          score >= 80
            ? 'Strong accuracy. Keep practising under strict time limits.'
            : 'Review the explanation, identify the clue you missed, and try a new item.',
        strengths:
          score >= 80
            ? ['Accurate recognition and interpretation.']
            : ['You completed the exercise.'],
        improvements:
          score >= 80
            ? ['Increase speed without sacrificing accuracy.']
            : [
                'Look for grammatical and contextual clues before selecting an answer.',
              ],
      });
      saveSkillScore(active.id, score);
    } else {
      const evaluation = await assess(
        active.area === 'Writing' ? 'writing' : 'speaking',
        active.prompt,
        answer
      );
      if (evaluation) saveSkillScore(active.id, evaluation.score);
    }
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: recorder.mimeType || 'audio/webm',
        });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setMedia(recorder);
      setRecording(true);
    } catch {
      setNotice(
        'Microphone access is unavailable. You can type your spoken response in the answer box instead.'
      );
    }
  };
  const stopRecording = () => {
    if (media && media.state !== 'inactive') {
      media.stop();
      setRecording(false);
    }
  };
  const scoreRecording = async () => {
    if (!audioUrl || !active) return;
    setBusy(true);
    setResult(null);
    try {
      const blob = await (await fetch(audioUrl)).blob();
      if (blob.size > 1900000) {
        setNotice(
          'This recording is too large to assess. Record a shorter answer (under about 90 seconds).'
        );
        setBusy(false);
        return;
      }
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      await assess(
        'speaking',
        active.prompt,
        'Recorded spoken response',
        base64,
        blob.type
      );
    } catch {
      setNotice(
        'Could not process the recording. Please try again or type your response.'
      );
      setBusy(false);
    }
  };
  const beginMock = async (requestedStage?: string) => {
    if (studentPreview) { setNotice('Student preview is read-only. Use a student account to take assessments and save results.'); return; }
    if (!user) { setNotice('Please sign in before starting an adaptive assessment. Your results are private to your account.'); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setNotice('A camera is required for this practice simulation. Open the app in a browser with camera support and try again.'); return; }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    } catch {
      setNotice('Camera access is needed to start the DET-style practice test. Allow camera permission in your browser settings, then try again. The camera preview stays on this device and is not recorded or uploaded.');
      return;
    }
    cameraStream?.getTracks().forEach(track => track.stop());
    setCameraStream(stream);
    warningOpenRef.current = false;
    setIntegrityWarning('');
    setWarningCount(0);
    let fullscreenFailed = false;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();    } catch {
      fullscreenFailed = true;
    }
    const stage = requestedStage || (['baseline','midline','endline'].includes(assessmentStage) ? assessmentStage : 'practice');
    setAssessmentType(stage);
    api.post('/api/activity', { activityType: 'test_started', details: stage }).catch(() => {});
    const balanced = ['Reading', 'Listening', 'Writing', 'Speaking'].flatMap(area => {
      const pool = allMockItems.filter(item => item.area === area).sort(() => Math.random() - 0.5);
      return pool.slice(0, 5);
    }).sort(() => Math.random() - 0.5);
    setSessionItems(balanced);
    setMock(true);
    setMockDone(false);
    setMockIndex(0);
    setMockSeconds(2700);
    setMockScores([]);
    setDifficulty(2);
    setMockAnswer('');
    setMockSelected([]);
    setTab('Mock test');
    if (fullscreenFailed) {
      warningOpenRef.current = true;
      setWarningCount(1);
      setIntegrityWarning('Your browser did not allow full-screen mode. Use the full-screen control if available and keep this test window active. Your practice test will continue.');
    }
  };
  const currentMock = sessionItems[mockIndex];
  const submitMock = async () => {
    if (!currentMock) return;
    let score = 0;
    if (currentMock.open) {
      const evaluation = await assess(
        currentMock.area === 'Writing' ? 'writing' : 'speaking',
        currentMock.q,
        mockAnswer
      );
      score = evaluation?.score ?? Math.min(85, Math.max(30, mockAnswer.trim().split(/\s+/).length * 2));
    } else if (currentMock.type === 'Read and Select')
      score = estimateObjective(mockSelected.join(','), { a: currentMock.a });
    else if (currentMock.expected)
      score = estimateObjective(mockAnswer, { expected: currentMock.expected });
    else score = estimateObjective(mockAnswer, { a: currentMock.a });
    const itemScore = {
      type: currentMock.type,
      area: currentMock.area,
      score: Math.round(score),
      difficulty,
    };
    const updated = [...mockScores, itemScore];
    setMockScores(updated);
    const nextDifficulty = Math.max(1, Math.min(5, difficulty + (score >= 75 ? 1 : -1)));
    setDifficulty(nextDifficulty);
    if (mockIndex < sessionItems.length - 1) {
      setSessionItems(items => {
        const next = [...items];
        const nextArea = next[mockIndex + 1].area;
        const used = new Set(next.slice(0, mockIndex + 1).map((x: any) => x.id || x.q));
        const candidates = allMockItems.filter((x: any) =>
          x.area === nextArea && x.difficulty === nextDifficulty && !used.has(x.id || x.q)
        );
        if (candidates.length) next[mockIndex + 1] = candidates[Math.floor(Math.random() * candidates.length)];
        return next;
      });
    }
    setMockAnswer('');
    setMockSelected([]);
    if (mockIndex >= sessionItems.length - 1) {
      setMockScores(updated);
      finishMock(updated);
    } else setMockIndex(i => i + 1);
  };
  const finishMock = (scores = mockScores) => {
    setMockDone(true);
    setMock(false);
    cameraStream?.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    warningOpenRef.current = false;
    setIntegrityWarning('');
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    const data = scores.length ? scores : mockScores;
    const avg = data.length
      ? Math.round(
          data.reduce((n: any, x: any) => n + x.score, 0) / data.length
        )
      : 0;
    const by = (area: string) => {
      const a = data.filter((x: any) => x.area === area);
      return a.length
        ? Math.round(a.reduce((n: any, x: any) => n + x.score, 0) / a.length)
        : 0;
    };
    const overall = Math.min(
      160,
      Math.max(10, Math.round((85 + avg * 0.75) / 5) * 5)
    );
    const report = {
      date: new Date().toISOString(),
      stage: assessmentType,
      overall,
      reading: Math.round((85 + by('Reading') * 0.75) / 5) * 5,
      listening: Math.round((85 + by('Listening') * 0.75) / 5) * 5,
      writing: Math.round((85 + by('Writing') * 0.75) / 5) * 5,
      speaking: Math.round((85 + by('Speaking') * 0.75) / 5) * 5,
      items: data,
    };
    const recommendations = ['Reading','Listening','Writing','Speaking'].map(area => ({ area, score: report[area.toLowerCase()] })).sort((a,b)=>a.score-b.score).slice(0,2).map(x => x.area + ': prioritise timed practice and review errors (current practice estimate ' + x.score + '/160).');
    api.post('/api/assessment', { stage: assessmentType, overall, reading: report.reading, listening: report.listening, writing: report.writing, speaking: report.speaking, items: data, recommendations }).catch(() => setNotice('The assessment is complete, but its cloud report could not be saved. Please retry sync.'));
    api.post('/api/activity', { activityType: 'test_completed', details: assessmentType, score: avg }).catch(() => {});
    if (assessmentType === 'baseline' || assessmentType === 'midline') updateJourney('skills');
    if (assessmentType === 'endline') updateJourney('complete');
    setHistory(h => [report, ...h].slice(0, 20));
    setTab('Results');
  };
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.88;
      speechSynthesis.speak(u);
    }
  };
  const nav = [
    ['Home', Home],
    ['Skill practice', BookOpen],
    ['Learning library', GraduationCap],
    ['Mock test', Target],
    ['Results', BarChart3],
    ['Teacher dashboard', GraduationCap],
  ] as const;
  const go = (name: string) => {
    if (studentPreview && ['Skill practice','Mock test','Results'].includes(name)) { setNotice('Student preview is read-only. Sign in with a student account to practise, take tests and view private progress.'); return; }
    if (isTeacher && name !== 'Teacher dashboard') { setNotice('The teacher workspace is separate. Teachers manage learners and assign materials here; tests and student lessons are not available on teacher accounts.'); return; }
    if (['Skill practice','Mock test','Results'].includes(name) && !user) { setNotice('Create a student account or sign in to practise and save your private progress.'); return; }
    if (['Skill practice','Mock test','Results'].includes(name) && ['baseline','midline','endline'].includes(assessmentStage)) { beginMock(assessmentStage); return; }
    setTab(name);
    setActive(null);
    setResult(null);
  };
  if (!accountReady) return <div className="entry-screen"><div className="entry-card"><img className="entry-logo" src="https://www.isomo-rw.com/wp-content/uploads/2024/01/isomo_academy_white-logo-1024x471.png" alt="Isomo Academy"/><p>Preparing your learning space…</p></div></div>;
  if (!user && !guestMode) return <div className="entry-screen"><div className="entry-card"><img className="entry-logo" src="https://www.isomo-rw.com/wp-content/uploads/2024/01/isomo_academy_white-logo-1024x471.png" alt="Isomo Academy"/><div className="eyebrow dark">DUOLINGO ENGLISH TEST · 145–160</div><h1>How would you like to enter?</h1><p>Choose the space that matches your role. Student accounts keep individual progress private; teacher access is separately restricted.</p><div className="entry-options"><button className="entry-option" onClick={async () => { try { await auth.signInWithRedirect(); } catch { setNotice('Student sign-in could not start. Please retry.'); } }}><strong>I'm a student</strong><span>Sign in with Google or create an account using email to access lessons, tests and your personal progress.</span></button><button className="entry-option" onClick={async () => { try { await auth.signInWithRedirect(); } catch { setNotice('Teacher sign-in could not start. Please retry.'); } }}><strong>I'm a teacher</strong><span>Open the management portal. Teacher access is limited to the authorised ISOMO administrator.</span></button><button className="entry-option guest-option" onClick={() => { setGuestMode(true); setTab('Home'); }}><strong>Use without logging in</strong><span>Explore the public learning library and preview the study approach. Tests and personal progress require a student account.</span></button></div><small>Signing in supports Google and email account access. You can browse public materials as a guest.</small></div></div>;
  if (user && !isTeacher && needsCohort) return <div className="entry-screen"><div className="entry-card"><div className="eyebrow dark">STUDENT PROFILE · REQUIRED</div><h1>Which cohort are you part of?</h1><p>Select your programme group to help your teacher organise learning and support. Your individual records remain private to you and the authorised teacher.</p><select className="teacher-input" value={cohort} onChange={e => setCohort(e.target.value)}><option value="">Select your cohort</option>{['Cohort I','Cohort II','Cohort III','Cohort IV','Cohort V','Cohort VI','Cohort VII','Isomo Circles','IRIS'].map(x => <option key={x} value={x}>{x}</option>)}</select><button className="btn primary full" disabled={!cohort} onClick={saveCohort}>Continue to learning</button></div></div>;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="isomo-logo" src="https://www.isomo-rw.com/wp-content/uploads/2024/01/isomo_academy_white-logo-1024x471.png" alt="Isomo Academy" />
        </div>
        <div className="side-label">LEARNING SPACE</div>
        {(isTeacher ? nav.filter(([name]) => name === 'Teacher dashboard') : nav.filter(([name]) => name !== 'Teacher dashboard' && (!guestMode || ['Home','Learning library'].includes(name)))).map(([name, Icon]) => (
          <button
            key={name}
            className={'nav-item ' + (tab === name ? 'selected' : '')}
            onClick={() => go(name)}
          >
            <Icon size={18} />
            <span>{name}</span>
            {name === 'Mock test' && <span className="nav-tag">45 min</span>}
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="goal-card">
            <div className="goal-icon">
              <Target size={18} />
            </div>
            <strong>Your target</strong>
            <div className="goal-number">145–160</div>
            <p>Build the skills. Trust your preparation.</p>
          </div>
          <a
            className="side-link"
            href="https://www.isomo-rw.com/isomo-academy/"
            target="_blank"
            rel="noreferrer"
          >
            Isomo Academy <ExternalLink size={13} />
          </a>
        </div>
      </aside>
      <main className="main">
        {studentPreview && <div className="note-box" style={{margin:'14px 24px 0',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><span><strong>Student preview · Read only</strong><br/>You are viewing the learner experience. Practice submissions, tests and student data changes are disabled.</span><button className="btn outline" onClick={() => { setStudentPreview(false); setTab('Teacher dashboard'); setNotice('You have returned to the teacher management portal.'); }}>Return to teacher portal</button></div>}
        <header className="topbar">
          <div className="mobile-brand">
            <img className="isomo-logo mobile-logo" src="https://www.isomo-rw.com/wp-content/uploads/2024/01/isomo_academy_white-logo-1024x471.png" alt="Isomo Academy" />
          </div>
          <div className="breadcrumb">
            Learning space <ChevronRight size={14} /> <b>{tab}</b>
          </div>
          <div className="top-right">
            {user ? <button className="account-button" onClick={async () => { await auth.signOut(); setUser(null); setProgress({}); setHistory([]); setAssessmentStage('baseline'); setCloudLoaded(false); setAccountReady(true); setNeedsCohort(false); setGuestMode(false); setTab('Home'); }}>Sign out · {user.name || user.email || 'Account'}</button> : <button className="account-button" onClick={() => { setGuestMode(false); setAccountReady(true); }}>Choose access</button>}
            <span className="streak">
              <Sparkles size={15} /> Aim higher, every day
            </span>
            <div className="avatar">IA</div>
          </div>
        </header>
        {notice && (
          <div className="notice">
            {notice}
            <button onClick={() => setNotice('')}>
              <X size={14} />            </button>
          </div>
        )}
        {integrityWarning && mock && (
          <div className="integrity-overlay">
            <div className="integrity-dialog" role="alertdialog" aria-modal="true" aria-labelledby="integrity-title">
              <div className="integrity-icon">!</div>
              <div className="eyebrow dark">PRACTICE INTEGRITY REMINDER</div>
              <h2 id="integrity-title">Please follow the test rules</h2>
              <p>{integrityWarning}</p>
              <small>Warning {warningCount} · This is an ISOMO practice simulation. No automatic cancellation.</small>
              <button className="btn primary full" onClick={() => { warningOpenRef.current = false; setIntegrityWarning(''); }}>I understand — continue test</button>
            </div>
          </div>
        )}
        {isTeacher && tab === 'Teacher dashboard' && <TeacherDashboard user={user} progress={{}} onViewAsStudent={() => { setStudentPreview(true); setTab('Home'); setNotice('You are viewing the student experience in read-only preview mode. No student scores or activity will be changed.'); }} />}
        {!isTeacher && tab === 'Home' && (
          <div className="page">
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span></span> YOUR ENGLISH, YOUR NEXT CHAPTER
                </div>
                <h1>
                  Prepare with purpose.
                  <br />
                  <em>Perform with confidence.</em>
                </h1>
                <p>
                  A complete Duolingo English Test preparation journey, built to
                  help you reach 145+ through deliberate practice, meaningful
                  feedback and steady progress.
                </p>
                <div className="hero-actions">
                  <button
                    className="btn primary"
                    onClick={() => go('Skill practice')}
                  >
                    Continue learning <ArrowRight size={17} />
                  </button>
                  <button className="btn ghost-light" onClick={beginMock}>
                    <Play size={15} /> Take 45-min mock
                  </button>
                </div>
                <div className="hero-foot">
                  <span>
                    <CheckCircle2 size={14} /> Original practice questions
                  </span>
                  <span>
                    <CheckCircle2 size={14} /> Instant skill feedback
                  </span>
                </div>
              </div>
              <div className="hero-art">
                <div className="orbit orbit-one"></div>
                <div className="orbit orbit-two"></div>
                <div className="hero-medal">
                  <Award size={38} />
                  <strong>145+</strong>
                  <span>YOUR TARGET</span>
                </div>
                <div className="float-card card-a">
                  <BookOpen size={17} />
                  <span>Read deeply</span>
                </div>
                <div className="float-card card-b">
                  <Mic size={17} />
                  <span>Speak boldly</span>
                </div>
                <div className="float-card card-c">
                  <PenLine size={17} />
                  <span>Write clearly</span>
                </div>
              </div>
            </section>
            {assessmentStage !== 'complete' && <div className="panel focus-panel" style={{marginBottom:24}}>
              <div className="eyebrow dark">YOUR ASSESSMENT PATHWAY</div>
              <h3>{assessmentStage === 'baseline' ? 'Start with your baseline assessment' : assessmentStage === 'midline' ? 'Midline checkpoint: measure your growth' : assessmentStage === 'endline' ? 'Endline assessment: demonstrate your progress' : 'Skill development in progress'}</h3>
              <p>{assessmentStage === 'baseline' ? 'Before lessons and practice, complete a 45-minute adaptive diagnostic covering reading, listening, writing and speaking. It establishes your starting point.' : assessmentStage === 'midline' ? 'You have completed half of the skill pathway. Take the adaptive midline assessment before continuing.' : 'You have completed the skill pathway. Take the final 45-minute adaptive assessment to measure growth from baseline.'}</p>
              <button className="btn primary" onClick={() => ['baseline','midline','endline'].includes(assessmentStage) ? beginMock(assessmentStage) : go('Skill practice')}>{assessmentStage === 'baseline' ? 'Begin baseline test' : assessmentStage === 'midline' ? 'Begin midline test' : assessmentStage === 'endline' ? 'Begin endline test' : 'Continue skill practice'} <ArrowRight size={16}/></button>
            </div>}
            <div className="section-heading">
              <div>
                <div className="eyebrow dark">YOUR LEARNING OVERVIEW</div>
                <h2>Small steps. Strong results.</h2>
              </div>
              <button className="text-button" onClick={() => go('Results')}>
                View progress <ArrowRight size={15} />
              </button>
            </div>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon teal">
                  <BookOpen />
                </div>
                <div className="stat-label">Skills mastered</div>
                <div className="stat-value">
                  {completed}
                  <small> / {skills.length}</small>
                </div>
                <div className="mini-track">
                  <span
                    style={{ width: (completed / skills.length) * 100 + '%' }}
                  />
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon gold">
                  <BarChart3 />
                </div>
                <div className="stat-label">Practice average</div>
                <div className="stat-value">
                  {average}
                  <small> / 100</small>
                </div>
                <div className="mini-track">
                  <span style={{ width: average + '%' }} />
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple">
                  <Trophy />
                </div>
                <div className="stat-label">Latest mock estimate</div>
                <div className="stat-value">
                  {history[0]?.overall || '—'}
                  <small> / 160</small>
                </div>
                <div className="stat-note">
                  {history.length
                    ? 'Latest practice result'
                    : 'Take your first mock test'}
                </div>
              </div>
            </section>
            <section className="two-col">
              <div className="panel">
                <div className="panel-head">
                  <div>
                    <div className="eyebrow dark">YOUR CURRICULUM</div>
                    <h3>Master every skill</h3>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => go('Skill practice')}
                  >
                    All skills <ArrowRight size={14} />
                  </button>
                </div>
                <div className="skill-list">
                  {skills.slice(0, 6).map(s => (
                    <button
                      className="skill-row"
                      key={s.id}
                      onClick={() => startSkill(s)}
                    >
                      <div className={'skill-icon ' + s.area.toLowerCase()}>
                        <s.icon size={18} />
                      </div>
                      <div className="skill-meta">
                        <strong>{s.title}</strong>
                        <span>
                          {s.area} · {s.time}
                        </span>
                      </div>
                      <div className="skill-progress">
                        <div className="mini-track">
                          <span
                            style={{ width: (progress[s.id] || 0) + '%' }}
                          />
                        </div>
                        <small>{progress[s.id] || 0}%</small>
                      </div>
                      <ChevronRight size={17} className="muted" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="panel focus-panel">
                <div className="eyebrow dark">YOUR PERSONAL RECOMMENDATION</div>
                <h3>{skills.reduce((a,b)=>(progress[a.id] ?? 101) <= (progress[b.id] ?? 101) ? a : b).title}</h3>
                <p>This is currently your lowest-scoring skill. Put extra effort into short, focused practice, analyse every error and repeat a new task until you can reach at least 80% consistently.</p>
                <div className="eyebrow dark">YOUR NEXT MILESTONE</div>
                <h3>One focused session can change your trajectory.</h3>
                <p>
                  Practise one skill, review your score, then return to the
                  skill that needs the most attention.
                </p>
                <div className="focus-stat">
                  <span>
                    {completed} of {skills.length} skills at 70%+
                  </span>
                  <strong>
                    {Math.round((completed / skills.length) * 100)}%
                  </strong>
                </div>
                <div className="mini-track large">
                  <span
                    style={{ width: (completed / skills.length) * 100 + '%' }}
                  />                </div>
                <button
                  className="btn primary full"
                  onClick={() => go('Skill practice')}
                >
                  Start a practice session <ArrowRight size={16} />
                </button>
                <div className="quote">
                  “Excellence is built through consistent, intentional
                  practice.”
                </div>
              </div>
            </section>
            <section className="resource-strip">
              <div className="resource-icon">
                <Headphones size={22} />
              </div>
              <div>
                <strong>Learn beyond the lesson</strong>
                <p>
                  Explore curated reading, listening and video resources from
                  trusted learning platforms.
                </p>
              </div>
              <button
                className="btn outline"
                onClick={() => go('Learning library')}
              >
                Explore resources <ArrowRight size={15} />
              </button>
            </section>
          </div>
        )}
        {!isTeacher && !guestMode && tab === 'Skill practice' && (
          <div className="page">
            <div className="page-intro">
              <div className="eyebrow dark">THE SKILL-BY-SKILL JOURNEY</div>
              <h1>Practise with intention.</h1>
              <p>
                Work through every task type. Each session ends with a score and
                clear next steps.
              </p>
            </div>
            <div className="area-heading">
              <h2>Reading</h2>
              <span>Comprehension · Vocabulary · Accuracy</span>
            </div>
            <div className="skill-cards">
              {skills
                .filter(s => s.area === 'Reading')
                .map(s => (
                  <SkillCard
                    key={s.id}
                    s={s}
                    progress={progress[s.id] || 0}
                    onClick={() => startSkill(s)}
                  />
                ))}
            </div>
            <div className="area-heading">
              <h2>Listening</h2>
              <span>Understanding · Detail · Interaction</span>
            </div>
            <div className="skill-cards">
              {skills
                .filter(s => s.area === 'Listening')
                .map(s => (
                  <SkillCard
                    key={s.id}
                    s={s}
                    progress={progress[s.id] || 0}
                    onClick={() => startSkill(s)}
                  />
                ))}
            </div>
            <div className="area-heading">
              <h2>Writing</h2>
              <span>Ideas · Organisation · Language control</span>
            </div>
            <div className="skill-cards">
              {skills
                .filter(s => s.area === 'Writing')
                .map(s => (
                  <SkillCard
                    key={s.id}
                    s={s}
                    progress={progress[s.id] || 0}
                    onClick={() => startSkill(s)}
                  />
                ))}
            </div>
            <div className="area-heading">
              <h2>Speaking</h2>
              <span>Fluency · Clarity · Pronunciation</span>
            </div>
            <div className="skill-cards">
              {skills
                .filter(s => s.area === 'Speaking')
                .map(s => (
                  <SkillCard
                    key={s.id}
                    s={s}
                    progress={progress[s.id] || 0}
                    onClick={() => startSkill(s)}
                  />
                ))}
            </div>
          </div>
        )}
        {!isTeacher && !guestMode && tab === 'Practice' && active && (
          <div className="page narrow">
            <button className="back-link" onClick={() => go('Skill practice')}>
              ← All skills
            </button>
            <div className="practice-head">
              <div className="practice-icon">
                <active.icon size={22} />
              </div>
              <div>
                <div className="eyebrow dark">
                  {active.area.toUpperCase()} PRACTICE
                </div>
                <h1>{active.title}</h1>
                <p>{active.desc}</p>
              </div>
              <span className="time-chip">
                <Clock3 size={14} />
                {active.time}
              </span>
            </div>
            <div className="practice-card">
              <div className="task-label">YOUR TASK</div>
              <h2>{active.task}</h2>
              <div className="prompt-box">{active.prompt}</div>
              {active.id === 'read-select' ? (
                <div className="word-grid">
                  {active.options?.map((o, i) => (
                    <button
                      key={o}
                      className={
                        'word-option ' + (checked.includes(i) ? 'chosen' : '')
                      }
                      onClick={() =>
                        setChecked(c =>
                          c.includes(i) ? c.filter(x => x !== i) : [...c, i]
                        )
                      }
                    >
                      {o}
                      {checked.includes(i) && <CheckCircle2 size={15} />}
                    </button>
                  ))}
                </div>
              ) : active.options ? (
                <div className="option-list">
                  {active.options.map((o, i) => (
                    <button
                      key={o}
                      className={
                        'option ' + (answer === String(i) ? 'chosen' : '')
                      }
                      onClick={() => setAnswer(String(i))}
                    >
                      <span>{String.fromCharCode(65 + i)}</span>
                      {o}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <textarea
                    className="answer-box"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder={
                      active.area === 'Writing'
                        ? 'Write your response here. Develop your ideas and use specific examples.'
                        : 'Type your spoken response here, or record your answer below.'
                    }
                  />
                  {active.area === 'Listening' &&
                    active.id === 'listen-type' && (
                      <button
                        className="audio-play"
                        onClick={() => speakText(active.sample || '')}
                      >
                        <Volume2 size={17} /> Play audio prompt
                      </button>
                    )}
                  {active.area === 'Speaking' && (
                    <div className="record-tools">
                      <button
                        className={'btn ' + (recording ? 'danger' : 'outline')}
                        onClick={recording ? stopRecording : startRecording}
                      >
                        {recording ? <Pause size={16} /> : <Mic size={16} />}{' '}
                        {recording ? 'Stop recording' : 'Record spoken answer'}
                      </button>
                      {audioUrl && (
                        <span className="record-ready">                          <CheckCircle2 size={15} /> Recording ready
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
              {active.sample && active.id === 'read-complete' && (
                <p className="hint">
                  Tip: identify word endings and grammatical patterns before
                  typing.
                </p>
              )}
              <button
                className="btn primary submit-btn"
                disabled={busy || (!answer.trim() && !checked.length)}
                onClick={
                  audioUrl && active.area === 'Speaking'
                    ? scoreRecording
                    : submitSkill
                }
              >
                {busy ? 'Assessing your response…' : 'Submit for score'}{' '}
                <ArrowRight size={16} />
              </button>
            </div>
            {result && (
              <div className="result-card">
                <div className="result-top">
                  <div>
                    <div className="eyebrow dark">YOUR PRACTICE RESULT</div>
                    <h2>Skill score</h2>
                  </div>
                  <div className="score-circle">
                    <strong>{result.score}</strong>
                    <span>/ 100</span>
                  </div>
                </div>
                <div className="result-track">
                  <span style={{ width: result.score + '%' }} />
                </div>
                <p>{result.feedback}</p>
                <div className="feedback-grid">
                  <div>
                    <strong>
                      <CheckCircle2 size={15} /> What went well
                    </strong>
                    {(result.strengths || []).map(x => (
                      <p key={x}>{x}</p>
                    ))}
                  </div>
                  <div>
                    <strong>
                      <Target size={15} /> What to improve
                    </strong>
                    {(result.improvements || []).map(x => (
                      <p key={x}>{x}</p>
                    ))}
                  </div>
                </div>
                <button
                  className="btn primary"
                  onClick={() => {
                    setActive(null);
                    setResult(null);
                    go('Skill practice');
                  }}
                >
                  Continue to next skill <ArrowRight size={16} />
                </button>
                <p className="score-disclaimer">
                  Practice rubric estimate only — not an official DET score.
                </p>
              </div>
            )}
          </div>
        )}
        {!isTeacher && tab === 'Learning library' && (
          <div className="page">
            <div className="page-intro">
              <div className="eyebrow dark">CURATED LEARNING COLLECTION</div>
              <h1>Bring English into every day.</h1>
              <p>
                Use authentic public resources to build vocabulary, understand
                different accents and develop ideas worth sharing.
              </p>
            </div>
            <div className="library-feature">
              <div className="library-feature-icon">
                <GraduationCap size={34} />
              </div>
              <div>
                <div className="eyebrow">A SMARTER STUDY ROUTINE</div>
                <h2>Read. Listen. Reflect. Respond.</h2>
                <p>
                  Follow Isomo's learning cycle: read an article, engage with related audio or video, read a second perspective, write a reflection, and discuss your ideas with peers.
                </p>
              </div>
            </div>
            {user && assignedMaterials.length > 0 && <div className="panel teacher-panel"><div className="eyebrow dark">ASSIGNED BY YOUR TEACHER</div><h2>Your learning assignments</h2><div className="resource-grid">{assignedMaterials.map((m: any) => <a key={m.id} className="resource-card" href={m.url} target="_blank" rel="noreferrer" onClick={() => api.post('/api/activity', { activityType: 'resource_opened', details: 'Assigned: ' + m.title }).catch(() => {})}><span className="resource-kind">{m.cohort}</span><strong>{m.title}</strong><p>{m.description}</p><span className="resource-open">Open assigned material <ExternalLink size={14}/></span></a>)}</div></div>}
            <div className="lesson-pathway"><div className="eyebrow dark">A KHAN ACADEMY-INSPIRED STUDY FLOW</div><h2>Watch a lesson. Practise a skill. Check your mastery.</h2><p>Short video input is followed by an active task, immediate feedback and a clear next step—not passive watching alone.</p><div className="lesson-video"><iframe src="https://www.youtube-nocookie.com/embed/VttOg1fbsa8" title="Official Duolingo English Test walkthrough 2025: all current question types" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div><div className="lesson-steps"><span>1 · Watch and note key ideas</span><span>2 · Summarise in your own words</span><span>3 · Complete a scored practice task</span><span>4 · Review feedback and retry</span></div></div>
            <div className="resource-grid">
              {resources.map(r => (
                <a
                  key={r.name}
                  className="resource-card"
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => api.post('/api/activity', { activityType: 'resource_opened', details: r.name }).catch(() => {})}
                >
                  <span className="resource-kind">{r.kind}</span>
                  <strong>{r.name}</strong>
                  <p>{r.detail}</p>
                  <span className="resource-open">
                    Open resource <ExternalLink size={14} />
                  </span>
                </a>
              ))}
            </div>
            <div className="note-box">
              <strong>Use resources actively</strong>
              <p>
                Do not only watch or read. Pause, summarise the main idea, note
                useful vocabulary and explain the content in your own words. All
                practice prompts in this app are original and are not live or
                leaked DET questions.
              </p>
            </div>
          </div>
        )}
        {!isTeacher && !guestMode && tab === 'Mock test' && (
          <div className="page narrow">
            <div className="page-intro">
              <div className="eyebrow dark">
                FULL-LENGTH PRACTICE SIMULATION
              </div>
              <h1>Test your readiness.</h1>
              <p>
                A timed 45-minute adaptive practice session sampled from a 218-item original practice bank across reading, listening, writing and speaking.
              </p>
            </div>
            {!mock && !mockDone ? (
              <div className="mock-intro">
                <div className="mock-clock">
                  <Clock3 size={30} />
                  <strong>45:00</strong>
                  <span>MINUTES</span>
                </div>
                <h2>
                  One focused session. A clearer picture of your readiness.
                </h2>
                <div className="mock-facts">
                  <span>
                    <CheckCircle2 /> Mixed task types
                  </span>
                  <span>
                    <CheckCircle2 /> Difficulty adjusts
                  </span>
                  <span>
                    <CheckCircle2 /> Performance report
                  </span>
                </div>
                <p>
                  This is an original practice simulation inspired by the
                  current DET task families. It is not an official test, does
                  not reproduce the certified adaptive engine, and cannot
                  guarantee a particular score.
                </p>
                <div className="camera-prep-note">
                  <strong>Camera and testing environment check</strong>
                  <p>Before starting, choose a quiet, well-lit room, stay alone, remove notes, headphones and extra devices, and keep your face visible. Your browser camera will show a live local preview during the test. ISOMO does not record or upload this camera feed. The official DET also requires a secondary phone camera, room scan and ear scan; this practice page cannot perform those official checks.</p>
                  <a href="https://testcenter.zendesk.com/hc/en-us/articles/360052828331-Test-Policies-Rules-and-Requirements" target="_blank" rel="noreferrer">Read the official DET rules <ExternalLink size={13}/></a>
                </div>
                <div className="mastery-gate">{skills.every(s => (progress[s.id] || 0) >= 80) ? 'All skill modules have reached the 80% mastery benchmark. You are ready for a full mock.' : 'Recommended mastery pathway: aim for at least 80% in every skill module before relying on a full mock. You can still take a diagnostic mock at any time.'}</div>
                <button className="btn primary full" onClick={beginMock}>
                  Begin 45-minute mock <ArrowRight size={17} />
                </button>
              </div>
            ) : mock && currentMock ? (
              <div className="mock-live">
                <div className="camera-monitor">
                  <div className="camera-preview-frame">
                    <video ref={cameraPreviewRef} autoPlay muted playsInline aria-label="Live local camera preview" />
                  </div>
                  <div className="camera-preview-copy"><strong><span className="camera-live-dot" /> Camera active</strong><span>Local preview only · not recorded or uploaded</span><small>Keep your face clearly visible and stay in a quiet room.</small></div>
                </div>
                <div className="mock-live-top">
                  <span className="live-label">
                    <span className="live-dot" /> ADAPTIVE PRACTICE
                  </span>
                  <div className="timer">
                    <Clock3 size={17} />
                    {Math.floor(mockSeconds / 60)
                      .toString()
                      .padStart(2, '0')}
                    :{(mockSeconds % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="mock-progress">