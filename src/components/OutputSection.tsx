import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FileData } from '../types';
import MarkdownRenderer from './MarkdownRenderer'; // Importar o novo componente

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
  const [pendingFiles, setPendingFiles] = useState<FileData[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if ((!chatInput.trim() && pendingFiles.length === 0) || chatLoading) return;
    onSendMessage(chatInput, pendingFiles.length > 0 ? pendingFiles : undefined);
    setChatInput('');
    setPendingFiles([]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });
  };

  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: FileData[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      newFiles.push({ name: file.name, mimeType: file.type, data: base64 });
    }
    setPendingFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removePendingFile = (idx: number) => setPendingFiles(prev => prev.filter((_, i) => i !== idx));

  const hasResult = result !== null && result !== "";

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-full">
      {/* Rascunho */}
      <div className="flex-1 flex flex-col min-h-[30vh] border-b-4 border-slate-100">
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-base font-extrabold text-slate-700 uppercase tracking-widest">Minuta Técnica para o Portal</span>
          {hasResult && (
            <button onClick={copyToClipboard} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-md 
              ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`
            }>
              {copied ? 'COPIADO!' : 'COPIAR PARA O PORTAL'}
            </button>
          )}
        </div>
        <div className="flex-1 p-6 overflow-auto bg-white">
          {hasResult ? <MarkdownRenderer text={result} /> : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center uppercase tracking-tighter">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xl font-extrabold text-slate-300">Aguardando Redação</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="bg-slate-50 flex flex-col max-h-[min(500px,60vh)] shrink-0">
        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm shrink-0">
          <span className="text-sm font-extrabold text-blue-900 uppercase tracking-wide">Consultoria de Pregoeiro</span>
          <button onClick={onAnalyzeContradictions} className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold border border-blue-200 uppercase hover:bg-blue-200 transition-colors shadow-sm">Auditagem de Documentos</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-tl-md border border-slate-200'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                {msg.files && msg.files.length > 0 && (
                  <div className={`mt-2 flex flex-wrap gap-1 pt-2 ${msg.role === 'user' ? 'border-t border-white/30' : 'border-t border-slate-300'}`}>
                    {msg.files.map((f, fi) => (
                      <div key={fi} className={`text-[9px] px-1.5 py-0.5 rounded-full border shadow-inner truncate max-w-[100px] 
                        ${msg.role === 'user' ? 'bg-white/20 border-white/40 text-white' : 'bg-white border-slate-300 text-slate-700'}`
                      }>
                        {f.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatLoading && <div className="flex justify-start"><span className="h-2 w-8 bg-slate-300 rounded-full animate-pulse"></span></div>}
          <div ref={chatEndRef} />
        </div>

        {/* Input Chat */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 shadow-inner shrink-0">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 bg-blue-100 p-2 rounded-lg border border-blue-200 max-h-24 overflow-y-auto shadow-sm">
              {pendingFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button onClick={() => removePendingFile(idx)} className="text-white/80 hover:text-white"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input type="file" ref={chatFileRef} className="hidden" multiple accept=".pdf,.csv,.txt,image/*" onChange={handleChatFileUpload} />
            <button 
              onClick={() => chatFileRef.current?.click()} 
              className="p-3 bg-slate-200 text-slate-700 rounded-xl border border-slate-300 hover:bg-slate-300 transition-colors shadow-sm active:scale-95"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <input 
              type="text" 
              placeholder="Falar com o Especialista (PDF/CSV/TXT/IMG)..." 
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none text-sm font-medium placeholder:text-slate-400" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
            />
            <button 
              onClick={handleSend} 
              disabled={chatLoading || (!chatInput.trim() && pendingFiles.length === 0)} 
              className={`bg-blue-700 text-white px-4 rounded-xl shadow-md hover:bg-blue-800 transition-all active:scale-95 ${chatLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutputSection;