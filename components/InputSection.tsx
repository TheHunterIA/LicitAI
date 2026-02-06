import React, { useRef } from 'react';
import { TargetField, ContextData, FileData } from '../types';
import { Settings, ShieldCheck, Zap, Paperclip, X } from 'lucide-react';

interface InputSectionProps {
  data: ContextData;
  onChange: (newData: Partial<ContextData>) => void;
  onGenerate: () => void;
  loading: boolean;
  theme: 'dark' | 'light';
}

const InputSection: React.FC<InputSectionProps> = ({ data, onChange, onGenerate, loading, theme }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: FileData[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        newFiles.push({ name: file.name, mimeType: file.type, data: (reader.result as string).split(',')[1] });
        if (newFiles.length === files.length) {
          onChange({ itemFiles: [...(data.itemFiles || []), ...newFiles] });
        }
      };
    }
  };

  const removeFile = (index: number) => {
    const updated = [...(data.itemFiles || [])];
    updated.splice(index, 1);
    onChange({ itemFiles: updated });
  };

  return (
    <div className="space-y-10">
      <div className={`flex items-center gap-3 pb-4 border-b ${theme === 'dark' ? 'text-blue-500 border-white/5' : 'text-blue-600 border-slate-200'}`}>
        <Settings className="w-5 h-5" />
        <span className="text-xs font-black uppercase tracking-[0.3em]">Parametrização</span>
      </div>

      <div className="space-y-8">
        <div>
          <label className={`text-[10px] font-black uppercase mb-3 block tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>01. Objeto Central</label>
          <textarea
            className={`w-full border rounded-2xl p-5 text-sm outline-none transition-all h-28 resize-none font-medium ${theme === 'dark' ? 'bg-[#0d1117] border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400'}`}
            placeholder="Descreva o alvo da licitação..."
            value={data.objectAndPurpose}
            onChange={(e) => onChange({ objectAndPurpose: e.target.value })}
          />
        </div>

        <div>
          <label className={`text-[10px] font-black uppercase mb-3 block tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>02. Documento Alvo</label>
          <div className="relative">
            <select
              className={`w-full border rounded-2xl p-5 text-sm font-black appearance-none outline-none transition-all cursor-pointer ${theme === 'dark' ? 'bg-[#0d1117] border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400'}`}
              value={data.target}
              onChange={(e) => onChange({ target: e.target.value as TargetField })}
            >
              {Object.values(TargetField).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <Zap className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>03. Contexto & Anexos</label>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase">
              <Paperclip className="w-3 h-3" />
              Upload
            </button>
          </div>
          
          <input type="file" ref={fileRef} className="hidden" multiple onChange={handleFileUpload} />

          {data.itemFiles && data.itemFiles.length > 0 && (
            <div className="mb-4 space-y-2">
              {data.itemFiles.map((f, i) => (
                <div key={i} className={`flex items-center justify-between border rounded-lg px-3 py-2 ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                  <span className="text-[9px] font-bold text-blue-500 truncate max-w-[150px]">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}

          <textarea
            className={`w-full border rounded-2xl p-5 text-sm outline-none transition-all h-32 resize-none font-medium ${theme === 'dark' ? 'bg-[#0d1117] border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400'}`}
            placeholder="Matriz de itens ou dados extras..."
            value={data.itemsInfo}
            onChange={(e) => onChange({ itemsInfo: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className={`w-full py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] transition-all border-b-4 
          ${loading ? 'bg-slate-400 border-slate-500 text-white animate-pulse' : 'bg-blue-600 border-blue-800 text-white hover:bg-blue-500 shadow-xl active:translate-y-1 active:border-b-0'}`}
      >
        {loading ? 'Sincronizando...' : 'Gerar Redação'}
      </button>

      <div className={`border rounded-2xl p-6 flex items-start gap-4 ${theme === 'dark' ? 'bg-blue-900/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
        <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Rede Protegida</p>
          <p className={`text-[9px] leading-relaxed ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>Protocolos de segurança e sigilo administrativo ativos.</p>
        </div>
      </div>
    </div>
  );
};

export default InputSection;