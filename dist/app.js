(() => {
  const $ = (selector) => document.querySelector(selector);
  const storageKey = 'teleprompter-manual-v1';
  const script = $('#script'); const fontSize = $('#font-size'); const mirror = $('#mirror');
  const reader = $('#reader'); const editor = $('#editor'); const readerText = $('#reader-text'); const scrollArea = $('#scroll-area');
  const fontValue = $('#font-value'); const readerSize = $('#reader-size'); const wordCount = $('#word-count'); const status = $('.status'); const hint = $('.gesture-hint');
  const camera = $('#camera'); const cameraStatus = $('#camera-status'); const recordButton = $('#record'); const flipButton = $('#flip-camera'); const downloadButton = $('#download');
  const scrollSpeed = $('#scroll-speed'); const scrollSpeedValue = $('#scroll-speed-value'); const scrollToggle = $('#scroll-toggle');
  const defaultText = 'Bem-vindo ao seu teleprompter.\n\nCole o seu texto na tela inicial e use o dedo para rolar durante a gravação.\n\nBoa gravação!';
  let saveTimer;
  function readState() { try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; } }
  function save() { const data = { text: script.value, size: +fontSize.value, mirror: mirror.checked, scrollSpeed: +scrollSpeed.value }; localStorage.setItem(storageKey, JSON.stringify(data)); status.innerHTML = '<span></span> Salvo'; }
  function scheduleSave() { status.innerHTML = '<span></span> Salvando'; clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }
  function updateWords() { const count = (script.value.trim().match(/\S+/g) || []).length; wordCount.textContent = `${count} ${count === 1 ? 'palavra' : 'palavras'}`; }
  function updateSize() { const value = +fontSize.value; document.documentElement.style.setProperty('--font-size', `${value}px`); fontValue.textContent = `${value} px`; readerSize.textContent = value; scheduleSave(); }
  const state = readState(); script.value = state.text ?? defaultText; fontSize.value = state.size ?? 32; mirror.checked = state.mirror ?? false; scrollSpeed.value = state.scrollSpeed ?? 22; updateWords(); updateSize();
  function updateScrollSpeed() { scrollSpeedValue.textContent = `${scrollSpeed.value} px/s`; scheduleSave(); }
  updateScrollSpeed();
  script.addEventListener('input', () => { updateWords(); scheduleSave(); }); fontSize.addEventListener('input', updateSize); mirror.addEventListener('change', scheduleSave); scrollSpeed.addEventListener('input', updateScrollSpeed);
  let stream; let recorder; let chunks = []; let videoUrl; let facingMode = 'user';
  let autoScrolling = false; let scrollFrame; let previousFrame;
  function setCameraStatus(message) { cameraStatus.textContent = message; }
  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) { setCameraStatus('A câmera não é compatível com este navegador.'); return; }
    if (stream) stream.getTracks().forEach(track => track.stop());
    setCameraStatus('Pedindo acesso à câmera…');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: true });
      camera.srcObject = stream; await camera.play(); setCameraStatus('Câmera pronta'); recordButton.disabled = false; flipButton.disabled = false;
    } catch (error) {
      setCameraStatus(error.name === 'NotAllowedError' ? 'Permita câmera e microfone para gravar.' : 'Não foi possível abrir a câmera.');
      recordButton.disabled = true;
    }
  }
  function stopCamera() { if (stream) stream.getTracks().forEach(track => track.stop()); stream = undefined; camera.srcObject = null; }
  function setScrollButton() { scrollToggle.classList.toggle('is-running', autoScrolling); scrollToggle.innerHTML = autoScrolling ? '<span aria-hidden="true">❚❚</span> Pausar' : '<span aria-hidden="true">▶</span> Continuar'; }
  function pauseAutoScroll() { autoScrolling = false; cancelAnimationFrame(scrollFrame); previousFrame = undefined; setScrollButton(); }
  function autoScrollFrame(timestamp) { if (!autoScrolling) return; const elapsed = previousFrame ? (timestamp - previousFrame) / 1000 : 0; previousFrame = timestamp; const bottom = scrollArea.scrollHeight - scrollArea.clientHeight; scrollArea.scrollTop = Math.min(bottom, scrollArea.scrollTop + (+scrollSpeed.value * elapsed)); if (scrollArea.scrollTop >= bottom - 1) { pauseAutoScroll(); return; } scrollFrame = requestAnimationFrame(autoScrollFrame); }
  function continueAutoScroll() { if (autoScrolling) return; if (scrollArea.scrollTop >= scrollArea.scrollHeight - scrollArea.clientHeight - 1) scrollArea.scrollTop = 0; autoScrolling = true; previousFrame = undefined; setScrollButton(); scrollFrame = requestAnimationFrame(autoScrollFrame); }
  function toggleAutoScroll() { if (autoScrolling) pauseAutoScroll(); else continueAutoScroll(); }
  function recordingMimeType() { return ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type)) || ''; }
  function startRecording() {
    if (!stream || !window.MediaRecorder) { setCameraStatus('A gravação não é compatível neste navegador.'); return; }
    chunks = []; const type = recordingMimeType(); recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => { if (videoUrl) URL.revokeObjectURL(videoUrl); videoUrl = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'video/webm' })); downloadButton.hidden = false; setCameraStatus('Vídeo pronto para baixar'); };
    recorder.start(1000); recordButton.classList.add('is-recording'); recordButton.innerHTML = '<span></span> Parar'; setCameraStatus('Gravando…');
  }
  function stopRecording() { if (recorder?.state === 'recording') recorder.stop(); recordButton.classList.remove('is-recording'); recordButton.innerHTML = '<span></span> Gravar'; }
  function toggleRecording() { if (recorder?.state === 'recording') stopRecording(); else startRecording(); }
  function downloadVideo() { if (!videoUrl) return; const link = document.createElement('a'); link.href = videoUrl; link.download = `teleprompter-${new Date().toISOString().slice(0,19).replaceAll(':','-')}.webm`; link.click(); }
  async function flipCamera() { facingMode = facingMode === 'user' ? 'environment' : 'user'; await startCamera(); }
  function enterReader() { save(); readerText.textContent = script.value.trim() || 'Seu texto aparecerá aqui.'; reader.classList.toggle('mirrored', mirror.checked); editor.hidden = true; reader.hidden = false; scrollArea.scrollTop = 0; pauseAutoScroll(); recordButton.disabled = true; flipButton.disabled = true; downloadButton.hidden = true; startCamera(); setTimeout(() => scrollArea.focus(), 50); }
  function leaveReader() { pauseAutoScroll(); if (recorder?.state === 'recording') stopRecording(); stopCamera(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); reader.hidden = true; editor.hidden = false; }
  $('#start').addEventListener('click', enterReader); $('#back').addEventListener('click', leaveReader);
  $('#smaller').addEventListener('click', () => { fontSize.value = Math.max(+fontSize.min, +fontSize.value - 2); updateSize(); });
  $('#larger').addEventListener('click', () => { fontSize.value = Math.min(+fontSize.max, +fontSize.value + 2); updateSize(); });
  $('#fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await reader.requestFullscreen(); } catch {} });
  recordButton.addEventListener('click', toggleRecording); flipButton.addEventListener('click', flipCamera); downloadButton.addEventListener('click', downloadVideo);
  scrollToggle.addEventListener('click', toggleAutoScroll);
  let hintTimer; scrollArea.addEventListener('touchstart', () => { hint.style.opacity = '0'; pauseAutoScroll(); clearTimeout(hintTimer); }); scrollArea.addEventListener('scroll', () => { hint.style.opacity = '0'; });
  document.addEventListener('keydown', (event) => { if (!reader.hidden && event.key === 'Escape') leaveReader(); });
})();
