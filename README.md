# Tech & Comms — campus seminar series site

Landing page for The Comms Boardroom's **Tech & Comms** tour (first stop: Crawford University, 26 Nov 2026).

- `index.html` — the built, self-contained page (images inlined). Open it directly or host it on any static host (e.g. GitHub Pages).
- `src/template.html` — page source.
- `src/site.json` — the editable content: tour calendar (status is `confirmed`, `talks`, `planned` or `done`), speakers, announcement bar, registration link and contact details.
- `src/photos.json` — optional stock photos (hero, topic panels, photo band). Put files in `assets/photos/`, list them with alt text and credit, and rebuild. Slots without a photo use built-in illustrations.
- `assets/` — speaker photos and partner crests taken from the campaign design kit.

To change the content in this repo, edit `src/site.json` and run:

```bash
python3 tech-and-comms/src/build.py
```

On the published claude.ai version, admins (the owner and editors) open the page link with `#admin` at the end to reach the admin dashboard. Visitors never see editing controls; anyone else who opens `#admin` sees an "admins only" notice, and the platform refuses their publish.
