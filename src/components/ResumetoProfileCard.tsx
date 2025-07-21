import React, { useState, useRef } from 'react';
import { Upload, FileText, User, Briefcase, GraduationCap, Code, Save, Edit, X, Check, AlertCircle, Loader } from 'lucide-react';
import { ParsedUserProfile } from '@/lib/schemas';


interface ResumeToProfileCardProps {
    onSaveSuccess?: (profile: ParsedUserProfile) => void;
    onError?: (error: string) => void;
    apiEndpoint?: string;
}

const ResumeToProfileCard: React.FC<ResumeToProfileCardProps> = ({
    onSaveSuccess,
    onError,
    apiEndpoint = '/api/parse-resume-to-profile'
}) => {
    const [step, setStep] = useState<'upload' | 'parsing' | 'preview' | 'saving' | 'success'>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [parsedProfile, setParsedProfile] = useState<ParsedUserProfile | null>(null);
    const [editableProfile, setEditableProfile] = useState<ParsedUserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Simulated resume parsing function - replace with your actual resume parsing library
    const parseResumeFile = async (file: File): Promise<string> => {
        console.info(parsedProfile)
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                resolve(text);
            };
            reader.readAsText(file);
        });
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
            if (!allowedTypes.includes(file.type)) {
                setError('Please upload a PDF, Word document, or text file');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleParseResume = async () => {
        if (!selectedFile) return;
        setStep('parsing');
        setError(null);

        try {
            // Parse the resume file to extract raw text
            const parsedResumeData = await parseResumeFile(selectedFile);

            // Call the API to parse and structure the data
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    parsedResumeData,
                    options: {
                        includePersonalInfo: true,
                        maxSkills: 20,
                        maxExperience: 10
                    }
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to parse resume');
            }

            setParsedProfile(data.profile);
            setEditableProfile(data.profile);
            setStep('preview');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to parse resume';
            setError(errorMessage);
            onError?.(errorMessage);
            setStep('upload');
        }
    };

    const handleSaveProfile = async () => {
        if (!editableProfile) return;

        setStep('saving');
        setError(null);

        try {
            const response = await fetch(apiEndpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    profile: editableProfile
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save profile');
            }

            setStep('success');
            onSaveSuccess?.(editableProfile);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
            setError(errorMessage);
            onError?.(errorMessage);
            setStep('preview');
        }
    };

    const handleEditField = (field: keyof ParsedUserProfile, value: unknown) => {
        if (!editableProfile) return;
        setEditableProfile({
            ...editableProfile,
            [field]: value
        });
    };

    const resetComponent = () => {
        setStep('upload');
        setSelectedFile(null);
        setParsedProfile(null);
        setEditableProfile(null);
        setError(null);
        setIsEditing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const simulateFileSelectEvent = (file: File): React.ChangeEvent<HTMLInputElement> => {
        return {
            target: {
                files: [file]
            }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
    };
    const renderUploadStep = () => (
        <div className="max-w-2xl w-full ">

            {/* Upload Card with Tooltip */}
            <div
                className="relative group w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col justify-center items-center text-center bg-white hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileSelect(simulateFileSelectEvent(file));
                }}
                onDragOver={(e) => e.preventDefault()}
                title="Click to upload from device or drag and drop"
            >
                <h1 className='text-gray-900 w-[90%] text-lg font-semibold mb-4' >Create Profile from CV</h1>
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <div className="text-base w-[80%] flex flex-col mb-3 font-semibold text-gray-900">
                    {selectedFile ? selectedFile.name : 'Choose a CV or drag it here'}
                    {selectedFile && <p className='text-sm font-light' >{(selectedFile.size / 1024).toFixed(0)}kb</p>}
                </div>
                {!selectedFile && <p className="text-sm text-gray-500">PDF, Word, or Text files up to 5MB</p>}
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                />

                {/* Optional: Tooltip styled (can be replaced with external lib if needed) */}
                <div className="absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500">
                    Click to upload or drag and drop
                </div>
            </div>

            {selectedFile && (
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleParseResume}
                        className="px-4 py-3 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-900 transition-colors flex items-center gap-2"
                    >
                        <FileText className="h-5 w-5" />
                        Parse Resume
                    </button>
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );

    const renderParsingStep = () => (
        <div className="max-w-2xl mx-auto p-6 text-center">
            <Loader className="mx-auto h-16 w-16 text-blue-500 mb-4 animate-spin" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Parsing Your Resume</h2>
            <p className="text-gray-600">Please wait while we extract and structure your information...</p>
        </div>
    );

    const renderPreviewStep = () => {
        if (!editableProfile) return null;

        return (
            <div className="max-w-4xl w-[85vw] mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Review Your Profile</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`px-3 text-sm py-3 rounded-md flex items-center gap-2 transition-colors ${isEditing
                                ? 'bg-gray-600 text-white hover:bg-gray-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                            {isEditing ? 'Stop Editing' : 'Edit Profile'}
                        </button>
                        <button
                            onClick={resetComponent}
                            className="px-2 py-3 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Start Over
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="bg-white border border-gray-200 rounded-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editableProfile.name}
                                        onChange={(e) => handleEditField('name', e.target.value)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-gray-900">{editableProfile.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={editableProfile.email || ''}
                                        onChange={(e) => handleEditField('email', e.target.value || null)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-gray-900">{editableProfile.email || 'Not provided'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editableProfile.phone || ''}
                                        onChange={(e) => handleEditField('phone', e.target.value || null)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-gray-900">{editableProfile.phone || 'Not provided'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editableProfile.location || ''}
                                        onChange={(e) => handleEditField('location', e.target.value || null)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-gray-900">{editableProfile.location || 'Not provided'}</p>
                                )}
                            </div>
                        </div>
                        {editableProfile.summary && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                                {isEditing ? (
                                    <textarea
                                        value={editableProfile.summary}
                                        onChange={(e) => handleEditField('summary', e.target.value || null)}
                                        rows={3}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-gray-900">{editableProfile.summary}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {editableProfile.skills.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Code className="h-5 w-5" />
                                Skills ({editableProfile.skills.length})
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {editableProfile.skills.map((skill, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                                        <div className="font-medium text-gray-900">{skill.skill}</div>
                                        <div className="text-sm text-gray-600">{skill.level}</div>
                                        {skill.category && (
                                            <div className="text-xs text-blue-600 mt-1">{skill.category}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Experience */}
                    {editableProfile.experience.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase className="h-5 w-5" />
                                Experience ({editableProfile.experience.length})
                            </h3>
                            <div className="space-y-4">
                                {editableProfile.experience.map((exp, index) => (
                                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                                                <p className="text-blue-600">{exp.company}</p>
                                                <p className="text-sm text-gray-600">{exp.duration} • {exp.location}</p>
                                            </div>
                                        </div>
                                        {exp.responsibilities.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {exp.responsibilities.map((resp, respIndex) => (
                                                    <li key={respIndex} className="text-sm text-gray-700 flex items-start gap-2">
                                                        <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                                                        {resp}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {editableProfile.education.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                Education ({editableProfile.education.length})
                            </h3>
                            <div className="space-y-4">
                                {editableProfile.education.map((edu, index) => (
                                    <div key={index} className="border-l-4 border-green-500 pl-4">
                                        <h4 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h4>
                                        <p className="text-green-600">{edu.institution}</p>
                                        <p className="text-sm text-gray-600">{edu.duration} • {edu.location}</p>
                                        {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                                        {edu.description && <p className="text-sm text-gray-700 mt-1">{edu.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projects */}
                    {editableProfile.projects.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Code className="h-5 w-5" />
                                Projects ({editableProfile.projects.length})
                            </h3>
                            <div className="space-y-4">
                                {editableProfile.projects.map((project, index) => (
                                    <div key={index} className="border-l-4 border-purple-500 pl-4">
                                        {project.name && <h4 className="font-semibold text-gray-900">{project.name}</h4>}
                                        {project.description && <p className="text-gray-700 mt-1">{project.description}</p>}
                                        {project.technologies && project.technologies.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {project.technologies.map((tech, techIndex) => (
                                                    <span key={techIndex} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {project.link && (
                                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                                                View Project →
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleSaveProfile}
                        className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 "
                    >
                        <Save className="h-5 w-5" />
                        Save Profile
                    </button>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>
        );
    };

    const renderSavingStep = () => (
        <div className="max-w-2xl mx-auto p-6 text-center">
            <Loader className="mx-auto h-16 w-16 text-green-500 mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Saving Your Profile</h2>
            <p className="text-gray-600">Please wait while we save your information...</p>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="max-w-2xl mx-auto p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Saved Successfully!</h2>
            <p className="text-gray-600 mb-6">Your resume has been parsed and your profile has been saved to your account.</p>
            <div className="flex gap-4 justify-center">
                <button
                    onClick={resetComponent}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Parse Another Resume
                </button>
            </div>
        </div>
    );

    return (
        <div className=" bg-gray-50">
            <div className=" ">
                {step === 'upload' && renderUploadStep()}
                {step === 'parsing' && renderParsingStep()}
                {step === 'preview' && renderPreviewStep()}
                {step === 'saving' && renderSavingStep()}
                {step === 'success' && renderSuccessStep()}
            </div>
        </div>
    );
};

export default ResumeToProfileCard;