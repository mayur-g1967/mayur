// app/api/dashboard/module-progress/route.js
// Returns live Inquizzo progress metrics for the main dashboard's Module Progress Section.

import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import connectDB from '@/lib/db';
import UserAttempt from '@/models/UserAttempt';
import mongoose from 'mongoose';

export async function GET(req) {
    try {
        await connectDB();
        const user = await authenticate(req);

        if (!user) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        const userId = new mongoose.Types.ObjectId(user._id);

        // All-time InQuizzo aggregation (no date filter — we want lifetime progress)
        const [result] = await UserAttempt.aggregate([
            { $match: { userId, moduleId: 'inQuizzo' } },
            {
                $group: {
                    _id: '$sessionId',
                    sessionCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
                    sessionCount: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: null,
                    totalQuestions: { $sum: '$sessionCount' },
                    totalCorrect: { $sum: '$sessionCorrect' },
                    totalSessions: { $sum: 1 },
                },
            },
        ]);

        const totalQuestions = result?.totalQuestions ?? 0;
        const totalCorrect = result?.totalCorrect ?? 0;
        const totalSessions = result?.totalSessions ?? 0;

        // Scale progress values (0–100)
        const accuracyProgress = totalQuestions > 0
            ? Math.round((totalCorrect / totalQuestions) * 100)
            : 0;

        // 200 questions  → 100 %  (cap at 100)
        const questionsProgress = Math.min(100, Math.round((totalQuestions / 200) * 100));

        // 20 sessions → 100 % (cap at 100)
        const sessionsProgress = Math.min(100, Math.round((totalSessions / 20) * 100));

        return NextResponse.json({
            inquizzo: {
                accuracyProgress,
                questionsProgress,
                sessionsProgress,
                totalQuestions,
                totalCorrect,
                totalSessions,
            },
        });
    } catch (error) {
        console.error('module-progress error:', error);
        return NextResponse.json(
            { message: error.message || 'Failed to fetch module progress' },
            { status: error.message === 'No token provided' ? 401 : 500 }
        );
    }
}
