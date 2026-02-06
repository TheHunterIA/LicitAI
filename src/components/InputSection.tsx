
import React, { useRef } from 'react';
import { TargetField, ContextData, FileData } from '../types';
import { Database, FileText, Settings, ShieldCheck } from 'lucide-react';

interface InputSectionProps {
  data: ContextData;
  onChange: (newData: Partial<ContextData>) => void;
  onGenerate: () => void;
  loading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ data, onChange, onGenerate, loading }) => {
  const itemFileRef = useRef<HTMLInputElement>(null);

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
        if (newFiles.length === files.length) onChange({ itemFiles: [...(data.itemFiles || []), ...newFiles] });
      };
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-4 text-blue-400">
        <Settings className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Configurações de Demanda</span>
      </div>

      <div className="space-y-6">
        {/* Objeto */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">01. Objeto da Licitação</label>
          <textarea
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all h-28 resize-none font-medium"
            placeholder="Descreva o objeto central..."
            value={data.objectAndPurpose}
            onChange={(e) => onChange({ objectAndPurpose: e.target.value })}
          />
        </div>

        {/* Documento */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">02. Documento de Destino</label>
          <select
            className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm text-white font-black appearance-none outline-none focus:border-blue-500"
            value={data.target}
            onChange={(e) => onChange({ target: e.target.value as TargetField })}
          >
            {Object.values(TargetField).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Itens */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">03. Matriz de Itens</label>
            <button onClick={() => itemFileRef.current?.click()} className="text-[9px] font-black text-blue-400 hover:text-white uppercase">Anexar Base</button>
          </div>
          <textarea
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all h-32 resize-none font-medium"
            placeholder="Cole dados da planilha..."
            value={data.itemsInfo}
            onChange={(e) => onChange({ itemsInfo: e.target.value })}
          />
          <input type="file" ref={itemFileRef} className="hidden" multiple onChange={handleFileUpload} />
        </div>

        {/* Tópico */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">04. Requisito Específico (Opcional)</label>
          <input
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all font-bold"
            placeholder="Ex: Prazos, Sanções..."
            value={data.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all border-b-4 
          ${loading ? 'bg-slate-800 border-slate-950 text-slate-500' : 'bg-blue-600 border-blue-800 text-white hover:bg-blue-500 shadow-xl shadow-blue-900/20 active:translate-y-1 active:border-b-0'}`}
      >
        {loading ? 'Executando Protocolos...' : 'Redigir Documento Técnico'}
      </button>

      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-2 text-emerald-500 opacity-50">
          <ShieldCheck className="w-3 h-3" />
          <span className="text-[8px] font-black uppercase">Segurança Operacional Ativa</span>
        </div>
      </div>
    </div>
  );
};

export default InputSection;
