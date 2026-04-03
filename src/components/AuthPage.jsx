import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShake(false);
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      setShake(true);
      setTimeout(() => setShake(false), 600); // Clear shake state after animation
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      setShake(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center bg-base-bg overflow-hidden animate-pageFadeIn">
      {/* 3 Static Radial Gradient Blobs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute top-0 right-[-10%] w-[600px] h-[600px] rounded-full animate-blobFadeIn animate-blobDrift"
          style={{ 
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
            animationDelay: '0s, 0s' 
          }}
        />
        <div 
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full animate-blobFadeIn animate-blobDrift"
          style={{ 
            background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
            animationDelay: '0.2s, 0.2s' 
          }}
        />
        <div 
          className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full animate-blobFadeIn animate-blobDrift"
          style={{ 
            background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
            animationDelay: '0.4s, 0.4s' 
          }}
        />
      </div>

      {/* Auth Card */}
      <div className="w-[420px] max-w-full p-[40px] relative z-10 
        bg-[rgba(19,19,42,0.9)] backdrop-blur-[30px] rounded-[24px] 
        border border-[rgba(124,58,237,0.3)] 
        shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(124,58,237,0.15)]
        animate-cardDrop transition-all duration-300
        hover:-translate-y-[2px] hover:shadow-[0_40px_100px_rgba(0,0,0,0.7),0_0_0_1px_rgba(124,58,237,0.25)]">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8 relative">
          <svg className="w-10 h-10 mb-4 animate-logoPop" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="url(#globe-gradient)" />
            <path d="M2.5 12H21.5M12 2V22M6.5 4.5C8.5 7.5 8.5 16.5 6.5 19.5M17.5 4.5C15.5 7.5 15.5 16.5 17.5 19.5" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="globe-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C3AED" />
                <stop offset="1" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
          <h1 className="text-[24px] font-[800] text-white tracking-[-0.03em] animate-fadeUp">Welcome to langTutor</h1>
          <p className="text-[14px] text-text-body mt-1 font-medium animate-fadeUp" style={{ animationDelay: '350ms' }}>Master Indian Languages Contextually</p>
        </div>

        {/* Mode Toggle */}
        <div className="w-full bg-surface p-1 rounded-[50px] mb-8 relative flex items-center shadow-inner">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-cta-gradient rounded-[50px] transition-transform duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${isLogin ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'}`}
            style={{ willChange: 'transform' }}
          />
          <button 
            type="button"
            onClick={() => !isLogin && toggleMode()}
            className={`w-1/2 py-2 text-sm z-10 transition-colors duration-200 ${isLogin ? 'text-white font-[600]' : 'text-text-body font-medium'}`}
          >
            Login
          </button>
          <button 
            type="button"
            onClick={() => isLogin && toggleMode()}
            className={`w-1/2 py-2 text-sm z-10 transition-colors duration-200 ${!isLogin ? 'text-white font-[600]' : 'text-text-body font-medium'}`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative group">
            <svg className={`absolute left-[16px] top-[16px] w-5 h-5 transition-colors duration-200 ${email ? 'text-primary' : 'text-[#6B6B85] group-focus-within:text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              type="email"
              required
              className={`w-full h-[52px] bg-surface border rounded-[12px] pl-[44px] pr-[16px] text-[15px] text-white transition-all duration-200 outline-none
                ${error ? 'border-danger' : 'border-[rgba(255,255,255,0.08)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)]'}
                ${shake && error ? 'animate-inputShake' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
            />
          </div>

          <div className="relative group">
            <svg className={`absolute left-[16px] top-[16px] w-5 h-5 transition-colors duration-200 ${password ? 'text-primary' : 'text-[#6B6B85] group-focus-within:text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type="password"
              required
              className={`w-full h-[52px] bg-surface border rounded-[12px] pl-[44px] pr-[16px] text-[15px] text-white transition-all duration-200 outline-none
                ${error ? 'border-danger' : 'border-[rgba(255,255,255,0.08)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)]'}
                ${shake && error ? 'animate-inputShake' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>

          {error && (
            <div className="mt-1 flex items-center text-[12px] text-danger font-medium animate-fadeUp">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error.replace('Firebase: ', '')}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className={`w-full h-[52px] mt-2 rounded-[12px] text-white text-[16px] font-[700] transition-all duration-200 active:scale-[0.97]
              ${error && shake ? 'bg-danger-fill' : ''}
              ${success ? 'bg-success-fill shadow-none' : 'bg-cta-gradient'}
              ${!loading && !success && !error ? 'hover:-translate-y-px hover:shadow-[0_12px_32px_rgba(124,58,237,0.4)] hover:opacity-90' : ''}
              relative overflow-hidden group flex items-center justify-center`}
          >
            {!loading && !success && (
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)] -translate-x-full group-hover:animate-shimmer" />
            )}
            
            <div className="relative flex items-center justify-center w-full h-full">
               <span className={`transition-opacity duration-150 ${loading || success ? 'opacity-0 absolute' : 'opacity-100'}`}>
                 {isLogin ? 'Login' : 'Sign Up'}
               </span>
               <span className={`transition-opacity duration-150 absolute flex items-center justify-center ${loading && !success ? 'opacity-100' : 'opacity-0'}`}>
                 <div className="w-[20px] h-[20px] border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spinCustom" />
               </span>
               <span className={`transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] absolute flex items-center justify-center ${success ? 'scale-100' : 'scale-0'}`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
               </span>
            </div>
          </button>
        </form>

        <div className="my-[28px] flex items-center justify-center gap-4">
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
          <span className="text-[11px] font-[700] text-text-body uppercase tracking-[0.06em]">Or log in with</span>
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading || success}
          className="w-full h-[52px] bg-surface border border-[rgba(255,255,255,0.08)] hover:bg-[#222240] hover:border-[rgba(124,58,237,0.3)] 
            rounded-[12px] flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.97]
            text-white text-[15px] font-[500]"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
          Google
        </button>

      </div>
    </div>
  );
};

export default AuthPage;