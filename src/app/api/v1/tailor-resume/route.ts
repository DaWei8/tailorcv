import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.KIMI_API_KEY!,
  baseURL: "https://api.moonshot.cn/v1",
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.jobDescription) {
      return NextResponse.json(
        { error: "Invalid or missing job description" },
        { status: 400 }
      );
    }

    const { jobDescription } = body;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: experiences, error: experienceError } = await supabase
      .from("experiences")
      .select("*")
      .eq("profile_id", user.id);

    if (profileError || experienceError) {
      return NextResponse.json(
        { error: "Failed to fetch user profile or experiences" },
        { status: 500 }
      );
    }

    const prompt = `
You are a professional resume writer. The best there is.
Given this user profile: ${JSON.stringify({ ...profile, experiences }, null, 2)}
And this job description: ${JSON.stringify(jobDescription, null, 2)}
Generate a tailored resume JSON with the following structure with reference to the profile and job description:
{
  "name": "Full Name",
  "email": "Email Address",
  "phone": "Phone Number (if available)",
  "location": "City, Country (if available)",
  "summary": "Tailored professional summary",
  "skills": ["Relevant skills as presented in the profile"],
  "languages": ["Languages spoken (if applicable) from profile"],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year obtained"
    }
  ],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "duration": "Employment duration",
      "location": "City, Country (if available)",
      "responsibilities": ["Key responsibilities and achievements"]
    }
  ],
  "education": [
    {
      "degree": "Degree title",
      "institution": "University or school",
      "location": "City, Country",
      "year": "Graduation year"
    }
  ],
  "projects": [
    {
      "title": "Project title",
      "description": "Brief description of the project",
      "technologies": ["Tech used"],
      "outcome": "Result or impact (if any)"
    }
  ],
  "links": {
    "linkedin": "LinkedIn profile URL (if available)",
    "portfolio": "Portfolio or personal site (if any)",
    "github": "GitHub profile (if applicable)"
  }
}
Use a professional tone. Prioritize relevance, match job keywords, use strong action verbs, and quantify achievements where possible.
Respond ONLY with a valid JSON object.
`;

    const completion = await openai.chat.completions.create({
      model: "moonshot-v1-8k",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a professional resume writer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const messageContent = completion.choices[0]?.message?.content;
    if (!messageContent) {
      return NextResponse.json(
        { error: "No response from language model" },
        { status: 500 }
      );
    }

    let resumeJson;
    try {
      resumeJson = JSON.parse(messageContent);
    } catch (err) {
      console.error("Parsing error:", err);
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    const atsScore = Math.round(
      (resumeJson.skills?.length / jobDescription.required_skills.length) * 100
    );

    const { data: tailoredResume, error: saveError } = await supabase
      .from("tailored_resumes")
      .insert({
        profile_id: user.id,
        resume_jsonb: resumeJson,
        ats_score: atsScore,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      return NextResponse.json(
        { error: "Failed to save tailored resume" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resume: resumeJson,
      atsScore,
      id: tailoredResume.id,
    });
  } catch (err) {
    console.error("Tailoring error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}