// Mouse events stay in their own document, including nested demo frames.
(() => {
  if (window === window.top && !document.body.classList.contains('shower')) return;

  const root = document.documentElement;
  let timer;
  function restartTimer() {
    root.classList.remove('cursor-idle');
    clearTimeout(timer);
    timer = setTimeout(() => root.classList.add('cursor-idle'), 3000);
  }

  document.addEventListener('mousemove', restartTimer, { passive: true, capture: true });
  document.addEventListener('mousedown', restartTimer, { passive: true, capture: true });
  window.addEventListener('pageshow', restartTimer);
})();
