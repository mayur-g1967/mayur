'use client';

import { cn } from '@/lib/utils';

export function GlassPanel({ children, className, glow = false, dataCursor = 'card' }) {
    return (
        <div
            data-cursor={dataCursor}
            className={cn(
                'relative rounded-2xl border border-[hsl(var(--iq-border)/0.2)] overflow-hidden',
                'backdrop-blur-xl',
                className
            )}
            style={{
                background: 'linear-gradient(135deg, hsl(var(--iq-deep) / 0.9), hsl(var(--iq-surface) / 0.6))',
                boxShadow: glow
                    ? '0 0 40px hsl(var(--iq-purple) / 0.15), 0 0 80px hsl(var(--iq-pink) / 0.08)'
                    : '0 4px 30px hsl(var(--iq-void) / 0.5)',
            }}
        >
            {/* Top edge shimmer */}
            <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                    background: 'linear-gradient(90deg, transparent, hsl(var(--iq-purple) / 0.3), hsl(var(--iq-pink) / 0.2), transparent)',
                }}
            />
            {children}
        </div>
    );
}
