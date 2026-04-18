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
  // Export document is designed as a light-themed print doc — always capture on white
  // regardless of the app's current theme. The offscreen host sits at left:-10000, so
  // we pass explicit width/height to keep toPng from inheriting a 0×0 bounding rect.
  const width = element.scrollWidth || element.offsetWidth;
  const height = element.scrollHeight || element.offsetHeight;

  return toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    style: {
      margin: '0',
      transform: 'none',
      left: '0',
      top: '0',
      position: 'static',
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
