import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function middleware(req: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession();

  // Log the authentication state for debugging
  console.log("Session in middleware:", session?.user);

  if (!session && req.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}