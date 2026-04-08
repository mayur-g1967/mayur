import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
    try {
        const body = await req.json();
        const { scenarioType, difficulty = "Beginner", previousQuestions = [] } = body;

        if (!scenarioType) {
            return NextResponse.json({ success: false, error: 'scenarioType is required' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let difficultyModifiers = "";
        if (difficulty === "Beginner") {
            difficultyModifiers = "Make it simple, common, and straightforward.";
        } else if (difficulty === "Intermediate") {
            difficultyModifiers = "Make it slightly challenging and require some thought.";
        } else if (difficulty === "Expert") {
            difficultyModifiers = "Make it highly complex, aggressive, tricky, or niche to simulate intense pressure.";
        }

        let antiRepetition = "";
        if (Array.isArray(previousQuestions) && previousQuestions.length > 0) {
            antiRepetition = `\n\nCRITICAL: DO NOT generate any of the following questions or anything extremely similar: ${previousQuestions.join(' | ')}`;
        }

        const prompt = `Generate exactly one realistic practice question for a "${scenarioType}" scenario, to be spoken aloud by the user. ${difficultyModifiers} Return ONLY the plain text string of the question. No markdown, no prefixes, no quotation marks.${antiRepetition}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        return NextResponse.json({ success: true, question: text });
    } catch (error) {
        console.error('Error generating AI question:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error while generating question.' },
            { status: 500 }
        );
    }
}
