import React, { useState, useEffect } from 'react';
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

const AVATARS = ['🧑‍🎓', '👩‍🚀', '🧙‍♂️', '🥷', '🦸‍♀️', '🦁', '🦊', '🐉', '🌟'];

const ALL_INTERESTS = [
  'Gaming', 'Fashion', 'Learning', 'Foods', 'Travel', 'Music', 'Sports', 'Art', 'Technology'
];

const STEPS = ['Identity', 'Languages', 'Interests'];

const Onboarding = ({ setHasOnboarded }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [visibleStep, setVisibleStep] = useState(0);

  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [nativeLang, setNative] = useState('English');
  const [learningLang, setLearn] = useState('');
  const [interests, setInterests] = useState([]);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [completeAnim, setCompleteAnim] = useState(false);
  const navigate = useNavigate();

  const changeStep = (newStep) => {
    setDirection(newStep > step ? 1 : -1);
    setIsTransitioning(true);
    setError('');
    setTimeout(() => {
      setStep(newStep);
      setVisibleStep(newStep);
      setIsTransitioning(false);
    }, 200);
  };

  const canNext = () => {
    if (step === 0) return username.trim().length >= 3 && avatar !== '';
    if (step === 1) return learningLang !== '' && nativeLang !== learningLang;
    if (step === 2) return interests.length > 0;
    return true;
  };

  const toggleInterest = (id) => {
    setInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!canNext()) return;
    setLoading(true);
    setCompleteAnim(true);
    
    try {
      const uid = auth.currentUser.uid;
      const now = new Date().toISOString();
      await setDoc(doc(db, 'users', uid), {
        uid, username: username.trim(),
        email: auth.currentUser.email,
        interests: interests,
        native_lang: nativeLang, learning_lang: learningLang, avatar,
        total_coins: 30, // Starting bonus
        streak_days: 1, 
        last_played_date: now, 
        streak_bonus_claimed_3d: false, streak_bonus_claimed_7d: false,
        streak_bonus_claimed_14d: false, streak_bonus_claimed_30d: false,
        highest_unlocked_level: 1, created_at: now,
      });
      await setDoc(doc(db, 'level_progress', `${uid}_level_1`), {
        user_id: uid, level_id: 1, is_unlocked: true, is_completed: false,
        lives_remaining: 5, last_attempt_date: now, current_story_data: null,
        language_code: learningLang,
      });
      
      // Delay navigation specifically to allow the button to animate into a checkmark
      setTimeout(() => {
        if (setHasOnboarded) setHasOnboarded(true);
        navigate('/dashboard');
      }, 700);

    } catch (err) {
      setError(err.message);
      setLoading(false);
      setCompleteAnim(false);
    }
  };

  // Define transition classes dynamically based on step state
  const stepContainerClass = `transition-all duration-200 ease-in-out absolute inset-0 w-full h-full p-[40px]
    ${isTransitioning 
      ? direction > 0 ? '-translate-x-[80px] opacity-0' : 'translate-x-[80px] opacity-0' 
      : 'translate-x-0 opacity-100'}`;

  return (
    <div className={`min-h-screen w-full bg-base-bg flex flex-col items-center justify-center p-4 relative overflow-hidden ${completeAnim ? 'animate-pageFadeOut' : 'animate-pageFadeIn'}`}>

      {/* Header outside card */}
      <div className="flex items-center justify-center mb-8 gap-3 animate-fadeUp">
         <svg className="w-10 h-10 shadow-[0_0_20px_rgba(124,58,237,0.4)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="url(#globe-gradient-ob)" />
            <path d="M2.5 12H21.5M12 2V22M6.5 4.5C8.5 7.5 8.5 16.5 6.5 19.5M17.5 4.5C15.5 7.5 15.5 16.5 17.5 19.5" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="globe-gradient-ob" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C3AED" />
                <stop offset="1" stopColor="#EC4899" />
              </linearGradient>
            </defs>
         </svg>
      </div>

      {/* Progress Dots Component */}
      <div className="flex items-center justify-center gap-0 w-[400px] mb-8 relative">
        {[0, 1, 2].map((idx) => {
           const isActive = idx === visibleStep;
           const isComplete = idx < visibleStep;
           
           return (
             <React.Fragment key={idx}>
               {/* Dot */}
               <div className={`relative w-[10px] h-[10px] rounded-full transition-colors duration-300 z-10 
                  ${isActive ? 'bg-primary animate-dotBounce' : isComplete ? 'bg-success' : 'bg-surface border border-[#333355]'}`}>
                  {(isComplete || (isActive && step > visibleStep)) && (
                    <svg className="absolute w-4 h-4 text-white -top-[3px] -left-[3px] animate-[strokeDash_300ms_ease_forwards]" style={{strokeDasharray:20, strokeDashoffset:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
               </div>
               
               {/* Connecting Line */}
               {idx < 2 && (
                 <div className="w-[80px] h-[2px] bg-surface mx-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-success transform origin-left transition-transform duration-400 ease" 
                       style={{ transform: visibleStep > idx ? 'scaleX(1)' : 'scaleX(0)' }} />
                 </div>
               )}
             </React.Fragment>
           )
        })}
      </div>

      {/* Main Wizard Card Container */}
      <div className="w-[560px] h-[580px] animate-cardDrop bg-card-bg border border-[rgba(124,58,237,0.2)] rounded-[24px] relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
         
         {/* -- STEP 1: Avatar & Username -- */}
         {visibleStep === 0 && (
           <div className={stepContainerClass}>
              <h2 className="text-[28px] font-bold text-white mb-2">Let's set up your profile</h2>
              <p className="text-[15px] text-text-body mb-8">Pick your identity to represent you.</p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {AVATARS.map((av, index) => (
                  <button
                    key={av}
                    onClick={() => setAvatar(av)}
                    className={`relative w-[72px] h-[72px] mx-auto flex items-center justify-center text-[32px] rounded-[16px] animate-tileIn transition-all duration-200 group
                      ${avatar === av 
                         ? 'border-2 border-primary bg-[rgba(124,58,237,0.15)] shadow-[0_0_0_4px_rgba(124,58,237,0.15)]' 
                         : 'bg-surface border-2 border-transparent hover:scale-[1.06] hover:bg-[#222240] hover:border-[rgba(124,58,237,0.4)]'}`}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <span className={avatar === av ? 'animate-selectedBounce' : ''}>{av}</span>
                    {avatar === av && <div className="absolute inset-0 rounded-[50%] bg-[rgba(124,58,237,0.2)] animate-tileRipple pointer-events-none" />}
                  </button>
                ))}
              </div>

              <div className="relative group mb-6">
                <input
                  type="text"
                  maxLength={20}
                  className="w-full h-[52px] bg-surface border border-[rgba(255,255,255,0.08)] rounded-[12px] px-[16px] text-[15px] text-white transition-all duration-200 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter a Username"
                />
                <span className={`absolute right-[16px] top-[16px] text-[12px] text-text-body transition-opacity duration-200 ${username.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                  ({username.length}/20)
                </span>
              </div>

              <button 
                onClick={() => changeStep(1)}
                disabled={!canNext()}
                className={`w-full h-[52px] bg-cta-gradient text-white font-[700] rounded-[12px] transition-all duration-300 absolute bottom-[40px] w-[calc(100%-80px)]
                  ${!canNext() ? 'opacity-40 cursor-not-allowed' : 'opacity-100 hover:opacity-90 hover:-translate-y-px active:scale-[0.97] hover:shadow-[0_12px_32px_rgba(124,58,237,0.4)]'}`}
              >
                Next
              </button>
           </div>
         )}

         {/* -- STEP 2: Language -- */}
         {visibleStep === 1 && (
           <div className={stepContainerClass}>
              <h2 className="text-[28px] font-bold text-white mb-2">What do you want to learn?</h2>
              
              <div className="mb-6 relative">
                 <label className="text-[12px] font-[700] text-text-body tracking-wider uppercase mb-2 block">I Native Speak:</label>
                 <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full h-[52px] bg-surface border border-[rgba(255,255,255,0.08)] rounded-[12px] px-[16px] flex items-center justify-between text-white"
                 >
                    {nativeLang}
                    <svg className={`w-5 h-5 transition-transform duration-250 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                 </button>
                 <div className={`absolute z-20 w-full mt-1 bg-surface border border-[rgba(255,255,255,0.08)] rounded-[12px] overflow-hidden transition-all duration-250 ${isDropdownOpen ? 'max-h-[320px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    {LANGUAGES.map(lang => (
                      <div key={'nat'+lang} 
                        onClick={() => { setNative(lang); setIsDropdownOpen(false); }}
                        className="px-[16px] py-[12px] text-white hover:bg-[rgba(124,58,237,0.1)] cursor-pointer"
                      >
                         {lang}
                      </div>
                    ))}
                 </div>
              </div>

              <label className="text-[12px] font-[700] text-text-body tracking-wider uppercase mb-2 block">I Want to Learn:</label>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {LANGUAGES.map((lang, index) => {
                  const m = LANG_ICONS[lang];
                  const isSelected = learningLang === lang;
                  const isDisabled = lang === nativeLang;
                  return (
                    <button
                      key={'tgt'+lang}
                      disabled={isDisabled}
                      onClick={() => setLearn(lang)}
                      className={`h-[52px] relative flex items-center bg-surface border rounded-[12px] px-[16px] text-[14px] font-[500] animate-tileIn transition-all duration-250 group overflow-hidden
                        ${isDisabled ? 'opacity-30 cursor-not-allowed border-[rgba(255,255,255,0.07)] text-text-body' 
                          : isSelected ? 'border-[#10B981] bg-[rgba(16,185,129,0.1)] text-white'
                          : 'border-[rgba(255,255,255,0.07)] text-text-body hover:border-[rgba(124,58,237,0.4)] hover:-translate-y-px'}`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mr-2 absolute left-[16px]">{m.icon}</span>
                      <span className={`transition-all duration-200 ${isSelected || !isDisabled ? 'group-hover:ml-6' : ''}`}>{lang}</span>
                      
                      {isSelected && (
                         <div className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center transform translate-x-1 -translate-y-1 bg-success rounded-bl-[8px] animate-[pop_200ms_cubic-bezier(0.34,1.56,0.64,1)]">
                           <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                         </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {error && <div className="text-danger text-sm mb-4">{error}</div>}

              <div className="absolute bottom-[40px] w-[calc(100%-80px)] flex gap-3">
                <button 
                  onClick={() => changeStep(0)}
                  className="px-6 h-[52px] border border-[rgba(255,255,255,0.1)] text-white font-[700] rounded-[12px] hover:bg-surface transition-all"
                >Back</button>
                <button 
                  onClick={() => changeStep(2)}
                  disabled={!canNext()}
                  className={`flex-1 h-[52px] bg-cta-gradient text-white font-[700] rounded-[12px] transition-all duration-300
                    ${!canNext() ? 'opacity-40 cursor-not-allowed' : 'opacity-100 hover:opacity-90 hover:-translate-y-px active:scale-[0.97] hover:shadow-[0_12px_32px_rgba(124,58,237,0.4)]'}`}
                >Next</button>
              </div>
           </div>
         )}

         {/* -- STEP 3: Interests -- */}
         {visibleStep === 2 && (
           <div className={stepContainerClass}>
              <h2 className="text-[28px] font-bold text-white mb-2">Select your interests</h2>
              <p className="text-[15px] text-text-body mb-8">Choose topics you like for personalized rewards.</p>

              <div className="flex flex-wrap gap-3 mb-8">
                {ALL_INTERESTS.map((interest, index) => {
                  const isSelected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`h-[40px] px-[16px] rounded-[50px] border text-[14px] transition-all duration-200 animate-[fadeUp_250ms_ease_both] relative group
                        ${isSelected ? 'bg-[rgba(124,58,237,0.15)] border-primary text-white scale-[1.05]' 
                                     : 'bg-surface border-[rgba(255,255,255,0.07)] text-text-body hover:border-[rgba(124,58,237,0.4)] hover:-translate-y-px'}`}
                      style={{ animationDelay: `${index * 25}ms` }}
                    >
                      {interest}
                      {isSelected && <div className="absolute inset-0 rounded-[50px] shadow-[0_0_12px_rgba(124,58,237,0.5)] opacity-0 animate-[fade_300ms_linear_1]" />}
                    </button>
                  )
                })}
              </div>

              {error && <div className="text-danger text-sm mb-4">{error}</div>}

              <div className="absolute bottom-[40px] w-[calc(100%-80px)] flex gap-3">
                <button 
                  onClick={() => !completeAnim && changeStep(1)}
                  className="px-6 h-[52px] border border-[rgba(255,255,255,0.1)] text-white font-[700] rounded-[12px] hover:bg-surface transition-all"
                >Back</button>
                <div className="flex-1 relative overflow-visible flex items-center justify-center">
                  <button 
                    onClick={handleComplete}
                    disabled={!canNext() || loading}
                    className={`h-[52px] absolute text-white font-[700] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center
                      ${!canNext() ? 'opacity-40 cursor-not-allowed bg-cta-gradient w-full rounded-[12px]' : 
                        completeAnim ? 'w-[52px] rounded-[50%] bg-success h-[52px]' : 
                        'opacity-100 hover:opacity-90 hover:-translate-y-px active:scale-[0.97] hover:shadow-[0_12px_32px_rgba(124,58,237,0.4)] bg-cta-gradient w-full rounded-[12px]'}`}
                  >
                    {!completeAnim ? 'Complete Setup' : ''}
                    
                    {completeAnim && (
                      <svg className="w-6 h-6 text-white bg-transparent absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" 
                           className="animate-[strokeDash_300ms_ease_300ms_forwards]" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} />
                      </svg>
                    )}
                  </button>
                  {/* Animating Circle stroke on complete */}
                  {completeAnim && (
                    <svg className="w-[52px] h-[52px] absolute z-20" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="24" fill="none" stroke="#10B981" strokeWidth="2" 
                        className="animate-[strokeDash_400ms_ease_forwards] -rotate-90 origin-center" 
                        style={{ strokeDasharray: 151, strokeDashoffset: 151 }} />
                    </svg>
                  )}
                </div>
              </div>
           </div>
         )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes strokeDash { to { stroke-dashoffset: 0; } }
        @keyframes fade { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.3); } }
      `}} />
    </div>
  );
};

export default Onboarding;