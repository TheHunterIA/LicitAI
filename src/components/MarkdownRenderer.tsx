
import React from 'react';

interface MarkdownRendererProps {
  text: string | null;
  isPaper?: boolean;
  theme?: 'dark' | 'light';
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text, isPaper = true, theme = 'dark' }) => {
  if (!text) return null;

  // Limpeza de possíveis resíduos de JSON se a IA falhar
  const sanitizedText = text.replace(/^```json/, '').replace(/```$/, '').trim();

  const lines = sanitizedText.split('\n');
  const rendered = [];
  let currentTable: string[][] = [];
  let inTable = false;

  const flushTable = (key: string) => {
    if (currentTable.length < 1) return null;
    // Se a tabela estiver incompleta (apenas header), tenta fechar
    const table = (
      <div key={key} className="my-6 overflow-x-auto rounded border border-slate-900 shadow-md">
        <table className="w-full border-collapse bg-white text-[12px]">
          <thead>
            <tr className="bg-slate-900 text-white">
              {currentTable[0]?.map((cell, idx) => (
                <th key={idx} className="p-3 text-left font-black uppercase tracking-widest border border-white/10">
                  {cell.trim()}
                </th>
              )) || <th>Item</th>}
            </tr>
          </thead>
          <tbody>
            {currentTable.slice(1).map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-3 font-medium text-slate-800 border border-slate-200">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTable = [];
    inTable = false;
    return table;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detecção de Tabela
    if (line.startsWith('|')) {
      if (line.includes('---')) continue;
      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cells.length > 0) {
        currentTable.push(cells);
        inTable = true;
        continue;
      }
    }

    if (inTable && !line.startsWith('|')) {
      const table = flushTable(`table-${i}`);
      if (table) rendered.push(table);
    }

    // Títulos (Cláusulas)
    if (line.startsWith('#')) {
      const level = (line.match(/^#+/) || ['#'])[0].length;
      const content = line.replace(/^#+\s*/, '');
      rendered.push(
        <h3 key={`h-${i}`} className={`font-black uppercase text-blue-950 border-b-2 border-slate-300 pb-2 mb-4 mt-8 tracking-tight ${level === 1 ? 'text-xl' : 'text-lg'}`}>
          {content}
        </h3>
      );
      continue;
    }

    if (line === '') {
      rendered.push(<div key={`space-${i}`} className="h-4" />);
      continue;
    }

    // Parágrafos e Listas
    const isListItem = /^(\d+\.|[-*])/.test(line);
    const formattedText = line
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    rendered.push(
      <p 
        key={`p-${i}`} 
        className={`text-[14px] leading-relaxed mb-3 text-justify ${isPaper ? 'text-slate-900 font-serif' : 'text-inherit'} ${isListItem ? 'pl-8 border-l-2 border-slate-100' : ''}`}
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  }

  if (inTable) {
    const table = flushTable('table-final');
    if (table) rendered.push(table);
  }

  return <div className="max-w-none">{rendered}</div>;
};

export default MarkdownRenderer;
