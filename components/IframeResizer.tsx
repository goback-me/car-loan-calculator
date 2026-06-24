'use client';
import { useEffect } from 'react';

export default function IframeResizer() {
  useEffect(() => {
    if (typeof window === 'undefined' || window === window.parent) return;

    // Only hide overflow on body, NOT on html/documentElement.
    // If html also has overflow:hidden its height is locked to the iframe
    // viewport, so documentElement.scrollHeight returns the iframe height
    // instead of the content height — making the iframe never shrink when
    // navigating to a shorter step.
    document.body.style.overflow = 'hidden';

    // The layout sets min-h-full on <body>, which forces body height to at
    // least the iframe viewport height. That adds white space below short
    // steps on mobile. Zero it out when running inside an iframe.
    document.body.style.minHeight = '0';

    let timer: ReturnType<typeof setTimeout>;
    let lastHeight = 0;

    const send = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // body grows and shrinks with its content when html is unconstrained,
        // so body.scrollHeight is always the true content height.
        const height = document.body.scrollHeight;
        if (height === lastHeight) return;
        lastHeight = height;
        window.parent.postMessage({ type: 'calculator-resize', height }, '*');
      }, 50);
    };

    const ro = new ResizeObserver(send);
    ro.observe(document.body);

    // MutationObserver catches step transitions and popup open/close where
    // the body's rendered size may not change but its content does.
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
