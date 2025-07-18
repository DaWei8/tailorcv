import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers"; 
import { pdf } from "@react-pdf/renderer";



export async function GET(req: NextRequest) {
  try {
    // 1. Explicitly get the cookie store instance.
    // Next.js ensures this is available and resolved in async server components/routes.
    const cookieStore = cookies();

    // 2. Pass a function that returns the cookieStore instance to createRouteHandlerClient.
    // This ensures Supabase Auth Helpers uses the already-resolved cookie instance.
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Auth check
    const {
      data: { user },
      error: authError, // Capture auth error for better debugging
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError?.message || "User not found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Which resume?
    const resumeId = req.nextUrl.searchParams.get("id");
    if (!resumeId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { data: row, error: dbError } = await supabase
      .from("tailored_resumes")
      .select("resume_jsonb")
      .eq("id", resumeId)
      .eq("profile_id", user.id) // ownership check
      .single();

    if (dbError) {
      console.error("Database error fetching resume:", dbError.message);
      return NextResponse.json({ error: "Failed to fetch resume data" }, { status: 500 });
    }

    if (!row || !row.resume_jsonb) {
      return NextResponse.json({ error: "Resume data not found or empty" }, { status: 404 });
    }
    // const resumeData = JSON.parse(row.resume_jsonb as string);
    const resumeData = row.resume_jsonb; // Assuming it's already a JSON object

    // Render PDF → Blob → ArrayBuffer
    const documentInstance = <ResumePDF data={resumeData} />;
    const blob = await pdf(documentInstance).toBlob();
    const buffer = await blob.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-${resumeId}.pdf"`, // Dynamic filename
      },
    });
  } catch (error: any) {
    console.error("Error in PDF generation API route:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
