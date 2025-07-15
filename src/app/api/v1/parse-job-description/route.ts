import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.KIMI_API_KEY! });

const prompt = `Return ONLY valid JSON:
{ "title": string, "required_skills": string[], "responsibilities": string[], "nice_to_have": string[] }`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rawText } = body;

  const completion = await openai.chat.completions.create({
    model: "moonshot-v1-8k",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: rawText },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content!);
  return NextResponse.json(parsed);
}