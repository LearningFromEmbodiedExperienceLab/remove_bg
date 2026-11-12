import { rgbToHex } from './utils.js';

export function hsvToRgb(h, s, v) {
  s /= 100;
  v /= 100;
  const channel = (n) => {
    const k = (n + h / 60) % 6;
    return 255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)));
  };
  return [channel(5), channel(3), channel(1)];
}

export function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return [h, max ? delta / max * 100 : 0, max / 255 * 100];
}

export const colorInputHints = {
  hex: 'HEX：输入 3 或 6 位十六进制，例如 #3B82F6',
  rgb: 'RGB：三个 0–255 的整数，例如 59, 130, 246',
  rgb01: 'RGB 0–1：三个 0–1 的数值，例如 0.23, 0.51, 0.96',
  hsv: 'HSV：色相 0–360，饱和度与明度 0–100%，例如 217°, 76%, 96%',
};

export function parseColor(format, value) {
  if (format === 'hex') {
    let hex = value.trim().replace(/^#/, '');
    if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return null;
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
    return rgbToHsv(...hex.match(/../g).map((c) => parseInt(c, 16)));
  }
  const text = value.trim().replace(/^(?:rgb|hsv)\((.*)\)$/i, '$1').trim();
  const parts = text.includes(',') ? text.split(/\s*,\s*/) : text.split(/\s+/);
  if (parts.length !== 3) return null;
  const pattern = format === 'hsv' ? /^\d+(?:\.\d+)?[°%]?$/ : /^(?:\d+(?:\.\d+)?|\.\d+)$/;
  if (!parts.every((part) => pattern.test(part))) return null;
  if (format === 'hsv' && (parts[0].endsWith('%') || parts.slice(1).some((part) => part.endsWith('°')))) return null;
  const values = parts.map((part) => Number(part.replace(/[°%]/g, '')));
  const limits = format === 'hsv' ? [360, 100, 100] : Array(3).fill(format === 'rgb' ? 255 : 1);
  if (values.some((v, i) => !Number.isFinite(v) || v < 0 || v > limits[i])) return null;
  if (format === 'rgb' && !values.every(Number.isInteger)) return null;
  if (format === 'hsv') return values;
  return rgbToHsv(...values.map((v) => format === 'rgb01' ? v * 255 : v));
}

export function formatColor(hsv) {
  const rgb = hsvToRgb(...hsv);
  const rounded = rgb.map(Math.round);
  const decimal = (v, places) => Number(v.toFixed(places));
  return {
    hex: rgbToHex(...rounded),
    rgb: rounded.join(', '),
    rgb01: rgb.map((v) => decimal(v / 255, 4)).join(', '),
    hsv: `${decimal(hsv[0], 1)}°, ${decimal(hsv[1], 1)}%, ${decimal(hsv[2], 1)}%`,
  };
}

// Some Chromium screen captures serialize sRGBHex as rgba(). Screen pixels
// provide color, not the source's opacity; keep preview opacity independent.
export function parseScreenColor(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const hex = parseColor('hex', text.replace(/^#([\da-f]{6})[\da-f]{2}$/i, '#$1'));
  if (hex) return hex;
  const match = text.match(/^(rgb|rgba)\((.*)\)$/i);
  if (!match) return null;
  const parts = match[2].split(',').map((part) => part.trim());
  if (parts.length !== (match[1].toLowerCase() === 'rgba' ? 4 : 3)) return null;
  if (parts.length === 4) {
    const alpha = parts.pop();
    if (!/^(?:0(?:\.\d+)?|1(?:\.0+)?|\.\d+)$/.test(alpha)) return null;
  }
  return parseColor('rgb', parts.join(', '));
}
