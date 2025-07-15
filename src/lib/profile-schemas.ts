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