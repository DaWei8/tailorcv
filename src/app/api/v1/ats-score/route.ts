import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { callGemini } from "@/components/callGemini"; // Your callGemini function
import { ATSResult } from "@/lib/schemas";
interface APIError extends Error {
  response?: {
    data?: unknown;
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    jobDescription,
    resumeData, // Get resume data directly from client
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

  const prompt = `
Analyze the provided JOB_DESCRIPTION and CANDIDATE_RESUME using the very strict TAILOR ATS framework (Target Keywords, Achieved Impact, Industry Relevance, Length of Experience/Longevity, Optimized Formatting/Organization, Role Alignment/Responsibilities).

Generate a JSON object following the exact structure provided in JSON_OUTPUT_SCHEMA_EXAMPLE. Populate all fields with relevant data from the analysis. Ensure scores are percentages and explanations are concise.
JOB_DESCRIPTION:${jobDescription}
CANDIDATE_RESUME:${JSON.stringify(resumeData, null, 2)}
JSON_OUTPUT_SCHEMA_EXAMPLE:
\`\`\`json
{
  "candidate_name": "Jane Doe",
  "job_title": "Senior Software Engineer (Backend)",
  "overall_fit_score_percentage": 90,
  "overall_recommendation": "Strong Fit",
  "tailor_analysis": {
    "T_target_keywords": {
      "score_percentage": 92,
      "matched_keywords": [
        "Python",
        "Django",
        "REST API",
        "SQL",
        "PostgreSQL",
        "AWS",
        "Docker",
        "microservices",
        "agile",
        "unit testing",
        "system design"
      ],
      "missing_keywords": [
        "Kubernetes"
      ],
      "explanation": "Excellent match on core technical skills and tools. Only missing one non-critical keyword (Kubernetes)."
    },
    "A_achieved_impact": {
      "score_percentage": 88,
      "impact_statements_found": [
        "Increased system performance by 30% by optimizing database queries.",
        "Reduced server costs by 15% through efficient resource allocation on AWS.",
        "Led a team of 4 engineers to deliver a critical new microservice on schedule.",
        "Improved code test coverage from 60% to 90%."
      ],
      "explanation": "Strong evidence of measurable impact, demonstrating ability to deliver quantifiable results and lead initiatives."
    },
    "I_industry_relevance": {
      "score_percentage": 95,
      "relevant_industries_found": [
        "Fintech",
        "E-commerce"
      ],
      "explanation": "Direct experience in Fintech, which is highly relevant to our company's domain. Also experience in E-commerce, which involves similar scalable backend challenges."
    },
    "L_length_of_experience": {
      "score_percentage": 90,
      "total_years_experience": 7.5,
      "average_tenure_years": 3.75,
      "required_experience_years": 5,
      "explanation": "Exceeds the minimum experience requirement. Stable tenure at previous companies indicates reliability."
    },
    "O_optimized_formatting": {
      "score_percentage": 80,
      "readability_assessment": "Excellent",
      "key_sections_present": [
        "Summary",
        "Experience",
        "Skills",
        "Education",
        "Projects"
      ],
      "explanation": "Well-structured resume with clear headings, bullet points, and easy-to-read sections. All essential sections are present."
    },
    "R_role_alignment": {
      "score_percentage": 87,
      "aligned_responsibilities": [
        "Designing and implementing scalable backend services.",
        "Developing and maintaining RESTful APIs.",
        "Database schema design and optimization.",
        "Mentoring junior engineers.",
        "Participating in code reviews and architectural discussions."
      ],
      "misaligned_responsibilities_or_gaps": [],
      "explanation": "Past responsibilities align very closely with the core duties of a Senior Backend Engineer. Strong functional match."
    }
  },
  "red_flags": [],
  "notes": "Candidate demonstrates strong technical proficiency, leadership potential, and a track record of delivering measurable impact. Highly recommended for interview."
}
\`\`\`
`;

  try {
    const geminiAxiosResponse = await callGemini(prompt.trim());

    // Access the data payload from the AxiosResponse, then drill down to candidates.
    const rawGeneratedText =
      geminiAxiosResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawGeneratedText) {
      console.error("Gemini returned no text content:", geminiAxiosResponse.data);
      return NextResponse.json({ error: "Gemini returned no content" }, { status: 500 });
    }

    // Clean the generated text by removing markdown wrappers
    const cleanedJsonString = rawGeneratedText
      .replace(/^```json\s*/, "") 
      .replace(/\s*```$/, "")     // Remove trailing ``` and optional whitespace
      .trim(); // Trim any remaining whitespace

    let atsReport: ATSResult;

    try {
      atsReport = JSON.parse(cleanedJsonString); // Parse the cleaned string
      console.log("Successfully parsed ATS JSON.");
      console.log(atsReport);

      return NextResponse.json({
        atsReport,
        success: true,
        // id: savedReport.id, // Include ID if you save it
      });
    } catch (e) {
      console.error("Failed to parse ATS JSON:", rawGeneratedText, e); // Log raw text for debugging
      return NextResponse.json(
        {
          error: "Invalid JSON from Gemini",
          details: e instanceof Error ? e.message : "Unknown parsing error",
          rawResponse: rawGeneratedText, // Return raw response for debugging on client
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const err = error as APIError;
    // When catching the error from callGemini, err.response might exist if it was an Axios error.
    // We check err.response?.data first, then err.message.
    console.error("Gemini API call error:", err.response?.data || err.message || "Unknown error");

    // Handle specific Gemini API errors based on message or response data
    // Note: err.response?.data might be an object, so check if it's a string before .includes()
    if (
      err.message?.includes("API_KEY") ||
      (typeof err.response?.data === 'string' && err.response.data.includes("API_KEY")) ||
      (typeof err.response?.data === 'object' && err.response.data && 'message' in err.response.data && typeof err.response.data.message === 'string' && err.response.data.message.includes("API_KEY"))
    ) {
      return NextResponse.json(
        { error: "API key configuration error" },
        { status: 500 }
      );
    }

    if (
      err.message?.includes("QUOTA_EXCEEDED") ||
      (typeof err.response?.data === 'string' && err.response.data.includes("QUOTA_EXCEEDED")) ||
      (typeof err.response?.data === 'object' && err.response.data && 'message' in err.response.data && typeof err.response.data.message === 'string' && err.response.data.message.includes("QUOTA_EXCEEDED"))
    ) {
      return NextResponse.json(
        { error: "API quota exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to generate ATS score.",
        details: err.message || "Unknown error occurred during API call.",
      },
      { status: 500 }
    );
  }
}