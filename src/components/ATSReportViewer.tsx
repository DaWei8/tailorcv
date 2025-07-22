// components/AtsReportViewer.tsx
import React from 'react';

// Define specific interfaces for each TAILOR sub-section
interface TTargetKeywords {
    score_percentage: number;
    matched_keywords: string[];
    missing_keywords: string[];
    explanation: string;
}

interface AAchievedImpact {
    score_percentage: number;
    impact_statements_found: string[];
    explanation: string;
}

interface IIndustryRelevance {
    score_percentage: number;
    relevant_industries_found: string[];
    explanation: string;
}

interface LLengthOfExperience {
    score_percentage: number;
    total_years_experience: number;
    average_tenure_years: number;
    required_experience_years: number;
    explanation: string;
}

interface OOptimizedFormatting {
    score_percentage: number;
    readability_assessment: string;
    key_sections_present: string[];
    explanation: string;
}

interface RRoleAlignment {
    score_percentage: number;
    aligned_responsibilities: string[];
    misaligned_responsibilities_or_gaps: string[];
    explanation: string;
}

// Define the main ATS Report JSON structure using the specific sub-interfaces
export interface AtsReport {
    candidate_name: string;
    job_title: string;
    overall_fit_score_percentage: number;
    overall_recommendation: string;
    tailor_analysis: {
        T_target_keywords: TTargetKeywords;
        A_achieved_impact: AAchievedImpact;
        I_industry_relevance: IIndustryRelevance;
        L_length_of_experience: LLengthOfExperience;
        O_optimized_formatting: OOptimizedFormatting;
        R_role_alignment: RRoleAlignment;
    };
    red_flags: string[];
    notes: string;
}

interface AtsReportViewerProps {
    atsReport: AtsReport;
}

const AtsReportViewer: React.FC<AtsReportViewerProps> = ({ atsReport }) => {
    if (!atsReport) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md text-center text-gray-600 font-inter">
                No ATS report data available.
            </div>
        );
    }

    // Helper to determine color for score
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="font-inter bg-gray-50 min-h-screen p-4 sm:p-6 ">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8 lg:p-10 mb-8">
                <h1 className="text-xl font-semibold text-gray-600 mb-6 text-center">
                    Analysis for {atsReport.candidate_name} - {atsReport.job_title}
                </h1>

                {/* Overall Score */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-center justify-between shadow-sm">
                    <div className="text-center sm:text-left mb-3 sm:mb-0">
                        <p className="text-blue-800 text-xl font-semibold">Overall Fit Score:</p>
                        <p className={`text-4xl font-extrabold ${getScoreColor(atsReport.overall_fit_score_percentage)}`}>
                            {atsReport.overall_fit_score_percentage}%
                        </p>
                    </div>
                    <div className="text-center sm:text-right">
                        <p className="text-blue-800 text-xl font-semibold">Recommendation:</p>
                        <p className="text-2xl font-bold text-blue-700">
                            {atsReport.overall_recommendation}
                        </p>
                    </div>
                </div>

                {/* TAILOR Analysis Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {Object.entries(atsReport.tailor_analysis).map(([key, sectionData]) => (
                        <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold mr-2">
                                    {key.charAt(0).toUpperCase()}
                                </span>
                                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().replace('T Target', 'Target').replace('A Achieved', 'Achieved').replace('I Industry', 'Industry').replace('L Length', 'Length').replace('O Optimized', 'Optimized').replace('R Role', 'Role')}
                            </h3>
                            <p className="text-gray-700 mb-2">
                                <span className="font-medium">Score:</span>{' '}
                                <span className={`${getScoreColor(sectionData.score_percentage)} font-bold`}>
                                    {sectionData.score_percentage}%
                                </span>
                            </p>
                            <p className="text-gray-700 text-sm mb-3">{sectionData.explanation}</p>

                            {/* Render specific details for each TAILOR section using type guards */}
                            {key === 'T_target_keywords' && (
                                <TTargetKeywordsSection data={sectionData as TTargetKeywords} />
                            )}

                            {key === 'A_achieved_impact' && (
                                <AAchievedImpactSection data={sectionData as AAchievedImpact} />
                            )}

                            {key === 'I_industry_relevance' && (
                                <IIndustryRelevanceSection data={sectionData as IIndustryRelevance} />
                            )}

                            {key === 'L_length_of_experience' && (
                                <LLengthOfExperienceSection data={sectionData as LLengthOfExperience} />
                            )}

                            {key === 'O_optimized_formatting' && (
                                <OOptimizedFormattingSection data={sectionData as OOptimizedFormatting} />
                            )}

                            {key === 'R_role_alignment' && (
                                <RRoleAlignmentSection data={sectionData as RRoleAlignment} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Red Flags */}
                {atsReport.red_flags && atsReport.red_flags.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-6 shadow-sm">
                        <h3 className="text-xl font-semibold text-red-800 mb-3 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            Red Flags
                        </h3>
                        <ul className="list-disc list-inside text-sm text-red-700 ml-2">
                            {atsReport.red_flags.map((flag, i) => (
                                <li key={i}>{flag}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Notes */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-xl font-semibold text-green-800 mb-3 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Notes
                    </h3>
                    <p className="text-gray-700 text-sm">{atsReport.notes}</p>
                </div>
            </div>
        </div>
    );
};

export default AtsReportViewer;


// --- Helper Components for each TAILOR section to improve readability and type safety ---

const TTargetKeywordsSection: React.FC<{ data: TTargetKeywords }> = ({ data }) => (
    <>
        <h4 className="font-medium text-gray-800 mt-3 mb-1">Matched Keywords:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
            {data.matched_keywords.length > 0 ? (
                data.matched_keywords.map((item, i) => <li key={i}>{item}</li>)
            ) : (
                <li>None</li>
            )}
        </ul>
        <h4 className="font-medium text-gray-800 mt-3 mb-1">Missing Keywords:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
            {data.missing_keywords.length > 0 ? (
                data.missing_keywords.map((item, i) => <li key={i} className="text-red-500">{item}</li>)
            ) : (
                <li>None</li>
            )}
        </ul>
    </>
);

const AAchievedImpactSection: React.FC<{ data: AAchievedImpact }> = ({ data }) => (
    <>
        <h4 className="font-medium text-gray-800 mt-3 mb-1">Impact Statements:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
            {data.impact_statements_found.length > 0 ? (
                data.impact_statements_found.map((item, i) => <li key={i}>{item}</li>)
            ) : (
                <li>None found</li>
            )}
        </ul>
    </>
);

const IIndustryRelevanceSection: React.FC<{ data: IIndustryRelevance }> = ({ data }) => (
    <>
        <h4 className="font-medium text-gray-800 mt-3 mb-1">Relevant Industries:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
            {data.relevant_industries_found.length > 0 ? (
                data.relevant_industries_found.map((item, i) => <li key={i}>{item}</li>)
            ) : (
                <li>None specified</li>
            )}
        </ul>
    </>
);

const LLengthOfExperienceSection: React.FC<{ data: LLengthOfExperience }> = ({ data }) => (
    <>
        <p className="text-sm text-gray-600 mt-3">
            <span className="font-medium">Total Experience:</span> {data.total_years_experience} years
        </p>
        <p className="text-sm text-gray-600">
            <span className="font-medium">Average Tenure:</span> {data.average_tenure_years} years
        </p>
        <p className="text-sm text-gray-600">
            <span className="font-medium">Required Experience:</span> {data.required_experience_years} years
        </p>
    </>
);

const OOptimizedFormattingSection: React.FC<{ data: OOptimizedFormatting }> = ({ data }) => (
    <>
        <p className="text-sm text-gray-600 mt-3">
            <span className="font-medium">Readability:</span> {data.readability_assessment}
        </p>
        <h4 className="font-medium text-gray-800 mt-3 mb-1">Key Sections Present:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
            {data.key_sections_present.length > 0 ? (
                data.key_sections_present.map((item, i) => <li key={i}>{item}</li>)
            ) : (
                <li>None</li>
            )}
        </ul>
    </>
);

const RRoleAlignmentSection: React.FC<{ data: RRoleAlignment }> = ({ data }) => (
    <>
        <h4 className="font-medium text-gray-800 mt-3 mb-1">Aligned Responsibilities:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
            {data.aligned_responsibilities.length > 0 ? (
                data.aligned_responsibilities.map((item, i) => <li key={i}>{item}</li>)
            ) : (
                <li>None</li>
            )}
        </ul>
        <h4 className="font-medium text-gray-800 mt-3 mb-1">Gaps/Misalignments:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
            {data.misaligned_responsibilities_or_gaps.length > 0 ? (
                data.misaligned_responsibilities_or_gaps.map((item, i) => <li key={i} className="text-red-500">{item}</li>)
            ) : (
                <li>None</li>
            )}
        </ul>
    </>
);