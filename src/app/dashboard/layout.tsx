import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}