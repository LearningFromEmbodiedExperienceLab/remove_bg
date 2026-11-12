import test from 'node:test';
import assert from 'node:assert/strict';
import { initColorTool } from '../src/tools/color.js';

// Exercise browser callbacks with controlled API results, without accessing a real screen.
function setup(t, { pickError, pickResults = [{ sRGBHex: '#FF8800' }], native = true, secure = true } = {}) {
  const events = [];
  const elements = new Map();
  function element() {
    return {
      style: { setProperty() {} }, dataset: {}, attributes: {}, listeners: {},
      hidden: true, disabled: false, value: '', textContent: '', returnValue: '',
      addEventListener(name, handler) { this.listeners[name] = handler; },
      setAttribute(name, value) { this.attributes[name] = value; },
      removeAttribute(name) { delete this.attributes[name]; },
      getAttribute(name) { return this.attributes[name]; },
    };
  }
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  const inputs = ['hex', 'rgb', 'rgb01', 'hsv'].map((format) => {
    const input = element();
    input.dataset.colorFormat = format;
    return input;
  });
  get('#colorWorkspace').querySelectorAll = (selector) => selector === '[data-color-format]' ? inputs : [];
  const globals = {
    document: { querySelector: get },
    window: {
      isSecureContext: secure,
      ...(native ? { EyeDropper: class {
        async open() {
          events.push('native');
          if (pickError) throw pickError;
          return pickResults.shift();
        }
      } } : {}),
    },
  };
  for (const [name, value] of Object.entries(globals)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true });
    t.after(() => descriptor ? Object.defineProperty(globalThis, name, descriptor) : delete globalThis[name]);
  }
  initColorTool();
  return { get, events, inputs };
}

test('native result updates color and unlocks the button', async (t) => {
  const { get, inputs, events } = setup(t);
  await get('#screenPickBtn').listeners.click();
  assert.deepEqual(events, ['native']);
  assert.equal(inputs[0].value, '#FF8800');
  assert.equal(get('#screenPickBtn').disabled, false);
});

for (const value of ['rgb(255, 136, 0)', 'rgba(255, 136, 0, 0)', '#ff880000']) {
  test(`native picker accepts browser color serialization: ${value}`, async (t) => {
    const { get, inputs } = setup(t, { pickResults: [{ sRGBHex: value }] });
    await get('#screenPickBtn').listeners.click();
    assert.equal(inputs[0].value, '#FF8800');
    assert.equal(get('#colorToolStatus').textContent, '已拾取 #FF8800');
    assert.equal(get('#screenPickBtn').disabled, false);
  });
}

test('unrecognized native result preserves state and allows another screen pick', async (t) => {
  const { get, inputs } = setup(t, {
    pickResults: [{ sRGBHex: 'unexpected-color' }, { sRGBHex: '#FF8800' }],
  });
  await get('#screenPickBtn').listeners.click();
  assert.equal(inputs[0].value, '#3B82F6');
  assert.match(get('#colorToolStatus').textContent, /无法识别.*unexpected-color/);
  get('#colorHue').value = '120';
  assert.doesNotThrow(() => get('#colorHue').listeners.input());
  await get('#screenPickBtn').listeners.click();
  assert.equal(inputs[0].value, '#FF8800');
  assert.equal(get('#screenPickBtn').disabled, false);
});

test('native picker failure exposes its error and allows retry', async (t) => {
  const { get } = setup(t, { pickError: new DOMException('EyeDropper is not available.', 'OperationError') });
  await get('#screenPickBtn').listeners.click();
  assert.match(get('#colorToolStatus').textContent, /OperationError: EyeDropper is not available/);
  assert.equal(get('#screenPickBtn').disabled, false);
});

test('native cancellation preserves color', async (t) => {
  const { get, inputs } = setup(t, { pickError: new DOMException('Cancelled', 'AbortError') });
  await get('#screenPickBtn').listeners.click();
  assert.equal(inputs[0].value, '#3B82F6');
  assert.equal(get('#colorToolStatus').textContent, '已取消取色');
});

test('unsupported browser explains why screen picking is unavailable', (t) => {
  const { get } = setup(t, { native: false });
  assert.equal(get('#screenPickBtn').disabled, true);
  assert.match(get('#screenPickHint').textContent, /此浏览器未提供屏幕取色/);
});

test('insecure origin disables screen picking without disabling the color preview', (t) => {
  const { get, inputs } = setup(t, { secure: false });
  assert.equal(get('#screenPickBtn').disabled, true);
  assert.match(get('#screenPickHint').textContent, /HTTPS 或 localhost/);
  assert.equal(inputs[0].value, '#3B82F6');
});
