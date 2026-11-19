# Xsenze UI Kit (bundled copy)

Version 0.10.0, MIT licence. Built files from the kit's `dist/` folder, kept in
the repo so the site loads nothing from a CDN.

- `xsenze.min.css`: tokens, reset, fonts and components, imported in
  `app/app.ts`. The production build runs out of memory on the readable
  `xsenze.css`, so that copy is kept only for reading the class names.
- `xsenze-tools.css`: the optional tools pack (panels, faders, number fields)
- `xsenze.js`, `xsenze-tools.js`: the kit scripts, not loaded yet; the site
  drives its parts from Ember
- `fonts/`: Plus Jakarta Sans, Space Grotesk and JetBrains Mono (SIL OFL)

Docs: https://xsenze-ui.vercel.app/docs/index.html

To update, download the same files from a newer build and change the version
above.
