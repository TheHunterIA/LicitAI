
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FileData } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  Copy, Zap, Send, Paperclip, 
  ChevronRight, ChevronLeft,
  RefreshCw, MessageSquare, Scroll, AlertCircle, FileText
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
    if (!chatInput.trim() || chatLoading) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className={`flex-1 flex h-full overflow-hidden ${theme === 'dark' ? 'bg-[#020817]' : 'bg-slate-200'}`}>
      {/* Visualização de Papel da Minuta */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col items-center">
        <div className="w-full max-w-[820px] minuta-paper rounded shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col min-h-[1100px] mb-20 animate-in zoom-in-95 duration-500">
          
          {/* Cabeçalho do Papel */}
          <div className="p-12 pb-6 border-b border-slate-100 flex flex-col items-center relative">
             <div className="mb-6 opacity-80">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Coat_of_arms_of_Brazil.svg/1024px-Coat_of_arms_of_Brazil.svg.png" className="h-20" alt="Brasão" />
             </div>
             <div className="text-center space-y-1">
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">República Federativa do Brasil</p>
               <p className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Ministério da Gestão e da Inovação em Serviços Públicos</p>
               <h2 className="text-xl font-black text-blue-900 uppercase mt-4 tracking-tighter">Minuta de Planejamento - Lei 14.133/21</h2>
             </div>
             
             {result && (
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(result);
                   setCopied(true);
                   setTimeout(() => setCopied(false), 2000);
                 }}
                 className="absolute top-12 right-12 p-3 rounded-xl bg-blue-600/5 hover:bg-blue-600/10 text-blue-600 transition-all active:scale-95 border border-blue-600/10"
               >
                 {copied ? <Zap className="w-5 h-5 fill-current" /> : <Copy className="w-5 h-5" />}
               </button>
             )}
          </div>

          {/* Área do Texto (Lora Serif) */}
          <div className="flex-1 px-16 py-12">
            {result ? (
              <MarkdownRenderer text={result} isPaper={true} theme={theme} />
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center opacity-30 italic font-serif text-slate-400">
                 <Scroll className="w-20 h-20 mb-6 animate-pulse" />
                 <p className="text-xl">Aguardando parametrização técnica...</p>
                 <div className="mt-10 flex gap-2">
                    {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
                 </div>
              </div>
            )}
          </div>

          {/* Rodapé do Papel */}
          <div className="p-12 border-t border-slate-50 flex justify-between items-end shrink-0 opacity-40">
             <div className="space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Gerado via LicitAI Command Gabinete</p>
                <p className="text-[7px] font-bold uppercase text-slate-400">Certificação Técnica de Conformidade PNCP</p>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-slate-200 rounded flex items-center justify-center">
                   <FileText className="w-6 h-6 text-slate-300" />
                </div>
                <div className="text-right">
                   <p className="text-[7px] font-black uppercase text-slate-500 tracking-tighter">Visto Eletrônico</p>
                   <p className="text-[8px] font-mono font-bold text-blue-600 uppercase tracking-tighter">LICIT-14133-MASTER</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Consultoria Gabinete */}
      <div className={`transition-all duration-700 border-l flex flex-col relative shrink-0 ${isPanelOpen ? 'w-[420px]' : 'w-14'} ${theme === 'dark' ? 'bg-[#010409] border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200'}`}>
        <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="absolute -left-5 top-24 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl z-50 border-4 border-[#020817] active:scale-95 transition-transform">
          {isPanelOpen ? <ChevronRight className="w-5 h-5"/> : <ChevronLeft className="w-5 h-5"/>}
        </button>

        {isPanelOpen && (
          <>
            <div className="p-8 border-b bg-gradient-to-br from-blue-950/40 to-black/40 border-white/5 shrink-0">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-[0.1em]">Consultoria Master</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">IA Sênior em Direito Adm.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#010409]/30">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[8px] font-black uppercase mb-1.5 flex items-center gap-2 ${msg.role === 'user' ? 'text-blue-500' : 'text-slate-500'}`}>
                    {msg.role === 'user' ? 'Operador' : 'Parecer Especialista'}
                  </span>
                  <div className={`max-w-[90%] px-6 py-4 rounded-2xl text-[12px] leading-relaxed border transition-all ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_15px_rgba(37,99,235,0.3)]' : 'bg-slate-900 text-slate-100 border-white/10'}`}>
                    <MarkdownRenderer text={msg.text} isPaper={false} theme={theme} />
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-3 text-[10px] font-black text-blue-500 animate-pulse uppercase tracking-widest">
                  <Zap className="w-4 h-4" /> Analisando Jurisprudência...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-8 border-t bg-black/60 border-white/5 shrink-0">
              <div className="flex items-center rounded-2xl border border-white/10 bg-slate-900/50 p-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                <input 
                  type="text" 
                  placeholder="SOLICITAR REVISÃO..." 
                  className="flex-1 bg-transparent font-bold text-[11px] px-4 py-3 outline-none text-white uppercase placeholder-slate-600" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                />
                <button onClick={handleSend} className="p-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OutputSection;
