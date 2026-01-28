import React, { useState } from 'react';
import ReactDOM from 'react-dom/client'; // Import ReactDOM to use createRoot for temporary rendering
import { TargetField, ContextData, HistoryItem, ChatMessage, FullDocument, FileData } from './types';
import InputSection from './components/InputSection';
import OutputSection from './components/OutputSection';
import FullDocumentModal from './components/FullDocumentModal';
import { generateInitialDraft, sendChatMessage } from './services/geminiService';
import MarkdownRenderer from './components/MarkdownRenderer'; 
import { jsPDF } from 'jspdf'; // Importar jsPDF

const App: React.FC = () => {
  const [formData, setFormData] = useState<ContextData>({
    objectAndPurpose: '',
    target: TargetField.OBJETO,
    topic: '',
    itemsInfo: '',
    interaction: '',
  });
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [fullDocument, setFullDocument] = useState<FullDocument>({});
  const [showFullDoc, setShowFullDoc] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false); // Novo estado para carregamento do PDF

  const handleFormDataChange = (newData: Partial<ContextData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setChatHistory([]);
    try {
      const { draft, commentary } = await generateInitialDraft(formData, fullDocument);
      
      let newDraft = draft || "";
      let newCommentary = commentary || "";

      if (newDraft) {
        setResult(newDraft);
        const updatedDoc = { ...fullDocument, [formData.target]: newDraft };
        setFullDocument(updatedDoc);
      } else {
        setResult("");
      }
      
      let newChatHistory: ChatMessage[] = [];
      if (newCommentary) {
        newChatHistory = [{ role: 'model', text: newCommentary }];
        setChatHistory(newChatHistory);
      }
      
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        data: { ...formData },
        result: newDraft,
        chatHistory: newChatHistory,
        fullDocument: { ...fullDocument, ...(newDraft ? { [formData.target]: newDraft } : {}) }
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
    } catch (error) {
      console.error("Erro fatal na geração:", error);
      setChatHistory([{ role: 'model', text: "Erro na comunicação com o especialista. Verifique os dados e tente novamente." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string, files?: FileData[]) => {
    const newUserMsg: ChatMessage = { role: 'user', text, files };
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);
    setChatLoading(true);

    try {
      const aiResponse = await sendChatMessage(text, updatedHistory, formData, result, fullDocument, files);
      setChatHistory([...updatedHistory, { role: 'model', text: aiResponse }]);
    } catch (error) {
      setChatHistory([...updatedHistory, { role: 'model', text: "Erro ao consultar pregoeiro." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (Object.keys(fullDocument).length === 0) {
      alert("Não há minuta para exportar em PDF.");
      return;
    }

    setPdfLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      let yOffset = 10;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;

      // Adicionar página de título
      doc.setFontSize(24);
      doc.text("Minuta Completa LicitAI", doc.internal.pageSize.width / 2, yOffset + 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(`Gerado em: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, doc.internal.pageSize.width / 2, yOffset + 35, { align: "center" });
      doc.addPage();
      yOffset = margin; // Reset yOffset for new page

      // Criar um div temporário e oculto para renderizar os componentes React em HTML
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px'; // Esconder fora da tela
      document.body.appendChild(tempDiv); // Anexar ao DOM para permitir a renderização

      const sections = Object.entries(fullDocument) as [TargetField, string][];

      for (const [field, content] of sections) {
        if (!content || content.trim() === "") continue;

        // Adicionar título da seção
        doc.setFontSize(14);
        doc.setTextColor(41, 128, 185); // Azul para títulos
        doc.text(`${field}:`, margin, yOffset);
        yOffset += 10;
        doc.setTextColor(0, 0, 0); // Resetar cor do texto para preto

        // Criar um root React temporário e renderizar o conteúdo Markdown
        const root = ReactDOM.createRoot(tempDiv);
        root.render(<MarkdownRenderer text={content} />);
        
        // Dar um pequeno tempo para o React renderizar o conteúdo no tempDiv
        await new Promise(resolve => setTimeout(resolve, 50)); 

        // Usar o método html do jsPDF para adicionar o conteúdo do tempDiv ao PDF
        // O método html retorna uma promessa que resolve para o próprio objeto jspdf
        await doc.html(tempDiv, {
            x: margin,
            y: yOffset,
            width: doc.internal.pageSize.width - 2 * margin,
            windowWidth: 794, // Largura padrão A4 em 96 DPI para html2canvas
            // callback é executado após a renderização, mas não é estritamente necessário se você aguarda a promessa
        });

        // Estimar a altura do conteúdo renderizado para ajustar o yOffset
        // Esta é uma estimativa. Para precisão exata, seria necessário um método mais complexo ou medir tempDiv.offsetHeight
        const estimatedContentHeight = tempDiv.offsetHeight * 0.264583; // Approx. 1px = 0.264583 mm at 96 DPI
        yOffset += estimatedContentHeight + 10; // Adicionar altura estimada e um padding

        // Adicionar nova página se estiver perto do fim
        if (yOffset > pageHeight - margin) {
            doc.addPage();
            yOffset = margin;
        }
        
        // Desmontar o root temporário para evitar vazamentos de memória
        root.unmount();
      }

      // Limpar o div temporário do DOM
      document.body.removeChild(tempDiv);

      doc.save('minuta_licitai.pdf');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
    } finally {
      setPdfLoading(false);
    }
  };


  const loadFromHistory = (item: HistoryItem) => {
    setFormData(item.data);
    setResult(item.result);
    setChatHistory(item.chatHistory || []);
    if (item.fullDocument) setFullDocument(item.fullDocument);
  };

  const handleClearDoc = () => {
    if (confirm("Deseja realmente limpar toda a minuta compilada?")) {
      setFullDocument({});
      setResult(null);
      setChatHistory([{ role: 'model', text: "Minuta compilada reiniciada. Iniciando novo processo." }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-900 flex flex-col">
      <header className="bg-gradient-to-r from-blue-950 to-blue-800 text-white shadow-lg mb-8 border-b-4 border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tighter italic drop-shadow-md">LicitAI <span className="text-blue-300 font-semibold text-2xl not-italic tracking-normal">2.0</span></h1>
              <p className="text-blue-200 text-xs font-black uppercase tracking-[0.25em] mt-1">Especialista Marinha do Brasil</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <button 
              onClick={() => setShowFullDoc(true)}
              className="bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm uppercase border-b-3 border-blue-900 flex items-center gap-2 transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414L13.586 3H9z" />
                <path d="M5 8a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2v-1h-2v1H5v-8h1V8H5z" />
              </svg>
              Minuta Completa ({Object.keys(fullDocument).length})
            </button>

            <button
              onClick={handleExportPdf}
              disabled={pdfLoading || Object.keys(fullDocument).length === 0}
              className={`text-white px-5 py-2.5 rounded-lg font-bold text-sm uppercase border-b-3 flex items-center gap-2 transition-all shadow-md active:scale-95 whitespace-nowrap 
                ${pdfLoading ? 'bg-yellow-500 border-yellow-700 animate-pulse' : 'bg-green-600 border-green-800 hover:bg-green-700'}`
              }
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {pdfLoading ? 'GERANDO PDF...' : 'EXTRAIR MINUTA PDF'}
            </button>

            <div className="flex items-center gap-2 text-sm bg-white/15 px-4 py-2 rounded-full border border-white/30 backdrop-blur-sm shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="font-semibold text-white uppercase tracking-wider">Pregoeiro Ativo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 h-full">
        <div className="lg:col-span-5 space-y-7">
          <InputSection
            data={formData}
            onChange={handleFormDataChange}
            onGenerate={handleGenerate}
            loading={loading}
          />

          {history.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-widest border-b pb-3 border-slate-100">Histórico de Consultas</h3>
              <div className="space-y-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-4 rounded-lg hover:bg-slate-50 border border-slate-200 transition-all flex justify-between items-center group shadow-sm"
                  >
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-blue-700 uppercase">{item.data.target}</span>
                       <span className="text-base font-bold text-slate-800 line-clamp-1 mt-1">{item.data.objectAndPurpose || "Sem título"}</span>
                    </div>
                    <span className="text-xs text-slate-500 group-hover:text-blue-500 transition-colors">
                      {item.timestamp.toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 h-full">
          <OutputSection 
            result={result} 
            chatHistory={chatHistory} 
            onSendMessage={handleSendMessage}
            chatLoading={chatLoading}
            onAnalyzeContradictions={() => handleSendMessage("Analise a minuta completa e verifique se há contradições ou inconsistências entre as seções.")}
          />
        </div>
      </main>

      {showFullDoc && (
        <FullDocumentModal 
          doc={fullDocument} 
          onClose={() => setShowFullDoc(false)} 
          onClear={handleClearDoc}
        />
      )}
    </div>
  );
};

export default App;