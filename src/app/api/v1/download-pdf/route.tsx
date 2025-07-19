// import { NextRequest, NextResponse } from "next/server";
// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import { cookies } from "next/headers";
// import { pdf } from "@react-pdf/renderer";
// import ResumePDF from "@/lib/pdf-template";
// import { Database } from "@/lib/database-types";
// import { ResumeData } from "@/lib/resume-data";

// export async function GET(req: NextRequest) {
  // try {
  //   // Create Supabase client with proper cookie handling
  //   const supabase = createRouteHandlerClient<Database>({ cookies });

  //   console.log("API Route: Attempting to get user session...");

  //   // Get user session
  //   const {
  //     data: { user },
  //     error: authError,
  //   } = await supabase.auth.getUser();

  //   if (authError) {
  //     console.error("API Route: Supabase Auth Error:", authError.message);
  //     return NextResponse.json(
  //       { error: "Authentication failed", details: authError.message },
  //       { status: 401 }
  //     );
  //   }

  //   if (!user) {
  //     console.warn("API Route: No authenticated user found.");
  //     return NextResponse.json(
  //       { error: "Unauthorized: No user session" },
  //       { status: 401 }
  //     );
  //   }

  //   console.log("API Route: User authenticated:", user.id);

  //   // Extract resumeId from query parameters
  //   const resumeId = req.nextUrl.searchParams.get("id");
  //   if (!resumeId) {
  //     console.warn("API Route: Missing resume ID in request.");
  //     return NextResponse.json(
  //       { error: "Missing resume ID parameter" },
  //       { status: 400 }
  //     );
  //   }

  //   console.log("API Route: Fetching resume data for ID:", resumeId);

  //   // Fetch resume data from Supabase with ownership check
  //   const { data: row, error: dbError } = await supabase
  //     .from("tailored_resumes")
  //     .select("resume_jsonb")
  //     .eq("id", resumeId)
  //     .eq("profile_id", user.id) // Ensures user can only access their own resumes
  //     .single();

  //   if (dbError) {
  //     console.error("API Route: Database error:", dbError);

  //     if (dbError.code === 'PGRST116') {
  //       return NextResponse.json(
  //         { error: "Resume not found or access denied" },
  //         { status: 404 }
  //       );
  //     }

  //     return NextResponse.json(
  //       { error: "Failed to fetch resume data", details: dbError.message },
  //       { status: 500 }
  //     );
  //   }

  //   if (!row || !row.resume_jsonb) {
  //     console.warn(`API Route: Resume data not found for ID: ${resumeId}, User: ${user.id}`);
  //     return NextResponse.json(
  //       { error: "Resume data not found or is empty" },
  //       { status: 404 }
  //     );
  //   }

  //   console.log("API Route: Resume data found, generating PDF...");
  //   // Assert the type to ensure it matches what the PDF component expects
  //   const resumeData = row.resume_jsonb as ResumeData;

  //   // Generate PDF
  //   const blob = await pdf(<ResumePDF data={resumeData} />).toBlob();
  //   const buffer = await blob.arrayBuffer();

  //   console.log("API Route: PDF generated successfully, size:", buffer.byteLength, "bytes");

  //   // Return PDF with proper headers for immediate download
  //   return new Response(buffer, {
  //     status: 200,
  //     headers: {
  //       "Content-Type": "application/pdf",
  //       "Content-Disposition": `attachment; filename="resume-${resumeId}.pdf"`,
  //       "Content-Length": buffer.byteLength.toString(),
  //       "Cache-Control": "no-cache, no-store, must-revalidate",
  //       "Pragma": "no-cache",
  //       "Expires": "0",
  //     },
  //   });

  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "An unknown error occurred";
  //   console.error("API Route: Uncaught error:", error);
  //   return NextResponse.json(
  //     { error: "Internal server error", details: message },
  //     { status: 500 }
  //   );
  // }
// }