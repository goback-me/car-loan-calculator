'use client';
import { useEffect } from 'react';

export default function IframeResizer() {
  useEffect(() => {
    if (typeof window === 'undefined' || window === window.parent) return;

    const send = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'calculator-resize', height }, '*');
    };

    const ro = new ResizeObserver(send);
    ro.observe(document.documentElement);
    send();

    return () => ro.disconnect();
  }, []);

  return null;
}
