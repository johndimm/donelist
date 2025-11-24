'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import UserGuide from '@/components/UserGuide';

function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const showOverlay = searchParams.get('overlay') === 'user-guide';

  useEffect(() => {
    setMounted(true);
    const checkWidth = () => {
      setIsNarrow(window.innerWidth < 900);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  function handleCloseOverlay() {
    router.push('/');
  }

  if (!mounted) {
    return null;
  }

  return (
    <>
      <main style={{ padding: isNarrow ? '0.5rem' : '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <Calendar />
      </main>
      {showOverlay && (
        <UserGuide onClose={handleCloseOverlay} showCloseButton={true} />
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

