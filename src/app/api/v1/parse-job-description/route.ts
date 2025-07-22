import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Enhanced prompt with detailed instructions and examples
const prompt = `You are a specialized job description parser. Extract information from job descriptions and return ONLY valid JSON with the following structure:
{
  "title": "string - The job title/position name",
  "company": "string - Company name if mentioned, otherwise null",
  "location": "string - Job location if specified, otherwise null",
  "employment_type": "string - full-time, part-time, contract, internship, etc. or null",
  "experience_level": "string - entry, mid, senior, lead, executive, etc. or null",
  "salary_range": "string - salary information if mentioned, otherwise null",
  "required_skills": ["array of strings - technical skills, tools, languages, certifications that are mandatory"],
  "preferred_skills": ["array of strings - nice-to-have skills, preferred qualifications"],
  "responsibilities": ["array of strings - main job duties and responsibilities"],
  "qualifications": ["array of strings - education, experience, and other requirements"],
  "benefits": ["array of strings - compensation, benefits, perks mentioned"],
  "department": "string - department/team if mentioned, otherwise null"
}

EXTRACTION RULES:
1. Extract actual skills/tools/technologies mentioned (e.g., "Python", "AWS", "React", "5+ years experience")
2. For responsibilities, extract concrete tasks and duties, not vague statements
3. Separate required vs preferred skills carefully - look for keywords like "must have", "required", "essential" vs "nice to have", "preferred", "bonus"
4. Include years of experience as part of skill descriptions when specified
5. If information is not available, use null for strings or empty arrays []
6. Clean up extracted text - remove excessive whitespace and formatting
7. Be specific and detailed in extractions rather than generic

Return ONLY the JSON object, no additional text or explanation.`;

// Input validation schema
interface JobDescriptionInput {
  rawText: string;
  options?: {
    includeCompany?: boolean;
    includeSalary?: boolean;
    maxSkills?: number;
    maxResponsibilities?: number;
  };
}

// Output type definition
interface ParsedJobDescription {
  title: string;
  company: string | null;
  location: string | null;
  employment_type: string | null;
  experience_level: string | null;
  salary_range: string | null;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  department: string | null;
}

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
  data: Partial<ParsedJobDescription>
): ParsedJobDescription {
  const cleaned: ParsedJobDescription = {
    title:
      typeof data.title === "string" ? data.title.trim() : "Unknown Position",
    company:
      typeof data.company === "string" ? data.company.trim() || null : null,
    location:
      typeof data.location === "string" ? data.location.trim() || null : null,
    employment_type:
      typeof data.employment_type === "string"
        ? data.employment_type.trim() || null
        : null, 
    experience_level:
      typeof data.experience_level === "string"
        ? data.experience_level.trim() || null
        : null,
    salary_range:
      typeof data.salary_range === "string"
        ? data.salary_range.trim() || null
        : null,
    required_skills: Array.isArray(data.required_skills)
      ? data.required_skills
          .filter((skill) => typeof skill === "string" && skill.trim())
          .map((skill) => skill.trim())
      : [],
    preferred_skills: Array.isArray(data.preferred_skills)
      ? data.preferred_skills
          .filter((skill) => typeof skill === "string" && skill.trim())
          .map((skill) => skill.trim())
      : [],
    responsibilities: Array.isArray(data.responsibilities)
      ? data.responsibilities
          .filter((resp) => typeof resp === "string" && resp.trim())
          .map((resp) => resp.trim())
      : [],
    qualifications: Array.isArray(data.qualifications)
      ? data.qualifications
          .filter((qual) => typeof qual === "string" && qual.trim())
          .map((qual) => qual.trim())
      : [],
    benefits: Array.isArray(data.benefits)
      ? data.benefits
          .filter((benefit) => typeof benefit === "string" && benefit.trim())
          .map((benefit) => benefit.trim())
      : [],
    department:
      typeof data.department === "string"
        ? data.department.trim() || null
        : null,
  };

  // Remove duplicates while preserving order
  cleaned.required_skills = [...new Set(cleaned.required_skills)];
  cleaned.preferred_skills = [...new Set(cleaned.preferred_skills)];
  cleaned.responsibilities = [...new Set(cleaned.responsibilities)];
  cleaned.qualifications = [...new Set(cleaned.qualifications)];
  cleaned.benefits = [...new Set(cleaned.benefits)];

  return cleaned;
}

// Pre-process raw text to handle common formatting issues
function preprocessText(rawText: string): string {
  return rawText
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
  const supabase = await createClient(); 
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const { rawText, options = {} }: JobDescriptionInput = body;

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json(
        { error: "Invalid input: rawText is required and must be a string" },
        { status: 400 }
      );
    }

    if (rawText.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid input: rawText cannot be empty" },
        { status: 400 }
      );
    }

    if (rawText.length > 50000) {
      return NextResponse.json(
        { error: "Invalid input: rawText is too long (max 50,000 characters)" },
        { status: 400 }
      );
    }

    // Pre-process the text
    const processedText = preprocessText(rawText);

    // Create the full prompt
    const fullPrompt = `${prompt}\n\nJob Description:\n${processedText}`;

    console.log("Sending prompt to Gemini API:", fullPrompt.slice(0, 300) + "...");

    // Make API call to Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY2}`,
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

    let parsed: Partial<ParsedJobDescription>;
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
// Save the cover letter to database
    const { error: saveError } = await supabase
      .from("job_descriptions")
      .insert({
        user_id: user.id,
        parsed: cleanedData, // Use the resume ID from the data
        raw_text: rawText,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving cover letter:", saveError);
      // Still return the cover letter even if saving fails
      return NextResponse.json({ 
        cleanedData,
        warning: "Job description parsed but not saved to database"
      });
    }
    

    // Apply options if provided
    if (options.maxSkills) {
      cleanedData.required_skills = cleanedData.required_skills.slice(
        0,
        options.maxSkills
      );
      cleanedData.preferred_skills = cleanedData.preferred_skills.slice(
        0,
        options.maxSkills
      );
    }

    if (options.maxResponsibilities) {
      cleanedData.responsibilities = cleanedData.responsibilities.slice(
        0,
        options.maxResponsibilities
      );
    }

    // Remove company info if requested
    if (options.includeCompany === false) {
      cleanedData.company = null;
    }

    // Remove salary info if requested
    if (options.includeSalary === false) {
      cleanedData.salary_range = null;
    }

    console.log("Successfully parsed job description, sending response.");
    return NextResponse.json({
      ...cleanedData,
      modelVersion: response.data.modelVersion,
      usageMetadata: response.data.usageMetadata,
    });

  } catch (error) {
    console.error("Job description parsing error:", error);

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
        error: "Failed to parse job description. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}