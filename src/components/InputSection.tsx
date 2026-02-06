
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

  const inputBase = `w-full border rounded-xl p-4 text-sm outline-none transition-all duration-300 ${theme === 'dark' ? 'bg-[#0d1117] border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`;
  const labelBase = `text-[10px] font-black uppercase mb-2 block tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
      <div className={`flex items-center gap-3 pb-4 border-b ${theme === 'dark' ? 'text-blue-500 border-white/5' : 'text-blue-600 border-slate-200'}`}>
        <Settings className="w-5 h-5" />
        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Setup do Gabinete</span>
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
            {Object.values(BiddingPhase).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* 02. MODALIDADE (AQUI ESTÁ A CAIXA SOLICITADA) */}
        <div className="relative group">
          <label className={labelBase}><Gavel className="w-3.5 h-3.5"/> 02. Modalidade (Lei 14.133)</label>
          <div className="relative">
            <select
              className={`${inputBase} border-blue-500/30 bg-blue-500/5`}
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
            placeholder="Qual o escopo da contratação?"
            value={data.objectAndPurpose}
            onChange={(e) => onChange({ objectAndPurpose: e.target.value })}
          />
        </div>

        {/* 05. CONTEXTO TÉCNICO */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={labelBase}>05. Catálogo de Itens / Contexto</label>
            <button onClick={() => fileRef.current?.click()} className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors">
              <Paperclip className="w-4 h-4 text-blue-500" />
            </button>
          </div>
          
          <input type="file" ref={fileRef} className="hidden" multiple onChange={(e) => {
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
          }} />

          {data.itemFiles && data.itemFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {data.itemFiles.map((f, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold border border-blue-500/20 bg-blue-500/10 text-blue-400`}>
                  <span className="truncate max-w-[80px]">{f.name}</span>
                  <button onClick={() => {
                    const updated = [...(data.itemFiles || [])];
                    updated.splice(i, 1);
                    onChange({ itemFiles: updated });
                  }}><X className="w-3 h-3 hover:text-red-500" /></button>
                </div>
              ))}
            </div>
          )}

          <textarea
            className={`${inputBase} h-28 resize-none font-mono text-[11px]`}
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
          ${loading ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl border-b-4 border-blue-800'}`}
      >
        {loading ? (
           <span className="flex items-center justify-center gap-2">
             <Activity className="w-4 h-4 animate-spin" /> Redigindo...
           </span>
        ) : 'Gerar Minuta'}
      </button>

      <div className={`p-5 rounded-2xl border flex gap-4 items-start ${theme === 'dark' ? 'bg-blue-900/10 border-blue-500/10 shadow-[0_0_20px_rgba(37,99,235,0.05)]' : 'bg-blue-50 border-blue-100'}`}>
        <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
        <div>
          <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Compliance PNCP</p>
          <p className={`text-[9px] leading-relaxed font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
            Protocolo de validação normativa Art. 18 Lei 14.133/21 ativo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InputSection;
