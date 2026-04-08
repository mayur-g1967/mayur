import mongoose from "mongoose";

const fallbackQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: String,
        required: true,
        enum: ["easy", "medium", "hard"],
        index: true
    }
}, {
    timestamps: true
});

// Create index for random selection performance
fallbackQuestionSchema.index({ difficulty: 1, _id: 1 });

const FallbackQuestion = mongoose.models.FallbackQuestion || mongoose.model("FallbackQuestion", fallbackQuestionSchema);

export default FallbackQuestion;
