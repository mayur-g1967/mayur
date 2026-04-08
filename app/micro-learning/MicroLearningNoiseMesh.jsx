'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * MicroLearningNoiseMesh
 * Self-contained background overlay replicating InQuizzo's NoiseMesh.
 * Now theme-aware: adjusts colors and opacities for light/dark modes.
 */
export default function MicroLearningNoiseMesh() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLight = resolvedTheme === 'light';

  // Light mode colors (softer, more pastel)
  // Dark mode colors (original InQuizzo vibrancy)
  const colors = isLight ? {
    orb1: 'rgba(144, 103, 198, 0.4)',
    orb2: 'rgba(141, 134, 201, 0.3)',
    orb3: 'rgba(144, 103, 198, 0.2)',
    noiseOpacity: 0.015,
    gridColor: 'rgba(144, 103, 198, 0.03)',
  } : {
    orb1: 'rgba(106, 74, 155, 0.6)',
    orb2: 'rgba(200, 78, 138, 0.5)',
    orb3: 'rgba(106, 74, 155, 0.4)',
    noiseOpacity: 0.03,
    gridColor: 'rgba(106, 74, 155, 0.04)',
  };

  return (
    <div className="ml-noise-mesh">
      {/* Animated gradient orbs */}
      <div
        className="ml-orbit-1"
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          filter: 'blur(120px)',
          top: '10%',
          left: '20%',
          background: `radial-gradient(circle, ${colors.orb1}, transparent 70%)`,
        }}
      />
      <div
        className="ml-orbit-2"
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          filter: 'blur(100px)',
          top: '50%',
          right: '10%',
          background: `radial-gradient(circle, ${colors.orb2}, transparent 70%)`,
        }}
      />
      <div
        className="ml-orbit-3"
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          filter: 'blur(80px)',
          bottom: '10%',
          left: '40%',
          background: `radial-gradient(circle, ${colors.orb3}, transparent 70%)`,
        }}
      />

      {/* Grain noise overlay */}
      <svg
        className="ml-noise-svg"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: colors.noiseOpacity }}
      >
        <filter id="mlNoiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#mlNoiseFilter)" />
      </svg>

      {/* Subtle grid */}
      <div
        className="ml-grid-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            `linear-gradient(${colors.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${colors.gridColor} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
