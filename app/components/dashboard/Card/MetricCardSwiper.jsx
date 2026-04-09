'use client';

import { useRef, useState, useEffect } from 'react';

/**
 * MetricCardSwiper
 *
 * Mobile  (<md): horizontal snap-scroll carousel — shows one card at a time,
 *               swipe left/right to navigate. Dot indicators below.
 * Desktop (>=md): pass-through — renders children as a regular flex row.
 *
 * Usage:
 *   <MetricCardSwiper count={4}>
 *     <MetricCard … />
 *     <MetricCard … />
 *     …
 *   </MetricCardSwiper>
 */
export default function MetricCardSwiper({ children, count = 4 }) {
    const trackRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Update dot indicator as user scrolls
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const handleScroll = () => {
            const cardWidth = track.scrollWidth / count;
            const index = Math.round(track.scrollLeft / cardWidth);
            setActiveIndex(index);
        };

        track.addEventListener('scroll', handleScroll, { passive: true });
        return () => track.removeEventListener('scroll', handleScroll);
    }, [count]);

    // Snap to card when dot is tapped
    const scrollTo = (index) => {
        const track = trackRef.current;
        if (!track) return;
        const cardWidth = track.scrollWidth / count;
        track.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
    };

    return (
        <>
            {/* ── MOBILE: snap-scroll carousel ─────────────────────────── */}
            <div className="block md:hidden w-full">
                <div
                    ref={trackRef}
                    className="flex overflow-x-auto gap-3 px-3 snap-x snap-mandatory scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {/* Hide native scrollbar on webkit */}
                    <style>{`.metric-track::-webkit-scrollbar { display: none; }`}</style>

                    {/* Each child gets a full-viewport-width snap slot */}
                    {Array.isArray(children)
                        ? children.map((child, i) => (
                            <div
                                key={i}
                                className="snap-center flex-none w-[calc(100vw-1.5rem)]"
                            >
                                {child}
                            </div>
                        ))
                        : <div className="snap-center flex-none w-[calc(100vw-1.5rem)]">{children}</div>}
                </div>

                {/* Dot indicators */}
                <div className="flex justify-center gap-2 mt-3">
                    {Array.from({ length: count }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollTo(i)}
                            aria-label={`Go to card ${i + 1}`}
                            className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex
                                    ? 'w-5 bg-primary'
                                    : 'w-2 bg-muted-foreground/30'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* ── DESKTOP: unchanged grid row ──────────────────────────── */}
            <div className="hidden md:contents">
                {children}
            </div>
        </>
    );
}
