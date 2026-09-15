import { state, setCurrent } from '../core/state.js';
import { rgbToHex, drawCanvasScaled } from '../core/utils.js';

function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11);
}

function floodFillMask(data, w, h, seedX, seedY, tr, tg, tb, tol) {
  const mask = new Uint8Array(w * h);
  const idx = (x, y) => (y * w + x) * 4;
  const mi = (x, y) => y * w + x;
  const queue = [seedX, seedY];
  mask[mi(seedX, seedY)] = 1;
  let qi = 0;

  while (qi < queue.length) {
    const x = queue[qi++];
    const y = queue[qi++];
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const m = mi(nx, ny);
      if (mask[m]) continue;
      const pi = idx(nx, ny);
      if (colorDistance(data[pi], data[pi + 1], data[pi + 2], tr, tg, tb) <= tol) {
        mask[m] = 1;
        queue.push(nx, ny);
      }
    }
  }
  return mask;
}

function hasMaskedNeighbor(mask, w, h, x, y) {
  const mi = (a, b) => b * w + a;
  return (
    (x > 0 && mask[mi(x - 1, y)]) ||
    (x < w - 1 && mask[mi(x + 1, y)]) ||
    (y > 0 && mask[mi(x, y - 1)]) ||
    (y < h - 1 && mask[mi(x, y + 1)])
  );
}

function applyMask(data, w, h, mask, tr, tg, tb, tol, featherRange) {
  const idx = (x, y) => (y * w + x) * 4;
  const mi = (x, y) => y * w + x;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const m = mi(x, y);
      const pi = idx(x, y);
      if (mask[m]) {
        data[pi + 3] = 0;
        continue;
      }
      if (featherRange <= 0 || !hasMaskedNeighbor(mask, w, h, x, y)) continue;
      const dist = colorDistance(data[pi], data[pi + 1], data[pi + 2], tr, tg, tb);
      if (dist <= tol) {
        data[pi + 3] = 0;
      } else if (dist < tol + featherRange) {
        const alpha = (dist - tol) / featherRange;
        data[pi + 3] = Math.round(data[pi + 3] * alpha);
      }
    }
  }
}

export function processRemoveBg(source, targetRgb, tol, featherRange, options = {}) {
  const { mode = 'connected', seedX = 0, seedY = 0 } = options;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const [tr, tg, tb] = targetRgb;
  const w = canvas.width;
  const h = canvas.height;

  if (mode === 'connected') {
    const mask = floodFillMask(data, w, h, seedX, seedY, tr, tg, tb, tol);
    applyMask(data, w, h, mask, tr, tg, tb, tol, featherRange);
  } else {
    for (let i = 0; i < data.length; i += 4) {
      const dist = colorDistance(data[i], data[i + 1], data[i + 2], tr, tg, tb);
      if (dist <= tol) {
        data[i + 3] = 0;
      } else if (featherRange > 0 && dist < tol + featherRange) {
        const alpha = (dist - tol) / featherRange;
        data[i + 3] = Math.round(data[i + 3] * alpha);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function createRemoveBgTool(els) {
  let pickedColor = null;
  let pickedSeed = null;
  let removeMode = 'connected';
  let pickingMode = false;
  let hasPreview = false;

  const ctx = els.mainCanvas.getContext('2d', { willReadFrequently: true });
  const srcCtx = () => state.current.getContext('2d', { willReadFrequently: true });

  function getOptions() {
    return {
      mode: removeMode,
      seedX: pickedSeed?.x ?? 0,
      seedY: pickedSeed?.y ?? 0,
    };
  }

  function getProcessed() {
    const tol = Number(els.tolerance.value);
    const fth = Number(els.feather.value);
    return processRemoveBg(state.current, pickedColor, tol, fth, getOptions());
  }

  function setScope(mode) {
    removeMode = mode;
    els.scopeBtns.forEach((btn) => {
      btn.classList.toggle('ui-segment__btn--active', btn.dataset.scope === mode);
    });
    els.scopeHint.textContent =
      mode === 'connected'
        ? '仅去除与点击位置相连的区域，避免误删主体内部同色'
        : '去除全图所有相近颜色，适合纯色背景';
    if (hasPreview) render();
  }

  function setPickingMode(on) {
    pickingMode = on;
    els.pickColorBtn.classList.toggle('ui-button--pick-active', on);
    els.pickColorBtn.textContent = on ? '取消拾取' : '拾取底色';
    els.canvasStage.classList.toggle('app-canvas-stage--pick', on);
    if (on) {
      els.canvasTip.textContent = '在背景上点击要去除的颜色';
      els.eyedropper.hidden = false;
    } else {
      els.eyedropper.hidden = true;
      syncCanvasTip();
    }
    render();
  }

  function syncCanvasTip() {
    if (pickingMode) return;
    els.canvasTip.textContent = hasPreview
      ? '实时预览去底效果，透明区域以棋盘格显示'
      : '点击「拾取底色」后在图片上选色';
  }

  function resetParams() {
    pickedColor = null;
    pickedSeed = null;
    hasPreview = false;
    setPickingMode(false);
    els.colorSwatch.style.background = '';
    els.colorSwatch.classList.remove('app-color__swatch--active');
    els.colorHex.textContent = '—';
    els.colorHint.textContent = '点击按钮后在图片上选色';
    els.tolerance.value = 32;
    els.toleranceValue.textContent = '32';
    els.feather.value = 8;
    els.featherValue.textContent = '8';
    setScope('connected');
    els.applyBtn.disabled = true;
    els.canvasStack.classList.remove('app-canvas-stack--checker');
    syncCanvasTip();
  }

  function render() {
    if (!state.current) return;
    const w = els.mainCanvas.width;
    const h = els.mainCanvas.height;

    if (hasPreview && pickedColor && !pickingMode) {
      els.canvasStack.classList.add('app-canvas-stack--checker');
      drawCanvasScaled(ctx, getProcessed(), w, h);
    } else {
      els.canvasStack.classList.remove('app-canvas-stack--checker');
      drawCanvasScaled(ctx, state.current, w, h);
    }
  }

  function pickColorAt(clientX, clientY) {
    if (!state.current || !pickingMode) return;

    const rect = els.mainCanvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return;

    const imgX = Math.min(
      state.current.width - 1,
      Math.max(0, Math.floor((x / rect.width) * state.current.width))
    );
    const imgY = Math.min(
      state.current.height - 1,
      Math.max(0, Math.floor((y / rect.height) * state.current.height))
    );
    const pixel = srcCtx().getImageData(imgX, imgY, 1, 1).data;
    pickedColor = [pixel[0], pixel[1], pixel[2]];
    pickedSeed = { x: imgX, y: imgY };

    els.colorSwatch.style.background = rgbToHex(...pickedColor);
    els.colorSwatch.classList.add('app-color__swatch--active');
    els.colorHex.textContent = rgbToHex(...pickedColor);
    els.colorHint.textContent = '已拾取，调整参数后应用';
    els.applyBtn.disabled = false;
    hasPreview = true;
    setPickingMode(false);
    syncCanvasTip();
    render();
  }

  function apply() {
    if (!state.current || !pickedColor) return false;
    setCurrent(getProcessed());
    resetParams();
    return true;
  }

  function getExportCanvas() {
    if (!state.current || !pickedColor) return state.current;
    return getProcessed();
  }

  function activate() {
    els.panel.hidden = false;
    syncCanvasTip();
    render();
  }

  function deactivate() {
    setPickingMode(false);
    els.panel.hidden = true;
    els.eyedropper.hidden = true;
    els.canvasStage.classList.remove('app-canvas-stage--pick');
    els.canvasStack.classList.remove('app-canvas-stack--checker');
  }

  els.pickColorBtn.addEventListener('click', () => setPickingMode(!pickingMode));

  els.mainCanvas.addEventListener('click', (e) => pickColorAt(e.clientX, e.clientY));

  els.mainCanvas.addEventListener('mousemove', (e) => {
    if (!pickingMode) return;
    els.eyedropper.hidden = false;
    els.eyedropper.style.left = `${e.clientX}px`;
    els.eyedropper.style.top = `${e.clientY}px`;

    const rect = els.mainCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x >= 0 && y >= 0 && x < rect.width && y < rect.height && state.current) {
      const imgX = Math.floor((x / rect.width) * state.current.width);
      const imgY = Math.floor((y / rect.height) * state.current.height);
      const pixel = srcCtx().getImageData(imgX, imgY, 1, 1).data;
      els.eyedropper.style.background = rgbToHex(pixel[0], pixel[1], pixel[2]);
    }
  });

  els.mainCanvas.addEventListener('mouseleave', () => {
    if (pickingMode) els.eyedropper.hidden = true;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pickingMode) setPickingMode(false);
  });

  els.scopeBtns.forEach((btn) => {
    btn.addEventListener('click', () => setScope(btn.dataset.scope));
  });

  els.tolerance.addEventListener('input', () => {
    els.toleranceValue.textContent = els.tolerance.value;
    if (hasPreview) render();
  });

  els.feather.addEventListener('input', () => {
    els.featherValue.textContent = els.feather.value;
    if (hasPreview) render();
  });

  return {
    id: 'removeBg',
    activate,
    deactivate,
    reset: resetParams,
    apply,
    render,
    getExportCanvas,
    canApply: () => !!pickedColor,
  };
}
