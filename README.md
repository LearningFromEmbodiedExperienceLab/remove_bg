# Remove BG

English | [中文](README.zh-CN.md)

A browser-based image editor for removing solid backgrounds, cropping, erasing, and working with colors. Download the result as a full-resolution transparent PNG. All image processing runs locally in your browser.

**Live demo:** https://learningfromembodiedexperiencelab.github.io/remove_bg/

## Language and appearance

The web interface defaults to Chinese on your first visit. Use **English / 中文** in the header to switch languages; your choice is saved in the browser. The adjacent theme button switches between light and dark mode.

The interface uses the TrackNest UI design system in `ui/assets/`: warm neutral colors, thin borders, consistent controls, and responsive layouts.

## Image editing

1. Upload an image by dropping it onto the upload area or clicking it.
2. Under **Remove BG**, click **Pick background color**, then select the background in the image.
3. Choose **Connected** to remove only the connected background area, or **Global** to remove similar colors throughout the image. Adjust **Tolerance** and **Feather** while viewing the live preview.
4. Click **Apply** to enable the **Eraser**. Use it to clean up remaining background, zoom in for detail, and use **Undo / Redo** as needed. Hold the middle mouse button and drag to pan when zoomed in.
5. Use **Crop** to choose an aspect ratio and a rectangular, rounded, or circular shape. Drag the crop box or its edges, then click **Apply**.
6. Click **Download PNG** to save the result. **Reset** resets the current tool; **Restore original** restores the uploaded image.

## Color tools

The **Color tools** tab works without uploading an image. Use the saturation/value palette and hue slider, or enter HEX, RGB (0–255), normalized RGB (0–1), or HSV (degrees / percent / percent) to preview and convert colors. Each value has a copy button.

Adjust **Opacity** with the slider or percentage input (0–100%) to preview transparency over a checkerboard. Color values and their copy buttons keep the underlying color without alpha.

**Pick screen color** uses the browser's EyeDropper API and requires a supporting desktop browser (Chrome / Edge) over HTTPS or localhost. Press Esc to cancel. The browser supplies the picker and its magnifier; the page cannot adjust the magnifier position or screen-coordinate mapping.

## Development

```bash
npm install
npm run dev
```

Build and preview for production:

```bash
npm run build
npm run preview
```

## Deploy

Pushes to `main` deploy automatically to GitHub Pages via Actions. Enable Pages with **GitHub Actions** as the source in repository settings.
