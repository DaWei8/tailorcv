"use client";

import { useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { PlusCircle, Trash2 } from "lucide-react";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid"; // Add uuid for generating unique IDs

/* ---------- Schemas & Types ---------- */
import { profileSchema, experienceSchema, educationSchema, certSchema, langSchema, skillSchema } from "@/lib/profile-schemas";
import type { ProfileForm, ExperienceForm, EducationForm, CertForm, LangForm, SkillForm } from "@/lib/profile-schemas";

// Ensure schemas align with form types
const experienceArraySchema = z.object({ items: z.array(experienceSchema) });
const educationArraySchema = z.object({ items: z.array(educationSchema) });
const certArraySchema = z.object({ items: z.array(certSchema) });
const langArraySchema = z.object({ items: z.array(langSchema) });
const skillArraySchema = z.object({ items: z.array(skillSchema) });

/* ---------- Helpers ---------- */
const userId = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    toast.error("Failed to get user ID");
    return null;
  }
  return data.user.id;
};

/* ---------- Reusable Section ---------- */
interface SectionProps<T> {
  title: string;
  form: UseFormReturn<{ items: T[] }>;
  table: string;
  addDefault: T;
  children: (index: number, field: T & { id: string }) => React.ReactNode;
}

function Section<T extends Record<string, unknown>>({ title, form, table, addDefault, children }: SectionProps<T>) {
  const { fields, append, remove } = useFieldArray<{ items: T[] }, "items">({
    control: form.control,
    name: "items" as const,
  });
  useEffect(() => {
    (async () => {
      const uid = await userId();
      if (!uid) return;
      const { data, error } = await supabase.from(table).select().eq("profile_id", uid);
      if (error) {
        toast.error(`Failed to load ${title}`);
        return;
      }
      form.reset({ items: data || [] });
    })();
  }, [table, form, title]);

  const save = async () => {
    const uid = await userId();
    if (!uid) return;
    const payload = form.getValues("items").map(item => ({ ...item, profile_id: uid }));
    const { error } = await supabase.from(table).upsert(payload);
    if (error) {
      toast.error(`Failed to save ${title}`);
      return;
    }
    toast.success(`${title} saved`);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={() => append({ ...addDefault, id: uuidv4() } as T)}
          className="btn-secondary"
          aria-label={`Add new ${title}`}
        >
          <PlusCircle size={16} /> Add
        </button>
      </div>
      {fields.map((field, i) => (
        <div key={field.id} className="border p-3 rounded space-y-2">
          {children(i, field as T & { id: string })}
          <button type="button" onClick={() => remove(i)} className="btn-danger" aria-label={`Remove ${title} item`}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" onClick={save} className="btn-primary">
        Save {title}
      </button>
    </section>
  );
}

/* ---------- MAIN PAGE ---------- */
export default function ProfilePage() {
  /* Basic profile */
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const { register, handleSubmit, setValue } = profileForm;

  /* Experiences */
  const expForm = useForm<{ items: ExperienceForm[] }>({
    resolver: zodResolver(experienceArraySchema),
    defaultValues: { items: [] },
  });
  const { register: regExp } = expForm;

  /* Education */
  const eduForm = useForm<{ items: EducationForm[] }>({
    resolver: zodResolver(educationArraySchema),
    defaultValues: { items: [] },
  });
  const { register: regEdu } = eduForm;

  /* Certifications */
  const certForm = useForm<{ items: CertForm[] }>({
    resolver: zodResolver(certArraySchema),
    defaultValues: { items: [] },
  });
  const { register: regCert } = certForm;

  /* Languages */
  const langForm = useForm<{ items: LangForm[] }>({
    resolver: zodResolver(langArraySchema),
    defaultValues: { items: [] },
  });
  const { register: regLang } = langForm;

  /* Skills */
  const skillForm = useForm<{ items: SkillForm[] }>({
    resolver: zodResolver(skillArraySchema),
    defaultValues: { items: [] },
  });
  const { register: regSkill } = skillForm;

  /* Load basic profile once */
  useEffect(() => {
    (async () => {
      const uid = await userId();
      if (!uid) return;
      const { data, error } = await supabase.from("profiles").select().eq("id", uid).single();
      if (error) {
        toast.error("Failed to load profile");
        return;
      }
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          if (key in profileSchema.shape) {
            setValue(key as keyof ProfileForm, value as any); // Type assertion to bypass unknown
          }
        });
      }
    })();
  }, [setValue]);

  /* Save basic profile */
  const saveProfile = async (data: ProfileForm) => {
    const uid = await userId();
    if (!uid) return;
    const { error } = await supabase.from("profiles").upsert({ id: uid, ...data });
    if (error) {
      toast.error("Failed to save profile");
      return;
    }
    toast.success("Profile saved");
  };

  /* ---------- Common Input ---------- */
  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="input w-full" />;

  return (
    <main className="max-w-3xl mx-auto py-8 px-4 space-y-10">
      <h1 className="text-2xl font-bold">Master Profile</h1>

      {/* Basic Profile */}
      <form onSubmit={handleSubmit(saveProfile)} className="space-y-4">
        <h2 className="text-lg font-semibold">Basics</h2>
        {(["full_name", "headline", "summary", "city", "country", "phone", "linkedin_url", "website_url"] as const).map(k => (
          <label key={k} className="block">
            <span className="text-sm">{k.replace("_", " ")}</span>
            <Input {...register(k)} />
          </label>
        ))}
        <button type="submit" className="btn-primary">Save Basics</button>
      </form>

      {/* Experiences */}
      <Section
        title="Experiences"
        form={expForm}
        table="experiences"
        addDefault={{ job_title: "", company: "", location: "", start_date: "", end_date: "", description: "", achievements: [], skills: [] }}
      >
        {(i) => (
          <>
            <Input {...regExp(`items.${i}.job_title`)} placeholder="Job Title" />
            <Input {...regExp(`items.${i}.company`)} placeholder="Company" />
            <Input {...regExp(`items.${i}.location`)} placeholder="Location" />
            <Input {...regExp(`items.${i}.start_date`)} type="date" />
            <Input {...regExp(`items.${i}.end_date`)} type="date" />
            <Input {...regExp(`items.${i}.description`)} placeholder="Description" />
            {/* Add inputs for achievements and skills if needed */}
          </>
        )}
      </Section>

      {/* Education */}
      <Section
        title="Education"
        form={eduForm}
        table="education"
        addDefault={{ school: "", degree: "", field: "", start_date: "", end_date: "", gpa: 0, description: "" }}
      >
        {(i) => (
          <>
            <Input {...regEdu(`items.${i}.school`)} placeholder="School" />
            <Input {...regEdu(`items.${i}.degree`)} placeholder="Degree" />
            <Input {...regEdu(`items.${i}.field`)} placeholder="Field" />
            <Input {...regEdu(`items.${i}.start_date`)} type="date" />
            <Input {...regEdu(`items.${i}.end_date`)} type="date" />
            <Input {...regEdu(`items.${i}.gpa`)} type="number" step="0.01" placeholder="GPA" />
            <Input {...regEdu(`items.${i}.description`)} placeholder="Description" />
          </>
        )}
      </Section>

      {/* Certifications */}
      <Section
        title="Certifications"
        form={certForm}
        table="certifications"
        addDefault={{ name: "", issuer: "", issue_date: "", expiry_date: "", credential_id: "", credential_url: "" }}
      >
        {(i) => (
          <>
            <Input {...regCert(`items.${i}.name`)} placeholder="Name" />
            <Input {...regCert(`items.${i}.issuer`)} placeholder="Issuer" />
            <Input {...regCert(`items.${i}.issue_date`)} type="date" />
            <Input {...regCert(`items.${i}.expiry_date`)} type="date" />
            <Input {...regCert(`items.${i}.credential_id`)} placeholder="Credential ID" />
            <Input {...regCert(`items.${i}.credential_url`)} placeholder="Credential URL" />
          </>
        )}
      </Section>

      {/* Languages */}
      <Section
        title="Languages"
        form={langForm}
        table="languages"
        addDefault={{ language: "", level: "Beginner" }}
      >
        {(i) => (
          <>
            <Input {...regLang(`items.${i}.language`)} placeholder="Language" />
            <select {...regLang(`items.${i}.level`)} className="input">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Native">Native</option>
            </select>
          </>
        )}
      </Section>

      {/* Skills */}
      <Section
        title="Skills"
        form={skillForm}
        table="skills"
        addDefault={{ skill: "", category: "", level: "Beginner" }}
      >
        {(i) => (
          <>
            <Input {...regSkill(`items.${i}.skill`)} placeholder="Skill" />
            <Input {...regSkill(`items.${i}.category`)} placeholder="Category" />
            <select {...regSkill(`items.${i}.level`)} className="input">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </>
        )}
      </Section>
    </main>
  );
}