const english = {
  "原生取色失败 ({name}: {message})": "Native color picking failed ({name}: {message})",
  "浏览器或系统未能打开原生取色器 ({name}: {message})": "The browser or system could not open the native picker ({name}: {message})",
  "已有取色器打开，请按 Esc 关闭后重试 ({name}: {message})": "A picker is already open; press Esc to close it and try again ({name}: {message})",
  "浏览器未允许启动取色器，请保持页面在前台并重新点击 ({name}: {message})": "The browser blocked the picker; keep this page in the foreground and try again ({name}: {message})",
  "图片编辑工具": "Image editor",
  "去底色、裁剪、擦除与取色，全部在本地处理": "Remove backgrounds, crop, erase, and pick colors locally",
  "工作区": "Workspace",
  "图片编辑": "Image editor",
  "颜色工具": "Color tools",
  "屏幕取色": "Pick screen color",
  "点击后可选取屏幕任意位置，Esc 取消": "Pick a color anywhere on your screen; press Esc to cancel",
  "饱和度与明度，左右调整饱和度，上下调整明度": "Saturation and value: use left/right for saturation and up/down for value",
  "色相": "Hue",
  "不透明度": "Opacity",
  "不透明度百分比": "Opacity percentage",
  "0–100，0 为完全透明": "0–100; 0 is fully transparent",
  "当前颜色预览": "Current color preview",
  "颜色预览": "Preview",
  "复制 HEX": "Copy HEX",
  "复制 RGB 0–255": "Copy RGB 0–255",
  "复制 RGB 0–1": "Copy RGB 0–1",
  "复制 HSV": "Copy HSV",
  "编辑任意颜色值，即时转换与预览": "Edit any color value to convert and preview instantly",
  "图片": "Image",
  "上传图片": "Upload image",
  "拖放或点击上传": "Drop an image or click to upload",
  "支持 JPG、PNG、WebP": "Supports JPG, PNG, and WebP",
  "恢复原图": "Restore original",
  "工具": "Tools",
  "去底色": "Remove BG",
  "裁剪": "Crop",
  "橡皮擦": "Eraser",
  "底色去除后才能使用橡皮擦": "Remove the background to enable the eraser",
  "底色": "Background color",
  "当前拾取的颜色": "Selected color",
  "拾取底色": "Pick background color",
  "点击按钮后在图片上选色": "Click the button, then pick a color in the image",
  "范围": "Scope",
  "连通区域": "Connected",
  "全局": "Global",
  "仅去除与点击位置相连的区域，避免误删主体内部同色": "Remove only the area connected to your selection to preserve matching colors inside the subject",
  "去除全图所有相近颜色，适合纯色背景": "Remove matching colors throughout the image; ideal for solid backgrounds",
  "容差": "Tolerance",
  "颜色容差": "Color tolerance",
  "数值越大，去除的相近色越多": "Higher values remove more similar colors",
  "边缘柔化": "Feather",
  "让抠图边缘更自然": "Soften edges for a natural result",
  "比例": "Aspect ratio",
  "裁剪比例": "Crop aspect ratio",
  "自由": "Free",
  "形状": "Shape",
  "裁剪形状": "Crop shape",
  "矩形": "Rectangle",
  "圆角": "Rounded",
  "圆形": "Circle",
  "自动对称（裁剪框居中，两侧等比缩放）": "Keep centered (resize both sides symmetrically)",
  "圆角半径": "Corner radius",
  "笔刷大小": "Brush size",
  "去底色后使用，擦除残留背景或修复误删区域": "Use after background removal to erase leftovers or restore removed areas",
  "缩放": "Zoom",
  "画布缩放": "Canvas zoom",
  "放大后按住滚轮拖动平移画布": "When zoomed in, hold the middle mouse button and drag to pan",
  "历史": "History",
  "撤销": "Undo",
  "反撤销": "Redo",
  "上传图片后开始编辑": "Upload an image to start editing",
  "应用": "Apply",
  "重置": "Reset",
  "下载 PNG": "Download PNG",
  "切换为浅色模式": "Switch to light mode",
  "切换为深色模式": "Switch to dark mode",
  "取消拾取": "Cancel picking",
  "在背景上点击要去除的颜色": "Click the background color you want to remove",
  "实时预览去底效果，透明区域以棋盘格显示": "Live preview: transparent areas appear as a checkerboard",
  "点击「拾取底色」后在图片上选色": "Click “Pick background color”, then select a color in the image",
  "已拾取，调整参数后应用": "Color selected; adjust the settings and apply",
  "拖动裁剪框或调整边角": "Drag the crop box or resize its edges and corners",
  "按住滚轮拖动画布；Ctrl+Z 撤销，Ctrl+Shift+Z 反撤销": "Hold the middle mouse button to pan; Ctrl+Z to undo, Ctrl+Shift+Z to redo",
  "当前：{width} × {height}{edited}": "Current: {width} × {height}{edited}",
  " · 已编辑": " · Edited",
  "当前颜色 {hex}，不透明度 {opacity}%": "Current color {hex}, opacity {opacity}%",
  "饱和度 {saturation}%，明度 {value}%": "Saturation {saturation}%, value {value}%",
  "颜色值已复制": "Color value copied",
  "无法自动复制，请选中颜色值手动复制": "Unable to copy automatically; select the value and copy it manually",
  "当前地址不支持屏幕取色，请通过 HTTPS 或 localhost 打开": "Screen picking requires HTTPS or localhost",
  "此浏览器未提供屏幕取色，请使用支持此功能的桌面 Chrome / Edge": "Screen picking is unavailable; use a supported desktop Chrome / Edge browser",
  "请点击屏幕上的颜色，按 Esc 取消": "Click a color on the screen; press Esc to cancel",
  "已取消取色": "Color picking cancelled",
  "已完成取色，但无法识别返回颜色：{color}；已保留原颜色，请重新取色": "Could not recognize the returned color: {color}. The original color is preserved; try again",
  "已拾取 {hex}": "Picked {hex}",
  "HEX：输入 3 或 6 位十六进制，例如 #3B82F6": "HEX: enter 3 or 6 hexadecimal digits, e.g. #3B82F6",
  "RGB：三个 0–255 的整数，例如 59, 130, 246": "RGB: three integers from 0–255, e.g. 59, 130, 246",
  "RGB 0–1：三个 0–1 的数值，例如 0.23, 0.51, 0.96": "RGB 0–1: three values from 0–1, e.g. 0.23, 0.51, 0.96",
  "HSV：色相 0–360，饱和度与明度 0–100%，例如 217°, 76%, 96%": "HSV: hue 0–360, saturation and value 0–100%, e.g. 217°, 76%, 96%"
};

let language = 'zh-CN';
const bindings = new Map();

export function t(message, values = {}) {
  const text = language === 'en' ? (english[message] ?? message) : message;
  return text.replace(/\{(\w+)\}/g, (_, key) => values[key]);
}

export function localize(element, message, values = {}, attribute = 'textContent') {
  if (!bindings.has(element)) bindings.set(element, new Map());
  bindings.get(element).set(attribute, { message, values });
  const text = t(message, values);
  if (attribute === 'textContent') element.textContent = text;
  else element.setAttribute(attribute, text);
}

export function initI18n() {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    localize(element, element.textContent.trim());
  });
  for (const attribute of ['aria-label', 'title']) {
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach((element) => {
      localize(element, element.getAttribute(attribute), {}, attribute);
    });
  }
  const button = document.querySelector('#languageToggle');
  function setLanguage(next) {
    language = next;
    document.documentElement.lang = next;
    bindings.forEach((attributes, element) => {
      attributes.forEach(({ message, values }, attribute) => localize(element, message, values, attribute));
    });
    button.textContent = next === 'en' ? '中文' : 'English';
    button.setAttribute('aria-label', next === 'en' ? '切换为中文' : 'Switch to English');
    button.lang = next === 'en' ? 'zh-CN' : 'en';
    document.dispatchEvent(new Event('languagechange'));
  }
  let saved;
  try { saved = localStorage.getItem('ui-language'); } catch {}
  setLanguage(saved === 'en' ? 'en' : 'zh-CN');
  button.addEventListener('click', () => {
    setLanguage(language === 'en' ? 'zh-CN' : 'en');
    try { localStorage.setItem('ui-language', language); } catch {}
  });
}
