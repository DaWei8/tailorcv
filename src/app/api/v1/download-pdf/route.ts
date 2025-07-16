import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { pdf } from "@react-pdf/renderer";
import ResumePDF from "@/lib/pdf-template";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Which resume?
  const resumeId = req.nextUrl.searchParams.get("id");
  if (!resumeId)
    return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: row } = await supabase
    .from("tailored_resumes")
    .select("resume_jsonb")
    .eq("id", resumeId)
    .eq("profile_id", user.id) // ownership
    .single();

  if (!row)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Render PDF → Blob → ArrayBuffer
  const documentInstance = ResumePDF({ data: row.resume_jsonb });
  const blob = await pdf(documentInstance).toBlob();
  const buffer = await blob.arrayBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="resume.pdf"',
    },
  });
}