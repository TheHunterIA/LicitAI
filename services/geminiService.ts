
import { GoogleGenAI } from "@google/genai";
import { ContextData, ChatMessage, FullDocument } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `VOCÊ É O DR. LICITAI COMMAND v15.0 - ESPECIALISTA SÊNIOR EM LEI 14.133/21.
Sua missão é redigir minutas jurídicas impecáveis seguindo a MODALIDADE DE LICITAÇÃO selecionada.

DIRETRIZES:
1. LEI 14.133/21: Use exclusivamente a Nova Lei de Licitações.
2. MODALIDADE: Adapte o rito conforme a escolha (Pregão, Concorrência, etc.).
3. FORMATO: Responda obrigatoriamente em JSON estruturado.
4. ESTILO: Jurídico-administrativo sênior, numeração decimal, alta precisão.

JSON SCHEMA:
{
  "rascunho_tecnico": "Markdown do texto completo.",
  "analise_juridica": "Seu parecer consultivo.",
  "nivel_risco": "BAIXO | MODERADO | ALTO"
}`;

const parseAIResponse = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    return { rascunho_tecnico: text, analise_juridica: "Falha no parse JSON.", nivel_risco: "ALTO" };
  }
};

export const generateInitialDraft = async (data: ContextData, fullDoc: FullDocument): Promise<{draft: string, commentary: string}> => {
  const prompt = `
  Fase: ${data.phase}
  Modalidade: ${data.modality}
  Documento: ${data.target}
  Objeto: ${data.objectAndPurpose}
  Contexto Técnico: ${data.itemsInfo}
  
  Gere a minuta oficial respeitando os requisitos da modalidade ${data.modality}.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.1,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 32000 }
    },
  });

  const res = parseAIResponse(response.text || "{}");
  return { 
    draft: res.rascunho_tecnico, 
    commentary: `### ⚖️ PARECER JURÍDICO [RISCO: ${res.nivel_risco}]\n${res.analise_juridica}` 
  };
};

export const sendChatMessage = async (msg: string, history: ChatMessage[], context: ContextData, currentDraft: string | null, fullDoc: FullDocument): Promise<string> => {
  const chat = ai.chats.create({
    model: "gemini-3-pro-preview",
    config: {
      systemInstruction: `${SYSTEM_PROMPT}\n\nModalidade Atual: ${context.modality}\nMinuta Atual: ${currentDraft}`,
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  });
  const res = await chat.sendMessage({ message: msg });
  const parsed = parseAIResponse(res.text || "{}");
  return parsed.rascunho_tecnico || parsed.analise_juridica;
};
