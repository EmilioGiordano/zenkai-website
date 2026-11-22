import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  // Public URL, used for canonical and social preview links. Update when a custom domain is set.
  site: 'https://zenkai-website-sandy.vercel.app',
  integrations: [preact()],
});
