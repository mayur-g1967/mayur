// lib/mockUserData.js
// Single aggregation layer for the whole dashboard.
// Imports raw sessions from app/mockData.js and derives everything:
// profile, streak, moduleProgress, dailyActivity, insights, recentSessions.
// Swap the bottom export for a real API call when the backend is ready.

import { mockSessions } from "@/app/mockData";
import { MODULES } from "@/types/user";
import { MODULE_ROUTES } from "@/lib/moduleConfig";

const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateStr(d) {
  return new Date(d).toISOString().split("T")[0];
}

function daysAgo(n) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
}

function dayLabel(dateString) {
  return DAYS[new Date(dateString).getDay()];
}

function toMinutes(durationSeconds) {
  return Math.round(durationSeconds / 60);
}

// ─── Daily Activity (last 14 days) ────────────────────────────────────────────

function computeDailyActivity(sessions) {
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = daysAgo(13 - i);
    return dateStr(d);
  });

  return last14.map((date) => {
    const daySessions = sessions.filter((s) => s.date === date);
    const byModule = {};

    Object.keys(MODULES).forEach((moduleId) => {
      const mins = daySessions
        .filter((s) => s.module === moduleId)
        .reduce((sum, s) => sum + toMinutes(s.duration), 0);
      if (mins > 0) byModule[moduleId] = mins;
    });

    const totalMinutes = Object.values(byModule).reduce((a, b) => a + b, 0);

    return {
      date,
      day: dayLabel(date),
      totalMinutes,
      sessionCount: daySessions.length,
      byModule,
    };
  });
}

// ─── Streak ───────────────────────────────────────────────────────────────────

function computeStreak(sessions) {
  const activeDates = new Set(sessions.map((s) => s.date));

  let current = 0;
  let lastActiveDate = null;

  for (let i = 0; i < 60; i++) {
    const d = dateStr(daysAgo(i));
    if (activeDates.has(d)) {
      current++;
      if (!lastActiveDate) lastActiveDate = d;
    } else {
      break;
    }
  }

  const sortedDates = [...activeDates].sort();
  let streak = 0;
  let longest = 0;
  sortedDates.forEach((date, idx) => {
    if (idx === 0) {
      streak = 1;
    } else {
      const prev = new Date(sortedDates[idx - 1]);
      const curr = new Date(date);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      streak = diff === 1 ? streak + 1 : 1;
    }
    longest = Math.max(longest, streak);
  });

  return { current, longest, lastActiveDate: lastActiveDate ?? todayStr };
}

// ─── Module Progress ──────────────────────────────────────────────────────────

function computeModuleProgress(sessions) {
  const sevenDaysAgo = dateStr(daysAgo(7));

  return Object.keys(MODULES).map((moduleId) => {
    const all = sessions.filter((s) => s.module === moduleId);
    const week = all.filter((s) => s.date >= sevenDaysAgo);

    const totalMinutes = all.reduce((sum, s) => sum + toMinutes(s.duration), 0);
    const weekMinutes = week.reduce((sum, s) => sum + toMinutes(s.duration), 0);
    const totalSessions = all.length;
    const weekSessions = week.length;

    const xp = totalSessions * 10 + totalMinutes;
    const level = Math.min(10, Math.floor(xp / 200) + 1);
    const xpToNextLevel = level < 10 ? level * 200 : 9999;

    const sorted = [...all].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastSessionAt = sorted[0]?.date ?? null;

    return {
      moduleId,
      label: MODULES[moduleId].label,
      totalSessions,
      totalMinutes,
      weekSessions,
      weekMinutes,
      completionRate: totalSessions > 0 ? 0.8 : 0,
      lastSessionAt,
      level,
      xp,
      xpToNextLevel,
    };
  });
}

// ─── Recent Sessions (last 20) ────────────────────────────────────────────────

function computeRecentSessions(sessions) {
  return sessions.slice(0, 20).map((s) => ({
    id: s._id,
    moduleId: s.module,
    startedAt: s.date,
    durationMinutes: toMinutes(s.duration),
    completed: true,
    xpEarned: Math.round(toMinutes(s.duration) * 1.5),
  }));
}

// ─── AI Insights ─────────────────────────────────────────────────────────────
// Returns { pattern, snapshot, suggestion, suggestionModule, suggestionRoute }
// matching exactly what InsightsCard expects

function computeInsights(moduleProgress, streak) {
  // Sort by week activity to find top and lagging modules
  const sorted = [...moduleProgress].sort(
    (a, b) => b.weekSessions - a.weekSessions,
  );
  const top = sorted[0];
  const lagging = sorted[sorted.length - 1];

  const topLabel = top?.label ?? "—";
  const lagLabel = lagging?.label ?? "—";
  const lagId = lagging?.moduleId;

  // Pattern
  const pattern =
    top?.weekSessions > 0
      ? `You're most active in ${topLabel}${
          lagging?.weekSessions < top?.weekSessions
            ? ` while ${lagLabel} has fewer sessions this week.`
            : "."
        }`
      : "Start your first session to see your activity pattern!";

  // Snapshot chips
  const snapshot = [];
  if (top?.weekSessions > 0) snapshot.push(`Top module • ${topLabel}`);
  if (streak.current > 0)
    snapshot.push(
      `Streak • ${streak.current} day${streak.current !== 1 ? "s" : ""}`,
    );

  // Peak day from moduleProgress dailyActivity
  const peakEntry = moduleProgress.reduce(
    (best, m) => (m.weekSessions > (best?.weekSessions ?? 0) ? m : best),
    null,
  );
  if (peakEntry?.lastSessionAt) {
    const peakDay = DAYS[new Date(peakEntry.lastSessionAt).getDay()];
    snapshot.push(`Peak day • ${peakDay}`);
  }

  // Suggestion
  let suggestion = "Keep up the great work! Try a new module today.";
  let suggestionModule = null;
  let suggestionRoute = null;

  if (lagging?.weekSessions === 0 && lagging?.totalSessions === 0) {
    suggestion = `You haven't tried ${lagLabel} yet. Start a quick session to explore it!`;
    suggestionModule = lagLabel;
    suggestionRoute = MODULE_ROUTES[lagId] ?? null;
  } else if (streak.current === 0) {
    suggestion =
      "You haven't practiced today. Start a 5-min session to keep your streak alive!";
  } else if (lagging?.weekSessions < top?.weekSessions / 2) {
    suggestion = `Start a 10-min ${lagLabel} session to balance your practice.`;
    suggestionModule = lagLabel;
    suggestionRoute = MODULE_ROUTES[lagId] ?? null;
  }

  return { pattern, snapshot, suggestion, suggestionModule, suggestionRoute };
}

// ─── Assemble ─────────────────────────────────────────────────────────────────

function buildDashboardData(sessions) {
  const dailyActivity = computeDailyActivity(sessions);
  const streak = computeStreak(sessions);
  const moduleProgress = computeModuleProgress(sessions);
  const recentSessions = computeRecentSessions(sessions);
  const insights = computeInsights(moduleProgress, streak);
  const totalXp = moduleProgress.reduce((sum, m) => sum + m.xp, 0);
  const globalLevel = Math.min(10, Math.floor(totalXp / 500) + 1);

  return {
    profile: {
      id: "u1",
      name: "Alex Rivera",
      email: "alex@example.com",
      joinedAt: daysAgo(90).toISOString(),
      timezone: "America/New_York",
      totalXp,
      globalLevel,
    },
    streak,
    moduleProgress,
    dailyActivity,
    recentSessions,
    insights,
  };
}

// ─── Single export — used by the entire dashboard ─────────────────────────────
// When the real API is ready, replace with a fetch/SWR call in page.jsx
export const mockUserDashboardData = buildDashboardData(mockSessions);
