import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { z } from "zod";

// ---------------- Basic Profile ----------------
export const profileSchema = z.object({
  full_name: z.string().min(2),
  headline: z.string().min(2),
  summary: z.string().min(10),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
});


export const rprofileSchema = z.object({
  name: z.string().min(2),
  headline: z.string().min(2),
  summary: z.string().min(10),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
});

export type ProfileForm = z.infer<typeof profileSchema>;

// ---------------- Experiences ----------------
export const experienceSchema = z.object({
  job_title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
});
export type ExperienceForm = {
  job_title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  achievements?: string[];
  skills?: string[];
};;

// ---------------- Education ----------------
export const educationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  gpa: z.number().optional(),
  description: z.string().optional(),
});
export type EducationForm = z.infer<typeof educationSchema>;

// ---------------- Certification ----------------
export const certSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  credential_id: z.string().optional(),
  credential_url: z.string().url().optional(),
});
export type CertForm = z.infer<typeof certSchema>;

// ---------------- Language ----------------
export const langSchema = z.object({
  language: z.string().min(1),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Native"]),
});
export type LangForm = z.infer<typeof langSchema>;

// ---------------- Skill ----------------
export const skillSchema = z.object({
  skill: z.string().min(1),
  category: z.string().min(1),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
});
export type SkillForm = z.infer<typeof skillSchema>;

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string()).default([]),
  link: z.string().url().optional(),
})

export const linkSchema = z.object({
  linkedin: z.string().url().optional(),
  portfolio: z.string().url().optional(),
  github: z.string().url().optional(),
})


export interface Profile {
  id: string;
  is_master: boolean;
  user_id: string;
  full_name: string;
  headline: string;
  summary: string;
  city: string;
  country: string;
  phone: string;
  linkedin_url: string;
  website_url: string;
  created_at: string;
  updated_at: string;

}

export interface ParsedUserProfile {
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: Skill[];
  certifications: Certification[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  links: Links;
  languages: Language[];
}

// ---------------- Resume Data ----------------

export interface ResumeData {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  links: Links;
}


export interface Skill {
  skill: string;
  category?: "Soft Skill" | "Hard Skill" | "Technical Skill";
  level: string;
}

export interface Certification {
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string;
  credential_id: string;
  credential_url: string;
  year: string;
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  location: string;
  responsibilities: string[];
}

export interface Education {
  field: string;
  degree: string;
  description: string;
  institution: string;
  location: string;
  duration: string;
  gpa?: number;
}

export interface Project {
  name?: string;
  description?: string;
  technologies?: string[];
  link?: string;
}

export interface Links {
  linkedin?: string;
  portfolio?: string;
  github?: string | null;
}

export interface Language {
  language: string;
  level: string;
}

export interface Skill {
  skill: string;
  category?: "Soft Skill" | "Hard Skill" | "Technical Skill";
  level: string;
}

export interface JobDescription {
  id: string;
  // user_id: string;
  raw_text: string;
  parsed: string;
  created_at: Timestamp;
  // user_profile_id: string;
}


export interface TailorSection {
  score_percentage: number;
  explanation: string;
  [key: string]: string | number; // to allow matched_keywords, impact_statements, etc.
}

export interface TailorAnalysis {
  T_target_keywords: TailorSection & {
    matched_keywords: string[];
    missing_keywords: string[];
  };
  A_achieved_impact: TailorSection & {
    impact_statements_found: string[];
  };
  I_industry_relevance: TailorSection & {
    relevant_industries_found: string[];
  };
  L_length_of_experience: TailorSection & {
    total_years_experience: number;
    average_tenure_years: number;
    required_experience_years: number;
  };
  O_optimized_formatting: TailorSection & {
    readability_assessment: string;
    key_sections_present: string[];
  };
  R_role_alignment: TailorSection & {
    aligned_responsibilities: string[];
    misaligned_responsibilities_or_gaps: string[];
  };
}

export interface ATSResult {
  candidate_name: string;
  job_title: string;
  overall_fit_score_percentage: number;
  overall_recommendation: string;
  tailor_analysis: TailorAnalysis;
  red_flags: string[];
  notes: string;
}
