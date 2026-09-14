const $ = (sel) => document.querySelector(sel);

const uploadZone = $('#uploadZone');
const fileInput = $('#fileInput');
const uploadPlaceholder = $('#uploadPlaceholder');
const colorSection = $('#colorSection');
const sliderSection = $('#sliderSection');
const actionSection = $('#actionSection');
const colorSwatch = $('#colorSwatch');
const colorHex = $('#colorHex');
const colorHint = $('#colorHint');
const tolerance = $('#tolerance');
const toleranceValue = $('#toleranceValue');
const feather = $('#feather');
const featherValue = $('#featherValue');
const previewBtn = $('#previewBtn');
const downloadBtn = $('#downloadBtn');
const canvasTabs = $('#canvasTabs');
const canvasWrapper = $('#canvasWrapper');
const canvasEmpty = $('#canvasEmpty');
const canvasStage = $('#canvasStage');
const sourceCanvas = $('#sourceCanvas');
const resultCanvas = $('#resultCanvas');
const resultTab = $('#resultTab');
const canvasTip = $('#canvasTip');
const eyedropperCursor = $('#eyedropperCursor');
const themeToggle = $('#themeToggle');

const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
const resultCtx = resultCanvas.getContext('2d', { willReadFrequently: true });

let originalImage = null;
let pickedColor = null;
let hasPreview = false;
let activeView = 'source';

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11);
}

function removeBackground(image, targetRgb, tol, featherRange) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const [tr, tg, tb] = targetRgb;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = colorDistance(r, g, b, tr, tg, tb);

    if (dist <= tol) {
      data[i + 3] = 0;
    } else if (featherRange > 0 && dist < tol + featherRange) {
      const alpha = (dist - tol) / featherRange;
      data[i + 3] = Math.round(data[i + 3] * alpha);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function fitCanvasToContainer(canvas, image) {
  const maxW = canvasWrapper.clientWidth - 48;
  const maxH = window.innerHeight * 0.7;
  const scale = Math.min(1, maxW / image.naturalWidth, maxH / image.naturalHeight);
  const w = Math.round(image.naturalWidth * scale);
  const h = Math.round(image.naturalHeight * scale);
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  return scale;
}

function drawSource() {
  if (!originalImage) return;
  fitCanvasToContainer(sourceCanvas, originalImage);
  sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  sourceCtx.drawImage(
    originalImage,
    0,
    0,
    originalImage.naturalWidth,
    originalImage.naturalHeight,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height
  );
}

function loadImage(file) {
  if (!file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      pickedColor = null;
      hasPreview = false;

      canvasEmpty.hidden = true;
      canvasStage.hidden = false;
      canvasTabs.hidden = false;
      canvasTip.hidden = false;
      colorSection.hidden = false;
      sliderSection.hidden = false;
      actionSection.hidden = false;

      colorSwatch.style.background = '';
      colorSwatch.classList.remove('app-color__swatch--active');
      colorHex.textContent = '—';
      colorHint.textContent = '点击图片拾取底色';
      previewBtn.disabled = true;
      downloadBtn.disabled = true;
      resultTab.disabled = true;

      setActiveView('source');
      drawSource();

      uploadPlaceholder.innerHTML = `<span class="ui-hint">${file.name}</span>`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function pickColorAt(clientX, clientY) {
  if (!originalImage || activeView !== 'source') return;

  const rect = sourceCanvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return;

  const scale = sourceCanvas.width / rect.width;
  const px = Math.floor(x * scale);
  const py = Math.floor(y * scale);

  const pixel = sourceCtx.getImageData(px, py, 1, 1).data;
  pickedColor = [pixel[0], pixel[1], pixel[2]];

  colorSwatch.style.background = rgbToHex(...pickedColor);
  colorSwatch.classList.add('app-color__swatch--active');
  colorHex.textContent = rgbToHex(...pickedColor);
  colorHint.textContent = '已拾取，可调整容差后预览';
  previewBtn.disabled = false;
}

function generatePreview() {
  if (!originalImage || !pickedColor) return;

  const tol = Number(tolerance.value);
  const fth = Number(feather.value);
  const processed = removeBackground(originalImage, pickedColor, tol, fth);

  resultCanvas.width = processed.width;
  resultCanvas.height = processed.height;
  resultCanvas.style.width = sourceCanvas.style.width;
  resultCanvas.style.height = sourceCanvas.style.height;
  resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  resultCtx.drawImage(processed, 0, 0);

  hasPreview = true;
  downloadBtn.disabled = false;
  resultTab.disabled = false;
  setActiveView('result');
}

function downloadPng() {
  if (!originalImage || !pickedColor) return;

  const tol = Number(tolerance.value);
  const fth = Number(feather.value);
  const processed = removeBackground(originalImage, pickedColor, tol, fth);

  processed.toBlob(
    (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `removed-bg-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    },
    'image/png'
  );
}

function setActiveView(view) {
  activeView = view;
  document.querySelectorAll('.app-tab').forEach((tab) => {
    tab.classList.toggle('app-tab--active', tab.dataset.view === view);
  });

  sourceCanvas.hidden = view !== 'source';
  resultCanvas.hidden = view !== 'result';
  canvasStage.classList.toggle('app-canvas-stage--pick', view === 'source');
  canvasTip.textContent =
    view === 'source' ? '在图片上点击，拾取需要去除的底色' : '透明区域以棋盘格显示';
}

function initThemeToggle() {
  const root = document.documentElement;
  const isDark = () => root.getAttribute('data-theme') === 'dark';

  const sync = () => {
    themeToggle.setAttribute('aria-label', isDark() ? '切换为浅色模式' : '切换为深色模式');
  };

  sync();
  themeToggle.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('ui-theme', next);
    sync();
  });
}

initThemeToggle();

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) loadImage(fileInput.files[0]);
});

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('app-upload--dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('app-upload--dragover');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('app-upload--dragover');
  const file = e.dataTransfer.files[0];
  if (file) loadImage(file);
});

sourceCanvas.addEventListener('click', (e) => {
  pickColorAt(e.clientX, e.clientY);
});

sourceCanvas.addEventListener('mousemove', (e) => {
  if (activeView !== 'source') return;
  eyedropperCursor.hidden = false;
  eyedropperCursor.style.left = `${e.clientX}px`;
  eyedropperCursor.style.top = `${e.clientY}px`;

  const rect = sourceCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x >= 0 && y >= 0 && x < rect.width && y < rect.height) {
    const scale = sourceCanvas.width / rect.width;
    const px = Math.floor(x * scale);
    const py = Math.floor(y * scale);
    const pixel = sourceCtx.getImageData(px, py, 1, 1).data;
    eyedropperCursor.style.background = rgbToHex(pixel[0], pixel[1], pixel[2]);
  }
});

sourceCanvas.addEventListener('mouseleave', () => {
  eyedropperCursor.hidden = true;
});

canvasStage.addEventListener('mouseenter', () => {
  if (activeView === 'source') eyedropperCursor.hidden = false;
});

canvasStage.addEventListener('mouseleave', () => {
  eyedropperCursor.hidden = true;
});

tolerance.addEventListener('input', () => {
  toleranceValue.textContent = tolerance.value;
  if (hasPreview) generatePreview();
});

feather.addEventListener('input', () => {
  featherValue.textContent = feather.value;
  if (hasPreview) generatePreview();
});

canvasTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.app-tab');
  if (!tab || tab.disabled) return;
  setActiveView(tab.dataset.view);
});

previewBtn.addEventListener('click', generatePreview);
downloadBtn.addEventListener('click', downloadPng);

window.addEventListener('resize', () => {
  if (originalImage) {
    drawSource();
    if (hasPreview) generatePreview();
  }
});
