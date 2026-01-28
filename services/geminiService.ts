
import { GoogleGenAI, Type } from "@google/genai";
import { ContextData, ChatMessage, FullDocument, FileData } from "../types";

const SYSTEM_INSTRUCTION = `Você é o LicitAI, um Consultor Jurídico Sênior e Pregoeiro especializado em Contratações Públicas Federais, com foco absoluto na Marinha do Brasil (MB). 

Sua missão é redigir documentos para o portal Compras.gov.br seguindo a Lei 14.133/2021.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
Você deve responder EXCLUSIVAMENTE em formato JSON com dois campos:
1. "rascunho_tecnico": O texto final/técnico para o portal. Se ainda não tiver dados suficientes para redigir, deixe este campo vazio ("") ou com um rascunho preliminar.
2. "notas_do_especialista": Sua conversa com o usuário. Inclua aqui:
   - ALERTA DE CONFORMIDADE (Riscos de direcionamento).
   - ANÁLISE DE CONTRADIÇÃO (Se o novo texto conflita com seções anteriores da minuta).
   - PEDIDOS DE DADOS (Se faltar algo para concluir a redação).

REGRAS DE NEGÓCIO MB:
- Termos: OM, Fiel Depositário, Setor de Abastecimento.
- Analise sempre a "Minuta Compilada" recebida para garantir que o documento como um todo seja coerente.
- Se o usuário enviar anexos (PDFs, imagens, documentos), analise o conteúdo para fundamentar suas respostas.`;

const parseAIResponse = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Erro ao parsear JSON da IA:", e);
    return { 
      rascunho_tecnico: "", 
      notas_do_especialista: text || "Erro de processamento: O consultor jurídico teve um problema ao formatar a resposta. Por favor, tente reformular o pedido." 
    };
  }
};

// Fix: Correct GoogleGenAI initialization and use responseSchema for reliable JSON output.
export const generateInitialDraft = async (data: ContextData, fullDoc: FullDocument): Promise<{draft: string, commentary: string}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const docSummary = Object.entries(fullDoc)
    .filter(([_, text]) => !!text)
    .map(([field, text]) => `[SEÇÃO: ${field}]:\n${text}`)
    .join("\n\n");

  const prompt = `
[CONTEXTO MB]: Marinha do Brasil
[CAMPO ATUAL]: ${data.target}
[OBJETO]: ${data.objectAndPurpose}
[DADOS ADICIONAIS]: ${data.itemsInfo} | ${data.interaction}

[MINUTA COMPILADA ATÉ O MOMENTO]:
${docSummary || "Minuta ainda vazia."}

COMANDO: Redija o rascunho para o campo ${data.target}. Se detectar que o que está sendo pedido contradiz algo na minuta compilada acima, aponte isso no campo "notas_do_especialista".`;

  const itemFileParts = (data.itemFiles || []).map(f => ({
    inlineData: { mimeType: f.mimeType, data: f.data }
  }));
  
  const refFileParts = (data.files || []).map(f => ({
    inlineData: { mimeType: f.mimeType, data: f.data }
  }));

  // Fix: Use responseSchema to ensure the JSON structure is strictly followed by the model.
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [{ text: prompt }, ...itemFileParts, ...refFileParts]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rascunho_tecnico: {
            type: Type.STRING,
            description: "O texto técnico final formatado para o portal Compras.gov.br",
          },
          notas_do_especialista: {
            type: Type.STRING,
            description: "Alertas, recomendações, análise de riscos e pedidos de dados adicionais.",
          },
        },
        required: ["rascunho_tecnico", "notas_do_especialista"],
      },
    },
  });

  const parsed = parseAIResponse(response.text || "{}");
  
  return {
    draft: parsed.rascunho_tecnico || "",
    commentary: parsed.notas_do_especialista || ""
  };
};

// Fix: Added FileData to imports and updated GoogleGenAI initialization to use process.env.API_KEY.
export const sendChatMessage = async (
  message: string, 
  history: ChatMessage[], 
  context: ContextData,
  currentDraft: string | null,
  fullDoc: FullDocument,
  newFiles?: FileData[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const docSummary = Object.entries(fullDoc)
    .filter(([_, text]) => !!text)
    .map(([field, text]) => `### ${field}:\n${text}`)
    .join("\n\n");

  const contextSummary = `
MINUTA COMPILADA:
${docSummary || "Vazia."}

CAMPO EM TRABALHO: ${context.target}
RASCUNHO ATUAL: ${currentDraft || "Não gerado"}
`;

  const geminiHistory = history.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [
      { text: m.text },
      ...(m.files || []).map(f => ({
        inlineData: { mimeType: f.mimeType, data: f.data }
      }))
    ]
  }));

  const chat = ai.chats.create({
    model: "gemini-3-pro-preview",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + "\n\n" + contextSummary,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rascunho_tecnico: { type: Type.STRING },
          notas_do_especialista: { type: Type.STRING },
        },
        required: ["rascunho_tecnico", "notas_do_especialista"],
      },
    },
    history: geminiHistory as any[]
  });

  const messageParts: any[] = [{ text: message }];
  if (newFiles && newFiles.length > 0) {
    newFiles.forEach(f => {
      messageParts.push({
        inlineData: { mimeType: f.mimeType, data: f.data }
      });
    });
  }

  const response = await chat.sendMessage({ message: messageParts as any });
  const parsed = parseAIResponse(response.text || "{}");
  
  // Returns the specialist's conversational notes to the chat history.
  return parsed.notas_do_especialista || parsed.rascunho_tecnico || "Não foi possível processar a consulta.";
};
