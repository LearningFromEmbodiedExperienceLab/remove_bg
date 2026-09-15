import { state, setCurrent } from '../core/state.js';
import { drawCanvasScaled, roundRectPath, clamp, syncCanvasLayer, resetLayerCanvas } from '../core/utils.js';

const HANDLE = 8;
const MIN_SIZE = 32;

export function applyCrop(source, rect, shape, cornerRadius) {
  const { x, y, w, h } = rect;
  const out = document.createElement('canvas');
  out.width = Math.round(w);
  out.height = Math.round(h);
  const ctx = out.getContext('2d');

  if (shape === 'circle') {
    const r = Math.min(w, h) / 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  } else if (shape === 'rounded') {
    roundRectPath(ctx, 0, 0, w, h, cornerRadius);
    ctx.clip();
  }

  ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
  return out;
}

export function createCropTool(els) {
  let crop = { x: 0, y: 0, w: 0, h: 0 };
  let aspectRatio = null;
  let shape = 'rect';
  let cornerRadius = 24;
  let displayScale = 1;
  let drag = null;
  let active = false;
  let symmetric = true;

  const ctx = els.mainCanvas.getContext('2d');
  const overlayCtx = els.overlayCanvas.getContext('2d');

  function clearOverlay() {
    resetLayerCanvas(els.overlayCanvas);
  }

  function imageCenter() {
    return {
      cx: state.current.width / 2,
      cy: state.current.height / 2,
    };
  }

  function lockedRatio() {
    if (shape === 'circle') return 1;
    return aspectRatio;
  }

  function applySymmetricBounds() {
    const iw = state.current.width;
    const ih = state.current.height;
    const { cx, cy } = imageCenter();
    const r = lockedRatio();
    let halfW = crop.w / 2;
    let halfH = crop.h / 2;

    halfW = Math.max(MIN_SIZE / 2, Math.min(halfW, cx, iw - cx));
    halfH = Math.max(MIN_SIZE / 2, Math.min(halfH, cy, ih - cy));

    if (r) {
      halfW = Math.min(halfW, halfH * r);
      halfH = halfW / r;
      halfW = Math.min(halfW, cx, iw - cx);
      halfH = Math.min(halfH, cy, ih - cy);
    }

    crop.w = halfW * 2;
    crop.h = halfH * 2;
    crop.x = cx - halfW;
    crop.y = cy - halfH;
  }

  function centerCropOnImage() {
    const { cx, cy } = imageCenter();
    crop.x = cx - crop.w / 2;
    crop.y = cy - crop.h / 2;
    applySymmetricBounds();
  }

  function initCrop() {
    if (!state.current) return;
    const margin = 0.1;
    const iw = state.current.width;
    const ih = state.current.height;
    crop.w = iw * (1 - margin * 2);
    crop.h = ih * (1 - margin * 2);
    if (symmetric) {
      centerCropOnImage();
    } else {
      crop.x = (iw - crop.w) / 2;
      crop.y = (ih - crop.h) / 2;
    }
    applyAspectToCrop();
  }

  function applyAspectToCrop() {
    const r = lockedRatio();
    if (!r) return;

    const cx = symmetric ? imageCenter().cx : crop.x + crop.w / 2;
    const cy = symmetric ? imageCenter().cy : crop.y + crop.h / 2;
    let w = crop.w;
    let h = w / r;
    if (h > state.current.height * 0.95) {
      h = state.current.height * 0.8;
      w = h * r;
    }
    crop.w = w;
    crop.h = h;
    if (symmetric) {
      crop.x = cx - w / 2;
      crop.y = cy - h / 2;
      applySymmetricBounds();
    } else {
      crop.x = clamp(cx - w / 2, 0, state.current.width - w);
      crop.y = clamp(cy - h / 2, 0, state.current.height - h);
    }
  }

  function toDisplay(rect) {
    return {
      x: rect.x * displayScale,
      y: rect.y * displayScale,
      w: rect.w * displayScale,
      h: rect.h * displayScale,
    };
  }

  function toImage(x, y) {
    return { x: x / displayScale, y: y / displayScale };
  }

  function drawOverlay() {
    if (!active || !state.current) return;
    const cw = els.mainCanvas.width;
    const ch = els.mainCanvas.height;
    if (!cw || !ch || !displayScale) return;

    els.overlayCanvas.hidden = false;
    syncCanvasLayer(els.overlayCanvas, els.mainCanvas);

    const d = toDisplay(crop);
    overlayCtx.clearRect(0, 0, cw, ch);

    overlayCtx.fillStyle = 'rgba(0,0,0,0.45)';
    overlayCtx.fillRect(0, 0, cw, ch);

    overlayCtx.save();
    if (shape === 'circle') {
      const r = Math.min(d.w, d.h) / 2;
      overlayCtx.beginPath();
      overlayCtx.arc(d.x + d.w / 2, d.y + d.h / 2, r, 0, Math.PI * 2);
      overlayCtx.closePath();
    } else if (shape === 'rounded') {
      const r = Math.min(cornerRadius * displayScale, d.w / 2, d.h / 2);
      roundRectPath(overlayCtx, d.x, d.y, d.w, d.h, r);
    } else {
      overlayCtx.beginPath();
      overlayCtx.rect(d.x, d.y, d.w, d.h);
      overlayCtx.closePath();
    }
    overlayCtx.clip();
    overlayCtx.clearRect(0, 0, cw, ch);
    overlayCtx.restore();

    overlayCtx.strokeStyle = '#fff';
    overlayCtx.lineWidth = 2;
    if (shape === 'circle') {
      const r = Math.min(d.w, d.h) / 2;
      overlayCtx.beginPath();
      overlayCtx.arc(d.x + d.w / 2, d.y + d.h / 2, r, 0, Math.PI * 2);
      overlayCtx.stroke();
    } else if (shape === 'rounded') {
      const r = Math.min(cornerRadius * displayScale, d.w / 2, d.h / 2);
      roundRectPath(overlayCtx, d.x, d.y, d.w, d.h, r);
      overlayCtx.stroke();
    } else {
      overlayCtx.strokeRect(d.x, d.y, d.w, d.h);
    }

    const handles = getHandles(d);
    overlayCtx.fillStyle = '#fff';
    overlayCtx.strokeStyle = 'rgba(0,0,0,0.4)';
    overlayCtx.lineWidth = 1;
    for (const h of handles) {
      overlayCtx.fillRect(h.x - HANDLE / 2, h.y - HANDLE / 2, HANDLE, HANDLE);
      overlayCtx.strokeRect(h.x - HANDLE / 2, h.y - HANDLE / 2, HANDLE, HANDLE);
    }

    if (symmetric) {
      const { cx, cy } = imageCenter();
      const sc = displayScale;
      overlayCtx.save();
      overlayCtx.strokeStyle = 'rgba(255,255,255,0.35)';
      overlayCtx.lineWidth = 1;
      overlayCtx.setLineDash([4, 4]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(cx * sc, 0);
      overlayCtx.lineTo(cx * sc, ch);
      overlayCtx.moveTo(0, cy * sc);
      overlayCtx.lineTo(cw, cy * sc);
      overlayCtx.stroke();
      overlayCtx.restore();
    }

    els.sizeLabel.textContent = `${Math.round(crop.w)} × ${Math.round(crop.h)}`;
  }

  function getHandles(d) {
    const { x, y, w, h } = d;
    return [
      { id: 'nw', x, y },
      { id: 'n', x: x + w / 2, y },
      { id: 'ne', x: x + w, y },
      { id: 'e', x: x + w, y: y + h / 2 },
      { id: 'se', x: x + w, y: y + h },
      { id: 's', x: x + w / 2, y: y + h },
      { id: 'sw', x, y: y + h },
      { id: 'w', x, y: y + h / 2 },
    ];
  }

  function hitHandle(px, py) {
    const d = toDisplay(crop);
    for (const h of getHandles(d)) {
      if (Math.abs(px - h.x) <= HANDLE && Math.abs(py - h.y) <= HANDLE) return h.id;
    }
    if (!symmetric && px >= d.x && px <= d.x + d.w && py >= d.y && py <= d.y + d.h) return 'move';
    return null;
  }

  function resizeCropSymmetric(handle, dx, dy) {
    const { cx, cy } = imageCenter();
    let halfW = crop.w / 2;
    let halfH = crop.h / 2;
    const r = lockedRatio();

    let dHalfW = 0;
    let dHalfH = 0;
    if (handle.includes('e')) dHalfW += dx / 2;
    if (handle.includes('w')) dHalfW -= dx / 2;
    if (handle.includes('s')) dHalfH += dy / 2;
    if (handle.includes('n')) dHalfH -= dy / 2;

    if (r) {
      halfW += dHalfW;
      halfH += dHalfH;
      if (Math.abs(dHalfW) * r >= Math.abs(dHalfH)) {
        halfH = halfW / r;
      } else {
        halfW = halfH * r;
      }
    } else {
      halfW += dHalfW;
      halfH += dHalfH;
    }

    crop.w = Math.max(MIN_SIZE, halfW * 2);
    crop.h = Math.max(MIN_SIZE, halfH * 2);
    crop.x = cx - crop.w / 2;
    crop.y = cy - crop.h / 2;
    applySymmetricBounds();
  }

  function resizeCrop(handle, dx, dy) {
    if (symmetric) {
      resizeCropSymmetric(handle, dx, dy);
      return;
    }
    const iw = state.current.width;
    const ih = state.current.height;
    let { x, y, w, h } = crop;
    const ratio = aspectRatio || w / h;

    if (handle === 'move') {
      x = clamp(x + dx, 0, iw - w);
      y = clamp(y + dy, 0, ih - h);
      crop.x = x;
      crop.y = y;
      return;
    }

    if (handle.includes('e')) w = clamp(w + dx, MIN_SIZE, iw - x);
    if (handle.includes('w')) {
      const nw = clamp(w - dx, MIN_SIZE, w + x);
      x = x + w - nw;
      w = nw;
    }
    if (handle.includes('s')) h = clamp(h + dy, MIN_SIZE, ih - y);
    if (handle.includes('n')) {
      const nh = clamp(h - dy, MIN_SIZE, h + y);
      y = y + h - nh;
      h = nh;
    }

    if (aspectRatio || shape === 'circle') {
      const r = shape === 'circle' ? 1 : aspectRatio;
      if (handle === 'n' || handle === 's') w = h * r;
      else h = w / r;
      if (x + w > iw) w = iw - x;
      if (y + h > ih) h = ih - y;
      if (w < MIN_SIZE) w = MIN_SIZE;
      if (h < MIN_SIZE) h = MIN_SIZE;
    }

    crop.x = clamp(x, 0, iw - w);
    crop.y = clamp(y, 0, ih - h);
    crop.w = clamp(w, MIN_SIZE, iw - crop.x);
    crop.h = clamp(h, MIN_SIZE, ih - crop.y);
  }

  function setRatioActive(value) {
    els.ratioBtns.forEach((btn) => {
      const active = btn.dataset.ratio === value;
      btn.classList.toggle('ui-chip--active', active);
    });
  }

  function setShapeActive(value) {
    els.shapeBtns.forEach((btn) => {
      btn.classList.toggle('ui-chip--active', btn.dataset.shape === value);
    });
  }

  function setRatioDisabled(disabled) {
    els.ratioBtns.forEach((btn) => {
      btn.disabled = disabled;
    });
  }

  function setSymmetric(on) {
    symmetric = on;
    els.symmetricCrop.checked = on;
    if (symmetric && state.current) centerCropOnImage();
    drawOverlay();
  }

  function resetParams() {
    aspectRatio = null;
    shape = 'rect';
    cornerRadius = 24;
    symmetric = true;
    els.symmetricCrop.checked = true;
    setRatioActive('free');
    setRatioDisabled(false);
    els.cornerRadius.value = 24;
    els.cornerRadiusValue.textContent = '24';
    els.cornerSection.hidden = true;
    setShapeActive('rect');
    initCrop();
    if (active) render();
  }

  function render() {
    if (!state.current || !active) return;
    drawCanvasScaled(ctx, state.current, els.mainCanvas.width, els.mainCanvas.height);
    drawOverlay();
    els.applyBtn.disabled = false;
  }

  function setShape(next) {
    shape = next;
    setShapeActive(next);
    els.cornerSection.hidden = next !== 'rounded';
    if (next === 'circle') {
      aspectRatio = 1;
      setRatioActive('1:1');
      setRatioDisabled(true);
    } else {
      setRatioDisabled(false);
    }
    applyAspectToCrop();
    drawOverlay();
  }

  function setRatio(value) {
    const map = {
      free: null,
      '1:1': 1,
      '4:3': 4 / 3,
      '16:9': 16 / 9,
      '3:4': 3 / 4,
    };
    aspectRatio = map[value] ?? null;
    setRatioActive(value);
    if (aspectRatio) applyAspectToCrop();
    drawOverlay();
  }

  function apply() {
    if (!state.current) return false;
    let { x, y, w, h } = crop;
    if (shape === 'circle') {
      const size = Math.min(w, h);
      x += (w - size) / 2;
      y += (h - size) / 2;
      w = h = size;
    }
    setCurrent(applyCrop(state.current, { x, y, w, h }, shape, cornerRadius));
    initCrop();
    render();
    return true;
  }

  function getExportCanvas() {
    if (!state.current) return null;
    let { x, y, w, h } = crop;
    if (shape === 'circle') {
      const size = Math.min(w, h);
      x += (w - size) / 2;
      y += (h - size) / 2;
      w = h = size;
    }
    return applyCrop(state.current, { x, y, w, h }, shape, cornerRadius);
  }

  function activate() {
    active = true;
    els.panel.hidden = false;
    els.overlayCanvas.hidden = false;
    els.canvasTip.textContent = '拖动裁剪框或调整边角';
    initCrop();
    render();
  }

  function deactivate() {
    active = false;
    els.panel.hidden = true;
    clearOverlay();
  }

  function onPointerDown(e) {
    const rect = els.overlayCanvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const handle = hitHandle(px, py);
    if (!handle) return;
    drag = { handle, startX: e.clientX, startY: e.clientY, crop: { ...crop } };
    els.overlayCanvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / displayScale;
    const dy = (e.clientY - drag.startY) / displayScale;
    crop = { ...drag.crop };
    resizeCrop(drag.handle, dx, dy);
    drawOverlay();
  }

  function onPointerUp(e) {
    if (!drag) return;
    drag = null;
    els.overlayCanvas.releasePointerCapture(e.pointerId);
  }

  els.overlayCanvas.addEventListener('pointerdown', onPointerDown);
  els.overlayCanvas.addEventListener('pointermove', onPointerMove);
  els.overlayCanvas.addEventListener('pointerup', onPointerUp);

  els.ratioBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      setRatio(btn.dataset.ratio);
    });
  });

  els.shapeBtns.forEach((btn) => {
    btn.addEventListener('click', () => setShape(btn.dataset.shape));
  });

  els.cornerRadius.addEventListener('input', () => {
    cornerRadius = Number(els.cornerRadius.value);
    els.cornerRadiusValue.textContent = String(cornerRadius);
    drawOverlay();
  });

  els.symmetricCrop.addEventListener('change', () => {
    setSymmetric(els.symmetricCrop.checked);
  });

  return {
    id: 'crop',
    activate,
    deactivate,
    reset: resetParams,
    apply,
    render,
    getExportCanvas,
    canApply: () => !!state.current,
    setDisplayScale(scale) {
      displayScale = scale;
    },
    onResize() {
      if (!state.current) return;
      initCrop();
      render();
    },
  };
}
