"use client";

import Link from "next/link";
import { UserCircle, FileText } from "lucide-react";

export default function DashboardHome() {
    return (
        <main className="max-w-4xl mx-auto py-16 px-6 text-black space-y-12">
            <h1 className="text-5xl font-bold text-center">Welcome to TailorCV</h1>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Profile card */}
                <DashboardCard
                    icon={<UserCircle className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />}
                    title="Master Profile"
                    desc="Keep your skills, experience & achievements up to date."
                    link="/dashboard/profile"
                />

                {/* Tailor card */}
                <DashboardCard
                    icon={<FileText className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />}
                    title="Tailor Resume"
                    desc="Paste any job description and get a perfect resume in seconds."
                    link="/dashboard/tailor"
                />

                {/* ATS card */}
                <DashboardCard
                    icon={<FileText className="w-12 h-12 text-red-600 group-hover:scale-110 transition-transform" />}
                    title="ATS Score"
                    desc=""
                    link="/dashboard/ats"
                />

                {/*  Cover Letter card */}
                <DashboardCard
                    icon={<FileText className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />}
                    title="Cover Letter"
                    desc=""
                    link="/dashboard/cover"
                />
            </div>
        </main>
    );
}

function DashboardCard({
    icon,
    title,
    desc,
    link
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    link: string;
}) {
    return (
        <Link
            href={link}
            className="group flex flex-col rounded-2xl shadow-2xl shadow-gray-200 py-10 items-center text-center space-y-3 hover:shadow-2xl hover:shadow-blue-200 transition"
        >
            <div className="p-3 bg-blue-50 w-14 max-h-14 group-hover:scale-110 transition-transform flex items-center justify-center text-white rounded-full" >
                {icon}
            </div>
            <h3 className="text-2xl font-extrabold">{title}</h3>
            <p className="text-gray-600 w-[80%]">{desc}</p>
        </Link>
    )
}