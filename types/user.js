// types/user.js
// Canonical user schema for PersonaAI — used across dashboard + all modules
// Uses JSDoc for type hints without requiring TypeScript
// Module keys match ActivityChart.jsx convention exactly

/**
 * @typedef {"confidenceCoach" | "socialMentor" | "microLearning" | "inQuizzo"} ModuleId
 */

/**
 * @typedef {{ id: ModuleId, label: string, description: string, color: string, icon: string }} ModuleMeta
 */

/** @type {Record<ModuleId, ModuleMeta>} */
export const MODULES = {
    confidenceCoach: {
        id: "confidenceCoach",
        label: "Confidence Coach",
        description: "Speaking & presentation practice",
        color: "var(--chart-1)",
        icon: "Mic2",
    },
    socialMentor: {
        id: "socialMentor",
        label: "Social Mentor",
        description: "Social skills & conversation training",
        color: "var(--chart-2)",
        icon: "Users2",
    },
    microLearning: {
        id: "microLearning",
        label: "Micro‑Learning",
        description: "Bite-sized daily lessons",
        color: "var(--chart-3)",
        icon: "BookOpen",
    },
    inQuizzo: {
        id: "inQuizzo",
        label: "InQuizzo",
        description: "Quiz-based knowledge challenges",
        color: "var(--chart-4)",
        icon: "Zap",
    },
};

/**
 * @typedef {{
 *   id: string,
 *   moduleId: ModuleId,
 *   startedAt: string,
 *   durationMinutes: number,
 *   completed: boolean,
 *   score?: number,
 *   xpEarned: number
 * }} Session
 */

/**
 * @typedef {{
 *   date: string,
 *   day: "Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat"|"Sun",
 *   totalMinutes: number,
 *   sessionCount: number,
 *   byModule: Partial<Record<ModuleId, number>>
 * }} DailyActivity
 */

/**
 * @typedef {{
 *   current: number,
 *   longest: number,
 *   lastActiveDate: string
 * }} Streak
 */

/**
 * @typedef {{
 *   moduleId: ModuleId,
 *   totalSessions: number,
 *   totalMinutes: number,
 *   averageScore?: number,
 *   completionRate: number,
 *   lastSessionAt?: string,
 *   weekSessions: number,
 *   weekMinutes: number,
 *   level: number,
 *   xp: number,
 *   xpToNextLevel: number
 * }} ModuleProgress
 */

/**
 * @typedef {{
 *   pattern: string,
 *   snapshot: string[],
 *   suggestion: string,
 *   suggestionModule: string | null,
 *   suggestionRoute: string | null
 * }} Insights
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   email: string,
 *   avatarUrl?: string,
 *   joinedAt: string,
 *   timezone: string,
 *   totalXp: number,
 *   globalLevel: number
 * }} UserProfile
 */

/**
 * @typedef {{
 *   profile: UserProfile,
 *   streak: Streak,
 *   recentSessions: Session[],
 *   dailyActivity: DailyActivity[],
 *   moduleProgress: ModuleProgress[],
 *   insights: Insights
 * }} UserDashboardData
 */