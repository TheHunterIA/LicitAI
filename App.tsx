
import React, { useState } from 'react';
import { TargetField, ContextData, HistoryItem, ChatMessage, FullDocument, FileData } from './types';
import InputSection from './components/InputSection';
import OutputSection from './components/OutputSection';
import FullDocumentModal from './components/FullDocumentModal';
import { generateInitialDraft, sendChatMessage } from './services/geminiService';

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

  const handleFormDataChange = (newData: Partial<ContextData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setChatHistory([]);
    try {
      const { draft, commentary } = await generateInitialDraft(formData, fullDocument);
      
      if (draft) {
        setResult(draft);
        const updatedDoc = { ...fullDocument, [formData.target]: draft };
        setFullDocument(updatedDoc);
      } else {
        setResult("");
      }
      
      if (commentary) {
        setChatHistory([{ role: 'model', text: commentary }]);
      }
      
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        data: { ...formData },
        result: draft || "",
        chatHistory: commentary ? [{ role: 'model', text: commentary }] : [],
        fullDocument: { ...fullDocument, ...(draft ? { [formData.target]: draft } : {}) }
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
      const aiResponse = await sendChatMessage(text, chatHistory, formData, result, fullDocument, files);
      setChatHistory([...updatedHistory, { role: 'model', text: aiResponse }]);
    } catch (error) {
      setChatHistory([...updatedHistory, { role: 'model', text: "Erro ao consultar pregoeiro." }]);
    } finally {
      setChatLoading(false);
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
    <div className="min-h-screen bg-slate-100 pb-12 font-sans">
      <header className="bg-blue-950 text-white shadow-xl mb-8 border-b-4 border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter italic">LicitAI <span className="text-blue-400 font-normal text-xl not-italic tracking-normal">2.0</span></h1>
              <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.2em]">Especialista Marinha do Brasil</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setShowFullDoc(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-black text-xs uppercase border-b-2 border-blue-800 flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414L13.586 3H9z" />
                <path d="M5 8a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2v-1h-2v1H5v-8h1V8H5z" />
              </svg>
              Minuta Completa ({Object.keys(fullDocument).length})
            </button>

            <div className="flex items-center gap-2 text-xs bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="font-black text-white uppercase tracking-wider">Pregoeiro Ativo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <InputSection
            data={formData}
            onChange={handleFormDataChange}
            onGenerate={handleGenerate}
            loading={loading}
          />

          {history.length > 0 && (
            <div className="bg-white rounded-xl shadow-md border-2 border-slate-300 p-6">
              <h3 className="text-xs font-black text-slate-900 mb-4 uppercase tracking-widest">Histórico de Consultas</h3>
              <div className="space-y-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border-2 border-slate-200 transition-all flex justify-between items-center group"
                  >
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-blue-800 uppercase">{item.data.target}</span>
                       <span className="text-sm font-bold text-slate-700 line-clamp-1">{item.data.objectAndPurpose || "Sem título"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 h-[calc(100vh-140px)] sticky top-6">
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
