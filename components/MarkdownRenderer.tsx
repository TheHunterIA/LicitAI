
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

  const textColor = isPaper ? 'text-slate-900' : (theme === 'dark' ? 'text-white' : 'text-slate-900');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Títulos de Seção - Estilo Normativo Oficial
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const content = line.replace(/^#+\s*/, '');
      const borderClass = isPaper ? 'border-slate-300' : 'border-blue-500/20';
      
      rendered.push(
        <h3 key={`h-${i}`} className={`font-black border-b-2 ${borderClass} pb-3 mt-10 mb-6 uppercase text-blue-900 tracking-tight ${level === 1 ? 'text-2xl' : 'text-lg'}`}>
          {content}
        </h3>
      );
      continue;
    }

    // Tabelas Técnicas de Alta Fidelidade (Para exportação perfeita para Word)
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) inTable = true;
      if (line.includes('---')) continue;
      tableRows.push(line.split('|').filter(c => c !== "").map(c => c.trim()));
      continue;
    } else if (inTable) {
      if (tableRows.length > 0) {
        rendered.push(
          <div key={`table-${i}`} className="my-8 overflow-x-auto shadow-sm border border-slate-900">
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', border: '2px solid #0f172a' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a' }}>
                  {tableRows[0].map((cell, idx) => (
                    <th key={idx} style={{ padding: '12px', border: '1px solid #ffffff', textAlign: 'left', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#ffffff' }}>
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f1f5f9' }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: '10px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#1e293b', fontWeight: '500', lineHeight: '1.4' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      inTable = false;
      tableRows = [];
    }

    // Estilo de Lista e Numeração Lei 14.133
    const isListItem = /^\d+\./.test(line) || /^\d+\.\d+/.test(line) || /^[-*?]/.test(line);
    let processed = line
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    if (line === '') {
      rendered.push(<div key={`space-${i}`} className="h-6" />);
    } else {
      rendered.push(
        <p 
          key={`p-${i}`} 
          className={`${isPaper ? 'minuta-text' : 'text-[13px]'} mb-6 text-justify leading-relaxed ${textColor} ${isListItem ? (isPaper ? 'pl-10 border-l-4 border-slate-100' : 'pl-4 border-l-2 border-blue-500/30') : ''}`}
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    }
  }

  return <div className="max-w-none">{rendered}</div>;
};

export default MarkdownRenderer;
