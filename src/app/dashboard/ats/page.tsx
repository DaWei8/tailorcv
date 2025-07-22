"use client";

import { useState, ChangeEvent, FormEvent, useRef } from "react";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  ArrowLeft,
  TrendingUp, // Added for the modal header icon
  Target, // Added for the button icon
} from "lucide-react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import { PageHeading } from "@/components/PageHeading";
import LogoMain from "@/components/Logo";
import toast from "react-hot-toast"; // Ensure react-hot-toast is correctly imported and configured
import AtsReportViewer, { AtsReport } from "@/components/ATSReportViewer";

interface ToastState {
  message: string;
  type: "success" | "error" | "warning";
  id: number;
}

async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text || "");
    };
    reader.onerror = (error) => reject(new Error(`Failed to read file: ${error?.target?.error?.message || 'Unknown error'}`));
    reader.readAsText(file);
  });
}

export default function ATSScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsReport | null>(null);
  const [showModal, setShowModal] = useState(false); // This needs to be set to true
  const [toasts, setToasts] = useState<ToastState[]>([]); // For custom toasts, though react-hot-toast is also used
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error

  const generateATSResult = async (resumeFile: File, jobDescription: string): Promise<AtsReport | undefined> => {
    if (!jobDescription.trim()) {
      toast.error("Job description is required.");
      return;
    }

    let resumeText: string;
    try {
      resumeText = await extractTextFromFile(resumeFile); // AWAIT the file extraction
      if (!resumeText.trim()) {
        toast.error("Extracted resume content is empty. Please check your resume file.");
        return;
      }
    } catch (e) {
      console.error("Error reading resume data:", e);
      toast.error("Error reading resume data. Please ensure it's a valid text, PDF, or DOCX file.");
      return;
    }

    console.log(resumeText)

    setLoading(true);
    // toast.error(""); // Removed: This was creating an empty error toast

    try {
      const res = await fetch("/api/v1/ats-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jobDescription,
          resumeData: resumeText, // Send the actual text content
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error", details: "Failed to parse error response" }));
        console.error("API Error:", errorData);
        // Use the error message from the API if available, otherwise a generic one
        throw new Error(errorData.error || errorData.details || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (!data.atsReport) {
        throw new Error("No ATS report received from server");
      }

      toast.success("ATS report ready!");
      return data.atsReport; // Return only the atsReport object
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : "Something went wrong. Please try again.";

      toast.error(errorMessage); // Display specific error from API or generic
      console.error("ATS report generation error:", err);
      // Removed redundant toast.error("Failed to generate ATS report");
      return undefined; // Ensure a consistent return type on error
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  // Remove file
  const removeFile = () => {
    setFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const addToast = (message: string, type: "success" | "error" | "warning") => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleFile = (fileToProcess: File | null | undefined) => {
    if (!fileToProcess) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];

    if (!validTypes.includes(fileToProcess.type)) {
      addToast("Please upload a PDF, Word document, or text file", "error");
      return;
    }

    if (fileToProcess.size > 10 * 1024 * 1024) {
      addToast("File size must be less than 10MB", "error");
      return;
    }

    setFile(fileToProcess);
    setUploadStatus('success');
    addToast("Resume uploaded successfully!", "success");
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file) {
      addToast("Please upload your resume", "error");
      return;
    }

    if (!jobDescription.trim()) {
      addToast("Please enter the job description", "error");
      return;
    }

    if (jobDescription.trim().length < 100) {
      addToast("Job description seems too short. Please provide a detailed job description", "warning");
      return;
    }

    setLoading(true);

    try {
      const analysisResult = await generateATSResult(file, jobDescription);
      if (analysisResult) { // Only set result and show modal if analysis was successful
        setResult(analysisResult);
        setShowModal(true); // <-- THIS IS THE KEY FIX
        addToast("Analysis complete!", "success");
      }
    } catch (error) {
      console.error(error);
      // The generateATSResult already handles toast.error, so this might be redundant
      // addToast("Error processing your resume. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setJobDescription("");
    setResult(null);
    setShowModal(false); // Reset modal state
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen h-full w-full flex flex-col gap-2 items-center bg-gray-50 pb-20">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-md shadow-lg text-white text-sm font-medium transition-all duration-300 ${toast.type === "success" ? "bg-green-500" : toast.type === "error" ? "bg-red-500" : "bg-orange-500"}`}
          >
            {toast.type === "success" && <CheckCircle2 size={16} />}
            {toast.type === "error" && <XCircle size={16} />}
            {toast.type === "warning" && <AlertCircle size={16} />}
            {toast.message}
            <div onClick={() => removeToast(toast.id)} className="ml-2 cursor-pointer">
              <X size={14} />
            </div>
          </div>
        ))}
      </div>
      {/* Header */}
      <div className="bg-white w-full sticky top-0 z-50 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link className="text-gray-800" href="/dashboard">
              <ArrowLeft />
            </Link>
            <LogoMain />
            <div className="flex items-center justify-end " >
              <UserMenu />
            </div>
          </div>

        </div>
      </div>
      <PageHeading title="ATS Engine" />
      <div className="w-full mx-auto text-sm flex flex-col gap-8 lg:px-8 px-4 ">
        {/* Main Form */}

        <div className="bg-white mx-auto max-w-2xl gap-4 flex flex-col rounded-xl shadow-xl lg:p-6 p-4">
          <h2 className="text-2xl font-bold w-full mb-2 text-gray-600 text-center">Fix and Upgrade your resume</h2>
          <p className="bg-blue-50 text-sm border text-blue-400 border-blue-200 rounded-md p-4">
            Upload your resume and job description to get an instant ATS compatibility score
            with actionable insights to improve your chances.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div className="max-w-2xl mx-auto bg-white">
              <div className="mb-6">
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  Upload Your Resume
                </label>

                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />

                  <label
                    htmlFor="resume-upload"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                   flex flex-col items-center justify-center w-full h-32
                   border-2 border-dashed rounded-md cursor-pointer
                   transition-all duration-200 ease-in-out
                   ${isDragOver
                        ? 'border-blue-500 bg-blue-50 scale-105'
                        : file
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }
                  `}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <UploadCloud
                        className={`w-8 h-8 transition-colors ${isDragOver ? 'text-blue-500' :
                          file ? 'text-green-500' : 'text-gray-400'
                          }`}
                      />
                      <p className="text-sm font-medium text-gray-600">
                        {isDragOver
                          ? "Drop your file here"
                          : file
                            ? "File ready! Click to change"
                            : "Drag & drop your resume here"
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {!isDragOver && "or click to browse"}
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, Word, or Text files (max 10MB)
                      </p>
                    </div>
                  </label>
                </div>

                {/* File Preview */}
                {file && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-md border">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-xs">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={removeFile}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        title="Remove file"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    {uploadStatus === 'success' && (
                      <div className="mt-3 text-sm text-green-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Ready to submit
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Button */}
                {file && (
                  <div className="mt-4">
                    <button
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium
                         hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Process Resume
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                placeholder="Paste the complete job description here. Include requirements, responsibilities, and preferred qualifications for the most accurate analysis..."
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                <strong>Tip:</strong> For best results, use the complete job posting including requirements and qualifications.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Run ATS Analysis
                    <Target className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gradient-to-br from-blue-50 to-indigo-100transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Results Modal */}
        {showModal && result && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 z-40 sticky bg-white top-0 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    ATS Analysis Results
                  </h2>
                  <div
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X size={24} />
                  </div>
                </div>
              </div>
              <AtsReportViewer atsReport={result} />
            </div>
          </div>
        )}
      </div>
    </div >
  );
}