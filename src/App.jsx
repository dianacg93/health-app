import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleHelp, Clipboard, FileText, HeartPulse, LockKeyhole, MessageCircleHeart, Printer, RotateCcw, ShieldCheck, X } from 'lucide-react';

const STORAGE_KEY = 'mindnotes-data-v1';
const questions = [
  { letter: 'S', label: 'Where it shows up', title: 'Where do you notice this most?', hint: 'Think about parts of life or daily routines that feel affected.', placeholder: 'For example: at work, with friends, at bedtime, or across most of my day...' },
  { letter: 'O', label: 'When it began', title: 'When did you first notice a change?', hint: 'A rough time or event is enough. It is okay if you are not sure.', placeholder: 'It started around...' },
  { letter: 'C', label: 'What it feels like', title: 'How would you describe what you have been experiencing?', hint: 'Use your own words. There is no right way to describe it.', placeholder: 'Lately, I have been feeling or thinking...' },
  { letter: 'R', label: 'How it affects you', title: 'How does it affect your thoughts, body, actions, or relationships?', hint: 'Share any changes you have noticed in how you function day to day.', placeholder: 'I have noticed...' },
  { letter: 'A', label: 'Other changes', title: 'Have you noticed any other changes alongside this?', hint: 'Sleep, appetite, energy, focus, motivation, or anything else that feels relevant.', placeholder: 'Along with this, I have noticed...' },
  { letter: 'T', label: 'When it happens', title: 'Is it there most of the time, or does it come and go?', hint: 'You can mention patterns, times of day, or how often it happens.', placeholder: 'It tends to happen...' },
  { letter: 'E', label: 'What changes it', title: 'What seems to make it easier or harder?', hint: 'This could include situations, routines, people, or things you have tried.', placeholder: 'It feels easier when... It feels harder when...' },
  { letter: 'S', label: 'Day-to-day impact', title: 'How much is this affecting your day-to-day life?', hint: 'Choose a number that feels right today. This is just a conversation starter.', placeholder: '' },
];
const emptyAnswers = () => Object.fromEntries(questions.map((_, index) => [index, '']));

function readSavedData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { draft: { ...emptyAnswers(), ...(saved?.draft || {}) }, sessions: Array.isArray(saved?.sessions) ? saved.sessions : [] };
  } catch {
    return { draft: emptyAnswers(), sessions: [] };
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function makeSummary(session) {
  return [
    `Mindnotes appointment notes - ${formatDate(session.createdAt)}`,
    'Personal notes to support a conversation with a clinician. Not a diagnosis.', '',
    ...questions.flatMap((question, index) => session.answers[index]?.trim() ? [`${question.label}:`, session.answers[index].trim(), ''] : []),
  ].join('\n');
}

export default function App() {
  const [savedData, setSavedData] = useState(readSavedData);
  const [view, setView] = useState('home');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(savedData.draft);
  const [activeSession, setActiveSession] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft: answers, sessions: savedData.sessions }));
    } catch {
      setNotice('This browser could not save your notes. You can still print or copy them.');
    }
  }, [answers, savedData.sessions]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, step]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function startInterview() {
    setAnswers(emptyAnswers()); setEditingId(null); setStep(0); setView('interview');
  }

  function editSession(session, questionIndex = 0) {
    setAnswers({ ...emptyAnswers(), ...session.answers }); setEditingId(session.id);
    setActiveSession(session); setStep(questionIndex); setView('interview');
  }

  function finishInterview(finalAnswers = answers) {
    const session = {
      id: editingId || `${Date.now()}`,
      createdAt: editingId ? savedData.sessions.find((item) => item.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      answers: { ...finalAnswers },
    };
    setSavedData((previous) => ({ ...previous, sessions: [session, ...previous.sessions.filter((item) => item.id !== session.id)] }));
    setActiveSession(session); setEditingId(null); setView('summary'); setNotice('Your notes are saved on this device.');
  }

  function advance(answersToSave = answers) {
    if (step === questions.length - 1) finishInterview(answersToSave);
    else setStep((current) => current + 1);
  }

  async function copySummary() {
    if (!activeSession) return;
    try {
      await navigator.clipboard.writeText(makeSummary(activeSession)); setNotice('Summary copied to clipboard.');
    } catch {
      setNotice('Clipboard access is unavailable in this browser. Try printing your notes instead.');
    }
  }

  function deleteSession(id) {
    setSavedData((previous) => ({ ...previous, sessions: previous.sessions.filter((session) => session.id !== id) }));
    if (activeSession?.id === id) { setActiveSession(null); setView('home'); }
    setNotice('Saved notes removed from this device.');
  }

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView('home')} aria-label="Mindnotes home"><span className="brand-mark"><HeartPulse size={19} /></span><span>mindnotes</span></button>
        <div className="topbar-right"><span className="privacy-indicator"><LockKeyhole size={14} /> Saved on this device</span><button className="support-link" onClick={() => setSupportOpen(true)}><CircleHelp size={16} /> Get support</button></div>
      </header>
      <main id="main-content">
        {view === 'home' && <HomeView sessions={savedData.sessions} onStart={startInterview} onOpen={(session) => { setActiveSession(session); setView('summary'); }} onDelete={deleteSession} />}
        {view === 'interview' && (
          <section className="interview-page" aria-labelledby="interview-title">
            <button className="back-link" onClick={() => setView('home')}><ArrowLeft size={16} /> Back to home</button>
            <div className="interview-layout">
              <aside className="interview-aside"><p className="eyebrow">A guided check-in</p><h1 id="interview-title">Your story,<br />in your words.</h1><p className="aside-copy">Take this at your own pace. Skip anything you would rather not answer.</p>
                <div className="step-list" aria-label="Interview sections">{questions.map((question, index) => <div className={`step-item ${index === step ? 'current' : ''} ${index < step ? 'completed' : ''}`} key={question.label}><span className="step-dot">{index < step ? <Check size={12} /> : question.letter}</span><span>{question.label}</span></div>)}</div>
              </aside>
              <div className="question-column"><div className="progress-meta"><span>QUESTION {step + 1} OF {questions.length}</span><span>{Math.round(progress)}%</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
                <div className="question-panel"><span className="question-letter">{currentQuestion.letter}</span><h2>{currentQuestion.title}</h2><p className="question-hint">{currentQuestion.hint}</p>
                  {step === questions.length - 1 ? <div className="severity-control"><div className="severity-value"><strong>{answers[step] || '5'}</strong><span>out of 10</span></div><input aria-label="Day-to-day impact, 0 to 10" type="range" min="0" max="10" value={answers[step] || '5'} onChange={(event) => setAnswers((previous) => ({ ...previous, [step]: event.target.value }))} /><div className="range-labels"><span>Not affecting me</span><span>Affecting me a lot</span></div></div> : <textarea autoFocus value={answers[step] || ''} onChange={(event) => setAnswers((previous) => ({ ...previous, [step]: event.target.value }))} placeholder={currentQuestion.placeholder} rows={5} />}
                  <div className="question-actions"><button className="text-button" onClick={() => setAnswers((previous) => ({ ...previous, [step]: '' }))}><RotateCcw size={15} /> Clear answer</button><div className="action-right">{step > 0 && <button className="secondary-button" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> Back</button>}<button className="primary-button" onClick={advance}>{step === questions.length - 1 ? 'View my notes' : 'Continue'}{step === questions.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}</button></div></div>
                  <button className="skip-button" onClick={() => { const skippedAnswers = { ...answers, [step]: '' }; setAnswers(skippedAnswers); advance(skippedAnswers); }}>Skip this question</button>
                </div><p className="local-note"><ShieldCheck size={15} /> Your answers stay in this browser and are not sent to a server.</p>
              </div>
            </div>
          </section>
        )}
        {view === 'summary' && activeSession && <SummaryView session={activeSession} onBack={() => setView('home')} onEdit={editSession} onCopy={copySummary} onPrint={() => window.print()} />}
      </main>
      <footer className="site-footer"><span>Mindnotes is a reflection tool, not a diagnosis or substitute for professional care.</span><button onClick={() => setSupportOpen(true)}>Support options <ChevronRight size={14} /></button></footer>
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={14} /></button></div>}
      {supportOpen && <SupportDialog onClose={() => setSupportOpen(false)} />}
    </div>
  );
}

function HomeView({ sessions, onStart, onOpen, onDelete }) {
  return (
    <section className="home-page" aria-labelledby="home-title">
      <div className="welcome-row"><div><p className="eyebrow">A little more clarity, at your pace</p><h1 id="home-title">Make space for<br /><em>the whole story.</em></h1><p className="welcome-copy">A calm place to gather what has been on your mind and bring it into a conversation with your clinician.</p></div>
        <div className="welcome-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><MessageCircleHeart size={55} strokeWidth={1.15} /><span className="art-spark spark-one" /><span className="art-spark spark-two" /></div>
      </div>
      <div className="home-grid"><div className="start-panel"><div className="panel-topline"><span><FileText size={16} /> VISIT PREPARATION</span><span>ABOUT 5 MIN</span></div><h2>Start with what you have noticed.</h2><p>A few gentle prompts can help organize your thoughts. You can skip any question and edit your notes before sharing them.</p><button className="primary-button start-button" onClick={onStart}>Begin a check-in <ArrowRight size={17} /></button><div className="panel-footnote"><LockKeyhole size={14} /> Private by design. Your notes stay on this device.</div></div>
        <aside className="method-panel"><div className="method-icon"><HeartPulse size={18} /></div><p className="eyebrow">A thoughtful framework</p><h3>Inspired by SOCRATES</h3><p>Prompts adapted for mental health conversations: where it shows up, when it began, how it feels, and what affects it.</p><div className="method-letters" aria-label="SOCRATES framework">S <i /> O <i /> C <i /> R <i /> A <i /> T <i /> E <i /> S</div></aside>
      </div>
      {sessions.length > 0 && <section className="recent-section" aria-labelledby="recent-title"><div className="section-heading"><div><p className="eyebrow">Kept on this device</p><h2 id="recent-title">Your recent notes</h2></div><span>{sessions.length} {sessions.length === 1 ? 'entry' : 'entries'}</span></div><div className="session-list">{sessions.slice(0, 3).map((session) => <div className="session-row" key={session.id}><button className="session-open" onClick={() => onOpen(session)}><span className="session-date-icon"><FileText size={17} /></span><span><strong>Appointment notes</strong><small>{formatDate(session.createdAt)}</small></span><ChevronRight className="session-chevron" size={17} /></button><button className="delete-session" onClick={() => onDelete(session.id)} aria-label="Delete these notes"><X size={15} /></button></div>)}</div></section>}
    </section>
  );
}

function SummaryView({ session, onBack, onEdit, onCopy, onPrint }) {
  const answeredCount = questions.filter((_, index) => session.answers[index]?.trim()).length;
  return (
    <section className="summary-page" aria-labelledby="summary-title"><button className="back-link no-print" onClick={onBack}><ArrowLeft size={16} /> Back to home</button>
      <div className="summary-heading"><div><p className="eyebrow"><Check size={14} /> YOUR NOTES ARE READY</p><h1 id="summary-title">A clearer picture,<br /><em>in your own words.</em></h1><p className="welcome-copy">Review your notes. You decide what, if anything, to share with your clinician.</p></div><div className="summary-actions no-print"><button className="secondary-button" onClick={onCopy}><Clipboard size={16} /> Copy notes</button><button className="primary-button" onClick={onPrint}><Printer size={16} /> Print</button></div></div>
      <div className="summary-meta"><span><FileText size={15} /> Appointment preparation</span><span>{formatDate(session.createdAt)}</span><span>{answeredCount} of {questions.length} prompts answered</span></div>
      <div className="summary-list">{questions.map((question, index) => { const answer = session.answers[index]?.trim(); return <article className={`summary-item ${!answer ? 'unanswered' : ''}`} key={question.label}><div className="summary-item-main"><span className="summary-letter">{question.letter}</span><div><h2>{question.label}</h2><p>{answer || 'Not answered'}</p></div></div><button className="edit-answer no-print" onClick={() => onEdit(session, index)}>Edit</button></article>; })}</div>
      <p className="summary-disclaimer"><ShieldCheck size={16} /> These notes are for your conversation with a clinician. They are not a diagnosis.</p>
    </section>
  );
}

function SupportDialog({ onClose }) {
  useEffect(() => {
    function onKeyDown(event) { if (event.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="support-dialog" role="dialog" aria-modal="true" aria-labelledby="support-title"><button className="dialog-close" onClick={onClose} aria-label="Close support options"><X size={18} /></button><div className="support-symbol"><HeartPulse size={22} /></div><p className="eyebrow">You deserve support</p><h2 id="support-title">Help is available now.</h2><p className="support-intro">If you are in the United States and need someone to talk to, these services are available at any time.</p><a className="resource-link" href="tel:988"><span><strong>Call or text 988</strong><small>988 Suicide &amp; Crisis Lifeline</small></span><ArrowRight size={17} /></a><a className="resource-link" href="https://988lifeline.org/" target="_blank" rel="noreferrer"><span><strong>Chat online</strong><small>988lifeline.org</small></span><ArrowRight size={17} /></a><div className="urgent-note"><strong>Immediate danger?</strong> Call 911 or go to your nearest emergency room.</div><p className="support-footer">Free and confidential. If you are outside the US, contact your local emergency service.</p></section></div>
  );
}