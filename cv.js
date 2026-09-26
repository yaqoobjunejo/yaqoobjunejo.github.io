'use strict';

/* =========================================================================
   Résumé page behaviour — formatted/LaTeX view switch, copy-to-clipboard,
   download-format modal, print.
   ========================================================================= */

/* View switch */
(function () {
  const switchBtns = document.querySelectorAll('.view-switch button');
  const panels = document.querySelectorAll('.cv-panel');
  if (!switchBtns.length) return;

  switchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const target = btn.getAttribute('data-view');
      panels.forEach(p => p.classList.toggle('active', p.id === target));
    });
  });
})();

/* Copy LaTeX source */
(function () {
  const copyBtn = document.getElementById('copyTex');
  const source = document.getElementById('texSource');
  if (!copyBtn || !source) return;

  copyBtn.addEventListener('click', async () => {
    const original = copyBtn.innerHTML;
    try {
      await navigator.clipboard.writeText(source.textContent);
      copyBtn.textContent = 'Copied ✓';
    } catch (err) {
      copyBtn.textContent = 'Select & copy manually';
    }
    setTimeout(() => { copyBtn.innerHTML = original; }, 1800);
  });
})();

/* Download modal */
(function () {
  const overlay = document.getElementById('downloadModal');
  const openBtn = document.getElementById('openDownload');
  const backdrop = document.getElementById('downloadBackdrop');
  const cancel = document.getElementById('downloadCancel');
  if (!overlay || !openBtn) return;

  function open() {
    overlay.classList.add('open');
    document.documentElement.classList.add('menu-open');
  }
  function close() {
    overlay.classList.remove('open');
    document.documentElement.classList.remove('menu-open');
  }

  openBtn.addEventListener('click', open);
  backdrop && backdrop.addEventListener('click', close);
  cancel && cancel.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
  overlay.querySelectorAll('.dl-option').forEach(opt => opt.addEventListener('click', () => setTimeout(close, 150)));
})();

/* Print */
(function () {
  const btn = document.getElementById('printBtn');
  if (!btn) return;
  btn.addEventListener('click', () => window.print());
})();
