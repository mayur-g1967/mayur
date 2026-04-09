// components/dashboard/Card/InsightsCard.jsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const lightTokens = {
    cardBg: 'var(--card)',
    cardBorder: 'var(--border)',
    sectionBg: 'color-mix(in srgb, var(--primary) 10%, transparent)',
    sectionBorder: 'var(--border)',
    chipBg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
    chipBorder: 'color-mix(in srgb, var(--primary) 25%, transparent)',
    primary: '#9067C6',
    textPrimary: '#242038',
    textMuted: '#655A7C',
    separator: 'var(--border)',
};

const darkTokens = {
    cardBg: 'var(--card)',
    cardBorder: 'var(--border)',
    sectionBg: 'color-mix(in srgb, var(--primary) 10%, transparent)',
    sectionBorder: 'var(--border)',
    chipBg: 'color-mix(in srgb, var(--primary) 15%, transparent)',
    chipBorder: 'color-mix(in srgb, var(--primary) 30%, transparent)',
    primary: '#934cf0',
    textPrimary: '#ffffff',
    textMuted: '#94A3B8',
    separator: 'var(--border)',
};

function Chip({ text, t }) {
    return (
        <span
            className="w-fit rounded-full text-[11px] font-semibold px-3 py-1 border"
            style={{ backgroundColor: t.chipBg, borderColor: t.chipBorder, color: t.textMuted }}
        >
            {text}
        </span>
    );
}

export default function InsightsCard({ insights, streak, isLoading }) {
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === 'light';
    const t = isLight ? lightTokens : darkTokens;

    if (isLoading) {
        return (
            <div
                className="backdrop-blur-[12px] border rounded-2xl p-5 flex flex-col gap-4 h-full shadow-xl"
                style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
            >
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-8 w-3/4 rounded-full" />
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        );
    }

    const pattern = insights?.pattern ?? 'Start your first session to see your activity pattern!';
    const snapshot = insights?.snapshot ?? [];
    const suggestion = insights?.suggestion ?? 'Keep up the great work! Try a new module today.';
    const suggestionModule = insights?.suggestionModule ?? null;
    const currentStreak = streak?.current ?? 0;

    return (
        <motion.div
            whileHover={{ y: -3, borderColor: t.primary }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="backdrop-blur-[12px] border rounded-2xl p-5 flex flex-col gap-4 h-full shadow-xl cursor-default"
            style={{
                backgroundColor: t.cardBg,
                borderColor: t.cardBorder,
                boxShadow: `0 10px 30px -15px ${isLight ? 'rgba(0,0,0,0.1)' : t.primary + '22'}`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: t.textMuted }}>
                        PersonaAI Insights
                    </span>
                    <p className="text-[11px] mt-0.5" style={{ color: t.textMuted + 'aa' }}>
                        Based on your recent sessions
                    </p>
                </div>
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: t.primary + '1A', border: `1px solid ${t.primary}33` }}
                >
                    <Sparkles className="size-4" style={{ color: t.primary }} />
                </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full" style={{ backgroundColor: t.separator }} />

            {/* Pattern */}
            <div
                className="rounded-xl p-3 flex flex-col gap-1.5 border"
                style={{ backgroundColor: t.sectionBg, borderColor: t.sectionBorder }}
            >
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: t.primary }}>
                    <TrendingUp className="size-3" /> This week&apos;s pattern
                </span>
                <p className="text-sm leading-relaxed" style={{ color: t.textPrimary }}>
                    {pattern}
                </p>
            </div>

            {/* Snapshot chips */}
            {snapshot.length > 0 && (
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                        Snapshot
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {snapshot.map((chip, i) => <Chip key={i} text={chip} t={t} />)}
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="h-px w-full" style={{ backgroundColor: t.separator }} />

            {/* AI Suggests */}
            <div
                className="rounded-xl p-3 flex flex-col gap-2 border"
                style={{ backgroundColor: t.sectionBg, borderColor: t.sectionBorder }}
            >
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: t.primary }}>
                    <Zap className="size-3" /> AI Suggests
                </span>
                <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-relaxed flex-1" style={{ color: t.textPrimary }}>
                        {suggestionModule ? (
                            <>
                                {suggestion.split(suggestionModule)[0]}
                                <span className="font-semibold" style={{ color: t.primary }}>{suggestionModule}</span>
                                {suggestion.split(suggestionModule)[1]}
                            </>
                        ) : suggestion}
                    </p>
                    {suggestionModule && (
                        <button
                            onClick={() => {
                                if (insights?.suggestionRoute) window.location.href = insights.suggestionRoute;
                            }}
                            className="shrink-0 px-4 py-1.5 text-xs font-bold rounded-full text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: t.primary }}
                        >
                            Start →
                        </button>
                    )}
                </div>
            </div>

            {/* Footer streak */}
            <p className="text-[11px] mt-auto" style={{ color: t.textMuted }}>
                {currentStreak > 0
                    ? `🔥 ${currentStreak}-day streak • Updated from your last 7 days`
                    : 'Updated from your last 7 days of activity'}
            </p>
        </motion.div>
    );
}
