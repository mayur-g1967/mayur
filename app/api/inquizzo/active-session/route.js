import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import connectDB from '@/lib/db';
import ActiveQuizSession from '@/models/ActiveQuizSession';

export async function GET(req) {
    try {
        await connectDB();
        const user = await authenticate(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const session = await ActiveQuizSession.findOne({ userId: user._id });
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

        const data = await req.json();

        // Upsert the session for the user
        const session = await ActiveQuizSession.findOneAndUpdate(
            { userId: user._id },
            {
                ...data,
                userId: user._id,
                lastUpdated: new Date()
            },
            { upsert: true, new: true, runValidators: true }
        );

        return NextResponse.json({ session });
    } catch (error) {
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
