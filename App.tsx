
import React, { useState } from 'react';
import { TargetField, ContextData, HistoryItem, ChatMessage, FullDocument, FileData } from './types';
import InputSection from './components/InputSection';
import OutputSection from './components/OutputSection';
import FullDocumentModal from './components/FullDocumentModal';
import { generateInitialDraft, sendChatMessage } from './services/geminiService';
import { supabase } from './services/supabaseService'; // Importar o serviço Supabase

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleFormDataChange = (newData: Partial<ContextData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setChatHistory([]);
    setSaveStatus('idle'); // Resetar status de salvamento
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
    setSaveStatus('idle'); // Resetar status de salvamento

    try {
      const aiResponse = await sendChatMessage(text, chatHistory, formData, result, fullDocument, files);
      setChatHistory([...updatedHistory, { role: 'model', text: aiResponse }]);
    } catch (error) {
      setChatHistory([...updatedHistory, { role: 'model', text: "Erro ao consultar pregoeiro." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!result && Object.keys(fullDocument).length === 0) {
      alert("Não há dados gerados para salvar.");
      return;
    }

    setSaveStatus('saving');
    try {
      // Usamos o objeto `formData` atual e o `fullDocument` para salvar o estado mais recente
      // Como o `HistoryItem` é um snapshot, precisamos construir um para salvar
      const currentProject: HistoryItem = {
        id: crypto.randomUUID(), // Gera um novo ID para o item salvo
        timestamp: new Date(),
        data: { ...formData },
        result: result || "",
        chatHistory: [...chatHistory],
        fullDocument: { ...fullDocument }
      };

      const { error } = await supabase
        .from('licitacoes')
        .insert({
          id: currentProject.id,
          timestamp: currentProject.timestamp.toISOString(),
          object_and_purpose: currentProject.data.objectAndPurpose,
          target: currentProject.data.target,
          topic: currentProject.data.topic,
          items_info: currentProject.data.itemsInfo,
          interaction: currentProject.data.interaction,
          item_files: currentProject.data.itemFiles || [],
          reference_files: currentProject.data.files || [],
          generated_draft: currentProject.result,
          chat_history: currentProject.chatHistory || [],
          full_document: currentProject.fullDocument || {}
        });

      if (error) throw error;
      setSaveStatus('success');
      console.log('Projeto salvo com sucesso!');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Erro ao salvar projeto:', error.message);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setFormData(item.data);
    setResult(item.result);
    setChatHistory(item.chatHistory || []);
    if (item.fullDocument) setFullDocument(item.fullDocument);
    setSaveStatus('idle'); // Resetar status de salvamento ao carregar histórico
  };

  const handleClearDoc = () => {
    if (confirm("Deseja realmente limpar toda a minuta compilada?")) {
      setFullDocument({});
      setResult(null);
      setChatHistory([{ role: 'model', text: "Minuta compilada reiniciada. Iniciando novo processo." }]);
      setSaveStatus('idle'); // Resetar status de salvamento
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving': return 'SALVANDO...';
      case 'success': return 'SALVO!';
      case 'error': return 'ERRO AO SALVAR';
      default: return 'SALVAR PROJETO';
    }
  };

  const getSaveButtonClass = () => {
    switch (saveStatus) {
      case 'saving': return 'bg-yellow-500 border-yellow-700 animate-pulse';
      case 'success': return 'bg-green-500 border-green-700';
      case 'error': return 'bg-red-500 border-red-700';
      default: return 'bg-blue-600 border-blue-800 hover:bg-blue-700';
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-900">
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
              onClick={handleSaveProject}
              disabled={saveStatus === 'saving' || (!result && Object.keys(fullDocument).length === 0)}
              className={`text-white px-5 py-2.5 rounded-lg font-bold text-sm uppercase border-b-3 flex items-center gap-2 transition-all shadow-md active:scale-95 whitespace-nowrap ${getSaveButtonClass()}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {getSaveButtonText()}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
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