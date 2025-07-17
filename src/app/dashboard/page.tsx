import Link from "next/link";
import { UserCircle, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    // console.log(user)

    if (!user) {
        redirect('/login')
    }

    return (
        <main className="min-h-screen bg-gray-50 mx-auto flex flex-col text-black space-y-12">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className=" flex items-center gap-2" >
                            <Image
                                src={user.user_metadata.avatar_url}
                                alt="user profile image"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            <div className="flex flex-col">
                                <h1 className="text-lg font-semibold" >{user.user_metadata.full_name}</h1>
                                <p className=" text-gray-700 text-sm " >{user.user_metadata.email}</p>
                            </div>
                        </div>
                        <LogoutButton />

                    </div>
                </div>
            </div>


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
                    desc="Track your progress, and increase your chances of getting hired."
                    link="/dashboard/ats"
                />

                {/*  Cover Letter card */}
                <DashboardCard
                    icon={<FileText className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />}
                    title="Cover Letter"
                    desc="Craft a professional cover letter that stands out."
                    link="/dashboard/cover-letter"
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
            className="group flex flex-col rounded-2xl shadow-2xl shadow-gray-200 py-10 items-center text-center space-y-3 hover:shadow-2xl hover:bg-blue-50 hover:shadow-blue-200 hover:scale-105 transition"
        >
            <div className="p-3 bg-blue-50 w-14 max-h-14 group-hover:scale-110 transition-transform flex items-center justify-center text-white rounded-full" >
                {icon}
            </div>
            <h3 className="text-2xl font-extrabold">{title}</h3>
            <p className="text-gray-600 w-[80%]">{desc}</p>
        </Link>
    )
}