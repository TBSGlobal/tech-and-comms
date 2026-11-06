"""Build tech-and-comms/index.html from src/template.html.

Inlines images from ../assets as data URIs, writes the tour calendar from
site.json (calendar, speakers, announcement,
registration link, contacts), and fills photo slots from photos.json (slots without a photo
fall back to built-in illustrations). Run: python3 tech-and-comms/src/build.py
"""
import base64
import html as H
import json
import pathlib

SRC = pathlib.Path(__file__).resolve().parent
ROOT = SRC.parent
ASSETS = ROOT / "assets"

AST = ('<svg viewBox="-50 -50 100 100"><g fill="currentColor">'
       '<rect x="-10" y="-48" width="20" height="96" rx="10"/>'
       '<rect x="-10" y="-48" width="20" height="96" rx="10" transform="rotate(60)"/>'
       '<rect x="-10" y="-48" width="20" height="96" rx="10" transform="rotate(120)"/>'
       '</g></svg>')

def icon(d):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>')

ICONS = {
    "PEOPLE": icon('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c3 .2 5.5 2.3 5.5 5.3"/>'),
    "MAP": icon('<path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    "RADAR": icon('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/>'),
    "CHART": icon('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    "USER": icon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.6-1.9 1.9-3 3.5-3s2.9 1.1 3.5 3M14 10h4M14 14h4"/>'),
    "CHAT": icon('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>'),
}

def mime(name):
    return "image/png" if name.lower().endswith(".png") else "image/webp" if name.lower().endswith(".webp") else "image/jpeg"

def data_uri(rel):
    raw = (ASSETS / rel).read_bytes()
    return f"data:{mime(rel)};base64," + base64.b64encode(raw).decode()

def photo(entry):
    """entry: {"file": "photos/x.jpg", "alt": "...", "credit": "..."} or None."""
    if not entry or not (ASSETS / entry["file"]).exists():
        return None
    return entry

def img_tag(entry):
    return f'<img src="{data_uri(entry["file"])}" alt="{H.escape(entry.get("alt", ""))}" loading="lazy">'

VIS_FALLBACK = [
    '<div class="v-pad v-school"><div class="col a"><b>In class</b><i></i><i style="width:80%"></i><i style="width:60%"></i><i style="width:90%"></i></div>'
    '<div class="col b"><b>On the job</b><i style="width:70%"></i><i></i><i style="width:85%"></i><i style="width:50%"></i></div></div>'
    '<span class="cap">01 · School vs reality</span>',
    '<div class="v-pad v-mi"><span class="lbl">Share of voice · last 30 days</span>'
    '<div class="bars"><i style="--h:40%"></i><i style="--h:62%"></i><i style="--h:48%"></i><i style="--h:80%"></i><i style="--h:58%"></i><i style="--h:92%"></i><i style="--h:70%"></i></div>'
    '<div class="kpis"><div><b>Mentions</b><span>Monitoring</span></div><div><b>Sentiment</b><span>Listening</span></div><div><b>Value</b><span>Evaluation</span></div></div></div>'
    '<span class="cap">02 · Media intelligence</span>',
    '<div class="v-pad v-pb"><span class="lbl">Your profile, this semester</span>'
    '<div class="card"><div class="row"><span class="av">You</span><div><b>Mass Comm student</b><small>Documenting the journey</small></div></div>'
    '<div class="posts"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>'
    '<span class="story">"Here\'s who I\'m becoming."</span></div>'
    '<span class="cap">03 · Professional presence</span>',
]

html = (SRC / "template.html").read_text()
site = json.loads((SRC / "site.json").read_text())
photos = json.loads((SRC / "photos.json").read_text())

html = html.replace("__SITE_DATA__", json.dumps(site, ensure_ascii=False).replace("<", "\\u003c"))
html = html.replace("__AST__", AST)
site_url = ((site.get("registration") or {}).get("publicUrl") or "").split("#")[0].rstrip("/")
html = html.replace("__OG_IMAGE__", (site_url + "/assets/og-image.png") if site_url else "assets/og-image.png")
html = html.replace("__SITE_URL__", site_url or "")
unis = json.loads((SRC / "universities.json").read_text())
html = html.replace("__UNI_OPTIONS__", "".join(f'<option value="{H.escape(u)}"></option>' for u in unis))
for k, v in ICONS.items():
    html = html.replace(f"__I_{k}__", v)

marq = ''.join(
    '<span>Anticipate!</span><span>Where communications meet <span class="s">technology</span></span>'
    '<span>Tech &amp; Comms</span><span>26th Nov · Crawford University</span>' for _ in range(4))
html = html.replace("__MARQUEE__", marq)

html = html.replace("__HERO_PHOTO_A__", f'<img src="{data_uri("onaopemipo.jpg")}" alt="Onaopemipo Famori, speaker">')
hb = photo(photos.get("hero_b"))
html = html.replace("__HERO_PHOTO_B__", img_tag(hb) if hb else
    '<div class="slot" style="width:100%;height:100%;align-content:center;gap:10px;padding:20px;text-align:center">'
    f'<span style="display:block;width:64px;height:64px;margin:0 auto;color:var(--blue)">{AST}</span>'
    '<b style="font-family:var(--f-display);font-weight:400;color:var(--white);font-size:1.15rem;line-height:1.2">Legacy Hall<br>Crawford University</b>'
    '<span style="font-size:.7rem;letter-spacing:.2em;font-weight:800">26 · 11 · 2026</span></div>')

for i in range(3):
    t = photo((photos.get("topics") or [None] * 3)[i])
    html = html.replace(f"__TOPIC_VIS_{i}__", (img_tag(t) + VIS_FALLBACK[i][VIS_FALLBACK[i].index('<span class="cap">'):]) if t else VIS_FALLBACK[i])

band = [b for b in (photo(x) for x in photos.get("band") or []) if b][:5]
if band:
    figs = ''.join(f'<figure>{img_tag(b)}<figcaption>{H.escape(b.get("credit", ""))}</figcaption></figure>' for b in band)
    html = html.replace("__PHOTO_BAND__", f'<div class="band rv">{figs}</div>')
else:
    html = html.replace("__PHOTO_BAND__", "")

for key, name in [("LOGO_LIGHT", "tcbr-logo-light.png"), ("LOGO", "tcbr-logo.png"), ("SAMUEL", "samuel.jpg"), ("ONAOPEMIPO", "onaopemipo.jpg"),
                  ("MACO", "maco.jpg"), ("UNICORN", "unicorn.jpg")]:
    html = html.replace(f"__IMG_{key}__", data_uri(name))

assert "__" not in html.split("<script>")[0].replace("__proto__", ""), [l for l in html.splitlines() if "__" in l][:3]
(ROOT / "index.html").write_text(html)
print("wrote", ROOT / "index.html", len(html), "bytes")
