'use client';
import { useEffect } from 'react';

export default function IframeResizer() {
  useEffect(() => {
    if (typeof window === 'undefined' || window === window.parent) return;

    // Prevent scrollbars appearing inside the iframe while it's being sized.
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    let timer: ReturnType<typeof setTimeout>;
    let lastHeight = 0;

    const send = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // scrollHeight gives the true content height even when overflow is
        // hidden — offsetHeight was returning the clamped viewport height,
        // which cut off content on small mobile screens.
        const height = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        );
        if (height === lastHeight) return;
        lastHeight = height;
        window.parent.postMessage({ type: 'calculator-resize', height }, '*');
      }, 50);
    };

    // ResizeObserver — fires when the body's rendered size changes (initial
    // load, orientation change, font swap, etc.)
    const ro = new ResizeObserver(send);
    ro.observe(document.body);

    // MutationObserver — fires when steps mount/unmount or popups open.
    // Needed because overflow:hidden prevents the body's rendered size from
    // changing on content growth, so ResizeObserver alone misses step changes.
    const mo = new MutationObserver(send);
    mo.observe(document.body, { childList: true, subtree: true });

    send();

    return () => {
      ro.disconnect();
      mo.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return null;
}
