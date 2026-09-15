/** @typedef {'removeBg' | 'crop' | 'eraser'} ToolId */

export const state = {
  original: null,
  current: null,
  fileName: '',
  edited: false,
  canErase: false,
  activeTool: /** @type {ToolId} */ ('removeBg'),
  listeners: new Set(),
};

export function subscribe(fn) {
  state.listeners.add(fn);
  return () => state.listeners.delete(fn);
}

export function notify() {
  state.listeners.forEach((fn) => fn());
}

export function setImage(img, fileName) {
  const canvas = imageToCanvas(img);
  state.original = canvas;
  state.current = cloneCanvas(canvas);
  state.fileName = fileName;
  state.edited = false;
  state.canErase = false;
  notify();
}

export function resetToOriginal() {
  if (!state.original) return;
  state.current = cloneCanvas(state.original);
  state.edited = false;
  state.canErase = false;
  notify();
}

export function enableEraser() {
  state.canErase = true;
  notify();
}

export function setCurrent(canvas) {
  state.current = canvas;
  state.edited = true;
  notify();
}

function imageToCanvas(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d').drawImage(img, 0, 0);
  return canvas;
}

function cloneCanvas(source) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext('2d').drawImage(source, 0, 0);
  return canvas;
}
