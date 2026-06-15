(function () {
  var script = document.currentScript || (function () {
    var all = document.getElementsByTagName('script');
    return all[all.length - 1];
  })();

  var base = script.src.replace(/\/embed\.js(\?.*)?$/, '');
  var page = script.getAttribute('data-page') || '/car-loan';
  var iframeUrl = base + page;

  function inject(placeholder) {
    if (placeholder.dataset.calcInjected) return;
    placeholder.dataset.calcInjected = '1';

    var iframe = document.createElement('iframe');
    iframe.src = iframeUrl;
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.style.cssText = [
      'width:100%',
      'height:100%',
      'min-height:500px',
      'border:none',
      'display:block',
      'overflow:hidden',
      'transition:height 0.2s ease',
    ].join(';');

    placeholder.innerHTML = '';
    placeholder.appendChild(iframe);

    window.addEventListener('message', function (e) {
      if (!e.data || e.data.type !== 'calculator-resize') return;
      iframe.style.height = e.data.height + 'px';
    });
  }

  function tryInject() {
    var placeholders = document.querySelectorAll('[data-calculator]');
    placeholders.forEach(inject);
    return placeholders.length > 0;
  }

  // Try immediately (works when script is at bottom of page)
  if (tryInject()) return;

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (tryInject()) return;
      watchDOM();
    });
  } else {
    // DOM ready but element not found yet (Elementor dynamic injection)
    watchDOM();
  }

  function watchDOM() {
    var observer = new MutationObserver(function () {
      if (tryInject()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Stop watching after 10s to avoid running forever
    setTimeout(function () { observer.disconnect(); }, 10000);
  }
})();
