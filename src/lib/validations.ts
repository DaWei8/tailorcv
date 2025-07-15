import { z } from "zod";
export const profileSchema = z.object({
  full_name: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(10),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
});

export type ProfileForm = z.infer<typeof profileSchema>;