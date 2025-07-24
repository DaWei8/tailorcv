import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";
import NavLanding from "@/components/NavLanding";
import PricingPage from "../pricing/page";
// import Logo from "../../../public/logo.svg"
// import Image from "next/image";


export default function LandingPage() {
  return (
    <main className="min-h-screen h-full relative transition-all ease-in-out duration-500 bg-white text-gray-900 flex flex-col items-center">
      <NavLanding />

      {/* Hero */}
      <section className="max-w-4xl text-center px-4 pt-28 space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold">
          Get More Interviews with Resumes Tailored to the Job.
          <span className="text-blue-600"> Instantly.</span>
        </h1>

        <p className=" text-gray-600 max-w-2xl mx-auto">
          Paste any job description. TailorCV uses AI to generate a
          perfectly-matched resume and cover letter that beat ATS filters—no
          templates, no guesswork.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex sticky top-16 items-center space-x-2 hover:shadow-2xl hover:shadow-blue-500 bg-blue-600 text-white px-4 lg:px-8 py-4 rounded-md text-lg font-semibold hover:bg-blue-700 transition"
        >
          <span>Build My Resume Free</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Features */}
      <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl">
        <FeatureCard
          icon={<Sparkles className="w-8 h-8 text-blue-600" />}
          title="One Master Profile"
          desc="Fill it once; we tailor it to any job in seconds."
        />
        <FeatureCard
          icon={<Zap className="w-8 h-8 text-blue-600" />}
          title="AI Tailoring Engine"
          desc="Keyword-rich, quantified bullets that match the JD."
        />
        <FeatureCard
          icon={<Shield className="w-8 h-8 text-blue-600" />}
          title="ATS Optimized"
          desc="Clean templates + score feedback to beat filters."
        />
      </section>

      <PricingPage />

      {/* Footer CTA */}
      <footer className="mt-24 sticky bottom-0 w-full bg-gray-900 py-5 text-center">
        <p className="text-gray-400">
          Ready to land more interviews?{" "}
          <Link href="/login" className="text-blue-500 font-semibold underline">
            Start free today
          </Link>
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl shadow-2xl shadow-blue-200 py-10 items-center text-center space-y-3">
      <div className="p-3 bg-blue-50 w-14 h-14 flex items-center justify-center text-white rounded-full" >
        {icon}
      </div>
      <h3 className="text-xl font-extrabold">{title}</h3>
      <p className="text-gray-600 w-[80%]">{desc}</p>
    </div>
  );
}