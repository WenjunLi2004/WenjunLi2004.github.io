# Wenjun Li Personal Website

A hand-built static personal website for Wenjun Li.

This repository no longer uses Jekyll or al-folio. The site is intentionally small:

- `index.html` contains the page structure and content.
- `assets/site/styles.css` contains the visual system, responsive layout, and animation styles.
- `assets/site/main.js` contains theme switching, scroll state, reveal animations, and micro-interactions.
- `.github/workflows/deploy.yml` publishes the static files to GitHub Pages.

## Local Preview

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
