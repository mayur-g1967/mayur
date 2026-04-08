'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import NoiseMesh from '@/app/components/inquizzo/NoiseMesh';
import AnimeIcon from '@/app/components/inquizzo/AnimeIcon';
import {
  Medal, FileCheck, Target, Award,
  Shuffle, LayoutGrid, ArrowRight, List,
  Brain, Code, Palette, ExternalLink,
  Rocket, TrendingUp, Loader2, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/shared/header/Header.jsx';
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/auth-client";
import { toast } from "sonner";
import { useTheme } from "next-themes";

/* ────────────────────────────────────────────
   DATA (Mapped from provided blueprint)
   ──────────────────────────────────────────── */

const stats = [
  {
    label: 'Total Score',
    value: '12,450',
    change: '+1.2k this week',
    changeType: 'positive',
    Icon: Medal,
    iconColor: '#934def',
    anim: 'bounce',
  },
  {
    label: 'Quests Answered',
    value: '842',
    progress: 84,
    Icon: FileCheck,
    iconColor: '#934def',
    anim: 'wiggle',
  },
  {
    label: 'Accuracy Rate',
    value: '94%',
    tag: 'Top 2% of players',
    Icon: Target,
    iconColor: '#934def',
    anim: 'pulse',
  },
  {
    label: 'Highest Score',
    value: '2,840',
    tag: 'New Record!',
    Icon: Award,
    iconColor: '#934def',
    anim: 'spin',
  },
];

const activity = [
  {
    name: 'Advanced Quantum Theory',
    Icon: Brain,
    iconBg: 'bg-orange-500/20',
    iconColor: '#f97316',
    date: 'Oct 24, 2023',
    score: '2,450 pts',
    level: 'Level Gold',
    status: 'Completed',
    statusClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  {
    name: 'Full-stack React Master',
    Icon: Code,
    iconBg: 'bg-blue-500/20',
    iconColor: '#3b82f6',
    date: 'Oct 23, 2023',
    score: '1,820 pts',
    level: 'Level Silver',
    status: 'Completed',
    statusClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  {
    name: 'Modern UI/UX Principles',
    Icon: Palette,
    iconBg: 'bg-purple-500/20',
    iconColor: '#934def',
    date: 'Oct 21, 2023',
    score: '-- pts',
    level: 'In Progress',
    status: 'Active',
    statusClass: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    showResume: true,
  },
];

/* ────────────────────────────────────────────
   COMPONENTS
   ──────────────────────────────────────────── */

const GlassPanel = ({ children, className, t, ...props }) => (
  <div
    className={cn(
      "backdrop-blur-[12px] border rounded-2xl",
      className
    )}
    style={{
      backgroundColor: t.glassBg,
      borderColor: t.glassBorder
    }}
    {...props}
  >
    {children}
  </div>
);

const StatCard = ({ stat, t, isLight }) => (
  <motion.div
    whileHover={{ y: -5, borderColor: t.primary }}
    className="backdrop-blur-[12px] border p-6 rounded-2xl flex flex-col gap-3 group transition-all duration-300 cursor-pointer shadow-xl"
    style={{
      backgroundColor: t.cardBg,
      borderColor: t.cardBorder,
      boxShadow: `0 10px 30px -15px ${isLight ? 'rgba(0,0,0,0.1)' : t.primary + '22'}`
    }}
    data-cursor="card"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: t.textMuted }}>{stat.label}</span>
      <AnimeIcon
        Icon={stat.Icon}
        className="size-5"
        animation={stat.anim}
        hoverParent={true}
        color={t.primary}
      />
    </div>
    <div className="text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-tight" style={{ color: t.textPrimary }}>{stat.value}</div>
    {stat.progress ? (
      <div className="w-full h-1.5 rounded-full overflow-hidden mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stat.progress}%` }}
          className="h-full"
          style={{ backgroundImage: `linear-gradient(to right, ${t.primary}, ${t.primaryLight})` }}
        />
      </div>
    ) : stat.change ? (
      <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: '#10b981' }}>
        <TrendingUp className="size-3" /> {stat.change}
      </div>
    ) : stat.tag ? (
      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: stat.tag === 'New Record!' ? t.primary : t.textMuted }}>
        {stat.tag}
      </div>
    ) : null}
  </motion.div>
);

const ActivityRow = ({ item, t }) => (
  <tr className="group hover:bg-white/[0.02] transition-colors border-b last:border-0" style={{ borderColor: t.separator }} data-cursor="card">
    <td className="py-5 px-2">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: item.iconBg, borderColor: 'rgba(255,255,255,0.05)' }}>
          <AnimeIcon Icon={item.Icon} className="size-5" animation="bounce" hoverParent={true} color={item.iconColor} />
        </div>
        <span className="text-sm font-bold" style={{ color: t.textPrimary }}>{item.name}</span>
      </div>
    </td>
    <td className="py-5 text-sm" style={{ color: t.textMuted }}>{item.date}</td>
    <td className="py-5">
      <span className="text-sm font-display font-black" style={{ color: t.textPrimary }}>{item.score}</span>
    </td>
    <td className="py-5">
      <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border", item.statusClass)}>
        {item.status}
      </span>
    </td>
  </tr >
);

/* ────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────── */

export default function InQuizzoDashboard() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const [selectedDate, onDateChange] = useState('last7');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalScore: 0,
      questsAnswered: 0,
      accuracyRate: 0,
      highestScore: 0
    },
    recentActivity: []
  });

  const STORAGE_KEY = 'inquizzo_active_session';
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumePct, setResumePct] = useState(0);

  const handleRandomQuizClick = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        if (session && session.quiz_id === 'random' && Array.isArray(session.questions) && session.questions.length > 0 && session.current_index > 0 && session.current_index < 10) {
          setResumePct(Math.round((session.current_index / 10) * 100));
          setShowResumeModal(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to check saved session:', e);
    }
    router.push('/inquizzo/RandomQuiz');
  };

  // Premium Theme Tokens (Synced with RandomQuiz)
  const t = isLight ? {
    pageBg: '#E8E0F0',
    primary: '#9067C6',
    primaryLight: '#8D86C9',
    accent: '#D6CA98',
    mint: '#CEF9F2',
    steel: '#AFC1D6',
    glassBg: 'rgba(171, 146, 191, 0.12)',
    glassBorder: 'rgba(101, 90, 124, 0.22)',
    glassHoverBg: 'rgba(144, 103, 198, 0.1)',
    cardBg: 'rgba(175, 193, 214, 0.2)',
    cardBorder: 'rgba(101, 90, 124, 0.2)',
    cardInnerBg: 'rgba(206, 249, 242, 0.3)',
    textPrimary: '#242038',
    textSecondary: '#655A7C',
    textMuted: '#655A7C',
    textSubtle: '#8D86C9',
    btnPrimaryBg: '#9067C6',
    btnPrimaryHover: '#7B56B3',
    btnSecondaryBg: 'rgba(171, 146, 191, 0.18)',
    btnSecondaryBorder: 'rgba(101, 90, 124, 0.3)',
    btnSecondaryText: '#242038',
    orb1: 'rgba(171, 146, 191, 0.4)',
    orb2: 'rgba(175, 193, 214, 0.45)',
    orb3: 'rgba(206, 249, 242, 0.5)',
    statBg: 'rgba(206, 249, 242, 0.35)',
    separator: 'rgba(101, 90, 124, 0.15)',
  } : {
    pageBg: null,
    primary: '#934cf0',
    primaryLight: '#934cf0',
    accent: '#934cf0',
    mint: '#934cf0',
    steel: '#934cf0',
    glassBg: 'rgba(147, 76, 240, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassHoverBg: 'rgba(255, 255, 255, 0.05)',
    cardBg: 'rgba(147, 76, 240, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    cardInnerBg: 'rgba(24, 16, 34, 0.3)',
    textPrimary: '#ffffff',
    textSecondary: '#ffffff',
    textMuted: '#94A3B8',
    textSubtle: '#94A3B8',
    btnPrimaryBg: '#934cf0',
    btnPrimaryHover: 'rgba(147, 76, 240, 0.9)',
    btnSecondaryBg: 'rgba(147, 76, 240, 0.05)',
    btnSecondaryBorder: 'rgba(255, 255, 255, 0.1)',
    btnSecondaryText: '#CBD5E1',
    orb1: 'rgba(147, 76, 240, 0.4)',
    orb2: 'rgba(79, 70, 229, 0.4)',
    orb3: 'rgba(88, 28, 135, 0.2)',
    statBg: 'rgba(24, 16, 34, 0.3)',
    separator: 'rgba(255, 255, 255, 0.05)',
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) fetchDashboardStats(selectedDate);
  }, [selectedDate, mounted]);

  const fetchDashboardStats = async (range) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`/api/inquizzo/dashboard-stats?range=${range}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load your latest stats.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const dashboardStats = [
    {
      label: 'Total Score',
      value: data.stats.totalScore.toLocaleString(),
      change: data.stats.scoreChangeTag,
      changeType: 'positive',
      Icon: Medal,
      anim: 'bounce',
    },
    {
      label: 'Quests Answered',
      value: data.stats.questsAnswered.toString(),
      change: data.stats.questsChangeTag,
      changeType: 'positive',
      progress: data.stats.questsAnswered > 0 ? (data.stats.questsAnswered > 100 ? 100 : data.stats.questsAnswered) : 0,
      Icon: FileCheck,
      anim: 'wiggle',
    },
    {
      label: 'Accuracy Rate',
      value: `${data.stats.accuracyRate}%`,
      tag: data.stats.accuracyTag,
      Icon: Target,
      anim: 'pulse',
    },
    {
      label: 'Highest Score',
      value: data.stats.highestScore.toLocaleString(),
      tag: data.stats.highestTag,
      Icon: Award,
      anim: 'spin',
    },
  ];

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={cn("relative min-h-screen font-dm cursor-none flex flex-col transition-colors duration-500", !isLight && "iq-mesh-bg")} style={isLight ? { backgroundColor: t.pageBg } : undefined}>
      <NoiseMesh />

      {/* Ambient background orbs */}
      {isLight ? (
        <div className="fixed inset-0 pointer-events-none overflow-hidden text-center">
          <div className="absolute -top-24 -left-24 w-[500px] h-[500px] blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ backgroundColor: '#AB92BF', opacity: 0.55 }} />
          <div className="absolute -bottom-16 -right-16 w-[450px] h-[450px] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: '#AFC1D6', opacity: 0.6 }} />
          <div className="absolute top-[25%] right-[5%] w-[400px] h-[400px] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: '#CEF9F2', opacity: 0.7 }} />
        </div>
      ) : (
        <div className="fixed inset-0 pointer-events-none overflow-hidden text-center z-0">
          <div className="absolute -top-20 -left-20 w-[400px] h-[400px] blur-[80px] rounded-full pointer-events-none animate-pulse" style={{ backgroundColor: t.orb1 }} />
          <div className="absolute bottom-10 right-10 w-[300px] h-[300px] blur-[80px] rounded-full pointer-events-none" style={{ backgroundColor: t.orb2 }} />
          <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] blur-[80px] rounded-full pointer-events-none" style={{ backgroundColor: t.orb3 }} />
        </div>
      )}

      <main className="relative z-10 flex flex-col min-h-screen">
        {/* Header Component */}
        <Header
          DateValue={selectedDate}
          onDateChange={onDateChange}
          tempDate={todayStr}
        />

        <div className="p-4 md:p-8 space-y-8 pt-10 md:pt-16 max-w-7xl mx-auto w-full">
          {/* Hero Section */}
          <section className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-1"
            >
              <h1
                className="text-4xl sm:text-6xl md:text-7xl font-syne font-[800] tracking-tighter bg-clip-text text-transparent bg-gradient-to-r leading-tight"
                style={{ backgroundImage: `linear-gradient(to right, ${t.primary}, ${isLight ? t.accent : '#4338CA'})` }}
              >
                InQuizzo
              </h1>
              <p className="text-lg" style={{ color: t.textMuted }}>Your knowledge conquest is 94% complete today.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-40 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
                ))
              ) : (
                dashboardStats.map((stat, i) => (
                  <StatCard key={i} stat={stat} t={t} isLight={isLight} />
                ))
              )}
            </div>
          </section>

          {/* Mission Hub */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: t.textPrimary }}>
              <Rocket className="size-5" style={{ color: t.primary }} />
              Mission Hub
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Random Quiz Card */}
              <motion.div
                whileHover={{ y: -5, scale: 1.01 }}
                onClick={handleRandomQuizClick}
                className="relative overflow-hidden rounded-3xl p-8 h-64 flex flex-col justify-end group cursor-pointer bg-gradient-to-br from-purple-600 to-pink-500 shadow-2xl shadow-purple-500/20"
                data-cursor="card"
              >
                <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
                  <Shuffle className="size-[180px]" />
                </div>
                <div className="relative z-10">
                  <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest mb-3 border border-white/10">Daily Challenge</span>
                  <h4 className="text-3xl font-black text-white mb-2">Random Quiz</h4>
                  <p className="text-white/80 text-sm font-medium max-w-[240px] mb-4">Test your knowledge across all categories in a single blast.</p>
                  <button className="flex items-center gap-2 bg-white text-purple-600 px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-transform">
                    Start Mission <ArrowRight className="size-4" />
                  </button>
                </div>
              </motion.div>

              {/* Subject Quiz Card */}
              <motion.div
                whileHover={{ y: -5, scale: 1.01 }}
                onClick={() => router.push('/inquizzo/QuizDomainSelection')}
                className="relative overflow-hidden rounded-3xl p-8 h-64 flex flex-col justify-end group cursor-pointer bg-gradient-to-br from-indigo-700 to-purple-900 shadow-2xl shadow-indigo-500/20"
                data-cursor="card"
              >
                <div className="absolute top-[-20px] right-[-20px] opacity-10 -rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
                  <LayoutGrid className="size-[180px]" />
                </div>
                <div className="relative z-10">
                  <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest mb-3 border border-white/10">Specialized</span>
                  <h4 className="text-3xl font-black text-white mb-2">Subject Quiz</h4>
                  <p className="text-white/80 text-sm font-medium max-w-[240px] mb-4">Deep dive into specific modules and master your niche.</p>
                  <button className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-transform border border-indigo-400/30">
                    Choose Subject <List className="size-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="backdrop-blur-[12px] rounded-[32px] p-6 md:p-10 border shadow-2xl relative overflow-hidden" style={{ backgroundColor: t.glassBg, borderColor: t.glassBorder }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 px-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: t.primary }}>Synchronization Log</span>
                <h3 className="text-3xl font-syne font-black" style={{ color: t.textPrimary }}>Recent Activity</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-4 text-slate-400 font-medium text-xs uppercase tracking-wider px-2">Quiz Topic</th>
                    <th className="pb-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Date</th>
                    <th className="pb-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Score</th>
                    <th className="pb-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="py-8 bg-white/5 rounded-xl mb-2" />
                      </tr>
                    ))
                  ) : data.recentActivity.length > 0 ? (
                    data.recentActivity.map((item, i) => (
                      <ActivityRow key={i} item={{
                        ...item,
                        Icon: item.type === 'mcq' ? Code : item.type === 'voice' ? Brain : Palette,
                        iconBg: item.type === 'mcq' ? 'rgba(59, 130, 246, 0.1)' : item.type === 'voice' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(147, 76, 240, 0.1)',
                        iconColor: item.type === 'mcq' ? '#3b82f6' : item.type === 'voice' ? '#f97316' : t.primary,
                        statusClass: item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' :
                          item.status === 'Skipped' ? 'bg-red-500/10 text-red-500 border-red-500/10' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/10'
                      }} t={t} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-500">
                        No recent activity found. Start a quiz to see results here!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main >

      {/* ── Resume Session Modal ── */}
      <AnimatePresence>
        {showResumeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowResumeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                background: isLight
                  ? 'rgba(255, 255, 255, 0.25)'
                  : 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                border: isLight
                  ? '1px solid rgba(255, 255, 255, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isLight
                  ? '0 8px 60px rgba(147, 76, 240, 0.15), 0 0 0 1px rgba(255,255,255,0.3) inset, 0 2px 20px rgba(0,0,0,0.06)'
                  : '0 8px 60px rgba(147, 76, 240, 0.25), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 2px 20px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glassmorphism inner glow orbs */}
              <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${t.primary}40, transparent 70%)` }} />
              <div className="absolute -bottom-16 -right-16 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.3), transparent 70%)' }} />

              {/* Top accent bar */}
              <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${t.primary}, #EC4899, ${t.primary})` }} />

              {/* Close button */}
              <button
                onClick={() => setShowResumeModal(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-10"
                style={{
                  background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <X className="w-4 h-4" style={{ color: t.textMuted }} />
              </button>

              <div className="relative z-[1] p-8 pt-6 text-center">
                {/* Glassmorphism icon container */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative"
                  style={{
                    background: isLight
                      ? 'rgba(147, 76, 240, 0.12)'
                      : 'rgba(147, 76, 240, 0.15)',
                    backdropFilter: 'blur(16px)',
                    border: isLight
                      ? '1px solid rgba(147, 76, 240, 0.2)'
                      : '1px solid rgba(147, 76, 240, 0.25)',
                    boxShadow: `0 0 40px ${t.primary}33, 0 0 80px ${t.primary}15`,
                  }}
                >
                  <Shuffle className="w-9 h-9" style={{ color: t.primary }} />
                </div>

                <h3 className="text-2xl font-black mb-2 tracking-tight" style={{ color: t.textPrimary }}>Incomplete Quiz Found</h3>
                <p className="text-sm mb-7 leading-relaxed" style={{ color: t.textMuted }}>
                  You have an incomplete quiz session. Would you like to pick up where you left off?
                </p>

                {/* Progress indicator with glass bg */}
                <div
                  className="mb-7 p-4 rounded-2xl"
                  style={{
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                    border: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: t.textMuted }}>Progress</span>
                    <span className="text-sm font-black" style={{ color: t.primary }}>{resumePct}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${resumePct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${t.primary}, #EC4899)`, boxShadow: `0 0 12px ${t.primary}66` }}
                    />
                  </div>
                </div>

                {/* Action buttons — glass styled */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowResumeModal(false);
                      router.push('/inquizzo/RandomQuiz');
                    }}
                    className="w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${t.primary}, #EC4899)`,
                      boxShadow: `0 6px 30px ${t.primary}44, 0 0 0 1px rgba(255,255,255,0.1) inset`,
                    }}
                  >
                    Resume Quiz ({resumePct}% Done)
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      setShowResumeModal(false);
                      router.push('/inquizzo/RandomQuiz');
                    }}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
                    style={{
                      background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(12px)',
                      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
                      color: t.textPrimary,
                    }}
                  >
                    Start New Session
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}