# John's Malta homepage designs

One repository and one Vercel deployment serve all three designs.

| Route | Design | Source |
| --- | --- | --- |
| `/` | Design chooser | `index.html` |
| `/home-1/` | Codex | `home-1/` |
| `/home-2/` | Claude | `home-2/` |
| `/home-3/` | Claude, warmer variant | `home-3/` |
| `/home-1/review/` | Desktop/mobile review for Home 1 | `home-1/review.html` |

## Vercel

Use the repository root (leave Root Directory blank), Framework Preset **Other**, Build Command `npm run build`, and Output Directory `dist`. No dependencies, environment variables or second project are required. The root `vercel.json` declares these settings.

Trailing slashes keep each design's relative image, CSS and JavaScript paths working. Existing `/review` links redirect to Home 1's review page.

## Local preview

```sh
npm run dev
```

Open `http://localhost:4173`. Run `npm run build` to check JavaScript syntax and produce all three designs in `dist/`.

## Prototype scope

All designs are static HTML/CSS/JavaScript prototypes. Prices and availability are illustrative; forms do not create live bookings, send enquiries or process payments. Proposed Next.js/CMS and WordPress implementations are future development options.

Home 1 includes separate Travel and Car care & leasing menus. Garage, car wash/detailing and leasing use enquiry forms.

Client branding and fleet images are from John's public website; other photographs are design reference assets. Confirm production reuse rights or replace them with licensed client imagery. Font licences are in `home-1/assets/fonts/`.

Internal briefs, commercial proposals, credentials, Sites hosting metadata and working screenshots are excluded.
