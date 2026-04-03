import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0f1a] text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="w-full max-w-md p-8 relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-3xl shadow-[0_0_80px_rgba(139,92,246,0.15)]">
        {/* Decorative background shape */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-violet-600 rounded-full opacity-20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-fuchsia-600 rounded-full opacity-20 blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 mx-auto flex items-center justify-center text-3xl mb-4 shadow-[0_0_30px_rgba(139,92,246,0.4)]">🌐</div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">Language Learning</h1>
          <p className="text-gray-400 font-semibold text-sm">Master Indian Languages Contextually</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-6 text-sm font-bold text-center">
            {error.replace('Firebase: ', '')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1 shrink-0">Email address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:bg-white/10 focus:ring-4 focus:ring-violet-500/20 outline-none transition-all font-semibold text-white placeholder-gray-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1 shrink-0">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:bg-white/10 focus:ring-4 focus:ring-violet-500/20 outline-none transition-all font-semibold text-white placeholder-gray-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-black shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] mt-4 disabled:opacity-50 transition-all hover:scale-[1.02] cursor-pointer"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="my-7 flex items-center justify-center gap-4 relative z-10">
          <div className="flex-1 h-px bg-white/10 text-transparent">.</div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Or access with</span>
          <div className="flex-1 h-px bg-white/10 text-transparent">.</div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 bg-white text-black hover:bg-gray-100 rounded-xl font-black shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] relative z-10 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
          Google
        </button>

        <p className="text-center mt-6 text-sm text-gray-400 font-semibold relative z-10">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-violet-400 font-black hover:text-violet-300 ml-1 transition-colors cursor-pointer"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>

        <p className="text-center mt-6 text-[10px] uppercase tracking-widest text-gray-600 font-black relative z-10">
          Telugu · Hindi · Tamil · Kannada · English
        </p>
      </div>
    </div>
  );
};

export default AuthPage;