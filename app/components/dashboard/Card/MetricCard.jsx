// components/dashboard/Card/MetricCard.jsx
'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import AnimeIcon from '@/app/components/inquizzo/AnimeIcon';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Inquizzo-synced theme tokens
const lightTokens = {
  cardBg: 'var(--card)',
  cardBorder: 'var(--border)',
  primary: '#9067C6',
  primaryLight: '#8D86C9',
  textPrimary: '#242038',
  textMuted: '#655A7C',
};

const darkTokens = {
  cardBg: 'var(--card)',
  cardBorder: 'var(--border)',
  primary: '#934cf0',
  primaryLight: '#934cf0',
  textPrimary: '#ffffff',
  textMuted: '#94A3B8',
};

const dateLabels = {
  today: 'Today',
  last7: 'This Week',
  last30: 'This Month',
};

const badgeToneConfig = {
  positive: {
    icon: TrendingUp,
    color: '#10b981',
  },
  negative: {
    icon: TrendingDown,
    color: '#f43f5e',
  },
  neutral: {
    icon: Minus,
    color: '#94A3B8',
  },
};

export default function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  badgeText,
  badgeTone = 'positive',
  className,
  isLoading = false,
}) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const t = isLight ? lightTokens : darkTokens;

  if (isLoading) {
    return (
      <div
        className={cn(
          'backdrop-blur-[12px] border rounded-2xl p-5 flex flex-col gap-4 shadow-xl h-full',
          className
        )}
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.cardBorder,
        }}
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
        <div className="flex items-center justify-between mt-auto">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-3 w-12 rounded-full" />
        </div>
      </div>
    );
  }

  const badge = badgeToneConfig[badgeTone] ?? badgeToneConfig.positive;
  const BadgeIcon = badge.icon;

  return (
    <motion.div
      whileHover={{ y: -5, borderColor: t.primary }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'backdrop-blur-[12px] border rounded-2xl p-5 flex flex-col gap-4 cursor-pointer shadow-xl group transition-all duration-300 h-full',
        className
      )}
      data-cursor="card"
      style={{
        backgroundColor: t.cardBg,
        borderColor: t.cardBorder,
        boxShadow: `0 10px 30px -15px ${isLight ? 'rgba(0,0,0,0.1)' : t.primary + '22'}`,
      }}
    >
      {/* Top row: label + animated icon */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: t.textMuted }}
        >
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: t.primary + '1A',
            border: `1px solid ${t.primary}33`,
          }}
        >
          <AnimeIcon
            Icon={Icon}
            className="size-5"
            animation="pulse"
            hoverParent={true}
            color={t.primary}
          />
        </div>
      </div>

      {/* Value */}
      <div
        className="text-3xl sm:text-4xl font-black tracking-tight"
        style={{ color: t.textPrimary }}
      >
        {value}
      </div>

      {/* Bottom: badge + subtitle */}
      <div className="flex items-center justify-between mt-auto">
        {badgeText && (
          <div
            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
            style={{ color: badge.color }}
          >
            <BadgeIcon className="size-3" />
            {badgeText}
          </div>
        )}
        {subtitle && (
          <span
            className="text-[11px] font-medium ml-auto"
            style={{ color: t.textMuted }}
          >
            {dateLabels[subtitle] ?? subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
}