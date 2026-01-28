
import React from 'react';
import { TargetField, FullDocument } from '../types';

interface FullDocumentModalProps {
  doc: FullDocument;
  onClose: () => void;
  onClear: () => void;
}

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  const rendered = [];
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) inTable = true;
      if (line.includes('---')) continue;
      const cells = line.split('|').filter(c => c !== "").map(c => c.trim());
      tableRows.push(cells);
    } else {
      if (inTable) {
        rendered.push(
          <div key={`table-${i}`} className="overflow-x-auto my-4 border border-slate-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>{tableRows[0].map((cell, idx) => (<th key={idx} className="px-4 py-2 text-left text-[11px] font-extrabold text-slate-700 uppercase tracking-wide border-r border-slate-200 last:border-0">{cell}</th>))}</tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {tableRows.slice(1).map((row, rIdx) => (<tr key={rIdx}>{row.map((cell, cIdx) => (<td key={cIdx} className="px-4 py-2 text-sm text-slate-800 border-r border-slate-100 last:border-0">{cell}</td>))}</tr>))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableRows = [];
      }
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      rendered.push(<p key={i} className="mb-2 last:mb-0 leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: processedLine }}></p>);
    }
  }
  return <div className="text-slate-950 font-sans">{rendered}</div>;
};

const FullDocumentModal: React.FC<FullDocumentModalProps> = ({ doc, onClose, onClear }) => {
  const sections = Object.entries(doc) as [TargetField, string][];

  const handleCopyAll = () => {
    const text = sections.map(([field, content]) => `--- ${field} ---\n\n${content}`).join('\n\n\n');
    navigator.clipboard.writeText(text);
    alert("Minuta completa copiada para a área de transferência!");
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border-4 border-blue-900">
        <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shrink-0 shadow-md">
          <h2 className="text-xl font-black uppercase tracking-widest italic drop-shadow-sm">Minuta Compilada</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 bg-slate-50">
          {sections.length === 0 ? <p className="text-center py-20 font-bold opacity-30 uppercase tracking-widest text-slate-500">Documento Vazio. Gere as seções para visualizá-las aqui.</p> :
            sections.map(([field, content], idx) => (
              <section key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-md relative pt-10">
                <div className="absolute -top-4 left-4 bg-blue-700 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase border-2 border-white shadow-lg">{field}</div>
                {renderMarkdown(content)}
              </section>
            ))
          }
        </div>
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button 
            onClick={onClear} 
            className="text-red-600 font-black text-xs uppercase px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Limpar Tudo
          </button>
          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-2 rounded-lg font-bold text-sm uppercase text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors shadow-sm"
            >
              Fechar
            </button>
            <button 
              onClick={handleCopyAll} 
              disabled={sections.length === 0} 
              className={`px-6 py-2 bg-blue-900 text-white rounded-lg font-bold text-sm uppercase border-b-3 border-black hover:bg-blue-800 transition-all shadow-md ${sections.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Copiar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullDocumentModal;