import { createClient } from "@/lib/supabase-server"

export async function queryUserId() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  return user;
}