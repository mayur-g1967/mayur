import connectDB from '@/lib/db';
import ChatSession from '@/models/chatSession.model';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

// Toggle archive status of a session
export async function PATCH(req) {
    try {
        await connectDB();

        // Authenticate user
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId, isArchived } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
        }

        const session = await ChatSession.findOneAndUpdate(
            { sessionId, userId: user._id },
            { $set: { isArchived: isArchived } },
            { new: true }
        );

        if (!session) {
            return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: session }, { status: 200 });

    } catch (error) {
        console.error('History Archive PATCH Error:', error);
        const status = error.message === 'No token provided' || error.message === 'Authentication failed' ? 401 : 500;
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update archive status' },
            { status }
        );
    }
}
