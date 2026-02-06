import { GoogleGenerativeAI } from "@google/generative-ai";
import { ContextData, ChatMessage, FullDocument } from "../types";

// 1. Inicialização usando o nome correto da classe importada
// O Vite usará a chave VITE_GEMINI_API_KEY que você configurou na Vercel
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// 2. Modelo definido como 2.5 Flash conforme sua exigência
const MODEL_NAME = "gemini-2.5-flash";

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

export const generateInitialDraft = async (data: ContextData, _fullDoc: FullDocument): Promise<{draft: string, commentary: string}> => {
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT 
  });

  const prompt = `
  Fase: ${data.phase}
  Modalidade: ${data.modality}
  Documento: ${data.target}
  Objeto: ${data.objectAndPurpose}
  Contexto Técnico: ${data.itemsInfo}
  
  Gere a minuta oficial respeitando os requisitos da modalidade ${data.modality}.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const res = parseAIResponse(response.text() || "{}");
  
  return { 
    draft: res.rascunho_tecnico, 
    commentary: `### ⚖️ PARECER JURÍDICO [RISCO: ${res.nivel_risco}]\n${res.analise_juridica}` 
  };
};

export const sendChatMessage = async (msg: string, history: ChatMessage[], context: ContextData, currentDraft: string | null, _fullDoc: FullDocument): Promise<string> => {
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    systemInstruction: `${SYSTEM_PROMPT}\n\nModalidade Atual: ${context.modality}\nMinuta Atual: ${currentDraft}`
  });

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    })),
  });

  const result = await chat.sendMessage(msg);
  const response = await result.response;
  const parsed = parseAIResponse(response.text() || "{}");
  return parsed.rascunho_tecnico || parsed.analise_juridica;
};
