// components/PDFTextExtractor.tsx
'use client';

import { useEffect, useState } from 'react';
import { pdfjs } from 'react-pdf';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// Use CDN version that matches react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PDFTextExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const extractText = async (file: File) => {
    setLoading(true);
    setError('');
    setText('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      console.log(`PDF loaded: ${pdf.numPages} pages`);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .filter((item): item is TextItem => 'str' in item && typeof (item as TextItem).str === 'string')
          .map((item) => item.str)
          .join(' ')
          .trim();
        
        if (pageText) {
          fullText += `Page ${i}:\n${pageText}\n\n`;
        }
      }

      setText(fullText.trim());
      console.log(`Successfully extracted ${fullText.length} characters from ${pdf.numPages} pages`);
      
    } catch (err) {
      console.error('PDF extraction error:', err);
      setError(`Error extracting text: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (file) {
      extractText(file);
    }
  }, [file]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>PDF Text Extractor</h2>
      
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
          }
        }}
        disabled={loading}
      />

      {loading && (
        <div style={{ color: 'blue', margin: '10px 0' }}>
          <p>⏳ Extracting text from PDF...</p>
        </div>
      )}
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0', padding: '10px', backgroundColor: '#ffebee', border: '1px solid #f44336', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {text && (
        <div style={{ marginTop: '20px' }}>
          <h3>Extracted Text:</h3>
          <div style={{ 
            border: '1px solid #ccc', 
            padding: '15px', 
            maxHeight: '400px', 
            overflow: 'auto',
            backgroundColor: '#f9f9f9',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            {text}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <p>📊 Character count: {text.length.toLocaleString()}</p>
            <p>📄 Word count: {text.split(/\s+/).filter(word => word.length > 0).length.toLocaleString()}</p>
          </div>
        </div>
      )}
      
      {!file && !loading && !error && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f8ff', border: '1px solid #4CAF50', borderRadius: '4px' }}>
          <p>📎 Select a PDF file to extract text from it.</p>
          <p style={{ fontSize: '12px', color: '#666' }}>This extraction happens entirely in your browser - no files are uploaded to a server.</p>
        </div>
      )}
    </div>
  );
}