import { defineConfig } from 'astro/config';

export default defineConfig({
  server: { port: 4321 },
  output: 'static',
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'one-dark-pro',
      themes: {
        light: 'github-light',
        dark: 'one-dark-pro',
      },
      wrap: true,
      transformers: [],
    },
  },
});

