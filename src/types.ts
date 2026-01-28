
export enum TargetField {
  OBJETO = 'Objeto da Licitação',
  JUSTIFICATIVA = 'Justificativa de Contratação',
  ETP = 'Estudo Técnico Preliminar (ETP)',
  TR = 'Termo de Referência (TR)',
  MAPA_COMPARATIVO = 'Mapa Comparativo de Preços',
  CONDICOES_GERAIS = 'Condições Gerais da Contratação',
  MODELO_EXECUCAO = 'Modelo de Execução e Gestão',
  ESPECIFICACAO = 'Especificação Técnica do Item',
  EXIGENCIA = 'Exigência de Qualificação Técnica',
  OUTROS = 'Outros Campos'
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  files?: FileData[];
}

export interface ContextData {
  objectAndPurpose: string;
  target: TargetField;
  topic: string;
  itemsInfo: string;
  itemFiles?: FileData[];
  interaction: string;
  files?: FileData[];
}

export type FullDocument = Partial<Record<TargetField, string>>;

export interface HistoryItem {
  id: string;
  timestamp: Date;
  data: ContextData;
  result: string;
  chatHistory?: ChatMessage[];
  fullDocument?: FullDocument;
}