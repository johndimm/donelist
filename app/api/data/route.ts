import { NextResponse } from 'next/server';

export async function GET() {
  // This won't work because localStorage is client-side only
  // But we can return instructions
  return NextResponse.json({ 
    message: 'localStorage is client-side only. Visit /view-data in your browser to see the data.',
    note: 'The data is stored in browser localStorage with key: rut-app-data'
  });
}


