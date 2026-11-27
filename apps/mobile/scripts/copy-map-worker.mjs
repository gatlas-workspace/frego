// Chép worker của MapLibre GL (bản ESM, file riêng) vào public/ để bản web phục vụ được.
// Metro không phục vụ `new URL('./maplibre-gl-worker.mjs', import.meta.url)` của thư viện, nên bản đồ web gọi
// setWorkerUrl('/vendor/maplibre-gl-worker.mjs'). Chạy tự động trước `web`, `start`, `export:web`.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve('maplibre-gl/package.json'));
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'vendor');
mkdirSync(outDir, { recursive: true });
copyFileSync(join(pkgDir, 'dist', 'maplibre-gl-worker.mjs'), join(outDir, 'maplibre-gl-worker.mjs'));
