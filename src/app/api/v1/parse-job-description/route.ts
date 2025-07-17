import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.KIMI_API_KEY! });

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

EXAMPLES:
- Required skill: "Python programming with 3+ years experience"
- Responsibility: "Design and implement RESTful APIs using Node.js"
- Qualification: "Bachelor's degree in Computer Science or related field"
- Benefit: "Health insurance and 401k matching"

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

// Utility function to clean and validate extracted data
function cleanAndValidateData(data: Partial<ParsedJobDescription>): ParsedJobDescription {
  const cleaned: ParsedJobDescription = {
    title: typeof data.title === 'string' ? data.title.trim() : 'Unknown Position',
    company: typeof data.company === 'string' ? data.company.trim() || null : null,
    location: typeof data.location === 'string' ? data.location.trim() || null : null,
    employment_type: typeof data.employment_type === 'string' ? data.employment_type.trim() || null : null,
    experience_level: typeof data.experience_level === 'string' ? data.experience_level.trim() || null : null,
    salary_range: typeof data.salary_range === 'string' ? data.salary_range.trim() || null : null,
    required_skills: Array.isArray(data.required_skills) 
      ? data.required_skills.filter(skill => typeof skill === 'string' && skill.trim()).map(skill => skill.trim())
      : [],
    preferred_skills: Array.isArray(data.preferred_skills) 
      ? data.preferred_skills.filter(skill => typeof skill === 'string' && skill.trim()).map(skill => skill.trim())
      : [],
    responsibilities: Array.isArray(data.responsibilities) 
      ? data.responsibilities.filter(resp => typeof resp === 'string' && resp.trim()).map(resp => resp.trim())
      : [],
    qualifications: Array.isArray(data.qualifications) 
      ? data.qualifications.filter(qual => typeof qual === 'string' && qual.trim()).map(qual => qual.trim())
      : [],
    benefits: Array.isArray(data.benefits) 
      ? data.benefits.filter(benefit => typeof benefit === 'string' && benefit.trim()).map(benefit => benefit.trim())
      : [],
    department: typeof data.department === 'string' ? data.department.trim() || null : null,
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
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    // Input validation
    const body = await req.json();
    const { rawText, options = {} }: JobDescriptionInput = body;

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: rawText is required and must be a string' },
        { status: 400 }
      );
    }

    if (rawText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: rawText cannot be empty' },
        { status: 400 }
      );
    }

    if (rawText.length > 50000) {
      return NextResponse.json(
        { error: 'Invalid input: rawText is too long (max 50,000 characters)' },
        { status: 400 }
      );
    }

    // Pre-process the text
    const processedText = preprocessText(rawText);

    // Create completion with error handling
    const completion = await openai.chat.completions.create({
      model: "moonshot-v1-8k",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: processedText },
      ],
      temperature: 0.1, // Lower temperature for more consistent results
      max_tokens: 4000,
    });

    // Validate API response
    if (!completion.choices[0]?.message?.content) {
      throw new Error('Invalid API response: no content received');
    }

    // Parse and validate JSON
    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      );
    }

    // Clean and validate the parsed data
    const cleanedData = cleanAndValidateData(parsed);

    // Apply options if provided
    if (options.maxSkills) {
      cleanedData.required_skills = cleanedData.required_skills.slice(0, options.maxSkills);
      cleanedData.preferred_skills = cleanedData.preferred_skills.slice(0, options.maxSkills);
    }

    if (options.maxResponsibilities) {
      cleanedData.responsibilities = cleanedData.responsibilities.slice(0, options.maxResponsibilities);
    }

    // Remove company info if requested
    if (options.includeCompany === false) {
      cleanedData.company = null;
    }

    // Remove salary info if requested
    if (options.includeSalary === false) {
      cleanedData.salary_range = null;
    }

    return NextResponse.json(cleanedData);

  } catch (error) {
    console.error('Job description parsing error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Authentication failed. Please check API key.' },
          { status: 401 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to parse job description. Please try again.' },
      { status: 500 }
    );
  }
}