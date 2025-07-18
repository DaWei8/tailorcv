"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast'; 
import { Download, Loader2 } from 'lucide-react';

interface DownloadResumeButtonProps {
    resumeId: string;
    fileName?: string; 
}

const DownloadResumeButton: React.FC<DownloadResumeButtonProps> = ({
    resumeId,
    fileName = 'Tailored-resume.pdf',
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            
            const apiUrl = `/api/v1/download-pdf?id=${resumeId}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || `Failed to fetch PDF: ${response.statusText}`);
            }

            // Get the PDF blob from the response
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName); // Set the download file name
            document.body.appendChild(link);
            // Programmatically click the link to trigger download
            link.click();

            // Clean up: remove the link and revoke the object URL
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Resume downloaded successfully!');

        } catch (err: unknown) {
            console.error('Download error:', err);
            const message = err instanceof Error ? err.message : null;
            toast.error(message || 'Failed to download resume.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                </>
            ) : (
                <>
                    Download Resume
                    <Download className="ml-2 h-4 w-4" />
                </>
            )}
        </button>
    );
};

export default DownloadResumeButton;