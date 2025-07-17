"use client";

import { createClient } from "@/lib/supabase";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <button
            onClick={handleLogout}
            role="button"
            className=" bg-gray-800 text-sm text-white flex gap-2 py-2 px-3 items-center justify-center "
        >
            <LogOut /> Logout
        </button>
    );
}