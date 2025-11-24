'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface UserGuideProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function UserGuide({ onClose, showCloseButton = false }: UserGuideProps) {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Fetch the markdown content from public folder (with cache busting)
    const cacheBuster = `?t=${Date.now()}`;
    fetch(`/USER_GUIDE.md${cacheBuster}`)
      .then(res => {
        if (res.ok) {
          return res.text();
        }
        throw new Error('Failed to load guide from public folder');
      })
      .then(text => {
        console.log('Loaded user guide content, length:', text.length);
        console.log('Contains Freedom of Choice:', text.includes('Freedom of Choice'));
        console.log('Contains Romeo (should be false):', text.includes('Romeo'));
        
        // Verify it's the correct file
        if (text.includes('Romeo and Juliet')) {
          console.error('ERROR: Wrong file loaded! Contains Romeo and Juliet');
        }
        
        setContent(text);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading user guide:', error);
        // Fallback: try API route
        fetch(`/api/user-guide${cacheBuster}`)
          .then(res => {
            if (res.ok) {
              return res.text();
            }
            throw new Error('Failed to load guide from API');
          })
          .then(text => {
            setContent(text);
            setLoading(false);
          })
          .catch(() => {
            setContent('# User Guide\n\nUnable to load the guide. Please check that USER_GUIDE.md exists.');
            setLoading(false);
          });
      });
  }, []);

  // Simple markdown to HTML converter
  function markdownToHtml(md: string): string {
    let html = md;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" style="color: #0070f3; text-decoration: underline;">$1</a>');
    
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>');
    
    // Italic (but not bold)
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/gim, '<em>$1</em>');
    
    // Code inline
    html = html.replace(/`([^`]+)`/gim, '<code style="background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; font-family: monospace;">$1</code>');
    
    // Lists - ordered
    html = html.replace(/^(\d+)\.\s+(.+)$/gim, '<li>$2</li>');
    
    // Lists - unordered  
    html = html.replace(/^-\s+(.+)$/gim, '<li>$1</li>');
    
    // Wrap consecutive list items in ul (handle newlines between items)
    html = html.replace(/(<li>.*?<\/li>(\s*\n\s*<li>.*?<\/li>)*)/gim, (match) => {
      // Remove extra whitespace/newlines between list items
      const cleaned = match.replace(/\s*\n\s*/g, '');
      return '<ul style="margin: 0.5rem 0; padding-left: 1.5rem;">' + cleaned + '</ul>';
    });
    
    // Split into blocks (paragraphs, headers, lists, etc.)
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
      block = block.trim();
      if (!block) return '';
      
      // Don't wrap if it's already a block element
      if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<hr')) {
        return block;
      }
      
      // Convert single newlines within paragraphs to spaces (not breaks)
      block = block.replace(/\n/g, ' ');
      
      // Clean up multiple spaces
      block = block.replace(/\s+/g, ' ');
      
      return '<p>' + block + '</p>';
    }).join('\n');
    
    return html;
  }

  if (!mounted) {
    return null;
  }

  const contentElement = (
    <>
      {showCloseButton && onClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              color: '#666',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      )}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading guide...</div>
      ) : (
        <div
          className="user-guide"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.6',
            color: '#333',
          }}
          dangerouslySetInnerHTML={{
            __html: markdownToHtml(content),
          }}
        />
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .user-guide h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1.5rem 0 0.75rem 0;
          color: #000;
        }
        .user-guide h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem 0;
          color: #000;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 0.5rem;
        }
        .user-guide h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.4rem 0;
          color: #333;
        }
        .user-guide p {
          margin: 0.5rem 0;
        }
        .user-guide ul, .user-guide ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .user-guide li {
          margin: 0.15rem 0;
        }
        .user-guide hr {
          margin: 1.5rem 0;
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
    </>
  );

  if (showCloseButton) {
    // Overlay mode
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contentElement}
        </div>
      </div>
    );
  }

  // Page mode
  return (
    <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {contentElement}
    </main>
  );
}

