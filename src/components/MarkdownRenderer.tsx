import React from 'react';

interface MarkdownRendererProps {
  text: string | null;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const rendered = [];
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      // Handle markdown tables
      if (!inTable) inTable = true;
      if (line.includes('---')) continue; // Skip table header separator line
      const cells = line.split('|').filter(c => c !== "").map(c => c.trim());
      tableRows.push(cells);
    } else {
      if (inTable) {
        // Render completed table
        rendered.push(
          <div key={`table-${rendered.length}`} className="overflow-x-auto my-4 border border-slate-300 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {tableRows[0].map((cell, idx) => (
                    <th key={idx} className="px-4 py-2 text-left text-[11px] font-extrabold text-slate-700 uppercase tracking-wide border-r border-slate-200 last:border-0">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {tableRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 text-sm text-slate-800 border-r border-slate-100 last:border-0">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableRows = [];
      }
      // Handle bold text (simple markdown)
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Render paragraphs
      if (processedLine) { // Only render if line is not empty after processing
        rendered.push(<p key={rendered.length} className="mb-2 last:mb-0 leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: processedLine }}></p>);
      }
    }
  }
  
  // Render any table that might be at the very end of the text
  if (inTable && tableRows.length > 0) {
    rendered.push(
      <div key={`table-end-${rendered.length}`} className="overflow-x-auto my-4 border border-slate-300 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>{tableRows[0].map((cell, idx) => (<th key={idx} className="px-4 py-2 text-left text-[11px] font-extrabold text-slate-700 uppercase tracking-wide border-r border-slate-200 last:border-0">{cell}</th>))}</tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {tableRows.slice(1).map((row, rIdx) => (<tr key={rIdx}>{row.map((cell, cIdx) => (<td key={cIdx} className="px-4 py-2 text-sm text-slate-800 border-r border-slate-100 last:border-0">{cell}</td>))}</tr>))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="text-slate-950 font-sans">{rendered}</div>;
};

export default MarkdownRenderer;