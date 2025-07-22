import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { callGemini } from "@/components/callGemini";

// Define a more specific error type for API calls to avoid using `any`.
interface APIError extends Error {
  response?: {
    data?: unknown;
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient(); // ✅ await this

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_master", true)
    .single();

  const {
    jobDescription,
    resumeData = null, // Get resume data directly from client
    tone = "professional",
  } = await req.json();

  if (!jobDescription?.trim()) {
    return NextResponse.json(
      { error: "Job description is required" },
      { status: 400 }
    );
  }

  if (!resumeData) {
    return NextResponse.json(
      { error: "Resume data is required" },
      { status: 400 }
    );
  }

  // Use the resume data directly from the client
  const profileSource = resumeData.resume || resumeData; // Handle both nested and direct formats
  const resumeId = resumeData.id || null; // Extract resume ID if available

  // Validate that we have profile data
  if (!profileSource) {
    return NextResponse.json(
      { error: "No profile data found in resume" },
      { status: 404 }
    );
  }

  const prompt = `
You are a world-class communications expert and career strategist with a proven record of writing high-impact, ATS-optimized cover letters.

Craft a compelling, personalized cover letter tailored to the job description below:
${JSON.stringify(jobDescription)}

Based on this candidate's resume/profile data:
${JSON.stringify(profileSource)}

Tone: ${tone}

Guidelines:
- Start with a strong, personalized opening.
- Highlight the most relevant achievements with quantifiable results.
- Reflect personality and alignment with the role.
- End with a clear, confident call to action.
- Keep it concise (3-4 paragraphs).
- Make it sound natural and avoid overly generic language.

Return only the plain text of the final cover letter, no extra formatting or markdown.
`;

  try {
    const response = await callGemini(prompt.replace(/\s+/g, " ").trim())

    const coverLetter =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();


    if (!coverLetter) {
      console.error("Gemini returned no content:", response.data);
      return NextResponse.json(
        { error: "Gemini returned no content" },
        { status: 500 }
      );
    }
    
    // Save the cover letter to database
    const { data: saved, error: saveError } = await supabase
      .from("cover_letters")
      .insert({
        user_id: user.id,
        user_profile_id: profile.id,
        resume_id: resumeId, // Use the resume ID from the data
        letter_text: coverLetter,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving cover letter:", saveError);
      // Still return the cover letter even if saving fails
      return NextResponse.json({
        coverLetter,
        warning: "Cover letter generated but not saved to database",
      });
    }

    return NextResponse.json({
      id: saved?.id,
      coverLetter,
      success: true,
    });
  } catch (error: unknown) {
    const err = error as APIError;
    console.error("Gemini API error:", err.response?.data || err.message);

    // Handle specific Gemini API errors
    if (err.message?.includes("API_KEY")) {
      return NextResponse.json(
        { error: "API key configuration error" },
        { status: 500 }
      );
    }

    if (err.message?.includes("QUOTA_EXCEEDED")) {
      return NextResponse.json(
        { error: "API quota exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
