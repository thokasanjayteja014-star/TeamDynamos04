import React from 'react';

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="min-h-screen w-full bg-[#0d0f1a] flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-violet-300 font-bold text-sm tracking-widest uppercase animate-pulse">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
