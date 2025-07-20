import { UserCircle, FileText, MailCheck, ExternalLink, AlertCircle, ScanEye, Book, Puzzle } from "lucide-react";
import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link";
import Logo from "../../../public/logo2.svg";
import Image from "next/image";
import UserMenu from "@/components/UserMenu";
// import { queryUserId } from "@/lib/queryUserId";

const resumeCards = [
    {
        title: "Master Profile",
        desc: "Keep your skills, experience & achievements up to date.",
        link: "/dashboard/profile",
        icon: (
            <UserCircle className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />
        ),
        comingSoon: false,
    },
    {
        title: "Tailor Resume",
        desc: "Paste any job description and get a perfect resume in seconds.",
        link: "/dashboard/tailor",
        icon: (
            <FileText className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />
        ),
        comingSoon: false,
    },
    {
        title: "ATS Score",
        desc: "Track your progress, and increase your chances of getting hired.",
        link: "/dashboard/ats",
        icon: (
            <ScanEye className="w-12 h-12 text-red-600 group-hover:scale-110 transition-transform" />
        ),
        comingSoon: false,
    },
    {
        title: "Cover Letter",
        desc: "Craft a professional cover letter that stands out.",
        link: "/dashboard/cover-letter",
        icon: (
            <MailCheck className="w-12 h-12 text-purple-600 group-hover:scale-110 transition-transform" />
        ),
        comingSoon: false,
    },
    {
        title: "Academic CV",
        desc: "Perfect for research and academic positions.",
        link: "#",
        icon: (
            <Book className="w-12 h-12 text-yellow-600 group-hover:scale-110 transition-transform" />
        ),
        comingSoon: true,
    },
    {
        title: "Freestyle Builder",
        desc: "Design your resume section by section your way.",
        link: "#",
        icon: (
            <Puzzle className="w-12 h-12 text-pink-600 group-hover:scale-110 transition-transform" />
        ),
        comingSoon: true,
    },
];



export default async function DashboardPage() {


    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()


    if (!user) {
        redirect('/login')
    }

    return (
        <main className="min-h-screen relative w-[100%] bg-gray-50  flex items-center flex-col text-black gap-12 pb-20">
            {/* Header */}
            <div className="bg-white w-full shadow">
                <div className="w-full flex flex-col items-center justify-center mx-auto">
                    <div className="flex justify-between w-full items-center px-4 pt-4 pb-4">
                        <div className=" flex items-end gap-2 " >
                            <Link href="/dashboard" className="font-bold text-xl">
                                <Image src={Logo} className="w-24" alt="Tailor CV logo" />
                            </Link>
                            <p className="px-2 py-1 text-green-600 font-medium bg-green-100 w-fit text-[12px] border border-green-600 rounded-full" >Free plan</p>
                        </div>
                        {/* <LogoutButton /> */}
                        <UserMenu />
                    </div>
                </div>
            </div>

            <div className="grid 2xl:grid-cols-3 max-w-7xl md:grid-cols-2 place-items-center px-4 gap-5">
                {resumeCards.map((card, index) => (
                    <DashboardCard
                        key={index}
                        icon={card.icon}
                        title={card.title}
                        desc={card.desc}
                        link={card.link}
                        comingSoon={card.comingSoon}
                    />
                ))}
            </div>
            {/* Disclaimer */}
            <div className="bg-amber-50 text-md max-w-7xl mx-4 lg:mx-0 border-amber-400 lg:p-5 p-3 rounded-lg ">
                <div className="flex items-start  gap-3">
                    <div>
                        <h3 className="font-bold text-lg flex text-amber-700 mb-2">      <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0 mr-2" />Important Notice</h3>
                        <p className="text-amber-700 text-md leading-relaxed">
                            <strong>Integrity First:</strong> Falsifying work experience or skills is fraudulent and can lead to serious consequences.
                            This tool is designed to help you optimize your <em>genuine</em> qualifications. Take time to actually develop the skills you lack.
                        </p>
                        <p className="text-amber-700 text-md  mt-2">
                            <strong>Need help planning your learning journey?</strong> Try{" "}
                            <a
                                href="https://phasely.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-800 font-bold hover:text-blue-500 underline inline-flex items-center gap-1"
                            >
                                Phasely <ExternalLink size={12} />
                            </a>
                            {" "}to create structured learning plans and track your progress.
                        </p>
                    </div>
                </div>
            </div>

            {/* <DashboardHistory /> */}
        </main>
    );
}

function DashboardCard({
    icon,
    title,
    desc,
    link,
    comingSoon = false,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    link: string;
    comingSoon?: boolean;
}) {
    const CardContent = (
        <div
            className={`relative flex flex-col w-[100%] max-w-md h-full rounded-2xl shadow-xl bg-white shadow-gray-200 py-10 items-center text-center gap-3
        ${comingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-2xl hover:border-blue-600 hover:shadow-blue-200 hover:scale-105 transition'}
      `}
        >
            {comingSoon && (
                <div className="absolute inset-0 bg-white/70 z-10 flex items-start p-4 justify-end rounded-2xl">
                    <p className="px-2 py-1 text-gray-800 font-medium bg-gray-100 w-fit text-sm uppercase border border-gray-300 rounded-full" >Coming soon</p>
                </div>
            )}

            <div className="p-3 bg-blue-50 w-14 max-h-14 flex items-center justify-center text-white rounded-full group-hover:scale-110 transition-transform z-0">
                {icon}
            </div>
            <h3 className="text-lg lg:text-xl w-full font-bold z-0">{title}</h3>
            <p className="text-gray-600 text-sm lg:text-base w-[70%] lg:w-[75%] z-0">{desc}</p>
        </div>
    );

    return comingSoon ? CardContent : <Link className="w-full" href={link}>{CardContent}</Link>;
}