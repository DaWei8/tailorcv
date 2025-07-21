// app/api/v1/extract-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('API route hit!');
  
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    console.log('File received:', file.name, file.size);

    // Dynamic import to handle potential ESM issues
    const pdf = (await import('pdf-parse')).default;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Processing PDF, buffer size:', buffer.length);
    
    // Extract text using pdf-parse with explicit options
    const data = await pdf(buffer, {
      // Ensure it treats this as a buffer, not a file path
      max: 0, // 0 means no limit on pages
    });
    
    console.log('PDF processed successfully, text length:', data.text.length);
    
    return NextResponse.json({ 
      text: data.text,
      numPages: data.numpages,
      fileName: file.name
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to extract text from PDF',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        undefined
    }, { status: 500 });
  }
}

// Also add GET for testing
export async function GET() {
  return NextResponse.json({ message: 'PDF extraction API endpoint' });
}