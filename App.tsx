
import React, { useState, useEffect } from 'react';
import { TargetField, ContextData, ChatMessage, FullDocument, FileData } from './types';
import InputSection from './components/InputSection';
import OutputSection from './components/OutputSection';
import FullDocumentModal from './components/FullDocumentModal';
import { generateInitialDraft, sendChatMessage } from './services/geminiService';
import { Anchor, ShieldCheck, FileText, Layout, Moon, Sun, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [formData, setFormData] = useState<ContextData>({
    objectAndPurpose: '',
    target: TargetField.OBJETO,
    topic: '',
    itemsInfo: '',
    itemFiles: [],
    interaction: '',
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
      alert("ERRO CRÍTICO NA GERAÇÃO.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string, files?: FileData[]) => {
    const userMsg: ChatMessage = { role: 'user', text, files };
    setChatHistory(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const response = await sendChatMessage(text, [...chatHistory, userMsg], formData, result, fullDocument, files);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: "ERRO DE COMUNICAÇÃO COM O COMANDO." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // Se o documento estiver vazio mas houver um resultado na tela, use ele
    const itemsToExport = Object.keys(fullDocument).length > 0 
      ? Object.entries(fullDocument) 
      : (result ? [[formData.target, result]] : []);

    if (itemsToExport.length === 0) return alert("NENHUM CONTEÚDO PARA EXPORTAR.");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LICITAI COMMAND - MINUTA TÉCNICA", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString()} // Protocolo Lei 14.133/21`, 105, 26, { align: "center" });

    itemsToExport.forEach(([section, content]) => {
      if (y > 260) { doc.addPage(); y = 20; }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(String(section).toUpperCase(), margin, y);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(content || "", 170);
      lines.forEach((line: string) => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 6;
      });
      y += 12;
    });

    doc.save(`Minuta_LicitAI_${Date.now()}.pdf`);
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-100'}`}>
      <header className={`h-16 border-b flex items-center justify-between px-10 z-50 shrink-0 backdrop-blur-md ${theme === 'dark' ? 'bg-black/60 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-xl">
              <Anchor className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-lg font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>LicitAI <span className="text-blue-500">Command</span></h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Padrão Marinha do Brasil // Protocolo 14.133</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2.5 rounded-xl border transition-all ${theme === 'dark' ? 'border-white/10 text-amber-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setShowFullDoc(true)} 
            className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${theme === 'dark' ? 'border-blue-500/20 text-blue-400 hover:bg-blue-600/10' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
          >
            <FileText className="w-4 h-4" />
            Compilado ({Object.keys(fullDocument).length})
          </button>
          
          <button 
            onClick={exportToPdf}
            disabled={!result && Object.keys(fullDocument).length === 0}
            className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95 ${(!result && Object.keys(fullDocument).length === 0) ? 'opacity-30 cursor-not-allowed bg-slate-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`w-85 border-r flex flex-col overflow-y-auto custom-scrollbar p-8 shrink-0 transition-colors ${theme === 'dark' ? 'bg-[#010409] border-white/5' : 'bg-white border-slate-200'}`}>
          <InputSection data={formData} onChange={handleFormDataChange} onGenerate={handleGenerate} loading={loading} theme={theme} />
        </aside>

        <main className="flex-1 flex overflow-hidden relative">
          <OutputSection 
            result={result} 
            chatHistory={chatHistory} 
            onSendMessage={handleSendMessage} 
            chatLoading={chatLoading} 
            onAnalyzeContradictions={() => handleSendMessage("Execute auditoria completa.")} 
            theme={theme}
          />
        </main>
      </div>

      {showFullDoc && (
        <FullDocumentModal 
          doc={fullDocument} 
          onClose={() => setShowFullDoc(false)} 
          onClear={() => {
             setFullDocument({});
             setResult(null);
          }} 
          theme={theme}
        />
      )}
    </div>
  );
};

export default App;
