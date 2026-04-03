import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Kannada', 'Tamil'];

const LANG_ICONS = {
  English: { icon: '🗺️', script: 'ABC', color: 'from-blue-600 to-indigo-600' },
  Hindi: { icon: '🌸', script: 'हि', color: 'from-orange-500 to-amber-500' },
  Telugu: { icon: '🌺', script: 'తె', color: 'from-yellow-500 to-orange-500' },
  Kannada: { icon: '🌻', script: 'ಕ', color: 'from-yellow-400 to-red-500' },
  Tamil: { icon: '🌴', script: 'த', color: 'from-red-500 to-rose-600' },
};

const AVATARS = ['🧑‍🎓', '👩‍🚀', '🧙‍♂️', '🥷', '🦸‍♀️', '🦁', '🦊', '🐸', '🐉', '🦅', '🌟', '🎯'];

const ALL_INTERESTS = [
  { id: 'Gaming', icon: '🎮' },
  { id: 'Fashion', icon: '👗' },
  { id: 'Learning', icon: '📚' },
  { id: 'Foods', icon: '🍔' },
  { id: 'Travel', icon: '✈️' },
  { id: 'Music', icon: '🎵' }
];

const STEPS = ['Profile', 'Interests', 'Languages', 'Avatar'];

const Onboarding = ({ setHasOnboarded }) => {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [interests, setInterests] = useState([]);
  const [nativeLang, setNative] = useState('English');
  const [learningLang, setLearn] = useState('Telugu');
  const [avatar, setAvatar] = useState('🧑‍🎓');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const canNext = () => {
    if (step === 0) return username.trim().length >= 2 && fullName.trim().length >= 2;
    if (step === 1) return interests.length > 0;
    if (step === 2) return nativeLang !== learningLang;
    return true;
  };

  const toggleInterest = (id) => {
    setInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (nativeLang === learningLang) { setError('Native and Learning languages must differ.'); return; }
    setLoading(true);
    try {
      const uid = auth.currentUser.uid;
      const now = new Date().toISOString();
      await setDoc(doc(db, 'users', uid), {
        uid, username: username.trim(), full_name: fullName.trim(),
        email: auth.currentUser.email,
        interests: interests, // Save interests natively
        native_lang: nativeLang, learning_lang: learningLang, avatar,
        total_coins: 30, // Starting bonus
        streak_days: 1, // Start newly onboarded user with a 1-day streak
        last_played_date: now, // Initialize last_played_date to today so the streak continues tomorrow
        streak_bonus_claimed_3d: false, streak_bonus_claimed_7d: false,
        streak_bonus_claimed_14d: false, streak_bonus_claimed_30d: false,
        highest_unlocked_level: 1, created_at: now,
      });
      await setDoc(doc(db, 'level_progress', `${uid}_level_1`), {
        user_id: uid, level_id: 1, is_unlocked: true, is_completed: false,
        lives_remaining: 5, last_attempt_date: now, current_story_data: null,
        language_code: learningLang,
      });
      if (setHasOnboarded) setHasOnboarded(true);
      navigate('/basics');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    setError('');
    if (step === 2 && nativeLang === learningLang) {
      setError('You cannot learn a language you already speak natively.');
      return;
    }
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSave();
  };

  return (
    <div className="min-h-screen w-full bg-[#080a12] flex items-center justify-center p-4 overflow-hidden relative"
      style={{ fontFamily: "'Sora', 'DM Sans', sans-serif" }}>

      {/* ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0ea5e9, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">

        {/* header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              🌐
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">langTutor</h1>
          </div>
          <p className="text-gray-500 text-sm font-medium">Let's set up your profile</p>
        </div>

        {/* progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 transition-all ${i === step ? 'opacity-100' : i < step ? 'opacity-70' : 'opacity-30'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${i < step ? 'bg-violet-600 border-violet-600 text-white'
                    : i === step ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                      : 'bg-transparent border-gray-700 text-gray-600'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-black hidden sm:block ${i === step ? 'text-violet-300' : 'text-gray-600'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 max-w-[32px] h-px transition-all ${i < step ? 'bg-violet-600' : 'bg-gray-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* card */}
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-7 shadow-2xl"
          style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' }}>

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl p-4 text-sm font-semibold">
              <span className="flex-shrink-0">⚠️</span><span>{error}</span>
            </div>
          )}

          {/* ── STEP 0: Profile ── */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-white mb-1">Who are you?</h2>
                <p className="text-gray-500 text-sm font-medium">Tell us your name to personalise your journey.</p>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. priya_learns"
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 rounded-xl px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 rounded-xl px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
            </div>
          )}

          {/* ── STEP 1: Interests (NEW) ── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-white mb-1">What are your interests?</h2>
                <p className="text-gray-500 text-sm font-medium">Select topics you love. We'll give you custom rewards based on these!</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ALL_INTERESTS.map((item) => {
                  const isSelected = interests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleInterest(item.id)}
                      className={`relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'border-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.3)] bg-violet-600/20 scale-105' 
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-3xl mb-2 drop-shadow-md">{item.icon}</span>
                      <span className={`text-sm font-bold ${isSelected ? 'text-violet-200' : 'text-gray-400'}`}>
                        {item.id}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                          <span className="text-[10px] text-white font-black shrink-0">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 2: Languages ── */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-white mb-1">Your Languages</h2>
                <p className="text-gray-500 text-sm font-medium">Pick what you speak and what you want to learn.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">I speak (Native)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LANGUAGES.map(lang => {
                      const m = LANG_ICONS[lang];
                      const active = nativeLang === lang;
                      return (
                        <button key={lang} onClick={() => setNative(lang)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${active
                              ? 'border-violet-500/60 bg-violet-500/10 text-white'
                              : 'border-white/[0.06] bg-white/[0.03] text-gray-400 hover:border-white/[0.12] hover:text-gray-200'
                            }`}>
                          <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-black flex-shrink-0 bg-gradient-to-br ${m.color}`}>
                            {m.script}
                          </span>
                          <div>
                            <p className="text-xs font-black">{lang}</p>
                            <p className="text-[10px] text-gray-600 font-medium">{m.icon}</p>
                          </div>
                          {active && <span className="ml-auto text-violet-400 text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-white/[0.05]" />

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">I want to learn</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LANGUAGES.map(lang => {
                      const m = LANG_ICONS[lang];
                      const active = learningLang === lang;
                      const isSame = lang === nativeLang;
                      return (
                        <button key={lang} onClick={() => !isSame && setLearn(lang)} disabled={isSame}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${isSame ? 'opacity-30 cursor-not-allowed border-white/[0.04] bg-transparent text-gray-600'
                              : active ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                                : 'border-white/[0.06] bg-white/[0.03] text-gray-400 hover:border-white/[0.12] hover:text-gray-200'
                            }`}>
                          <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-black flex-shrink-0 bg-gradient-to-br ${m.color} ${isSame ? 'opacity-40' : ''}`}>
                            {m.script}
                          </span>
                          <div>
                            <p className="text-xs font-black">{lang}</p>
                            <p className="text-[10px] text-gray-600 font-medium">{isSame ? 'same as native' : m.icon}</p>
                          </div>
                          {active && !isSame && <span className="ml-auto text-emerald-400 text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {nativeLang !== learningLang && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 text-sm">
                  <span>{LANG_ICONS[nativeLang].icon}</span>
                  <span className="text-gray-400 font-medium text-xs">{nativeLang}</span>
                  <span className="text-gray-600 text-xs">→ learning →</span>
                  <span>{LANG_ICONS[learningLang].icon}</span>
                  <span className="text-emerald-300 font-black text-xs">{learningLang}</span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Avatar ── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-white mb-1">Pick Your Avatar</h2>
                <p className="text-gray-500 text-sm font-medium">Choose a character to represent you on the leaderboard.</p>
              </div>

              {/* big preview */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl border-2 border-violet-500/40 bg-violet-500/10 shadow-lg shadow-violet-500/20 transition-all">
                  {avatar}
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map(av => (
                  <button key={av} onClick={() => setAvatar(av)}
                    className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all border ${avatar === av
                        ? 'border-violet-500/60 bg-violet-500/20 scale-110 shadow-lg shadow-violet-500/20'
                        : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.14] hover:scale-105'
                      }`}>
                    {av}
                  </button>
                ))}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-amber-400 text-lg flex-shrink-0">🎁</span>
                <div>
                  <p className="text-amber-300 font-black text-sm">Welcome Bonus!</p>
                  <p className="text-gray-400 text-xs font-medium mt-0.5">You start with <span className="text-amber-400 font-black">30 🪙 coins</span> — enough to unlock your first few levels.</p>
                </div>
              </div>
            </div>
          )}

          {/* nav buttons */}
          <div className="flex gap-3 mt-7">
            {step > 0 && (
              <button onClick={() => { setStep(s => s - 1); setError(''); }}
                className="flex-1 py-3.5 rounded-xl font-black text-sm text-gray-400 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all">
                ← Back
              </button>
            )}
            <button onClick={goNext} disabled={!canNext() || loading}
              className="flex-1 py-3.5 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canNext() && !loading
                  ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                  : 'rgba(109,40,217,0.3)',
                boxShadow: canNext() && !loading ? '0 8px 32px rgba(124,58,237,0.35)' : 'none',
              }}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Setting up...</span>
                : step < STEPS.length - 1 ? `Next: ${STEPS[step + 1]} →` : '🚀 Start Learning'}
            </button>
          </div>
        </div>

        {/* step hint */}
        <p className="text-center mt-4 text-xs text-gray-700 font-medium">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
      </div>
    </div>
  );
};

export default Onboarding;