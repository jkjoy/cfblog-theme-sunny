# Sunny Astro + WordPress

Headless WordPress with Astro frontend styled like SunnyLite.

## Setup

1. Copy `.env.example` to `.env` and set `PUBLIC_WP_URL` to your WordPress site URL.
2. Install dependencies: `npm i`.
3. Run dev server: `npm run dev` then visit `http://localhost:4321`.

## Structure

- `src/lib/wp.ts`: WordPress REST helpers.
- `src/layouts/BaseLayout.astro`: Base layout with Sunny-like header/footer.
- `src/pages/index.astro`: Post list page.
- `src/pages/[slug].astro`: Post detail page.
- `public/styles/base.css`: Minimal Sunny-like CSS.

## SunnyLite assets

Copy assets from `E:\LT083\Downloads\SunnyLite1.0.7\SunnyLite` into `public/` and update styles/layout as needed.

