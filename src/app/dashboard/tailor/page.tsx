"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Loader2, WandSparkles, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import DownloadResumeButton from "@/components/DownloadResumeButton";
import { ResumeData, Skill } from "@/lib/schemas";
import UserMenu from "@/components/UserMenu";
import ResumePDF from "@/components/resume-templates/ResumePDf";
import { PageHeading } from "@/components/PageHeading";
import LogoMain from "@/components/Logo";


interface ParsedJD {
  title: string;
  required_skills: string[];
  responsibilities: string[];
  nice_to_have: string[];
}

interface ResumePreview {
  id: string;
  resume: ResumeData;
  jobDescription?: ParsedJD;
  jobDescriptionRaw?: string; // Store the raw JD text
  createdAt: string;
}

// Storage utilities
const STORAGE_KEY = "tailored_resume_data";
const JD_STORAGE_KEY = "saved_job_description"; // Shared with cover letter page

interface SavedJobDescription {
  text: string;
  createdAt: string;
  lastUsed: string;
}

const jobDescriptionStorage = {
  save: (jdText: string) => {
    try {
      const savedData: SavedJobDescription = {
        text: jdText,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };
      localStorage.setItem(JD_STORAGE_KEY, JSON.stringify(savedData));
    } catch (error) {
      console.error('Error saving job description:', error);
    }
  }
};

const storageUtils = {
  save: (data: ResumePreview) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('Resume data saved to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  load: (): ResumePreview | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Resume data loaded from localStorage');
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Resume data cleared from localStorage');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

export default function TailorPage() {

  // if (!user) {
  //   redirect('/dashboard')
  // }
  const [jdRaw, setJdRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ResumePreview | null>(null);
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);

  // const steps = ["Paste the Job Info", "Tailor Your Resume", "Preview & Download", "Generate Cover Letter"];

  // Load saved data on component mount
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    const loadSavedData = () => {
      const savedData = storageUtils.load();
      if (savedData) {
        setPreview(savedData);
        // Restore the raw job description if available
        if (savedData.jobDescriptionRaw) {
          setJdRaw(savedData.jobDescriptionRaw);
        }
        toast.success("Restored your previous resume!");
      }
      setIsLoadingFromStorage(false);
    };

    loadSavedData();
  }, [isLoadingFromStorage]);

  // Save to storage whenever preview changes
  useEffect(() => {
    if (preview && !isLoadingFromStorage) {
      storageUtils.save(preview);
    }
  }, [preview, isLoadingFromStorage]);

  // Save job description whenever it changes (debounced)
  useEffect(() => {
    if (!isLoadingFromStorage && jdRaw.trim()) {
      const timeoutId = setTimeout(() => {
        jobDescriptionStorage.save(jdRaw);
      }, 2000); // Save 2 seconds after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [jdRaw, isLoadingFromStorage]);

  const handle = async () => {
    if (!jdRaw.trim()) return toast.error("Paste a job description first.");
    setLoading(true);

    try {
      const parsed: ParsedJD = await fetch("/api/v1/parse-job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: jdRaw }),
      }).then((r) => r.json());

      const tailor = await fetch("/api/v1/tailor-resume", {
        method: "POST",
        body: JSON.stringify({ jobDescription: parsed }),
      }).then((r) => r.json());

      // Add metadata for storage, including raw job description
      const resumeWithMetadata: ResumePreview = {
        ...tailor,
        jobDescription: parsed,
        jobDescriptionRaw: jdRaw, // Save the original raw text
        createdAt: new Date().toISOString()
      };

      setPreview(resumeWithMetadata);

      // Save job description for cover letter use
      jobDescriptionStorage.save(jdRaw);

      toast.success("Resume ready!");
    } catch (error) {
      console.error('Tailoring error:', error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const clearStoredData = () => {
    storageUtils.clear();
    setPreview(null);
    setJdRaw("");
    toast.success("Cleared stored resume data");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoadingFromStorage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin w-5 h-5" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 text-gray-900 mx-auto space-y-6 pb-20">

      {/* Header */}
      <div className="bg-white sticky top-0 z-50 w-full shadow">
        <div className="max-w-7xl w-full flex flex-col mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link className="" href="/dashboard">
              <ArrowLeft />
            </Link>
            <LogoMain />
            {/* Clear storage button */}
            {preview ? (
              <div className="flex items-center justify-end gap-2 float-right" >
                <UserMenu />
              </div>
            ) : (
              <UserMenu />
            )}
          </div>
        </div>
      </div>
      <PageHeading title="Tailor Your Resume" />

      {/* Restored data notification */}

      {/* JD Input */}
      <div className="bg-white mx-4 w-full max-w-2xl flex flex-col rounded-xl shadow-xl lg:p-6 p-4">
        <h2 className="text-2xl font-bold w-full mb-2 text-gray-600 text-center ">Paste Job Description</h2>

        {/* Auto-save indicator */}
        {jdRaw.trim() && !isLoadingFromStorage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-2 mb-4">
            <p className="text-xs text-green-700 text-center">
              ✓ Job description will be saved for cover letter generation
            </p>
          </div>
        )}

        <div className="w-full flex flex-col gap-4 items-center justify-center">
          <textarea
            value={jdRaw}
            onChange={(e) => setJdRaw(e.target.value)}
            rows={10}
            placeholder="Paste your job description to instantly generate a tailored resume that aligns perfectly with the role."
            className="w-full max-w-4xl h-full max-h-h-72 border text-sm border-gray-400 rounded-md px-3 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handle}
            disabled={loading}
            className="btn-primary rounded-md flex text-base py-3 w-full justify-center px-3 items-center space-x-2"
          >
            <span>{loading ? "Tailoring…" : "Tailor Your Resume"}</span>
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <WandSparkles className="w-4 h-4" />}
          </button>
          {preview && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mx-4 w-full max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Resume restored!</span> Last generated on {formatDate(preview.createdAt)}
                  </p>
                  {preview.jobDescriptionRaw && (
                    <p className="text-xs text-green-600 mt-1">
                      Job description also available for cover letter generation
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
                <button
                  onClick={clearStoredData}
                  className="flex items-center w-full justify-center bg-red-100 gap-2 px-3 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Clear stored resume data"
                >
                  Clear Resume Data
                  <Trash2 className="w-4 h-4" />
                </button>
          {/* Preview section */}
          {preview && (
            <div className="w-full flex mt-10 flex-col gap-4 items-center justify-center">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold">Preview resume</h2>
                {preview.createdAt && (
                  <span className="text-xs text-gray-500">
                    Generated: {formatDate(preview.createdAt)}
                  </span>
                )}
              </div>

              <div className=" w-full flex flex-col items-center rounded-md space-y-4">


                <div className="text-sm w-full min-h-[80vh] rounded-md">
                  <div className="border rounded-md " >
                    <ResumePDF data={preview.resume} />
                  </div>
                  {/* Skills highlight */}
                  <div className="w-full p-2 rounded-md bg-gray-50">
                    <h3 className="text-sm font-semibold mb-2">Skills matched</h3>
                    <div className="flex flex-wrap gap-2">
                      {(preview.resume.skills.map((s: Skill) => s.skill) as { skills?: string[] })?.skills?.map((s, i) => (
                        <span
                          key={i}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <DownloadResumeButton
                    resumeData={preview.resume}
                    fileName={`tailored-resume-${Date.now()}.pdf`}
                  />

                  {/* Quick link to cover letter generation */}
                  <Link
                    href="/dashboard/cover-letter"
                    className="flex-1 bg-green-600 text-white py-3 px-3 rounded-md hover:bg-green-700 transition-colors text-center"
                  >
                    Generate Cover Letter
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}