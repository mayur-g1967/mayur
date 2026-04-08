// app/api/inquizzo/session-results/route.js
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import connectDB from '@/lib/db';
import UserAttempt from '@/models/UserAttempt';

export async function GET(req) {
    try {
        await connectDB();
        const user = await authenticate(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ message: 'Session ID required' }, { status: 400 });
        }

        const attempts = await UserAttempt.find({ sessionId, userId: user._id });

        if (!attempts || attempts.length === 0) {
            return NextResponse.json({ message: 'Session not found' }, { status: 404 });
        }

        const totalQuestions = attempts.length;
        const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
        const correctCount = attempts.filter(a => a.isCorrect).length;

        return NextResponse.json({
            sessionId,
            totalQuestions,
            totalScore,
            correctCount,
            timestamp: attempts[0].timestamp
        });

    } catch (err) {
        console.error('session-results error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
