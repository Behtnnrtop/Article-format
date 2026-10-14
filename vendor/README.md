# Vendored browser dependencies

These files are checked into the static Website so image and sliced-ZIP export do not depend on an external CDN at runtime.

- `html2canvas-1.4.1.min.js`: html2canvas 1.4.1, downloaded from the official npm package distribution. MIT license: https://github.com/niklasvh/html2canvas/blob/v1.4.1/LICENSE
- `jszip-3.10.1.min.js`: JSZip 3.10.1, downloaded from the official npm package distribution. MIT or GPLv3 license: https://github.com/Stuk/jszip/blob/v3.10.1/LICENSE.markdown

Keep the version in each filename, its `index.html` cache-busting query string, and this inventory synchronized when upgrading.
