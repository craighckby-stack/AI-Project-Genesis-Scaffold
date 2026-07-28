import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: true, files: [] });
    }

    const parsedFiles: { name: string; content: string; type: string }[] = [];

    for (const file of files) {
      const name = file.name;
      const lowerName = name.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        if (lowerName.endsWith('.zip')) {
          // Process ZIP file via runtime require to bypass bundler static analysis
          const AdmZip = eval('require')('adm-zip');
          const zip = new AdmZip(buffer);
          const zipEntries = zip.getEntries();
          let zipContent = `ZIP Archive: ${name}\n`;
          let fileCount = 0;

          for (const entry of zipEntries) {
            if (!entry.isDirectory) {
              const entryName = entry.entryName;
              const lowerEntryName = entryName.toLowerCase();
              
              // Skip common binary files inside zip
              const isBinary = [
                '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', 
                '.ttf', '.eot', '.mp3', '.mp4', '.wav', '.avi', '.mov', 
                '.db', '.sqlite', '.exe', '.dll', '.so', '.dylib', 
                '.class', '.jar', '.war', '.zip', '.tar', '.gz', '.pdf', 
                '.docx', '.pyc', '.o', '.obj', '.a', '.lib', '.bin'
              ].some(ext => lowerEntryName.endsWith(ext));

              if (!isBinary) {
                try {
                  const entryBuffer = entry.getData();
                  const content = entryBuffer.toString('utf8');
                  zipContent += `\n=========================================\n`;
                  zipContent += `FILE: ${entryName}\n`;
                  zipContent += `=========================================\n`;
                  zipContent += content + `\n`;
                  fileCount++;
                } catch (entryErr: any) {
                  zipContent += `\n[Error reading file ${entryName}: ${entryErr.message || entryErr}]\n`;
                }
              }
            }
          }

          parsedFiles.push({
            name,
            content: zipContent,
            type: 'zip',
          });
        } else if (lowerName.endsWith('.pdf')) {
          // Process PDF file via runtime require to bypass bundler static analysis
          const pdfParse = eval('require')('pdf-parse');
          const pdfData = await pdfParse(buffer);
          parsedFiles.push({
            name,
            content: pdfData.text || '[Empty PDF Document]',
            type: 'pdf',
          });
        } else if (lowerName.endsWith('.docx')) {
          // Process Word DOCX file via runtime require to bypass bundler static analysis
          const mammoth = eval('require')('mammoth');
          const docxData = await mammoth.extractRawText({ buffer });
          parsedFiles.push({
            name,
            content: docxData.value || '[Empty Word Document]',
            type: 'docx',
          });
        } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.gif')) {
          // Process image file to base64
          const base64 = buffer.toString('base64');
          parsedFiles.push({
            name,
            content: `data:image/${lowerName.split('.').pop()};base64,${base64}`,
            type: 'image',
          });
        } else {
          // Default to text file
          const text = buffer.toString('utf8');
          parsedFiles.push({
            name,
            content: text,
            type: 'text',
          });
        }
      } catch (fileError: any) {
        console.error(`Error parsing file ${name}:`, fileError);
        parsedFiles.push({
          name,
          content: `[Error parsing file: ${fileError.message || fileError}]`,
          type: 'error',
        });
      }
    }

    return NextResponse.json({ success: true, files: parsedFiles });
  } catch (error: any) {
    console.error('Error in parse-files route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown parsing error' }, { status: 500 });
  }
}
