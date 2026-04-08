"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSidebar } from '@/components/ui/sidebar';

const BackButton = ({ target, style = {} }) => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { state, isMobile } = useSidebar();
  const isLight = resolvedTheme === 'light';

  const handleClick = () => {
    if (target === 'back') {
      router.back();
    } else if (target) {
      router.push(target);
    } else {
      router.back();
    }
  };

  const t = {
    primary: isLight ? "#9067C6" : "#934CF0",
    text: isLight ? "#242038" : "#ffffff",
    glass: isLight ? "rgba(144, 103, 198, 0.1)" : "rgba(255, 255, 255, 0.05)",
    border: isLight ? "rgba(144, 103, 198, 0.2)" : "rgba(255, 255, 255, 0.1)",
  };

  // Calculate left position based on sidebar state
  // Expanded: 16rem = 256px. Icon: 3.6rem = 57.6px.
  // We add 20px margin.
  const leftOffset = isMobile 
    ? '20px' 
    : (state === 'expanded' ? 'calc(16rem + 20px)' : 'calc(3.6rem + 20px)');

  return (
    <button
      onClick={handleClick}
      className="back-button-glass"
      style={{
        position: 'fixed',
        top: '80px', // Below the global header
        left: leftOffset,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: t.glass,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${t.border}`,
        color: t.text,
        cursor: 'pointer',
        zIndex: 1000, // Higher z-index to stay above everything
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style
      }}
    >
      <ArrowLeft size={20} />
      <style jsx>{`
        .back-button-glass:hover {
          transform: translateX(-4px) scale(1.05);
          background: ${isLight ? 'rgba(144, 103, 198, 0.2)' : 'rgba(255, 255, 255, 0.1)'} !important;
          border-color: ${t.primary} !important;
          box-shadow: 0 0 20px ${t.primary}4D;
        }
        .back-button-glass:active {
          transform: scale(0.95);
        }
      `}</style>
    </button>
  );
};

export default BackButton;
