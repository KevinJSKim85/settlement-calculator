import html2canvas from 'html2canvas';
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

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function collectCSSVariables(): Map<string, string> {
  const vars = new Map<string, string>();
  const rootStyle = getComputedStyle(document.documentElement);

  for (let i = 0; i < rootStyle.length; i++) {
    const prop = rootStyle[i];
    if (prop.startsWith('--')) {
      vars.set(prop, rootStyle.getPropertyValue(prop).trim());
    }
  }

  return vars;
}

function collectElementStyles(element: HTMLElement): Map<number, Record<string, string>> {
  const styleMap = new Map<number, Record<string, string>>();
  const elements = element.querySelectorAll('*');

  elements.forEach((el, index) => {
    if (!(el instanceof HTMLElement)) return;
    const cs = getComputedStyle(el);
    styleMap.set(index, {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      borderColor: cs.borderColor,
      borderTopColor: cs.borderTopColor,
      borderBottomColor: cs.borderBottomColor,
      borderLeftColor: cs.borderLeftColor,
      borderRightColor: cs.borderRightColor,
      boxShadow: cs.boxShadow,
      outlineColor: cs.outlineColor,
    });
  });

  return styleMap;
}

function applyStylesToClone(
  clonedDoc: Document,
  cssVars: Map<string, string>,
  elementStyles: Map<number, Record<string, string>>
) {
  const clonedRoot = clonedDoc.documentElement;
  clonedRoot.className = document.documentElement.className;

  cssVars.forEach((value, prop) => {
    clonedRoot.style.setProperty(prop, value);
  });

  const clonedElements = clonedDoc.querySelectorAll('*');
  clonedElements.forEach((el, index) => {
    if (!(el instanceof HTMLElement)) return;
    const styles = elementStyles.get(index);
    if (!styles) return;

    Object.entries(styles).forEach(([key, value]) => {
      el.style.setProperty(
        key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
        value
      );
    });
  });
}

async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  const isDark = document.documentElement.classList.contains('dark');

  const cssVars = collectCSSVariables();
  const elementStyles = collectElementStyles(element);

  return html2canvas(element, {
    scale: 2,
    backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
    useCORS: true,
    logging: false,
    onclone: (doc) => applyStylesToClone(doc, cssVars, elementStyles),
  });
}

export async function exportToImage(element: HTMLElement): Promise<void> {
  const canvas = await captureElement(element);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Canvas blob creation failed'));
    }, 'image/png');
  });

  downloadBlob(blob, getFilename('png'));
}

export async function exportToPDF(element: HTMLElement): Promise<void> {
  const canvas = await captureElement(element);

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

  const pdfBlob = pdf.output('blob');
  downloadBlob(pdfBlob, getFilename('pdf'));
}
