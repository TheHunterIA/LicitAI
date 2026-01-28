
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
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-7 space-y-6">
      <div>
        <label className="block text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">
          1. OBJETO E FINALIDADE DA LICITAÇÃO
        </label>
        <textarea
          placeholder="Ex: Aquisição de gêneros alimentícios para o rancho..."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg h-28 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all text-slate-800 bg-white font-medium placeholder:text-slate-400"
          value={data.objectAndPurpose}
          onChange={(e) => onChange({ objectAndPurpose: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">
          2. DOCUMENTO ALVO (Referência)
        </label>
        <select
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all text-slate-800 bg-white font-medium cursor-pointer"
          value={data.target}
          onChange={(e) => onChange({ target: e.target.value as TargetField })}
        >
          {Object.values(TargetField).map((field) => (
            <option key={field} value={field}>{field}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-black text-slate-800 uppercase tracking-wide flex justify-between">
          <span>DESCRIÇÃO DOS ITENS / LOTES</span>
        </label>
        <textarea
          placeholder="Digite ou anexe a planilha de itens abaixo."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg h-36 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none resize-none transition-all text-slate-800 bg-white font-medium placeholder:text-slate-400"
          value={data.itemsInfo}
          onChange={(e) => onChange({ itemsInfo: e.target.value })}
        />
        
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-inner">
          <input 
            type="file" 
            ref={itemFileRef} 
            className="hidden" 
            multiple 
            accept=".csv,.pdf,.txt,image/*" 
            onChange={(e) => handleFileUpload(e, 'itemFiles')} 
          />
          <button 
            onClick={() => itemFileRef.current?.click()}
            className="flex items-center gap-2 text-xs font-black text-slate-700 hover:bg-slate-100 p-2 rounded-md transition-all border border-transparent hover:border-slate-300 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 group-hover:text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2a4 4 0 00-4-4H5m14 0h-1a4 4 0 00-4 4v2m-6 4h6" />
            </svg>
            ANEXAR ITENS (PDF/CSV/TXT/IMG)
          </button>
          
          {data.itemFiles && data.itemFiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.itemFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-green-600 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm">
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => removeFile(idx, 'itemFiles')} className="text-white/80 hover:text-white"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">
          TÓPICO / CAMPO DO SISTEMA
        </label>
        <input
          type="text"
          placeholder="Ex: Qualificação Técnica"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all bg-white text-slate-800 font-medium placeholder:text-slate-400"
          value={data.topic}
          onChange={(e) => onChange({ topic: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-black text-slate-800 uppercase tracking-wide">
          3. INTERAÇÃO E REFERÊNCIAS
        </label>
        <textarea
          placeholder="Modelos de editais, normas adicionais ou instruções."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg h-28 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none resize-none transition-all text-slate-800 bg-white font-medium placeholder:text-slate-400"
          value={data.interaction}
          onChange={(e) => onChange({ interaction: e.target.value })}
        />
        
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-inner">
          <input 
            type="file" 
            ref={refFileRef} 
            className="hidden" 
            multiple 
            accept=".pdf,.csv,.txt,image/*"
            onChange={(e) => handleFileUpload(e, 'files')} 
          />
          <button 
            onClick={() => refFileRef.current?.click()}
            className="flex items-center gap-2 text-xs font-black text-slate-700 hover:bg-slate-100 p-2 rounded-md transition-all border border-transparent hover:border-slate-300 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 group-hover:text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z" />
            </svg>
            ANEXAR REFERÊNCIAS (PDF/CSV/TXT/IMG)
          </button>
          
          {data.files && data.files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-blue-700 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm">
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => removeFile(idx, 'files')} className="text-white/80 hover:text-white"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className={`w-full py-5 rounded-lg font-black text-xl text-white transition-all transform active:scale-95 shadow-xl border-b-4 
          ${loading ? 'bg-slate-500 border-slate-700 animate-pulse' : 'bg-gradient-to-r from-blue-700 to-blue-800 border-blue-900 hover:from-blue-800 hover:to-blue-900'}`
        }
      >
        {loading ? 'PROCESSANDO...' : 'GERAR TEXTO PARA O PORTAL'}
      </button>
    </div>
  );
};

export default InputSection;