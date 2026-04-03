import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateLevelContent, validateAnswer } from '../groq';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import LoadingSpinner from './LoadingSpinner';
import ErrorToast from './ErrorToast';

/* ─────────────────────────────────────────────
   LEVEL THEME
───────────────────────────────────────────── */
const THEMES = [
  { gradient: 'from-violet-950 via-purple-900/60', accent: '#8b5cf6', accentDim: 'rgba(139,92,246,0.15)', btn: 'bg-violet-600 hover:bg-violet-500', pill: 'bg-violet-500/15 text-violet-300 border-violet-500/30', tag: 'Beginner', icon: '🌱' },
  { gradient: 'from-cyan-950 via-sky-900/60', accent: '#06b6d4', accentDim: 'rgba(6,182,212,0.15)', btn: 'bg-cyan-600 hover:bg-cyan-500', pill: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', tag: 'Explorer', icon: '🌊' },
  { gradient: 'from-emerald-950 via-teal-900/60', accent: '#10b981', accentDim: 'rgba(16,185,129,0.15)', btn: 'bg-emerald-600 hover:bg-emerald-500', pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', tag: 'Rising', icon: '🔥' },
  { gradient: 'from-amber-950 via-orange-900/60', accent: '#f59e0b', accentDim: 'rgba(245,158,11,0.15)', btn: 'bg-amber-600 hover:bg-amber-500', pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30', tag: 'Advanced', icon: '⚡' },
  { gradient: 'from-rose-950 via-pink-900/60', accent: '#f43f5e', accentDim: 'rgba(244,63,94,0.15)', btn: 'bg-rose-600 hover:bg-rose-500', pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30', tag: 'Master', icon: '👑' },
];
const getTheme = (id) => THEMES[(parseInt(id) - 1) % THEMES.length];

/* ─────────────────────────────────────────────
   HEARTS
───────────────────────────────────────────── */
const Hearts = ({ lives, total = 5 }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: total }).map((_, i) => (
      <span key={i} className={`text-base transition-all duration-300 ${i < lives ? '' : 'opacity-15 grayscale scale-75'}`}>
        ❤️
      </span>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   PROGRESS DOTS
───────────────────────────────────────────── */
const Dots = ({ total, current, results }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`rounded-full transition-all duration-300 ${i < results.length
        ? results[i]?.isCorrect
          ? 'w-3 h-3 bg-emerald-400'
          : 'w-3 h-3 bg-rose-400'
        : i === current
          ? 'w-6 h-3 bg-white'
          : 'w-3 h-3 bg-white/15'
        }`} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   DRAG & DROP ENGINE
───────────────────────────────────────────── */
const DragDropEngine = ({ availableTiles, currentAnswer, setCurrentAnswer, accent }) => {
  const [bankTiles, setBankTiles] = useState([...availableTiles]);
  const [answerTiles, setAnswerTiles] = useState([]);
  const [dragInfo, setDragInfo] = useState(null);
  const [dropZone, setDropZone] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);
  const prevAvail = useRef(availableTiles);

  useEffect(() => {
    setCurrentAnswer(answerTiles);
  }, [answerTiles]);

  useEffect(() => {
    if (JSON.stringify(prevAvail.current) !== JSON.stringify(availableTiles)) {
      prevAvail.current = availableTiles;
      setBankTiles([...availableTiles]);
      setAnswerTiles([]);
    }
  }, [availableTiles]);

  const onDragStart = (e, word, source, idx) => {
    setDragInfo({ word, source, idx });
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, zone, idx = null) => {
    e.preventDefault();
    setDropZone(zone);
    setDropIdx(idx);
  };

  const onDrop = (e, zone, dIdx = null) => {
    e.preventDefault();
    if (!dragInfo) return;
    const { word, source, idx: fromIdx } = dragInfo;

    if (zone === 'answer') {
      if (source === 'bank') {
        const newBank = bankTiles.filter((_, i) => i !== fromIdx);
        const insertAt = dIdx !== null ? dIdx : answerTiles.length;
        const newAns = [...answerTiles];
        newAns.splice(insertAt, 0, word);
        setBankTiles(newBank);
        setAnswerTiles(newAns);
      } else if (source === 'answer' && fromIdx !== dIdx && dIdx !== null) {
        const newAns = [...answerTiles];
        newAns.splice(fromIdx, 1);
        const insertAt = dIdx > fromIdx ? dIdx - 1 : dIdx;
        newAns.splice(insertAt, 0, word);
        setAnswerTiles(newAns);
      }
    } else if (zone === 'bank' && source === 'answer') {
      setAnswerTiles(answerTiles.filter((_, i) => i !== fromIdx));
      setBankTiles([...bankTiles, word]);
    }

    setDragInfo(null); setDropZone(null); setDropIdx(null);
  };

  const clickTile = (word, source, idx) => {
    if (source === 'bank') {
      setBankTiles(bankTiles.filter((_, i) => i !== idx));
      setAnswerTiles([...answerTiles, word]);
    } else {
      setAnswerTiles(answerTiles.filter((_, i) => i !== idx));
      setBankTiles([...bankTiles, word]);
    }
  };

  const clearAll = () => {
    setBankTiles([...availableTiles]);
    setAnswerTiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Answer zone */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="section-title">Your answer</p>
          {answerTiles.length > 0 && (
            <button onClick={clearAll} className="text-xs text-slate-500 hover:text-rose-400 font-bold transition-colors">
              Clear all ×
            </button>
          )}
        </div>
        <div
          onDragOver={(e) => onDragOver(e, 'answer')}
          onDrop={(e) => onDrop(e, 'answer')}
          className="min-h-[72px] rounded-2xl border-2 border-dashed p-3 flex flex-wrap gap-2 items-center transition-all duration-200"
          style={{
            borderColor: dropZone === 'answer' ? accent : 'rgba(255,255,255,0.12)',
            background: dropZone === 'answer'
              ? `rgba(${accent.replace('#', '').match(/.{2}/g).map(h => parseInt(h, 16)).join(',')},0.08)`
              : answerTiles.length > 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)',
            boxShadow: answerTiles.length > 0 ? `inset 0 0 30px ${accent}12` : 'none',
          }}
        >
          {answerTiles.length === 0 ? (
            <p className="text-slate-600 text-sm font-semibold mx-auto">
              👆 Tap words below or drag them here
            </p>
          ) : (
            answerTiles.map((word, i) => (
              <div
                key={`a-${word}-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, word, 'answer', i)}
                onDragOver={(e) => { e.preventDefault(); onDragOver(e, 'answer', i); }}
                onDrop={(e) => onDrop(e, 'answer', i)}
                onClick={() => clickTile(word, 'answer', i)}
                className="relative px-4 py-2 rounded-xl font-bold text-sm cursor-pointer select-none transition-all duration-150 script-tile"
                style={{
                  background: `${accent}20`,
                  border: `2px solid ${accent}`,
                  color: '#ffffff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  boxShadow: `0 2px 10px ${accent}40`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${accent}40`;
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `${accent}20`;
                  e.currentTarget.style.transform = '';
                }}
              >
                {dropZone === 'answer' && dropIdx === i && dragInfo?.source === 'answer' && (
                  <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-white/60 rounded-full" />
                )}
                {word}
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-800 rounded-full text-[9px] flex items-center justify-center text-slate-400 border border-slate-700">✕</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Word bank */}
      <div>
        <p className="section-title mb-2">Word bank · tap to place</p>
        <div
          onDragOver={(e) => onDragOver(e, 'bank')}
          onDrop={(e) => onDrop(e, 'bank')}
          className="min-h-[56px] rounded-2xl p-3 flex flex-wrap gap-2 items-start transition-all duration-200"
          style={{
            background: dropZone === 'bank' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {bankTiles.length === 0 ? (
            <p className="text-slate-600 text-sm font-semibold mx-auto py-1">All words placed ✓</p>
          ) : (
            bankTiles.map((word, i) => (
              <div
                key={`b-${word}-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, word, 'bank', i)}
                onClick={() => clickTile(word, 'bank', i)}
                className="px-4 py-2 rounded-xl font-bold text-sm cursor-pointer select-none transition-all duration-150 script-tile"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = '';
                }}
              >
                {word}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN LEVEL PLAYER
───────────────────────────────────────────── */
const LevelPlayer = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  const theme = getTheme(levelId);

  const [userData, setUserData] = useState(null);
  const [levelData, setLevelData] = useState(null);
  const [storyContent, setStoryContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  const [phase, setPhase] = useState('story');
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [allPassed, setAllPassed] = useState(false);

  /* ── INIT ── */
  useEffect(() => {
    const init = async () => {
      try {
        const uid = auth.currentUser.uid;
        const [userSnap, levelSnap] = await Promise.all([
          getDoc(doc(db, 'users', uid)),
          getDoc(doc(db, 'level_progress', `${uid}_level_${levelId}`)),
        ]);

        if (!userSnap.exists() || !levelSnap.exists()) { navigate('/dashboard'); return; }

        const uData = userSnap.data();
        const lData = levelSnap.data();
        setUserData(uData);
        setLevelData(lData);

        if (!lData.is_unlocked || lData.lives_remaining <= 0) { navigate('/dashboard'); return; }

        let content = lData.current_story_data;
        if (!content) {
          setLoadingMsg(`Crafting a ${uData.learning_lang} story for Level ${levelId}...`);
          const difficulty = Math.min(5, Math.ceil(parseInt(levelId) / 2));
          content = await generateLevelContent(uData.learning_lang, uData.native_lang, levelId, difficulty);
          await updateDoc(doc(db, 'level_progress', `${uid}_level_${levelId}`), { current_story_data: content });
        }

        setStoryContent(content);
        setQuestions(
          (content.questions || []).map(q => ({
            ...q,
            available_tiles: [...(q.available_tiles || [])].sort(() => Math.random() - 0.5),
          }))
        );
      } catch (err) {
        setError('Failed to load level. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMsg('');
      }
    };
    init();
  }, [levelId, navigate]);

  /* ── SUBMIT ── */
  const handleSubmit = async () => {
    setSubmitting(true);
    const results = [];
    let passed = true;

    try {
      for (const q of questions) {
        const userAns = (answers[q.id] || []).join(' ');
        const correctAns = (q.correct_answer_tiles || []).join(' ');
        const v = await validateAnswer(userAns, correctAns, userData.learning_lang, q.text_native);
        if (!v.is_correct) passed = false;

        results.push({
          question: q.text_native,
          yourAnswer: userAns,
          correctAnswer: correctAns,
          correctAnswerNative: q.correct_answer_native || '',
          isCorrect: v.is_correct,
        });
      }

      setTestResults(results);
      setAllPassed(passed);
      setPhase('results');

      const uid = auth.currentUser.uid;
      const levelRef = doc(db, 'level_progress', `${uid}_level_${levelId}`);
      const userRef = doc(db, 'users', uid);
      const reward = parseInt(levelId) * 20 + 20;

      if (passed) {
        const today = new Date().toDateString();
        const lastDate = userData.last_played_date
          ? new Date(userData.last_played_date).toDateString()
          : null;
        const newStreak = lastDate !== today ? userData.streak_days + 1 : userData.streak_days;

        await updateDoc(userRef, {
          total_coins: userData.total_coins + reward,
          streak_days: newStreak,
          last_played_date: new Date().toISOString(),
        });
        await updateDoc(levelRef, { is_completed: true, current_story_data: null });
      } else {
        const newLives = Math.max(0, levelData.lives_remaining - 1);
        await updateDoc(levelRef, { lives_remaining: newLives });
        setLevelData(prev => ({ ...prev, lives_remaining: newLives }));
      }
    } catch (err) {
      setError('Failed to validate answers. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setPhase('story');
    setCurrentIdx(0);
    setAnswers({});
    setTestResults([]);
  };

  if (loading) return <LoadingSpinner text={loadingMsg || `Loading Level ${levelId}...`} />;

  const reward = parseInt(levelId) * 20 + 20;
  const currentQ = questions[currentIdx];
  const correctCount = testResults.filter(r => r.isCorrect).length;

  return (
    <div className="min-h-screen bg-base-bg text-white transition-colors duration-500 relative font-sans animate-pageFadeIn">
      {/* Ambient glow */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse 60% 40% at 50% -10%, ${theme.accent}20 0%, transparent 70%)`,
        }} />
      </div>

      <ErrorToast message={error} onClose={() => setError('')} />

      {/* ── TOPBAR ── */}
      <header className="topbar relative z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-semibold text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Roadmap
          </button>

          <div className="flex items-center gap-2">
            <span>{theme.icon}</span>
            <div className="text-center">
              <p className="font-black text-sm leading-none">Level {levelId}</p>
              <p className="text-[11px] text-slate-400 font-semibold">{theme.tag} · {userData?.learning_lang}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Hearts lives={levelData?.lives_remaining || 0} />
            <span className="text-sm font-black text-amber-400 hidden sm:block">+{reward} 🪙</span>
          </div>
        </div>

        {/* Quiz progress bar */}
        {phase === 'questions' && (
          <div className="max-w-4xl mx-auto mt-3 flex items-center gap-3">
            <Dots total={questions.length} current={currentIdx} results={testResults} />
            <div className="flex-1 progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(currentIdx / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-black text-slate-500 tabular-nums">{currentIdx + 1}/{questions.length}</span>
          </div>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">

        {/* ══════════════════════════════════════
            PHASE: STORY
        ══════════════════════════════════════ */}
        {phase === 'story' && storyContent && (
          <div className="space-y-6 animate-fade-in">

            {/* Header */}
            <div className="text-center space-y-3 mb-6">
              <span className={`badge ${theme.pill} text-xs font-black uppercase tracking-wider py-1.5 px-4 rounded-full border mb-4 inline-block`}>
                📖 Read the story, then take the quiz
              </span>
              <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight block text-white drop-shadow-md">
                Level {levelId} — <span style={{ color: theme.accent }}>{userData?.learning_lang} Story</span>
              </h1>
              <p className="text-slate-400 text-base md:text-lg font-medium max-w-lg mx-auto">
                Study both versions below. The quiz draws questions directly from this story.
              </p>
            </div>

            {/* Dual story panel */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Learning language */}
              <div className="rounded-[24px] overflow-hidden border" style={{
                borderColor: `${theme.accent}35`,
                background: `linear-gradient(135deg, ${theme.accent}15, rgba(13,13,26,0.6))`,
                boxShadow: `0 0 40px ${theme.accent}15`,
              }}>
                <div className="px-5 py-3.5 flex items-center gap-2 border-b" style={{ borderColor: `${theme.accent}20` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: theme.accent }} />
                  <span className="font-black text-sm" style={{ color: theme.accent }}>{userData?.learning_lang}</span>
                  <span className="text-xs text-slate-500 ml-auto font-medium">Learning language</span>
                </div>
                <div className="p-8">
                  <p className="text-2xl leading-loose font-black text-white script-tile tracking-wide">
                    {storyContent.story_text_learning}
                  </p>
                </div>
              </div>

              {/* Native language */}
              <div className="rounded-[24px] overflow-hidden border" style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(19,19,42,0.8)', // card-bg
              }}>
                <div className="px-5 py-3.5 flex items-center gap-2 border-b border-white/5">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="font-black text-sm text-slate-300">{userData?.native_lang}</span>
                  <span className="text-xs text-slate-600 ml-auto font-medium">Translation</span>
                </div>
                <div className="p-8 flex items-center h-full">
                  <p className="text-xl leading-relaxed text-slate-300 font-bold">
                    {storyContent.story_text_native}
                  </p>
                </div>
              </div>
            </div>

            {/* Info banner */}
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}>
              <span className="text-xl shrink-0">💡</span>
              <p className="text-sm font-semibold text-amber-200">
                Read both versions carefully. You have{' '}
                <span className="font-black text-amber-400">{levelData?.lives_remaining} {levelData?.lives_remaining === 1 ? 'life' : 'lives'}</span> remaining.
                The quiz will ask you to build sentences from the story using word tiles.
              </p>
            </div>

            {/* Start quiz button */}
            <button
              onClick={() => setPhase('questions')}
              className={`w-full py-4 ${theme.btn} text-white font-black text-base rounded-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3`}
              style={{ boxShadow: `0 8px 32px ${theme.accent}30` }}
            >
              <span>I've read the story — Start Quiz</span>
              <span>🧩</span>
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════
            PHASE: QUESTIONS
        ══════════════════════════════════════ */}
        {phase === 'questions' && currentQ && (
          <div className="space-y-5 animate-fade-in">

            {/* Question card */}
            <div className="max-w-2xl mx-auto rounded-[24px] border overflow-hidden shadow-2xl bg-card-bg backdrop-blur-xl" style={{
              borderColor: 'rgba(255,255,255,0.1) border-t-white/20',
              boxShadow: `0 20px 60px ${theme.accent}1a, inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}>
              {/* Question header */}
              <div className="px-6 py-5 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className={`badge ${theme.pill} text-xs`}>
                    Q{currentIdx + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {userData?.native_lang} → {userData?.learning_lang}
                  </span>
                </div>

                {/* Question text */}
                <h2 className="text-2xl md:text-3xl font-black text-white text-center leading-snug mt-2 mb-4">
                  {currentQ.text_native}
                </h2>

                <p className="text-center font-bold text-sm mb-4" style={{ color: theme.accent }}>
                  Translate this into {userData?.learning_lang}
                </p>

                {/* Hint if available */}
                {currentQ.text_learning && (
                  <div className="mt-1 text-center">
                    <p className="text-xs text-slate-400 font-semibold mb-0.5">Reference from story</p>
                    <p className="text-sm font-bold script-tile" style={{ color: theme.accent }}>
                      {currentQ.text_learning}
                    </p>
                  </div>
                )}
              </div>

              {/* Drag drop */}
              <div className="p-6">
                <DragDropEngine
                  availableTiles={currentQ.available_tiles}
                  currentAnswer={answers[currentQ.id] || []}
                  setCurrentAnswer={(ans) => setAnswers(prev => ({ ...prev, [currentQ.id]: ans }))}
                  accent={theme.accent}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="max-w-2xl mx-auto flex gap-3">
              {currentIdx > 0 && (
                <button
                  onClick={() => setCurrentIdx(i => i - 1)}
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Back
                </button>
              )}
              <div className="flex-1" />
              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx(i => i + 1)}
                  className={`px-8 py-2.5 rounded-xl font-black text-white transition-all shadow-lg hover:scale-105`}
                  style={{ background: theme.accent, boxShadow: `0 4px 20px ${theme.accent}40` }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-2.5 rounded-xl font-black text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  {submitting ? 'Checking...' : 'Submit Answers ✓'}
                </button>
              )}
            </div>

            {/* Question number dots */}
            <div className="flex justify-center gap-2 pt-1">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className="w-8 h-8 rounded-full text-xs font-black transition-all border"
                  style={
                    i === currentIdx
                      ? { background: theme.accent, borderColor: 'transparent', color: 'white', transform: 'scale(1.1)' }
                      : answers[questions[i]?.id]?.length > 0
                        ? { background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: '#94a3b8' }
                        : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)', color: '#475569' }
                  }
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            PHASE: RESULTS
        ══════════════════════════════════════ */}
        {phase === 'results' && (
          <div className="space-y-6 animate-fade-in relative">
            {allPassed && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} gravity={0.2} />}

            {/* Hero */}
            <div className={`rounded-3xl p-8 text-center border ${allPassed
              ? 'bg-emerald-950/50 border-emerald-500/25'
              : 'bg-rose-950/50 border-rose-500/25'
              }`}>
              <div className="text-6xl mb-4 inline-block animate-bounce">
                {allPassed ? '🏆' : '💔'}
              </div>
              <h2 className={`text-3xl font-black mb-2 ${allPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {allPassed ? 'Level Complete!' : 'Keep Practicing!'}
              </h2>
              <p className="text-slate-300 font-semibold text-sm">
                {allPassed
                  ? `Excellent! You earned +${reward} 🪙 and cleared Level ${levelId}!`
                  : `You lost a life. Study the corrections below and try again.`}
              </p>
              {allPassed && (
                <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-black"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                  +{reward} 🪙 Earned
                </div>
              )}
            </div>

            {/* Score summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Correct', value: correctCount, color: '#34d399' },
                { label: 'Wrong', value: testResults.length - correctCount, color: '#f87171' },
                { label: 'Score', value: `${Math.round((correctCount / testResults.length) * 100)}%`, color: '#f8fafc' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4 text-center border border-white/6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Per-question breakdown */}
            <div className="space-y-4">
              <h3 className="font-black text-base text-slate-200">📋 Question Breakdown</h3>

              {testResults.map((res, i) => (
                <div
                  key={i}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    borderColor: res.isCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)',
                    background: res.isCorrect ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)',
                  }}
                >
                  {/* Question row */}
                  <div className="px-5 py-3.5 flex items-start gap-3 border-b border-white/5">
                    <span className={`font-black text-sm mt-0.5 shrink-0 ${res.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {res.isCorrect ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Question {i + 1}</p>
                      <p className="text-sm font-bold text-slate-200">{res.question}</p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* User answer */}
                    <div>
                      <p className="section-title mb-1.5">Your answer</p>
                      <p className={`text-base font-black script-tile ${res.isCorrect
                        ? 'text-emerald-300'
                        : 'text-rose-400 line-through decoration-rose-500/70'
                        }`}>
                        {res.yourAnswer || '(No answer given)'}
                      </p>
                    </div>

                    {/* Correct answer — shown when wrong */}
                    {!res.isCorrect && (
                      <>
                        <div className="pt-4 border-t border-white/6">
                          <p className="section-title mb-1.5 text-emerald-500">
                            ✓ Correct answer in {userData?.learning_lang}
                          </p>
                          <p className="text-xl font-black text-white script-tile tracking-wide">
                            {res.correctAnswer}
                          </p>
                        </div>

                        {res.correctAnswerNative && (
                          <div className="rounded-xl px-4 py-3" style={{
                            background: 'rgba(139,92,246,0.1)',
                            border: '1px solid rgba(139,92,246,0.2)',
                          }}>
                            <p className="section-title mb-1.5 text-violet-400">
                              meaning in {userData?.native_lang}
                            </p>
                            <p className="text-sm font-bold text-violet-200">
                              {res.correctAnswerNative}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary btn-lg flex-1 font-black"
              >
                ← Back to Roadmap
              </button>
              {!allPassed && levelData?.lives_remaining > 1 && (
                <button
                  onClick={retry}
                  className={`btn btn-lg flex-1 ${theme.btn} text-white font-black`}
                  style={{ boxShadow: `0 6px 24px ${theme.accent}25` }}
                >
                  Try Again →
                </button>
              )}
              {allPassed && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-success btn-lg flex-1 font-black"
                >
                  Continue Journey 🗺️
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelPlayer;