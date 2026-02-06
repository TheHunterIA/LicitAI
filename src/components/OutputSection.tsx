
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FileData } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  Terminal, Copy, Zap, Send, Paperclip, 
  ShieldAlert, Activity, ChevronRight, ChevronLeft,
  Gavel, Info, AlertTriangle, CheckCircle2, RefreshCw
} from 'lucide-react';

interface OutputSectionProps {
  result: string | null;
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string, files?: FileData[]) => void;
  chatLoading: boolean;
  onAnalyzeContradictions: () => void;
}

const OutputSection: React.FC<OutputSectionProps> = ({ result, chatHistory, onSendMessage, chatLoading, onAnalyzeContradictions }) => {
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

  const quickCommands = [
    { label: "Auditar Seção", icon: <ShieldAlert className="w-3 h-3"/>, cmd: "Audite esta seção conforme a Lei 14.133/21." },
    { label: "Prazos AGU", icon: <Activity className="w-3 h-3"/>, cmd: "Verifique se os prazos nesta seção estão em conformidade com as orientações da AGU." },
    { label: "Sugerir Sanções", icon: <Gavel className="w-3 h-3"/>, cmd: "Sugira cláusulas de sanções administrativas adequadas para este objeto." }
  ];

  return (
    <div className="flex-1 flex h-full overflow-hidden relative bg-[#020617]">
      {/* Visualização da Minuta (Paper View) */}
      <div className={`flex-1 overflow-y-auto p-12 flex justify-center custom-scrollbar transition-all duration-500 ${isPanelOpen ? 'mr-0' : 'mr-0'}`}>
        <div className="w-full max-w-[800px] bg-white shadow-2xl rounded-sm p-16 md:p-24 relative mb-20 border-t-[12px] border-blue-900 min-h-[1100px]">
          {/* Header de Documento Oficial */}
          <div className="border-b-4 border-slate-900 pb-8 mb-12 text-center">
            <div className="mb-4 flex justify-center opacity-30">
               <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Coat_of_arms_of_Brazil.svg/1024px-Coat_of_arms_of_Brazil.svg.png" className="h-16 grayscale" alt="Brasão" />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-[0.3em]">Marinha do Brasil</p>
            <h2 className="text-lg font-black text-slate-900 uppercase">Minuta de Licitação Automática</h2>
          </div>

          {result ? <MarkdownRenderer text={result} /> : (
            <div className="h-full flex flex-col items-center justify-center py-40 text-slate-300">
               <RefreshCw className="w-12 h-12 mb-6 animate-spin opacity-20" />
               <p className="font-serif italic text-slate-400 text-lg opacity-40">Aguardando injeção de parâmetros táticos...</p>
            </div>
          )}

          {/* Botão Flutuante de Cópia */}
          {result && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(result);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className={`absolute top-8 right-8 px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2
                ${copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copiado' : 'Copiar Texto'}
            </button>
          )}
        </div>
      </div>

      {/* PAINEL DE CONSULTORIA (SIDEBAR INTEGRADA) */}
      <div className={`transition-all duration-500 border-l border-white/10 flex flex-col bg-[#020617] relative ${isPanelOpen ? 'w-[450px]' : 'w-12'}`}>
        {/* Botão de Toggle */}
        <button 
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-blue-500 z-50 transition-transform active:scale-90"
        >
          {isPanelOpen ? <ChevronRight className="w-5 h-5"/> : <ChevronLeft className="w-5 h-5"/>}
        </button>

        {isPanelOpen ? (
          <>
            {/* Header do Painel */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-blue-950/20 to-black/20">
              <div className="flex items-center gap-3 mb-1">
                <Terminal className="w-5 h-5 text-blue-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Consultoria de Pregoeiro</h3>
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Status: Operação Lei 14.133 Ativa</p>
            </div>

            {/* Comandos Rápidos */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar shrink-0 bg-black/40 border-b border-white/5">
              {quickCommands.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => onSendMessage(q.cmd)}
                  className="whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/50 transition-all"
                >
                  {q.icon}
                  {q.label}
                </button>
              ))}
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-4">
                  <Info className="w-12 h-12 text-blue-500" strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase text-white tracking-widest max-w-[200px]">Inicie a redação para ativar a auditoria jurídica automática</p>
                </div>
              )}

              {chatHistory.map((msg, idx) => {
                const isRiscoCritico = msg.text.includes('CRÍTICO');
                const isRiscoModerado = msg.text.includes('MODERADO');

                return (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      {msg.role === 'model' && (
                        isRiscoCritico ? <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse"/> :
                        isRiscoModerado ? <AlertTriangle className="w-3 h-3 text-amber-500"/> :
                        <CheckCircle2 className="w-3 h-3 text-emerald-500"/>
                      )}
                      <span className={`text-[8px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-400' : 'text-slate-400'}`}>
                        {msg.role === 'user' ? 'Comando Externo' : 'Analista LicitAI'}
                      </span>
                    </div>
                    
                    <div className={`max-w-[95%] px-4 py-3 rounded-xl text-xs leading-relaxed border transition-all ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 border-blue-400 text-white rounded-tr-none shadow-lg shadow-blue-900/20' 
                        : 'bg-white/5 border-white/10 text-slate-200 rounded-tl-none backdrop-blur-md'
                    }`}>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <MarkdownRenderer text={msg.text} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {chatLoading && (
                <div className="flex flex-col items-start gap-2">
                  <span className="text-[8px] font-black text-blue-400 animate-pulse uppercase">Varrendo Base Normativa...</span>
                  <div className="flex gap-1.5 p-3 bg-white/5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input de Comando */}
            <div className="p-6 bg-black/40 border-t border-white/5">
              <div className="relative flex items-center bg-slate-900/60 rounded-xl border border-white/10 focus-within:border-blue-500 transition-all">
                <input 
                  type="text" 
                  placeholder="DIGITE UM COMANDO JURÍDICO..." 
                  className="flex-1 bg-transparent text-white font-bold text-[11px] px-4 py-4 outline-none placeholder:text-slate-600 uppercase tracking-widest" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                />
                <div className="flex items-center gap-1 pr-2">
                  <button className="p-2 text-slate-500 hover:text-blue-400 transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={chatLoading || !chatInput.trim()}
                    className={`p-2.5 rounded-lg text-white transition-all ${chatLoading || !chatInput.trim() ? 'bg-slate-800 opacity-20' : 'bg-blue-600 hover:bg-blue-500 active:scale-90'}`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center px-1">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">Criptografia Nível Militar Ativa</span>
                <span className="text-[7px] font-black text-blue-500 uppercase tracking-[0.1em]">v2.5 // CMD_CENTRAL</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center py-8 gap-8">
            <Terminal className="w-5 h-5 text-slate-700" />
            <div className="[writing-mode:vertical-lr] text-[10px] font-black uppercase text-slate-700 tracking-[0.5em] rotate-180">
              MODO CONSOLE
            </div>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default OutputSection;
