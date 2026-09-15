import { state, setCurrent } from '../core/state.js';
import { drawCanvasScaled, cloneCanvas } from '../core/utils.js';

const MAX_HISTORY = 40;

export function createEraserTool(els) {
  let workCanvas = null;
  let dirty = false;
  let active = false;
  let drawing = false;
  let middlePan = false;
  let lastPoint = null;
  let panStart = null;
  let brushSize = 24;
  let zoom = 1;
  let baseDisplayW = 0;
  let baseDisplayH = 0;
  let history = [];
  let historyIndex = -1;

  const ctx = els.mainCanvas.getContext('2d');
  const minimapCtx = els.minimapCanvas.getContext('2d');

  function loadWorkCanvas() {
    if (!state.current) return;
    workCanvas = cloneCanvas(state.current);
    dirty = false;
    resetHistory();
  }

  function resetHistory() {
    history = [cloneCanvas(workCanvas)];
    historyIndex = 0;
    updateHistoryButtons();
  }

  function pushHistory() {
    history = history.slice(0, historyIndex + 1);
    history.push(cloneCanvas(workCanvas));
    if (history.length > MAX_HISTORY) {
      history.shift();
    } else {
      historyIndex++;
    }
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    els.eraserUndo.disabled = historyIndex <= 0;
    els.eraserRedo.disabled = historyIndex >= history.length - 1;
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    workCanvas = cloneCanvas(history[historyIndex]);
    dirty = historyIndex > 0;
    els.applyBtn.disabled = !dirty;
    render();
    updateHistoryButtons();
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    workCanvas = cloneCanvas(history[historyIndex]);
    dirty = true;
    els.applyBtn.disabled = false;
    render();
    updateHistoryButtons();
  }

  function computeBaseDisplay(imageW, imageH) {
    const maxW = els.canvasWrapper.clientWidth - 48;
    const maxH = window.innerHeight * 0.65;
    const scale = Math.min(1, maxW / imageW, maxH / imageH);
    baseDisplayW = Math.round(imageW * scale);
    baseDisplayH = Math.round(imageH * scale);
  }

  function displaySize() {
    return {
      w: Math.round(baseDisplayW * zoom),
      h: Math.round(baseDisplayH * zoom),
    };
  }

  function brushDisplayRadius() {
    if (!workCanvas || !baseDisplayW) return brushSize / 2;
    const { w } = displaySize();
    return (brushSize / 2) * (w / workCanvas.width);
  }

  function updateBrushCursor(clientX, clientY) {
    const r = brushDisplayRadius();
    els.brushCursor.style.width = `${r * 2}px`;
    els.brushCursor.style.height = `${r * 2}px`;
    els.brushCursor.style.left = `${clientX}px`;
    els.brushCursor.style.top = `${clientY}px`;
  }

  function showBrushCursor(clientX, clientY) {
    if (middlePan || drawing) {
      els.brushCursor.hidden = true;
      return;
    }
    els.brushCursor.hidden = false;
    updateBrushCursor(clientX, clientY);
  }

  function clientToImage(clientX, clientY) {
    const rect = els.mainCanvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
      x: (x / rect.width) * workCanvas.width,
      y: (y / rect.height) * workCanvas.height,
    };
  }

  function eraseAt(x, y) {
    const wctx = workCanvas.getContext('2d');
    wctx.globalCompositeOperation = 'destination-out';
    wctx.beginPath();
    wctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    wctx.fill();
    wctx.globalCompositeOperation = 'source-over';
    dirty = true;
    els.applyBtn.disabled = false;
  }

  function strokeTo(point) {
    if (!lastPoint) {
      eraseAt(point.x, point.y);
      lastPoint = point;
      return;
    }
    const dist = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
    const steps = Math.max(1, Math.ceil(dist / (brushSize * 0.3)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      eraseAt(
        lastPoint.x + (point.x - lastPoint.x) * t,
        lastPoint.y + (point.y - lastPoint.y) * t
      );
    }
    lastPoint = point;
    render();
  }

  function updateViewport() {
    const zoomed = active && zoom > 1;
    els.canvasViewport.classList.toggle('app-canvas-viewport--zoom', zoomed);
    els.canvasPane.classList.toggle('app-canvas-pane--zoom', zoomed);

    if (zoomed && baseDisplayW) {
      els.canvasViewport.style.width = `${baseDisplayW}px`;
      els.canvasViewport.style.height = `${baseDisplayH}px`;
    } else {
      els.canvasViewport.style.width = '';
      els.canvasViewport.style.height = '';
    }
  }

  function setZoom(value) {
    const viewport = els.canvasViewport;
    const prevCenterX = viewport.scrollLeft + viewport.clientWidth / 2;
    const prevCenterY = viewport.scrollTop + viewport.clientHeight / 2;
    const prevW = baseDisplayW * zoom;
    const prevH = baseDisplayH * zoom;

    zoom = value / 100;
    els.eraserZoom.value = value;
    els.eraserZoomValue.textContent = `${value}%`;
    updateViewport();

    if (active) {
      render();
      if (zoom > 1 && prevW > 0) {
        const { w, h } = displaySize();
        viewport.scrollLeft = (prevCenterX / prevW) * w - viewport.clientWidth / 2;
        viewport.scrollTop = (prevCenterY / prevH) * h - viewport.clientHeight / 2;
      } else if (zoom <= 1) {
        viewport.scrollLeft = 0;
        viewport.scrollTop = 0;
      }
      updateMinimap();
    }
  }

  function updateMinimap() {
    if (!active || !workCanvas || zoom <= 1) {
      els.eraserMinimap.hidden = true;
      return;
    }
    els.eraserMinimap.hidden = false;

    const thumbMax = 120;
    const scale = thumbMax / Math.max(workCanvas.width, workCanvas.height);
    const mw = Math.max(1, Math.round(workCanvas.width * scale));
    const mh = Math.max(1, Math.round(workCanvas.height * scale));

    els.minimapCanvas.width = mw;
    els.minimapCanvas.height = mh;
    minimapCtx.clearRect(0, 0, mw, mh);
    drawCanvasScaled(minimapCtx, workCanvas, mw, mh);

    const { w, h } = displaySize();
    const viewport = els.canvasViewport;
    const vw = Math.min(mw, (viewport.clientWidth / w) * mw);
    const vh = Math.min(mh, (viewport.clientHeight / h) * mh);
    const vx = (viewport.scrollLeft / w) * mw;
    const vy = (viewport.scrollTop / h) * mh;

    els.minimapViewport.style.width = `${vw}px`;
    els.minimapViewport.style.height = `${vh}px`;
    els.minimapViewport.style.left = `${vx}px`;
    els.minimapViewport.style.top = `${vy}px`;
  }

  function resetParams() {
    brushSize = 24;
    zoom = 1;
    els.brushSize.value = 24;
    els.brushSizeValue.textContent = '24';
    setZoom(100);
    loadWorkCanvas();
    if (active) render();
    els.applyBtn.disabled = true;
  }

  function setBaseFromImage(imageW, imageH) {
    computeBaseDisplay(imageW, imageH);
    if (active) {
      updateViewport();
      render();
    }
  }

  function render() {
    if (!state.current || !active || !workCanvas || !baseDisplayW) return;
    const { w, h } = displaySize();
    els.mainCanvas.width = w;
    els.mainCanvas.height = h;
    els.mainCanvas.style.width = `${w}px`;
    els.mainCanvas.style.height = `${h}px`;
    drawCanvasScaled(ctx, workCanvas, w, h);
    updateMinimap();
  }

  function apply() {
    if (!dirty || !workCanvas) return false;
    setCurrent(cloneCanvas(workCanvas));
    loadWorkCanvas();
    els.applyBtn.disabled = true;
    render();
    return true;
  }

  function getExportCanvas() {
    if (dirty && workCanvas) return workCanvas;
    return state.current;
  }

  function activate() {
    if (!state.canErase) return false;
    active = true;
    els.panel.hidden = false;
    els.canvasStack.classList.add('app-canvas-stack--checker');
    els.canvasStage.classList.add('app-canvas-stage--erase');
    els.canvasTip.textContent = '按住滚轮拖动画布；Ctrl+Z 撤销，Ctrl+Shift+Z 反撤销';
    computeBaseDisplay(state.current.width, state.current.height);
    updateViewport();
    loadWorkCanvas();
    render();
    els.applyBtn.disabled = !dirty;
    return true;
  }

  function deactivate() {
    active = false;
    drawing = false;
    middlePan = false;
    lastPoint = null;
    els.panel.hidden = true;
    hideBrushCursor();
    els.eraserMinimap.hidden = true;
    els.canvasStack.classList.remove('app-canvas-stack--checker');
    els.canvasStage.classList.remove('app-canvas-stage--erase');
    els.canvasStage.classList.remove('app-canvas-stage--pan');
    els.canvasViewport.classList.remove('app-canvas-viewport--zoom');
    els.canvasPane.classList.remove('app-canvas-pane--zoom');
    els.canvasViewport.style.width = '';
    els.canvasViewport.style.height = '';
    els.canvasViewport.scrollLeft = 0;
    els.canvasViewport.scrollTop = 0;
    zoom = 1;
  }

  function onPanDown(e) {
    if (!active || !workCanvas || e.button !== 1 || zoom <= 1) return;
    e.preventDefault();
    middlePan = true;
    panStart = {
      x: e.clientX,
      y: e.clientY,
      scrollL: els.canvasViewport.scrollLeft,
      scrollT: els.canvasViewport.scrollTop,
    };
    els.canvasStage.classList.add('app-canvas-stage--pan');
    els.canvasViewport.setPointerCapture(e.pointerId);
  }

  function onDrawDown(e) {
    if (!active || !workCanvas || e.button !== 0) return;
    drawing = true;
    lastPoint = null;
    els.brushCursor.hidden = true;
    strokeTo(clientToImage(e.clientX, e.clientY));
    els.mainCanvas.setPointerCapture(e.pointerId);
  }

  function hideBrushCursor() {
    els.brushCursor.hidden = true;
  }

  function onPointerMove(e) {
    if (!active) {
      hideBrushCursor();
      return;
    }

    if (middlePan && panStart) {
      els.canvasViewport.scrollLeft = panStart.scrollL - (e.clientX - panStart.x);
      els.canvasViewport.scrollTop = panStart.scrollT - (e.clientY - panStart.y);
      updateMinimap();
      return;
    }

    if (drawing) {
      strokeTo(clientToImage(e.clientX, e.clientY));
      return;
    }

    const rect = els.mainCanvas.getBoundingClientRect();
    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      showBrushCursor(e.clientX, e.clientY);
    } else {
      els.brushCursor.hidden = true;
    }
  }

  function onPanUp(e) {
    if (!middlePan) return;
    middlePan = false;
    panStart = null;
    els.canvasStage.classList.remove('app-canvas-stage--pan');
    els.canvasViewport.releasePointerCapture(e.pointerId);
  }

  function onDrawUp(e) {
    if (!drawing) return;
    drawing = false;
    lastPoint = null;
    els.mainCanvas.releasePointerCapture(e.pointerId);
    pushHistory();
  }

  function onKeyDown(e) {
    if (!active) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  }

  els.mainCanvas.addEventListener('pointerdown', onDrawDown);
  els.canvasViewport.addEventListener('pointerdown', onPanDown);
  els.mainCanvas.addEventListener('pointermove', onPointerMove);
  els.canvasViewport.addEventListener('pointermove', onPointerMove);
  els.mainCanvas.addEventListener('pointerup', onDrawUp);
  els.canvasViewport.addEventListener('pointerup', onPanUp);
  els.mainCanvas.addEventListener('pointercancel', onDrawUp);
  els.canvasViewport.addEventListener('pointercancel', onPanUp);
  els.mainCanvas.addEventListener('mouseleave', () => {
    if (!drawing) els.brushCursor.hidden = true;
  });
  els.canvasViewport.addEventListener('auxclick', (e) => {
    if (e.button === 1) e.preventDefault();
  });

  els.canvasViewport.addEventListener('scroll', () => {
    if (active) updateMinimap();
  });

  document.addEventListener('keydown', onKeyDown);

  els.brushSize.addEventListener('input', () => {
    brushSize = Number(els.brushSize.value);
    els.brushSizeValue.textContent = els.brushSize.value;
    if (!els.brushCursor.hidden) {
      const r = brushDisplayRadius();
      els.brushCursor.style.width = `${r * 2}px`;
      els.brushCursor.style.height = `${r * 2}px`;
    }
  });

  els.eraserZoom.addEventListener('input', () => {
    setZoom(Number(els.eraserZoom.value));
  });

  els.eraserUndo.addEventListener('click', undo);
  els.eraserRedo.addEventListener('click', redo);

  return {
    id: 'eraser',
    activate,
    deactivate,
    reset: resetParams,
    apply,
    render,
    getExportCanvas,
    canApply: () => dirty,
    setBaseFromImage,
  };
}
