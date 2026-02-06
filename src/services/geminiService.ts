
import { GoogleGenAI, Type } from "@google/genai";
import { ContextData, ChatMessage, FullDocument } from "../types";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `Você é o DR. LICITAI COMMAND v14.0. 
Você é um Especialista Sênior em Direito Administrativo e Licitações Públicas (Lei 14.133/2021).

Sua missão é redigir minutas técnicas e jurídicas de ALTA PERFORMANCE para o Governo Federal.

DIRETRIZES TÉCNICAS INEGOCIÁVEIS:
1. LEI 14.133/21: Use APENAS termos da Nova Lei. Nunca cite Lei 8.666/93 ou 10.520/02.
2. MODALIDADE ESPECÍFICA: Adapte o texto rigorosamente à modalidade escolhida (ex: Pregão exige critério de julgamento menor preço ou maior desconto).
3. ESTRUTURA NORMATIVA: Use numeração decimal rígida (1., 1.1., 1.1.1.).
4. PADRÃO AGU: Siga os modelos da Advocacia-Geral da União.`;

// Recommended way to configure structured outputs using Type enum from @google/genai
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    rascunho_tecnico: {
      type: Type.STRING,
      description: "Markdown do documento completo.",
    },
    analise_juridica: {
      type: Type.STRING,
      description: "Parecer consultivo sobre riscos.",
    },
    nivel_risco: {
      type: Type.STRING,
      description: "BAIXO | MODERADO | ALTO",
    },
    checklist_conformidade: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de requisitos atendidos",
    },
  },
  required: ["rascunho_tecnico", "analise_juridica", "nivel_risco", "checklist_conformidade"],
};

const cleanAndParseJSON = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    return { 
      rascunho_tecnico: text, 
      analise_juridica: "Erro no processamento da estrutura.",
      nivel_risco: "ALTO",
      checklist_conformidade: []
    };
  }
};

export const generateInitialDraft = async (data: ContextData, fullDoc: FullDocument): Promise<{draft: string, commentary: string}> => {
  const prompt = `
  FASE DO PROCESSO: ${data.phase}
  MODALIDADE ESCOLHIDA: ${data.modality}
  DOCUMENTO A GERAR: ${data.target}
  OBJETO: ${data.objectAndPurpose}
  MATRIZ DE ITENS: ${data.itemsInfo}
  BASE LEGAL: ${data.legalBaseDetails}
  
  Redija a minuta INTEGRAL respeitando o rito da modalidade ${data.modality}.`;

  // Always use ai.models.generateContent for querying models
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      // Configured with maximum thinking budget for pro series model
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });

  // Directly access .text property from the response
  const parsed = cleanAndParseJSON(response.text || "{}");
  const commentary = `### ⚖️ PARECER [RISCO: ${parsed.nivel_risco}]\n${parsed.analise_juridica}`;
  
  return { draft: parsed.rascunho_tecnico, commentary };
};

export const sendChatMessage = async (
  message: string, 
  history: ChatMessage[], 
  context: ContextData, 
  currentDraft: string | null, 
  fullDoc: FullDocument
): Promise<string> => {
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION}\n\nMODALIDADE ATUAL: ${context.modality}\nMINUTA: ${currentDraft}`,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });
  
  // Use chat.sendMessage for conversational interactions
  const response = await chat.sendMessage({ message: message });
  const parsed = cleanAndParseJSON(response.text || "{}");
  return parsed.rascunho_tecnico || parsed.analise_juridica;
};
