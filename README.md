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
├── index.html         Home — hero + telemetry, capabilities, trajectory, vision teaser, research, CTA
├── research.html      Focus areas, working papers (RP-001…003), methodology
├── technology.html    Shrevia OS, terminal strip, six-primitive stack
├── vision.html        Manifesto, Thesis Doc 001, three invariants, roadmap
├── team.html          Six members + hiring band
├── investors.html     Thesis, traction snapshot, investment inquiry form
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

Pure static — drop the folder on Netlify / Vercel / Cloudflare Pages / GitHub Pages as-is.
No build step.

## Notes for production

- **Investor form** ([investors.html](investors.html)) is front-end only. Wire the submit
  handler in [js/main.js](js/main.js) (`investor-form`) to your endpoint
  (Formspree, a serverless function, etc.). It currently validates and shows the
  success state without sending data.
- **3D fallback** — if WebGL or the CDN is unavailable, scenes swap to static SVG
  equivalents automatically; `prefers-reduced-motion` renders a static pose.
- Fonts are loaded from Google Fonts (Fraunces, Instrument Sans, IBM Plex Mono);
  self-host them if you need to drop the third-party request.
- All copy was carried over from the current live site and lightly edited for the
  new layout; the team, papers, telemetry values, and contact email are unchanged.
