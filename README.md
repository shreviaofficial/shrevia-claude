# Shrevia — Website Redesign

A complete redesign of [shrevia.com](https://www.shrevia.com/) for **Shrevia Intelligence Labs**.

**Design language:** paper-and-ink editorial — warm bone surfaces, deep ink, copper accents,
Fraunces serif display type, mono "instrument" labels, film grain, and hand-sketched underlines.
3D is handled by two generative three.js scenes that read like plotter art:

- **Home** — the *agent substrate*: ~2,200 ink/copper particles on an organically displaced
  sphere with hairline neighbour connections and orbital rings (mouse parallax, slow rotation).
- **Technology** — the *runtime stack*: six wireframe planes with a copper activation sweep.

## Structure

```
shrevia-redesign/
├── index.html         Home — hero, capabilities, trajectory, vision teaser, research, CTA
├── research.html      Focus areas, working papers (RP-001…003), methodology
├── technology.html    Shrevia OS, terminal strip, six-primitive stack
├── vision.html        Manifesto, Thesis Doc 001, three invariants, roadmap
├── team.html          "The Lab" — founder + agent roster, hiring band
├── investors.html     Thesis, traction snapshot, investment inquiry form
├── api/contact.js     Vercel serverless function → Google Apps Script → Sheet
├── css/style.css      Full design system (tokens, components, responsive, reduced-motion)
├── js/main.js         Nav, mobile menu, scroll reveals, counters, tilt, form, 3D watchdog
├── js/scene.js        three.js scenes (ESM via import map → jsDelivr CDN, pinned 0.160.0)
└── assets/favicon.svg
```

## Run locally

Any static server works:

```sh
npx serve .          # or
python -m http.server 8000
```

Then open `http://localhost:8000`. (Opening files directly also works, but a server is
recommended so the ES-module scene loads consistently.)

## Deploy

Static pages + one serverless function. On **Vercel** (framework preset: Other, no build
step) everything works out of the box: the pages are served as-is and `api/contact.js`
becomes `POST /api/contact` automatically.

**Required Vercel environment variable:** `APP_SCRIPT_URL` — the deployed Google Apps
Script web-app URL that appends rows to the Google Sheet
(Project → Settings → Environment Variables). Without it the form shows the retry note.

## Notes for production

- **Investor form** ([investors.html](investors.html)) submits JSON to `/api/contact`;
  the function forwards it URL-encoded to the Apps Script with the field keys
  `Name` / `Email` / `Number` / `Message` (Number ← mobile field, Message ← thesis field).
  The endpoint only exists on Vercel — on a plain local static server the form will
  show the error note by design.
- **3D fallback** — if WebGL or the CDN is unavailable, scenes swap to static SVG
  equivalents automatically; `prefers-reduced-motion` renders a static pose.
- Fonts are loaded from Google Fonts (Fraunces, Instrument Sans, IBM Plex Mono);
  self-host them if you need to drop the third-party request.
- Most copy was carried over from the original live site; the team page was later
  replaced with "The Lab" (founder + agent roster) — the old researcher profiles
  were placeholders and should not be reintroduced.
