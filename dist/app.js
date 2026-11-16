(() => {
  const $ = (selector) => document.querySelector(selector);
  const storageKey = 'teleprompter-manual-v1';
  const script = $('#script'); const fontSize = $('#font-size'); const mirror = $('#mirror');
  const reader = $('#reader'); const editor = $('#editor'); const readerText = $('#reader-text'); const scrollArea = $('#scroll-area');
  const fontValue = $('#font-value'); const readerSize = $('#reader-size'); const wordCount = $('#word-count'); const status = $('.status'); const hint = $('.gesture-hint');
  const defaultText = 'Bem-vindo ao seu teleprompter.\n\nCole o seu texto na tela inicial e use o dedo para rolar durante a gravação.\n\nBoa gravação!';
  let saveTimer;
  function readState() { try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; } }
  function save() { const data = { text: script.value, size: +fontSize.value, mirror: mirror.checked }; localStorage.setItem(storageKey, JSON.stringify(data)); status.innerHTML = '<span></span> Salvo'; }
  function scheduleSave() { status.innerHTML = '<span></span> Salvando'; clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }
  function updateWords() { const count = (script.value.trim().match(/\S+/g) || []).length; wordCount.textContent = `${count} ${count === 1 ? 'palavra' : 'palavras'}`; }
  function updateSize() { const value = +fontSize.value; document.documentElement.style.setProperty('--font-size', `${value}px`); fontValue.textContent = `${value} px`; readerSize.textContent = value; scheduleSave(); }
  const state = readState(); script.value = state.text ?? defaultText; fontSize.value = state.size ?? 32; mirror.checked = state.mirror ?? false; updateWords(); updateSize();
  script.addEventListener('input', () => { updateWords(); scheduleSave(); }); fontSize.addEventListener('input', updateSize); mirror.addEventListener('change', scheduleSave);
  function enterReader() { save(); readerText.textContent = script.value.trim() || 'Seu texto aparecerá aqui.'; reader.classList.toggle('mirrored', mirror.checked); editor.hidden = true; reader.hidden = false; scrollArea.scrollTop = 0; setTimeout(() => scrollArea.focus(), 50); }
  function leaveReader() { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); reader.hidden = true; editor.hidden = false; }
  $('#start').addEventListener('click', enterReader); $('#back').addEventListener('click', leaveReader);
  $('#smaller').addEventListener('click', () => { fontSize.value = Math.max(+fontSize.min, +fontSize.value - 2); updateSize(); });
  $('#larger').addEventListener('click', () => { fontSize.value = Math.min(+fontSize.max, +fontSize.value + 2); updateSize(); });
  $('#fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await reader.requestFullscreen(); } catch {} });
  let hintTimer; scrollArea.addEventListener('touchstart', () => { hint.style.opacity = '0'; clearTimeout(hintTimer); }); scrollArea.addEventListener('scroll', () => { hint.style.opacity = '0'; });
  document.addEventListener('keydown', (event) => { if (!reader.hidden && event.key === 'Escape') leaveReader(); });
})();
