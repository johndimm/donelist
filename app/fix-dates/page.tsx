'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, parseDate } from '@/lib/storage';

export default function FixDatesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('Running fix...');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const STORAGE_KEY = 'rut-app-data';
    
    try {
      // Load current data
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setStatus('No data found in localStorage');
        return;
      }
      
      const data = JSON.parse(stored);
      
      if (!data.entries || data.entries.length === 0) {
        setStatus('No entries to fix');
        return;
      }
      
      const logMessages: string[] = [];
      logMessages.push(`Found ${data.entries.length} entries to process`);
      logMessages.push(`Current dates: ${data.entries.map((e: any) => e.date).join(', ')}`);
      
      // Simple direct fix:
      // 1. Remove empty 2025-11-19
      // 2. Keep 2025-11-17
      // 3. Keep first 2025-11-18
      // 4. Change second 2025-11-18 to 2025-11-19
      const fixedEntries: any[] = [];
      let foundFirst18 = false;
      
      for (const entry of data.entries) {
        const isEmpty = !entry.selections || Object.keys(entry.selections).length === 0;
        
        if (entry.date === '2025-11-19' && isEmpty) {
          logMessages.push(`Removing: ${entry.date} (empty)`);
          continue; // Skip empty 19
        }
        
        if (entry.date === '2025-11-17') {
          fixedEntries.push(entry);
          logMessages.push(`Keeping: ${entry.date}`);
        } else if (entry.date === '2025-11-18') {
          if (!foundFirst18) {
            fixedEntries.push(entry);
            foundFirst18 = true;
            logMessages.push(`Keeping: ${entry.date} (first)`);
          } else {
            // Second 18 -> change to 19
            fixedEntries.push({
              ...entry,
              date: '2025-11-19'
            });
            logMessages.push(`Changing: ${entry.date} -> 2025-11-19`);
          }
        } else {
          // Keep all other entries as-is
          fixedEntries.push(entry);
          logMessages.push(`Keeping: ${entry.date}`);
        }
      }
      
      logMessages.push(`Final dates: ${fixedEntries.map((e: any) => e.date).join(', ')}`);
      logMessages.push(`Final count: ${fixedEntries.length} entries`);
      
      // Update data with fixed entries
      const fixedData = {
        ...data,
        entries: fixedEntries
      };
      
      // Save back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fixedData));
      
      setLogs(logMessages);
      setStatus(`✅ Date fix complete! Fixed ${fixedEntries.length} entries.`);
      
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [router]);

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Fixing Date Shift</h1>
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
      }}>
        <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>{status}</div>
        {logs.length > 0 && (
          <div>
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Changes:</div>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '0.25rem' }}>{log}</div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <a href="/view-data" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          View Data (JSON) →
        </a>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          ← Back to Calendar
        </a>
      </div>
    </main>
  );
}

