// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// The site is a fully static build. It can be deployed to any static host
// (Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.).
export default defineConfig({
  site: 'https://saints.example.com',
  output: 'static',
  trailingSlash: 'never',
  integrations: [sitemap()],
  vite: {
    // @ts-expect-error Astro and Tailwind ship different Vite patch versions
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
