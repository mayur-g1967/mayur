"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  views: {
    label: "Page Views",
  },
  confidenceCoach: { label: "Confidence Coach", color: "var(--chart-1)" },
  socialMentor: { label: "Social Mentor", color: "var(--chart-2)" },
  microLearning: { label: "Micro‑Learning", color: "var(--chart-3)" },
  inQuizzo: { label: "InQuizzo", color: "var(--chart-4)" },
};

export const ActivityChart = React.memo(function ActivityChart({ data, selectedDate, isLoading = false }) {
  const [activeChart, setActiveChart] = React.useState("confidenceCoach");

  const total = React.useMemo(
    () => ({
      confidenceCoach: data.reduce((acc, curr) => acc + curr.confidenceCoach, 0),
      socialMentor: data.reduce((acc, curr) => acc + curr.socialMentor, 0),
      microLearning: data.reduce((acc, curr) => acc + curr.microLearning, 0),
      inQuizzo: data.reduce((acc, curr) => acc + curr.inQuizzo, 0),
    }),
    [data]
  );

  const tickFormatter = React.useCallback((value) => {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, []);

  const tooltipLabelFormatter = React.useCallback((value) => {
    return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, []);

  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const t = isLight ? {
    cardBg: 'var(--card)',
    cardBorder: 'var(--border)',
    primary: '#9067C6',
    tabActiveBg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
    tabActiveColor: '#9067C6',
    tabBorder: 'var(--border)',
    textPrimary: '#242038',
    textMuted: '#655A7C',
    gridColor: 'color-mix(in srgb, var(--border) 10%, transparent)',
  } : {
    cardBg: 'var(--card)',
    cardBorder: 'var(--border)',
    primary: '#934cf0',
    tabActiveBg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
    tabActiveColor: '#934cf0',
    tabBorder: 'var(--border)',
    textPrimary: '#ffffff',
    textMuted: '#94A3B8',
    gridColor: 'color-mix(in srgb, var(--border) 10%, transparent)',
  };

  if (isLoading) {
    return (
      <div
        className="backdrop-blur-[12px] border rounded-2xl overflow-hidden shadow-xl h-full flex flex-col"
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.cardBorder,
        }}
      >
        <div className="flex flex-col sm:flex-row" style={{ borderBottom: `1px solid ${t.tabBorder}` }}>
          <div className="flex flex-col justify-center gap-1 px-6 py-4">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-3 w-40 rounded-full" />
          </div>
          <div className="flex overflow-x-auto flex-nowrap sm:ml-auto">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="px-6 py-4 flex flex-col gap-2 items-center border-l first:border-l-0" style={{ borderColor: t.tabBorder }}>
                <Skeleton className="h-2 w-12 rounded-full" />
                <Skeleton className="h-5 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 flex-1 flex items-end gap-3 justify-between">
          {Array(7).fill(0).map((_, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${20 + Math.random() * 60}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          30%  { transform: translateX(0); }
          70%  { transform: translateX(var(--marquee-offset, -30%)); }
          100% { transform: translateX(var(--marquee-offset, -30%)); }
        }
        .tab-label-wrap:hover .tab-label-text,
        .tab-label-active .tab-label-text {
          animation: marquee-scroll 3s ease-in-out infinite alternate;
        }
      `}</style>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="backdrop-blur-[12px] border rounded-2xl overflow-hidden shadow-xl h-full flex flex-col"
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.cardBorder,
          boxShadow: `0 10px 30px -15px ${isLight ? 'rgba(0,0,0,0.1)' : t.primary + '22'}`,
        }}
      >
        {/* Header row */}
        <div className="flex flex-col sm:flex-row" style={{ borderBottom: `1px solid ${t.tabBorder}` }}>
          <div className="flex flex-col justify-center gap-1 px-6 py-4">
            <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: t.textMuted }}>Activity Chart</span>
            <p className="text-[11px]" style={{ color: t.textMuted + 'aa' }}>{`Showing total sessions from the last 7 days`}</p>
          </div>

          <div className="flex overflow-x-auto flex-nowrap sm:ml-auto">
            {["confidenceCoach", "socialMentor", "microLearning", "inQuizzo"].map((key) => {
              const isActive = activeChart === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveChart(key)}
                  className="relative flex flex-1 flex-col items-center justify-center gap-1 px-4 py-3 sm:px-6 sm:py-4 text-center transition-all duration-200 min-w-[5rem] border-l first:border-l-0"
                  style={{
                    borderColor: t.tabBorder,
                    backgroundColor: isActive ? t.tabActiveBg : 'transparent',
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                      style={{ backgroundColor: t.primary }}
                    />
                  )}
                  <div
                    className={`tab-label-wrap w-full overflow-hidden${isActive ? ' tab-label-active' : ''}`}
                  >
                    <span
                      className="tab-label-text inline-block whitespace-nowrap text-[10px] sm:text-xs font-bold uppercase tracking-wide"
                      style={{ color: isActive ? t.tabActiveColor : t.textMuted }}
                    >
                      {chartConfig[key].label}
                    </span>
                  </div>
                  <span
                    className="text-base sm:text-2xl font-black leading-none"
                    style={{ color: isActive ? t.textPrimary : t.textMuted }}
                  >
                    {total[key].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="px-2 sm:px-4 py-4 flex-1">
          <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
            <BarChart data={data} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} stroke={t.gridColor} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={tickFormatter}
                tick={{ fill: t.textMuted, fontSize: 11 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey={chartConfig.activeChart}
                    labelFormatter={tooltipLabelFormatter}
                  />
                }
              />
              <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </motion.div>
    </>
  );
});

export function getActivityChartData(sessions = []) {
  if (!Array.isArray(sessions)) {
    console.error("getActivityChartData received non-array data:", sessions);
    return [];
  }

  const dailyMap = {};

  sessions.forEach((session) => {
    const date = session.date;
    if (!dailyMap[date]) {
      dailyMap[date] = {
        date,
        confidenceCoach: 0,
        socialMentor: 0,
        microLearning: 0,
        inQuizzo: 0,
      };
    }
    dailyMap[date][session.module] += 1;
  });

  return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
}