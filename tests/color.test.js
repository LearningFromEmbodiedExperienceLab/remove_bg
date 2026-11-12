import test from 'node:test';
import assert from 'node:assert/strict';
import { hsvToRgb, rgbToHsv, parseColor, parseScreenColor, formatColor } from '../src/core/color.js';

test('HSV primary colors, hue boundary, black and white', () => {
  for (const [hsv, rgb] of [
    [[0, 100, 100], [255, 0, 0]],
    [[120, 100, 100], [0, 255, 0]],
    [[240, 100, 100], [0, 0, 255]],
    [[360, 100, 100], [255, 0, 0]],
    [[217, 0, 100], [255, 255, 255]],
    [[217, 100, 0], [0, 0, 0]],
  ]) assert.deepEqual(hsvToRgb(...hsv), rgb);
});

test('RGB to HSV round trips across the color space', () => {
  for (let r = 0; r <= 255; r += 17) {
    for (let g = 0; g <= 255; g += 17) {
      for (let b = 0; b <= 255; b += 17) {
        assert.deepEqual(hsvToRgb(...rgbToHsv(r, g, b)).map(Math.round), [r, g, b]);
      }
    }
  }
});

test('all supported inputs produce the same color', () => {
  for (const [format, input] of [
    ['hex', '#F80'], ['hex', 'ff8800'], ['rgb', '255, 136, 0'],
    ['rgb', 'rgb(255, 136, 0)'], ['rgb', '255 136 0'],
    ['rgb01', '1, 0.5333333, 0'], ['hsv', '32°, 100%, 100%'],
    ['hsv', 'hsv(32, 100, 100)'],
  ]) assert.equal(formatColor(parseColor(format, input)).hex, '#FF8800', `${format}: ${input}`);
});

test('rejects malformed values and values outside each format range', () => {
  const invalid = {
    hex: ['', '#12', '#1234', '#12345678', '#GGGGGG'],
    rgb: ['256, 0, 0', '-1, 0, 0', '1.5, 0, 0', '1, 2', '1, 2, 3, 4', '1,,2', 'NaN, 0, 0', '1%, 2%, 3%'],
    rgb01: ['1.01, 0, 0', '-0.1, 0, 0', 'Infinity, 0, 0', '0, 0,'],
    hsv: ['361, 0, 0', '0, 101, 0', '0, 0, 101', '20%, 30%, 40%', '20°, 30°, 40%'],
  };
  for (const [format, inputs] of Object.entries(invalid)) {
    for (const input of inputs) assert.equal(parseColor(format, input), null, `${format}: ${input}`);
  }
});

test('formatted values can be parsed with at most one byte of rounding loss', () => {
  const hsv = parseColor('hex', '#3B82F6');
  for (const [format, value] of Object.entries(formatColor(hsv))) {
    const actual = hsvToRgb(...parseColor(format, value));
    const expected = [59, 130, 246];
    actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < 1, `${format}: ${value}`));
  }
});

test('screen color normalization accepts browser serialization and rejects malformed results', () => {
  for (const value of ['#f80', '#ff8800', '#ff880000', 'rgb(255, 136, 0)', 'rgba(255, 136, 0, 0)', 'rgba(255, 136, 0, 0.5)']) {
    assert.equal(formatColor(parseScreenColor(value)).hex, '#FF8800');
  }
  for (const value of [null, undefined, {}, '', 'unknown', '#ff8800zz', 'rgba(256, 0, 0, 1)', 'rgba(255, 0, 0, 2)', 'rgba(255, 0, 0,)', 'rgb(255, 0, 0, 1)']) {
    assert.equal(parseScreenColor(value), null);
  }
});
