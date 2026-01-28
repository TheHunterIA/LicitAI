import React, { useRef } from 'react';
import { TargetField, ContextData, FileData } from '../types';
import { Paperclip, Upload } from 'lucide-react'; // Importar ícones do lucide-react

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
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-7 space-y-7">
      <div>
        <label className="block text-base font-extrabold text-slate-700 mb-2 uppercase tracking-widest">
          1. OBJETO E FINALIDADE DA LICITAÇÃO
        </label>
        <textarea
          placeholder="Ex: Aquisição de gêneros alimentícios para o rancho..."
          className="w-full px-4 py-3 border border-slate-300 rounded-xl h-28 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all text-slate-800 bg-white font-medium placeholder:text-slate-400"
          value={data.objectAndPurpose}
          onChange={(e) => onChange({ objectAndPurpose: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-base font-extrabold text-slate-700 mb-2 uppercase tracking-widest">
          2. DOCUMENTO ALVO (Referência)
        </label>
        <select
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all text-slate-800 bg-white font-medium cursor-pointer"
          value={data.target}
          onChange={(e) => onChange({ target: e.target.value as TargetField })}
        >
          {Object.values(TargetField).map((field) => (
            <option key={field} value={field}>{field}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="block text-base font-extrabold text-slate-700 uppercase tracking-widest flex justify-between">
          <span>DESCRIÇÃO DOS ITENS / LOTES</span>
        </label>
        <textarea
          placeholder="Digite ou anexe a planilha de itens abaixo."
          className="w-full px-4 py-3 border border-slate-300 rounded-xl h-36 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none resize-none transition-all text-slate-800 bg-white font-medium placeholder:text-slate-400"
          value={data.itemsInfo}
          onChange={(e) => onChange({ itemsInfo: e.target.value })}
        />
        
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 shadow-inner">
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
            className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:bg-slate-200 p-3 rounded-lg transition-all border border-slate-300 group"
          >
            <Paperclip className="h-5 w-5 text-blue-700 group-hover:text-blue-800" strokeWidth={2.5}/>
            ANEXAR ITENS (PDF/CSV/TXT/IMG)
          </button>
          
          {data.itemFiles && data.itemFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.itemFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-blue-200">
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => removeFile(idx, 'itemFiles')} className="text-blue-500 hover:text-blue-700"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-base font-extrabold text-slate-700 mb-2 uppercase tracking-widest">
          TÓPICO / CAMPO DO SISTEMA
        </label>
        <input
          type="text"
          placeholder="Ex: Qualificação Técnica"
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all bg-white text-slate-800 font-medium placeholder:text-slate-400"
          value={data.topic}
          onChange={(e) => onChange({ topic: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <label className="block text-base font-extrabold text-slate-700 uppercase tracking-widest">
          3. INTERAÇÃO E REFERÊNCIAS
        </label>
        <textarea
          placeholder="Modelos de editais, normas adicionais ou instruções."
          className="w-full px-4 py-3 border border-slate-300 rounded-xl h-28 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none resize-none transition-all text-slate-800 bg-white font-medium placeholder:text-slate-400"
          value={data.interaction}
          onChange={(e) => onChange({ interaction: e.target.value })}
        />
        
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 shadow-inner">
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
            className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:bg-slate-200 p-3 rounded-lg transition-all border border-slate-300 group"
          >
            <Upload className="h-5 w-5 text-purple-700 group-hover:text-purple-800" strokeWidth={2.5}/>
            ANEXAR REFERÊNCIAS (PDF/CSV/TXT/IMG)
          </button>
          
          {data.files && data.files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-blue-200">
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => removeFile(idx, 'files')} className="text-blue-500 hover:text-blue-700"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className={`w-full py-4 rounded-xl font-extrabold text-2xl text-white transition-all transform active:scale-95 shadow-2xl 
          ${loading ? 'bg-slate-400 border-slate-600 animate-pulse' : 'bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950'}`
        }
      >
        {loading ? 'PROCESSANDO...' : 'GERAR TEXTO PARA O PORTAL'}
      </button>
    </div>
  );
};

export default InputSection;