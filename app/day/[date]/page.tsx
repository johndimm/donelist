'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DayEdit from '@/components/DayEdit';
import { formatDate } from '@/lib/storage';

export default function DayPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    if (params.date) {
      setDate(params.date as string);
    } else {
      setDate(formatDate(new Date()));
    }
  }, [params.date]);

  if (!mounted || !date) {
    return null;
  }

  return (
    <main style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '0.375rem 0.75rem',
            backgroundColor: '#0070f3',
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.85rem',
            marginBottom: '0.5rem',
          }}
        >
          ← Back to Calendar
        </button>
      </div>
      <DayEdit date={date} />
    </main>
  );
}

