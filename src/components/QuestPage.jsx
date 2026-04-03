import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import LoadingSpinner from './LoadingSpinner';

const DUMMY_REWARDS = {
  Gaming: [
    { title: "20% Off Steam Gift Card", code: "STEAM20X", icon: "🎮" },
    { title: "Xbox Game Pass 1-Month", code: "XBXGPU", icon: "🕹️" }
  ],
  Fashion: [
    { title: "Myntra Flat ₹500 Off", code: "MYNTRA500", icon: "👗" },
    { title: "Zara 30% Off Code", code: "ZARA30", icon: "🧥" }
  ],
  Learning: [
    { title: "Coursera Free Course", code: "LEARNFREE", icon: "📚" },
    { title: "Udemy Bootcamp 100% Off", code: "UDEMYMAX", icon: "🎓" }
  ],
  Foods: [
    { title: "Zomato ₹150 Off Order", code: "ZOM150", icon: "🍔" },
    { title: "Swiggy Free Delivery", code: "SWIGDEL", icon: "🍕" }
  ],
  Travel: [
    { title: "MakeMyTrip 10% Off Flights", code: "MMTFLIGHT", icon: "✈️" },
    { title: "Oyo ₹300 Off Room", code: "OYO300", icon: "🏨" }
  ],
  Music: [
    { title: "Spotify Premium 1-Month", code: "SPOTFREE", icon: "🎵" },
    { title: "Apple Music 3-Months", code: "APPLMUS", icon: "🎧" }
  ]
};

const DEFAULT_REWARD = { title: "Amazon ₹100 Gift Card", code: "AMZ100WIN", icon: "🎁" };

const QuestPage = () => {
  const { questId } = useParams();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [reward, setReward] = useState(null);
  
  // Slider states
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) { navigate('/'); return; }
        
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (!userSnap.exists()) { navigate('/'); return; }
        
        const udata = userSnap.data();
        setUserData(udata);

        // Has this quest been completed already? 
        const completed = udata.completed_quests || [];
        if (completed.includes(parseInt(questId))) {
          // If already completed, auto unlock
          setUnlocked(true);
          setProgress(1);
        }

        // Generate reward
        let available = [];
        if (udata.interests && udata.interests.length > 0) {
          udata.interests.forEach(i => {
             if (DUMMY_REWARDS[i]) available.push(...DUMMY_REWARDS[i]);
          });
        }
        if (available.length === 0) available = [DEFAULT_REWARD];
        
        // Use questId to seed the pseudo-random choice so it's consistent for this quest
        const seed = parseInt(questId) || 1;
        const picked = available[seed % available.length];
        setReward(picked);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [questId, navigate]);

  // Handle Dragging
  const handlePointerMove = (e) => {
    if (!isDragging || unlocked || !trackRef.current) return;
    
    // Prevent default touch movement to avoid scrolling
    if (e.type === 'touchmove') e.preventDefault();

    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    
    let newProgress = offsetX / rect.width;
    newProgress = Math.max(0, Math.min(1, newProgress));
    setProgress(newProgress);

    if (newProgress > 0.95) {
      handleUnlock();
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || unlocked) return;
    setIsDragging(false);
    // Snap back if not completed
    if (progress <= 0.95) {
      setProgress(0);
    }
  };

  const handlePointerDown = (e) => {
    if (unlocked) return;
    setIsDragging(true);
  };

  const handleUnlock = async () => {
    setIsDragging(false);
    setProgress(1);
    setUnlocked(true);
    
    // Save to Firebase
    try {
      const uid = auth.currentUser.uid;
      const completed = userData.completed_quests || [];
      const qId = parseInt(questId);
      
      if (!completed.includes(qId)) {
         await updateDoc(doc(db, 'users', uid), {
           completed_quests: [...completed, qId]
         });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Quest..." />;

  // Slider visual padding
  const paddingX = 8;
  const thumbWidth = 56;

  return (
    <div className="min-h-screen w-full bg-[#080b12] flex items-center justify-center p-4 overflow-hidden relative selection:bg-amber-500/30" style={{ fontFamily: "'Outfit', 'Sora', sans-serif" }}>
      
      {unlocked && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} gravity={0.15} />}

      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Card */}
      <div className="relative z-10 max-w-md w-full bg-[#111322]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl shadow-amber-500/5">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-3xl shadow-lg shadow-amber-500/20 mb-4 animate-bounce-soft">
            🏆
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Reward Quest</h1>
          <p className="text-gray-400 font-medium text-sm">
            {unlocked ? "You successfully unlocked this chest!" : "Slide to pick the lock and reveal your prize."}
          </p>
        </div>

        {/* Envelope / Prize Container */}
        <div className="relative w-full aspect-[4/3] mb-10 perspective-1000">
          <div className={`w-full h-full rounded-2xl border transition-all duration-700 transform-style-3d ${unlocked ? 'border-amber-500/30 bg-gradient-to-br from-amber-900/40 to-amber-900/10 scale-105' : 'border-white/5 bg-white/4'}`}>
            
            {/* The Hidden Prize */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-all duration-700 ${unlocked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              <div className="text-5xl mb-3 drop-shadow-xl">{reward?.icon}</div>
              <h2 className="text-xl font-black text-amber-300 mb-3 drop-shadow-md">{reward?.title}</h2>
              <div className="px-4 py-2 bg-black/50 border border-amber-500/30 rounded-xl">
                <span className="font-mono text-white tracking-widest font-bold">{reward?.code}</span>
              </div>
            </div>

            {/* The Locked Front */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${unlocked ? 'opacity-0 pointer-events-none scale-110 blur-sm' : 'opacity-100 scale-100'}`}>
              <span className="text-6xl mb-2 opacity-50 block">🔒</span>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sealed</p>
            </div>
            
          </div>
        </div>

        {/* The Slider UI */}
        <div className="w-full relative mt-auto">
          {unlocked ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-px rounded-2xl shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
            >
              Collect & Return to Roadmap →
            </button>
          ) : (
            <div 
              ref={trackRef}
              className="relative w-full h-16 bg-black/60 border border-white/10 rounded-full overflow-hidden flex items-center group cursor-pointer touch-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              // Double click to instantly unlock
              onDoubleClick={handleUnlock}
            >
              {/* background fill */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-600/20 to-amber-500/40 opacity-50"
                style={{ width: `${progress * 100}%` }}
              />
              
              {/* helper text */}
              <p className="absolute w-full text-center text-sm font-bold text-gray-500 pointer-events-none transition-opacity duration-300 select-none"
                 style={{ opacity: isDragging ? 0 : 1 }}>
                Slide to Unlock ➔
              </p>

              {/* The Draggable Thumb */}
              <div 
                className="absolute flex items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 shadow-lg cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                style={{
                  width: thumbWidth,
                  height: thumbWidth,
                  left: `calc(${progress * 100}% - ${progress * thumbWidth}px)`,
                  marginLeft: progress === 0 ? paddingX : (progress === 1 ? -paddingX : 0),
                  transition: isDragging ? 'none' : 'left 0.3s ease-out, margin 0.3s ease-out'
                }}
                onPointerDown={handlePointerDown}
              >
                <svg className="w-6 h-6 text-amber-950 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default QuestPage;
