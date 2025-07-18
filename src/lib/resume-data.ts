import { z } from "zod";
import {
  profileSchema,
  experienceSchema,
  educationSchema,
  certSchema,
  langSchema,
  skillSchema,
} from "./profile-schemas"; // Assuming this path is correct

// Extend existing schemas if necessary for PDF rendering (e.g., adding an 'id' for lists)
const experiencePdfSchema = experienceSchema.extend({
  id: z.string().optional(), // Add id for consistent keying, though not strictly needed for PDF content
});

const educationPdfSchema = educationSchema.extend({
  id: z.string().optional(),
});

const certPdfSchema = certSchema.extend({
  id: z.string().optional(),
});

const langPdfSchema = langSchema.extend({
  id: z.string().optional(),
});

const skillPdfSchema = skillSchema.extend({
  id: z.string().optional(),
});

// Define the complete ResumeData structure
export const resumeDataSchema = z.object({
  profile: profileSchema,
  experiences: z.array(experiencePdfSchema),
  education: z.array(educationPdfSchema),
  certifications: z.array(certPdfSchema).optional(),
  languages: z.array(langPdfSchema).optional(),
  skills: z.array(skillPdfSchema).optional(),
  // Add any other top-level resume fields here, e.g.,
  // objective: z.string().optional(),
  // projects: z.array(projectSchema).optional(),
});

// Infer the TypeScript type for the complete resume data
export type ResumeData = z.infer<typeof resumeDataSchema>;