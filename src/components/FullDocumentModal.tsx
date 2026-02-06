
import React, { useState } from 'react';
import { TargetField, FullDocument } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { X, Copy, Trash2, FileCheck } from 'lucide-react';

interface FullDocumentModalProps {
  doc: FullDocument;
  onClose: () => void;
  onClear: () => void;
  // Added theme prop to match usage in App.tsx
  theme?: 'dark' | 'light';
}

// Destructure theme from props with default value
const FullDocumentModal: React.FC<FullDocumentModalProps> = ({ doc, onClose, onClear, theme = 'dark' }) => {
  const [copied, setCopied] = useState(false);
  const sections = Object.entries(doc) as [TargetField, string][];

  const handleCopyAll = () => {
    const text = sections.map(([field, content]) => `--- ${field.toUpperCase()} ---\n\n${content}`).join('\n\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="bg-[#0f172a] w-full max-w-6xl h-full max-h-[90vh] rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border border-white/10">
        {/* Header Superior */}
        <div className="bg-[#020617] px-10 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <FileCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">Dossiê de Licitação Compilado</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visualização em Conformidade com a Lei 14.133/21</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-8 h-8" />
          </button>
        </div>
        
        {/* Área de Conteúdo - Estilo Paper View Centralizado */}
        <div className="flex-1 overflow-y-auto p-12 space-y-20 bg-[#0f172a] custom-scrollbar">
          {sections.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
              <FileCheck className="w-32 h-32 text-slate-400 mb-6" strokeWidth={0.5} />
              <p className="font-black uppercase tracking-widest text-slate-500 text-2xl">Vazio Estrutural</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-16">
              {sections.map(([field, content], idx) => (
                <section key={idx} className="bg-white p-16 rounded-sm shadow-2xl relative border-t-8 border-blue-900">
                  <div className="absolute -top-6 left-10 bg-blue-950 text-white px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest shadow-xl border border-blue-800">
                    {field}
                  </div>
                  {/* Pass theme to MarkdownRenderer */}
                  <MarkdownRenderer text={content} theme={theme} />
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Footer de Comandos */}
        <div className="bg-[#020617] px-10 py-6 border-t border-white/5 flex justify-between items-center shrink-0">
          <button 
            onClick={onClear} 
            className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Expurgar Minuta
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              className="px-8 py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5"
            >
              Retornar ao Comando
            </button>
            <button 
              onClick={handleCopyAll} 
              disabled={sections.length === 0} 
              className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-2 active:scale-95
                ${copied ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-amber-950 hover:bg-amber-400'} 
                ${sections.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Conteúdo Copiado!' : 'Copiar Dossiê Completo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullDocumentModal;
