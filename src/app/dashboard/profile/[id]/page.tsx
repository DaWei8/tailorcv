"use client";

import { useEffect, useState } from "react";
import { FieldValues, useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase";
import { PlusCircle, Trash2, ChevronLeft, ChevronRight, User, Briefcase, GraduationCap, Award, Globe, Wrench, ArrowLeft, Star } from "lucide-react";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

/* ---------- Schemas & Types ---------- */
import { profileSchema, experienceSchema, educationSchema, certSchema, langSchema, skillSchema } from "@/lib/schemas";
import type { ProfileForm, ExperienceForm, EducationForm, CertForm, LangForm, SkillForm, Profile } from "@/lib/schemas";
import Link from "next/link";

// Ensure schemas align with form types
const experienceArraySchema = z.object({ items: z.array(experienceSchema) });
const educationArraySchema = z.object({ items: z.array(educationSchema) });
const certArraySchema = z.object({ items: z.array(certSchema) });
const langArraySchema = z.object({ items: z.array(langSchema) });
const skillArraySchema = z.object({ items: z.array(skillSchema) });

/* ---------- Step Configuration ---------- */
const steps = [
    { id: "basics", title: "Basic Info", icon: User },
    { id: "experience", title: "Experience", icon: Briefcase },
    { id: "education", title: "Education", icon: GraduationCap },
    { id: "certifications", title: "Certifications", icon: Award },
    { id: "languages", title: "Languages", icon: Globe },
    { id: "skills", title: "Skills", icon: Wrench },
];

/* ---------- Helpers ---------- */
const getUserId = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        toast.error("Failed to get user ID");
        return null;
    }
    console.log(data?.user?.id)
    return data.user.id;
};

/* ---------- Reusable Section ---------- */
interface SectionProps<T> {
    title: string;
    form: UseFormReturn<{ items: T[] }>;
    table: string;
    addDefault: T;
    profileId: string;
    children: (index: number, field: T & { id: string }) => React.ReactNode;
}

function Section<T extends FieldValues>({ title, form, table, addDefault, profileId, children }: SectionProps<T>) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,  
        name: "items" as never,
    });

    useEffect(() => {
        (async () => {
            const supabase = createClient();
            const { data, error } = await supabase.from(table).select().eq("user_profile_id", profileId);
            if (error) {
                toast.error(`Failed to load ${title}`);
                return;
            }
            form.reset({ items: data || [] });
        })();
    }, [table, form, title, profileId]);

    const save = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error('Not authenticated');
            return;
        }

        // Verify the user_profile_id belongs to the current user
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profileData) {
            toast.error('Could not verify user profile');
            return;
        }

        const payload = form.getValues("items").map(item => ({
            ...item,
            user_profile_id: profileData.id // Use the verified profile ID
        }));

        const { data, error } = await supabase
            .from(table)
            .upsert(payload)
            .select();

        if (error) {
            console.error('Detailed Save Error:', {
                message: error.message,
                details: error.details,
                code: error.code
            });
            toast.error(`Failed to save ${title} - ${data}: ${error.message}`);
            return;
        }

        toast.success(`${title} saved successfully`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
                <button
                    type="button"
                    onClick={() => append({ ...addDefault, id: uuidv4() } as T)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label={`Add new ${title}`}
                >
                    <PlusCircle size={16} />
                </button>
            </div>

            <div className="space-y-4">
                {fields.map((field, i) => (
                    <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="space-y-4">
                            {children(i, field as T & { id: string })}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => remove(i)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                aria-label={`Remove ${title} item`}
                            >
                                <Trash2 size={16} className="mr-2" />
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={save}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Save {title}
                </button>
            </div>
        </div>
    );
}

/* ---------- MAIN PAGE ---------- */
export default function ProfileEditPage() {
    const params = useParams();
    const router = useRouter();
    const userProfileId = params.id as string;
    const [currentStep, setCurrentStep] = useState(0);
    const [profile, setProfile] = useState<Profile | null>(null);

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

    /* Load profile info and basic profile once */
    useEffect(() => {
        if (!userProfileId) return;

        (async () => {
            const uid = await getUserId();
            if (!uid) return;

            const supabase = createClient();

            // Load profile info
            const { data: profile, error: profileError } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("id", userProfileId)
                .single();

            if (profileError) {
                toast.error("Profile not found");
                router.push("/dashboard/profile");
                return;
            }

            setProfile(profile);

            // Load basic profile data
            const { data, error } = await supabase.from("user_profiles").select().eq("id", userProfileId).single();
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                toast.error("Failed to load profile");
                return;
            }
            if (data) {
                Object.entries(data).forEach(([key, value]) => {
                    if (key in profileSchema.shape) {
                        setValue(key as keyof ProfileForm, value as ProfileForm[keyof ProfileForm]);
                    }
                });
            }
        })();
    }, [userProfileId, setValue, router]);

    const saveProfile = async (data: ProfileForm) => {
        const supabase = createClient();

        // Get the current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Not authenticated");
            return;
        }
        if (!userProfileId) {
            toast.error("Invalid profile ID");
            return;
        }
        const payload = {
            id: userProfileId,
            ...data,
            user_id: user.id
        };

        const { data: upsertedData, error } = await supabase
            .from("user_profiles")
            .upsert(payload)
            .select()
            .single();

        if (error) {
            console.error('Detailed Profile Save Error:', {
                message: error.message,
                details: error.details,
                code: error.code
            });
            toast.error(`Failed to save profile: ${error.message}`);
            return;
        }

        toast.success("Profile saved successfully");
        return upsertedData;
    };

    /* Common Input Component */
    const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
        <input
            {...props}
            className={`block w-full px-2 text-gray-700 placeholder-gray-300 min-h-[42px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
        />
    );

    const TextArea = ({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
        <textarea
            {...props}
            className={`block w-full rounded-md px-2 placeholder-gray-300 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
        />
    );

    const Select = ({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
        <select
            {...props}
            className={`block w-full px-2 text-gray-700 placeholder-gray-300 min-h-[42px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
        />
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                            <form onSubmit={handleSubmit(saveProfile)} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <Input {...register("full_name")} placeholder="Enter your full name" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                        <Input {...register("phone")} placeholder="Enter your phone number" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Professional Headline</label>
                                    <Input {...register("headline")} placeholder="e.g., Senior Software Engineer" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
                                    <TextArea {...register("summary")} rows={4} placeholder="Brief summary of your professional background" />
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                        <Input {...register("city")} placeholder="Enter your city" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                        <Input {...register("country")} placeholder="Enter your country" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                                        <Input {...register("linkedin_url")} placeholder="https://linkedin.com/in/yourprofile" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                                        <Input {...register("website_url")} placeholder="https://yourwebsite.com" />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Save Basic Info
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <Section
                        title="Experience"
                        form={expForm}
                        table="experiences"
                        profileId={userProfileId}
                        addDefault={{ job_title: "", company: "", location: "", start_date: "", end_date: "", description: "", achievements: [], skills: [] }}
                    >
                        {(i) => (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                                    <Input {...regExp(`items.${i}.job_title`)} placeholder="e.g., Senior Software Engineer" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                                    <Input {...regExp(`items.${i}.company`)} placeholder="e.g., Google" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                    <Input {...regExp(`items.${i}.location`)} placeholder="e.g., San Francisco, CA" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                    <Input {...regExp(`items.${i}.start_date`)} type="date" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                    <Input {...regExp(`items.${i}.end_date`)} type="date" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <TextArea {...regExp(`items.${i}.description`)} rows={3} placeholder="Describe your role and responsibilities" />
                                </div>
                            </div>
                        )}
                    </Section>
                );

            case 2:
                return (
                    <Section
                        title="Education"
                        form={eduForm}
                        table="education"
                        profileId={userProfileId}
                        addDefault={{ school: "", degree: "", field: "", start_date: "", end_date: "", gpa: 0, description: "" }}
                    >
                        {(i) => (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                                    <Input {...regEdu(`items.${i}.school`)} placeholder="e.g., Stanford University" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                                    <Input {...regEdu(`items.${i}.degree`)} placeholder="e.g., Bachelor of Science" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                                    <Input {...regEdu(`items.${i}.field`)} placeholder="e.g., Computer Science" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">GPA</label>
                                    <Input {...regEdu(`items.${i}.gpa`)} type="number" step="0.01" placeholder="3.8" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                    <Input {...regEdu(`items.${i}.start_date`)} type="date" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                    <Input {...regEdu(`items.${i}.end_date`)} type="date" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <TextArea {...regEdu(`items.${i}.description`)} rows={3} placeholder="Additional details about your education" />
                                </div>
                            </div>
                        )}
                    </Section>
                );

            case 3:
                return (
                    <Section
                        title="Certifications"
                        form={certForm}
                        table="certifications"
                        profileId={userProfileId}
                        addDefault={{ name: "", issuer: "", issue_date: "", expiry_date: "", credential_id: "", credential_url: "" }}
                    >
                        {(i) => (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Certification Name</label>
                                    <Input {...regCert(`items.${i}.name`)} placeholder="e.g., AWS Solutions Architect" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Organization</label>
                                    <Input {...regCert(`items.${i}.issuer`)} placeholder="e.g., Amazon Web Services" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
                                    <Input {...regCert(`items.${i}.issue_date`)} type="date" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                    <Input {...regCert(`items.${i}.expiry_date`)} type="date" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Credential ID</label>
                                    <Input {...regCert(`items.${i}.credential_id`)} placeholder="Certificate ID" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Credential URL</label>
                                    <Input {...regCert(`items.${i}.credential_url`)} placeholder="https://verify.certificate.com" />
                                </div>
                            </div>
                        )}
                    </Section>
                );

            case 4:
                return (
                    <Section <LangForm>
                        title="Languages"
                        form={langForm}
                        table="languages"
                        profileId={userProfileId}
                        addDefault={{ language: "", level: "Beginner" }}
                    >
                        {(i) => (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                    <Input {...regLang(`items.${i}.language`)} placeholder="e.g., English" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Proficiency Level</label>
                                    <Select {...regLang(`items.${i}.level`)}>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Native">Native</option>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </Section>
                );

            case 5:
                return (
                    <Section <SkillForm>
                        title="Skills"
                        form={skillForm}
                        table="skills"
                        profileId={userProfileId}
                        addDefault={{ skill: "", category: "", level: "Beginner" }}
                    >
                        {(i) => (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Skill</label>
                                    <Input {...regSkill(`items.${i}.skill`)} placeholder="e.g., JavaScript" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <Input {...regSkill(`items.${i}.category`)} placeholder="e.g., Programming" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                                    <Select {...regSkill(`items.${i}.level`)}>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </Section>
                );

            default:
                return null;
        }
    };

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 ">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <Link className="w-8 h-8 text-gray-700 hover:text-gray-900" href="/dashboard/profile">
                            <ArrowLeft />
                        </Link>
                        <div className="flex items-center">
                            <h1 className="text-xl flex items-center justify-center font-bold text-gray-900">
                                {profile.full_name}
                            </h1>
                            {profile.is_master && (
                                <Star className="w-5 h-5 text-yellow-500 ml-2 fill-current" />
                            )}
                        </div>
                        <div className="text-sm text-gray-500">
                            Step {currentStep + 1} of {steps.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Navigation */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center md:justify-center lg:space-x-6 space-x-4 w-full overflow-x-scroll " aria-label="Tabs">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setCurrentStep(index)}
                                    className={`${index === currentStep
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                                >
                                    <Icon size={16} />
                                    <span>{step.title}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {renderStepContent()}
            </div>

            {/* Navigation Footer */}
            <div className="bg-white border-t">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between">
                        <button
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0}
                            className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${currentStep === 0
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                : 'text-gray-700 bg-white hover:bg-gray-50'
                                }`}
                        >
                            <ChevronLeft size={16} className="mr-2" />
                            Previous
                        </button>

                        <button
                            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                            disabled={currentStep === steps.length - 1}
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${currentStep === steps.length - 1
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                : 'text-white bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            Next
                            <ChevronRight size={16} className="ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}