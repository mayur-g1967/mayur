// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.fromGoogle; // Password not required for Google users
    },
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },

  seenQuestions: {
    type: [String],
    default: [],
  },
  // Google OAuth fields
  googleId: {
    type: String,
  },
  fromGoogle: {
    type: Boolean,
    default: false,
  },
  picture: {
    type: String,
    default: "",
  },

  // Game statistics
  gameStats: {
    totalScore: {
      type: Number,
      default: 0,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    highestScore: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    lastGameDate: {
      type: Date,
      default: null,
    },
  },

  // Micro-Learning stats
  microLearningStats: {
    lessonsCompleted: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    lastLessonDate: { type: Date, default: null },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
  },

  // Social Mentor stats
  mentorStats: {
    sessionsAttended: { type: Number, default: 0 },
    scenariosCompleted: { type: Number, default: 0 },
    lastSessionDate: { type: Date, default: null },
    averageConfidenceScore: { type: Number, default: 0 },
  },

  // Confidence Coach stats
  confidenceCoachStats: {
    sessionsCompleted: { type: Number, default: 0 },
    voiceTrainingMinutes: { type: Number, default: 0 },
    lastSessionDate: { type: Date, default: null },
    averageScore: { type: Number, default: 0 },
  },

  // Profile information
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String,
  },

  // Account status
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  // Login tracking
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  loginCount: {
    type: Number,
    default: 0,
  },

  // Password reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  resetOTP: { type: String },
  resetOTPExpiry: { type: Date },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// ✅ Virtual for accuracy calculation
userSchema.virtual("accuracy").get(function () {
  if (this.gameStats.totalQuestions === 0) return 0;
  return Math.round(
    (this.gameStats.correctAnswers / this.gameStats.totalQuestions) * 100,
  );
});

// ✅ Pre-save middleware for password hashing
userSchema.pre("save", async function () {
  // Update timestamp
  this.updatedAt = new Date();

  // Hash password if it's modified and not from Google
  if (!this.isModified("password") || this.fromGoogle) return;

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// ✅ Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (this.fromGoogle) return false; // Google users don't have passwords
  return await bcrypt.compare(candidatePassword, this.password);
};

// ✅ Method to update game statistics
userSchema.methods.updateGameStats = async function (scoreEarned, isCorrect) {
  console.log(`🎮 Updating game stats for ${this.username}:`);
  console.log(`   Score earned: ${scoreEarned}`);
  console.log(`   Is correct: ${isCorrect}`);
  console.log(`   Before update:`, this.gameStats);

  try {
    // Update basic stats
    this.gameStats.totalScore += scoreEarned;
    this.gameStats.gamesPlayed += 1;
    this.gameStats.totalQuestions += 1;

    if (isCorrect) {
      this.gameStats.correctAnswers += 1;
    }

    // Update highest score if this game's score is higher
    if (scoreEarned > this.gameStats.highestScore) {
      this.gameStats.highestScore = scoreEarned;
    }

    // Calculate average score
    this.gameStats.averageScore = Math.round(
      this.gameStats.totalScore / this.gameStats.gamesPlayed,
    );

    // Update last game date
    this.gameStats.lastGameDate = new Date();

    // Save the updated user
    await this.save();

    console.log(`✅ Game stats updated successfully:`);
    console.log(`   New total score: ${this.gameStats.totalScore}`);
    console.log(`   Games played: ${this.gameStats.gamesPlayed}`);
    console.log(`   Accuracy: ${this.accuracy}%`);

    return this.gameStats;
  } catch (error) {
    console.error(`❌ Error updating game stats for ${this.username}:`, error);
    throw error;
  }
};

// ✅ Method to get user's rank
userSchema.methods.getUserRank = async function () {
  const User = this.constructor;
  const usersWithHigherScores = await User.countDocuments({
    "gameStats.totalScore": { $gt: this.gameStats.totalScore },
  });
  return usersWithHigherScores + 1;
};

// ✅ Static method to get leaderboard
userSchema.statics.getLeaderboard = async function (limit = 10) {
  return this.find({ "gameStats.gamesPlayed": { $gt: 0 } })
    .select("username firstName lastName gameStats profile.avatar")
    .sort({ "gameStats.totalScore": -1 })
    .limit(limit);
};

// ✅ Generate auth token
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { userId: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
  return token;
};

// ✅ Ensure virtual fields are included in JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// ✅ Create indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ "gameStats.totalScore": -1 });
userSchema.index({ "gameStats.gamesPlayed": -1 });

// ✅ IMPORTANT: This makes User model use the same database as Reminder
// Since db.js connects to "User" database by default, this will work automatically
const User = mongoose.models.User || mongoose.model("User", userSchema);

export { User };
export default User;
