import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { pdf } from "@react-pdf/renderer";
import { ResumeData } from "@/lib/resume-data";
import ResumePDF from "@/lib/pdf-template";


export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();

    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Auth check
    const {
      data: { user },
      error: authError,
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
    const resumeData = row.resume_jsonb as ResumeData;
    const blob = await pdf(<ResumePDF data={resumeData} />).toBlob();
    const buffer = await blob.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-${resumeId}.pdf"`, // Dynamic filename
      },
    });
  } catch (error: string | Error | unknown) {
    console.error("Error in PDF generation API route:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
