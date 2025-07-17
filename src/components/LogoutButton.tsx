"use client";

import { createClient } from "@/lib/supabase";
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
            className="btn-danger"
        >
            <i className="fa-solid fa-arrow-right-to-bracket"></i> Logout
        </button>
    );
}