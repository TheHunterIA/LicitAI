
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ContextData, ChatMessage, FullDocument, FileData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `Você é o Dr. LicitAI Command v5.7, a IA mais avançada em Licitações Públicas Brasileiras (Lei 14.133/21).

REGRAS DE OURO DE ESTRUTURA:
1. HIERARQUIA DECIMAL: Use obrigatoriamente numeração decimal (1., 1.1., 1.1.1.). Nunca pule números.
2. PADRÃO AGU: Redija cláusulas de "Sanções", "Pagamento" e "Recebimento" seguindo o rigor dos modelos da Advocacia-Geral da União.
3. TABELAS: Sempre organize itens, quantitativos e preços em tabelas Markdown com bordas (| Item | Qtd |...).
4. SEM ABREVIAÇÕES: Documento 100% integral. Proibido usar "etc" ou resumos.
5. OBJETIVIDADE: Linguagem jurídica formal, técnica e marcial.

ESTRUTURA DE RESPOSTA (JSON):
{
  "rascunho_tecnico": "Texto integral estruturado em Markdown.",
  "analise_juridica": "Seu parecer consultivo sobre a viabilidade da minuta.",
  "nivel_risco": "BAIXO | MODERADO | CRÍTICO",
  "checklist": ["Item X do Art. 6 cumprido", "Cláusula Y da AGU aplicada"]
}`;

const processFilesForGemini = (files: FileData[]) => {
  const parts: any[] = [];
  let extractedText = "";
  files.forEach(f => {
    if (f.mimeType === 'application/pdf' || f.mimeType.startsWith('image/')) {
      parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
    } else {
      try {
        const decoded = atob(f.data);
        extractedText += `\n\n[DADOS ARQUIVO ${f.name}]:\n${decoded}`;
      } catch (e) {}
    }
  });
  return { parts, extractedText };
};

const cleanAndParseJSON = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanText = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(cleanText);
  } catch (e) {
    return { 
      rascunho_tecnico: text, 
      analise_juridica: "Parecer gerado sem formatação estruturada.",
      nivel_risco: "MODERADO",
      checklist: []
    };
  }
};

export const generateInitialDraft = async (data: ContextData, fullDoc: FullDocument): Promise<{draft: string, commentary: string}> => {
  const allFiles = [...(data.itemFiles || []), ...(data.files || [])];
  const { parts: fileParts, extractedText } = processFilesForGemini(allFiles);
  
  const prompt = `
GERAR DOCUMENTO OFICIAL: ${data.target}
OBJETO: ${data.objectAndPurpose}
INFORMAÇÕES ADICIONAIS: ${data.itemsInfo}
${extractedText}

REQUISITO: Gerar documento INTEGRAL seguindo a Lei 14.133/21 com numeração decimal e tabelas técnicas.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }, ...fileParts] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 24000 },
        responseMimeType: "application/json",
      },
    });

    const parsed = cleanAndParseJSON(response.text || "{}");
    let commentary = `**PARECER DR. LICITAI:**\n${parsed.analise_juridica}\n\n`;
    if (parsed.checklist?.length > 0) {
      commentary += `**CHECKLIST LEGAL:**\n${parsed.checklist.map((c: string) => `✅ ${c}`).join('\n')}`;
    }
    return { draft: parsed.rascunho_tecnico || "", commentary };
  } catch (error) { throw error; }
};

export const sendChatMessage = async (
  message: string, 
  history: ChatMessage[], 
  context: ContextData,
  currentDraft: string | null,
  fullDoc: FullDocument,
  newFiles?: FileData[]
): Promise<string> => {
  const { parts: fileParts, extractedText } = processFilesForGemini(newFiles || []);
  try {
    const chat = ai.chats.create({
      model: "gemini-3-pro-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\n\nCONTEXTO:\n" + (currentDraft || "") + "\n\nDOSSIÊ:\n" + JSON.stringify(fullDoc),
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 12000 },
        responseMimeType: "application/json",
      }
    });
    const response = await chat.sendMessage({ message: [{ text: message + extractedText }, ...fileParts] });
    const parsed = cleanAndParseJSON(response.text || "{}");
    return `${parsed.analise_juridica || parsed.rascunho_tecnico}\n\n**RISCO:** ${parsed.nivel_risco}`;
  } catch (error) { return "Erro no sistema de consultoria."; }
};
