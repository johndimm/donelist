import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Read from the root USER_GUIDE.md file
    const filePath = join(process.cwd(), 'USER_GUIDE.md');
    console.log('Reading USER_GUIDE.md from:', filePath);
    const content = await readFile(filePath, 'utf-8');
    console.log('File content length:', content.length);
    console.log('First 200 chars:', content.substring(0, 200));
    
    // Verify it's the correct file
    if (content.includes('Romeo and Juliet')) {
      console.error('ERROR: Wrong file! Contains Romeo and Juliet content');
    }
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error reading USER_GUIDE.md:', error);
    return new NextResponse('Unable to load the guide.', { status: 500 });
  }
}

