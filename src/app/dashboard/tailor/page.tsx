"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Download, WandSparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ParsedJD {
  title: string;
  required_skills: string[];
  responsibilities: string[];
  nice_to_have: string[];
}

interface ResumePreview {
  id: string;
  resume: unknown;
  atsScore: number;
}

export default function TailorPage() {
  const [jdRaw, setJdRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ResumePreview | null>(null);

  const steps = ["Parse JD", "Tailor Resume", "Preview & Download"];

  const handle = async () => {
    if (!jdRaw.trim()) return toast.error("Paste a job description first.");
    setLoading(true);

    try {
      const parsed: ParsedJD = await fetch("/api/v1/parse-job-description", {
        method: "POST",
        body: JSON.stringify({ rawText: jdRaw }),
      }).then((r) => r.json());

      const tailor = await fetch("/api/v1/tailor-resume", {
        method: "POST",
        body: JSON.stringify({ jobDescription: parsed }),
      }).then((r) => r.json());

      setPreview(tailor);
      toast.success("Resume ready!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!preview) return;
    window.open(`/api/v1/download-pdf?id=${preview.id}`, "_blank");
  };

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
          </div>
          {/* Progress dots */}
          <div className="overflow-hidden" >
            <div className="flex items-center pt-4 pb-3 w-full justify-center overflow-x-scroll">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex items-center space-x-1 p-2 pr-3 rounded-4xl bg-blue-50">
                    <div className="min-w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-800 text-nowrap">{s}</span>
                  </div>
                  {i < steps.length - 1 && <div className="w-6 lg:w-16 border-t border-2 border-blue-100" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* JD Input */}
      <div className="w-full max-w-7xl flex flex-col gap-4 items-center justify-center mx-auto px-4 sm:px-6 lg:px-8" >
        <textarea
          value={jdRaw}
          onChange={(e) => setJdRaw(e.target.value)}
          rows={10}
          placeholder="Paste the full job description here..."
          className="w-full max-w-4xl border border-gray-400 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handle}
          disabled={loading}
          className="btn-primary flex text-sm py-3 max-w-sm w-full justify-center px-3 items-center space-x-2"
        >
          <span >{loading ? "Working…" : "Tailor Resume"}</span>
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <WandSparkles className="w-4 h-4" />}
        </button>

        {/* Preview section */}
        {preview && (
          <div className="border rounded p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Preview</h2>
              <span className="text-sm font-medium text-green-600">
                ATS Score: {preview.atsScore}%
              </span>
            </div>

            {/* Skills highlight */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Skills matched</h3>
              <div className="flex flex-wrap gap-2">
                {(preview.resume as { skills?: string[] })?.skills?.map((s, i) => (
                  <span
                    key={i}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer">Show resume JSON</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(preview.resume, null, 2)}
              </pre>
            </details>

            <button onClick={download} className="btn-primary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
