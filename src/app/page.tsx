import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Already logged-in → dashboard
  console.log("From the home page",session)
  if (session) redirect("/dashboard");

  // Everyone else → landing page
  redirect("/landing");
}