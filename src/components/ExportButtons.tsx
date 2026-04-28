'use client';

import { useState } from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';
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
    <div className="flex flex-row gap-2">
      <Button
        onClick={() => handleExport('pdf')}
        disabled={exporting || disabled}
        className="tap-reset h-11 flex-1 rounded-lg bg-brand-red text-white font-medium tracking-wide shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_4px_14px_-6px_rgba(192,48,30,0.55)] transition-all hover:bg-brand-red/90 hover:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_6px_18px_-6px_rgba(192,48,30,0.7)] active:scale-[0.98] disabled:opacity-30 disabled:shadow-none sm:h-10"
      >
        <Download className="mr-1.5 size-3.5" />
        {t.export.pdf}
      </Button>
      <Button
        onClick={() => handleExport('image')}
        disabled={exporting || disabled}
        variant="outline"
        className="tap-reset h-11 flex-1 rounded-lg border-brand-gold/30 bg-brand-gold/10 text-brand-gold font-medium tracking-wide shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition-all hover:border-brand-gold/50 hover:bg-brand-gold/15 active:scale-[0.98] disabled:opacity-30 sm:h-10"
      >
        <ImageIcon className="mr-1.5 size-3.5" />
        {t.export.image}
      </Button>
    </div>
  );
}
