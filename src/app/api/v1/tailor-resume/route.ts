import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.KIMI_API_KEY! });

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { jobDescription, tone = "confident" } = await req.json();

  // Fetch profile & experiences
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .single();
  const { data: experiences } = await supabase.from("experiences").select("*");

  const prompt = `
You are an expert resume writer.
Given profile: ${JSON.stringify({ ...profile, experiences })}
and job description: ${JSON.stringify(jobDescription)}
generate a one-page resume JSON:
{ "basics": {...}, "work": [...], "skills": [...] }
Use ${tone} tone, quantify achievements, include only relevant items.
`;

  const completion = await openai.chat.completions.create({
    model: "moonshot-v1-8k",
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const resumeJson = JSON.parse(completion.choices[0].message.content!);
  const atsScore = Math.round(
    (resumeJson.skills?.length / jobDescription.required_skills.length) * 100
  );

  // Save
  const { data } = await supabase
    .from("tailored_resumes")
    .insert({
      profile_id: user.id,
      resume_jsonb: resumeJson,
      ats_score: atsScore,
    })
    .select()
    .single();

  return Response.json({ id: data.id, resume: resumeJson, atsScore });
}
