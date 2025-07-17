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

  const {
    jobDescription,
    resumeId = null,
    tone = "professional",
  } = await req.json();

  // Fetch resume if resumeId is provided
  let profileSource;
  if (resumeId) {
    const { data: resumeData, error } = await supabase
      .from("tailored_resumes")
      .select("resume_jsonb")
      .eq("id", resumeId)
      .single();

    if (error || !resumeData) {
      return new Response("Resume not found", { status: 404 });
    }

    profileSource = resumeData.resume_jsonb;
  } else {
    // Fall back to general profile + experiences
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .single();
    const { data: experiences } = await supabase
      .from("experiences")
      .select("*");

    profileSource = { ...profile, experiences };
  }

  // Prompt: Expert-level instruction for crafting a high-quality cover letter
  const prompt = `
You are a world-class communications expert and career strategist with a proven record of writing high-impact, ATS-optimized cover letters for professionals across industries.

Craft a compelling, personalized cover letter tailored to the following job description:
${JSON.stringify(jobDescription)}

Use the following candidate profile or resume data:
${JSON.stringify(profileSource)}

Guidelines:
- The tone should be ${tone} and confident.
- Start with a captivating opening that immediately connects the candidate to the role or company’s mission.
- Highlight the most relevant achievements and experiences that align with the role, using numbers or impact when possible.
- Showcase personality, values, or unique value propositions without sounding generic.
- End with a clear and engaging call to action.

Return only the final cover letter text (no markdown, no formatting, no preambles). Assume it's being sent directly to a hiring manager.

Make it feel like it was written by a top-tier communicator who understands both career strategy and business needs.
`;

  const completion = await openai.chat.completions.create({
    model: "moonshot-v1-8k",
    messages: [{ role: "user", content: prompt }],
  });

  const coverLetter = completion.choices[0].message.content?.trim();

  if (!coverLetter) {
    return new Response("Failed to generate cover letter", { status: 500 });
  }

  // Save generated letter
  const { data: saved } = await supabase
    .from("generated_cover_letters")
    .insert({
      profile_id: user.id,
      resume_id: resumeId,
      job_description: jobDescription,
      cover_letter_text: coverLetter,
    })
    .select()
    .single();

  return Response.json({ id: saved.id, coverLetter });
}

