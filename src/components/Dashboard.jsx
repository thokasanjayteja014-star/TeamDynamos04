import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import LoadingSpinner from './LoadingSpinner';
import ErrorToast from './ErrorToast';

/* ─────────────────────────────────────────────
   NODE THEMES
───────────────────────────────────────────── */
const NODE_THEMES = [
  { bg: 'from-violet-500 to-purple-600', glow: '#a78bfa', icon: '🌱', label: 'Beginner', accent: '#a78bfa' },
  { bg: 'from-blue-500 to-cyan-500', glow: '#38bdf8', icon: '🌊', label: 'Explorer', accent: '#38bdf8' },
  { bg: 'from-emerald-500 to-teal-500', glow: '#34d399', icon: '🔥', label: 'Rising', accent: '#34d399' },
  { bg: 'from-orange-400 to-amber-500', glow: '#fb923c', icon: '⚡', label: 'Advanced', accent: '#fb923c' },
  { bg: 'from-rose-500 to-pink-600', glow: '#f43f5e', icon: '👑', label: 'Master', accent: '#f43f5e' },
];
const getTheme = (lvl) => NODE_THEMES[(lvl - 1) % NODE_THEMES.length];

/* zig-zag x offsets: top-to-bottom, level 1 at top */
const nodeX = (i) => {
  const pattern = [0, 1, 2, 1, 0, -1, -2, -1];
  return pattern[i % pattern.length];
};

/* ─────────────────────────────────────────────
   STREAK MILESTONES
───────────────────────────────────────────── */
const MAKE_MILESTONES = (ud) => [
  { days: 3, reward: 10, claimed: ud.streak_bonus_claimed_3d },
  { days: 7, reward: 30, claimed: ud.streak_bonus_claimed_7d },
  { days: 14, reward: 50, claimed: ud.streak_bonus_claimed_14d },
  { days: 30, reward: 100, claimed: ud.streak_bonus_claimed_30d, special: 'Golden Dragon Avatar' },
];

/* ─────────────────────────────────────────────
   ROADMAP NODE
───────────────────────────────────────────── */
const RoadmapNode = ({ lvl, onUnlock, onPlay, unlocking, userCoins }) => {
  const theme = getTheme(lvl.level_id);
  const cost = lvl.level_id === 1 ? 0 : lvl.level_id * 20;
  const reward = lvl.level_id * 20 + 20;
  const xOffset = nodeX(lvl.level_id - 1);
  const isActive = lvl.is_unlocked && !lvl.is_completed && lvl.lives_remaining > 0;
  const noLives = lvl.is_unlocked && lvl.lives_remaining === 0;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ transform: `translateX(${xOffset * 56}px)` }}
    >
      {/* connector above */}
      {lvl.level_id > 1 && (
        <div className="w-0.5 h-8 bg-gradient-to-b from-white/20 to-white/5 mb-0" />
      )}

      <div className="group relative">
        {/* glow pulse for completed */}
        {lvl.is_completed && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 scale-125 pointer-events-none"
            style={{ background: theme.glow, filter: 'blur(6px)' }} />
        )}

        <button
          onClick={() => {
            if (isActive) onPlay(lvl.level_id);
            else if (!lvl.is_unlocked) onUnlock(cost, lvl.level_id, lvl.id);
          }}
          disabled={unlocking === lvl.level_id || noLives}
          className={`
            relative w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center
            font-black text-white shadow-2xl border-[3px] transition-all duration-300
            ${lvl.is_completed
              ? `bg-gradient-to-br ${theme.bg} border-white/50 hover:scale-110`
              : lvl.is_unlocked
                ? `bg-gradient-to-br ${theme.bg} border-white/30 hover:scale-110`
                : 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600/40 hover:scale-105'
            }
            ${noLives ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={lvl.is_unlocked ? { boxShadow: `0 6px 28px ${theme.glow}55` } : {}}
        >
          {unlocking === lvl.level_id ? (
            <span className="text-xl animate-spin">⚙️</span>
          ) : lvl.is_completed ? (
            <span className="text-xl">⭐</span>
          ) : lvl.is_unlocked ? (
            <span className="text-xl">{theme.icon}</span>
          ) : (
            <span className="text-xl">🔒</span>
          )}
          <span className="text-[11px] font-black mt-0.5 tracking-tight">{lvl.level_id}</span>
        </button>

        {/* Tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 pointer-events-none z-20
          opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <div className="bg-gray-900/98 backdrop-blur text-white rounded-2xl p-3 text-center shadow-2xl border border-white/10 min-w-[140px]">
            <p className="font-black text-sm">Level {lvl.level_id}</p>
            <p className="text-xs text-gray-400 font-semibold">{theme.label}</p>
            {lvl.is_unlocked ? (
              <>
                <div className="flex justify-center gap-0.5 my-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-xs ${i < lvl.lives_remaining ? 'opacity-100' : 'opacity-20'}`}>❤️</span>
                  ))}
                </div>
                <p className="text-xs text-amber-400 font-bold">+{reward} 🪙</p>
                {noLives && <p className="text-xs text-red-400 mt-1">No lives!</p>}
              </>
            ) : (
              <p className="text-xs text-amber-400 mt-1 font-bold">
                {cost === 0 ? 'Free to start!' : `${cost} 🪙 to unlock`}
              </p>
            )}
          </div>
          <div className="w-2 h-2 bg-gray-900/98 rotate-45 mx-auto -mt-1 border-l border-t border-white/10" />
        </div>
      </div>

      {/* label */}
      <p className={`mt-1.5 text-[11px] font-black ${lvl.is_unlocked ? 'text-white/70' : 'text-gray-600'}`}>
        {lvl.is_completed ? '✓ Done' : isActive ? `Play` : lvl.is_unlocked ? `Lv.${lvl.level_id}` : `Lv.${lvl.level_id}`}
      </p>
    </div>
  );
};

/* ─────────────────────────────────────────────
   STREAK BADGE
───────────────────────────────────────────── */
const StreakBadge = ({ ms, current }) => {
  const reached = current >= ms.days;
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all
      ${ms.claimed ? 'bg-emerald-900/20 border-emerald-500/30'
        : reached ? 'bg-amber-900/20 border-amber-500/30 animate-pulse'
          : 'bg-white/3 border-white/8'}`}>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0
        ${ms.claimed ? 'bg-emerald-500' : reached ? 'bg-amber-500' : 'bg-gray-700'}`}>
        {ms.claimed ? '✓' : ms.special ? '🐉' : '🔥'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-black ${ms.claimed ? 'text-emerald-400' : 'text-white'}`}>{ms.days}-Day Streak</p>
        <p className="text-xs text-gray-400 font-semibold">+{ms.reward} 🪙{ms.special ? ` + ${ms.special}` : ''}</p>
      </div>
      {reached && !ms.claimed && (
        <span className="text-[11px] bg-amber-500 text-black font-black px-2 py-0.5 rounded-full shrink-0">CLAIM</span>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────── */
const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [levels, setLevels] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlockingLevel, setUnlockingLevel] = useState(null);
  const [tab, setTab] = useState('map');
  const navigate = useNavigate();

  const handleLogout = () => auth.signOut();

  const handleChangeLanguage = async (e) => {
    const newLang = e.target.value;
    if (newLang === userData.learning_lang) return;
    if (window.confirm(`Switching to ${newLang} will reset your level progress. Continue?`)) {
      setLoading(true);
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          learning_lang: newLang,
          highest_unlocked_level: 1,
          cached_basics: null,
        });
        window.location.reload();
      } catch {
        setError('Failed to change language');
        setLoading(false);
      }
    }
  };

  const fetchData = async () => {
    try {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const udata = { id: userSnap.id, ...userSnap.data() };
      setUserData(udata);

      const unlockedCount = udata.highest_unlocked_level || 1;
      const loadedLevels = [];

      for (let i = 1; i <= unlockedCount; i++) {
        const lvlRef = doc(db, 'level_progress', `${auth.currentUser.uid}_level_${i}`);
        const lvlSnap = await getDoc(lvlRef);
        if (lvlSnap.exists()) {
          loadedLevels.push({ id: lvlSnap.id, ...lvlSnap.data() });
        } else if (i === 1) {
          loadedLevels.push({
            id: `${auth.currentUser.uid}_level_1`,
            level_id: 1, is_unlocked: true, is_completed: false, lives_remaining: 5,
          });
        }
      }

      loadedLevels.push({
        id: `${auth.currentUser.uid}_level_${unlockedCount + 1}`,
        level_id: unlockedCount + 1, is_unlocked: false, is_completed: false, lives_remaining: 5,
      });

      setLevels(loadedLevels.sort((a, b) => a.level_id - b.level_id));

      const q = query(collection(db, 'users'), orderBy('total_coins', 'desc'), limit(10));
      const leaderSnap = await getDocs(q);
      const list = [];
      leaderSnap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setLeaderboard(list);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUnlock = async (levelCost, levelId, docId) => {
    if (userData.total_coins < levelCost) { setError('Not enough coins!'); return; }
    setUnlockingLevel(levelId);
    try {
      const newCoins = userData.total_coins - levelCost;
      const newHighest = Math.max(userData.highest_unlocked_level || 1, levelId);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        total_coins: newCoins, highest_unlocked_level: newHighest,
      });
      await setDoc(doc(db, 'level_progress', docId), {
        user_id: auth.currentUser.uid, level_id: levelId, is_unlocked: true,
        is_completed: false, lives_remaining: 5,
        last_attempt_date: new Date().toISOString(), current_story_data: null,
      });
      setUserData(prev => ({ ...prev, total_coins: newCoins, highest_unlocked_level: newHighest }));
      setLevels(prev => prev.map(l => l.level_id === levelId ? { ...l, is_unlocked: true } : l));
    } catch { setError('Failed to unlock level'); }
    finally { setUnlockingLevel(null); }
  };

  if (loading || !userData) return <LoadingSpinner text="Loading your adventure..." />;

  const milestones = MAKE_MILESTONES(userData);
  const completedCount = levels.filter(l => l.is_completed).length;
  const unlockedCount = levels.filter(l => l.is_unlocked).length;
  const progressPct = levels.length > 1 ? Math.round((completedCount / (levels.length - 1)) * 100) : 0;
  const currentLevel = levels.find(l => l.is_unlocked && !l.is_completed && l.lives_remaining > 0);

  return (
    <div className="min-h-screen w-full bg-[#0d0f1a] text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <ErrorToast message={error} onClose={() => setError('')} />

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 bg-[#0d0f1a]/85 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center font-black text-lg shadow-lg shadow-violet-500/30">🌐</div>
            <span className="font-black text-base tracking-tight hidden sm:block">Language Learning Platform</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm">
            <span className="font-black text-amber-400">🪙 {userData.total_coins}</span>
            <span className="w-px h-4 bg-white/20" />
            <span className="font-black text-orange-400">🔥 {userData.streak_days}d</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/basics')}
              className="hidden sm:flex items-center gap-1.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/25 text-violet-300 font-bold text-sm px-4 py-2 rounded-full transition-all"
            >
              📚 Basics
            </button>
            <span className="text-2xl">{userData.avatar}</span>
            <span className="font-black text-sm hidden md:block max-w-[120px] truncate">{userData.username}</span>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-400 font-bold transition-colors ml-1">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">

        {/* ── HERO BANNER ── */}
        <div className="relative mb-6 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-900/50 via-purple-900/30 to-fuchsia-900/20 border border-violet-500/15 p-5 md:p-7">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-fuchsia-500/8 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-violet-400 font-bold text-xs mb-1 tracking-widest uppercase">Your Learning Journey</p>
              <h1 className="text-2xl md:text-3xl font-black mb-3 leading-tight">
                Welcome back, <span className="gradient-text">{userData.username}</span> 👋
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-white/8 border border-white/15 rounded-full px-3 py-1.5 text-sm font-bold flex items-center gap-1.5">
                  <span className="text-gray-400 text-xs">{userData.native_lang}</span>
                  <span className="text-gray-500">→</span>
                  <select
                    value={userData.learning_lang}
                    onChange={handleChangeLanguage}
                    className="bg-transparent font-black text-violet-300 outline-none cursor-pointer text-sm"
                  >
                    {['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada'].filter(l => l !== userData.native_lang).map(l => (
                      <option key={l} value={l} className="bg-gray-900 text-white">{l}</option>
                    ))}
                  </select>
                </div>
                <span className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-bold text-xs px-3 py-1.5 rounded-full">
                  {completedCount} cleared
                </span>
                <span className="bg-orange-500/15 border border-orange-500/25 text-orange-400 font-bold text-xs px-3 py-1.5 rounded-full">
                  🔥 {userData.streak_days}d streak
                </span>
              </div>
            </div>

            {/* Progress ring */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="url(#prog)" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - progressPct / 100)}`}
                    strokeLinecap="round" />
                  <defs>
                    <linearGradient id="prog" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#f0abfc" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black leading-none">{progressPct}%</span>
                  <span className="text-[9px] text-gray-500 font-bold">done</span>
                </div>
              </div>
              <div className="text-xs space-y-1.5">
                <p className="text-gray-400 font-semibold">Unlocked <span className="text-white font-black">{unlockedCount}</span></p>
                <p className="text-gray-400 font-semibold">Completed <span className="text-emerald-400 font-black">{completedCount}</span></p>
                <p className="text-gray-400 font-semibold">Coins <span className="text-amber-400 font-black">{userData.total_coins}</span></p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="relative z-10 flex flex-wrap gap-2.5 mt-5 pt-5 border-t border-white/8">
            <button
              onClick={() => navigate('/basics')}
              className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-violet-500/25 transition-all hover:scale-105"
            >
              📚 Basics Crash Course
            </button>
            <button
              onClick={() => navigate('/test')}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-black px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
            >
              ⚡ Placement Test
            </button>
            {currentLevel && (
              <button
                onClick={() => navigate(`/level/${currentLevel.level_id}`)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 ml-auto"
              >
                ▶ Continue Level {currentLevel.level_id}
              </button>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 bg-white/5 border border-white/8 rounded-2xl p-1 mb-6 w-fit">
          {[
            { key: 'map', label: '🗺️ Roadmap' },
            { key: 'leaderboard', label: '🏆 Rankings' },
            { key: 'streaks', label: '🔥 Streaks' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${tab === t.key
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── MAP TAB ── */}
        {tab === 'map' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Roadmap */}
            <div className="flex-1">
              <div
                className="relative rounded-3xl border border-white/8 bg-gradient-to-b from-gray-900/50 to-gray-950/70 backdrop-blur overflow-hidden"
                style={{ minHeight: levels.length * 120 + 80 }}
              >
                {/* dot grid */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }}
                />

                {/* vertical spine */}
                <div className="absolute left-1/2 top-12 bottom-12 w-px -translate-x-1/2 bg-gradient-to-b from-violet-500/30 via-cyan-500/20 to-pink-500/30 pointer-events-none" />

                {/* START label at top */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-600 tracking-widest uppercase">
                  ── START ──
                </div>

                {/* Nodes top → bottom (level 1 first) */}
                <div className="relative z-10 flex flex-col items-center py-14 gap-1">
                  {levels.map((lvl) => (
                    <RoadmapNode
                      key={lvl.id}
                      lvl={lvl}
                      onPlay={(id) => navigate(`/level/${id}`)}
                      onUnlock={handleUnlock}
                      unlocking={unlockingLevel}
                      userCoins={userData.total_coins}
                    />
                  ))}
                </div>

                {/* END label at bottom */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-700 tracking-widest uppercase">
                  ── MORE COMING ──
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-72 space-y-4">
              {/* Current level card */}
              {currentLevel && (() => {
                const theme = getTheme(currentLevel.level_id);
                const reward = currentLevel.level_id * 20 + 20;
                return (
                  <div className={`rounded-2xl p-5 bg-gradient-to-br ${theme.bg} shadow-2xl`}
                    style={{ boxShadow: `0 8px 40px ${theme.glow}33` }}>
                    <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Continue Playing</p>
                    <h3 className="text-xl font-black mb-3">Level {currentLevel.level_id} · {theme.label}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-sm ${i < currentLevel.lives_remaining ? 'opacity-100' : 'opacity-20'}`}>❤️</span>
                        ))}
                      </div>
                      <span className="text-sm font-black text-amber-300">+{reward} 🪙</span>
                    </div>
                    <button
                      onClick={() => navigate(`/level/${currentLevel.level_id}`)}
                      className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl font-black text-sm transition-all hover:scale-105 border border-white/20"
                    >
                      ▶ Play Now
                    </button>
                  </div>
                );
              })()}

              {/* Quick tips */}
              <div className="rounded-2xl p-5 bg-white/4 border border-white/8">
                <h4 className="font-black mb-3 text-sm text-gray-300">💡 Tips</h4>
                <ul className="space-y-2.5">
                  {[
                    '🎯 Complete Basics first to learn key phrases',
                    '🔥 Log in daily to grow your streak',
                    '🧩 Tap or drag word tiles to build answers',
                    '⭐ Perfect run auto-unlocks next level',
                  ].map((tip, i) => (
                    <li key={i} className="text-xs text-gray-400 font-semibold flex gap-2">
                      <span className="shrink-0">{tip.slice(0, 2)}</span>
                      <span>{tip.slice(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Language card */}
              <div className="rounded-2xl p-5 bg-white/4 border border-white/8">
                <h4 className="font-black mb-3 text-sm text-gray-300">🌐 Your Language</h4>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{userData.avatar}</div>
                  <div>
                    <p className="font-black text-sm">{userData.learning_lang}</p>
                    <p className="text-xs text-gray-500">Native: {userData.native_lang}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab === 'leaderboard' && (
          <div className="max-w-xl mx-auto">
            <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur overflow-hidden">
              <div className="p-6 border-b border-white/8">
                <h3 className="text-xl font-black">Top Learners</h3>
                <p className="text-gray-400 text-sm mt-1">Ranked by total coins earned</p>
              </div>
              <ul className="divide-y divide-white/5">
                {leaderboard.map((leader, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const isMe = leader.id === auth.currentUser?.uid;
                  return (
                    <li key={leader.id}
                      className={`flex items-center gap-4 px-6 py-4 transition-all ${isMe ? 'bg-violet-500/10' : 'hover:bg-white/4'}`}>
                      <span className="text-xl w-7 text-center flex-shrink-0">{medals[idx] || `#${idx + 1}`}</span>
                      <span className="text-2xl flex-shrink-0">{leader.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm truncate ${isMe ? 'text-violet-300' : ''}`}>
                          {leader.username}
                          {isMe && <span className="ml-1 text-[10px] bg-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded-full">You</span>}
                        </p>
                        <p className="text-xs text-gray-500">{leader.streak_days || 0}d streak</p>
                      </div>
                      <span className="font-black text-amber-400 text-sm">🪙 {leader.total_coins}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {/* ── STREAKS TAB ── */}
        {tab === 'streaks' && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="rounded-3xl p-8 bg-gradient-to-br from-orange-900/30 to-red-900/20 border border-orange-500/15 text-center">
              <div className="text-6xl mb-3 animate-bounce inline-block">🔥</div>
              <div className="text-5xl font-black text-orange-400">{userData.streak_days}</div>
              <p className="text-gray-300 font-bold mt-1">Day Streak</p>
              <p className="text-gray-500 text-sm mt-2">Log in and play daily to keep it going!</p>
            </div>

            <h3 className="font-black text-base">Milestone Rewards</h3>
            <div className="space-y-3">
              {milestones.map((ms, i) => (
                <StreakBadge key={i} ms={ms} current={userData.streak_days} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;