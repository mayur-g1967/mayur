import React from 'react';

const ConfidenceCoachModule = ({ className, style }) => {
  return (
    <div 
      className={`relative flex items-center bg-[#1e2336]/80 px-6 py-3 rounded-[60px] border-2 border-[#9d7cff] shadow-[0_0_20px_rgba(157,124,255,0.3)] backdrop-blur-sm group transition-all duration-300 ${className}`}
      style={style}
    >
      {/* Icon with Glassmorphism */}
      <div className="relative w-12 h-12 mr-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[#b8a0ff] to-[#7a5cf5] shadow-[inset_0_0_10px_rgba(255,255,255,0.4)]">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>

      {/* Text Container */}
      <div className="flex flex-col">
        <h2 className="text-[#b8a0ff] text-xl font-medium m-0 leading-tight whitespace-nowrap">
          Confidence Coach
        </h2>
        <span className="text-[#8c8fb5] text-xs font-normal m-0">
          Module
        </span>
      </div>

      {/* Decorative Blob */}
      <div 
        className="absolute -right-2 -bottom-2 w-5 h-5 bg-[#7a5cf5] opacity-80 rotate-12" 
        style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', borderRadius: '4px' }}
      ></div>
    </div>
  );
};

export default ConfidenceCoachModule;