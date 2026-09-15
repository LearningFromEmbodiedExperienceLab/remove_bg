export const $ = (sel, root = document) => root.querySelector(sel);

export function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function fitCanvasToContainer(canvas, imageW, imageH, container) {
  const maxW = container.clientWidth - 48;
  const maxH = window.innerHeight * 0.65;
  const scale = Math.min(1, maxW / imageW, maxH / imageH);
  const w = Math.round(imageW * scale);
  const h = Math.round(imageH * scale);
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  return scale;
}

export function drawCanvasScaled(ctx, source, destW, destH) {
  ctx.clearRect(0, 0, destW, destH);
  ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, destW, destH);
}

export function downloadCanvas(canvas, prefix = 'photo') {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function syncCanvasLayer(layerCanvas, mainCanvas) {
  layerCanvas.width = mainCanvas.width;
  layerCanvas.height = mainCanvas.height;
  layerCanvas.style.width = mainCanvas.style.width;
  layerCanvas.style.height = mainCanvas.style.height;
}

export function cloneCanvas(source) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext('2d').drawImage(source, 0, 0);
  return canvas;
}

export function resetLayerCanvas(layerCanvas) {
  layerCanvas.hidden = true;
  layerCanvas.width = 0;
  layerCanvas.height = 0;
  layerCanvas.style.width = '';
  layerCanvas.style.height = '';
  layerCanvas.classList.remove('app-preview-canvas--active');
  const ctx = layerCanvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, 0, 0);
}
