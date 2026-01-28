
import { GoogleGenAI, Type, GenerateContentResponse, Part } from "@google/genai";
import { ContextData, ChatMessage, FullDocument, FileData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `Você é o LicitAI, um Consultor Jurídico Sênior e Pregoeiro especializado em Contratações Públicas Federais, com foco absoluto na Marinha do Brasil (MB). 

Sua missão é redigir documentos para o portal Compras.gov.br seguindo a Lei 14.133/2021.

ANÁLISE DE ARQUIVOS:
- PDFs e Imagens são processados visualmente.
- Dados de CSV e TXT são injetados no seu contexto de texto.
- Se receber avisos sobre arquivos XLS/ODS, informe ao usuário que você "vê" o anexo mas, por limitações técnicas do portal, ele deve converter para PDF ou CSV para uma leitura detalhada dos dados.

REGRAS DE FORMATAÇÃO:
- Utilize MARKDOWN e TABELAS MARKDOWN.
- Responda EXCLUSIVAMENTE em formato JSON.`;

/**
 * Helper para processar arquivos e separar o que vai como inlineData 
 * do que deve ser injetado como texto no prompt.
 */
const processFilesForGemini = (files: FileData[]) => {
  // Store inline data with original file name for potential textual description
  const inlineDataParts: { inlineData: { mimeType: string; data: string }, name: string }[] = [];
  let extractedText = "";

  files.forEach(f => {
    // Tipos suportados oficialmente por inlineData
    if (f.mimeType === 'application/pdf' || f.mimeType.startsWith('image/')) {
      inlineDataParts.push({
        inlineData: { mimeType: f.mimeType, data: f.data },
        name: f.name // Store the original file name
      });
    } 
    // Tentativa de leitura de arquivos baseados em texto (CSV, TXT)
    else if (f.mimeType.includes('text/') || f.mimeType.includes('csv') || f.name.endsWith('.csv') || f.name.endsWith('.txt')) {
      try {
        const decoded = atob(f.data);
        extractedText += `\n\n--- CONTEÚDO DO ARQUIVO (${f.name}) ---\n${decoded}\n--- FIM DO ARQUIVO ---`;
      } catch (e) {
        extractedText += `\n\n(Erro ao ler conteúdo textual do arquivo: ${f.name})`;
      }
    }
    // Formatos binários não suportados (XLS, XLSX, ODS)
    else {
      extractedText += `\n\n(Aviso: O arquivo binário "${f.name}" foi anexado pelo usuário. Você não pode ler o conteúdo bruto binário deste formato. Peça ao usuário que exporte para PDF ou cole os dados se necessário.)`;
    }
  });

  return { inlineDataParts, extractedText };
};

const parseAIResponse = (response: GenerateContentResponse) => {
  try {
    const text = response.text || "{}";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { 
      rascunho_tecnico: "", 
      notas_do_especialista: "Erro na formatação da resposta da IA. Tente simplificar os dados." 
    };
  }
};

export const generateInitialDraft = async (data: ContextData, fullDoc: FullDocument): Promise<{draft: string, commentary: string}> => {
  const docSummary = Object.entries(fullDoc)
    .filter(([_, text]) => !!text && text.trim() !== "")
    .map(([field, text]) => `[SEÇÃO COMPILADA: ${field}]:\n${text}`)
    .join("\n\n");

  const allFiles = [...(data.itemFiles || []), ...(data.files || [])];
  const { inlineDataParts, extractedText } = processFilesForGemini(allFiles);

  const prompt = `
[CONTEXTO MB]
[CAMPO ALVO]: ${data.target}
[OBJETO]: ${data.objectAndPurpose}
[TÓPICO]: ${data.topic || "Geral"}
[ITENS INFORMADOS]: ${data.itemsInfo}
${extractedText}

[MINUTA ATUAL]:
${docSummary || "Documento em branco."}

COMANDO: Redija o rascunho técnico para a seção "${data.target}".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{
        role: 'user',
        parts: [{ text: prompt }, ...inlineDataParts.map(p => ({ inlineData: p.inlineData }))] 
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 16384 },
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
    });

    const parsed = parseAIResponse(response);
    return {
      draft: parsed.rascunho_tecnico || "",
      commentary: parsed.notas_do_especialista || ""
    };
  } catch (error: any) {
    console.error("Erro na API Gemini:", error);
    throw error;
  }
};

export const sendChatMessage = async (
  message: string, 
  history: ChatMessage[], 
  context: ContextData,
  currentDraft: string | null,
  fullDoc: FullDocument,
  newFiles?: FileData[]
): Promise<string> => {
  const docSummary = Object.entries(fullDoc)
    .filter(([_, text]) => !!text && text.trim() !== "")
    .map(([field, text]) => `### ${field}:\n${text}`)
    .join("\n\n");

  // Processa os novos arquivos do chat para a mensagem atual
  const chatFiles = [...(newFiles || [])];
  const { inlineDataParts, extractedText } = processFilesForGemini(chatFiles);

  // Construct the message string, including textual descriptions of attached files
  let messageText = `${message}\n${extractedText}`;
  
  // Add textual descriptions for files that would have been inlineDataParts
  if (inlineDataParts.length > 0) {
    messageText += "\n\n--- ANEXOS DO USUÁRIO (referência textual para a IA) ---";
    inlineDataParts.forEach(part => {
      messageText += `\n- Arquivo: "${part.name}" (tipo: ${part.inlineData.mimeType})`;
    });
    messageText += "\n--- FIM DOS ANEXOS ---";
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-3-pro-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\n\nESTADO DA MINUTA:\n" + docSummary,
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 16384 },
        responseMimeType: "application/json",
      },
      // Correctly map history to include user files as parts if present
      history: history.flatMap(m => {
        const parts: Part[] = [{ text: m.text }];
        if (m.files && m.files.length > 0) {
          const { inlineDataParts: historyInlineData } = processFilesForGemini(m.files);
          parts.push(...historyInlineData.map(p => ({ inlineData: p.inlineData })));
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts: parts
        };
      })
    });

    const currentMessageParts: Part[] = [{ text: messageText }];
    currentMessageParts.push(...inlineDataParts.map(p => ({ inlineData: p.inlineData })));

    const response = await chat.sendMessage({ 
      message: currentMessageParts 
    });
    
    const parsed = parseAIResponse(response);
    return parsed.notas_do_especialista || parsed.rascunho_tecnico || "Resposta processada.";
  } catch (error) {
    return "Ocorreu um erro ao processar sua solicitação com os anexos fornecidos.";
  }
};