
import React, { useState, useEffect } from 'react';
import { TargetField, Modality, BiddingPhase, ContextData, ChatMessage, FullDocument } from './types';
import { generateInitialDraft, sendChatMessage } from './services/geminiService';
import InputSection from './components/InputSection';
import OutputSection from './components/OutputSection';
import FullDocumentModal from './components/FullDocumentModal';
import { Scale, Activity, Sun, Moon, FileText, Download, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [formData, setFormData] = useState<ContextData>({
    phase: BiddingPhase.PLANEJAMENTO,
    modality: Modality.PREGAO, // Garantindo o valor inicial
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

  useEffect(() => {
    document.body.className = `h-full overflow-hidden theme-${theme}`;
  }, [theme]);

  const handleFormDataChange = (newData: Partial<ContextData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleGenerate = async () => {
    if (!formData.objectAndPurpose.trim()) return alert("OBJETO NÃO INFORMADO.");
    setLoading(true);
    try {
      const { draft, commentary } = await generateInitialDraft(formData, fullDocument);
      if (draft) {
        setResult(draft);
        setFullDocument(prev => ({ ...prev, [formData.target]: draft }));
      }
      if (commentary) setChatHistory(prev => [...prev, { role: 'model', text: commentary }]);
    } catch (error) {
      alert("ERRO NA GERAÇÃO JURÍDICA.");
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
      setChatHistory(prev => [...prev, { role: 'model', text: "ERRO DE CONSULTORIA." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("GABINETE LICITAI - MINUTA OFICIAL", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Modalidade: ${formData.modality}`, 20, 35);
    doc.setFont("helvetica", "normal");
    const content = result || "Documento vazio";
    const lines = doc.splitTextToSize(content, 170);
    doc.text(lines, 20, 45);
    doc.save(`Minuta_14133_${Date.now()}.pdf`);
  };

  const clearAll = () => {
    if (confirm("Deseja expurgar todo o dossiê da sessão?")) {
      setFullDocument({});
      setResult(null);
      setChatHistory([]);
    }
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#020817]' : 'bg-slate-50'}`}>
      {/* Header Gabinete */}
      <header className={`h-20 border-b flex items-center justify-between px-10 z-50 shrink-0 ${theme === 'dark' ? 'bg-[#010409]/80 border-white/5' : 'bg-white border-slate-200'} backdrop-blur-md`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-blue-600 rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)]">
               <Scale className="text-white w-6 h-6" />
             </div>
             <div>
               <h1 className={`text-xl font-black uppercase tracking-[0.2em] leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                 LicitAI <span className="text-blue-500">Command</span>
               </h1>
               <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protocolo 14.133 Ativo // V14.2 Master</p>
               </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-3 rounded-xl border transition-all ${theme === 'dark' ? 'border-white/10 text-amber-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button onClick={() => setShowFullDoc(true)} className={`px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${theme === 'dark' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
            <FileText className="w-4 h-4" />
            Dossiê ({Object.keys(fullDocument).length})
          </button>
          
          <button onClick={exportToPdf} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-blue-900/20 active:translate-y-0.5">
            <Download className="w-4 h-4" />
          </button>

          <button onClick={clearAll} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Painel de Controle */}
        <aside className={`w-[360px] border-r p-8 overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'bg-[#010409] border-white/5' : 'bg-white border-slate-200'}`}>
          <InputSection data={formData} onChange={handleFormDataChange} onGenerate={handleGenerate} loading={loading} theme={theme} />
        </aside>

        {/* Workspace Central */}
        <main className="flex-1 relative flex overflow-hidden">
          <OutputSection 
            result={result} 
            chatHistory={chatHistory} 
            onSendMessage={handleSendMessage} 
            chatLoading={chatLoading} 
            onAnalyzeContradictions={() => handleSendMessage("Auditoria de Conformidade.")} 
            theme={theme}
          />
        </main>
      </div>

      {showFullDoc && (
        <FullDocumentModal doc={fullDocument} onClose={() => setShowFullDoc(false)} onClear={clearAll} theme={theme} />
      )}
    </div>
  );
};

export default App;
