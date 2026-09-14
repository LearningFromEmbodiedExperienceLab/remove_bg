# Remove BG

A browser-based tool to remove solid image backgrounds. Pick a color from your photo, preview the result, and download a transparent PNG at full resolution. All processing runs locally in the browser.

**Live demo:** https://learningfromembodiedexperiencelab.github.io/remove_bg/

## Usage

1. Upload an image (drag & drop or click).
2. Click the background color you want to remove.
3. Adjust **Tolerance** (how similar colors are matched) and **Feather** (edge softness).
4. Click **Preview**, then **Download PNG**.

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Deploy

Pushes to `main` deploy automatically to GitHub Pages via Actions. Enable Pages with **GitHub Actions** as the source in repository settings.
