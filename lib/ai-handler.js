import Groq from "groq-sdk";

// Global cache to remember rate-limited keys to instantly skip them
const rateLimitCache = new Map();

export function isKeyRateLimited(key, model) {
    const cacheKey = `${key}:${model}`;
    const limitUntil = rateLimitCache.get(cacheKey);
    if (!limitUntil) return false;

    if (Date.now() > limitUntil) {
        rateLimitCache.delete(cacheKey);
        return false;
    }
    return true; // Still rate limited!
}

export function markKeyRateLimited(key, model, errorMessage) {
    const cacheKey = `${key}:${model}`;
    let retryAfterSeconds = 60; // default 1 minute

    // Parse "Please try again in 43m14.592s"
    const match = errorMessage.match(/try again in (?:(\d+)h)?(.*?)?(?:(\d+)m)?(.*?)?(?:([\d.]+)s)?/i);
    if (match) {
        // More robust extraction just in case
        const timeStr = errorMessage.match(/try again in (.*?s)/i)?.[1] || "";
        let totalSeconds = 0;

        const hMatch = timeStr.match(/(\d+)h/i);
        const mMatch = timeStr.match(/(\d+)m/i);
        const sMatch = timeStr.match(/([\d.]+)s/i);

        if (hMatch) totalSeconds += parseInt(hMatch[1], 10) * 3600;
        if (mMatch) totalSeconds += parseInt(mMatch[1], 10) * 60;
        if (sMatch) totalSeconds += parseFloat(sMatch[1]);

        if (totalSeconds > 0) {
            retryAfterSeconds = totalSeconds;
        }
    }

    if (!retryAfterSeconds || retryAfterSeconds <= 0) {
        retryAfterSeconds = 60; // Safe ultimate fallback
    }

    console.log(`⏱️ Marking ${cacheKey} as RATE LIMITED for ${retryAfterSeconds} seconds.`);
    rateLimitCache.set(cacheKey, Date.now() + (retryAfterSeconds * 1000));
}

/**
 * Returns an array of available Groq API keys from the environment.
 */
export function getGroqChain() {
    return [
        process.env.GROQ_API_KEY_REGULAR,
        process.env.GROQ_API_KEY_SUB_1,
        process.env.GROQ_API_KEY_SUB_2,
        process.env.GROQ_API_KEY_SUB_3,
        process.env.GROQ_API_KEY_SUB_4,
        process.env.GROQ_API_KEY_SUB_5,
    ].filter(key => key && typeof key === "string" && key.length > 20 && !key.toLowerCase().includes("your"));
}

/**
 * Runs an async task with Groq, automatically falling back through the key chain if a rate limit is hit.
 * @param {Function} taskFn - The task to run, receives a groq instance. e.g. (groq) => groq.chat.completions.create(...)
 * @returns {Promise<any>}
 */
export async function runGroqAction(taskFn) {
    const keys = getGroqChain();
    const errors = [];
    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

    // We want to try the best model first across all keys.
    // If a key hits a rate limit (429), we immediately switch to the next key for the SAME model,
    // which is the fastest way to bypass a per-key rate limit.
    for (let m = 0; m < models.length; m++) {
        const model = models[m];

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i].trim();
            if (!key || key.includes(" ")) continue;

            if (isKeyRateLimited(key, model)) {
                // Instantly skip this key if we know it's currently exhausted
                continue;
            }

            const groq = new Groq({ apiKey: key, maxRetries: 0 });
            const keyLabel = i === 0 ? "Regular" : `Substitute ${i}`;

            try {
                // If it succeeds, return the result immediately
                return await taskFn(groq, model);
            } catch (error) {
                const status = error.status || error.response?.status;
                const message = error.message || "";

                const isRateLimit = status === 429 || message.toLowerCase().includes("rate limit");
                const isDecommissioned = status === 400 && message.toLowerCase().includes("decommissioned");
                const isAuthError = status === 401;

                const errorMsg = `[Groq ${keyLabel} | ${model}] failed: ${message}`;
                errors.push(errorMsg);

                if (isRateLimit) {
                    console.warn(`⚠️ ${errorMsg} -> Marking as Exhausted & Switching to NEXT KEY...`);
                    markKeyRateLimited(key, model, message);
                    continue;
                } else if (isAuthError) {
                    console.warn(`⚠️ ${errorMsg} -> Auth Error. Skipping key globally...`);
                    models.forEach(m => markKeyRateLimited(key, m, "try again in 24h")); // Skip invalid keys completely for all models
                    continue;
                } else if (isDecommissioned) {
                    console.warn(`⚠️ ${errorMsg} -> Model decommissioned. Switching to NEXT MODEL...`);
                    // Break the inner loop to skip remaining keys for this dead model
                    break;
                } else {
                    console.warn(`⚠️ ${errorMsg} -> Unknown error. Trying NEXT KEY...`);
                    // For other errors (500, etc), trying another key is safest
                    continue;
                }
            }
        }
    }

    throw new Error(`All Groq keys and models exhausted. Errors: ${errors.join(" | ")}`);
}
