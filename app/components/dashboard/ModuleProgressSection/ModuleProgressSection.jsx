'use client'

import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { ProgressStatusFilter, CategoryFilter, SortSelect } from './ModuleProgressFilters.jsx'
import ModuleProgressList from './ModuleProgressList.jsx'
import { modulesData } from './ModulesData.js'
import { useState, useMemo, useEffect } from 'react'
import { LayoutList, Play, ChevronRight, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Props
 * ─────
 * liveData    – { accuracyProgress, questionsProgress, sessionsProgress } | null
 *               Passed from dashboard/page.jsx (fetched alongside metric cards).
 * liveLoading – boolean — true while the API call is in-flight.
 */
export default function ModuleProgressSection({ liveData = null, liveLoading = true }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('recent');

  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const [localActive, setLocalActive] = useState(null);

  // Direct localStorage check for max reliability
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => {
      try {
        const saved = localStorage.getItem('inquizzo_active_session');
        if (saved) {
          const s = JSON.parse(saved);
          const progress = s.current_index || s.questions_answered || 0;
          if (s && progress > 0 && progress < 10) {
            setLocalActive({
              sessionId: s.session_id || 'local',
              title: s.quiz_id === 'random' ? 'Random Quiz' : (s.topic || 'Subject Quiz'),
              progress: progress,
              moduleId: 'inquizzo'
            });
            return;
          }
        }
      } catch (e) { }
      setLocalActive(null);
    };
    check();
    window.addEventListener('storage', check);
    window.addEventListener('focus', check);
    return () => {
      window.removeEventListener('storage', check);
      window.removeEventListener('focus', check);
    };
  }, []);

  const t = isLight ? {
    cardBg: 'var(--card)',
    cardBorder: 'var(--border)',
    primary: '#9067C6',
    textPrimary: '#242038',
    textMuted: '#655A7C',
  } : {
    cardBg: 'var(--card)',
    cardBorder: 'var(--border)',
    primary: '#934cf0',
    textPrimary: '#ffffff',
    textMuted: '#94A3B8',
  };

  // Merge live progress and active session virtual rows into the correct modules
  const mergedModules = useMemo(() => {
    if (!liveData) return modulesData;

    return modulesData.map((module) => {
      const virtualSubmodules = [];

      // Inject InQuizzo live progress bars
      if (module.id.toLowerCase() === 'inquizzo') {
        const baseSubmodules = (module.submodules || []).map((sub) => {
          if (sub.id === 'accuracy') {
            return {
              ...sub,
              progress: liveData.moduleProgress?.accuracyProgress ?? 0,
              displayLabel: liveData.moduleProgress?.accuracyLabel
            };
          }
          if (sub.id === 'questions') {
            return {
              ...sub,
              progress: liveData.moduleProgress?.questionsProgress ?? 0,
              displayLabel: liveData.moduleProgress?.questionsLabel
            };
          }
          if (sub.id === 'score') {
            return {
              ...sub,
              progress: liveData.moduleProgress?.scoreProgress ?? 0,
              displayLabel: liveData.moduleProgress?.scoreLabel
            };
          }
          return sub;
        });

        // Add InQuizzo "Continue" row (Prefer localActive, fallback to API)
        const activeSess = localActive || (
          liveData?.activeSession?.moduleId?.toLowerCase() === 'inquizzo' || !liveData?.activeSession?.moduleId
            ? liveData?.activeSession
            : null
        );
        if (activeSess) {
          virtualSubmodules.push({
            id: 'active-session',
            name: activeSess.title || (activeSess.sessionId === 'local' ? 'Active Quiz' : 'Continue Quiz'),
            progress: Math.round(((activeSess.progress || 0) / 10) * 100),
            displayLabel: `${activeSess.progress || 0}/10 Questions`,
            isVirtual: true,
            type: 'continue',
            sessionId: activeSess.sessionId || 'active',
            moduleId: 'inquizzo',
          });
        }

        // Removed InQuizzo "Review" row as requested

        return { ...module, submodules: [...virtualSubmodules, ...baseSubmodules] };
      }

      // Inject Micro-Learning active/review rows
      if (module.id === 'microlearning') {
        const activeForML = liveData.activeSession?.moduleId === 'microLearning' ? liveData.activeSession : null;
        if (activeForML) {
          const stageLabel =
            activeForML.stage === 'video' ? '🎬 Watching Video' :
              activeForML.stage === 'quiz' ? '📝 Quiz in Progress' :
                activeForML.stage === 'articulation' ? '🎤 Articulation Round' :
                  'In Progress';

          virtualSubmodules.push({
            id: 'ml-active-session',
            name: activeForML.title || 'Micro-Learning',
            progress: activeForML.stage === 'video' ? 30 : activeForML.stage === 'quiz' ? 60 : 85,
            displayLabel: stageLabel,
            isVirtual: true,
            type: 'continue',
            sessionId: activeForML.sessionId,
            moduleId: 'microlearning',
            stage: activeForML.stage,
            videoId: activeForML.videoId,
            playlistId: activeForML.playlistId,
          });
        }

        if (liveData.lastCompletedSession?.moduleId === 'microlearning') {
          virtualSubmodules.push({
            id: 'ml-last-completed',
            name: liveData.lastCompletedSession.title,
            progress: 100,
            displayLabel: 'Completed ✓',
            isVirtual: true,
            type: 'review',
            sessionId: liveData.lastCompletedSession.sessionId,
            moduleId: 'microLearning',
          });
        }

        return { ...module, submodules: virtualSubmodules };
      }

      // Inject Social Mentor live progress
      if (module.id === 'socialmentor') {
        const smSubmodules = (module.submodules || []).map((sub) => {
          if (sub.id === 'sessions') {
            return {
              ...sub,
              progress: liveData.moduleProgress?.socialMentorSessionsProgress ?? 0,
              displayLabel: liveData.moduleProgress?.socialMentorSessionsLabel || '0 Sessions'
            };
          }
          return sub;
        });
        return { ...module, submodules: smSubmodules };
      }

      return module;
    });
  }, [liveData, localActive]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="col-span-full lg:col-span-3 h-125 backdrop-blur-md border rounded-2xl p-5 shadow-xl w-full flex flex-col"
      style={{
        backgroundColor: t.cardBg,
        borderColor: t.cardBorder,
        boxShadow: `0 10px 30px -15px ${isLight ? 'rgba(0,0,0,0.1)' : t.primary + '22'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: t.primary + '1A', border: `1px solid ${t.primary}33` }}
        >
          <LayoutList className="size-3.5" style={{ color: t.primary }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: t.textMuted }}>
          Module Progress
        </span>

        {/* Live indicator — shown once real data has arrived */}
        {!liveLoading && liveData && (
          <span
            className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ backgroundColor: t.primary + '1A', color: t.primary }}
          >
            Live
          </span>
        )}
      </div>

      {/* Filters & Content */}
      <div className='flex flex-col flex-1 w-full gap-4 min-h-0'>
        <div className='flex flex-col md:flex-row justify-between h-fit items-start md:items-center gap-2'>
          <div className="min-w-0 w-full">
            <ProgressStatusFilter
              value={statusFilter}
              onValueChange={(value) => { if (!value) return; setStatusFilter(value); }}
            />
          </div>
          <div className='flex items-center gap-2 min-w-0 w-full md:w-auto md:shrink-0'>
            <div className="flex-1 min-w-0 md:flex-none">
              <CategoryFilter
                value={selectedCategory}
                onValueChange={(value) => { if (!value) return; setSelectedCategory(value); }}
              />
            </div>
            <div className="flex-1 min-w-0 md:flex-none">
              <SortSelect
                value={sortOption}
                onValueChange={(value) => { if (!value) return; setSortOption(value); }}
              />
            </div>
          </div>
        </div>



        {/* Content Area */}
        <div className='flex-1 overflow-y-auto custom-scroll pr-2 min-h-0'>
          {liveLoading && !localActive ? (
            <div className="flex flex-col gap-3">
              {Array(3).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="h-17 rounded-lg animate-pulse"
                  style={{ backgroundColor: t.primary + '10' }}
                />
              ))}
            </div>
          ) : (
            <ModuleProgressList
              modules={mergedModules}
              selectedCategory={selectedCategory}
              statusFilter={statusFilter}
              sortOption={sortOption}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
