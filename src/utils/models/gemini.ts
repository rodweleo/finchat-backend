
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

export const generateAIContent = async (prompt: string) => {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text()
}