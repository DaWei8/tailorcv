"use client";

import { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function LoginPage() {

useEffect(() => {
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") toast.success("Logged in successfully!");
    if (event === "USER_UPDATED") toast.success("Account updated!");
  });
  return () => data.subscription.unsubscribe();
}, []);

  return (
    <div className="bg-gray-100 w-screen h-screen flex flex-col items-center px-4 justify-center" >
      <div className=" max-w-lg bg-white w-full shadow-lg p-4 pt-8 lg:p-8 rounded-2xl">
        {/* <img src="/logo.png" alt="TailorCV Logo" className="w-24 h-24 mb-6" /> */}
        <h1 className="text-3xl md:text-4xl text-black mb-4 font-extrabold text-center">Login to TailorCV</h1>
        <p className="text-center text-gray-600 mb-6">
          Sign in to tailor your resume and get more interviews.
        </p>
        <div className=" max-w-md w-full" >
        </div>
        <Auth
          supabaseClient={supabase}
          providers={["google"]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#2563EB",           // primary button bg
                  brandAccent: "#2563EB",    // hover / focus
                  brandButtonText: "#ffffff",
                  defaultButtonBackground: "#f3f4f6",
                  defaultButtonBackgroundHover: "#e5e7eb",
                  inputBackground: "#ffffff",
                  inputBorder: "#d1d5db",
                  inputBorderHover: "#9ca3af",
                  inputBorderFocus: "#2563EB",
                  inputText: "#111827",
                },
                fonts: {
                  bodyFontFamily: "Inter, sans-serif",
                  buttonFontFamily: "Inter, sans-serif",
                  inputFontFamily: "Inter, sans-serif",
                  labelFontFamily: "Inter, sans-serif",
                },
                fontSizes: {
                  baseBodySize: "16px",
                  baseButtonSize: "16px",
                  baseInputSize: "16px",
                  baseLabelSize: "14px",
                },
                space: {
                  anchorBottomMargin: "16px",
                  inputPadding: "12px 16px",
                  buttonPadding: "12px 16px",
                  labelBottomMargin: "8px",
                  emailInputSpacing: "8px",
                  socialAuthSpacing: "8px",
                },
              },
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: "Email",
                password_label: "Password (min 6 chars)",
                button_label: "Sign in",
              },
              sign_up: {
                email_label: "Email",
                password_label: "Create password",
                button_label: "Create account",
              },
            },
          }}    // or "dark" | "brandDark"
          showLinks={true}
          redirectTo={process.env.NEXT_PUBLIC_SITE_URL + "/dashboard" || `${window.location.origin}/dashboard`}
        />
      </div>
    </div>
  );
}