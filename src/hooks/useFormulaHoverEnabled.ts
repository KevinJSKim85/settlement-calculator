'use client';

import { useEffect, useState } from 'react';

const DESKTOP_HOVER_QUERY = '(hover: hover) and (pointer: fine)';
const MOBILE_WIDTH_QUERY = '(max-width: 639px)';

export function useFormulaHoverEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const hoverQuery = window.matchMedia(DESKTOP_HOVER_QUERY);
    const mobileQuery = window.matchMedia(MOBILE_WIDTH_QUERY);
    const update = () => {
      setEnabled(hoverQuery.matches && !mobileQuery.matches);
    };

    update();
    hoverQuery.addEventListener('change', update);
    mobileQuery.addEventListener('change', update);

    return () => {
      hoverQuery.removeEventListener('change', update);
      mobileQuery.removeEventListener('change', update);
    };
  }, []);

  return enabled;
}
