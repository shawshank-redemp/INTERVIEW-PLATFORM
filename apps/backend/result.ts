import { z } from "zod/v3";
import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!});

const outputSchema = z.object({
    score: z.number().int().min(0).max(10).describe("Overall score out of 10"),
    summary: z.string().describe("One concise sentence summarizing overall performance"),
    categories: z
        .object({
            technicalKnowledge: z.number().int().min(0).max(10),
            projectUnderstanding: z.number().int().min(0).max(10),
            problemSolving: z.number().int().min(0).max(10),
            communication: z.number().int().min(0).max(10),
            confidence: z.number().int().min(0).max(10),
        })
        .describe("Category scores out of 10"),
    strengths: z.array(z.string()).min(1).max(5).describe("Specific, concrete strengths observed"),
    areasForImprovement: z
        .array(z.string())
        .min(1)
        .max(5)
        .describe("Specific, actionable areas to improve"),
    learningRecommendations: z
        .array(z.string())
        .min(1)
        .max(6)
        .describe("Specific topics/technologies worth studying, based on gaps observed"),
    feedbackSections: z.object({
        technicalFeedback: z.string().describe("Paragraph on technical depth and accuracy"),
        communicationFeedback: z.string().describe("Paragraph on clarity and communication style"),
        overallVerdict: z.string().describe("Closing overall verdict paragraph"),
    }),
});

const RESULT_PROMPT = `
    You are an expert technical interviewer producing a structured post-interview evaluation report.

    Evaluate the candidate based only on the conversation transcript below. Do not fabricate
    details, projects, or technologies not present in the transcript.

    Return ONLY a JSON object with this exact shape:
    {
        "score": number (0-10, overall),
        "summary": string (one concise sentence summarizing performance),
        "categories": {
            "technicalKnowledge": number (0-10),
            "projectUnderstanding": number (0-10),
            "problemSolving": number (0-10),
            "communication": number (0-10),
            "confidence": number (0-10)
        },
        "strengths": string[] (1-5 specific, concrete strengths),
        "areasForImprovement": string[] (1-5 specific, actionable improvement areas),
        "learningRecommendations": string[] (1-6 specific topics/technologies worth studying, based on gaps observed),
        "feedbackSections": {
            "technicalFeedback": string (paragraph on technical depth and accuracy),
            "communicationFeedback": string (paragraph on clarity and communication),
            "overallVerdict": string (closing overall verdict)
        }
    }

    DO NOT RETURN ANY OTHER TEXT.

    TRANSCRIPT:
    {{USER_TRANSCRIPT}}
`

// An interview that never really happened (e.g. the candidate said "Hi" and left)
// must never reach the model — it has nothing to evaluate and will fabricate feedback.
const MIN_SUBSTANTIVE_USER_MESSAGES = 2;
const MIN_TOTAL_USER_CHARACTERS = 60;
const MIN_MESSAGE_LENGTH_TO_COUNT = 8;

export function hasSufficientInterviewData(
    messages: { type: "Assistant" | "User"; message: string }[],
): boolean {
    const userMessages = messages.filter(
        (m) => m.type === "User" && m.message.trim().length > 0,
    );
    const substantiveMessages = userMessages.filter(
        (m) => m.message.trim().length >= MIN_MESSAGE_LENGTH_TO_COUNT,
    );
    const totalCharacters = userMessages.reduce(
        (sum, m) => sum + m.message.trim().length,
        0,
    );

    return (
        substantiveMessages.length >= MIN_SUBSTANTIVE_USER_MESSAGES &&
        totalCharacters >= MIN_TOTAL_USER_CHARACTERS
    );
}

export async function calculateResult(messages: {type: "Assistant" | "User", message: string, createdAt: Date}[]) {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: RESULT_PROMPT.replace(`{{USER_TRANSCRIPT}}`, JSON.stringify(messages)),
        config: {
    responseMimeType: "application/json",
responseSchema: zodToJsonSchema(outputSchema as any) ,
},
    });
    console.log(response.text!);
    const parsed = outputSchema.parse(JSON.parse(response.text!));

    // Keep the { score, feedback } wire contract unchanged — index.ts and the DB's
    // existing `feedback` column don't change; everything beyond score is JSON-encoded
    // into that single string field so no schema migration is needed.
    const { score, ...structuredFeedback } = parsed;
    return {
        score,
        feedback: JSON.stringify(structuredFeedback),
    };
}