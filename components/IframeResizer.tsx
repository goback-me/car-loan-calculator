'use client';
import { useEffect } from 'react';

export default function IframeResizer() {
  useEffect(() => {
    if (typeof window === 'undefined' || window === window.parent) return;

    // Prevent the body itself from growing due to scroll overflow,
    // which would cause a measurement loop with the iframe height.
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    let timer: ReturnType<typeof setTimeout>;

    const send = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // offsetHeight measures rendered height, not scroll height,
        // so it doesn't grow when we expand the iframe — no loop.
        const height = document.body.offsetHeight;
        window.parent.postMessage({ type: 'calculator-resize', height }, '*');
      }, 50);
    };

    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    send();

    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return null;
}
