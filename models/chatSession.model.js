import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    id: String,
    role: String,
    text: String,
    timestamp: Date,
});

const chatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    sessionId: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        default: 'New Conversation',
    },
    messages: [messageSchema],
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    isArchived: {
        type: Boolean,
        default: false,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
