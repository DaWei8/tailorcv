“use client”;

import { useState, ChangeEvent, FormEvent, useRef } from “react”;
import {
UploadCloud,
Download,
FileText,
AlertCircle,
CheckCircle2,
XCircle,
Target,
TrendingUp,
Clock,
X,
RefreshCw,
ExternalLink
} from “lucide-react”;

/* ––––– Types ––––– */
interface ATSResult {
score: number;
strengths: string[];
improvements: string[];
summary: string;
matchedKeywords: string[];
missingKeywords: string[];
recommendations: string[];
}

interface ToastState {
message: string;
type: “success” | “error” | “warning”;
id: number;
}

/* ––––– Enhanced ATS Engine ––––– */
function runATS(resumeText: string, jdText: string): ATSResult {
const extractKeywords = (text: string): string[] => {
// Enhanced keyword extraction with better filtering
const commonWords = new Set([
‘the’, ‘and’, ‘or’, ‘but’, ‘in’, ‘on’, ‘at’, ‘to’, ‘for’, ‘of’, ‘with’, ‘by’,
‘from’, ‘as’, ‘is’, ‘are’, ‘was’, ‘were’, ‘be’, ‘been’, ‘have’, ‘has’, ‘had’,
‘do’, ‘does’, ‘did’, ‘will’, ‘would’, ‘could’, ‘should’, ‘may’, ‘might’, ‘must’,
‘can’, ‘this’, ‘that’, ‘these’, ‘those’, ‘a’, ‘an’, ‘we’, ‘you’, ‘they’, ‘it’,
‘he’, ‘she’, ‘him’, ‘her’, ‘his’, ‘their’, ‘our’, ‘my’, ‘your’, ‘years’, ‘year’,
‘experience’, ‘work’, ‘working’, ‘job’, ‘role’, ‘position’, ‘company’, ‘team’
]);

```
return text.toLowerCase()
  .match(/\b[a-z]+(?:[+#]|\b)/g) || []
  .filter(word => word.length > 2 && !commonWords.has(word))
  .filter(word => !/^\d+$/.test(word));
```

};

const jdKeywords = new Set(extractKeywords(jdText));
const resumeKeywords = new Set(extractKeywords(resumeText));

const matchedKeywords = […jdKeywords].filter(k => resumeKeywords.has(k));
const missingKeywords = […jdKeywords].filter(k => !resumeKeywords.has(k));

const score = jdKeywords.size > 0 ? Math.round((matchedKeywords.length / jdKeywords.size) * 100) : 0;

const getRecommendations = (score: number): string[] => {
const recommendations = [];

```
if (score < 30) {
  recommendations.push("Consider restructuring your resume to better align with the job requirements");
  recommendations.push("Focus on highlighting relevant technical skills and experience");
  recommendations.push("Use industry-specific terminology from the job description");
} else if (score < 60) {
  recommendations.push("Add more specific keywords from the job description");
  recommendations.push("Quantify your achievements with numbers and metrics");
  recommendations.push("Emphasize relevant projects and accomplishments");
} else if (score < 80) {
  recommendations.push("Fine-tune your resume with missing keywords");
  recommendations.push("Ensure your experience section directly addresses job requirements");
} else {
  recommendations.push("Your resume is well-aligned! Consider minor optimizations");
  recommendations.push("Focus on quantifying achievements and impact");
}

return recommendations;
```

};

const getSummary = (score: number): string => {
if (score >= 80) return “Excellent match! Your resume strongly aligns with the job requirements.”;
if (score >= 60) return “Good match with room for improvement. Focus on incorporating missing keywords.”;
if (score >= 40) return “Fair match. Consider significant updates to better align with the job description.”;
return “Low match. Your resume needs substantial revision to meet the job requirements.”;
};

return {
score,
matchedKeywords,
missingKeywords: missingKeywords.slice(0, 10),
strengths: matchedKeywords.length > 0
? matchedKeywords.slice(0, 8).map(k => `Strong alignment: ${k}`)
: [“No key skills detected from job description”],
improvements: missingKeywords.length > 0
? missingKeywords.slice(0, 8).map(k => `Consider adding: ${k}`)
: [“Great keyword coverage!”],
recommendations: getRecommendations(score),
summary: getSummary(score)
};
}

/* ––––– File Processing ––––– */
async function extractTextFromFile(file: File): Promise<string> {
return new Promise((resolve, reject) => {
const reader = new FileReader();
reader.onload = (e) => {
const text = e.target?.result as string;
// Simple text extraction - in production, you’d use proper PDF/Word parsers
resolve(text || “”);
};
reader.onerror = () => reject(new Error(“Failed to read file”));
reader.readAsText(file);
});
}

/* ––––– Report Generation ––––– */
function downloadReport(result: ATSResult, fileName: string) {
const reportContent = `
ATS RESUME SCAN REPORT
Generated: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════════════

OVERALL SCORE: ${result.score}/100

PERFORMANCE ANALYSIS:
${result.summary}

═══════════════════════════════════════════════════════════════

STRENGTHS IDENTIFIED:
${result.strengths.map((s, i) => `${i + 1}. ${s}`).join(’\n’)}

AREAS FOR IMPROVEMENT:
${result.improvements.map((i, idx) => `${idx + 1}. ${i}`).join(’\n’)}

RECOMMENDATIONS:
${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join(’\n’)}

═══════════════════════════════════════════════════════════════

KEYWORD ANALYSIS:
Matched Keywords (${result.matchedKeywords.length}): ${result.matchedKeywords.join(’, ‘)}
Missing Keywords (${result.missingKeywords.length}): ${result.missingKeywords.join(’, ’)}

═══════════════════════════════════════════════════════════════

NEXT STEPS:

1. Incorporate missing keywords naturally into your experience
1. Quantify your achievements with specific metrics
1. Tailor your resume for each application
1. Consider using Phasely (https://phasely.app) to plan your skill development

Disclaimer: This analysis is for guidance only. Always ensure your resume
truthfully represents your experience and qualifications.
`.trim();

const blob = new Blob([reportContent], { type: “text/plain;charset=utf-8” });
const url = URL.createObjectURL(blob);
const a = document.createElement(“a”);
a.href = url;
a.download = `${fileName}_ATS_Report.txt`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
}

/* ––––– Main Component ––––– */
export default function ATSScanner() {
const [file, setFile] = useState<File | null>(null);
const [jobDescription, setJobDescription] = useState(””);
const [loading, setLoading] = useState(false);
const [result, setResult] = useState<ATSResult | null>(null);
const [showModal, setShowModal] = useState(false);
const [toasts, setToasts] = useState<ToastState[]>([]);
const fileInputRef = useRef<HTMLInputElement>(null);

const addToast = (message: string, type: “success” | “error” | “warning”) => {
const id = Date.now();
setToasts(prev => […prev, { message, type, id }]);
setTimeout(() => {
setToasts(prev => prev.filter(t => t.id !== id));
}, 5000);
};

const removeToast = (id: number) => {
setToasts(prev => prev.filter(t => t.id !== id));
};

const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
const uploadedFile = e.target.files?.[0];
if (!uploadedFile) return;

```
const validTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];

if (!validTypes.includes(uploadedFile.type)) {
  addToast("Please upload a PDF, Word document, or text file", "error");
  return;
}

if (uploadedFile.size > 10 * 1024 * 1024) { // 10MB limit
  addToast("File size must be less than 10MB", "error");
  return;
}

setFile(uploadedFile);
addToast("Resume uploaded successfully!", "success");
```

};

const handleSubmit = async (e: FormEvent) => {
e.preventDefault();

```
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
  const resumeText = await extractTextFromFile(file);
  const analysisResult = runATS(resumeText, jobDescription);
  setResult(analysisResult);
  setShowModal(true);
  addToast("Analysis complete!", "success");
} catch (error) {
  addToast("Error processing your resume. Please try again.", "error");
} finally {
  setLoading(false);
}
```

};

const resetForm = () => {
setFile(null);
setJobDescription(””);
setResult(null);
setShowModal(false);
if (fileInputRef.current) {
fileInputRef.current.value = “”;
}
};

const getScoreColor = (score: number) => {
if (score >= 80) return “text-green-600”;
if (score >= 60) return “text-yellow-600”;
if (score >= 40) return “text-orange-600”;
return “text-red-600”;
};

const getScoreBackground = (score: number) => {
if (score >= 80) return “bg-green-50 border-green-200”;
if (score >= 60) return “bg-yellow-50 border-yellow-200”;
if (score >= 40) return “bg-orange-50 border-orange-200”;
return “bg-red-50 border-red-200”;
};

return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
{/* Toast Container */}
<div className="fixed top-4 right-4 z-50 space-y-2">
{toasts.map(toast => (
<div
key={toast.id}
className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 ${ toast.type === "success" ? "bg-green-500" :  toast.type === "error" ? "bg-red-500" : "bg-orange-500" }`}
>
{toast.type === “success” && <CheckCircle2 size={16} />}
{toast.type === “error” && <XCircle size={16} />}
{toast.type === “warning” && <AlertCircle size={16} />}
{toast.message}
<button onClick={() => removeToast(toast.id)} className=“ml-2”>
<X size={14} />
</button>
</div>
))}
</div>

```
  <div className="max-w-4xl mx-auto py-8 px-4">
    {/* Header */}
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        ATS Resume Scanner
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Upload your resume and job description to get an instant ATS compatibility score 
        with actionable insights to improve your chances.
      </p>
    </div>

    {/* Main Form */}
    <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <UploadCloud className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : "Click to upload your resume"}
                </p>
                <p className="text-xs text-gray-500">
                  PDF, Word, or Text files (max 10MB)
                </p>
              </div>
            </label>
          </div>
          {file && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <FileText size={16} />
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
            placeholder="Paste the complete job description here. Include requirements, responsibilities, and preferred qualifications for the most accurate analysis..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            <strong>Tip:</strong> For best results, use the complete job posting including requirements and qualifications.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                Run ATS Analysis
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </div>

    {/* Disclaimer */}
    <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg mb-8">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-amber-800 mb-2">Important Notice</h3>
          <p className="text-amber-700 text-sm leading-relaxed">
            <strong>Integrity First:</strong> Falsifying work experience or skills is fraudulent and can lead to serious consequences. 
            This tool is designed to help you optimize your <em>genuine</em> qualifications. Take time to actually develop the skills you lack.
          </p>
          <p className="text-amber-700 text-sm mt-2">
            <strong>Need help planning your learning journey?</strong> Try{" "}
            <a 
              href="https://phasely.app" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-amber-800 font-medium hover:text-amber-900 underline inline-flex items-center gap-1"
            >
              Phasely <ExternalLink size={12} />
            </a>
            {" "}to create structured learning plans and track your progress.
          </p>
        </div>
      </div>
    </div>

    {/* Results Modal */}
    {showModal && result && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                ATS Analysis Results
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Score Display */}
            <div className={`text-center p-6 rounded-lg border-2 ${getScoreBackground(result.score)}`}>
              <div className={`text-6xl font-bold ${getScoreColor(result.score)} mb-2`}>
                {result.score}
                <span className="text-2xl text-gray-500">/100</span>
              </div>
              <p className="text-gray-700 font-medium">{result.summary}</p>
            </div>

            {/* Analysis Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Strengths ({result.matchedKeywords.length})
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Areas for Improvement ({result.missingKeywords.length})
                </h3>
                <ul className="space-y-2">
                  {result.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => downloadReport(result, file?.name.split('.')[0] || 'Resume')}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Detailed Report
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
```
);
}