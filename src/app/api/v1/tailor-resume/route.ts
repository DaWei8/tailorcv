import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import axios from "axios";

// API Error type
interface APIError extends Error {
  response?: {
    data?: unknown;
    status?: number;
  };
  status?: number;
  code?: string;
  type?: string;
}

// Type guard for API errors
function isAPIError(error: unknown): error is APIError {
  return (
    error instanceof Error &&
    ("status" in error || "code" in error || "type" in error || "response" in error)
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "undefined") {
      console.error("GEMINI_API_KEY is missing or undefined in environment variables.");
      return NextResponse.json(
        {
          error: "Gemini API key is missing or not set in the backend environment.",
        },
        { status: 500 }
      );
    }

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
      Given this user profile: ${JSON.stringify(
        { ...profile, experiences },
        null,
        2
      )}
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

    console.log("Sending prompt to Gemini API for resume tailoring...");

    // Make API call to Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt.replace(/\s+/g, " ").trim(),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Lower temperature for more consistent results
          topP: 0.95,
          topK: 40,
        },
      }
    );

    // Check for Gemini API errors
    if (response.data && response.data.error) {
      console.error("Gemini API error:", response.data.error);
      return NextResponse.json(
        {
          error: "Gemini API error",
          details: response.data.error,
        },
        { status: 500 }
      );
    }

    // Extract the generated text
    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("Raw Gemini API response text:", generatedText ? generatedText.slice(0, 300) + "..." : "No text");

    if (!generatedText) {
      console.error("No text content in Gemini API response:", response.data);
      return NextResponse.json(
        {
          error: "Gemini did not generate a response.",
          details: "No text content in response.",
        },
        { status: 500 }
      );
    }

    // Clean and parse the JSON data
    const cleanedText = generatedText
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    let resumeJson;
    try {
      resumeJson = JSON.parse(cleanedText);
    } catch (jsonError) {
      console.error("Failed to parse Gemini's response as JSON:", cleanedText);
      return NextResponse.json(
        {
          error: "Failed to parse AI response as JSON",
          details: jsonError instanceof Error ? jsonError.message : "Unknown JSON parsing error",
          rawResponse: cleanedText,
        },
        { status: 500 }
      );
    }

    // Calculate ATS score
    const atsScore = Math.round(
      (resumeJson.skills?.length / jobDescription.required_skills.length) * 100
    );

    // Save to database
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

    console.log("Successfully tailored resume and saved to database.");
    return NextResponse.json({
      success: true,
      resume: resumeJson,
      atsScore,
      id: tailoredResume.id,
      modelVersion: response.data.modelVersion,
      usageMetadata: response.data.usageMetadata,
    });

  } catch (error) {
    console.error("Resume tailoring error:", error);

    // Handle specific API errors
    if (isAPIError(error)) {
      if (
        error.response?.status === 401 ||
        error.message.includes("401") ||
        error.message.includes("authentication") ||
        error.message.includes("API key")
      ) {
        return NextResponse.json(
          {
            error: "Invalid API key. Please check your GEMINI_API_KEY environment variable.",
          },
          { status: 401 }
        );
      }

      if (
        error.response?.status === 429 ||
        error.message.includes("rate limit") ||
        error.message.includes("quota")
      ) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      if (error.response?.status === 400) {
        return NextResponse.json(
          {
            error: "Bad request to Gemini API",
            details: error.response.data || error.message,
          },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to tailor resume. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}