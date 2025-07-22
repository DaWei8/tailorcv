import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

/* ---------- Helpers ---------- */
export const getUserId = async () => {
    // First, try to get user ID from localStorage
    const storedUserId = localStorage.getItem('user_id');
    
    if (storedUserId) {
        console.log("Got user ID from localStorage:", storedUserId);
        return storedUserId;
    }
    
    // Fallback to Supabase auth if not in localStorage
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
        toast.error("Failed to get user ID");
        return null;
    }
    
    // Store the user ID in localStorage for future use
    localStorage.setItem('user_id', data.user.id);
    console.log("Got user ID from Supabase and stored in localStorage:", data.user.id);
    
    return data.user.id;
};

// Helper function to manually set user ID in localStorage (useful for login)
export const setUserIdInStorage = (userId: string) => {
    if (userId) {
        localStorage.setItem('user_id', userId);
        console.log("User ID stored in localStorage:", userId);
    }
};

// Helper function to clear user ID from localStorage (useful for logout)
export const clearUserIdFromStorage = () => {
    localStorage.removeItem('user_id');
    console.log("User ID cleared from localStorage");
};

// Helper function to get user ID synchronously from localStorage only
export const getUserIdFromStorage = () => {
    return localStorage.getItem('user_id');
};

export const supabase = createClient();