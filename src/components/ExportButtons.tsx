'use client';

import { useState } from 'react';
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
    } catch {
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
        className="flex-1 bg-brand-red text-white hover:bg-brand-red/80 disabled:opacity-40"
      >
        {t.export.pdf}
      </Button>
      <Button
        onClick={() => handleExport('image')}
        disabled={exporting || disabled}
        variant="outline"
        className="flex-1 border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-40"
      >
        {t.export.image}
      </Button>
    </div>
  );
}
