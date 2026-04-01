import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

function getFilename(extension: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return `settlement_${date}_${time}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function captureElement(element: HTMLElement): Promise<string> {
  const isDark = document.documentElement.classList.contains('dark');

  return toPng(element, {
    pixelRatio: 2,
    backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
    cacheBust: true,
    style: {
      margin: '0',
    },
  });
}

export async function exportToImage(element: HTMLElement): Promise<void> {
  const dataUrl = await captureElement(element);
  downloadDataUrl(dataUrl, getFilename('png'));
}

export async function exportToPDF(element: HTMLElement): Promise<void> {
  const dataUrl = await captureElement(element);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const availableWidth = pdfWidth - margin * 2;
  const availableHeight = pdfHeight - margin * 2;

  const imgAspect = img.width / img.height;
  const fitWidth = availableWidth;
  const fitHeight = fitWidth / imgAspect;

  if (fitHeight <= availableHeight) {
    pdf.addImage(dataUrl, 'PNG', margin, margin, fitWidth, fitHeight);
  } else {
    const pxPerMm = img.width / availableWidth;
    const pageHeightPx = Math.floor(availableHeight * pxPerMm);
    let renderedHeight = 0;
    let pageIndex = 0;

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    while (renderedHeight < img.height) {
      const sliceHeight = Math.min(pageHeightPx, img.height - renderedHeight);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = img.width;
      pageCanvas.height = sliceHeight;
      const pageCtx = pageCanvas.getContext('2d')!;
      pageCtx.drawImage(canvas, 0, renderedHeight, img.width, sliceHeight, 0, 0, img.width, sliceHeight);

      const sliceHeightMm = sliceHeight / pxPerMm;
      const sliceData = pageCanvas.toDataURL('image/png');

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(sliceData, 'PNG', margin, margin, availableWidth, sliceHeightMm);

      renderedHeight += sliceHeight;
      pageIndex += 1;
    }
  }

  const pdfBlob = pdf.output('blob');
  downloadBlob(pdfBlob, getFilename('pdf'));
}
