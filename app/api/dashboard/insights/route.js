// app/api/dashboard/insights/route.js
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import connectDB from "@/lib/db";
import UserAttempt from "@/models/UserAttempt";
import { MODULE_ROUTES } from "@/lib/moduleConfig";

/**
 * Computes the current and longest streak (consecutive days with at least one attempt).
 */
function computeStreak(attempts) {
  if (!attempts || attempts.length === 0) return { current: 0, longest: 0 };

  const uniqueDates = [
    ...new Set(
      attempts.map((a) => new Date(a.timestamp).toISOString().split("T")[0]),
    ),
  ].sort((a, b) => new Date(b) - new Date(a)); // descending

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Current streak
  let current = 0;
  let cursor = new Date(today);
  for (const dateStr of uniqueDates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === cursor.getTime()) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Longest streak
  let longest = 0;
  let tempStreak = 0;
  let prevDate = null;
  for (const dateStr of [...uniqueDates].reverse()) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = (d - prevDate) / (1000 * 60 * 60 * 24);
      tempStreak = diff === 1 ? tempStreak + 1 : 1;
    }
    longest = Math.max(longest, tempStreak);
    prevDate = d;
  }

  return { current, longest };
}

/**
 * Computes daily activity counts per moduleId for the last N days.
 * Returns byModule keyed by moduleId to match ActivityChart convention.
 */
function computeDailyActivity(attempts, days = 14) {
  const result = {};
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result[key] = {
      date: key,
      byModule: {
        inQuizzo: 0,
        confidenceCoach: 0,
        socialMentor: 0,
        microLearning: 0,
      },
      totalSessions: 0,
    };
  }

  for (const attempt of attempts) {
    const key = new Date(attempt.timestamp).toISOString().split("T")[0];
    if (result[key]) {
      const mod = attempt.moduleId || "inQuizzo";
      if (result[key].byModule[mod] !== undefined) {
        result[key].byModule[mod]++;
      } else {
        result[key].byModule[mod] = 1;
      }
      result[key].totalSessions++;
    }
  }

  return Object.values(result).sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
}

/**
 * Generates human-readable insights from user stats.
 * Uses last 7 days of attempts for "this week" accuracy — not all-time totals.
 */
function generateInsights(user, attempts, streak) {
  const { microLearningStats, mentorStats, confidenceCoachStats } = user;

  // Count recent attempts (last 7 days) per moduleId
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentAttempts = attempts.filter(
    (a) => new Date(a.timestamp) >= sevenDaysAgo,
  );

  // Week counts from UserAttempt records (accurate for inQuizzo + socialMentor)
  const weekCounts = {
    inQuizzo: 0,
    confidenceCoach: 0,
    socialMentor: 0,
    microLearning: 0,
  };
  for (const a of recentAttempts) {
    const mod = a.moduleId || "inQuizzo";
    if (weekCounts[mod] !== undefined) weekCounts[mod]++;
  }

  // Supplement microLearning + confidenceCoach from User stats if no attempts tracked yet
  if (
    weekCounts.microLearning === 0 &&
    microLearningStats?.lessonsCompleted > 0
  ) {
    weekCounts.microLearning = microLearningStats.lessonsCompleted;
  }
  if (
    weekCounts.confidenceCoach === 0 &&
    confidenceCoachStats?.sessionsCompleted > 0
  ) {
    weekCounts.confidenceCoach = confidenceCoachStats.sessionsCompleted;
  }

  // Labels matching ActivityChart + InsightsCard convention
  // ✅ Fix — split into two separate objects
  const MODULE_LABELS = {
    inQuizzo: "InQuizzo",
    confidenceCoach: "Confidence Coach",
    socialMentor: "Social Mentor",
    microLearning: "Micro‑Learning",
  };

  const sorted = Object.entries(weekCounts).sort((a, b) => b[1] - a[1]);
  const [topModuleId, topCount] = sorted[0];
  const [leastModuleId, leastCount] = sorted[sorted.length - 1];

  const topLabel = MODULE_LABELS[topModuleId];
  const leastLabel = MODULE_LABELS[leastModuleId];

  // --- Pattern ---
  const pattern =
    topCount > 0
      ? `You're most active in ${topLabel}${leastCount < topCount ? ` while ${leastLabel} has fewer sessions this week.` : "."}`
      : "Start your first session to see your activity pattern!";

  // --- Snapshot chips ---
  const snapshot = [];
  if (topCount > 0) snapshot.push(`Top module • ${topLabel}`);
  if (streak.current > 0)
    snapshot.push(
      `Streak • ${streak.current} day${streak.current !== 1 ? "s" : ""}`,
    );
  if (confidenceCoachStats?.sessionsCompleted > 0) {
    snapshot.push(`Public Speaker • ${confidenceCoachStats.sessionsCompleted} sessions`);
  }

  // Peak day from recent attempts
  const dayCounts = {};
  for (const a of recentAttempts) {
    const day = new Date(a.timestamp).toLocaleDateString("en-US", {
      weekday: "short",
    });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }
  const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  if (peakDay) snapshot.push(`Peak day • ${peakDay[0]}`);

  // --- Suggestion ---
  let suggestion = "Keep up the great work! Try a new module today.";
  let suggestionModule = null;

  if (leastCount === 0) {
    suggestion = `You haven't tried ${leastLabel} yet. Start a quick session to explore it!`;
    suggestionModule = leastLabel;
  } else if (streak.current === 0) {
    suggestion =
      "You haven't practiced today. Start a 5-min session to keep your streak alive!";
  } else if (leastCount < topCount / 2) {
    suggestion = `Start a 10-min ${leastLabel} session to balance your practice.`;
    suggestionModule = leastLabel;
  }

  // ✅ Fix
  return {
    pattern,
    snapshot,
    suggestion,
    suggestionModule,
    suggestionRoute: suggestionModule ? MODULE_ROUTES[leastModuleId] : null,
  };
}

export async function GET(req) {
  try {
    await connectDB();
    const user = await authenticate(req);

    // Fetch last 30 days of attempts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attempts = await UserAttempt.find({
      userId: user._id,
      timestamp: { $gte: thirtyDaysAgo },
    })
      .sort({ timestamp: -1 })
      .lean();

    const streak = computeStreak(attempts);
    const dailyActivity = computeDailyActivity(attempts, 14);
    const insights = generateInsights(user, attempts, streak);

    // Module progress — pulled from User stat fields
    const moduleProgress = [
      {
        id: "inQuizzo",
        name: "InQuizzo",
        sessions: user.gameStats?.gamesPlayed || 0,
        accuracy: user.accuracy || 0,
        lastActive: user.gameStats?.lastGameDate || null,
      },
      {
        id: "microLearning",
        name: "Micro‑Learning",
        sessions: user.microLearningStats?.lessonsCompleted || 0,
        accuracy: null,
        lastActive: user.microLearningStats?.lastLessonDate || null,
      },
      {
        id: "socialMentor",
        name: "Social Mentor",
        sessions: user.mentorStats?.sessionsAttended || 0,
        accuracy: user.mentorStats?.averageConfidenceScore || 0,
        lastActive: user.mentorStats?.lastSessionDate || null,
      },
      {
        id: "confidenceCoach",
        name: "Confidence Coach",
        sessions: user.confidenceCoachStats?.sessionsCompleted || 0,
        accuracy: user.confidenceCoachStats?.averageScore || 0,
        lastActive: user.confidenceCoachStats?.lastSessionDate || null,
      },
    ];

    return NextResponse.json({
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        picture: user.picture,
      },
      streak,
      moduleProgress,
      dailyActivity,
      insights,
      recentSessions: attempts.slice(0, 10),
    });
  } catch (error) {
    console.error("Dashboard insights error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch insights" },
      {
        status:
          error.message === "No token provided" ||
            error.message === "Authentication failed"
            ? 401
            : 500,
      },
    );
  }
}
