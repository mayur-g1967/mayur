import connectDB from '@/lib/db';
import ChatSession from '@/models/chatSession.model';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

// Get user-specific chat history sessions
export async function GET(req) {
    try {
        await connectDB();

        // Authenticate user
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user's active sessions and sort by recent
        console.log(`[History API] Fetching sessions for userId: ${user._id}`);
        const sessions = await ChatSession.find({
            userId: user._id,
            isDeleted: { $ne: true }
        }).sort({ updatedAt: -1 });

        console.log(`Found ${sessions.length} active sessions for user ${user._id}`);

        return NextResponse.json({ success: true, data: sessions }, { status: 200 });
    } catch (error) {
        console.error('History GET Error:', error);
        const status = error.message === 'No token provided' || error.message === 'Authentication failed' ? 401 : 500;
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch history' },
            { status }
        );
    }
}

// Create or update a session
export async function POST(req) {
    try {
        await connectDB();

        // Authenticate user
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId, messages, title } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
        }

        // Logic to build a dynamic title if one isn't provided (usually from the first user message)
        let generatedTitle = title;
        if (!generatedTitle && messages && messages.length > 1) {
            // Find the first message from the user
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg && firstUserMsg.text) {
                // Slice the first few words for the title
                generatedTitle = firstUserMsg.text.split(' ').slice(0, 5).join(' ') + '...';
            }
        }

        if (!generatedTitle) {
            generatedTitle = 'New Conversation';
        }

        // Upsert the chat session with userId - ensure we only update OUR own session
        const session = await ChatSession.findOneAndUpdate(
            { sessionId, userId: user._id },
            {
                $set: {
                    title: generatedTitle,
                    messages: messages,
                    updatedAt: Date.now()
                }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: session }, { status: 200 });

    } catch (error) {
        console.error('History POST Error:', error);
        const status = error.message === 'No token provided' || error.message === 'Authentication failed' ? 401 : 500;
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update history' },
            { status }
        );
    }
}

// Soft delete a session
export async function DELETE(req) {
    try {
        await connectDB();

        // Authenticate user
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
        }

        // Soft delete: mark as isDeleted instead of physical removal
        const session = await ChatSession.findOneAndUpdate(
            { sessionId, userId: user._id },
            { $set: { isDeleted: true } },
            { new: true }
        );

        if (!session) {
            return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Session deleted' }, { status: 200 });

    } catch (error) {
        console.error('History DELETE Error:', error);
        const status = error.message === 'No token provided' || error.message === 'Authentication failed' ? 401 : 500;
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete history' },
            { status }
        );
    }
}
