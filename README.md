# praisetc.com

Static portfolio and company site of PRAISE THE CODE, published by GitHub Pages from the root of `main` at https://praisetc.com/ (custom domain in `CNAME`).

## Pages

- `index.html`: studio overview. Sections switch the visual world on scroll (`data-world-section`).
- `projects/dawnbringer/index.html`: v0.9 lighting lab (synced OFF and HIGH videos), stack, architecture, Dark Fantasy 32 palette and the animation speed lab.
- `projects/openstrut/index.html`: live app behind a click-to-launch facade, the Canvas 2D sandbox with IFC4 text, design codes, byte budget and the engineering notice.
- `projects/engineering/index.html`: tooling, the four engineering rules, the build budget and a WCAG contrast inspector.

## How it is built

- Hand-written HTML, one stylesheet (`assets/site.css`) and one deferred script (`assets/site.js`). No framework, bundler or webfont.
- Three visual worlds set by `<html data-world="studio|dawnbringer|openstrut">`. A world change swaps colours only, so it cannot shift layout.
- No third-party request on load. The OpenStrut iframe is created only after a click.
- Every image and video declares its width and height. Videos use `preload="metadata"` and play only while on screen.
- Motion uses `transform` and `opacity` and stops under `prefers-reduced-motion`.
- `assets/diagrams/*-arch-*.svg` are the architecture diagrams; `assets/showcase/` holds the concept art, logo, v0.9 videos with posters and the attack strip.
