import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import { existsSync, renameSync, rmdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Astro writes /es/404 as es/404/index.html. Static hosts (Cloudflare Pages, Vercel)
// look for a 404.html next to the requested path, so flatten it after the build.
const localized404 = {
  name: 'localized-404',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const out = fileURLToPath(dir);
      for (const lang of ['es']) {
        const nested = `${out}${lang}/404/index.html`;
        if (existsSync(nested)) {
          renameSync(nested, `${out}${lang}/404.html`);
          rmdirSync(`${out}${lang}/404`);
        }
      }
    },
  },
};

export default defineConfig({
  // Public URL, used for canonical and social preview links. Update when a custom domain is set.
  site: 'https://zenkai-website-sandy.vercel.app',
  integrations: [preact(), localized404],
});
