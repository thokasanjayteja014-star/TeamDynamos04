import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  doc, getDoc, collection, query, orderBy, limit,
  getDocs, updateDoc, setDoc,
} from 'firebase/firestore';

/* ── node themes cycling every 5 levels ── */
const THEMES = [
  { grad: 'from-violet-600 to-purple-700', glow: '#7c3aed', icon: '🌱', tier: 'Beginner' },
  { grad: 'from-sky-500   to-blue-600', glow: '#0ea5e9', icon: '🌊', tier: 'Explorer' },
  { grad: 'from-emerald-500 to-teal-600', glow: '#10b981', icon: '🔥', tier: 'Rising' },
  { grad: 'from-amber-500  to-orange-600', glow: '#f59e0b', icon: '⚡', tier: 'Advanced' },
  { grad: 'from-rose-500   to-pink-600', glow: '#f43f5e', icon: '👑', tier: 'Master' },
];
const theme = (lvl) => THEMES[(lvl - 1) % THEMES.length];

/* zig-zag horizontal offsets */
const ZZ = [0, 1, 2, 1, 0, -1, -2, -1];
const xOff = (i) => ZZ[i % ZZ.length];

/* coin cost to unlock a level */
const unlockCost = (lvl) => {
  if (lvl <= 2) return 0;
  if (lvl <= 5) return (lvl - 2) * 10;
  return 30 + (lvl - 5) * 20;
};

const STREAK_MS = [
  { days: 3, reward: 10, key: 'streak_bonus_claimed_3d', icon: '🔥', label: '3-Day Blaze' },
  { days: 7, reward: 30, key: 'streak_bonus_claimed_7d', icon: '⚡', label: 'Week Warrior' },
  { days: 14, reward: 75, key: 'streak_bonus_claimed_14d', icon: '💎', label: 'Fortnight Force' },
  { days: 30, reward: 200, key: 'streak_bonus_claimed_30d', icon: '🐉', label: 'Monthly Master' },
];

/* ─────────────────────────────────────────────
   QUEST NODE
───────────────────────────────────────────── */
const QuestNode = ({ questId, isUnlocked, isCompleted, onClick }) => {
  return (
    <div className="relative flex flex-col items-center">
      <div className="group relative z-10">
        {isCompleted && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 scale-125 pointer-events-none bg-amber-500 blur-md" />
        )}
        <button
          onClick={onClick}
          disabled={!isUnlocked}
          className={`
            relative w-[64px] h-[64px] rounded-2xl flex flex-col items-center justify-center
            font-black shadow-2xl border-[3px] transition-all duration-300 transform rotate-45 hover:scale-110
            ${isCompleted
              ? 'bg-gradient-to-br from-amber-600 to-yellow-500 border-amber-300 text-amber-950'
              : isUnlocked
                ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500/50 text-amber-400'
                : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 text-gray-600'
            }
            ${!isUnlocked && 'opacity-60 cursor-not-allowed cursor-pointer'}
          `}
          style={isUnlocked && !isCompleted ? { boxShadow: `0 6px 28px rgba(245, 158, 11, 0.4)` } : {}}
        >
          <div className="-rotate-45 flex flex-col items-center">
            <span className="text-xl">{isCompleted ? '🏆' : isUnlocked ? '🎁' : '🔒'}</span>
          </div>
        </button>

        {/* Tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <div className="bg-gray-900/98 backdrop-blur text-white rounded-2xl p-3 text-center shadow-2xl border border-amber-500/20 min-w-[140px]">
            <p className="font-black text-sm text-amber-400">Quest {questId}</p>
            <p className="text-xs text-gray-400 font-semibold mb-1">Mystery Reward</p>
            {isUnlocked ? (
              <p className="text-xs text-white mt-1">{isCompleted ? 'Reward claimed!' : 'Click to claim reward'}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1 font-bold">Complete Level {questId * 2} to unlock</p>
            )}
          </div>
          <div className="w-2 h-2 bg-gray-900/98 rotate-45 mx-auto -mt-1 border-l border-t border-amber-500/20" />
        </div>
      </div>
      <p className="absolute -bottom-8 whitespace-nowrap text-[11px] font-black text-amber-400/80 drop-shadow-md">
        {isCompleted ? '✓ Claimed' : isUnlocked ? `Quest ${questId}` : 'Locked'}
      </p>
    </div>
  );
};

/* ── LEVEL NODE ── */
const LevelNode = ({ lvl, onPlay, onUnlock, unlocking, coins, avatar, isCurrent }) => {
  const t = theme(lvl.level_id);
  const cost = unlockCost(lvl.level_id);
  const canAfford = coins >= cost;

  const isActive = lvl.is_unlocked && !lvl.is_completed && lvl.lives_remaining > 0;
  const isNoLives = lvl.is_unlocked && !lvl.is_completed && lvl.lives_remaining === 0;
  const isDone = lvl.is_completed;
  const isLocked = !lvl.is_unlocked;

  const handleClick = () => {
    if (isActive || isDone) onPlay(lvl.level_id);
    else if (isLocked) onUnlock(cost, lvl.level_id);
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {isCurrent && isActive && (
         <div className="absolute -top-[56px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-bounce pointer-events-none">
           <div className="text-[42px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] filter transition-transform">{avatar}</div>
           <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white/90 drop-shadow-md mt-1" />
         </div>
      )}

      <div className="group relative z-10">
        {isActive && (
          <div className="absolute inset-0 rounded-full scale-[1.35] animate-pulse opacity-30 pointer-events-none"
            style={{ background: t.glow, filter: 'blur(8px)' }} />
        )}

        <button onClick={handleClick}
          disabled={unlocking === lvl.level_id || isNoLives || (isLocked && !canAfford)}
          title={
            isLocked
              ? cost === 0 ? 'Free to unlock!' : `${cost} 🪙 to unlock`
              : isNoLives ? 'No lives remaining' : isDone ? 'Replay' : 'Play'
          }
          className={`relative w-[68px] h-[68px] rounded-full flex flex-col items-center justify-center font-black text-white border-[3px] transition-all duration-300 ${isDone ? `bg-gradient-to-br ${t.grad} border-white/60 hover:scale-110 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)]`
              : isActive ? `bg-gradient-to-br ${t.grad} border-white shadow-[0_0_30px_${t.glow}99] hover:scale-110 cursor-pointer`
                : isLocked && canAfford ? 'bg-gray-800/80 border-white/15 hover:scale-105 cursor-pointer hover:border-violet-500/40 shadow-inner'
                  : isLocked ? 'bg-gray-900/70 border-gray-800/60 cursor-not-allowed opacity-50'
                    : 'bg-gray-800/60 border-gray-700/40 cursor-not-allowed opacity-40'
            }`}>
          {unlocking === lvl.level_id
            ? <span className="text-lg animate-spin">⚙️</span>
            : isDone ? <span className="text-xl drop-shadow-md">⭐</span>
              : isActive ? <span className="text-2xl drop-shadow-md">{t.icon}</span>
                : isLocked ? <span className="text-lg opacity-60">🔒</span>
                  : <span className="text-lg">💀</span>}
          <span className="text-[12px] font-black mt-0.5 drop-shadow-md">{lvl.level_id}</span>
        </button>

        {/* hover tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-30 pointer-events-none
          opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150">
          <div className="bg-gray-950/98 border border-white/10 rounded-2xl px-4 py-3 text-center shadow-2xl min-w-[130px]">
            <p className="font-black text-xs text-white">Level {lvl.level_id}</p>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{t.tier}</p>
            {lvl.is_unlocked ? (
              <>
                <div className="flex justify-center gap-0.5 my-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-[10px] ${i < lvl.lives_remaining ? 'opacity-100' : 'opacity-15'}`}>❤️</span>
                  ))}
                </div>
                {isNoLives && <p className="text-[10px] text-red-400 font-bold">No lives!</p>}
                {isDone && <p className="text-[10px] text-emerald-400 font-bold">Completed ✓</p>}
              </>
            ) : (
              <p className="text-[10px] text-amber-400 font-bold mt-1.5">
                {cost === 0 ? 'Free!' : `${cost} 🪙`}
              </p>
            )}
          </div>
          <div className="w-2 h-2 bg-gray-950/98 rotate-45 mx-auto -mt-1 border-r border-b border-white/10" />
        </div>
      </div>

      <p className={`absolute -bottom-7 whitespace-nowrap text-[11px] font-black drop-shadow-md ${isDone ? 'text-emerald-400/90' : isActive ? 'text-white/90' : 'text-gray-600'
        }`}>
        {isDone ? '✓ Done' : isActive ? 'Play Now' : isLocked ? `${cost || 'Free'}${cost ? '🪙' : ''}` : 'No lives'}
      </p>
    </div>
  );
};

/* ── DASHBOARD ── */
const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [levels, setLevels] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(null);
  const [tab, setTab] = useState('map');
  const navigate = useNavigate();

  /* ── fetch everything ── */
  const fetchData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (!userSnap.exists()) { navigate('/onboarding'); return; }
      const ud = { id: userSnap.id, ...userSnap.data() };

      /* streak update */
      const today = new Date().toDateString();
      if (ud.last_played_date !== today) {
        try {
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          const wasYesterday = ud.last_played_date === yesterday.toDateString();
          const newStreak = wasYesterday ? (ud.streak_days || 0) + 1 : 1;
          let bonusCoins = 0;
          const bonusUpdates = {};
          for (const ms of STREAK_MS) {
            if (newStreak >= ms.days && !ud[ms.key]) {
              bonusCoins += ms.reward;
              bonusUpdates[ms.key] = true;
              ud[ms.key] = true;
            }
          }
          ud.streak_days = newStreak;
          ud.total_coins = (ud.total_coins || 0) + bonusCoins;
          ud.last_played_date = today;
          await updateDoc(doc(db, 'users', user.uid), {
            streak_days: newStreak, last_played_date: today,
            total_coins: ud.total_coins, ...bonusUpdates,
          });
        } catch (e) {
          console.warn("Could not update streak due to permissions:", e);
        }
      }
      setUserData(ud);

      /* load levels */
      try {
        const highest = ud.highest_unlocked_level || 1;
        const lvls = [];
        for (let i = 1; i <= highest + 2; i++) {
          const snap = await getDoc(doc(db, 'level_progress', `${user.uid}_level_${i}`));
          if (snap.exists()) {
            lvls.push({ id: snap.id, ...snap.data() });
          } else {
            lvls.push({
              id: `${user.uid}_level_${i}`,
              level_id: i, is_unlocked: i === 1, is_completed: false,
              lives_remaining: 5, language_code: ud.learning_lang,
            });
          }
        }
        setLevels(lvls.sort((a, b) => a.level_id - b.level_id));
      } catch (lvlErr) {
        console.error("Failed to load level progress:", lvlErr);
        // Fallback: just show level 1 unlocked
        setLevels([{
          id: `${user.uid}_level_1`,
          level_id: 1, is_unlocked: true, is_completed: false,
          lives_remaining: 5, language_code: ud.learning_lang,
        }]);
      }

      /* leaderboard */
      try {
        const lbSnap = await getDocs(query(collection(db, 'users'), orderBy('total_coins', 'desc'), limit(10)));
        const lb = [];
        lbSnap.forEach(d => lb.push({ id: d.id, ...d.data() }));
        setLeaderboard(lb);
      } catch (e) {
        console.error("Leaderboard fetch failed:", e);
      }
    } catch (err) {
      setError('Failed to load dashboard. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── unlock level ── */
  const handleUnlock = async (cost, levelId) => {
    if (!userData) return;
    if (userData.total_coins < cost && cost > 0) { setError('Not enough coins to unlock this level!'); return; }
    setUnlocking(levelId);
    try {
      const newCoins = userData.total_coins - (cost || 0);
      const newHighest = Math.max(userData.highest_unlocked_level || 1, levelId);
      const uid = auth.currentUser.uid;
      await updateDoc(doc(db, 'users', uid), { total_coins: newCoins, highest_unlocked_level: newHighest });
      await setDoc(doc(db, 'level_progress', `${uid}_level_${levelId}`), {
        user_id: uid, level_id: levelId, is_unlocked: true, is_completed: false,
        lives_remaining: 5, last_attempt_date: new Date().toISOString(),
        current_story_data: null, language_code: userData.learning_lang,
      });
      setUserData(prev => ({ ...prev, total_coins: newCoins, highest_unlocked_level: newHighest }));
      setLevels(prev => prev.map(l =>
        l.level_id === levelId
          ? { ...l, is_unlocked: true }
          : l.level_id === levelId + 1
            ? l
            : l
      ));
      /* add next locked node if needed */
      setLevels(prev => {
        const maxId = Math.max(...prev.map(l => l.level_id));
        const uid2 = auth.currentUser.uid;
        if (!prev.find(l => l.level_id === maxId + 1)) {
          return [...prev, {
            id: `${uid2}_level_${maxId + 1}`, level_id: maxId + 1,
            is_unlocked: false, is_completed: false, lives_remaining: 5,
          }];
        }
        return prev;
      });
    } catch (err) { setError('Failed to unlock: ' + err.message); }
    finally { setUnlocking(null); }
  };

  /* ── change language ── */
  const handleChangeLang = async (e) => {
    const newLang = e.target.value;
    if (newLang === userData.learning_lang) return;
    if (!window.confirm(`Switch to learning ${newLang}? Your level progress will reset.`)) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        learning_lang: newLang, highest_unlocked_level: 1, cached_basics: null,
      });
      window.location.reload();
    } catch { setError('Failed to change language'); setLoading(false); }
  };

  /* ── derived ── */
  if (loading) return (
    <div className="min-h-screen bg-[#080a12] flex items-center justify-center" style={{ fontFamily: "'Sora','DM Sans',sans-serif" }}>
      <div className="text-center">
        <div className="w-14 h-14 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-semibold text-sm">Loading your adventure…</p>
      </div>
    </div>
  );
  if (!userData) {
    if (error) {
      return (
        <div className="min-h-screen bg-[#080a12] flex items-center justify-center p-4">
          <div className="bg-red-950 border border-red-500 p-6 rounded-xl text-red-300 max-w-md text-center">
            <h2 className="font-bold text-lg mb-2">Oops! Something went wrong</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 bg-red-800 px-4 py-2 rounded-lg font-bold hover:bg-red-700">Refresh Page</button>
          </div>
        </div>
      );
    }
    return null;
  }

  const completed = levels.filter(l => l.is_completed).length;
  const unlocked = levels.filter(l => l.is_unlocked).length;
  const progressPct = levels.length > 1 ? Math.round((completed / Math.max(unlocked, 1)) * 100) : 0;
  const currentLevel = levels.find(l => l.is_unlocked && !l.is_completed && l.lives_remaining > 0);
  const allLangs = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada'];

  return (
    <div className="min-h-screen w-full bg-[#080a12] text-white" style={{ fontFamily: "'Sora','DM Sans',sans-serif" }}>

      {/* ── error banner ── */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
          bg-red-950/90 border border-red-500/30 text-red-300 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-semibold max-w-[90vw]">
          ⚠️ {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-300 font-black">✕</button>
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#080a12]/90 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black shadow-lg"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>🌐</div>
            <span className="font-black tracking-tight hidden sm:block text-base">langTutor</span>
          </div>

          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-full px-4 py-2">
            <span className="font-black text-amber-400 text-sm">🪙 {userData.total_coins}</span>
            <span className="w-px h-4 bg-white/10" />
            <span className="font-black text-orange-400 text-sm">🔥 {userData.streak_days}d</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/basics')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 transition-all">
              📚 Basics
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{userData.avatar}</span>
              <span className="hidden md:block text-sm font-black text-gray-300 max-w-[100px] truncate">{userData.username}</span>
            </div>
            <button onClick={() => auth.signOut()}
              className="text-xs text-gray-600 hover:text-red-400 font-bold transition-colors">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* ── HERO ── */}
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.06] p-6 md:p-8"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.08) 50%, rgba(244,63,94,0.06) 100%)' }}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
            <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-8"
              style={{ background: 'radial-gradient(circle, #f43f5e, transparent 70%)' }} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-violet-400 text-xs font-black uppercase tracking-widest mb-1">Your Journey</p>
              <h1 className="text-2xl md:text-3xl font-black mb-4 leading-tight">
                Hey, <span style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{userData.username}</span> 👋
              </h1>

              <div className="flex flex-wrap gap-2 mb-5">
                {/* language switcher */}
                <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-3.5 py-2">
                  <span className="text-gray-500 text-xs font-semibold">{userData.native_lang}</span>
                  <span className="text-gray-700 text-xs">→</span>
                  <select value={userData.learning_lang} onChange={handleChangeLang}
                    className="bg-transparent text-violet-300 font-black text-xs outline-none cursor-pointer">
                    {allLangs.filter(l => l !== userData.native_lang).map(l => (
                      <option key={l} value={l} className="bg-gray-900 text-white">{l}</option>
                    ))}
                  </select>
                </div>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black px-3 py-2 rounded-full">
                  {completed} cleared
                </span>
                <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black px-3 py-2 rounded-full">
                  🔥 {userData.streak_days}d streak
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('/basics')}
                  className="flex items-center gap-2 text-sm font-black px-5 py-2.5 rounded-xl text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
                  📚 Basics
                </button>
                <button onClick={() => navigate('/test')}
                  className="flex items-center gap-2 text-sm font-black px-5 py-2.5 rounded-xl text-black transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
                  ⚡ Placement Test
                </button>
                {currentLevel && (
                  <button onClick={() => navigate(`/level/${currentLevel.level_id}`)}
                    className="flex items-center gap-2 text-sm font-black px-5 py-2.5 rounded-xl text-white transition-all hover:scale-105 ml-auto"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
                    ▶ Level {currentLevel.level_id}
                  </button>
                )}
              </div>
            </div>

            {/* progress ring */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="30" fill="none"
                    stroke="url(#pg)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - progressPct / 100)}`} />
                  <defs>
                    <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black leading-none">{progressPct}%</span>
                  <span className="text-[9px] text-gray-600 font-bold">done</span>
                </div>
              </div>
              <div className="text-xs space-y-2">
                <p className="text-gray-500 font-semibold">Unlocked <span className="text-white font-black">{unlocked}</span></p>
                <p className="text-gray-500 font-semibold">Cleared  <span className="text-emerald-400 font-black">{completed}</span></p>
                <p className="text-gray-500 font-semibold">Coins    <span className="text-amber-400 font-black">{userData.total_coins}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1 w-fit">
          {[
            { key: 'map', label: '🗺️ Roadmap' },
            { key: 'leaderboard', label: '🏆 Rankings' },
            { key: 'streaks', label: '🔥 Streaks' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${tab === t.key
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.04]'
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ MAP TAB ══ */}
        {tab === 'map' && (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* roadmap */}
            <div className="flex-1 min-w-0">
              <div className="relative rounded-3xl border border-white/[0.06] overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(15,17,30,0.9) 0%, rgba(8,10,18,0.95) 100%)',
                  minHeight: levels.length * 118 + 100,
                }}>
                {/* dot grid */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }} />
                {/* spine */}
                <div className="absolute left-1/2 top-16 bottom-16 w-px pointer-events-none -translate-x-1/2"
                  style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.3), rgba(244,63,94,0.2))' }} />

                <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-700 tracking-widest uppercase z-20">
                  ─ START ─
                </div>

                <div className="relative z-10 w-full" style={{ height: (() => {
                     const highest = userData?.highest_unlocked_level || 1;
                     const maxLvl = Math.max(highest + 15, levels.length + 5);
                     const visualNodesCount = maxLvl + Math.floor(maxLvl / 2); // Levels + Quests
                     return 100 + visualNodesCount * 130 + 100;
                })() }}>
                  {(() => {
                     // 1. Generate unlimited nodes exactly like Candy Crush
                     const highest = userData?.highest_unlocked_level || 1;
                     const maxLvl = Math.max(highest + 15, levels.length + 5);
                     
                     const visualNodes = [];
                     for (let i = 1; i <= maxLvl; i++) {
                         const actualLvl = levels.find(l => l.level_id === i);
                         const lvlData = actualLvl || {
                           level_id: i, is_unlocked: false, is_completed: false, lives_remaining: 5,
                         };
                         visualNodes.push({ type: 'level', data: lvlData });
                         
                         // Add Quest node after even levels
                         if (i % 2 === 0) {
                             visualNodes.push({ type: 'quest', id: i / 2, prevLevel: lvlData });
                         }
                     }

                     // 2. Plot mathematical S-Curve coordinates
                     visualNodes.forEach((node, i) => {
                         // Alternate weaving offsets: 0, 70, 0, -70, etc.
                         // Math.sin provides natural smooth sweeping curve
                         node.x = Math.sin(i * 0.8) * 85; 
                         node.y = 100 + i * 130;  // 130px spacing
                     });

                     return (
                       <>
                         {/* Giant Continuous SVG S-Curve */}
                         <svg className="absolute inset-0 pointer-events-none" style={{ width: '400px', height: '100%', left: '50%', marginLeft: '-200px' }}>
                            {visualNodes.map((node, i) => {
                               if (i === 0) return null;
                               const prev = visualNodes[i - 1];
                               
                               const px = 200 + prev.x;
                               const py = prev.y;
                               const cx = 200 + node.x;
                               const cy = node.y;

                               // Direction of bulge (from right side, then left side)
                               // By making control points extend significantly beyond the nodes,
                               // the path visually "exits" the side of the node.
                               const dir = (i % 2 !== 0) ? 1 : -1;
                               const controlX1 = px + dir * 140;
                               const controlX2 = cx + dir * 140;

                               // Path appearance based on unlock state
                               const unlocked = node.type === 'level' ? node.data.is_unlocked : (userData?.completed_quests?.includes?.(node.id));
                               const isPrevUnlocked = prev.type === 'level' ? prev.data.is_completed : (userData?.completed_quests?.includes?.(prev.id));
                               
                               const pathColor = isPrevUnlocked 
                                  ? (unlocked ? 'rgba(245, 158, 11, 0.7)' : 'rgba(245, 158, 11, 0.3)')
                                  : 'rgba(255,255,255,0.06)';

                               return (
                                  <path 
                                    key={`path_${i}`}
                                    d={`M ${px} ${py} C ${controlX1} ${py}, ${controlX2} ${cy}, ${cx} ${cy}`}
                                    fill="none" 
                                    stroke={pathColor} 
                                    strokeWidth="14" 
                                    strokeDasharray={isPrevUnlocked ? "0" : "0 24"} 
                                    strokeLinecap="round" 
                                    className="transition-all duration-700"
                                  />
                               );
                            })}
                         </svg>

                         {/* Node Elements Absolutely Positioned */}
                         {visualNodes.map((node, i) => {
                            if (node.type === 'level') {
                              return (
                                <div key={`lvl_${node.data.level_id}`} className="absolute" style={{ left: `calc(50% + ${node.x}px)`, top: `${node.y}px`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                                   <LevelNode
                                     lvl={node.data}
                                     onPlay={(id) => navigate(`/level/${id}`)}
                                     onUnlock={handleUnlock}
                                     unlocking={unlocking}
                                     coins={userData.total_coins}
                                     avatar={userData.avatar}
                                     isCurrent={currentLevel && currentLevel.level_id === node.data.level_id}
                                   />
                                </div>
                              );
                            } else {
                              return (
                                <div key={`quest_${node.id}`} className="absolute" style={{ left: `calc(50% + ${node.x}px)`, top: `${node.y}px`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                                   <QuestNode 
                                     questId={node.id}
                                     isUnlocked={node.prevLevel.is_completed}
                                     isCompleted={userData?.completed_quests?.includes(node.id)}
                                     onClick={() => navigate(`/quest/${node.id}`)}
                                   />
                                </div>
                              );
                            }
                         })}
                       </>
                     );
                  })()}
                </div>

                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-800 tracking-widest uppercase">
                  ─ ∞ MORE ─
                </div>
              </div>
            </div>

            {/* sidebar */}
            <div className="lg:w-72 space-y-4">
              {/* active level card */}
              {currentLevel && (() => {
                const t2 = theme(currentLevel.level_id);
                return (
                  <div className="rounded-3xl p-5 border border-white/[0.08] overflow-hidden relative"
                    style={{ background: `linear-gradient(135deg, ${t2.glow}22, ${t2.glow}08)`, boxShadow: `0 8px 40px ${t2.glow}22` }}>
                    <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: t2.glow }}>Continue</p>
                    <h3 className="text-lg font-black mb-3">Level {currentLevel.level_id} · {t2.tier}</h3>
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm transition-opacity ${i < currentLevel.lives_remaining ? 'opacity-100' : 'opacity-15'}`}>❤️</span>
                      ))}
                    </div>
                    <button onClick={() => navigate(`/level/${currentLevel.level_id}`)}
                      className="w-full py-3 rounded-xl font-black text-sm text-white transition-all hover:scale-105 border border-white/10 bg-white/10 hover:bg-white/15">
                      ▶ Play Now
                    </button>
                  </div>
                );
              })()}

              {/* tips */}
              <div className="rounded-3xl p-5 border border-white/[0.06] bg-white/[0.02]">
                <h4 className="font-black text-sm text-gray-300 mb-3">💡 Tips</h4>
                <ul className="space-y-2.5">
                  {[
                    ['🎯', 'Do Basics first for key phrases'],
                    ['🔥', 'Log in daily to keep your streak'],
                    ['🧩', 'Drag word tiles to build answers'],
                    ['⭐', 'Perfect runs auto-unlock next level'],
                  ].map(([icon, tip], i) => (
                    <li key={i} className="text-xs text-gray-500 font-semibold flex gap-2 items-start">
                      <span className="flex-shrink-0">{icon}</span><span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* language info */}
              <div className="rounded-3xl p-5 border border-white/[0.06] bg-white/[0.02]">
                <h4 className="font-black text-sm text-gray-300 mb-3">🌐 Language</h4>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{userData.avatar}</span>
                  <div>
                    <p className="font-black text-sm">{userData.learning_lang}</p>
                    <p className="text-xs text-gray-600">Native: {userData.native_lang}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ LEADERBOARD TAB ══ */}
        {tab === 'leaderboard' && (
          <div className="max-w-xl mx-auto">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="p-6 border-b border-white/[0.05]">
                <h3 className="text-lg font-black">🏆 Top Learners</h3>
                <p className="text-gray-500 text-xs font-medium mt-1">Ranked by total coins</p>
              </div>
              <ul className="divide-y divide-white/[0.04]">
                {leaderboard.map((user, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const isMe = user.id === auth.currentUser?.uid;
                  return (
                    <li key={user.id}
                      className={`flex items-center gap-4 px-6 py-4 transition-all ${isMe ? 'bg-violet-500/8' : 'hover:bg-white/[0.02]'}`}>
                      <span className="text-lg w-6 text-center flex-shrink-0">{medals[i] || `#${i + 1}`}</span>
                      <span className="text-2xl flex-shrink-0">{user.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm truncate ${isMe ? 'text-violet-300' : 'text-gray-200'}`}>
                          {user.username}
                          {isMe && <span className="ml-2 text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full font-black">You</span>}
                        </p>
                        <p className="text-[11px] text-gray-600 font-semibold">{user.streak_days || 0}d streak</p>
                      </div>
                      <span className="font-black text-amber-400 text-sm">🪙 {user.total_coins}</span>
                    </li>
                  );
                })}
                {leaderboard.length === 0 && (
                  <li className="py-12 text-center text-gray-600 text-sm font-semibold">
                    No data yet. Play levels to earn coins!
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* ══ STREAKS TAB ══ */}
        {tab === 'streaks' && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="rounded-3xl p-8 text-center border border-orange-500/15"
              style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.08), rgba(244,63,94,0.06))' }}>
              <div className="text-6xl mb-3 animate-bounce inline-block">🔥</div>
              <div className="text-5xl font-black text-orange-400">{userData.streak_days}</div>
              <p className="text-gray-400 font-bold mt-1 text-sm">Day Streak</p>
              <p className="text-gray-600 text-xs mt-2 font-medium">Log in and play daily to keep it alive!</p>
            </div>

            <h3 className="font-black text-sm text-gray-300">Milestone Rewards</h3>

            <div className="space-y-3">
              {STREAK_MS.map((ms, i) => {
                const reached = (userData.streak_days || 0) >= ms.days;
                const claimed = !!userData[ms.key];
                return (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${claimed ? 'border-emerald-500/20 bg-emerald-500/5'
                      : reached ? 'border-amber-500/25 bg-amber-500/5'
                        : 'border-white/[0.05] bg-white/[0.02]'
                    }`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${claimed ? 'bg-emerald-600' : reached ? 'bg-amber-500' : 'bg-gray-800'
                      }`}>
                      {claimed ? '✓' : ms.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm ${claimed ? 'text-emerald-400' : reached ? 'text-amber-300' : 'text-gray-400'}`}>
                        {ms.label}
                      </p>
                      <p className="text-xs text-gray-600 font-semibold">
                        {ms.days}-day streak · +{ms.reward} 🪙
                      </p>
                    </div>
                    {claimed && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-black">Claimed</span>}
                    {reached && !claimed && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full font-black animate-pulse">Earned!</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;