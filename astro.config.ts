import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import siteArtifacts from './src/integrations/site-artifacts.ts';
import { SITE } from './src/data/site.ts';

export default defineConfig({
  site: SITE.url,
  output: 'static',

  // One URL per page, without a trailing slash: /about is served from about.html.
  trailingSlash: 'never',
  build: {
    format: 'file',
    // Styles ship as one cached file, never inline, so the
    // Content-Security-Policy can refuse inline styles outright.
    inlineStylesheets: 'never',
  },

  // HTML-aware whitespace handling keeps the single space between inline elements.
  compressHTML: true,
  devToolbar: { enabled: false },
  fetchFile: null,

  markdown: {
    // Prism marks code with classes, where Shiki would use inline styles.
    syntaxHighlight: 'prism',
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep small assets as files rather than data URIs inside the stylesheet.
      assetsInlineLimit: 1024,
    },
  },

  integrations: [siteArtifacts()],
});
