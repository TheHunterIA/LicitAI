
import React, { useState } from 'react';
import { TargetField, FullDocument } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface FullDocumentModalProps {
  doc: FullDocument;
  onClose: () => void;
  onClear: () => void;
  // Added theme prop to match usage in App.tsx
  theme?: 'dark' | 'light';
}

// Destructure theme from props with default value
const FullDocumentModal: React.FC<FullDocumentModalProps> = ({ doc, onClose, onClear, theme = 'light' }) => {
  const [copied, setCopied] = useState(false);
  const sections = Object.entries(doc) as [TargetField, string][];

  // Função para converter Markdown em HTML para o clipboard
  const convertToHtml = (field: string, md: string) => {
    let contentHtml = md
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/\n/g, '<br/>');

    // Processamento de Tabelas
    const lines = md.split('\n');
    let inTable = false;
    let tableHtml = '<table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-family: Arial, sans-serif;">';
    let sectionHtml = `<h2>${field}</h2>`;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          sectionHtml += tableHtml;
        }
        if (trimmed.includes('---')) return;
        const cells = trimmed.split('|').filter(c => c.trim() !== "");
        sectionHtml += '<tr>';
        cells.forEach(cell => {
          sectionHtml += `<td style="padding: 8px; border: 1px solid #333;">${cell.trim()}</td>`;
        });
        sectionHtml += '</tr>';
      } else {
        if (inTable) {
          sectionHtml += '</table>';
          inTable = false;
        }
        if (trimmed !== "") sectionHtml += `<p>${trimmed}</p>`;
      }
    });
    if (inTable) sectionHtml += '</table>';
    return sectionHtml;
  };

  const handleCopyAll = async () => {
    if (sections.length === 0) return;

    const fullHtml = `<html><body>${sections.map(([f, c]) => convertToHtml(f, c)).join('<hr/>')}</body></html>`;
    const fullText = sections.map(([f, c]) => `--- ${f} ---\n\n${c}`).join('\n\n\n');

    try {
      const blobHtml = new Blob([fullHtml], { type: 'text/html' });
      const blobText = new Blob([fullText], { type: 'text/plain' });
      const data = [new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })];
      
      await navigator.clipboard.write(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      navigator.clipboard.writeText(fullText);
      alert("Copiado como texto simples (Seu navegador não suporta cópia de tabelas).");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-5xl h-full max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-blue-700">
        <div className="bg-blue-900 text-white px-8 py-5 flex justify-between items-center shrink-0 shadow-lg">
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Minuta Técnica Compilada</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-16 bg-slate-50 custom-scrollbar">
          {sections.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-24 opacity-40 text-slate-500 font-extrabold uppercase tracking-widest text-xl text-center">
              <svg className="w-20 h-20 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={1.5} />
              </svg>
              Nenhuma seção gerada
            </div>
          ) : (
            sections.map(([field, content], idx) => (
              <section key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative pt-14 group">
                <div className="absolute -top-6 left-8 bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-black uppercase border-4 border-white shadow-xl">
                  {field}
                </div>
                {/* Pass theme to MarkdownRenderer */}
                <MarkdownRenderer text={content} theme={theme} />
              </section>
            ))
          )}
        </div>

        <div className="bg-white px-8 py-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 shadow-inner">
          <button 
            onClick={onClear} 
            className="text-red-500 font-extrabold text-sm uppercase px-6 py-3 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg>
            Apagar Minuta
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm uppercase border border-slate-300 hover:bg-slate-200 transition-colors shadow-sm active:scale-95"
            >
              Fechar
            </button>
            <button 
              onClick={handleCopyAll} 
              disabled={sections.length === 0} 
              className={`px-8 py-3 rounded-xl font-bold text-sm uppercase shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 
                ${copied ? 'bg-green-600 text-white' : 'bg-blue-800 text-white hover:bg-blue-900'} 
                ${sections.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" strokeWidth={2.5}/></svg>
              {copied ? 'COPIADO COM TABELAS!' : 'COPIAR TUDO (WORD/PORTAL)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullDocumentModal;
