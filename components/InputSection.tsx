
import React, { useRef } from 'react';
import { TargetField, Modality, BiddingPhase, ContextData, FileData } from '../types';
import { Settings, ShieldCheck, Zap, Paperclip, X, Gavel, Briefcase, FileSignature, Activity } from 'lucide-react';

interface InputSectionProps {
  data: ContextData;
  onChange: (newData: Partial<ContextData>) => void;
  onGenerate: () => void;
  loading: boolean;
  theme: 'dark' | 'light';
}

const InputSection: React.FC<InputSectionProps> = ({ data, onChange, onGenerate, loading, theme }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: FileData[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        newFiles.push({ name: file.name, mimeType: file.type, data: (reader.result as string).split(',')[1] });
        if (newFiles.length === files.length) {
          onChange({ itemFiles: [...(data.itemFiles || []), ...newFiles] });
        }
      };
    });
  };

  const inputBase = `w-full border rounded-xl p-4 text-sm outline-none transition-all duration-300 ${theme === 'dark' ? 'bg-[#0d1117] border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`;
  const labelBase = `text-[10px] font-black uppercase mb-2 block tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
      <div className={`flex items-center gap-3 pb-4 border-b ${theme === 'dark' ? 'text-blue-500 border-white/5' : 'text-blue-600 border-slate-200'}`}>
        <Settings className="w-5 h-5" />
        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Comando de Licitação</span>
      </div>

      <div className="space-y-6">
        {/* 01. FASE */}
        <div>
          <label className={labelBase}><Briefcase className="w-3.5 h-3.5"/> 01. Fase Processual</label>
          <select
            className={inputBase}
            value={data.phase}
            onChange={(e) => onChange({ phase: e.target.value as BiddingPhase })}
          >
            {Object.values(BiddingPhase).map(v => <option key={v} value={v} className="bg-[#0d1117]">{v}</option>)}
          </select>
        </div>

        {/* 02. MODALIDADE (O Campo Solicitado) */}
        <div className="relative">
          <label className={`${labelBase} text-blue-500`}><Gavel className="w-3.5 h-3.5"/> 02. Modalidade (Lei 14.133)</label>
          <div className="relative">
            <select
              className={`${inputBase} modalidade-select font-bold`}
              value={data.modality}
              onChange={(e) => onChange({ modality: e.target.value as Modality })}
            >
              {Object.values(Modality).map(v => <option key={v} value={v} className="bg-[#0d1117]">{v}</option>)}
            </select>
            <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500 animate-pulse pointer-events-none" />
          </div>
        </div>

        {/* 03. DOCUMENTO ALVO */}
        <div>
          <label className={labelBase}><FileSignature className="w-3.5 h-3.5"/> 03. Documento Alvo</label>
          <select
            className={inputBase}
            value={data.target}
            onChange={(e) => onChange({ target: e.target.value as TargetField })}
          >
            {Object.values(TargetField).map(f => <option key={f} value={f} className="bg-[#0d1117]">{f}</option>)}
          </select>
        </div>

        {/* 04. OBJETO */}
        <div>
          <label className={labelBase}>04. Detalhamento do Objeto</label>
          <textarea
            className={`${inputBase} h-24 resize-none leading-relaxed font-medium`}
            placeholder="Ex: Contratação de serviços de nuvem..."
            value={data.objectAndPurpose}
            onChange={(e) => onChange({ objectAndPurpose: e.target.value })}
          />
        </div>

        {/* 05. ITENS */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={labelBase}>05. Catálogo de Itens / CATMAT</label>
            <button onClick={() => fileRef.current?.click()} className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors group">
              <Paperclip className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <input type="file" ref={fileRef} className="hidden" multiple onChange={handleFileUpload} />

          <textarea
            className={`${inputBase} h-24 resize-none font-mono text-[11px]`}
            placeholder="Item 1: Qtd | Descrição... "
            value={data.itemsInfo}
            onChange={(e) => onChange({ itemsInfo: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className={`w-full py-5 rounded-xl font-black text-[12px] uppercase tracking-[0.4em] transition-all 
          ${loading ? 'bg-slate-700 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl border-b-4 border-blue-800'}`}
      >
        {loading ? <Activity className="w-5 h-5 animate-spin mx-auto" /> : 'Sincronizar IA'}
      </button>

      <div className={`p-4 rounded-xl border flex gap-3 items-start ${theme === 'dark' ? 'bg-blue-900/10 border-blue-500/10 shadow-inner' : 'bg-blue-50 border-blue-100'}`}>
        <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className={`text-[9px] font-bold uppercase tracking-tighter ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
          Protocolo de conformidade Art. 18 Lei 14.133/21 ativo.
        </p>
      </div>
    </div>
  );
};

export default InputSection;
