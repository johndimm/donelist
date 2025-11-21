'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DayEdit from '@/components/DayEdit';
import { formatDate, exportData, importData } from '@/lib/storage';
import { Download, Upload, HelpCircle, X } from 'lucide-react';

export default function DayPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState<string>('');
  const [isNarrow, setIsNarrow] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [guideContent, setGuideContent] = useState<string>('');
  const [guideLoading, setGuideLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (params.date) {
      setDate(params.date as string);
    } else {
      setDate(formatDate(new Date()));
    }
    const checkWidth = () => {
      setIsNarrow(window.innerWidth < 900);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [params.date]);

  useEffect(() => {
    if (showGuide && !guideContent && !guideLoading) {
      setGuideLoading(true);
      fetch('/USER_GUIDE.md')
        .then(res => {
          if (res.ok) {
            return res.text();
          }
          throw new Error('Failed to load guide');
        })
        .then(text => {
          setGuideContent(text);
          setGuideLoading(false);
        })
        .catch(() => {
          setGuideContent('# User Guide\n\nUnable to load the guide.');
          setGuideLoading(false);
        });
    }
  }, [showGuide, guideContent, guideLoading]);

  function handleExport() {
    const jsonData = exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `done-list-export-${new Date().toISOString().split('T')[0]}.json`;
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

  // Markdown to HTML converter (same as main page)
  function markdownToHtml(md: string): string {
    const lines = md.split('\n');
    const result: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        if (inList && listItems.length > 0) {
          result.push(`<ul style="margin: 0.25rem 0; padding-left: 1.5rem;">${listItems.join('')}</ul>`);
          listItems = [];
          inList = false;
        }
        continue;
      }
      
      if (line.match(/^###\s+(.+)$/)) {
        result.push(`<h3>${line.replace(/^###\s+/, '')}</h3>`);
        continue;
      }
      if (line.match(/^##\s+(.+)$/)) {
        result.push(`<h2>${line.replace(/^##\s+/, '')}</h2>`);
        continue;
      }
      if (line.match(/^#\s+(.+)$/)) {
        result.push(`<h1>${line.replace(/^#\s+/, '')}</h1>`);
        continue;
      }
      
      // Images (standalone)
      if (line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)) {
        const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (match) {
          const alt = match[1] || 'Image';
          const src = match[2];
          result.push(`<div style="margin: 0.75rem 0;"><img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 4px; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" /><div style="display: none; padding: 1rem; background: #f5f5f5; border: 1px dashed #ccc; border-radius: 4px; color: #666; text-align: center;">Image not found: ${alt}</div></div>`);
        }
        continue;
      }
      
      if (line.match(/^---+$/)) {
        result.push('<hr>');
        continue;
      }
      
      const listMatch = line.match(/^(\d+)\.\s+(.+)$/) || line.match(/^-\s+(.+)$/);
      if (listMatch) {
        const content = listMatch[2] || listMatch[1];
        listItems.push(`<li>${processInlineMarkdown(content)}</li>`);
        inList = true;
        continue;
      }
      
      if (inList && listItems.length > 0) {
        result.push(`<ul style="margin: 0.25rem 0; padding-left: 1.5rem;">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      
      result.push(`<p>${processInlineMarkdown(line)}</p>`);
    }
    
    if (inList && listItems.length > 0) {
      result.push(`<ul style="margin: 0.25rem 0; padding-left: 1.5rem;">${listItems.join('')}</ul>`);
    }
    
    return result.join('');
  }
  
  function processInlineMarkdown(text: string): string {
    let html = text;
    // Process images first (before links, since they use similar syntax)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 4px; margin: 0.5rem 0; display: block;" onerror="this.style.display=\'none\';" />');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" style="color: #0070f3; text-decoration: underline;">$1</a>');
    html = html.replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/gim, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/gim, '<code style="background: #f5f5f5; padding: 0.15rem 0.3rem; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');
    return html;
  }

  if (!mounted || !date) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Fixed Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          zIndex: 100,
          padding: isNarrow ? '0.5rem' : '2rem',
          paddingBottom: isNarrow ? '0.75rem' : '1rem',
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
          <h1 style={{ fontSize: isNarrow ? '1.25rem' : '2rem', fontWeight: 'bold', margin: 0 }}>
            Done List
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowGuide(!showGuide)}
              style={{
                padding: isNarrow ? '0.35rem 0.6rem' : '0.5rem 1rem',
                backgroundColor: showGuide ? '#0070f3' : 'white',
                color: showGuide ? 'white' : '#333',
                border: showGuide ? '1px solid #0070f3' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: isNarrow ? '0.75rem' : '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: isNarrow ? '0.25rem' : '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!showGuide) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                } else {
                  e.currentTarget.style.backgroundColor = '#0051cc';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = showGuide ? '#0070f3' : 'white';
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

      {/* Scrollable Content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isNarrow ? '0.5rem' : '2rem',
          paddingBottom: showGuide ? 0 : (isNarrow ? '0.5rem' : '2rem'),
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {importMessage && (
          <div
            style={{
              padding: isNarrow ? '0.5rem 0.75rem' : '0.75rem 1rem',
              marginBottom: isNarrow ? '0.5rem' : '1rem',
              borderRadius: '6px',
              backgroundColor: importMessage.type === 'success' ? '#d4edda' : '#f8d7da',
              color: importMessage.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${importMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              fontSize: isNarrow ? '0.75rem' : '0.9rem',
            }}
          >
            {importMessage.text}
          </div>
        )}
        {showGuide ? (
          <div
            style={{
              position: 'relative',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: isNarrow ? '0.5rem' : '1rem',
              paddingBottom: 0,
              height: 'calc(100vh - 120px)',
              overflowY: 'auto',
              marginBottom: 0,
            }}
          >
            <button
              onClick={() => setShowGuide(false)}
              style={{
                position: 'absolute',
                top: isNarrow ? '0.5rem' : '1rem',
                right: isNarrow ? '0.5rem' : '1rem',
                padding: '0.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Close Guide"
            >
              <X size={isNarrow ? 18 : 20} />
            </button>
            {guideLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading guide...</div>
            ) : (
              <div
                className="user-guide"
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.4',
                  color: '#333',
                  paddingRight: isNarrow ? '2rem' : '3rem',
                  paddingBottom: isNarrow ? '1rem' : '2rem',
                }}
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(guideContent),
                }}
              />
            )}
          </div>
        ) : (
          <DayEdit date={date} onClose={() => router.push('/')} />
        )}
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        .user-guide h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 0.75rem 0 0.25rem 0;
          color: #000;
        }
        .user-guide h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0.75rem 0 0.25rem 0;
          color: #000;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 0.25rem;
        }
        .user-guide h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.5rem 0 0.15rem 0;
          color: #333;
        }
        .user-guide p {
          margin: 0.25rem 0;
        }
        .user-guide ul, .user-guide ol {
          margin: 0.25rem 0;
          padding-left: 1.5rem;
        }
        .user-guide li {
          margin: 0.05rem 0;
        }
        .user-guide hr {
          margin: 0.75rem 0;
          border: none;
          border-top: 1px solid #e0e0e0;
        }
        .user-guide code {
          background: #f5f5f5;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.9em;
        }
        .user-guide a {
          color: #0070f3;
          text-decoration: underline;
        }
        .user-guide a:hover {
          color: #0051cc;
        }
      `}} />
    </div>
  );
}

