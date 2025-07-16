// src/app/dashboard/cover-letter/page.tsx
import React from "react";

const CoverLetterPage = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Cover Letter Generator</h1>
            <p className="text-lg">
                Generate a personalized cover letter for any job application.
            </p>
            <form className="space-y-4">
                <textarea
                    className="w-full p-4 border rounded"
                    rows={10}
                    placeholder="Paste the job description here..."
                />
                <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    Generate Cover Letter
                </button>
            </form>
        </div>
    );
};

export default CoverLetterPage;