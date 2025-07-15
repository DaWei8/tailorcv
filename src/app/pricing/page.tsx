import Logo from "../../../public/tailorcv_logo.svg"
import PricingCard from "@/components/PricingCard";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
    title: "TailorCV Pricing",
    description: "Simple, transparent pricing to land more interviews faster.",
};

export default function PricingPage() {
    return (
        <main className="bg-white min-h-screen pt-4 flex flex-col items-center justify-center relative text-gray-900">
            {/* <NavLanding /> */}
            <Link href="/landing" className="font-bold text-xl">
                <Image src={Logo} className="w-32" alt="Tailor CV logo" />
            </Link>
            <div className="max-w-6xl mx-auto text-center pt-28 px-4 lg:px-8 space-y-6">
                {/* Hero */}
                <h1 className="text-4xl md:text-5xl font-extrabold">
                    Unlock Your Dream Job <span className="text-blue-600">Faster</span>
                </h1>
                <p className="max-w-lg mx-auto text-lg mb-12 text-gray-600">
                    One simple plan. Unlimited tailored resumes & cover letters. Cancel anytime.
                </p>

                {/* Card */}
                <section className="max-w-6xl mx-auto flex flex-col-reverse md:grid mb-20 md:grid-cols-3 gap-4" >
                    <PricingCard plan="free" />
                    <PricingCard plan="basic" />
                    <PricingCard plan="pro" />
                </section>

                {/* FAQ */}
                <div className="max-w-3xl mx-auto flex flex-col items-center justify-center text-left pb-40">
                    <h2 className="text-3xl text-center font-bold mb-4 w-full">Frequently Asked Questions</h2>
                    <details className="border-b py-4 w-full">
                        <summary className="cursor-pointer text-xl font-semibold">Is there a free tier?</summary>
                        <p className="text-md text-gray-600 mt-1">Yes — build one resume forever. Upgrade only when you need unlimited tailoring.</p>
                    </details>
                    <details className="border-b py-4 w-full">
                        <summary className="cursor-pointer text-xl font-semibold">Can I cancel anytime?</summary>
                        <p className="text-md text-gray-600 mt-1">Absolutely. One click in your dashboard cancels immediately.</p>
                    </details>
                </div>
            </div>
        </main>
    );
}

