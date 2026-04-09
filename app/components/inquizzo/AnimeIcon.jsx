'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { animate } from 'animejs';

/**
 * AnimeIcon — Lucide React icon wrapper with anime.js hover animations.
 *
 * MODES:
 *   hoverParent={true}  → Animates when nearest [data-cursor="card"] parent is hovered.
 *   selfHover={true}    → Animates when the icon itself is hovered.
 *   Both false          → Static icon (no animation).
 *
 * ANIMATIONS:
 *   'bounce'  → Scale up/down bounce
 *   'pulse'   → Rhythmic scale pulse
 *   'spin'    → 360° rotation
 *   'wiggle'  → Rotational wiggle
 *   'slide'   → Horizontal slide right & back
 *   'jump'    → Vertical hop
 *   'shake'   → Quick horizontal shake
 *   'flip'    → Y-axis 3D flip
 */

const ANIMATIONS = {
    bounce: (el) =>
        animate(el, {
            scale: [1, 1.35, 0.9, 1.1, 1],
            duration: 600,
            easing: 'easeOutElastic(1, .5)',
        }),
    pulse: (el) =>
        animate(el, {
            scale: [1, 1.25, 1],
            opacity: [1, 0.8, 1],
            duration: 500,
            easing: 'easeInOutSine',
        }),
    spin: (el) =>
        animate(el, {
            rotate: '1turn',
            duration: 600,
            easing: 'easeInOutCubic',
        }),
    wiggle: (el) =>
        animate(el, {
            rotate: [0, -15, 15, -10, 10, -5, 0],
            duration: 500,
            easing: 'easeInOutSine',
        }),
    slide: (el) =>
        animate(el, {
            translateX: [0, 6, 0],
            duration: 400,
            easing: 'easeInOutQuad',
        }),
    jump: (el) =>
        animate(el, {
            translateY: [0, -8, 0],
            duration: 450,
            easing: 'easeOutBounce',
        }),
    shake: (el) =>
        animate(el, {
            translateX: [0, -4, 4, -3, 3, 0],
            duration: 400,
            easing: 'easeInOutSine',
        }),
    flip: (el) =>
        animate(el, {
            rotateY: [0, 180, 360],
            duration: 600,
            easing: 'easeInOutQuad',
        }),
};

export default function AnimeIcon({
    Icon,
    className = '',
    animation = 'bounce',
    hoverParent = false,
    selfHover = false,
    color,
    strokeWidth,
    ...props
}) {
    const ref = useRef(null);
    const isAnimating = useRef(false);

    const runAnimation = useCallback(() => {
        if (!ref.current || isAnimating.current) return;
        const animFn = ANIMATIONS[animation] || ANIMATIONS.bounce;
        isAnimating.current = true;
        const anim = animFn(ref.current);
        if (anim && anim.finished) {
            anim.finished.then(() => {
                isAnimating.current = false;
            });
        } else {
            setTimeout(() => { isAnimating.current = false; }, 700);
        }
    }, [animation]);

    // DOM-based parent hover detection (same pattern as AnimatedIcon)
    useEffect(() => {
        if (!hoverParent || !ref.current) return;
        const card = ref.current.closest('[data-cursor="card"]');
        if (!card) return;

        const onEnter = () => runAnimation();
        card.addEventListener('mouseenter', onEnter);
        return () => card.removeEventListener('mouseenter', onEnter);
    }, [hoverParent, runAnimation]);

    const hoverHandlers = selfHover
        ? { onMouseEnter: runAnimation }
        : {};

    if (!Icon) return null;

    return (
        <div
            ref={ref}
            className={`inline-flex items-center justify-center ${className}`}
            style={{ willChange: 'transform' }}
            {...hoverHandlers}
            {...props}
        >
            <Icon
                className="w-full h-full"
                color={color}
                strokeWidth={strokeWidth}
            />
        </div>
    );
}
