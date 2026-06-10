(function () {
  var script = document.currentScript || (function () {
    var all = document.getElementsByTagName('script');
    return all[all.length - 1];
  })();

  // Derive the calculator base URL from wherever embed.js is served from
  var base = script.src.replace(/\/embed\.js(\?.*)?$/, '');
  var page = script.getAttribute('data-page') || '/car-loan';

  var placeholder = document.querySelector('[data-calculator]');
  if (!placeholder) return;

  var iframe = document.createElement('iframe');
  iframe.src = base + page;
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allowtransparency', 'true');
  iframe.style.cssText = [
    'width:100%',
    'height:600px',
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
})();
