'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Download, Upload, HelpCircle } from 'lucide-react';
import { exportData, importData } from '@/lib/storage';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkWidth = () => {
      setIsNarrow(window.innerWidth < 900);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  function handleExport() {
    const jsonData = exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freedom-of-choice-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setImportMessage({ type: 'error', text: 'Failed to read file' });
        return;
      }

      const result = importData(text);
      if (result.success) {
        setImportMessage({ type: 'success', text: 'Data imported successfully! Refreshing...' });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setImportMessage({ type: 'error', text: result.error || 'Failed to import data' });
      }
    };
    reader.onerror = () => {
      setImportMessage({ type: 'error', text: 'Failed to read file' });
    };
    reader.readAsText(file);
  }

  useEffect(() => {
    if (importMessage) {
      const timer = setTimeout(() => setImportMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [importMessage]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: isNarrow ? '0.75rem 0.5rem' : '1rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: isNarrow ? '0.5rem' : '1rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h1
              style={{
                fontSize: isNarrow ? '1.25rem' : '2rem',
                fontWeight: 'bold',
                margin: 0,
                color: '#000',
                cursor: 'pointer',
              }}
              onClick={() => router.push('/')}
            >
              Freedom of Choice
            </h1>
            <div
              style={{
                fontSize: isNarrow ? '0.7rem' : '0.85rem',
                color: '#666',
                fontStyle: 'italic',
                margin: 0,
              }}
            >
              a calendar diary
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                if (pathname === '/user-guide') {
                  router.push('/');
                } else {
                  router.push('/user-guide');
                }
              }}
              style={{
                padding: isNarrow ? '0.35rem 0.6rem' : '0.5rem 1rem',
                backgroundColor: pathname === '/user-guide' ? '#0070f3' : 'white',
                color: pathname === '/user-guide' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: isNarrow ? '0.75rem' : '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: isNarrow ? '0.25rem' : '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (pathname !== '/user-guide') {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== '/user-guide') {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
              title="User Guide"
            >
              <HelpCircle size={isNarrow ? 14 : 16} />
              {!isNarrow && 'Guide'}
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: isNarrow ? '0.35rem 0.6rem' : '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: '1px solid #0070f3',
                borderRadius: '6px',
                fontSize: isNarrow ? '0.75rem' : '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: isNarrow ? '0.25rem' : '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0051cc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0070f3';
              }}
            >
              <Download size={isNarrow ? 14 : 16} />
              {!isNarrow && 'Export'}
            </button>
            <button
              onClick={handleImportClick}
              style={{
                padding: isNarrow ? '0.35rem 0.6rem' : '0.5rem 1rem',
                backgroundColor: 'white',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: isNarrow ? '0.75rem' : '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: isNarrow ? '0.25rem' : '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <Upload size={isNarrow ? 14 : 16} />
              {!isNarrow && 'Import'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </header>
      {importMessage && (
        <div
          style={{
            padding: isNarrow ? '0.5rem 0.75rem' : '0.75rem 1rem',
            margin: isNarrow ? '0.5rem 0.5rem' : '1rem 2rem',
            borderRadius: '6px',
            backgroundColor: importMessage.type === 'success' ? '#d4edda' : '#f8d7da',
            color: importMessage.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${importMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            fontSize: isNarrow ? '0.75rem' : '0.9rem',
            maxWidth: '1400px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {importMessage.text}
        </div>
      )}
    </>
  );
}

