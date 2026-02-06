
import { useState, useEffect, useCallback } from 'react';
import { TargetField, Modality, BiddingPhase, ContextData, ChatMessage, FullDocument, FileData } from '../types';
import { generateInitialDraft, sendChatMessage } from '../services/geminiService';

const STORAGE_KEY = 'licitai_command_v14_data';

export const useLicitacao = () => {
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
  const [fullDocument, setFullDocument] = useState<FullDocument>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullDocument));
  }, [fullDocument]);

  const handleFormDataChange = useCallback((newData: Partial<ContextData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  }, []);

  const handleGenerate = async () => {
    if (!formData.objectAndPurpose.trim()) {
      alert("ERRO TÉCNICO: Informe o Objeto para prosseguir.");
      return;
    }

    setLoading(true);
    try {
      const { draft, commentary } = await generateInitialDraft(formData, fullDocument);
      if (draft) {
        setResult(draft);
        setFullDocument(prev => ({ ...prev, [formData.target]: draft }));
      }
      if (commentary) {
        setChatHistory(prev => [...prev, { role: 'model', text: commentary }]);
      }
    } catch (error: any) {
      alert("FALHA NA GERAÇÃO JURÍDICA. Tente simplificar os parâmetros.");
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
      setChatHistory(prev => [...prev, { role: 'model', text: "ERRO DE CONSULTORIA. O motor legal não respondeu." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearAll = useCallback(() => {
    if (confirm("Deseja expurgar todo o dossiê atual e reiniciar os protocolos?")) {
      setFullDocument({});
      setResult(null);
      setChatHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    formData,
    loading,
    chatLoading,
    result,
    chatHistory,
    fullDocument,
    handleFormDataChange,
    handleGenerate,
    handleSendMessage,
    clearAll,
    setResult
  };
};
