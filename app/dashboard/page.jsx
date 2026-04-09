// Location : app/dashboard/page.jsx

'use client'

import Header from '@/app/components/shared/header/Header.jsx';
import MetricCard from '../components/dashboard/Card/MetricCard';
import MetricCardSwiper from '../components/dashboard/Card/MetricCardSwiper';
import { Trophy, Mic, Sparkles, Activity } from "lucide-react";
import { ActivityChart, getActivityChartData } from '../components/dashboard/ActivityChart/ActivityChart.jsx';
import InsightsCard from '../components/dashboard/Card/InsightsCard';
import ModuleProgressSection from '../components/dashboard/ModuleProgressSection/ModuleProgressSection.jsx';
import ReminderSection from '../components/dashboard/Reminder/ReminderSection';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  getConfidenceScore,
  getConfidenceScoreBadge,
  getCurrentStreakBadge,
  getTotalSessions,
  getTotalSessionsBadge,
  getVoiceQuizzes,
  getVoiceQuizzesBadge
} from '../components/dashboard/Card/Metrics';
import { mockUserDashboardData } from '@/lib/mockUserData';
import { getAuthToken } from '@/lib/auth-client';
export default function Home() {
  const [selectedDate, onDateChange] = useState('today');

  // ── Live data state (InQuizzo DB — no mocks) ─────────────────────────────
  const [liveData, setLiveData] = useState({
    currentSessions: [],
    previousSessions: [],
    voiceQuizCount: 0,
    prevVoiceQuizCount: 0,
    currentStreak: 0,
    confidenceScore: 70,
    prevConfidenceScore: 70,
    totalSessions: 0,
    prevTotalSessions: 0,
    moduleProgress: null,
  });
  const [liveLoading, setLiveLoading] = useState(true);

  const fetchLiveData = useCallback(async (range) => {
    setLiveLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`/api/dashboard/live-data?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setLiveData({
          currentSessions: json.currentSessions ?? [],
          previousSessions: json.previousSessions ?? [],
          voiceQuizCount: json.voiceQuizCount ?? 0,
          prevVoiceQuizCount: json.prevVoiceQuizCount ?? 0,
          currentStreak: json.currentStreak ?? 0,
          confidenceScore: json.confidenceScore ?? 70,
          prevConfidenceScore: json.prevConfidenceScore ?? 70,
          totalSessions: json.totalSessions ?? 0,
          prevTotalSessions: json.prevTotalSessions ?? 0,
          moduleProgress: json.moduleProgress ?? null,
        });
      }
    } catch (err) {
      console.error('Failed to fetch live data:', err);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveData(selectedDate);
  }, [selectedDate, fetchLiveData]);

  // ── Insights (still mock for now) ────────────────────────────────────────
  const insightsData = mockUserDashboardData;
  const insightsLoading = false;

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });

  // ── Metric card values — all from live API ────────────────────────────────
  const totalSessions = getTotalSessions(liveData.totalSessions);
  const ConfidenceCoach = getConfidenceScore(liveData.confidenceScore);
  const VoiceQuizzes = getVoiceQuizzes(liveData.voiceQuizCount);
  const CurrentStreak = liveData.currentStreak;

  const totalSessionsBadge = getTotalSessionsBadge(liveData.totalSessions, liveData.prevTotalSessions);
  const ConfidenceCoachBadge = getConfidenceScoreBadge(liveData.confidenceScore, liveData.prevConfidenceScore);
  const VoiceQuizzesBadge = getVoiceQuizzesBadge(liveData.voiceQuizCount, liveData.prevVoiceQuizCount, selectedDate);
  const CurrentStreakBadge = getCurrentStreakBadge(CurrentStreak);

  const ActivityChartData = useMemo(
    () => getActivityChartData(liveData.currentSessions),
    [liveData.currentSessions]
  );

  return (
    <div className="w-full">
      <div className="sticky top-0 z-50 w-full">
        <Header DateValue={selectedDate} onDateChange={onDateChange} tempDate={today} />
      </div>

      {/* Mobile: swiper shows 1 card at a time; Desktop: 4-col grid */}
      <div className='h-fit p-2 px-3 rounded-md flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-4'>
        <MetricCardSwiper count={4}>
          <MetricCard
            icon={Activity}
            label="Total Sessions"
            value={totalSessions}
            badgeText={totalSessionsBadge.text}
            badgeTone={totalSessionsBadge.tone}
            subtitle={selectedDate}
            isLoading={liveLoading}
          />
          <MetricCard
            icon={Sparkles}
            label="Confidence Score"
            value={`${ConfidenceCoach}%`}
            badgeText={ConfidenceCoachBadge.text}
            badgeTone={ConfidenceCoachBadge.tone}
            subtitle={selectedDate}
            isLoading={liveLoading}
          />
          <MetricCard
            icon={Mic}
            label="Voice Quizzes"
            value={VoiceQuizzes}
            badgeText={VoiceQuizzesBadge.text}
            badgeTone={VoiceQuizzesBadge.tone}
            subtitle={selectedDate}
            isLoading={liveLoading}
          />
          <MetricCard
            icon={Trophy}
            label="Current Streak"
            value={CurrentStreak}
            badgeText={CurrentStreakBadge.text}
            badgeTone={CurrentStreakBadge.tone}
            subtitle={selectedDate}
            isLoading={liveLoading}
          />
        </MetricCardSwiper>

        <div className='col-span-full lg:col-span-3'>
          <ActivityChart data={ActivityChartData} selectedDate={selectedDate} isLoading={liveLoading} />
        </div>
        <div className='col-span-full lg:col-span-1'>
          <InsightsCard
            insights={insightsData?.insights}
            streak={insightsData?.streak}
            isLoading={insightsLoading}
          />
        </div>


        {/* Pass live module progress down so ModuleProgressSection needs no extra fetch */}
        <ModuleProgressSection liveData={liveData.moduleProgress} liveLoading={liveLoading} />
        <ReminderSection />
      </div>
    </div>
  );
            }
