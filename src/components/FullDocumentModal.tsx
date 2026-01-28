import React from 'react';
import { TargetField, FullDocument } from '../types';
import MarkdownRenderer from './MarkdownRenderer'; // Importar o novo componente

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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-blue-700">
        <div className="bg-blue-800 text-white px-6 py-4 flex justify-between items-center shrink-0 shadow-md">
          <h2 className="text-2xl font-extrabold uppercase tracking-widest italic drop-shadow-sm">Minuta Compilada</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 bg-slate-100">
          {sections.length === 0 ? <p className="text-center py-20 font-extrabold opacity-40 uppercase tracking-widest text-slate-500 text-lg">Documento Vazio. Gere as seções para visualizá-las aqui.</p> :
            sections.map(([field, content], idx) => (
              <section key={idx} className="bg-white p-7 rounded-2xl border border-slate-200 shadow-lg relative pt-12">
                <div className="absolute -top-5 left-6 bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-extrabold uppercase border-2 border-white shadow-xl">{field}</div>
                <MarkdownRenderer text={content} />
              </section>
            ))
          }
        </div>
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button 
            onClick={onClear} 
            className="text-red-500 font-extrabold text-sm uppercase px-5 py-2.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Limpar Tudo
          </button>
          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm uppercase border border-slate-300 hover:bg-slate-300 transition-colors shadow-sm"
            >
              Fechar
            </button>
            <button 
              onClick={handleCopyAll} 
              disabled={sections.length === 0} 
              className={`px-6 py-2.5 bg-blue-700 text-white rounded-xl font-bold text-sm uppercase shadow-md hover:bg-blue-800 transition-all ${sections.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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