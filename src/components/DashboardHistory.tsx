"use client"

// import { createClient } from "@/lib/supabase";
import { Briefcase, Mail, User } from "lucide-react";
import { useState } from "react";
// import toast from "react-hot-toast";


// const userId = async () => {
//     const supabase = createClient();
//     const { data, error } = await supabase.auth.getUser();
//     if (error || !data.user) {
//         toast.error("Failed to get user ID");
//         return null;
//     }
//     return data.user.id;
// };


const DashboardHistory = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const tabs = [
        { id: "profiles", title: "Profiles", icon: User },
        { id: "resumes", title: "Resumes", icon: Briefcase },
        { id: "cover_letters", title: "Cover Letters", icon: Mail },
    ];

    const renderTabContent = () => {
        switch (currentTab) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Profiles</h2>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Resumes</h2>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Cover Letters</h2>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };
    return (
        //      {/* Show a 3 tabs for Cover letters, Resumes, Profiles */}
        // {/* Page Navigation */}

        <div>
            <div className="bg-white border-b">
                <div className=" w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex lg:space-x-6 space-x-4 w-full overflow-x-scroll " aria-label="Tabs">
                        {tabs.map((tab, index) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setCurrentTab(index)}
                                    className={`${index === currentTab
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                                >
                                    <Icon size={16} />
                                    <span>{tab.title}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>
            <div className=" w-full mx-auto px-4 sm:px-6 lg:px-8">
                {renderTabContent()}
            </div>
        </div>

    )
}

export default DashboardHistory


import React from 'react'
