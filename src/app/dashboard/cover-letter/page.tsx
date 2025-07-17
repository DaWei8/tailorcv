// app/cover-letter/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CoverLetterPage() {
    const [jobDescription, setJobDescription] = useState("");
    const [tone, setTone] = useState("confident");
    const [loading, setLoading] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [error, setError] = useState("");

    const generateCoverLetter = async () => {
        if (!jobDescription.trim()) {
            setError("Job description is required.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/cover-letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobDescription, tone }),
            });

            if (!res.ok) throw new Error(await res.text());

            const { coverLetter } = await res.json();
            setCoverLetter(coverLetter);
        } catch (err: string | Error | unknown) {
            setError("Something went wrong. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
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
                            Craft Cover Letter
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white mx-auto max-w-2xl flex flex-col gap-4 rounded-xl shadow-xl lg:p-6 p-4">

                <p className="text-sm text-center bg-gray-100 p-3 rounded-lg mb-4 w-full text-gray-600">
                    Uplaod the job description and we will craft a professional cover letter that esnures you make a lasting impression.
                </p>
                <div className="w-full space-y-2" >
                    <Label htmlFor="job-description">Job Description</Label>
                    <Textarea
                        id="job-description"
                        placeholder="Paste the job description here..."
                        className="w-full max-w-4xl h-64 border border-gray-400 rounded-md p-3 focus:ring-2 focus:ring-blue-500"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={8}
                    />
                </div>

                <div className="w-full space-y-2" >
                    <Label htmlFor="tone">Tone</Label>
                    <select
                        id="tone"
                        title="tone"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full max-w-4xl border border-gray-400 rounded-md p-3 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="confident">Confident</option>
                        <option value="enthusiastic">Enthusiastic</option>
                        <option value="formal">Formal</option>
                        <option value="friendly">Friendly</option>
                        <option value="persuasive">Persuasive</option>
                    </select>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button onClick={generateCoverLetter} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                    {loading ? "Generating..." : "Generate Cover Letter"}
                </Button>
            </div>

            {coverLetter && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="mt-4">View Cover Letter</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <h2 className="text-xl font-semibold mb-4">Your Cover Letter</h2>
                        <Textarea
                            readOnly
                            value={coverLetter}
                            className="h-96"
                        />
                        <Button
                            className="mt-2 py-3 px-2"
                            size={"default"}
                            onClick={() => navigator.clipboard.writeText(coverLetter)}
                        >
                            Copy to Clipboard
                        </Button>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
