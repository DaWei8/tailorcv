"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Download, Eye } from "lucide-react";

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
    <div className="max-w-4xl text-gray-900 mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Tailor a Resume</h1>

      {/* Progress dots */}
      <div className="flex items-center gap-2 ">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
              {i + 1}
            </div>
            <span className="text-sm">{s}</span>
            {i < steps.length - 1 && <div className="w-16 border-t border-gray-400" />}
          </div>
        ))}
      </div>

      {/* JD Input */}
      <textarea
        value={jdRaw}
        onChange={(e) => setJdRaw(e.target.value)}
        rows={10}
        placeholder="Paste the full job description here..."
        className="w-full border rounded p-3 focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={handle}
        disabled={loading}
        className="btn-primary flex items-center space-x-2"
      >
        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Eye className="w-4 h-4" />}
        <span>{loading ? "Working…" : "Tailor Resume"}</span>
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
  );
}