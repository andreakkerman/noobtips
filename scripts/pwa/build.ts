import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

// No runtime library: every emitted file is included in one atomic precache.
export function offlineGame(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'noobtips-offline', apply: 'build',
    configResolved(value) { config = value; },
    async closeBundle() {
      const directory = path.resolve(config.root, config.build.outDir);
      const base = config.base;
      const manifest = {
        id: base, name: 'Noobtips', short_name: 'Noobtips', lang: 'nl',
        description: 'Tips waar je misschien iets aan hebt.',
        start_url: base, scope: base, display: 'standalone',
        theme_color: '#0b2429', background_color: '#081d24',
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      };
      await writeFile(path.join(directory, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
      await writeFile(path.join(directory, '.nojekyll'), '');
      const walk = async (folder: string): Promise<string[]> => {
        const items = await readdir(folder, { withFileTypes: true });
        return (await Promise.all(items.map(item => item.isDirectory() ? walk(path.join(folder, item.name)) : [path.join(folder, item.name)]))).flat();
      };
      const files = (await walk(directory)).filter(file => !['sw.js', '.nojekyll'].includes(path.basename(file))).sort();
      const hash = createHash('sha256').update(base).update(process.env.PWA_BUILD_ID ?? '');
      for (const file of files) { hash.update(path.relative(directory, file)); hash.update(await readFile(file)); }
      const template = await readFile(path.resolve(config.root, 'scripts/pwa/worker.js'), 'utf8');
      hash.update(template);
      const version = hash.digest('hex').slice(0, 20);
      const urls = files.map(file => base + path.relative(directory, file).split(path.sep).join('/'));
      await writeFile(path.join(directory, 'sw.js'), template
        .replace('__PRECACHE__', JSON.stringify(urls))
        .replace('__VERSION__', JSON.stringify(version))
        .replace('__BASE__', JSON.stringify(base)));
    },
  };
}
