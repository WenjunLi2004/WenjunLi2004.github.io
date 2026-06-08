# Wenjun Li Personal Website

A hand-built static personal website for Wenjun Li.

This repository no longer uses Jekyll or al-folio. The site is intentionally small:

- `index.html` contains the page structure and content.
- `assets/site/styles.css` contains the visual system, responsive layout, and animation styles.
- `assets/site/main.js` contains theme switching, scroll state, reveal animations, and micro-interactions.
- `.github/workflows/deploy.yml` publishes the static files to GitHub Pages.
- `CNAME` keeps the custom domain set to `wenjun.li`.
- `cloudflare/` contains a Worker-based routing setup for subdomain redirects such as `cv.wenjun.li`.

## Deployment

GitHub Pages should use **GitHub Actions** as the source. The old `gh-pages` branch is not used; deployments are produced from `main` by `.github/workflows/deploy.yml`.

## Local Preview

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
