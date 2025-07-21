import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/lib/supabase";
import { ParsedUserProfile } from "@/lib/schemas";
// import type { NextApiRequest, NextApiResponse } from 'next';
// import { readFileSync } from 'fs';
// import path from 'path';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();

// Enhanced prompt for resume parsing with detailed instructions
const prompt = `Extract structured data from a resume and return valid JSON in this format: {"name":"Full name","email":"Email or null","phone":"Phone or null","location":"Address or null","summary":"Professional summary or null","skills":[{"skill":"Name","category":"Soft Skill|Hard Skill|Technical Skill|null","level":"Beginner|Intermediate|Advanced|Expert"}],"certifications":[{"name":"Name","issuer":"Organization","issue_date":"Date or ''","expiry_date":"Date or ''","credential_id":"ID or ''","credential_url":"URL or ''","year":"Year or ''"}],"experience":[{"title":"Job title","company":"Company","duration":"E.g., Jan 2020 - Present","location":"Location or ''","responsibilities":["List of tasks and achievements"]}],"education":[{"field":"Field of study","degree":"Degree","description":"Optional or ''","institution":"School","location":"Location or ''","duration":"e.g., 2016-2020","gpa":GPA or null}],"projects":[{"name":"Name or null","description":"Description or null","technologies":["List or []"],"link":"URL or null"}],"links":{"linkedin":"URL or null","portfolio":"URL or null","github":"URL or null"},"languages":[{"language":"Name","level":"Proficiency"}]}

Rules: Clean formatting. Categorize skills as Technical (tools/code), Hard (measurable), or Soft (personal). Preserve date formats. Use nulls/empty strings/arrays where needed. Infer skill levels or default to 'Intermediate'. Include social and project links. Return JSON only.
`;

// Input validation schema
interface ResumeParsingInput {
  parsedResumeData: string;
  options?: {
    includePersonalInfo?: boolean;
    maxSkills?: number;
    maxExperience?: number;
  };
}

// Type definitions matching your schema


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

// Utility function to clean and validate extracted data
function cleanAndValidateData(
  data: Partial<ParsedUserProfile>
): ParsedUserProfile {
  const cleaned: ParsedUserProfile = {
    name: typeof data.name === "string" ? data.name.trim() : "Unknown",
    email: typeof data.email === "string" ? data.email.trim() || null : null,
    phone: typeof data.phone === "string" ? data.phone.trim() || null : null,
    location: typeof data.location === "string" ? data.location.trim() || null : null,
    summary: typeof data.summary === "string" ? data.summary.trim() || null : null,

    skills: Array.isArray(data.skills)
      ? data.skills
        .filter((skill) => skill && typeof skill.skill === "string" && skill.skill.trim())
        .map((skill) => ({
          skill: skill.skill.trim(),
          category: ["Soft Skill", "Hard Skill", "Technical Skill"].includes(skill.category as string)
            ? skill.category as "Soft Skill" | "Hard Skill" | "Technical Skill"
            : undefined,
          level: typeof skill.level === "string" ? skill.level.trim() : "Intermediate",
        }))
      : [],

    certifications: Array.isArray(data.certifications)
      ? data.certifications
        .filter((cert) => cert && typeof cert.name === "string" && cert.name.trim())
        .map((cert) => ({
          name: cert.name.trim(),
          issuer: typeof cert.issuer === "string" ? cert.issuer.trim() : "",
          issue_date: typeof cert.issue_date === "string" ? cert.issue_date.trim() : "",
          expiry_date: typeof cert.expiry_date === "string" ? cert.expiry_date.trim() : "",
          credential_id: typeof cert.credential_id === "string" ? cert.credential_id.trim() : "",
          credential_url: typeof cert.credential_url === "string" ? cert.credential_url.trim() : "",
          year: typeof cert.year === "string" ? cert.year.trim() : "",
        }))
      : [],

    experience: Array.isArray(data.experience)
      ? data.experience
        .filter((exp) => exp && typeof exp.title === "string" && exp.title.trim())
        .map((exp) => ({
          title: exp.title.trim(),
          company: typeof exp.company === "string" ? exp.company.trim() : "",
          duration: typeof exp.duration === "string" ? exp.duration.trim() : "",
          location: typeof exp.location === "string" ? exp.location.trim() : "",
          responsibilities: Array.isArray(exp.responsibilities)
            ? exp.responsibilities
              .filter((resp) => typeof resp === "string" && resp.trim())
              .map((resp) => resp.trim())
            : [],
        }))
      : [],

    education: Array.isArray(data.education)
      ? data.education
        .filter((edu) => edu && typeof edu.institution === "string" && edu.institution.trim())
        .map((edu) => ({
          field: typeof edu.field === "string" ? edu.field.trim() : "",
          degree: typeof edu.degree === "string" ? edu.degree.trim() : "",
          description: typeof edu.description === "string" ? edu.description.trim() : "",
          institution: edu.institution.trim(),
          location: typeof edu.location === "string" ? edu.location.trim() : "",
          duration: typeof edu.duration === "string" ? edu.duration.trim() : "",
          gpa: typeof edu.gpa === "number" ? edu.gpa : undefined,
        }))
      : [],

    projects: Array.isArray(data.projects)
      ? data.projects
        .filter((proj) => proj && (proj.name || proj.description))
        .map((proj) => ({
          name: typeof proj.name === "string" ? proj.name.trim() || undefined : undefined,
          description: typeof proj.description === "string" ? proj.description.trim() || undefined : undefined,
          technologies: Array.isArray(proj.technologies)
            ? proj.technologies
              .filter((tech) => typeof tech === "string" && tech.trim())
              .map((tech) => tech.trim())
            : [],
          link: typeof proj.link === "string" ? proj.link.trim() || undefined : undefined,
        }))
      : [],

    links: {
      linkedin: data.links && typeof data.links.linkedin === "string"
        ? data.links.linkedin.trim() || undefined
        : undefined,
      portfolio: data.links && typeof data.links.portfolio === "string"
        ? data.links.portfolio.trim() || undefined
        : undefined,
      github: data.links && typeof data.links.github === "string"
        ? data.links.github.trim() || null
        : null,
    },

    languages: Array.isArray(data.languages)
      ? data.languages
        .filter((lang) => lang && typeof lang.language === "string" && lang.language.trim())
        .map((lang) => ({
          language: lang.language.trim(),
          level: typeof lang.level === "string" ? lang.level.trim() : "Conversational",
        }))
      : [],
  };

  // Remove duplicates while preserving order
  cleaned.skills = cleaned.skills.filter((skill, index, array) =>
    array.findIndex((s) => s.skill.toLowerCase() === skill.skill.toLowerCase()) === index
  );

  return cleaned;
}

// Pre-process parsed resume data
function preprocessResumeData(parsedData: string): string {
  return parsedData
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, "\n") // Remove extra blank lines
    .trim();
}

// Type guard for API errors
function isAPIError(error: unknown): error is APIError {
  return (
    error instanceof Error &&
    ("status" in error || "code" in error || "type" in error || "response" in error)
  );
}

export async function POST(req: NextRequest) {

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

    // Input validation
    const body = await req.json();
    const { parsedResumeData, options = {} }: ResumeParsingInput = body;
    console.log(parsedResumeData);

    if (!parsedResumeData || typeof parsedResumeData !== "string") {
      return NextResponse.json(
        { error: "Invalid input: parsedResumeData is required and must be a string" },
        { status: 400 }
      );
    }

    if (parsedResumeData.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid input: parsedResumeData cannot be empty" },
        { status: 400 }
      );
    }

    if (parsedResumeData.trim().length > 50000) {
      return NextResponse.json(
        { error: `${parsedResumeData.length}Invalid input: parsedResumeData is too long (max 50,000 characters)` },
        { status: 400 }
      );
    }

    // Pre-process the resume data
    const processedData = preprocessResumeData(parsedResumeData);

    // Create the full prompt
    const fullPrompt = `${prompt}\n\nResume Data:\n${processedData}`;

    console.log("Sending resume parsing prompt to Gemini API:", fullPrompt.slice(0, 5000) + "...");

    // Make API call to Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: fullPrompt.replace(/\s+/g, " ").trim(),
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

    let parsed: Partial<ParsedUserProfile>;
    try {
      parsed = JSON.parse(cleanedText);
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

    // Clean and validate the parsed data
    const cleanedData = cleanAndValidateData(parsed);

    // Apply options if provided
    if (options.maxSkills) {
      cleanedData.skills = cleanedData.skills.slice(0, options.maxSkills);
    }

    if (options.maxExperience) {
      cleanedData.experience = cleanedData.experience.slice(0, options.maxExperience);
    }

    // Remove personal info if requested
    if (options.includePersonalInfo === false) {
      cleanedData.email = null;
      cleanedData.phone = null;
      cleanedData.location = null;
    }

    console.log("Successfully parsed resume, returning profile data for preview.");

    // Return the parsed profile data without saving to database yet
    // The frontend can preview this data and then make another call to save it
    return NextResponse.json({
      profile: cleanedData,
      modelVersion: response.data.modelVersion,
      usageMetadata: response.data.usageMetadata,
    });

  } catch (error) {
    console.error("Resume parsing error:", error);

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
        error: "Failed to parse resume. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Separate endpoint to save the profile after user preview
export async function PUT(req: NextRequest) {

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { profile }: { profile: ParsedUserProfile } = body;

    if (!profile || typeof profile !== "object") {
      return NextResponse.json(
        { error: "Invalid input: profile data is required" },
        { status: 400 }
      );
    }

    // Save the profile to database
    const { data, error: saveError } = await supabase
      .from("user_profiles") // Adjust table name as needed
      .insert({
        user_id: user.id,
        ...profile,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving user profile:", saveError);
      return NextResponse.json(
        {
          error: "Failed to save profile to database",
          details: saveError.message,
        },
        { status: 500 }
      );
    }

    console.log("Successfully saved user profile to database");
    return NextResponse.json({
      success: true,
      profile: data,
    });

  } catch (error) {
    console.error("Profile saving error:", error);
    return NextResponse.json(
      {
        error: "Failed to save profile. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}