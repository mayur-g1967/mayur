// Total Sessions Metric Card

/** Accepts a plain number count (from API) or a session array. */
export function getTotalSessions(countOrSessions) {
    if (typeof countOrSessions === 'number') return countOrSessions;
    return countOrSessions?.length || 0;
}

export function getTotalSessionsBadge(current, previous) {
    // Accepts plain number counts or falls back to .length on arrays
    const cur = typeof current === 'number' ? current : (current?.length || 0);
    const prev = typeof previous === 'number' ? previous : (previous?.length || 0);

    if (prev === 0) {
        return {
            text: `+${cur} sessions`,
            tone: "positive"
        };
    }

    const change = Math.round(((cur - prev) / prev) * 100);

    return {
        text: `${change >= 0 ? "+" : ""}${change}%`,
        tone: change >= 0 ? "positive" : "negative"
    };
}
// Confidence Score Metric Card

/**
 * Accepts a plain number (e.g. 78) directly from the API, or a session array
 * (falls back to delta-sum approach for backwards compatibility).
 */
export function getConfidenceScore(scoreOrSessions) {
    const BASE_SCORE = 70;
    if (typeof scoreOrSessions === 'number') return scoreOrSessions;
    if (!scoreOrSessions || !Array.isArray(scoreOrSessions)) return BASE_SCORE;

    const deltaSum = scoreOrSessions.reduce(
        (sum, session) => sum + (session.confidenceDelta || 0),
        0
    );

    return Math.min(100, BASE_SCORE + deltaSum);
}

/**
 * Accepts either two plain number scores (from API) or two session arrays.
 */
export function getConfidenceScoreBadge(currentScoreOrSessions, previousScoreOrSessions) {
    let delta;
    if (typeof currentScoreOrSessions === 'number' && typeof previousScoreOrSessions === 'number') {
        delta = currentScoreOrSessions - previousScoreOrSessions;
    } else {
        const currentGain = (currentScoreOrSessions ?? []).reduce((sum, s) => sum + (s.confidenceDelta || 0), 0);
        const previousGain = (previousScoreOrSessions ?? []).reduce((sum, s) => sum + (s.confidenceDelta || 0), 0);
        delta = currentGain - previousGain;
    }
    return {
        text: `${delta >= 0 ? "+" : "-"}${Math.abs(delta)}%`,
        tone: delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral",
    };
}

// Voice Quizzes Metric Card

/**
 * Returns the voice quiz count.
 * Pass a plain number (from live-data API) for accurate DB-only count.
 * Falls back to filtering session array if a number is not provided.
 */
export function getVoiceQuizzes(countOrSessions) {
    if (typeof countOrSessions === 'number') return countOrSessions;
    if (!Array.isArray(countOrSessions)) return 0;
    // Scope to inQuizzo only so mock sessions for other modules don't inflate the count
    return countOrSessions.filter(s => s.isVoiceQuiz && s.module === 'inQuizzo').length;
}

/**
 * Badge helper — accepts either plain number counts (preferred, from API)
 * or session arrays as fallback.
 */
export function getVoiceQuizzesBadge(currentCountOrSessions, previousCountOrSessions, range) {
    const currentCount = typeof currentCountOrSessions === 'number'
        ? currentCountOrSessions
        : Array.isArray(currentCountOrSessions)
            ? currentCountOrSessions.filter(s => s.isVoiceQuiz && s.module === 'inQuizzo').length
            : 0;

    const previousCount = typeof previousCountOrSessions === 'number'
        ? previousCountOrSessions
        : Array.isArray(previousCountOrSessions)
            ? previousCountOrSessions.filter(s => s.isVoiceQuiz && s.module === 'inQuizzo').length
            : 0;

    const diff = currentCount - previousCount;
    const label = range === "today" ? "vs yesterday" : "vs last period";

    return {
        text: `${diff >= 0 ? "+" : ""}${diff} ${label}`,
        tone: diff >= 0 ? 'positive' : 'negative'
    };
}

// Current Streak Metric Card

export function getCurrentStreak(sessions) {
    // 1. Safety Check: If sessions isn't an array, return 0
    if (!Array.isArray(sessions) || sessions.length === 0) return 0;

    // 2. Use the REAL today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Extract unique dates
    const uniqueDates = [
        ...new Set(sessions.map(session => session.date)),
    ].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let currentDate = new Date(today);

    // 4. Logic to check consecutive days
    for (const dateStr of uniqueDates) {
        const sessionDate = new Date(dateStr);
        sessionDate.setHours(0, 0, 0, 0);

        if (sessionDate.getTime() === currentDate.getTime()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (sessionDate.getTime() > currentDate.getTime()) {
            // Skip future dates if any exist in mock data
            continue;
        } else {
            // Gap found, streak ends
            break;
        }
    }

    return streak;
}

export function getCurrentStreakBadge(streak) {
    if (streak === 0) return { text: "Start Today", tone: "positive" };
    if (streak <= 3) return { text: "Good start, Keep Going!", tone: "positive" };
    if (streak <= 7) return { text: "Keep it up!", tone: "positive" };

    return { text: "On Fire 🔥", tone: "positive" };
}