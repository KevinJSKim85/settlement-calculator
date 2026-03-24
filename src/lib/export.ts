import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function getFilename(extension: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return `정산서_${date}_${time}.${extension}`;
}

export async function exportToImage(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getFilename('png');
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportToPDF(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const margin = 10;
  const availableWidth = pdfWidth - margin * 2;
  const ratio = availableWidth / imgWidth;
  const scaledHeight = imgHeight * ratio;

  const yOffset =
    scaledHeight < pdfHeight - margin * 2
      ? (pdfHeight - scaledHeight) / 2
      : margin;

  pdf.addImage(imgData, 'PNG', margin, yOffset, availableWidth, scaledHeight);
  pdf.save(getFilename('pdf'));
}
