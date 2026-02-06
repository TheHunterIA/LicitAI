
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FileData } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  Copy, Zap, Send, ChevronRight, ChevronLeft,
  MessageSquare, Scroll, FileText, ShieldCheck
} from 'lucide-react';

interface OutputSectionProps {
  result: string | null;
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => void;
  chatLoading: boolean;
  theme: 'dark' | 'light';
  // Fixed: Added missing prop required by the main application
  onAnalyzeContradictions: () => void;
}

const OutputSection: React.FC<OutputSectionProps> = ({ result, chatHistory, onSendMessage, chatLoading, theme, onAnalyzeContradictions }) => {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [chatHistory]);

  const handleSend = () => {
    if (!chatInput.trim() || chatLoading) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className={`flex-1 flex h-full overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#020817]' : 'bg-slate-100'}`}>
      
      {/* Visualização de Papel da Minuta */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col items-center">
        <div className="w-full max-w-[820px] bg-white rounded shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col min-h-[1100px] mb-20">
          <div className="p-12 pb-6 border-b border-slate-100 flex flex-col items-center relative">
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Coat_of_arms_of_Brazil.svg/1024px-Coat_of_arms_of_Brazil.svg.png" className="h-16 mb-6 opacity-80" alt="Brasão" />
             <div className="text-center space-y-1">
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.4em]">Governo Federal</p>
               <h2 className="text-lg font-black text-blue-900 uppercase tracking-tighter">Minuta Técnica Administrativa - Lei 14.133/21</h2>
             </div>
             {result && (
               <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
                 className="absolute top-12 right-12 p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-all">
                 {copied ? <ShieldCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
               </button>
             )}
          </div>

          <div className="flex-1 px-16 py-12 bg-white font-serif">
            {result ? <MarkdownRenderer text={result} isPaper={true} theme={theme} /> : 
              <div className="h-[600px] flex flex-col items-center justify-center opacity-20 italic text-slate-400 text-center px-10">
                 <Scroll className="w-16 h-16 mb-6" />
                 <p className="text-lg">Preencha os campos laterais para sincronizar com a Inteligência Jurídica.</p>
              </div>
            }
          </div>
        </div>
      </div>

      {/* Barra de Consultoria Master */}
      <div className={`transition-all duration-700 border-l flex flex-col relative shrink-0 ${isPanelOpen ? 'w-[420px]' : 'w-0'} ${theme === 'dark' ? 'bg-[#010409] border-white/5' : 'bg-white border-slate-200'}`}>
        
        <button onClick={() => setIsPanelOpen(!isPanelOpen)} className={`absolute -left-5 top-24 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl z-50 border-4 transition-all bg-blue-600 ${theme === 'dark' ? 'border-[#020817]' : 'border-slate-100'}`}>
          {isPanelOpen ? <ChevronRight className="w-5 h-5"/> : <ChevronLeft className="w-5 h-5"/>}
        </button>

        {isPanelOpen && (
          <>
            <div className={`p-8 border-b shrink-0 ${theme === 'dark' ? 'bg-blue-950/20' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-600'}`}>
                  <MessageSquare className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-white'}`} />
                </div>
                <div>
                  <h3 className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Consultoria LicitAI</h3>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Especialista Sênior 14.133</p>
                </div>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar ${theme === 'dark' ? 'bg-black/20' : 'bg-slate-50/30'}`}>
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[8px] font-black uppercase mb-1 ${msg.role === 'user' ? 'text-blue-500' : 'text-slate-400'}`}>
                    {msg.role === 'user' ? 'Você' : 'Dr. LicitAI'}
                  </span>
                  <div className={`max-w-[90%] px-5 py-3.5 rounded-2xl text-[12px] leading-relaxed border transition-all 
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-100' 
                      : (theme === 'dark' ? 'bg-slate-900 text-slate-100 border-white/5' : 'bg-white text-slate-700 border-slate-200 shadow-sm')}`}>
                    <MarkdownRenderer text={msg.text} isPaper={false} theme={theme} />
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-[10px] font-black text-blue-500 animate-pulse uppercase tracking-widest flex items-center gap-2"><Zap className="w-3 h-3"/> Analisando Base Legal...</div>}
              <div ref={chatEndRef} />
            </div>

            <div className={`p-6 border-t ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-slate-100'}`}>
              <div className={`flex items-center rounded-2xl border transition-all p-1.5 focus-within:ring-4 ${theme === 'dark' ? 'border-white/10 bg-slate-900/50 focus-within:ring-blue-500/10' : 'border-slate-200 bg-slate-50 focus-within:ring-blue-100'}`}>
                <input type="text" placeholder="Perguntar ao Gabinete..." className={`flex-1 bg-transparent font-bold text-[11px] px-4 py-2.5 outline-none uppercase placeholder-slate-400 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`} 
                  value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                <button onClick={handleSend} className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OutputSection;
