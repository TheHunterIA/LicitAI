
import React, { useState, useEffect } from 'react';
import { TargetField, ContextData, ChatMessage, FullDocument, FileData } from './types';
import InputSection from './components/InputSection';
import OutputSection from './components/OutputSection';
import FullDocumentModal from './components/FullDocumentModal';
import { generateInitialDraft, sendChatMessage } from './services/geminiService';
import { Anchor, FileText, Moon, Sun, Download } from 'lucide-react';
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
    if (!formData.objectAndPurpose.trim()) return alert("DEFINA O OBJETO.");
    setLoading(true);
    setResult(null);
    try {
      const { draft, commentary } = await generateInitialDraft(formData, fullDocument);
      if (draft) {
        setResult(draft);
        setFullDocument(prev => ({ ...prev, [formData.target]: draft }));
      }
      if (commentary) setChatHistory(prev => [...prev, { role: 'model', text: commentary }]);
    } catch (error: any) {
      alert(error.message || "ERRO NA GERAÇÃO.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string, files?: FileData[]) => {
    const userMsg: ChatMessage = { role: 'user', text, files };
    setChatHistory(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const response = await sendChatMessage(text, [...chatHistory, userMsg], formData, result, fullDocument);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: "ERRO DE COMUNICAÇÃO." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const exportToPdf = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);
    let y = 30;

    const sections = Object.entries(fullDocument).filter(([_, content]) => !!content);
    if (sections.length === 0 && result) sections.push([formData.target, result]);
    if (sections.length === 0) return alert("NADA PARA EXPORTAR.");

    const drawHeader = (pDoc: jsPDF) => {
      pDoc.setFont("helvetica", "bold");
      pDoc.setFontSize(8);
      pDoc.setTextColor(100);
      pDoc.text("GOVERNO FEDERAL - PNCP - LEI 14.133/21", pageWidth / 2, 12, { align: "center" });
      pDoc.line(margin, 16, pageWidth - margin, 16);
    };

    sections.forEach(([section, content], sIdx) => {
      if (sIdx > 0) { doc.addPage(); y = 30; }
      drawHeader(doc);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 31, 63);
      doc.text(String(section).toUpperCase(), margin, y);
      y += 12;

      const lines = (content as string).split('\n');
      let isHeaderRow = true;

      lines.forEach((line) => {
        let trimmed = line.trim();
        if (!trimmed && line !== '') return;

        const cleanLine = trimmed
          .replace(/^#+\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '');

        if (trimmed.startsWith('|') && trimmed.includes('|')) {
          if (trimmed.includes('---')) return;
          const cells = trimmed.split('|').filter(c => c.trim() !== "");
          const colWidth = contentWidth / cells.length;
          
          doc.setFontSize(8);
          doc.setLineWidth(0.1);
          if (isHeaderRow) {
            doc.setFillColor(230, 230, 230);
            doc.rect(margin, y - 5, contentWidth, 7, 'FD');
            doc.setFont("helvetica", "bold");
            isHeaderRow = false;
          } else {
            doc.setFont("helvetica", "normal");
          }

          cells.forEach((cell, i) => {
            const cellX = margin + (i * colWidth);
            doc.rect(cellX, y - 5, colWidth, 7, 'D');
            doc.text(cell.trim().substring(0, 40), cellX + 1.5, y);
          });
          y += 7;
          return;
        } else {
          isHeaderRow = true;
        }

        if (trimmed.startsWith('#')) {
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          y += 5;
          doc.text(cleanLine, margin, y);
          y += 8;
          return;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const wrapped = doc.splitTextToSize(cleanLine, contentWidth);
        wrapped.forEach((wl: string) => {
          if (y > 275) { doc.addPage(); drawHeader(doc); y = 30; }
          doc.text(wl, margin, y, { align: "justify", maxWidth: contentWidth });
          y += 5.5;
        });
        if (trimmed === '') y += 3;
      });
    });

    doc.save(`Minuta_Oficial_PNCP_${Date.now()}.pdf`);
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-100'}`}>
      <header className={`h-16 border-b flex items-center justify-between px-10 z-50 shrink-0 backdrop-blur-md ${theme === 'dark' ? 'bg-black/60 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-xl"><Anchor className="text-white w-6 h-6" /></div>
          <div>
            <h1 className={`text-lg font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>LicitAI <span className="text-blue-500">Command</span></h1>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Gabinete Técnico // Padrão CATMAT v8.0</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          <button onClick={() => setShowFullDoc(true)} className="px-5 py-2.5 rounded-xl border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600/10 transition-all">
            <FileText className="w-4 h-4" /> Dossiê ({Object.keys(fullDocument).length})
          </button>
          <button onClick={exportToPdf} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-500 transition-all active:scale-95">
            <Download className="w-4 h-4" /> Exportar PDF Limpo
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`w-80 border-r p-8 shrink-0 overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'bg-[#010409] border-white/5' : 'bg-white border-slate-200'}`}>
          <InputSection data={formData} onChange={handleFormDataChange} onGenerate={handleGenerate} loading={loading} />
        </aside>
        <main className="flex-1 overflow-hidden relative">
          <OutputSection result={result} chatHistory={chatHistory} onSendMessage={handleSendMessage} chatLoading={chatLoading} onAnalyzeContradictions={() => handleSendMessage("Audite esta minuta conforme a Lei 14.133.")} theme={theme} />
        </main>
      </div>

      {showFullDoc && <FullDocumentModal doc={fullDocument} onClose={() => setShowFullDoc(false)} onClear={() => { setFullDocument({}); setResult(null); }} />}
    </div>
  );
};

export default App;
