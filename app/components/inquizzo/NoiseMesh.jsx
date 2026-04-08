'use client';

export default function NoiseMesh() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 animate-orbit-1"
        style={{
          top: '10%',
          left: '20%',
          background: 'radial-gradient(circle, hsl(var(--iq-purple) / 0.6), transparent 70%)',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 animate-orbit-2"
        style={{
          top: '50%',
          right: '10%',
          background: 'radial-gradient(circle, hsl(var(--iq-pink) / 0.5), transparent 70%)',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-25 animate-orbit-3"
        style={{
          bottom: '10%',
          left: '40%',
          background: 'radial-gradient(circle, hsl(var(--iq-purple) / 0.4), hsl(var(--iq-pink) / 0.2), transparent 70%)',
        }}
      />

      {/* Grain noise overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--iq-purple) / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--iq-purple) / 0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
