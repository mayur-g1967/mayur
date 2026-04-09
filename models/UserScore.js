import mongoose from "mongoose";

const userScoreSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  score: { type: Number, default: 0 },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const UserScore = mongoose.models.UserScore || mongoose.model("UserScore", userScoreSchema);
export default UserScore;
