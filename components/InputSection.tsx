
import React, { useRef } from 'react';
import { TargetField, ContextData, FileData } from '../types';

interface InputSectionProps {
  data: ContextData;
  onChange: (newData: Partial<ContextData>) => void;
  onGenerate: () => void;
  loading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ data, onChange, onGenerate, loading }) => {
  const itemFileRef = useRef<HTMLInputElement>(null);
  const refFileRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'itemFiles' | 'files') => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FileData[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      newFiles.push({ name: file.name, mimeType: file.type, data: base64 });
    }

    onChange({ [field]: [...(data[field] || []), ...newFiles] });
    e.target.value = '';
  };

  const removeFile = (index: number, field: 'itemFiles' | 'files') => {
    const updated = (data[field] || []).filter((_, i) => i !== index);
    onChange({ [field]: updated });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-slate-400 p-6 space-y-6">
      {/* 1. OBJETO E FINALIDADE */}
      <div>
        <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">
          1. OBJETO E FINALIDADE DA LICITAÇÃO
        </label>
        <textarea
          placeholder="Ex: Aquisição de gêneros alimentícios para o rancho..."
          className="w-full px-4 py-3 border-2 border-slate-900 rounded-lg h-24 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 bg-white font-bold"
          value={data.objectAndPurpose}
          onChange={(e) => onChange({ objectAndPurpose: e.target.value })}
        />
      </div>

      {/* 2. DOCUMENTO ALVO */}
      <div>
        <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">
          2. DOCUMENTO ALVO (Referência)
        </label>
        <select
          className="w-full px-4 py-3 border-2 border-slate-900 rounded-lg focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 bg-white font-bold cursor-pointer"
          value={data.target}
          onChange={(e) => onChange({ target: e.target.value as TargetField })}
        >
          {Object.values(TargetField).map((field) => (
            <option key={field} value={field}>{field}</option>
          ))}
        </select>
      </div>

      {/* DESCRIÇÃO DOS ITENS + PLANILHAS */}
      <div className="space-y-3">
        <label className="block text-sm font-black text-slate-900 uppercase tracking-tight flex justify-between">
          <span>DESCRIÇÃO DOS ITENS / LOTES</span>
        </label>
        <textarea
          placeholder="Digite ou anexe a planilha de itens abaixo."
          className="w-full px-4 py-3 border-2 border-slate-900 rounded-lg h-32 focus:ring-4 focus:ring-blue-100 outline-none resize-none transition-all text-slate-900 bg-white font-medium"
          value={data.itemsInfo}
          onChange={(e) => onChange({ itemsInfo: e.target.value })}
        />
        
        <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-3">
          <input 
            type="file" 
            ref={itemFileRef} 
            className="hidden" 
            multiple 
            accept=".csv,.pdf,.xlsx,.txt" 
            onChange={(e) => handleFileUpload(e, 'itemFiles')} 
          />
          <button 
            onClick={() => itemFileRef.current?.click()}
            className="flex items-center gap-2 text-xs font-black text-slate-900 hover:bg-white p-2 rounded transition-all border border-transparent hover:border-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2a4 4 0 00-4-4H5m14 0h-1a4 4 0 00-4 4v2m-6 4h6" />
            </svg>
            ANEXAR PLANILHA DE ITENS (CSV/PDF)
          </button>
          
          {data.itemFiles && data.itemFiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.itemFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-green-700 text-white text-[9px] font-black px-2 py-1 rounded">
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => removeFile(idx, 'itemFiles')}><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TÓPICO */}
      <div>
        <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">
          TÓPICO / CAMPO DO SISTEMA
        </label>
        <input
          type="text"
          placeholder="Ex: Qualificação Técnica"
          className="w-full px-4 py-3 border-2 border-slate-900 rounded-lg focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white text-slate-900 font-black"
          value={data.topic}
          onChange={(e) => onChange({ topic: e.target.value })}
        />
      </div>

      {/* INTERAÇÃO E REFERÊNCIAS */}
      <div className="space-y-3">
        <label className="block text-sm font-black text-slate-900 uppercase tracking-tight">
          3. INTERAÇÃO E REFERÊNCIAS
        </label>
        <textarea
          placeholder="Modelos de editais, normas adicionais ou instruções."
          className="w-full px-4 py-3 border-2 border-slate-900 rounded-lg h-24 focus:ring-4 focus:ring-blue-100 outline-none resize-none transition-all text-slate-900 bg-white font-medium"
          value={data.interaction}
          onChange={(e) => onChange({ interaction: e.target.value })}
        />
        
        <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-3">
          <input 
            type="file" 
            ref={refFileRef} 
            className="hidden" 
            multiple 
            onChange={(e) => handleFileUpload(e, 'files')} 
          />
          <button 
            onClick={() => refFileRef.current?.click()}
            className="flex items-center gap-2 text-xs font-black text-slate-900 hover:bg-white p-2 rounded transition-all border border-transparent hover:border-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z" />
            </svg>
            ANEXAR MODELOS / NORMAS
          </button>
          
          {data.files && data.files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-blue-900 text-white text-[9px] font-black px-2 py-1 rounded">
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => removeFile(idx, 'files')}><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className={`w-full py-5 rounded-lg font-black text-xl text-white transition-all transform active:scale-95 shadow-xl border-b-4 ${
          loading ? 'bg-slate-600 border-slate-800' : 'bg-blue-700 border-blue-900 hover:bg-blue-800'
        }`}
      >
        {loading ? 'PROCESSANDO...' : 'GERAR TEXTO PARA O PORTAL'}
      </button>
    </div>
  );
};

export default InputSection;
