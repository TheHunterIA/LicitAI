
import { GoogleGenAI, Type } from "@google/genai";
import { ContextData, ChatMessage, FullDocument } from "../types";

// Always use a named parameter for apiKey
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `VOCÊ É O MAGISTRADO-IA v15.0 - ESPECIALISTA SÊNIOR EM LEI 14.133/21.
Sua missão é gerar documentos de licitação IMPECÁVEIS e COMPLETOS.

DIRETRIZES:
1. LEI 14.133/21: Use exclusivamente a Nova Lei. Jamais cite a 8.666/93.
2. RIGOR DOCUMENTAL: Se for TR, inclua Art. 6º, XXIII completo. Se for ETP, inclua Art. 18.
3. ADAPTAÇÃO DE RITO: Ajuste o texto para a MODALIDADE selecionada (Pregão, Dispensa, etc.).
4. TOM: Jurídico-administrativo de alto nível, numeração decimal.

RESPOSTA OBRIGATÓRIA EM JSON.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    rascunho_tecnico: { type: Type.STRING, description: "Markdown do documento completo." },
    analise_juridica: { type: Type.STRING, description: "Parecer técnico sobre o documento." },
    nivel_risco: { type: Type.STRING, description: "BAIXO | MODERADO | ALTO" },
    checklist: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Itens da lei atendidos." }
  },
  required: ["rascunho_tecnico", "analise_juridica", "nivel_risco", "checklist"]
};

export const generateInitialDraft = async (data: ContextData, fullDoc: FullDocument) => {
  const dossieContext = Object.entries(fullDoc).map(([k, v]) => `Doc Anterior (${k}): ${v?.substring(0, 500)}`).join('\n');
  
  const prompt = `
  CONTEXTO DO PROCESSO:
  ${dossieContext}
  
  SOLICITAÇÃO:
  Documento: ${data.target}
  Modalidade: ${data.modality}
  Objeto: ${data.objectAndPurpose}
  Itens/CATMAT: ${data.itemsInfo}
  
  Gere o documento completo com base na Lei 14.133/21.`;

  // Always use generateContent to query the model
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.15,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 24000 }
    },
  });

  // Directly access .text property from response
  const res = JSON.parse(response.text || "{}");
  return { 
    draft: res.rascunho_tecnico, 
    commentary: `### ⚖️ PARECER JURÍDICO [${res.nivel_risco}]\n${res.analise_juridica}\n\n**CONFORMIDADE:**\n${res.checklist.map((c: string) => `- ${c}`).join('\n')}` 
  };
};

// Fixed: Added fullDoc as 5th argument to match call site in App.tsx
export const sendChatMessage = async (msg: string, history: ChatMessage[], context: ContextData, currentDraft: string | null, fullDoc: FullDocument) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `${SYSTEM_PROMPT}\n\nContexto Atual: ${context.modality} / ${context.target}\nMinuta Atual: ${currentDraft}`,
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });
  // Use sendMessage for conversational turns
  const res = await chat.sendMessage({ message: msg });
  // Access .text property directly
  const parsed = JSON.parse(res.text || "{}");
  return parsed.rascunho_tecnico || parsed.analise_juridica;
};
