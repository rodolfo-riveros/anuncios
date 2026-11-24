// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  trailingSlash: 'ignore',
  redirects: {
    '/publicar': '/anunciate',
    '/panel': '/admin',
  },
});
