"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, WandSparkles, FileText, X, Check } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import UserMenu from "@/components/UserMenu";
import { PageHeading } from "@/components/PageHeading";
import LogoMain from "@/components/Logo";

const JD_STORAGE_KEY = "saved_job_description";
const COVER_LETTER_STORAGE_KEY = "generated_cover_letters";

interface SavedJobDescription {
    text: string;
    createdAt: string;
    lastUsed: string;
}

interface SavedCoverLetter {
    id: string;
    coverLetter: string;
    jobDescription: string;
    createdAt: string;
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
    },

    load: (): SavedJobDescription | null => {
        try {
            const stored = localStorage.getItem(JD_STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading job description:', error);
            return null;
        }
    },

    clear: () => {
        try {
            localStorage.removeItem(JD_STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing job description:', error);
        }
    }
};

const coverLetterStorage = {
    save: (coverLetter: string, jobDescription: string) => {
        try {
            const newCoverLetter: SavedCoverLetter = {
                id: Date.now().toString(),
                coverLetter,
                jobDescription,
                createdAt: new Date().toISOString()
            };

            const existing = coverLetterStorage.loadAll();
            const updated = [newCoverLetter, ...existing.slice(0, 4)]; // Keep only last 5
            localStorage.setItem(COVER_LETTER_STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving cover letter:', error);
        }
    },

    loadAll: (): SavedCoverLetter[] => {
        try {
            const stored = localStorage.getItem(COVER_LETTER_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading cover letters:', error);
            return [];
        }
    }
};

export default function CoverLetterPage() {

    const [jobDescription, setJobDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [error, setError] = useState("");
    const [showJDModal, setShowJDModal] = useState(false);
    const [savedJD, setSavedJD] = useState<SavedJobDescription | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);



    // Load saved job description on component mount
    useEffect(() => {
        const loadSavedJD = () => {
            const saved = jobDescriptionStorage.load();
            if (saved) {
                setSavedJD(saved);
                setShowJDModal(true);
            }
            setIsInitialized(true);
        };

        loadSavedJD();
    }, []);

    // Save job description whenever it changes (debounced)
    useEffect(() => {
        if (!isInitialized || !jobDescription.trim()) return;

        const timeoutId = setTimeout(() => {
            jobDescriptionStorage.save(jobDescription);
        }, 2000); // Save 2 seconds after user stops typing

        return () => clearTimeout(timeoutId);
    }, [jobDescription, isInitialized]);

    const handleUseSavedJD = () => {
        if (savedJD) {
            setJobDescription(savedJD.text);
            // Update last used timestamp
            jobDescriptionStorage.save(savedJD.text);
            toast.success("Job description loaded!");
        }
        setShowJDModal(false);
    };

    const handleCancelSavedJD = () => {
        setShowJDModal(false);
    };

    const generateCoverLetter = async () => {
        if (!jobDescription.trim()) {
            setError("Job description is required.");
            return;
        }

        // Get resume data directly from localStorage
        const storedResume = localStorage.getItem("tailored_resume_data");
        let resumeData = null;

        if (storedResume) {
            try {
                resumeData = JSON.parse(storedResume);
            } catch (e) {
                console.error("Error parsing stored resume:", e);
                setError("Error reading resume data. Please try again.");
                return;
            }
        }

        if (!resumeData) {
            setError("No resume found. Please create or upload a resume first.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/v1/cover-letter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    jobDescription,
                    resumeData,
                    tone: "professional"
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("API Error:", errorText);
                throw new Error(errorText || `HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();

            if (!data.coverLetter) {
                throw new Error("No cover letter received from server");
            }

            setCoverLetter(data.coverLetter);

            coverLetterStorage.save(data.coverLetter, jobDescription);
            jobDescriptionStorage.save(jobDescription);

            toast.success("Cover letter ready!");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error
                ? err.message
                : "Something went wrong. Please try again.";

            setError(errorMessage);
            console.error("Cover letter generation error:", err);
            toast.error("Failed to generate cover letter");
        } finally {
            setLoading(false);
        }
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

    const getPreviewText = (text: string, wordLimit: number = 200) => {
        const words = text.split(' ');
        if (words.length <= wordLimit) return text;
        return words.slice(0, wordLimit).join(' ') + '...';
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-50 text-gray-900 mx-auto space-y-6 pb-20">
            {/* Saved Job Description Modal */}
            {showJDModal && savedJD && (
                <Dialog open={showJDModal} onOpenChange={setShowJDModal}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Use Previous Job Description?
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <p className="text-sm text-blue-800 mb-2">
                                    <span className="font-medium">Found saved job description</span>
                                    <br />
                                    Last used: {formatDate(savedJD.lastUsed)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Preview (first 200 words):</Label>
                                <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {getPreviewText(savedJD.text)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleUseSavedJD}
                                    className="flex-1 flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Use This Job Description
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleCancelSavedJD}
                                    className="flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Start Fresh
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Header */}
            <div className="bg-white sticky top-0 z-50 w-full shadow">
                <div className="max-w-7xl w-full flex flex-col mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <Link className="" href="/dashboard">
                            <ArrowLeft />
                        </Link>

                        <LogoMain />

                        {/* Clear saved data button */}
                        {savedJD ? (
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => {
                                        jobDescriptionStorage.clear();
                                        setSavedJD(null);
                                        toast.success("Saved job description cleared");
                                    }}
                                    className="text-sm text-red-600 hover:text-red-800 transition-colors"
                                >
                                    Clear Saved JD
                                </button>
                                <UserMenu />
                            </div>
                        ) : (
                            <div className="w-[30%] flex items-center justify-end gap-2" >

                                <UserMenu />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <PageHeading title="Cover Letter" />

            <div className="bg-white mx-auto max-w-2xl flex flex-col gap-4 rounded-xl shadow-xl lg:p-6 p-4">
                <h2 className="text-2xl font-bold w-full mb-2 text-gray-600 text-center ">Paste Your Job Description</h2>

                {/* Auto-save indicator */}
                {jobDescription.trim() && isInitialized && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-2">
                        <p className="text-xs text-green-700 text-center">
                            ✓ Job description will be saved automatically
                        </p>
                    </div>
                )}

                <div className="w-full space-y-2">
                    <Label className="text-md hidden font-semibold text-gray-600" htmlFor="job-description">Job Description</Label>
                    <Textarea
                        id="job-description"
                        placeholder="Paste your job description, and we'll generate a polished cover letter designed to leave a lasting impression."
                        title="job-description"
                        className="w-full max-w-4xl h-64 border border-gray-400 rounded-md p-3 focus:ring-2 focus:ring-blue-500"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={8}
                    />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                    onClick={generateCoverLetter}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            Generating...
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </>
                    ) : (
                        <>
                            Generate Cover Letter
                            <WandSparkles className="w-4 h-4" />
                        </>
                    )}
                </Button>
            </div>

            {coverLetter && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="mt-4">View Cover Letter</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Your Cover Letter</DialogTitle>
                        </DialogHeader>
                        <Textarea
                            readOnly
                            value={coverLetter}
                            className="h-96"
                        />
                        <Button
                            className="mt-2 py-3 px-2"
                            size={"default"}
                            onClick={() => {
                                navigator.clipboard.writeText(coverLetter);
                                toast.success("Copied to clipboard!");
                            }}
                        >
                            Copy to Clipboard
                        </Button>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}