
import React from 'react';
import { TargetField, FullDocument } from '../types';

interface FullDocumentModalProps {
  doc: FullDocument;
  onClose: () => void;
  onClear: () => void;
}

const FullDocumentModal: React.FC<FullDocumentModalProps> = ({ doc, onClose, onClear }) => {
  const sections = Object.entries(doc) as [TargetField, string][];

  const handleCopyAll = () => {
    const text = sections.map(([field, content]) => `--- ${field} ---\n\n${content}`).join('\n\n\n');
    navigator.clipboard.writeText(text);
    alert("Minuta completa copiada para a área de transferência!");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border-4 border-slate-900">
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-black uppercase tracking-widest italic">Minuta Compilada do Documento</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 bg-slate-50">
          {sections.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-xl font-bold">Nenhuma seção foi compilada ainda.</p>
              <p className="text-sm">Gere textos no painel principal para ver a minuta crescer aqui.</p>
            </div>
          ) : (
            sections.map(([field, content], idx) => (
              <section key={idx} className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm relative group">
                <div className="absolute -top-4 left-4 bg-blue-900 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-white shadow-md">
                  {field}
                </div>
                <div className="mt-4 whitespace-pre-wrap font-sans text-slate-900 text-base leading-relaxed">
                  {content}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="bg-slate-100 px-6 py-4 border-t-2 border-slate-200 flex justify-between shrink-0">
          <button 
            onClick={onClear}
            className="text-red-700 hover:text-red-900 font-black text-xs uppercase flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpar Minuta
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-black text-xs uppercase text-slate-700 border-2 border-slate-300 hover:bg-white transition-all"
            >
              Fechar
            </button>
            <button 
              disabled={sections.length === 0}
              onClick={handleCopyAll}
              className="px-6 py-2 bg-blue-900 text-white rounded-lg font-black text-xs uppercase hover:bg-blue-800 transition-all shadow-md border-b-2 border-black disabled:bg-slate-300 disabled:border-slate-400"
            >
              Copiar Minuta Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullDocumentModal;
