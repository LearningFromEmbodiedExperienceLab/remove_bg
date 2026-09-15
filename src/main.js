import { state, setImage, resetToOriginal, enableEraser, subscribe } from './core/state.js';
import { $, fitCanvasToContainer, downloadCanvas, resetLayerCanvas } from './core/utils.js';
import { createRemoveBgTool } from './tools/removeBg.js';
import { createCropTool } from './tools/crop.js';
import { createEraserTool } from './tools/eraser.js';

const els = {
  uploadZone: $('#uploadZone'),
  fileInput: $('#fileInput'),
  uploadPlaceholder: $('#uploadPlaceholder'),
  imageStatus: $('#imageStatus'),
  statusText: $('#statusText'),
  restoreBtn: $('#restoreBtn'),
  toolSwitcher: $('#toolSwitcher'),
  eraserToolBtn: $('#eraserToolBtn'),
  eraserToolWrap: $('#eraserToolWrap'),
  eraserToolTip: $('#eraserToolTip'),
  canvasEmpty: $('#canvasEmpty'),
  canvasViewport: $('#canvasViewport'),
  canvasStage: $('#canvasStage'),
  canvasStack: $('#canvasStack'),
  canvasPane: $('#canvasPane'),
  canvasWrapper: $('#canvasWrapper'),
  mainCanvas: $('#mainCanvas'),
  overlayCanvas: $('#overlayCanvas'),
  eyedropper: $('#eyedropper'),
  brushCursor: $('#brushCursor'),
  eraserMinimap: $('#eraserMinimap'),
  minimapCanvas: $('#minimapCanvas'),
  minimapViewport: $('#minimapViewport'),
  exportBar: $('#exportBar'),
  canvasTip: $('#canvasTip'),
  applyBtn: $('#applyBtn'),
  resetToolBtn: $('#resetToolBtn'),
  downloadBtn: $('#downloadBtn'),
  themeToggle: $('#themeToggle'),
  removeBgPanel: $('#removeBgPanel'),
  cropPanel: $('#cropPanel'),
  eraserPanel: $('#eraserPanel'),
  colorSwatch: $('#colorSwatch'),
  colorHex: $('#colorHex'),
  colorHint: $('#colorHint'),
  tolerance: $('#tolerance'),
  toleranceValue: $('#toleranceValue'),
  feather: $('#feather'),
  featherValue: $('#featherValue'),
  scopeBtns: [...document.querySelectorAll('#scopeSegment [data-scope]')],
  scopeHint: $('#scopeHint'),
  pickColorBtn: $('#pickColorBtn'),
  brushSize: $('#brushSize'),
  brushSizeValue: $('#brushSizeValue'),
  eraserZoom: $('#eraserZoom'),
  eraserZoomValue: $('#eraserZoomValue'),
  eraserUndo: $('#eraserUndo'),
  eraserRedo: $('#eraserRedo'),
  ratioGroup: $('#ratioGroup'),
  cornerSection: $('#cornerSection'),
  cornerRadius: $('#cornerRadius'),
  cornerRadiusValue: $('#cornerRadiusValue'),
  sizeLabel: $('#sizeLabel'),
  symmetricCrop: $('#symmetricCrop'),
  ratioBtns: [...document.querySelectorAll('#ratioGroup .ui-chip')],
  shapeBtns: [...document.querySelectorAll('#shapeGroup .ui-chip')],
  panel: null,
};

const removeBgTool = createRemoveBgTool({
  ...els,
  panel: $('#removeBgPanel'),
});

const cropTool = createCropTool({
  ...els,
  panel: $('#cropPanel'),
});

const eraserTool = createEraserTool({
  ...els,
  panel: $('#eraserPanel'),
});

const tools = { removeBg: removeBgTool, crop: cropTool, eraser: eraserTool };
let activeTool = removeBgTool;

function updateStatus() {
  if (!state.current) {
    els.imageStatus.hidden = true;
    return;
  }
  els.imageStatus.hidden = false;
  els.statusText.textContent = `当前：${state.current.width} × ${state.current.height}${state.edited ? ' · 已编辑' : ''}`;
}

function updateToolAccess() {
  const locked = !state.canErase;
  els.eraserToolBtn.disabled = locked;
  if (!locked) {
    els.eraserToolTip.hidden = true;
  }
}

function positionEraserToolTip() {
  const rect = els.eraserToolWrap.getBoundingClientRect();
  els.eraserToolTip.style.left = `${rect.left + rect.width / 2}px`;
  els.eraserToolTip.style.top = `${rect.bottom + 8}px`;
}

function initEraserToolTip() {
  els.eraserToolWrap.addEventListener('mouseenter', () => {
    if (state.canErase) return;
    positionEraserToolTip();
    els.eraserToolTip.hidden = false;
  });
  els.eraserToolWrap.addEventListener('mouseleave', () => {
    els.eraserToolTip.hidden = true;
  });
  window.addEventListener('scroll', () => {
    if (!els.eraserToolTip.hidden) positionEraserToolTip();
  }, true);
}

function clearAuxLayers() {
  resetLayerCanvas(els.overlayCanvas);
  els.canvasStack.classList.remove('app-canvas-stack--checker');
  els.canvasViewport.classList.remove('app-canvas-viewport--zoom');
  els.canvasViewport.style.width = '';
  els.canvasViewport.style.height = '';
  els.canvasViewport.scrollLeft = 0;
  els.canvasViewport.scrollTop = 0;
  els.canvasPane.classList.remove('app-canvas-pane--zoom');
  els.brushCursor.hidden = true;
  els.eraserMinimap.hidden = true;
}

function fitAndRender() {
  if (!state.current) return;

  if (state.activeTool === 'eraser') {
    eraserTool.setBaseFromImage(state.current.width, state.current.height);
    activeTool.render();
    return;
  }

  fitCanvasToContainer(
    els.mainCanvas,
    state.current.width,
    state.current.height,
    els.canvasWrapper
  );
  cropTool.setDisplayScale(
    els.mainCanvas.width / state.current.width
  );
  eraserTool.setBaseFromImage(state.current.width, state.current.height);
  if (state.activeTool !== 'crop') {
    resetLayerCanvas(els.overlayCanvas);
  }
  clearAuxLayers();
  activeTool.render();
}

function switchTool(toolId) {
  if (toolId === 'eraser' && !state.canErase) return;

  activeTool.deactivate();
  state.activeTool = toolId;
  activeTool = tools[toolId];
  document.querySelectorAll('#toolSwitcher .ui-segment__btn').forEach((btn) => {
    btn.classList.toggle('ui-segment__btn--active', btn.dataset.tool === toolId);
  });

  if (toolId === 'eraser') {
    clearAuxLayers();
    eraserTool.setBaseFromImage(state.current.width, state.current.height);
  } else {
    fitCanvasToContainer(
      els.mainCanvas,
      state.current.width,
      state.current.height,
      els.canvasWrapper
    );
    cropTool.setDisplayScale(els.mainCanvas.width / state.current.width);
    clearAuxLayers();
  }

  activeTool.activate();
  els.applyBtn.disabled = !activeTool.canApply();
}

function onImageLoaded(file) {
  clearAuxLayers();
  els.canvasEmpty.hidden = true;
  els.canvasViewport.hidden = false;
  els.toolSwitcher.hidden = false;
  els.exportBar.hidden = false;
  els.canvasTip.hidden = false;
  els.uploadPlaceholder.innerHTML = `<span class="ui-hint">${file.name}</span>`;
  updateStatus();
  updateToolAccess();
  fitAndRender();
  switchTool('removeBg');
}

function loadImage(file) {
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      setImage(img, file.name);
      removeBgTool.reset();
      cropTool.reset();
      eraserTool.reset();
      updateToolAccess();
      onImageLoaded(file);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function initThemeToggle() {
  const root = document.documentElement;
  const isDark = () => root.getAttribute('data-theme') === 'dark';
  const sync = () => {
    els.themeToggle.setAttribute('aria-label', isDark() ? '切换为浅色模式' : '切换为深色模式');
  };
  sync();
  els.themeToggle.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('ui-theme', next);
    sync();
  });
}

els.uploadZone.addEventListener('click', () => els.fileInput.click());
els.uploadZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    els.fileInput.click();
  }
});
els.fileInput.addEventListener('change', () => {
  if (els.fileInput.files[0]) loadImage(els.fileInput.files[0]);
});
els.uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  els.uploadZone.classList.add('app-upload--dragover');
});
els.uploadZone.addEventListener('dragleave', () => {
  els.uploadZone.classList.remove('app-upload--dragover');
});
els.uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  els.uploadZone.classList.remove('app-upload--dragover');
  if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
});

els.toolSwitcher.addEventListener('click', (e) => {
  const btn = e.target.closest('.ui-segment__btn');
  if (!btn || btn.disabled || btn.dataset.tool === state.activeTool) return;
  switchTool(btn.dataset.tool);
});

els.restoreBtn.addEventListener('click', () => {
  resetToOriginal();
  removeBgTool.reset();
  cropTool.reset();
  eraserTool.reset();
  updateStatus();
  updateToolAccess();
  fitAndRender();
  activeTool.activate();
});

els.applyBtn.addEventListener('click', () => {
  const appliedTool = state.activeTool;
  if (activeTool.apply()) {
    updateStatus();
    if (appliedTool === 'removeBg') {
      enableEraser();
      updateToolAccess();
      switchTool('eraser');
    } else {
      fitAndRender();
      els.applyBtn.disabled = !activeTool.canApply();
    }
  }
});

els.resetToolBtn.addEventListener('click', () => {
  activeTool.reset();
  if (state.current) fitAndRender();
  els.applyBtn.disabled = !activeTool.canApply();
});

els.downloadBtn.addEventListener('click', () => {
  const canvas = activeTool.getExportCanvas() || state.current;
  if (canvas) downloadCanvas(canvas, 'photo');
});

subscribe(() => {
  updateStatus();
  updateToolAccess();
});

window.addEventListener('resize', () => {
  if (state.current) fitAndRender();
});

initThemeToggle();
initEraserToolTip();
