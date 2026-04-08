import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import FallbackQuestion from "./models/FallbackQuestion.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

async function verify() {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "User" });
    console.log("✅ Connected to DB");

    const counts = {
        easy: await FallbackQuestion.countDocuments({ difficulty: "easy" }),
        medium: await FallbackQuestion.countDocuments({ difficulty: "medium" }),
        hard: await FallbackQuestion.countDocuments({ difficulty: "hard" }),
    };

    console.log("\n📊 Fallback Question Counts:");
    console.log(`🟢 Easy:   ${counts.easy}/500`);
    console.log(`🟡 Medium: ${counts.medium}/500`);
    console.log(`🔴 Hard:   ${counts.hard}/500`);

    if (counts.easy > 0) {
        const [sample] = await FallbackQuestion.aggregate([{ $match: { difficulty: "easy" } }, { $sample: { size: 1 } }]);
        console.log("\n🎲 Random Easy Sample:", sample.question);
    }

    process.exit(0);
}

verify();
