
import { jsPDF } from 'jspdf';
import { FullDocument, TargetField } from '../types';

export const exportFullDocumentToPdf = (fullDocument: FullDocument, currentResult: string | null, target: TargetField) => {
  const doc = new jsPDF();
  const margin = 20;
  let y = 30;

  const sections = Object.entries(fullDocument);
  const activeContent = sections.length > 0 ? sections : (currentResult ? [[target, currentResult]] : []);

  if (activeContent.length === 0) return false;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE LICITAÇÃO - LEI 14.133/21", 105, 20, { align: "center" });

  activeContent.forEach(([title, text]) => {
    if (y > 250) { doc.addPage(); y = 20; }
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(String(title).toUpperCase(), margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text || "", 170);
    
    lines.forEach((line: string) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 6;
    });
    y += 10;
  });

  doc.save(`Minuta_LicitAI_${Date.now()}.pdf`);
  return true;
};
