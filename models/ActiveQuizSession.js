import mongoose from 'mongoose';

const activeQuizSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Only one active session per user at a time
    },
    sessionId: {
        type: String,
        required: true
    },
    moduleId: {
        type: String,
        default: 'inQuizzo'
    },
    // Human-readable title for the dashboard (e.g. video title)
    title: {
        type: String,
        default: ''
    },
    gameType: {
        type: String,
        enum: ['quiz', 'mcq', 'voice'],
        required: true
    },
    // Store the configuration (topic, domain, etc.)
    config: {
        domain: String,
        category: String,
        subCategory: String,
        topic: String,
        difficulty: String,
        level: Number
    },
    // Progress tracking
    questionsAnswered: {
        type: Number,
        default: 0
    },
    correctCount: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        default: 0
    },
    // Store the current set of questions fetched
    questions: [{
        question: String,
        correctAnswer: String,
        options: [String], // for MCQ
        id: String
    }],
    // Chat history for voice/quiz modes
    chatHistory: [{
        role: { type: String, enum: ['system', 'user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now }
    }],
    // Flexible state map for frontend needs (e.g. selected answers, currentIndex)
    quizState: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Auto-delete sessions older than 24 hours
activeQuizSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

const ActiveQuizSession = mongoose.models.ActiveQuizSession || mongoose.model('ActiveQuizSession', activeQuizSessionSchema);
export default ActiveQuizSession;
