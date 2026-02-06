
import React, { useState, useEffect } from 'react';
import { TargetField, Modality, BiddingPhase, ContextData, ChatMessage, FullDocument } from './types';
import { generateInitialDraft, sendChatMessage } from './services/geminiService';
import InputSection from './components/InputSection';
import OutputSection from './components/OutputSection';
import FullDocumentModal from './components/FullDocumentModal';
import { Scale, Sun, Moon, FileText, Download, Trash2, ShieldCheck, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [formData, setFormData] = useState<ContextData>({
    phase: BiddingPhase.PLANEJAMENTO,
    modality: Modality.PREGAO,
    target: TargetField.TR,
    objectAndPurpose: '',
    itemsInfo: '',
    legalBaseDetails: '',
    itemFiles: []
  });

  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [fullDocument, setFullDocument] = useState<FullDocument>({});
  const [showFullDoc, setShowFullDoc] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const handleFormDataChange = (newData: Partial<ContextData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleGenerate = async () => {
    if (!formData.objectAndPurpose.trim()) return alert("DEFINA O OBJETO DA CONTRATAÇÃO.");
    setLoading(true);
    try {
      // Passamos o fullDocument para que a IA tenha consciência do que já foi escrito
      const { draft, commentary } = await generateInitialDraft(formData, fullDocument);
      if (draft) {
        setResult(draft);
        setFullDocument(prev => ({ ...prev, [formData.target]: draft }));
      }
      if (commentary) setChatHistory(prev => [...prev, { role: 'model', text: commentary }]);
    } catch (e) {
      alert("ERRO NA CONEXÃO COM O GABINETE DE IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', text };
    setChatHistory(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const response = await sendChatMessage(text, [...chatHistory, userMsg], formData, result, fullDocument);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Erro na consultoria técnica." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("GABINETE LICITAI - MINUTA OFICIAL v15.0", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Modalidade: ${formData.modality} | Documento: ${formData.target}`, 20, 35);
    doc.setFont("helvetica", "normal");
    const content = result || "Sem conteúdo";
    const lines = doc.splitTextToSize(content, 170);
    doc.text(lines, 20, 45);
    doc.save(`${formData.target.replace(/\s/g, '_')}_${Date.now()}.pdf`);
  };

  return (
    <div className={`h-screen flex flex-col transition-all duration-700 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <header className={`h-20 border-b flex items-center justify-between px-10 z-50 shrink-0 ${theme === 'dark' ? 'bg-[#010409]/90 border-white/5' : 'bg-white border-slate-200'} backdrop-blur-xl shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-600 rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Scale className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-xl font-black uppercase tracking-[0.2em] leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              LicitAI <span className="text-blue-500">Command</span>
            </h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Protocolo 14.133 Ativo
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 rounded-xl border border-white/5 text-amber-500 hover:bg-white/5 transition-all">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          
          <button onClick={() => setShowFullDoc(true)} className={`px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${theme === 'dark' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
            <FileText className="w-4 h-4" /> Dossiê ({Object.keys(fullDocument).length})
          </button>
          
          <button onClick={exportPdf} className="p-3 bg-blue-600 text-white rounded-xl shadow-blue-900/30 hover:scale-105 active:scale-95 transition-all">
            <Download className="w-5 h-5" />
          </button>

          <button onClick={() => confirm("Apagar todo o dossiê?") && (setResult(null), setChatHistory([]), setFullDocument({}))} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`w-[360px] border-r p-8 overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'bg-[#010409] border-white/5' : 'bg-white border-slate-200'}`}>
          <InputSection data={formData} onChange={handleFormDataChange} onGenerate={handleGenerate} loading={loading} theme={theme} />
        </aside>

        <main className="flex-1 relative overflow-hidden">
          <OutputSection 
            result={result} 
            chatHistory={chatHistory} 
            onSendMessage={handleSendMessage} 
            chatLoading={chatLoading} 
            onAnalyzeContradictions={() => handleSendMessage("Auditoria Jurídica Completa.")} 
            theme={theme}
          />
        </main>
      </div>

      {showFullDoc && (
        <FullDocumentModal doc={fullDocument} onClose={() => setShowFullDoc(false)} onClear={() => setFullDocument({})} theme={theme} />
      )}
    </div>
  );
};

export default App;
