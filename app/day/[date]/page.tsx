'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DayEdit from '@/components/DayEdit';
import { formatDate } from '@/lib/storage';

export default function DayPage() {
  const params = useParams();
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
      <DayEdit date={date} />
    </main>
  );
}

