
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ContextData, ChatMessage, FullDocument, FileData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CATMAT_DATABASE = `
BASE CATMAT (Códigos Essenciais):
Água Sanitária: 299605, Álcool Gel: 380018, Apontador: 468205, Balde: 321573, Borracha: 483433, Caneta Azul: 462546, Caneta Preta: 432816, Marcador Amarelo: 486374, Toner HP 283A: 429777, Detergente: 386806, Desinfetante: 473431, Papel A4: 471762, Papel Higiênico: 443004, Sabonete Líquido: 472873, Copo 200ml: 618310, Copo 50ml: 254007, Saco Lixo 100L: 470833.
`;

const SYSTEM_INSTRUCTION = `Você é o LicitAI Command v9.0, Especialista em Licitações (Lei 14.133/21).

REGRAS OBRIGATÓRIAS:
1. RESPONDA APENAS EM JSON.
2. TABELAS: Use Markdown (| Item | Especificação | CATMAT | Qtd | Unidade |).
3. NUMERAÇÃO: Use estritamente 1., 1.1., 1.1.1.
4. CATMAT: Aplique os códigos da base fornecida.

ESTRUTURA JSON:
{
  "rascunho_tecnico": "Texto Markdown da minuta.",
  "analise_juridica": "Parecer técnico conciso.",
  "nivel_risco": "BAIXO | MODERADO | CRÍTICO",
  "sugestoes": ["Ação 1", "Ação 2"]
}

${CATMAT_DATABASE}`;

const cleanAndParseJSON = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleaned = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(cleaned);
  } catch (e) {
    // Fallback para quando a quota corta a resposta no meio
    return { 
      rascunho_tecnico: text.replace(/[{}]/g, ''), 
      analise_juridica: "Resposta parcial devido ao limite de tráfego.",
      nivel_risco: "MODERADO",
      sugestoes: ["Aguarde 60 segundos e tente atualizar esta seção."]
    };
  }
};

export const generateInitialDraft = async (data: ContextData, fullDoc: FullDocument): Promise<{draft: string, commentary: string}> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ role: 'user', parts: [{ text: `GERAR ${data.target} PARA: ${data.objectAndPurpose}. ITENS: ${data.itemsInfo}.` }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        // Reduzido para economizar quota (tokens/minuto)
        thinkingConfig: { thinkingBudget: 4000 }, 
        responseMimeType: "application/json",
      },
    });

    const parsed = cleanAndParseJSON(response.text || "{}");
    const commentary = `### 🛡️ ANÁLISE [RISCO: ${parsed.nivel_risco}]\n${parsed.analise_juridica}\n\n**SUGESTÕES:**\n${parsed.sugestoes?.map((s: string) => `- ${s}`).join('\n') || ''}`;
    return { draft: parsed.rascunho_tecnico || "", commentary };
  } catch (error: any) {
    if (error.message?.includes('429')) {
      throw new Error("LIMITE DE QUOTA ATINGIDO: A chave de API atingiu o limite de requisições. Aguarde 60 segundos para a próxima operação.");
    }
    throw error;
  }
};

export const sendChatMessage = async (message: string, history: ChatMessage[], context: ContextData, currentDraft: string | null, fullDoc: FullDocument): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-pro-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\n\nCONTEXTO:\n" + JSON.stringify(fullDoc),
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 2000 },
        responseMimeType: "application/json",
      }
    });
    const response = await chat.sendMessage({ message: [{ text: message }] });
    const parsed = cleanAndParseJSON(response.text || "{}");
    return parsed.rascunho_tecnico || parsed.analise_juridica || "Comando processado.";
  } catch (error: any) {
    return "O servidor está sobrecarregado (Erro 429). Por favor, aguarde um minuto antes de enviar nova mensagem.";
  }
};
