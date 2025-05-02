// ift3150/app/api/ai/chatbot/route.ts

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, category, history } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { answer: "Requête invalide : texte manquant", type: "error" },
        { status: 400 },
      );
    }

    const FASTAPI_URL =
      process.env.FASTAPI_URL ?? "https://ift3150-psi.vercel.app/";

    const res = await fetch(`${FASTAPI_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        category,
        conversation_history: history,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { answer: "Erreur du service IA", type: "error" },
        { status: 502 },
      );
    }

    const data = await res.json();

    const formatted = {
      answer: data.response,
      professional: data.professional || "none",
      severity: data.severity ?? 1,
      type:
        data.type === "salutation" || data.type === "greeting"
          ? "greeting"
          : data.type === "generaliste"
            ? "generalist"
            : (data.severity ?? 0) >= 4
              ? "emergency"
              : "problem",
    };

    return NextResponse.json(formatted);
  } catch (err) {
    return NextResponse.json(
      {
        answer: "Service temporairement indisponible.",
        professional: "général",
        type: "error",
      },
      { status: 500 },
    );
  }
}
