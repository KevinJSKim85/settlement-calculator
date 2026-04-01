'use client';

import { useState } from 'react';
import { Download, Image } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { exportToPDF, exportToImage } from '@/lib/export';
import { toast } from 'sonner';

interface ExportButtonsProps {
  targetRef: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
}

export function ExportButtons({ targetRef, disabled }: ExportButtonsProps) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: 'pdf' | 'image') => {
    if (!targetRef.current) return;
    setExporting(true);
    try {
      if (type === 'pdf') {
        await exportToPDF(targetRef.current);
      } else {
        await exportToImage(targetRef.current);
      }
      toast.success(t.export.exportSuccess);
    } catch (err) {
      console.error('[Export Error]', err);
      toast.error(t.export.exportFail);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        onClick={() => handleExport('pdf')}
        disabled={exporting || disabled}
        className="flex-1 rounded-lg bg-brand-red text-white shadow-sm transition-all hover:bg-brand-red/80 active:scale-[0.98] disabled:opacity-30"
      >
        <Download className="mr-1.5 size-3.5" />
        {t.export.pdf}
      </Button>
      <Button
        onClick={() => handleExport('image')}
        disabled={exporting || disabled}
        variant="outline"
        className="flex-1 rounded-lg border-brand-gold/20 text-brand-gold transition-all hover:border-brand-gold/40 hover:bg-brand-gold/5 active:scale-[0.98] disabled:opacity-30"
      >
        <Image className="mr-1.5 size-3.5" />
        {t.export.image}
      </Button>
    </div>
  );
}
