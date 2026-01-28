
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FileData } from '../types';

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
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
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

  const removePendingFile = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const hasResult = result !== null && result !== "";

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-slate-300 overflow-hidden flex flex-col h-full">
      {/* Painel Superior: Rascunho Oficial */}
      <div className="flex-1 flex flex-col min-h-0 border-b-4 border-slate-200">
        <div className="bg-slate-100 px-6 py-3 border-b-2 border-slate-300 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
             <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Minuta Técnica para o Portal</span>
             {hasResult && <span className="text-[9px] bg-green-600 text-white px-2 py-0.5 rounded font-black border border-green-800 uppercase tracking-tighter">Válido</span>}
          </div>
          {hasResult && (
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all transform active:scale-95 shadow-sm border-b-2 ${
                copied ? 'bg-green-600 border-green-800 text-white' : 'bg-blue-700 border-blue-900 text-white hover:bg-blue-800'
              }`}
            >
              {copied ? 'COPIADO' : 'COPIAR PARA O PORTAL'}
            </button>
          )}
        </div>

        <div className="flex-1 p-6 overflow-auto bg-white">
          {hasResult ? (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-slate-950 text-base leading-relaxed font-medium focus:outline-none">
                {result}
              </pre>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-10">
               <div className="bg-slate-50 p-4 rounded-full mb-4 border-2 border-slate-100">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
               </div>
               {result === "" ? (
                 <>
                   <p className="text-sm font-black text-blue-900 uppercase mb-2 tracking-widest">Informações Insuficientes</p>
                   <p className="text-xs font-bold leading-relaxed text-slate-500">
                     O Especialista ainda não possui dados suficientes para redigir esta seção. <br/>
                     <span className="text-blue-600">Verifique as orientações no Chat de Assessoria abaixo.</span>
                   </p>
                 </>
               ) : (
                 <p className="text-sm font-bold uppercase tracking-widest">Aguardando Parâmetros da OM</p>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Painel Inferior: Consultoria Jurídica */}
      <div className="bg-slate-50 flex flex-col h-[420px] shrink-0">
        <div className="px-4 py-2 border-b-2 border-slate-200 flex items-center justify-between bg-white shrink-0">
          <span className="text-[10px] font-black text-blue-900 uppercase flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Assessoria de Pregoeiro (Marinha)
          </span>
          <button 
            onClick={onAnalyzeContradictions}
            className="text-[9px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-black border border-amber-200 hover:bg-amber-200 transition-colors uppercase shadow-sm"
          >
            Auditagem de Contradições
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 && (
            <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4 text-center">
              <p className="text-[11px] text-blue-900 font-black uppercase mb-1 tracking-tighter">Mesa de Conferência MB</p>
              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                Aqui você receberá os **Alertas de Conformidade** e **Notas de Risco Jurídico**. <br/>
                O Especialista analisará a coerência desta seção com o restante da minuta gerada.
              </p>
            </div>
          )}
          {chatHistory.map((msg, idx) => {
            const isAlert = msg.text.includes("ALERTA DE CONFORMIDADE") || 
                            msg.text.includes("CONTRADIÇÃO") || 
                            msg.text.includes("ANÁLISE DE CONSISTÊNCIA");
            return (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm shadow-md border-2 transition-all ${
                  msg.role === 'user' 
                    ? 'bg-blue-900 text-white border-blue-950' 
                    : isAlert 
                      ? 'bg-white border-amber-500 text-slate-900'
                      : 'bg-white text-slate-900 border-slate-300'
                }`}>
                  {isAlert && msg.role === 'model' && (
                    <div className="flex items-center gap-1 mb-2 text-amber-600 border-b-2 border-amber-100 pb-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      <span className="text-[10px] uppercase font-black tracking-tight">Nota Técnica do Especialista</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.text}</p>
                  {msg.files && msg.files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.files.map((f, fi) => (
                        <div key={fi} className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded border border-white/30 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          <span className="truncate max-w-[80px]">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-slate-300 rounded-xl px-4 py-2 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-blue-900 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-900 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-blue-900 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Barra de Input do Chat com Anexos */}
        <div className="p-4 bg-white border-t-2 border-slate-200 shrink-0">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
              {pendingFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-1 rounded-md border border-blue-200">
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button onClick={() => removePendingFile(idx)} className="hover:text-red-600 transition-colors">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={chatFileRef} 
              className="hidden" 
              multiple 
              onChange={handleChatFileUpload} 
            />
            <button
              onClick={() => chatFileRef.current?.click()}
              className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all border-b-2 border-slate-300 active:border-b-0 active:translate-y-1"
              title="Anexar arquivos ao chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Falar com o Pregoeiro..."
              className="flex-1 px-4 py-3 border-2 border-slate-900 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold bg-white"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={chatLoading || (!chatInput.trim() && pendingFiles.length === 0)}
              className="bg-blue-900 text-white px-4 rounded-xl hover:bg-blue-800 disabled:bg-slate-300 transition-all border-b-4 border-black active:border-b-0 active:translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutputSection;
