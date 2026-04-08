import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import connectDB from '@/lib/db';
import ActiveQuizSession from '@/models/ActiveQuizSession';

export async function GET(req) {
    try {
        await connectDB();
        const user = await authenticate(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const session = await ActiveQuizSession
            .findOne({ userId: user._id, moduleId: 'microLearning' })
            .lean();
        return NextResponse.json({ session });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectDB();
        const user = await authenticate(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { sessionId, gameType, title, questions, questionsAnswered, quizState } = await req.json();

        // Find existing session for this user (one per user)
        let session = await ActiveQuizSession.findOne({ userId: user._id });

        if (session) {
            // Check if videoId changed – if so, clear stale questions
            const currentVideoId = session.quizState?.videoId;
            const newVideoId = quizState?.videoId;
            if (newVideoId && currentVideoId && newVideoId !== currentVideoId) {
                session.questions = [];
                session.questionsAnswered = 0;
            }

            // Update existing
            session.moduleId = 'microLearning';
            session.sessionId = sessionId || session.sessionId;
            if (gameType) session.gameType = gameType;
            if (title !== undefined) session.title = title;
            if (questions) session.questions = questions;
            if (questionsAnswered !== undefined) session.questionsAnswered = questionsAnswered;
            if (quizState !== undefined) session.quizState = quizState;
            session.lastUpdated = new Date();
            await session.save();
        } else {
            // Create new
            session = new ActiveQuizSession({
                userId: user._id,
                sessionId: sessionId || `ml_${Date.now()}`,
                moduleId: 'microLearning',
                gameType: gameType || 'mcq',
                title: title || '',
                questions: questions || [],
                questionsAnswered: questionsAnswered || 0,
                quizState: quizState || {},
                lastUpdated: new Date(),
            });
            await session.save();
        }

        return NextResponse.json({ ok: true, sessionId: session.sessionId });
    } catch (error) {
        console.error('[ActiveSession POST error]', error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await connectDB();
        const user = await authenticate(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await ActiveQuizSession.deleteOne({ userId: user._id });
        return NextResponse.json({ message: 'Session deleted' });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
