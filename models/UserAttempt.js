// import mongoose from "mongoose";

// const userAttemptSchema = new mongoose.Schema({
//   username: { type: String, required: true },
//   question: String,
//   userAnswer: String,
//   correctAnswer: String,
//   similarity: Number,
//   score: Number,
//   timestamp: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const UserAttempt = mongoose.model("UserAttempt", userAttemptSchema);
// export default UserAttempt;

// models/UserAttempt.js
import mongoose from "mongoose";

const userAttemptSchema = new mongoose.Schema({
  // Module identifier (e.g. "inQuizzo")
  moduleId: {
    type: String,
    default: 'inQuizzo'
  },

  // Link to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },

  // Game Session Info
  sessionId: {
    type: String,
    required: true
  },
  gameType: {
    type: String,
    enum: ['quiz', 'mcq', 'voice', 'chat'],
    default: 'quiz'
  },

  // Question Details
  questionId: String,
  question: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['text', 'voice', 'multiple-choice'],
    default: 'text'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },

  // Answer Details
  userAnswer: {
    type: String,
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },

  // AI Analysis
  similarity: {
    type: Number,
    min: 0,
    max: 100
  },
  aiAnalysis: {
    reasoning: String,
    confidence: Number,
    suggestions: [String]
  },

  // Scoring
  score: {
    type: Number,
    default: 0
  },
  maxPossibleScore: {
    type: Number,
    default: 10
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0
  },

  // Voice Specific (if applicable)
  voiceData: {
    audioUrl: String,
    transcription: String,
    confidence: Number,
    language: String
  },

  // Metadata
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Index for better query performance
userAttemptSchema.index({ userId: 1, moduleId: 1, timestamp: -1 });
userAttemptSchema.index({ userId: 1, timestamp: -1 });
userAttemptSchema.index({ sessionId: 1 });

// Virtual for score percentage
userAttemptSchema.virtual('scorePercentage').get(function () {
  if (this.maxPossibleScore === 0) return 0;
  return Math.round((this.score / this.maxPossibleScore) * 100);
});

// Static method to get user's game history
userAttemptSchema.statics.getUserHistory = function (userId, limit = 10) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'username email gameStats');
};

// Static method to get session attempts
userAttemptSchema.statics.getSessionAttempts = function (sessionId) {
  return this.find({ sessionId })
    .sort({ timestamp: 1 });
};

userAttemptSchema.set('toJSON', { virtuals: true });

const UserAttempt = mongoose.models.UserAttempt || mongoose.model("UserAttempt", userAttemptSchema);
export default UserAttempt;