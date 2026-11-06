# Tech & Comms — campus seminar series site

Landing page for The Comms Boardroom's **Tech & Comms** tour (first stop: Crawford University, 26 Nov 2026).

- `index.html` — the built, self-contained page (images inlined). Open it directly or host it on any static host (e.g. GitHub Pages).
- `src/template.html` — page source.
- `google-sheet/` — the Google Apps Script that stores "Register your school" sign-ups in a Google Sheet, with setup steps.
- `src/universities.json` — suggestions shown in the form's university field.
- `src/site.json` — the editable content, including `registration.endpoint` (the Google Sheet web app URL): tour calendar (status is `confirmed`, `talks`, `planned` or `done`), speakers, announcement bar, registration link and contact details.
- `src/photos.json` — optional stock photos (hero, topic panels, photo band). Put files in `assets/photos/`, list them with alt text and credit, and rebuild. Slots without a photo use built-in illustrations.
- `assets/` — speaker photos and partner crests taken from the campaign design kit.

To change the content in this repo, edit `src/site.json` and run:

```bash
python3 tech-and-comms/src/build.py
```

On the published claude.ai version, admins (the owner and editors) open the page link with `#admin` at the end to reach the admin dashboard. Visitors never see editing controls; anyone else who opens `#admin` sees an "admins only" notice, and the platform refuses their publish.

## Deploying on Vercel

`vercel.json` holds the settings, so Vercel picks them up automatically when this folder is the repo root:

- Build command: `python3 src/build.py && mkdir -p dist && cp index.html dist/index.html`
- Output directory: `dist`

Every commit (for example an edit to `src/site.json` on github.com) rebuilds and redeploys the site.
