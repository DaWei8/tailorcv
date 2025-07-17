"use client";
import Link from "next/link";
import { createClient } from "@/lib/supabase";   // ✅ use this
import Logo from "../../public/tailorcv_logo.svg";
import Image from "next/image";

export default function Nav() {
  const handleLogout = async () => {
    const supabase = createClient();      // ✅ create here
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow">
      <Link href="/dashboard" className="font-bold text-xl">
        <Image src={Logo} className="w-24" alt="Tailor CV logo" />
      </Link>
      <button
        onClick={handleLogout}
        className="text-sm text-red-600 hover:underline"
      >
        Logout
      </button>
    </nav>
  );
}