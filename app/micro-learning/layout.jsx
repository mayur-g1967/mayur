'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import './micro-learning.css';
import CustomCursor from './CustomCursor';
import MicroLearningNoiseMesh from './MicroLearningNoiseMesh';
import Header from '@/app/components/shared/header/Header';

export default function MicroLearningLayout({ children }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isLight = resolvedTheme === 'light';

    // Ambient orb colors
    const orbColors = isLight ? {
        orb1: 'rgba(144, 103, 198, 0.2)',
        orb2: 'rgba(141, 134, 201, 0.2)',
        orb3: 'rgba(144, 103, 198, 0.1)',
        opacity1: 0.2,
        opacity2: 0.2,
        opacity3: 0.1,
    } : {
        orb1: 'rgba(147, 76, 240, 0.4)',
        orb2: 'rgba(79, 70, 229, 0.4)',
        orb3: 'rgba(88, 28, 135, 0.2)',
        opacity1: 0.4,
        opacity2: 0.4,
        opacity3: 0.2,
    };

    return (
        <div className="ml-mesh-bg" style={{ position: 'relative', minHeight: '100vh' }}>
            {/* Inquizzo-style NoiseMesh (animated orbs + grain + grid) */}
            <MicroLearningNoiseMesh />

            {/* Ambient blur orbs */}
            {mounted && (
                <>
                    <div className="ml-ambient-orb ml-ambient-orb-pulse" style={{ top: '-80px', left: '-80px', width: '400px', height: '400px', filter: 'blur(80px)', background: orbColors.orb1, '--base-opacity': orbColors.opacity1 }} />
                    <div className="ml-ambient-orb ml-ambient-orb-pulse" style={{ bottom: '40px', right: '40px', width: '300px', height: '300px', filter: 'blur(80px)', background: orbColors.orb2, '--base-opacity': orbColors.opacity2 }} />
                    <div className="ml-ambient-orb ml-ambient-orb-pulse" style={{ top: '50%', left: '33%', width: '250px', height: '250px', filter: 'blur(80px)', background: orbColors.orb3, '--base-opacity': orbColors.opacity3 }} />
                </>
            )}

            {/* Shared Header — appears on every micro-learning page */}
            <Header showDateFilter={false} />

            <CustomCursor />
            {children}
        </div>
    );
}
