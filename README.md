# John's Malta homepage designs

Two independent static website concepts, each ready to deploy as a separate Vercel project.

| Design | Vercel Root Directory | Framework Preset | Output Directory |
| --- | --- | --- | --- |
| Homepage | `homepage` | Other | `dist` |
| Claude homepage | `claude-homepage` | Other | `.` |

## Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Choose `homepage` as the Root Directory for the first project.
3. Keep the framework preset as **Other**. The folder's `vercel.json` sets the build and output options.
4. Import the same repository again and choose `claude-homepage` as the Root Directory for the other project.

Neither design requires environment variables or runtime dependencies. Both are static HTML/CSS/JavaScript prototypes. The proposed Next.js/CMS and WordPress implementations are future development options.

The `homepage` variant includes airport transfers, hourly chauffeur, private tours and wedding-car booking/enquiry demonstrations. Its illustrated services menu also links to enquiry-only mechanical garage, car wash/detailing and leasing forms.

Booking prices and availability are illustrative. Forms and checkout previews do not create live bookings, send enquiries or take payments.

## Local preview

For `homepage`:

```sh
cd homepage
npm run dev
```

Open `http://localhost:4173`. `review.html` provides desktop/mobile review controls. `npm run build` checks JavaScript syntax; the deployable files are already in `dist/`.

For `claude-homepage`, serve that directory with any static HTTP server, for example:

```sh
cd claude-homepage
python -m http.server 4174
```

## Assets

John's branding and fleet images are from the client's public website. Other travel and service photographs are design reference assets; confirm production reuse rights or replace them with licensed client imagery. Font licence files are included alongside the self-hosted fonts in `homepage/dist/assets/fonts/`.

Only the website files are included. Internal briefs, pricing proposals, source credentials, Sites hosting metadata and working screenshots are excluded.
