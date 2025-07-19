"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Loader2, WandSparkles, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import DownloadResumeButton from "@/components/DownloadResumeButton";
import ResumePDF from "@/lib/pdf-template";
import { ResumeData, Skill } from "@/lib/schemas";

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
  const [jdRaw, setJdRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ResumePreview | null>(null);
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);

  const steps = ["Paste JD", "Tailor Resume", "Preview & Download"];

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
      <div className="bg-white w-full shadow">
        <div className="max-w-7xl w-full flex flex-col mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="text-xl flex items-center gap-2 font-bold text-gray-900">
              <Link href="/dashboard">
                <ArrowLeft />
              </Link>
              Tailor Resume
            </div>

            {/* Clear storage button */}
            {preview && (
              <button
                onClick={clearStoredData}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear stored resume data"
              >
                <Trash2 className="w-4 h-4" />
                Clear Data
              </button>
            )}
          </div>

          {/* Progress dots */}
          <div className="overflow-hidden">
            <div className="flex md:items-center pt-4 pb-3 w-full lg:justify-center overflow-x-scroll">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex items-center space-x-1 p-2 pr-3 rounded-4xl bg-blue-50">
                    <div className="min-w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-800 text-nowrap">{s}</span>
                  </div>
                  {i < steps.length - 1 && <div className="w-6 lg:w-6 border-t border-2 border-blue-100" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Restored data notification */}
      {preview && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mx-4 w-full max-w-2xl">
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

      {/* JD Input */}
      <div className="bg-white mx-4 w-full max-w-2xl flex flex-col rounded-xl shadow-xl lg:p-6 p-4">
        <h2 className="text-2xl font-bold w-full mb-2 text-center ">Paste Job Description</h2>
        
        {/* Auto-save indicator */}
        {jdRaw.trim() && !isLoadingFromStorage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4">
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
            className="w-full max-w-4xl h-full max-h-h-72 border text-sm border-gray-400 rounded-lg px-3 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handle}
            disabled={loading}
            className="btn-primary rounded-lg flex text-base py-2 w-fit justify-center px-3 items-center space-x-2"
          >
            <span>{loading ? "Tailoring…" : "Tailor Your Resume"}</span>
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <WandSparkles className="w-4 h-4" />}
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

              <div className=" w-full flex flex-col items-center rounded-lg space-y-4">
                {/* Skills highlight */}
                <div className="w-full p-2 rounded-lg bg-gray-50">
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

                <div className="text-sm w-full min-h-[80vh] rounded-lg">
                  <div className="border rounded-lg " >
                    <ResumePDF data={preview.resume} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <DownloadResumeButton
                    resumeData={preview.resume}
                    fileName={`tailored-resume-${Date.now()}.pdf`}
                  />
                  
                  {/* Quick link to cover letter generation */}
                  <Link 
                    href="/cover-letter" 
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
                  >
                    Generate Cover Letter →
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