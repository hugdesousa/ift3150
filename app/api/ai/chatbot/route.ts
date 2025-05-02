// app/api/ai/chatbot/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { text, history = [] } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { answer: "Texte manquant", type: "error" },
      { status: 400 },
    );
  }

  try {
    const model = genai.getGenerativeModel({ model: "gemini-pro" });
    const res = await model.generateContent(text, {
      history: history.map((m: any) => ({ role: m.role, parts: [m.text] })),
    });
    return NextResponse.json({
      answer: res.response.text(),
      type: "generalist",
    });
  } catch (e) {
    return NextResponse.json(
      { answer: "Gemini indisponible", type: "error" },
      { status: 502 },
    );
  }
}
