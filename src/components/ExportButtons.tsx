'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportToPDF, exportToImage } from '@/lib/export';
import { toast } from 'sonner';

interface ExportButtonsProps {
  targetRef: React.RefObject<HTMLElement | null>;
}

export function ExportButtons({ targetRef }: ExportButtonsProps) {
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
      toast.success('저장 완료');
    } catch {
      toast.error('저장 실패');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        onClick={() => handleExport('pdf')}
        disabled={exporting}
        className="flex-1 bg-brand-red text-white hover:bg-brand-red/80 disabled:opacity-40"
      >
        PDF 저장
      </Button>
      <Button
        onClick={() => handleExport('image')}
        disabled={exporting}
        variant="outline"
        className="flex-1 border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-40"
      >
        이미지 저장
      </Button>
    </div>
  );
}
