"use client";
import React from "react";
import { Check } from "lucide-react";

type Plan = "free" | "basic" | "pro";

interface PricingTier {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    cta: string;
    accent?: boolean;
}

const tiers: Record<Plan, PricingTier> = {
    free: {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Get started with your first resume.",
        features: [
            "1 Master profile",
            "10 tailored resume / month",
            "10 cover letter / month",
            "Classic template only",
            //   "Community support",
        ],
        cta: "Start Free",
    },
    basic: {
        name: "Basic",
        price: "$3.99",
        period: "month",
        description: "Perfect for active job-seekers.",
        features: [
            "Unlimited profiles",
            "30 tailored resumes / month",
            "25 cover letters / month",
            "10 ATS templates",
            "Keyword suggestions",
            //   "Email support",
        ],
        cta: "Start 7-Day Trial",
    },
    pro: {
        name: "Professional",
        price: "$9.99",
        period: "month",
        description: "Unlimited power for career growth.",
        features: [
            "Unlimited profiles",
            "Unlimited resumes & letters",
            "All premium templates",
            "Real-time ATS score",
            "LinkedIn import",
            "Priority chat + email",
        ],
        cta: "Go Pro",
        accent: true,
    },
};

interface PricingCardProps {
    plan: Plan;
}

export default function PricingCard({ plan }: PricingCardProps) {
    const tier = tiers[plan];

    return (
        <div
            className={`relative h-[480px] flex flex-col max-w-sm w-full mx-auto bg-white border transition duration-700 rounded-2xl shadow-lg shadow-blue-100 hover:shadow-2xl hover:shadow-blue-500 p-6 space-y-5
        ${tier.accent ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"}`}
        >
            {tier.accent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                </span>
            )}

            {/* Header */}
            <div className="flex flex-col items-center gap-1" >
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                <p className="text-gray-600">{tier.description}</p>
            </div>

            {/* Price */}
            <div>
                <p className="text-3xl flex items-center justify-center font-black">
                    {tier.price}<span className="text-lg font-normal">/{tier.period}</span>
                </p>
            </div>

            <div className=" flex h-full flex-col justify-between " >
                {/* Features */}
                <ul className="space-y-3 text-sm">
                    {tier.features.map((f) => (
                        <li key={f} className="flex text-left items-center gap-1">
                            <Check size={16} className="text-green-400 font-bold bg-gradient-to-br from-blue-50 to-indigo-100p-1 w-5 h-5 rounded-full" />
                            {f}
                        </li>
                    ))}
                </ul>

                {/* CTA */}
                <button
                    className={`w-full cursor-pointer font-semibold py-3 rounded-md transition
                    ${tier.accent
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-50 text-gray-800 hover:bg-blue-600 hover:text-white"}`}
                    onClick={() => alert(`Redirect to Stripe for ${tier.name}`)}
                >
                    {tier.cta}
                </button>
            </div>


        </div>
    );
}