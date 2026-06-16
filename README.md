# Pri Jain — Portfolio Site

A personal design portfolio (landing page, About, Personal Art, case studies, and a Resume page). This folder is the **complete, deploy-ready site** — every page, asset, image, and video is included.

---

## ⚡️ TL;DR for Claude Code

This is a **static site** — no build step, no dependencies to install. Just deploy the files as-is.

**Deploy to Vercel (fastest):**
```bash
cd portfolio-site
npm i -g vercel       # if not already installed
vercel                # follow prompts → preview URL
vercel --prod         # publish to production URL
```
When Vercel asks for settings: **Framework = Other**, **Build Command = (none)**, **Output Directory = ./** (root). There is nothing to build.

**Or deploy via GitHub + Vercel:**
```bash
cd portfolio-site
git init && git add -A && git commit -m "Portfolio site"
# create a repo on GitHub, then:
git remote add origin <your-repo-url>
git push -u origin main
```
Then import the repo at vercel.com → it auto-deploys on every push.

---

## How the site works (important for hosting)

- **Pure static files.** HTML + CSS + vanilla JS + React via CDN (loaded with `<script>` tags from unpkg). No bundler, no `npm install`, no server code.
- **Content & images live in data files.** Each page loads its text content from `cs-state-*.state.json` and its images from `.imgslots-*.state.json` (images are stored inline as data URLs). These are fetched at page load, so **the whole folder must be served together** — opening a single `.html` via `file://` won't work, but any static host (Vercel, Netlify, GitHub Pages, or `npx serve`) works perfectly.
- **Relative links only.** Pages link to each other with relative paths (`about.html`, `images/…`), so the site works at a root domain *or* a sub-path.
- **Read-only when hosted.** The pages include an in-browser editor that only activates inside the original design tool. On a normal host it automatically locks to a clean, read-only view for visitors — there's nothing to configure.

## Local preview

```bash
cd portfolio-site
npx serve .          # then open the printed http://localhost:… URL
```
(Any static server works — `python3 -m http.server`, etc. Don't open the HTML files directly from disk; the data files need to be served over http.)

## Host-specific notes

- **Vercel / Netlify:** Work out of the box. `vercel.json` is included (it just preserves `.html` URLs). The `.nojekyll` file is harmless here.
- **GitHub Pages:** The included **`.nojekyll`** file is required — without it, GitHub Pages' Jekyll step strips the dot-prefixed data files (`.imgslots-*.state.json`) and images break. Keep it.
- **Make sure hidden/dot-files are included** when uploading (`.nojekyll`, `.imgslots-*.state.json`). Git and the Vercel CLI include them automatically; GitHub's drag-and-drop web uploader sometimes hides them — prefer git / GitHub Desktop / Vercel CLI.

## Pages

| File | Page |
|---|---|
| `index.html` | Landing / home |
| `about.html` | About |
| `personal-art.html` | Personal Art index |
| `resume.html` | Resume (embeds `resume-page.jpg`, links `Pri-Jain-Resume.pdf`) |
| `Tempo.html` | Case study — Tempo |
| `atlasone.html` | Case study — AtlasOne |
| `halloween-academy.html` | Case study — Halloween Academy |
| `playground.html` | Personal art — Playground |
| `emoti.html`, `emotipets.html` | Personal art — Emoti Pets |

## Updating content / the resume

- **Text & images:** edit in the original design tool and re-export this folder (they're saved in the `.state.json` files).
- **Resume:** replace `Pri-Jain-Resume.pdf` with your latest export (keep the filename). The on-page image is `resume-page.jpg` — re-render it from the new PDF if the visible resume changes.

## What's NOT included

Scratch / exploration files that aren't part of the live site were intentionally left out (old layout experiments, backup pages, debug screenshots). Everything the live site references — all pages, code, images, and videos — is here.
