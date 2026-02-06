
export enum TargetField {
  OBJETO = 'Objeto da Licitação',
  JUSTIFICATIVA = 'Justificativa de Contratação',
  ETP = 'Estudo Técnico Preliminar (ETP)',
  TR = 'Termo de Referência (TR)',
  EDITAL = 'Edital de Licitação',
  CONTRATO = 'Minuta de Contrato',
  MAPA_COMPARATIVO = 'Mapa Comparativo de Preços',
  ESPECIFICACAO = 'Especificação Técnica do Item',
  EXIGENCIA = 'Exigência de Qualificação Técnica',
  SANCOES = 'Regime de Sanções Administrativas',
  OUTROS = 'Outros Campos'
}

export enum Modality {
  PREGAO = 'Pregão (Art. 28, I)',
  CONCORRENCIA = 'Concorrência (Art. 28, II)',
  DIALOGO = 'Diálogo Competitivo (Art. 28, V)',
  DISPENSA = 'Dispensa de Licitação (Art. 75)',
  INEXIGIBILIDADE = 'Inexigibilidade (Art. 74)'
}

export enum BiddingPhase {
  PLANEJAMENTO = 'Fase Preparatória (Planejamento)',
  SELECAO = 'Seleção do Fornecedor',
  GESTAO = 'Gestão e Execução Contratual'
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ContextData {
  phase: BiddingPhase;
  modality: Modality;
  target: TargetField;
  objectAndPurpose: string;
  itemsInfo: string;
  legalBaseDetails: string;
  itemFiles?: FileData[];
}

export type FullDocument = Partial<Record<TargetField, string>>;
