"""Assemble the static pages: shared head + nav + page body + footer.
Run from the newsite folder:  python -I build.py
Page bodies live in src/*.html with a small front-matter block."""
import pathlib, re, html

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'
SUPPORT = 'support@dailyadventurebox.com'
APP = 'https://www.dailyadventurebox.com/download-app'
WF_SUPPORT = 'https://www.dailyadventurebox.com/support'

CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline'; "
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; "
       "img-src 'self' data: https:; connect-src 'self'; "
       "frame-src https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' https:;")

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="{csp}">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://dailyadventurebox-owner.github.io/Main-Website/media/{og}">
<link rel="icon" type="image/png" href="media/dab-logo.png">
<link rel="apple-touch-icon" href="media/dab-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css">
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"Organization","name":"Daily Adventure Box","alternateName":"DailyAdventureBox","url":"https://www.dailyadventurebox.com","logo":"https://www.dailyadventurebox.com/img/dab-logo.png","description":"Smart lockers stocked with adventure gear, right where people play. Open the app, pick your gear, and the locker unlocks from your phone.","foundingDate":"2021-07-16","founder":{{"@type":"Person","name":"Shay Putnam"}},"areaServed":"US","email":"support@dailyadventurebox.com"}}
</script>
</head>
<body>
"""

NAV = """<header class="nav{solid}" id="nav">
  <div class="nav-inner">
    <a class="nav-logo" href="index.html" aria-label="DailyAdventureBox home"><img src="media/dab-logo.png" alt=""><span class="nav-word">Daily<b>Adventure</b>Box</span></a>
    <nav>
      <ul class="nav-links">
        <li><a href="gear.html">Gear</a></li>
        <li><a href="locations.html">For Locations</a></li>
        <li><a href="ad-opportunities.html">For Brands</a></li>
        <li><a href="story.html">Our Story</a></li>
        <li><a href="{support}" target="_top">Support</a></li>
        <li><a class="nav-cta" href="{app}" target="_top">Get the App</a></li>
      </ul>
    </nav>
    <button class="nav-burger" id="navBurger" aria-label="Open menu"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="nav-mobile" id="navMobile">
  <a href="index.html">Home</a>
  <a href="gear.html">Gear</a>
  <a href="locations.html">For Locations</a>
  <a href="ad-opportunities.html">For Brands</a>
  <a href="story.html">Our Story</a>
  <a href="{app}" target="_top" style="color:var(--green)">Get the App</a>
  <div class="nav-mobile-foot">Questions? Email <strong>{support_email}</strong></div>
</div>
<main>
"""

FOOTER = """</main>
<footer class="footer">
  <div class="footer-big" aria-hidden="true">ADVENTURE ON DEMAND</div>
  <div class="container" style="position:relative;z-index:1">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="media/dab-logo.png" alt="DailyAdventureBox">
        <p>Smart lockers stocked with adventure gear, right where you play. Open the app, pick your gear, and go.</p>
      </div>
      <div class="footer-col">
        <h4>Explore</h4>
        <a href="index.html#how">How It Works</a>
        <a href="gear.html">Gear</a>
        <a href="index.html#where">Find a Locker</a>
        <a href="{app}" target="_top">Get the App</a>
      </div>
      <div class="footer-col">
        <h4>Partner</h4>
        <a href="locations.html">Host a Locker</a>
        <a href="ad-opportunities.html">Advertise on Lockers</a>
        <a href="story.html">Our Story</a>
        <a href="{support}" target="_top">Support</a>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <span class="plain" style="display:block;font-size:14px;padding:6px 0;">Email {support_email}</span>
        <h4 style="margin-top:22px">Legal</h4>
        <a href="https://www.dailyadventurebox.com/general-terms-and-conditions" target="_top">General Terms</a>
        <a href="https://www.dailyadventurebox.com/federal-terms-and-conditions" target="_top">Federal Terms</a>
        <a href="https://www.dailyadventurebox.com/privacy-policy" target="_top">Privacy Policy</a>
        <a href="credits.html">Photo Credits</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year>2026</span> Daily Adventure Box&#174;, Inc. All rights reserved. &nbsp;&bull;&nbsp; Patent Pending</span>
      <div class="footer-socials">
        <a href="https://www.instagram.com/dailyadventurebox" target="_blank" rel="noopener noreferrer" title="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
        <a href="https://www.tiktok.com/@dailyadventurebox" target="_blank" rel="noopener noreferrer" title="TikTok"><svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z"/></svg></a>
        <a href="https://www.youtube.com/@DailyAdventureBox" target="_blank" rel="noopener noreferrer" title="YouTube"><svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
        <a href="https://www.facebook.com/DailyAdventureBox" target="_blank" rel="noopener noreferrer" title="Facebook"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
        <a href="https://www.linkedin.com/company/dailyadventurebox" target="_blank" rel="noopener noreferrer" title="LinkedIn"><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
      </div>
    </div>
  </div>
</footer>
<script src="assets/site.js"></script>
</body>
</html>
"""

# Shared "email us" section used at the bottom of every page
CONTACT = """<section class="section bg-ocean dark" id="contact">
  <div class="container contact-block" data-reveal>
    <p class="eyebrow" style="justify-content:center">Get in Touch</p>
    <h2 class="display display-lg">{heading}</h2>
    <div class="email-big">support<span class="at">@</span>dailyadventurebox.com</div>
    <p class="contact-note">Questions? Have a location or want lockers? Email us at the address above.</p>
  </div>
</section>
"""

def build():
    for page in sorted(SRC.glob('*.html')):
        raw = page.read_text(encoding='utf-8')
        m = re.match(r'---\n(.*?)\n---\n', raw, flags=re.S)
        meta = dict(l.split(':', 1) for l in m.group(1).splitlines())
        meta = {k.strip(): v.strip() for k, v in meta.items()}
        body = raw[m.end():]
        body = body.replace('{{CONTACT}}', CONTACT.format(heading=meta.get('contact', 'Let’s Talk.'), support_email=SUPPORT))
        body = body.replace('{{APP}}', APP).replace('{{SUPPORT_EMAIL}}', SUPPORT)
        out = (HEAD.format(csp=CSP, title=html.escape(meta['title']), desc=html.escape(meta['desc']), og=meta.get('og', 'clj05-wide-bluesky-md.webp'))
               + NAV.format(solid=' solid' if meta.get('nav') == 'solid' else '', support=WF_SUPPORT, app=APP, support_email=SUPPORT)
               + body
               + FOOTER.format(app=APP, support=WF_SUPPORT, support_email=SUPPORT))
        (ROOT / page.name).write_text(out, encoding='utf-8')
        print('built', page.name, len(out) // 1024, 'KB')

if __name__ == '__main__':
    build()
