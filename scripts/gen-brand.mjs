// Generates the brand assets in public/ from the source logo PNG.
//   npm run gen-brand
//
// The source is a two-tone logo (white + black on transparent): a white
// rounded square with a black X, and white "Tools" script with a black
// outline. It is split into regions, traced into crisp SVG paths and
// recoloured to the Xsenze palette in two versions:
//
//   logo.svg        dark theme   square + letters orange, X + outlines dark
//   logo-light.svg  light theme  square + letters black, X + letter outline orange
//
// favicon.svg and the PNG icons use the dark-theme version.

import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import potrace from 'potrace';
import { Resvg } from '@resvg/resvg-js';

const SOURCE = 'assets/brand/xsenze-tools-logo.png';
const ORANGE = '#ff3800'; // --accent
const DARK = '#1c1917'; // portfolio card colour, dark-theme logo body
const BLACK = '#0c0a09'; // portfolio near-black, light-theme logo body
const PAGE_DARK = '#0c0a09'; // --surface-0, behind the apple touch icon
// the square's own outer edge is about 10px; anything this close to the
// transparent background is edge, not part of the X
const EDGE_PX = 16;

const src = PNG.sync.read(readFileSync(SOURCE));
const { width: W, height: H, data } = src;
const N = W * H;

// ---------- classify pixels ----------
// 0 transparent, 1 dark, 2 white
const cls = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  if (data[i * 4 + 3] <= 128) continue;
  const l = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  cls[i] = l > 128 ? 2 : 1;
}

function neighbours(i) {
  const x = i % W;
  const out = [];
  if (x > 0) out.push(i - 1);
  if (x < W - 1) out.push(i + 1);
  if (i >= W) out.push(i - W);
  if (i < N - W) out.push(i + W);
  return out;
}

// white connected components; the square body is the largest component plus
// the white arc under the X (both start above the letters' top line)
const whiteId = new Int32Array(N).fill(-1);
const whiteComps = [];
for (let s = 0; s < N; s++) {
  if (cls[s] !== 2 || whiteId[s] >= 0) continue;
  const id = whiteComps.length;
  let n = 0;
  let minY = H;
  const stack = [s];
  whiteId[s] = id;
  while (stack.length) {
    const i = stack.pop();
    n++;
    minY = Math.min(minY, (i / W) | 0);
    for (const j of neighbours(i)) {
      if (cls[j] === 2 && whiteId[j] < 0) {
        whiteId[j] = id;
        stack.push(j);
      }
    }
  }
  whiteComps.push({ id, n, minY });
}
const body = whiteComps.reduce((a, b) => (b.n > a.n ? b : a));
// letters are the big white shapes that are not the square body; the arc
// under the X sits fully inside the square and is narrower than any letter
// group, so tell them apart by their region of overlap with the body's box
const isBody = new Uint8Array(whiteComps.length);
isBody[body.id] = 1;
{
  // a white component belongs to the body if it touches the body's dark
  // X region more than the letters: approximate by "top edge inside the
  // square and does not extend below the square"
  const bodyBottom = (() => {
    let y = 0;
    for (let i = 0; i < N; i++) if (whiteId[i] === body.id) y = (i / W) | 0;
    return y;
  })();
  const maxY = new Int32Array(whiteComps.length);
  for (let i = 0; i < N; i++) {
    const id = whiteId[i];
    if (id >= 0) maxY[id] = Math.max(maxY[id], (i / W) | 0);
  }
  for (const c of whiteComps) {
    if (c.id !== body.id && c.n > 50 && maxY[c.id] <= bodyBottom + 20) {
      isBody[c.id] = 1;
    }
  }
}

// multi-source BFS: every solid pixel learns which white shape is nearest
// (body or letters) and its distance to the transparent background
const nearest = new Int8Array(N).fill(-1); // 0 body, 1 letters
let queue = [];
for (let i = 0; i < N; i++) {
  if (cls[i] === 2 && whiteComps[whiteId[i]].n > 50) {
    nearest[i] = isBody[whiteId[i]] ? 0 : 1;
    queue.push(i);
  }
}
while (queue.length) {
  const next = [];
  for (const i of queue) {
    for (const j of neighbours(i)) {
      if (cls[j] !== 0 && nearest[j] < 0) {
        nearest[j] = nearest[i];
        next.push(j);
      }
    }
  }
  queue = next;
}

const edgeDist = new Int32Array(N).fill(-1);
queue = [];
for (let i = 0; i < N; i++) {
  if (cls[i] === 0) {
    edgeDist[i] = 0;
    queue.push(i);
  }
}
while (queue.length) {
  const next = [];
  for (const i of queue) {
    for (const j of neighbours(i)) {
      if (edgeDist[j] < 0) {
        edgeDist[j] = edgeDist[i] + 1;
        next.push(j);
      }
    }
  }
  queue = next;
}

// ---------- region masks ----------
const solid = (i) => cls[i] !== 0;
const white = (i) => cls[i] === 2;
const theX = (i) => cls[i] === 1 && nearest[i] === 0 && edgeDist[i] > EDGE_PX;
const letterOutline = (i) => cls[i] === 1 && nearest[i] === 1;
// traced as one shape so there is no hairline seam where the X meets the outline
const lightAccent = (i) => theX(i) || letterOutline(i);

// mask: pixels matching `test` become black (traced), everything else white
function mask(test) {
  const out = new PNG({ width: W, height: H });
  for (let i = 0; i < N; i++) {
    const v = test(i) ? 0 : 255;
    out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  return PNG.sync.write(out);
}

function trace(buffer) {
  return new Promise((resolve, reject) => {
    const tracer = new potrace.Potrace({
      threshold: 128,
      turdSize: 8,
      optTolerance: 0.3,
    });
    tracer.loadImage(buffer, (err) => {
      if (err) return reject(err);
      // getPathTag returns <path d="..." .../>; keep only the d attribute
      const d = /\bd="([^"]+)"/.exec(tracer.getPathTag())?.[1];
      if (!d) return reject(new Error('trace produced no path'));
      resolve(d);
    });
  });
}

// square viewBox around the visible artwork
let minX = W,
  minY = H,
  maxX = 0,
  maxY = 0;
for (let i = 0; i < N; i++) {
  if (!solid(i)) continue;
  const x = i % W;
  const y = (i / W) | 0;
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
  minY = Math.min(minY, y);
  maxY = Math.max(maxY, y);
}
const pad = 12;
const side = Math.max(maxX - minX, maxY - minY) + pad * 2;
const vx = Math.round((minX + maxX) / 2 - side / 2);
const vy = Math.round((minY + maxY) / 2 - side / 2);
const viewBox = `${vx} ${vy} ${side} ${side}`;

const [silhouettePath, whitePath, accentPath] = await Promise.all([
  trace(mask(solid)),
  trace(mask(white)),
  trace(mask(lightAccent)),
]);

const svgOf = (layers) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Xsenze Tools">
${layers.map(([fill, d]) => `<path fill="${fill}" fill-rule="evenodd" d="${d}"/>`).join('\n')}
</svg>
`;

// dark theme: original artwork, white -> orange, black -> dark
const darkSvg = svgOf([
  [DARK, silhouettePath],
  [ORANGE, whitePath],
]);

// light theme: square + letters black, X + letter outline orange
const lightSvg = svgOf([
  [BLACK, silhouettePath],
  [ORANGE, accentPath],
]);

writeFileSync('public/logo.svg', darkSvg);
writeFileSync('public/logo-light.svg', lightSvg);
writeFileSync('public/favicon.svg', darkSvg);

function png(svgText, size, background) {
  return new Resvg(svgText, {
    fitTo: { mode: 'width', value: size },
    background,
  })
    .render()
    .asPng();
}

writeFileSync('public/favicon-32.png', png(darkSvg, 32));
writeFileSync('public/favicon-192.png', png(darkSvg, 192));
writeFileSync('public/favicon-512.png', png(darkSvg, 512));

// iOS home screen: solid background, logo inset so it survives the rounded mask
const inset = side * 0.14;
const touch = darkSvg
  .replace(
    `viewBox="${viewBox}"`,
    `viewBox="${vx - inset} ${vy - inset} ${side + inset * 2} ${side + inset * 2}"`,
  )
  .replace(
    '<path',
    `<rect x="${vx - inset}" y="${vy - inset}" width="${side + inset * 2}" height="${side + inset * 2}" fill="${PAGE_DARK}"/>\n<path`,
  );
writeFileSync('public/apple-touch-icon.png', png(touch, 180));

// preview of the light version, for checking the recolour by eye
writeFileSync('assets/brand/preview-light.png', png(lightSvg, 512, '#fafaf9'));

console.log(
  `logo.svg ${(darkSvg.length / 1024).toFixed(1)} KB, logo-light.svg ${(lightSvg.length / 1024).toFixed(1)} KB, favicons written`,
);
