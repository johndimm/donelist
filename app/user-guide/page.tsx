'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function UserGuidePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkWidth = () => {
      setIsNarrow(window.innerWidth < 900);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    setMounted(true);
    // Fetch the markdown content from public folder
    fetch('/USER_GUIDE.md')
      .then(res => {
        if (res.ok) {
          return res.text();
        }
        throw new Error('Failed to load guide');
      })
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent('# User Guide\n\nUnable to load the guide. Please check that USER_GUIDE.md exists in the public folder.');
        setLoading(false);
      });
  }, []);

  // Simple markdown to HTML converter
  function markdownToHtml(md: string): string {
    let html = md;
    
    // Split into lines for processing
    const lines = html.split('\n');
    const result: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      
      // Skip empty lines
      if (!line) {
        // Close list if we're in one
        if (inList && listItems.length > 0) {
          result.push(`<ul style="margin: 0.25rem 0; padding-left: 1.5rem;">${listItems.join('')}</ul>`);
          listItems = [];
          inList = false;
        }
        continue;
      }
      
      // Headers (check before other patterns)
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
      
      // Horizontal rules
      if (line.match(/^---+$/)) {
        result.push('<hr>');
        continue;
      }
      
      // List items
      const listMatch = line.match(/^(\d+)\.\s+(.+)$/) || line.match(/^-\s+(.+)$/);
      if (listMatch) {
        const content = listMatch[2] || listMatch[1];
        listItems.push(`<li>${processInlineMarkdown(content)}</li>`);
        inList = true;
        continue;
      }
      
      // Close list if we hit a non-list line
      if (inList && listItems.length > 0) {
        result.push(`<ul style="margin: 0.25rem 0; padding-left: 1.5rem;">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      
      // Regular paragraph
      result.push(`<p>${processInlineMarkdown(line)}</p>`);
    }
    
    // Close any remaining list
    if (inList && listItems.length > 0) {
      result.push(`<ul style="margin: 0.25rem 0; padding-left: 1.5rem;">${listItems.join('')}</ul>`);
    }
    
    return result.join('');
  }
  
  function processInlineMarkdown(text: string): string {
    let html = text;
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" style="color: #0070f3; text-decoration: underline;">$1</a>');
    
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>');
    
    // Italic (but not bold)
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/gim, '<em>$1</em>');
    
    // Code inline
    html = html.replace(/`([^`]+)`/gim, '<code style="background: #f5f5f5; padding: 0.15rem 0.3rem; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');
    
    return html;
  }

  if (!mounted) {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: isNarrow ? '0.25rem 0.5rem' : '0.375rem 0.75rem',
                backgroundColor: 'transparent',
                color: '#0070f3',
                border: 'none',
                borderRadius: '4px',
                fontSize: isNarrow ? '0.75rem' : '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={isNarrow ? 14 : 16} />
              {!isNarrow && 'Back'}
            </button>
            <h1 style={{ fontSize: isNarrow ? '1.25rem' : '2rem', fontWeight: 'bold', margin: 0 }}>
              Done List
            </h1>
          </div>
          <div style={{ fontSize: isNarrow ? '0.9rem' : '1.1rem', fontWeight: '500', color: '#666' }}>
            User Guide
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isNarrow ? '0.5rem' : '2rem',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading guide...</div>
        ) : (
          <div
            className="user-guide"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.4',
              color: '#333',
              maxWidth: '1000px',
              margin: '0 auto',
            }}
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(content),
            }}
          />
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
