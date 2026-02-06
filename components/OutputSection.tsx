
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FileData } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  Copy, Send, Paperclip, ChevronRight, ChevronLeft,
  RefreshCw, X, MessageSquare, BookOpen, Scroll
} from 'lucide-react';

interface OutputSectionProps {
  result: string | null;
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string, files?: FileData[]) => void;
  chatLoading: boolean;
  onAnalyzeContradictions: () => void;
  theme: 'dark' | 'light';
}

const OutputSection: React.FC<OutputSectionProps> = ({ result, chatHistory, onSendMessage, chatLoading, onAnalyzeContradictions, theme }) => {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    if (chatLoading) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className={`flex-1 flex h-full overflow-hidden ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-200'}`}>
      {/* Área da Minuta - Centralizada */}
      <div className="flex-1 overflow-hidden p-6 md:p-10 flex flex-col items-center">
        
        {/* O "Papel" com Scroll Interno */}
        <div className="w-full max-w-[850px] h-full bg-white shadow-2xl rounded-sm border-t-[10px] border-blue-900 flex flex-col overflow-hidden">
          
          <div className="p-8 pb-4 text-center border-b border-slate-100 shrink-0 relative">
             <div className="absolute top-8 left-8 opacity-10">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Coat_of_arms_of_Brazil.svg/1024px-Coat_of_arms_of_Brazil.svg.png" className="h-16" alt="Brasão" />
             </div>
             <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-[0.4em]">Administração Pública Federal</p>
             <h2 className="text-lg font-black text-slate-900 uppercase">Minuta Técnica Operacional - Lei 14.133/21</h2>
             
             {result && (
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(result);
                   setCopied(true);
                   setTimeout(() => setCopied(false), 2000);
                 }}
                 className="absolute top-8 right-8 px-4 py-2 rounded-full font-black text-[9px] bg-blue-600 text-white hover:bg-blue-500 shadow-md flex items-center gap-2 transition-all active:scale-95"
               >
                 <Copy className="w-3 h-3" />
                 {copied ? 'Copiado' : 'Copiar Tudo'}
               </button>
             )}
          </div>

          {/* SCROLL DEDICADO DO TEXTO NO FUNDO BRANCO */}
          <div className="flex-1 overflow-y-auto px-10 md:px-20 py-10 custom-scrollbar bg-white">
            <div className="min-h-full">
              {result ? (
                <MarkdownRenderer text={result} isPaper={true} />
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center opacity-10">
                   <RefreshCw className="w-16 h-16 mb-4 animate-spin text-blue-600" />
                   <p className="font-serif italic text-xl text-center text-slate-900">Aguardando processamento de diretrizes...</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest shrink-0 bg-slate-50/50">
             <span className="flex items-center gap-2"><Scroll className="w-3 h-3"/> PNCP COMPLIANT</span>
             <span>LicitAI Gabinete v5.7</span>
          </div>
        </div>
      </div>

      {/* Consultoria Sidebar */}
      <div className={`transition-all duration-500 border-l flex flex-col relative shrink-0 ${isPanelOpen ? 'w-[450px]' : 'w-14'} ${theme === 'dark' ? 'bg-[#010409] border-white/10' : 'bg-white border-slate-200'}`}>
        <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl z-50">
          {isPanelOpen ? <ChevronRight className="w-6 h-6"/> : <ChevronLeft className="w-6 h-6"/>}
        </button>

        {isPanelOpen && (
          <>
            <div className="p-6 border-b bg-gradient-to-br from-blue-950/20 to-black border-white/5 shrink-0">
              <div className="flex items-center gap-3 mb-1">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-black uppercase text-white tracking-widest">Consultoria Dr. LicitAI</h3>
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Auditoria de Normativas em Tempo Real</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[8px] font-black uppercase mb-1 ${msg.role === 'user' ? 'text-blue-500' : 'text-slate-500'}`}>
                    {msg.role === 'user' ? 'Operador' : 'Dr. LicitAI'}
                  </span>
                  <div className={`max-w-[95%] px-5 py-3 rounded-xl text-[12px] border ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-400' : 'bg-[#111827] text-slate-100 border-white/10'}`}>
                    <MarkdownRenderer text={msg.text} isPaper={false} theme={theme} />
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-[10px] font-black text-blue-500 animate-pulse uppercase">Consultando AGU...</div>}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t bg-black border-white/5 shrink-0">
              <div className="flex items-center rounded-xl border border-white/10 bg-slate-900 p-1.5 focus-within:border-blue-500">
                <input 
                  type="text" 
                  placeholder="SOLICITE AJUSTES..." 
                  className="flex-1 bg-transparent font-bold text-[11px] px-4 py-3 outline-none text-white uppercase" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                />
                <button onClick={handleSend} className="p-3 rounded-lg bg-blue-600 text-white"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OutputSection;
