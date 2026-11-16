(() => {
  const $ = s => document.querySelector(s), key = 'teleprompter-manual-v1';
  const fallback = 'Bem-vindo ao seu teleprompter.\n\nCole o seu texto na tela inicial e use o dedo para rolar durante a gravação.\n\nBoa gravação!';
  const get = () => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } };
  const put = value => localStorage.setItem(key, JSON.stringify(value));
  if ($('#script')) {
    const text = $('#script'), size = $('#font-size'), mirror = $('#mirror'), count = $('#word-count'), output = $('#font-value'), status = $('.status'), saved = get();
    text.value = saved.text ?? fallback; size.value = saved.size ?? 32; mirror.checked = saved.mirror ?? false;
    let pending;
    const save = () => { put({ ...get(), text: text.value, size: +size.value, mirror: mirror.checked }); status.innerHTML = '<span></span> Salvo'; };
    const update = () => { const n = (text.value.trim().match(/\S+/g) || []).length; count.textContent = `${n} ${n === 1 ? 'palavra' : 'palavras'}`; output.textContent = `${size.value} px`; };
    const delayed = () => { status.innerHTML = '<span></span> Salvando'; clearTimeout(pending); pending = setTimeout(save, 220); };
    update(); text.addEventListener('input', () => { update(); delayed(); }); size.addEventListener('input', () => { update(); delayed(); }); mirror.addEventListener('change', delayed); $('#start').addEventListener('click', save);
    return;
  }
  const saved = get(); let state = { text: saved.text ?? fallback, size: saved.size ?? 32, mirror: saved.mirror ?? false, scrollSpeed: saved.scrollSpeed ?? 22, cameraMirror: saved.cameraMirror ?? false };
  const reader = $('#reader'), readerText = $('#reader-text'), area = $('#scroll-area'), camera = $('#camera'), status = $('#camera-status'), sizeLabel = $('#reader-size'), speed = $('#scroll-speed'), speedLabel = $('#scroll-speed-value'), scrollButton = $('#scroll-toggle'), record = $('#record'), flip = $('#flip-camera'), download = $('#download'), cameraMirror = $('#mirror-camera');
  const saveState = () => { state = { ...state, scrollSpeed: +speed.value, cameraMirror: camera.classList.contains('is-mirrored') }; put({ ...saved, ...state }); };
  readerText.textContent = state.text.trim() || 'Seu texto aparecerá aqui.'; reader.classList.toggle('mirrored', state.mirror); document.documentElement.style.setProperty('--font-size', `${state.size}px`); sizeLabel.textContent = state.size; speed.value = state.scrollSpeed; speedLabel.textContent = `${state.scrollSpeed} px/s`; camera.classList.toggle('is-mirrored', state.cameraMirror); cameraMirror.classList.toggle('is-active', state.cameraMirror); cameraMirror.setAttribute('aria-pressed', String(state.cameraMirror));
  let stream, mediaRecorder, chunks = [], recordingUrl, facing = 'user', scrolling = false, frame, previous;
  const cameraStatus = text => { status.textContent = text; };
  async function openCamera() { if (!navigator.mediaDevices?.getUserMedia) return cameraStatus('A câmera não é compatível com este navegador.'); if (stream) stream.getTracks().forEach(t => t.stop()); cameraStatus('Pedindo acesso à câmera…'); try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: true }); camera.srcObject = stream; await camera.play(); cameraStatus('Câmera pronta'); record.disabled = false; flip.disabled = false; } catch (error) { cameraStatus(error.name === 'NotAllowedError' ? 'Permita câmera e microfone para gravar.' : 'Não foi possível abrir a câmera.'); record.disabled = true; } }
  const stopCamera = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = undefined; camera.srcObject = null; };
  const chooseType = () => ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || '';
  function startRecording() { if (!stream || !window.MediaRecorder) return cameraStatus('A gravação não é compatível neste navegador.'); chunks = []; const type = chooseType(); mediaRecorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined); mediaRecorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); }; mediaRecorder.onstop = () => { if (recordingUrl) URL.revokeObjectURL(recordingUrl); recordingUrl = URL.createObjectURL(new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' })); download.hidden = false; cameraStatus('Vídeo pronto para baixar'); }; mediaRecorder.start(1000); record.classList.add('is-recording'); record.innerHTML = '<span></span> Parar'; cameraStatus('Gravando…'); }
  function stopRecording() { if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); record.classList.remove('is-recording'); record.innerHTML = '<span></span> Gravar'; }
  function setScroll() { scrollButton.classList.toggle('is-running', scrolling); scrollButton.innerHTML = scrolling ? '<span aria-hidden="true">❚❚</span> Pausar' : '<span aria-hidden="true">▶</span> Continuar'; }
  function pause() { scrolling = false; cancelAnimationFrame(frame); previous = undefined; setScroll(); }
  function step(now) { if (!scrolling) return; const elapsed = previous ? (now - previous) / 1000 : 0; previous = now; const bottom = area.scrollHeight - area.clientHeight; area.scrollTop = Math.min(bottom, area.scrollTop + (+speed.value * elapsed)); if (area.scrollTop >= bottom - 1) return pause(); frame = requestAnimationFrame(step); }
  function toggleScroll() { if (scrolling) return pause(); if (area.scrollTop >= area.scrollHeight - area.clientHeight - 1) area.scrollTop = 0; scrolling = true; previous = undefined; setScroll(); frame = requestAnimationFrame(step); }
  $('#smaller').addEventListener('click', () => { state.size = Math.max(22, state.size - 2); document.documentElement.style.setProperty('--font-size', `${state.size}px`); sizeLabel.textContent = state.size; saveState(); });
  $('#larger').addEventListener('click', () => { state.size = Math.min(72, state.size + 2); document.documentElement.style.setProperty('--font-size', `${state.size}px`); sizeLabel.textContent = state.size; saveState(); });
  $('#fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await reader.requestFullscreen(); } catch {} });
  $('#back').addEventListener('click', () => { pause(); if (mediaRecorder?.state === 'recording') stopRecording(); stopCamera(); });
  record.addEventListener('click', () => mediaRecorder?.state === 'recording' ? stopRecording() : startRecording()); flip.addEventListener('click', async () => { facing = facing === 'user' ? 'environment' : 'user'; await openCamera(); });
  download.addEventListener('click', () => { if (!recordingUrl) return; const a = document.createElement('a'); a.href = recordingUrl; a.download = `teleprompter-${new Date().toISOString().slice(0,19).replaceAll(':','-')}.webm`; a.click(); });
  cameraMirror.addEventListener('click', () => { const active = camera.classList.toggle('is-mirrored'); cameraMirror.classList.toggle('is-active', active); cameraMirror.setAttribute('aria-pressed', String(active)); saveState(); });
  scrollButton.addEventListener('click', toggleScroll); speed.addEventListener('input', () => { speedLabel.textContent = `${speed.value} px/s`; saveState(); }); area.addEventListener('touchstart', pause); area.addEventListener('scroll', () => { $('.gesture-hint').style.opacity = '0'; });
  record.disabled = true; flip.disabled = true; openCamera();
})();
