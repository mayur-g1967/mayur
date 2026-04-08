const { getGroqChain, runGroqAction } = require("./lib/ai-handler");

// mock
const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const keys = ["req", "sub1", "sub2"];

async function runTest() {
    let attemptCount = 0;
    try {
        await runGroqAction(async (groq, model) => {
            attemptCount++;
            console.log(`Called with model: ${model}`);
            const error = new Error(`Rate limit reached for model ${model}`);
            error.status = 429;
            throw error;
        });
    } catch (e) {
        console.log("FINAL ERROR:", e.message);
    }
}
runTest();
