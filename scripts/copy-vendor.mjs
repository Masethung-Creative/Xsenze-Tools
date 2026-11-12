// Copies runtime files that are loaded outside the bundler into public/.
// Runs on `npm install` (postinstall); the copies are git-ignored.
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const files = [
  // MediaInfo (BSD-2-Clause): media metadata for the atlas tools
  [
    'node_modules/mediainfo.js/dist/esm-bundle/index.min.js',
    'public/mediainfo/mediainfo.min.js',
  ],
  [
    'node_modules/mediainfo.js/dist/MediaInfoModule.wasm',
    'public/mediainfo/MediaInfoModule.wasm',
  ],
  [
    'node_modules/mediainfo.js/LICENSE.txt',
    'public/mediainfo/LICENSE.mediainfo.txt',
  ],
];

for (const [from, to] of files) {
  mkdirSync(join(to, '..'), { recursive: true });
  copyFileSync(from, to);
}
console.log(`copied ${files.length} vendor files into public/`);
