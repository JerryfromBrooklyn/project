import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import './LegalDocument.css';

interface LegalDocumentProps {
  docPath: string;
  title: string;
}

const LegalDocument: React.FC<LegalDocumentProps> = ({ docPath, title }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    console.log('[LEGAL_DOCUMENT] Attempting to load document from path:', docPath);
    const fetchDocument = async () => {
      try {
        setLoading(true);
        // Use window.location.origin to ensure we're using the correct base URL
        const fullPath = `${window.location.origin}${docPath}`;
        console.log(`[LEGAL_DOCUMENT] Fetching document from full URL: ${fullPath}`);
        
        const response = await axios.get(fullPath);
        console.log('[LEGAL_DOCUMENT] Document fetched successfully', response.data.length, 'bytes');
        setContent(response.data);
        setError(null);
      } catch (err) {
        console.error('[LEGAL_DOCUMENT] Error loading legal document:', err);
        setError(`Failed to load the document. Please try again later. Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
    // Set document title
    document.title = `${title} | SHMONG`;
  }, [docPath, title]);

  // Set up scroll spy for table of contents
  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h1[id], h2[id]');
      
      // Find the heading that's currently in view
      let current = '';
      headings.forEach((heading) => {
        const section = heading as HTMLElement;
        const rect = section.getBoundingClientRect();
        
        if (rect.top <= 100) {
          current = section.id;
        }
      });
      
      setActiveSection(current);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [content]);

  return (
    <div className="min-h-screen bg-slate-50 apple-legal-document">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center text-sm font-medium text-blue-500 hover:text-blue-700 transition">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <div className="text-sm text-slate-500">SHMONG</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm">Loading document...</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-xl bg-red-50 p-4 my-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Document</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Table of Contents - Mobile Toggle */}
            <div className="md:hidden mb-4">
              <details className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <summary className="font-medium text-slate-800 cursor-pointer">
                  Table of Contents
                </summary>
                <div className="mt-3 pl-4 border-l-2 border-slate-100">
                  <TableOfContents content={content} activeSection={activeSection} />
                </div>
              </details>
            </div>
            
            {/* Table of Contents - Desktop Sidebar */}
            <div className="hidden md:block w-1/4 h-screen sticky top-24">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-lg font-semibold mb-3 text-slate-800">Table of Contents</h3>
                <TableOfContents content={content} activeSection={activeSection} />
              </div>
            </div>
            
            {/* Main Content */}
            <div className="md:w-3/4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 md:px-10 py-8 border-b border-slate-200">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
                <p className="text-slate-500 text-sm mt-2">Last updated: April 25, 2025</p>
              </div>
              
              <div className="px-6 md:px-10 py-8 legal-content prose prose-slate max-w-none">
                <ReactMarkdown components={{
                  h1: ({node, children, ...props}) => {
                    const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                    return <h1 id={id?.toString()} className="text-2xl font-bold text-slate-900 mt-10 mb-4 scroll-mt-24" {...props}>{children}</h1>;
                  },
                  h2: ({node, children, ...props}) => {
                    const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                    return <h2 id={id?.toString()} className="text-xl font-semibold text-slate-900 mt-8 mb-3 scroll-mt-24" {...props}>{children}</h2>;
                  },
                  h3: ({node, ...props}) => <h3 className="text-lg font-medium text-slate-900 mt-6 mb-2" {...props} />,
                  p: ({node, ...props}) => <p className="text-slate-700 mb-4 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 text-slate-700" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 text-slate-700" {...props} />,
                  li: ({node, ...props}) => <li className="mb-2 leading-relaxed" {...props} />,
                  a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-blue-100 pl-4 italic text-slate-600 my-6 py-2 bg-blue-50/30 rounded-r-md" {...props} />
                  ),
                  strong: ({node, ...props}) => <strong className="font-semibold text-slate-800" {...props} />,
                  em: ({node, ...props}) => <em className="text-slate-800 italic" {...props} />,
                  hr: ({node, ...props}) => <hr className="my-8 border-t border-slate-200" {...props} />,
                  code: ({node, ...props}) => <code className="font-mono text-sm bg-slate-100 px-1 py-0.5 rounded text-slate-800" {...props} />,
                }}>
                  {content}
                </ReactMarkdown>
              </div>
              
              <div className="px-6 md:px-10 py-6 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} SHMONG. All rights reserved.
                  </p>
                  <div className="flex gap-4 text-sm">
                    <Link to="/terms-of-service-and-privacy-policy" className="text-slate-600 hover:text-blue-600">Terms & Privacy</Link>
                    <Link to="/biometrics-policy" className="text-slate-600 hover:text-blue-600">Biometrics Policy</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Helper component for Table of Contents
const TableOfContents = ({ content, activeSection }: { content: string, activeSection: string }) => {
  // Extract headings from the content to build the TOC
  const headingRegex = /^(#+)\s+(.+)$/gm;
  const matches = [...content.matchAll(headingRegex)];
  
  const headings = matches.map(match => {
    const level = match[1].length; // Number of # symbols
    const text = match[2];
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    return { level, text, id };
  }).filter(h => h.level <= 2); // Only show h1 and h2 in TOC
  
  return (
    <ul className="space-y-2 text-sm">
      {headings.map((heading, index) => {
        const isActive = heading.id === activeSection;
        const indentClass = heading.level === 1 ? '' : 'ml-4';
        
        return (
          <li key={index} className={indentClass}>
            <a 
              href={`#${heading.id}`} 
              className={`block py-1 border-l-2 pl-2 ${
                isActive 
                  ? 'border-blue-500 text-blue-600 font-medium' 
                  : 'border-transparent hover:border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default LegalDocument; 