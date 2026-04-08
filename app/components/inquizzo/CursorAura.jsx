'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

export default function CursorAura() {
    const [hoverType, setHoverType] = useState('default');
    const [visible, setVisible] = useState(false);
    const mx = useMotionValue(-200);
    const my = useMotionValue(-200);
    const x = useSpring(mx, { stiffness: 500, damping: 40 });
    const y = useSpring(my, { stiffness: 500, damping: 40 });
    const ax = useSpring(mx, { stiffness: 120, damping: 25 });
    const ay = useSpring(my, { stiffness: 120, damping: 25 });

    const lastTouchTime = useRef(0);

    useEffect(() => {
        if (visible) {
            document.body.classList.add("custom-cursor-active");
        } else {
            document.body.classList.remove("custom-cursor-active");
        }
        return () => {
            document.body.classList.remove("custom-cursor-active");
        };
    }, [visible]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const move = (e) => {
            if (Date.now() - lastTouchTime.current < 2000) return;
            mx.set(e.clientX);
            my.set(e.clientY);
            if (!visible) setVisible(true);
        };

        const hide = () => {
            lastTouchTime.current = Date.now();
            setVisible(false);
        };

        const checkHover = (e) => {
            if (Date.now() - lastTouchTime.current < 2000) return;
            const el = e.target;
            if (el.closest('[data-cursor="card"]')) setHoverType('card');
            else if (el.closest('[data-cursor="button"]')) setHoverType('button');
            else if (el.closest('[data-cursor="text"]')) setHoverType('text');
            else setHoverType('default');
        };

        window.addEventListener('mousemove', move, { passive: true });
        window.addEventListener('mouseover', checkHover, { passive: true });
        window.addEventListener('touchstart', hide, { passive: true });
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseover', checkHover);
            window.removeEventListener('touchstart', hide);
        };
    }, [mx, my]); // removed visible dependency here to avoid listener thrashing

    if (!visible) return null;

    const auraSize = hoverType === 'card' ? 64 : hoverType === 'button' ? 40 : hoverType === 'text' ? 48 : 32;
    const dotSize = hoverType === 'button' ? 10 : 5;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            {/* Outer aura */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    x: ax,
                    y: ay,
                    width: auraSize,
                    height: auraSize,
                    marginLeft: -auraSize / 2,
                    marginTop: -auraSize / 2,
                    border: hoverType === 'card'
                        ? '2px solid hsl(var(--iq-pink) / 0.4)'
                        : '1px solid hsl(var(--iq-purple) / 0.3)',
                    background: hoverType === 'card'
                        ? 'radial-gradient(circle, hsl(var(--iq-pink) / 0.1), transparent 70%)'
                        : 'radial-gradient(circle, hsl(var(--iq-purple) / 0.08), transparent 70%)',
                    transition: 'width 0.3s, height 0.3s, border 0.3s',
                }}
            />
            {/* Inner dot */}
            <motion.div
                className="absolute rounded-full iq-grad-brand"
                style={{
                    x,
                    y,
                    width: dotSize,
                    height: dotSize,
                    marginLeft: -dotSize / 2,
                    marginTop: -dotSize / 2,
                    boxShadow: '0 0 12px hsl(var(--iq-pink) / 0.6)',
                    transition: 'width 0.2s, height 0.2s',
                }}
            />
        </div>
    );
}
