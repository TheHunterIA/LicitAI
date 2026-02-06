import { GoogleGenerativeAI } from "@google/generative-ai";
import { ContextData, ChatMessage, FullDocument } from "../types";

// Verifique se no arquivo package.json a biblioteca é @google/generative-ai
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Modelo 2.5 Flash conforme sua certeza absoluta
const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_PROMPT = `VOCÊ É O DR. LICITAI COMMAND v15.0 - ESPECIALISTA SÊNIOR EM LEI 14.133/21.`;

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

  const prompt = `Fase: ${data.phase} | Objeto: ${data.objectAndPurpose}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const res = parseAIResponse(response.text() || "{}");
  
  return { 
    draft: res.rascunho_tecnico, 
    commentary: `### ⚖️ PARECER JURÍDICO\n${res.analise_juridica}` 
  };
};

export const sendChatMessage = async (msg: string, history: ChatMessage[], context: ContextData, currentDraft: string | null, _fullDoc: FullDocument): Promise<string> => {
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    systemInstruction: `${SYSTEM_PROMPT}\n\nModalidade Atual: ${context.modality}`
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
