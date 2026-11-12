import { localize } from '../core/i18n.js';
import { $, clamp } from '../core/utils.js';
import { parseColor, parseScreenColor, formatColor, hsvToRgb, colorInputHints } from '../core/color.js';

export function initColorTool() {
  const panel = $('#colorWorkspace');
  const plane = $('#colorPlane');
  const cursor = $('#colorPlaneCursor');
  const hue = $('#colorHue');
  const preview = $('#colorPreview');
  const opacitySlider = $('#colorOpacity');
  const opacityValue = $('#colorOpacityValue');
  const hint = $('#colorInputHint');
  const status = $('#colorToolStatus');
  const pickBtn = $('#screenPickBtn');
  const inputs = [...panel.querySelectorAll('[data-color-format]')];
  let hsv = parseColor('hex', '#3B82F6');
  let opacity = 100;

  function renderOpacity(source) {
    const colors = formatColor(hsv);
    const alpha = opacity / 100;
    preview.style.setProperty('--preview-color', `rgba(${colors.rgb}, ${alpha})`);
    const linear = hsvToRgb(...hsv).map((value) => {
      const c = (value * alpha + 238 * (1 - alpha)) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    preview.style.color = luminance > 0.179 ? '#000000' : '#FFFFFF';
    localize(preview, '当前颜色 {hex}，不透明度 {opacity}%', { hex: colors.hex, opacity }, 'aria-label');
    opacitySlider.value = opacity;
    if (source !== opacityValue) opacityValue.value = opacity;
    opacityValue.removeAttribute('aria-invalid');
  }

  function render(source) {
    const colors = formatColor(hsv);
    plane.style.backgroundColor = `hsl(${hsv[0]} 100% 50%)`;
    cursor.style.left = `${hsv[1]}%`;
    cursor.style.top = `${100 - hsv[2]}%`;
    plane.setAttribute('aria-valuenow', hsv[1].toFixed(1));
    localize(plane, '饱和度 {saturation}%，明度 {value}%', { saturation: hsv[1].toFixed(1), value: hsv[2].toFixed(1) }, 'aria-valuetext');
    hue.value = hsv[0];
    $('#colorHueValue').textContent = `${Math.round(hsv[0])}°`;
    renderOpacity();
    $('#colorPreviewHex').textContent = colors.hex;
    inputs.forEach((input) => {
      if (input !== source) input.value = colors[input.dataset.colorFormat];
      input.removeAttribute('aria-invalid');
    });
    localize(hint, '编辑任意颜色值，即时转换与预览');
  }

  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      const next = parseColor(input.dataset.colorFormat, input.value);
      if (!next) {
        input.setAttribute('aria-invalid', 'true');
        localize(hint, colorInputHints[input.dataset.colorFormat]);
        return;
      }
      hsv = next;
      render(input);
    });
    input.addEventListener('blur', () => {
      if (input.getAttribute('aria-invalid') !== 'true') {
        input.value = formatColor(hsv)[input.dataset.colorFormat];
      }
    });
  });

  function selectPoint(event) {
    const rect = plane.getBoundingClientRect();
    hsv[1] = clamp((event.clientX - rect.left) / rect.width * 100, 0, 100);
    hsv[2] = clamp(100 - (event.clientY - rect.top) / rect.height * 100, 0, 100);
    render();
  }
  plane.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    plane.setPointerCapture(event.pointerId);
    plane.focus();
    selectPoint(event);
  });
  plane.addEventListener('pointermove', (event) => {
    if (plane.hasPointerCapture(event.pointerId)) selectPoint(event);
  });
  plane.addEventListener('pointerup', (event) => {
    if (plane.hasPointerCapture(event.pointerId)) plane.releasePointerCapture(event.pointerId);
  });
  plane.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 10 : 1;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') hsv[1] = clamp(hsv[1] - step, 0, 100);
    if (event.key === 'ArrowRight') hsv[1] = clamp(hsv[1] + step, 0, 100);
    if (event.key === 'ArrowUp') hsv[2] = clamp(hsv[2] + step, 0, 100);
    if (event.key === 'ArrowDown') hsv[2] = clamp(hsv[2] - step, 0, 100);
    render();
  });
  hue.addEventListener('input', () => {
    hsv[0] = Number(hue.value);
    render();
  });

  opacitySlider.addEventListener('input', () => {
    opacity = Number(opacitySlider.value);
    renderOpacity();
  });
  opacityValue.addEventListener('input', () => {
    if (opacityValue.value === '' || !opacityValue.validity.valid) {
      opacityValue.setAttribute('aria-invalid', 'true');
      return;
    }
    opacity = opacityValue.valueAsNumber;
    renderOpacity(opacityValue);
  });
  opacityValue.addEventListener('blur', () => renderOpacity());

  panel.querySelectorAll('[data-copy-color]').forEach((button) => {
    button.addEventListener('click', async () => {
      const format = button.dataset.copyColor;
      try {
        await navigator.clipboard.writeText(formatColor(hsv)[format]);
        localize(status, '颜色值已复制');
      } catch {
        localize(status, '无法自动复制，请选中颜色值手动复制');
        const input = inputs.find((input) => input.dataset.colorFormat === format);
        input.value = formatColor(hsv)[format];
        input.removeAttribute('aria-invalid');
        input.focus();
        input.select();
      }
    });
  });

  const canPick = window.isSecureContext && typeof window.EyeDropper === 'function';
  pickBtn.disabled = !canPick;
  if (!window.isSecureContext) {
    localize($('#screenPickHint'), '当前地址不支持屏幕取色，请通过 HTTPS 或 localhost 打开');
  } else if (!canPick) {
    localize($('#screenPickHint'), '此浏览器未提供屏幕取色，请使用支持此功能的桌面 Chrome / Edge');
  }
  pickBtn.addEventListener('click', async () => {
    pickBtn.disabled = true;
    localize(status, '请点击屏幕上的颜色，按 Esc 取消');
    let result;
    try {
      result = await new window.EyeDropper().open();
    } catch (error) {
      if (error.name === 'AbortError') {
        localize(status, '已取消取色');
      } else {
        const reason = {
          NotAllowedError: '浏览器未允许启动取色器，请保持页面在前台并重新点击',
          InvalidStateError: '已有取色器打开，请按 Esc 关闭后重试',
          OperationError: '浏览器或系统未能打开原生取色器',
        }[error.name] || '原生取色失败';
        localize(status, reason + ' ({name}: {message})', { name: error.name, message: error.message });
      }
      return;
    } finally {
      pickBtn.disabled = false;
    }
    const next = parseScreenColor(result?.sRGBHex);
    if (!next) {
      localize(status, '已完成取色，但无法识别返回颜色：{color}；已保留原颜色，请重新取色', { color: String(result?.sRGBHex) });
      return;
    }
    hsv = next;
    render();
    localize(status, '已拾取 {hex}', { hex: formatColor(hsv).hex });
  });

  render();
}
