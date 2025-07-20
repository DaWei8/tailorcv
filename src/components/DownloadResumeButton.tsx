"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/schemas';
import ResumePDF from './ResumePDf';

// Register the 'Poppins' font family with different weights and styles.
// This is necessary for @react-pdf/renderer to use custom fonts on the client side.
// The font files are fetched from Google Fonts.

interface DownloadResumeButtonProps {
    resumeData: ResumeData;
    fileName?: string;
}

const DownloadResumeButton: React.FC<DownloadResumeButtonProps> = ({
    resumeData,
    fileName = 'Tailored-resume.pdf',
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        if (!resumeData) {
            toast.error('Resume data is not available');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Generating PDF...');

            // Generate PDF directly on client side
            const documentInstance = <ResumePDF data={resumeData} />;
            const blob = await pdf(documentInstance).toBlob();

            if (blob.size === 0) {
                throw new Error('Generated PDF is empty');
            }

            console.log('PDF generated successfully, size:', blob.size, 'bytes');

            // Create download URL and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);

            // Add to DOM, click, and cleanup
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Resume downloaded successfully!');
            console.log('Download completed successfully');

        } catch (err: unknown) {
            console.error('Download error:', err);

            let errorMessage = 'Failed to generate and download resume';
            if (err instanceof Error) {
                errorMessage = err.message;
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isLoading || !resumeData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            type="button"
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                </>
            ) : (
                <>
                    Download Resume
                    <Download className="w-4 h-4" />
                </>
            )}
        </button>
    );
};

export default DownloadResumeButton;