'use client';

import { useEffect, useState } from 'react';

export default function ViewDataPage() {
  const [data, setData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const STORAGE_KEY = 'rut-app-data';
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData(JSON.parse(stored));
      } else {
        setData({ message: 'No data found in localStorage' });
      }
    } catch (error) {
      setData({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Your Data (JSON)</h1>
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        whiteSpace: 'pre-wrap',
        overflow: 'auto',
        maxHeight: '80vh'
      }}>
        {data ? JSON.stringify(data, null, 2) : 'Loading...'}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          ← Back to Calendar
        </a>
      </div>
    </main>
  );
}


