
import React from 'react';

interface MarkdownRendererProps {
  text: string | null;
  isPaper?: boolean;
  theme?: 'dark' | 'light';
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text, isPaper = true, theme = 'dark' }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const rendered = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const textColor = isPaper ? 'text-slate-800' : (theme === 'dark' ? 'text-slate-100' : 'text-slate-700');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#') || /^\d+\.\s+[A-Z]/.test(line)) {
      const content = line.replace(/^#+\s*/, '');
      rendered.push(<h3 key={i} className="font-black border-b border-slate-100 pb-2 mt-8 mb-4 uppercase text-blue-900 text-sm tracking-tight">{content}</h3>);
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) inTable = true;
      if (line.includes('---')) continue;
      tableRows.push(line.split('|').filter(c => c.trim() !== "").map(c => c.trim()));
      continue;
    } else if (inTable) {
      if (tableRows.length > 0) {
        rendered.push(
          <div key={`t-${i}`} className="my-6 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full border-collapse bg-white text-[11px]">
              <thead><tr className="bg-slate-50">{tableRows[0].map((c, idx) => <th key={idx} className="p-3 border-b border-slate-200 text-left font-black uppercase text-slate-600">{c}</th>)}</tr></thead>
              <tbody>{tableRows.slice(1).map((row, rIdx) => <tr key={rIdx} className="border-b border-slate-100 last:border-0">{row.map((c, cIdx) => <td key={cIdx} className="p-3 text-slate-700 font-medium">{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
      }
      inTable = false; tableRows = [];
    }

    if (line === '') { rendered.push(<div key={i} className="h-4" />); continue; }

    const isListItem = /^\d+\./.test(line) || /^[-*]/.test(line);
    const processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-blue-800">$1</strong>').replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    rendered.push(
      <p key={i} className={`mb-3 text-justify leading-relaxed ${textColor} ${isListItem ? 'pl-6 relative before:content-[""] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-blue-400 before:rounded-full' : ''}`}
        dangerouslySetInnerHTML={{ __html: processed }} />
    );
  }

  return <div className="w-full">{rendered}</div>;
};

export default MarkdownRenderer;
