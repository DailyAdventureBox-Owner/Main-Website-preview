/* =============================================================
   DailyAdventureBox: website booking flow, clickable prototype
   -------------------------------------------------------------
   Everything on this page is sample data. The page makes no network
   calls, books nothing and charges nothing. Choices are kept in this
   browser tab only (sessionStorage), so a reload keeps your place.
   Screens follow the final booking design (steps 1 to 13) plus the
   2027 delivery preview.
   ============================================================= */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     Constants
     ------------------------------------------------------------------ */
  const MIN = 60 * 1000, HALF = 30 * MIN, HOUR = 60 * MIN, DAY = 24 * HOUR;
  const LEAD_LOCKER = HOUR;        // pickups start at least an hour from now
  const LEAD_DELIVERY = DAY;       // delivery needs a day's notice (sample rule)
  const BUFFER = 30 * MIN;         // turnover between two rentals of one compartment
  const MIN_LEN = HOUR, MAX_LEN = 72 * HOUR, DAYS_AHEAD = 60;
  const HOLD_MS = 20 * MIN, EXTEND_MS = 10 * MIN;
  const VIDEO_SECONDS = 120, VIDEO_STEP = 3; // the sample video "plays" 2 minutes in 8 seconds
  const STORE_KEY = 'dab-book-prototype-v1';
  const CODE_CHARS = '23456789ABCDEFGHJKMNPQRTUVWXYZ';
  const FIRST_CODE = '7KQ4-M2XA';
  const MEDIA = '../media/';
  const SUPPORT = 'support@dailyadventurebox.com';
  const APP_URL = 'https://www.dailyadventurebox.com/download-app';
  const TERMS_URL = {
    general: 'https://www.dailyadventurebox.com/general-terms-and-conditions',
    federal: 'https://www.dailyadventurebox.com/federal-terms-and-conditions'
  };
  const PRIVACY_URL = 'https://www.dailyadventurebox.com/privacy-policy';
  const ZONE_NAMES = { 'America/New_York': 'Eastern time', 'America/Chicago': 'Central time', 'America/Denver': 'Mountain time' };
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const STATUS = {
    booked: 'Booked', hold: 'Refundable hold in place', attention: 'Needs your attention',
    ready: 'Ready to unlock', completed: 'Completed', missed: 'Missed pickup', cancelled: 'Cancelled'
  };
  const UPCOMING = ['booked', 'hold', 'attention', 'ready'];
  const CHANGEABLE = ['booked', 'hold', 'attention'];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ------------------------------------------------------------------
     Icons (inline, decorative)
     ------------------------------------------------------------------ */
  const svg = (body, extra) => `<svg class="bk-ico${extra ? ' ' + extra : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  const ICON = {
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    alert: svg('<circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 16.5h.01"/>'),
    info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.5h.01"/>'),
    clock: svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    pin: svg('<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
    nav: svg('<path d="m3 11 18-8-8 18-2-8z"/>'),
    calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    card: svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
    key: svg('<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/>'),
    shield: svg('<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
    external: svg('<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
    chev: svg('<path d="m6 9 6 6 6-6"/>', 'bk-chev'),
    back: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
    arrow: svg('<path d="M5 12h14M12 5l7 7-7 7"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    globe: svg('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>'),
    locker: svg('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 2v20M9 11v2M15 11v2"/>'),
    truck: svg('<path d="M1 4h13v12H1zM14 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="17.5" cy="18.5" r="2"/>'),
    mail: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>'),
    idcard: svg('<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2.5"/><path d="M13 10h5M13 14h5"/>'),
    camera: svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
    play: svg('<path d="M7 4v16l13-8z" fill="currentColor" stroke="none"/>'),
    pause: svg('<path d="M7 4h4v16H7zM14 4h4v16h-4z" fill="currentColor" stroke="none"/>'),
    apple: '<svg class="bk-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z"/></svg>',
    google: '<svg class="bk-ico" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'
  };

  /* ------------------------------------------------------------------
     Sample catalog: gear, lockers, delivery. Prices are sample prices,
     in cents. Compartment numbers are per locker.
     ------------------------------------------------------------------ */
  const GEAR = {
    paddle: { name: 'Paddle board', lower: 'paddle board', plural: 'Paddle boards', rate: 1500, hold: 15000, safety: true, desc: 'Stable all-rounder for first-timers. Paddle and leash included.', photos: [['sup-hd-mangrove-md.webp', 'Stand-up paddle board']] },
    kayak: { name: 'Kayak', lower: 'kayak', plural: 'Kayaks', rate: 1500, hold: 15000, safety: true, desc: 'Sit-on-top kayak for one paddler. Paddle included.', photos: [['kayak-koda-120-md.webp', 'Paddler in an inflatable kayak on open water'], ['boat-kayak-red-md.webp', 'Paddler resting in a red kayak on a lake']] },
    surf: { name: 'Surfboard', lower: 'surfboard', plural: 'Surfboards', rate: 1200, hold: 10000, safety: true, desc: 'Soft-top longboard with a leash.', photos: [['clj05-surfboards-locker-md.webp', 'Surfboards and body boards beside a DailyAdventureBox locker']] },
    hangout: { name: 'Hangout dock', lower: 'hangout dock', plural: 'Hangout docks', rate: 1500, hold: 20000, desc: 'A floating living room for the whole crew.', photos: [['float-hangout-ladder-md.webp', 'Inflatable hangout dock with a ladder']] },
    jackets: { name: 'Life jackets, set of 4', lower: 'life jackets', plural: 'Life jackets', rate: 700, hold: 4000, desc: 'In every size, from kids to adults.', photos: [['boat-life-jackets-md.webp', 'Rack of life jackets']] },
    wake: { name: 'Wakeboard', lower: 'wakeboard', plural: 'Wakeboards', rate: 1200, hold: 10000, desc: 'Board, rope and handle, ready to clip on.', photos: [['boat-wakeboard-spray-md.webp', 'Wakeboarder carving a spray']] },
    skibike: { name: 'Ski bike', lower: 'ski bike', plural: 'Ski bikes', rate: 1500, hold: 20000, desc: 'Handlebars, a seat and short skis. If you can ride a bike, you can ride the mountain.', photos: [['snow-ski-bikes-md.webp', 'Two ski bikes on a snowy slope']] },
    skis: { name: 'Skis and poles', lower: 'skis', plural: 'Skis', rate: 1200, hold: 15000, desc: 'All-mountain skis for groomers and powder days.', photos: [['snow-powder-skier-md.webp', 'Skier in deep powder']] },
    board: { name: 'Snowboard', lower: 'snowboard', plural: 'Snowboards', rate: 1200, hold: 15000, desc: 'Board and bindings for first runs and park laps.', photos: [['snow-snowboard-air-md.webp', 'Snowboarder in the air']] },
    sled: { name: 'Sled', lower: 'sled', plural: 'Sleds', rate: 700, hold: 4000, desc: 'Classic sled for one or two riders.', photos: [['snow-sled-md.webp', 'Two people on a sled']] },
    tube: { name: 'Snow tube', lower: 'snow tube', plural: 'Snow tubes', rate: 700, hold: 4000, desc: 'The fastest way down the sledding hill.', photos: [['snow-tube-md.webp', 'Rider on a snow tube']] },
    tent: { name: 'Tent', lower: 'tent', plural: 'Tents', rate: 1000, hold: 10000, desc: 'Two-person tent for a night at the campground.', photos: [['camp-tent-mountains-md.webp', 'Tent pitched above the clouds in the mountains']] },
    chairs: { name: 'Camp chairs, pair', lower: 'camp chairs', plural: 'Camp chairs', rate: 700, hold: 4000, desc: 'Two folding chairs for the campsite or the fire.', photos: [['camp-fire-chairs-md.webp', 'Camp chairs around a fire pit']] },
    hammock: { name: 'Hammock', lower: 'hammock', plural: 'Hammocks', rate: 700, hold: 4000, desc: 'Two trees and you’re set. Straps included.', photos: [['camp-hammock-lake-md.webp', 'Hammock strung between pines by a lake']] },
    mtb: { name: 'Mountain bike', lower: 'mountain bike', plural: 'Mountain bikes', rate: 1200, hold: 20000, desc: 'Trail bike for the singletrack. Helmet included.', photos: [['bike-mountain-view-md.webp', 'Mountain biker above a valley']] },
    cruiser: { name: 'Beach cruiser', lower: 'beach cruiser', plural: 'Beach cruisers', rate: 1000, hold: 15000, desc: 'Easy rider for the boardwalk and the campground loop. Helmet included.', photos: [['bike-beach-cruiser-md.webp', 'Light blue beach cruiser with a wicker basket']] },
    games: { name: 'Sports and games kit', lower: 'sports and games kit', plural: 'Sports and games', rate: 700, hold: 4000, desc: 'Footballs, volleyballs and yard games.', photos: [['clj05-v2-sports-gear-md.webp', 'Sports gear stocked in a DailyAdventureBox locker']] }
  };

  // Opening hours per weekday (0 = Sunday) as [open, close] in minutes after midnight, locker time.
  const week = (open, close, closedDays) => {
    const m = s => { const p = s.split(':'); return Number(p[0]) * 60 + Number(p[1]); };
    return [0, 1, 2, 3, 4, 5, 6].map(wd => (closedDays || []).includes(wd) ? null : [m(open), m(close)]);
  };

  const PLACES = {
    lakeside: {
      id: 'lakeside', kind: 'locker', name: 'Sample Lakeside Park', town: 'Sample Lake', address: '100 Example Shore Road, Sample Lake',
      number: '900101', tz: 'America/New_York', tax: 700, img: 'sup-hd-mangrove-md.webp', hours: week('08:00', '20:00'),
      gear: [['paddle', [1, 2, 3, 4]], ['kayak', [5, 6, 7]], ['hangout', [8]], ['jackets', [9, 10]]]
    },
    beach: {
      id: 'beach', kind: 'locker', name: 'Sample Beach Club', town: 'Sample Harbor', address: '200 Example Dune Drive, Sample Harbor',
      number: '900102', tz: 'America/New_York', tax: 700, img: 'clj05-surfboards-locker-md.webp', hours: week('07:00', '19:00'),
      gear: [['surf', [1, 2, 3]], ['cruiser', [4, 5, 6]], ['chairs', [7, 8]], ['games', []]]
    },
    mountain: {
      id: 'mountain', kind: 'locker', name: 'Sample Mountain Lodge', town: 'Sample Ridge', address: '300 Example Summit Way, Sample Ridge',
      number: '900103', tz: 'America/Denver', tax: 825, img: 'snow-ski-bikes-md.webp', hours: week('08:00', '17:00', [2]),
      gear: [['skibike', [1, 2, 3]], ['skis', [4, 5, 6, 7]], ['board', [8, 9, 10]], ['sled', [11, 12]], ['tube', [13, 14]]]
    },
    river: {
      id: 'river', kind: 'locker', name: 'Sample River Campground', town: 'Sample Bend', address: '400 Example River Road, Sample Bend',
      number: '900104', tz: 'America/Chicago', tax: 700, federal: true, img: 'camp-tent-mountains-md.webp', hours: week('07:00', '21:00'),
      gear: [['kayak', [1, 2, 3]], ['tent', [4, 5, 6]], ['chairs', [7, 8]], ['hammock', [9]], ['mtb', [10, 11]]]
    },
    harbor: {
      id: 'harbor', kind: 'locker', private: true, name: 'Sample Harbor Hotel', town: 'Sample Harbor', address: '500 Example Bay Street, Sample Harbor',
      number: '900201', tz: 'America/New_York', tax: 700, img: 'float-hangout-ladder-md.webp', hours: week('06:00', '22:00'),
      gear: [['paddle', [1, 2]], ['cruiser', [3, 4, 5]], ['wake', [6]], ['jackets', [7]]]
    }
  };

  // 2027 delivery preview: gear comes from a hub; spots are DailyAdventureBox-approved (all fictional here).
  const DELIVERY = {
    id: 'delivery', kind: 'delivery', name: 'Delivery', tz: 'America/New_York', tax: 700, fee: 2500, hours: week('08:00', '18:00'),
    gear: [['kayak', [1, 2, 3]], ['paddle', [4, 5, 6]], ['hangout', [7]], ['chairs', [8, 9]], ['jackets', [10, 11]]],
    spots: [
      { id: 'ramp', name: 'Sample Riverside Boat Ramp', note: 'Sample spot in the Camp Lejeune area' },
      { id: 'access', name: 'Sample Beach Access 12', note: 'Sample spot between the Camp Lejeune area and Wilmington' },
      { id: 'pavilion', name: 'Sample Marina Park Pavilion', note: 'Sample spot near Wilmington' }
    ]
  };

  /* ------------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------------ */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const money = cents => USD.format(cents / 100);
  const byId = id => document.getElementById(id);
  const val = id => { const n = byId(id); return n ? n.value : ''; };
  const isChecked = id => { const n = byId(id); return !!(n && n.checked); };
  const tip = html => `<p class="bk-tip"><span class="bk-tip-tag">Prototype</span><span>${html}</span></p>`;
  const errLine = (id, text) => `<p class="bk-field-error" id="${id}">${ICON.alert}<span>${esc(text)}</span></p>`;
  const backHTML = (route, label) => `<p class="bk-backrow"><a class="bk-back" href="#/${route}" id="backLink">${ICON.back}<span>${esc(label)}</span></a></p>`;
  const statusChip = s => `<span class="bk-status st-${s}">${STATUS[s]}</span>`;
  const dlHTML = rows => `<dl class="bk-dl">${rows.map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl>`;

  /* ------------------------------------------------------------------
     Time: every time is built and shown in the locker's own time zone
     ------------------------------------------------------------------ */
  const fmtCache = {};
  function zoned(ms, tz) {
    let f = fmtCache[tz];
    if (!f) {
      f = fmtCache[tz] = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
      });
    }
    const p = {};
    f.formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; });
    return { y: +p.year, m: +p.month, d: +p.day, h: (+p.hour) % 24, mi: +p.minute, s: +p.second };
  }
  function offsetAt(ms, tz) {
    const z = zoned(ms, tz);
    return Date.UTC(z.y, z.m - 1, z.d, z.h, z.mi, z.s) - Math.floor(ms / 1000) * 1000;
  }
  // Wall-clock time in a zone -> real instant (handles daylight saving changes).
  function toUtc(y, m, d, minutes, tz) {
    const guess = Date.UTC(y, m - 1, d, 0, minutes);
    const o1 = offsetAt(guess, tz);
    let t = guess - o1;
    const o2 = offsetAt(t, tz);
    if (o2 !== o1) t = guess - o2;
    return t;
  }
  const dayNum = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / DAY);
  const civil = n => { const t = new Date(n * DAY); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: t.getUTCDay() }; };
  const todayCache = {};
  function todayIn(tz) {
    const now = Date.now(), c = todayCache[tz];
    if (c && now - c.at < 2000) return c.n;
    const z = zoned(now, tz), n = dayNum(z.y, z.m, z.d);
    todayCache[tz] = { at: now, n };
    return n;
  }
  const localDayOf = (ms, tz) => { const z = zoned(ms, tz); return dayNum(z.y, z.m, z.d); };

  function clockParts(h, mi) {
    const mm = String(mi).padStart(2, '0');
    if (h === 0 && mi === 0) return { clock: '12:00', part: 'midnight' };
    if (h === 12 && mi === 0) return { clock: '12:00', part: 'noon' };
    const part = h < 5 ? 'at night' : h < 12 ? 'in the morning' : h < 17 ? 'in the afternoon' : h < 21 ? 'in the evening' : 'at night';
    return { clock: `${h % 12 || 12}:${mm}`, part };
  }
  const timeWords = (h, mi) => { const c = clockParts(h, mi); return `${c.clock} ${c.part}`; };
  const minutesWords = m => timeWords(Math.floor(m / 60), m % 60);
  const zoneName = tz => ZONE_NAMES[tz] || tz;
  function dateWords(n) {
    const c = civil(n), y = new Date().getFullYear();
    return `${WEEKDAYS[c.wd]}, ${MONTHS[c.m - 1]} ${c.d}${c.y !== y ? ', ' + c.y : ''}`;
  }
  // "Saturday, November 7, 10:00 in the morning, Eastern time"
  function when(ms, tz, withZone) {
    const z = zoned(ms, tz);
    return `${dateWords(dayNum(z.y, z.m, z.d))}, ${timeWords(z.h, z.mi)}${withZone === false ? '' : ', ' + zoneName(tz)}`;
  }
  const timeOf = (ms, tz) => { const z = zoned(ms, tz); return timeWords(z.h, z.mi); };
  function durWords(ms) {
    const total = Math.round(ms / MIN), h = Math.floor(total / 60), m = total % 60, out = [];
    if (h) out.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
    if (m) out.push(`${m} minutes`);
    return out.join(' ') || '0 minutes';
  }
  function hoursText(place, n) {
    const h = place.hours[civil(n).wd];
    return h ? `${minutesWords(h[0])} to ${minutesWords(h[1])}` : 'Closed';
  }
  const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  /* ------------------------------------------------------------------
     Availability (stands in for GET /Bookings/slots and /return-slots).
     Rules from the design: half-hour times inside opening hours, at least
     an hour ahead, up to 60 days out, 1 to 72 hours long, 30 minutes of
     turnover between rentals of one compartment. Busy times are sample
     bookings made from a fixed seed, so they stay the same on reload.
     ------------------------------------------------------------------ */
  const memo = new Map();
  const remember = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
  const leadOf = place => place.kind === 'delivery' ? LEAD_DELIVERY : LEAD_LOCKER;
  const compsOf = (place, key) => { const g = place.gear.find(x => x[0] === key); return g ? g[1] : []; };

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Open days from today, with the real start and end instant of each day's hours.
  function openDays(place) {
    const t0 = todayIn(place.tz);
    return remember(`open|${place.id}|${t0}`, () => {
      const out = [];
      for (let k = 0; k <= DAYS_AHEAD + 3; k++) {
        const n = t0 + k, c = civil(n), h = place.hours[c.wd];
        if (h) out.push({ n, k, a: toUtc(c.y, c.m, c.d, h[0], place.tz), b: toUtc(c.y, c.m, c.d, h[1], place.tz) });
      }
      return out;
    });
  }
  // One busy weekend day per place, so the "Fully booked that day" message can be seen.
  function fullDayK(place) {
    const days = openDays(place);
    const sat = days.find(iv => iv.k >= 3 && iv.k <= 10 && civil(iv.n).wd === 6);
    const any = days.find(iv => iv.k >= 3);
    return (sat || any || { k: -1 }).k;
  }
  function baseBusy(place, key, comp) {
    const t0 = todayIn(place.tz);
    return remember(`busy|${place.id}|${key}|${comp}|${t0}`, () => {
      const out = [], fk = fullDayK(place);
      openDays(place).forEach(iv => {
        if (iv.k === fk) { out.push({ s: iv.a, e: iv.b }); return; }
        const r = rng(hashStr(`${place.id}|${key}|${comp}|${iv.n}`));
        const slots = Math.round((iv.b - iv.a) / HALF);
        if (r() < 0.4) {
          const len = 4 + Math.floor(r() * 6); // 2 to 4.5 hours
          const start = Math.floor(r() * Math.max(1, slots - len + 1));
          const s = iv.a + start * HALF;
          out.push({ s, e: Math.min(iv.b, s + len * HALF) });
        }
      });
      return out;
    });
  }
  function busyOf(place, key, comp, exclude) {
    const base = baseBusy(place, key, comp);
    const mine = state.bookings.filter(b => b.placeId === place.id && b.gearKey === key && b.comp === comp && UPCOMING.includes(b.status) && b.code !== exclude);
    return mine.length ? base.concat(mine.map(b => ({ s: b.pickup, e: b.ret }))) : base;
  }
  // Latest return time for one compartment if picked up at t, or -1 if it is busy at t.
  function compLimit(busy, t) {
    let lim = t + MAX_LEN;
    for (const b of busy) {
      if (b.e + BUFFER <= t) continue;
      if (b.s >= t) { if (b.s - BUFFER < lim) lim = b.s - BUFFER; continue; }
      return -1;
    }
    return lim >= t + MIN_LEN ? lim : -1;
  }
  function bestLimit(place, key, t, exclude) {
    let best = -1;
    compsOf(place, key).forEach(c => { const l = compLimit(busyOf(place, key, c, exclude), t); if (l > best) best = l; });
    return best;
  }
  function freeComp(place, key, t, r, exclude) {
    const comps = compsOf(place, key);
    for (let i = 0; i < comps.length; i++) if (compLimit(busyOf(place, key, comps[i], exclude), t) >= r) return comps[i];
    return null;
  }
  function returnTimes(place, key, t, exclude) {
    const lim = bestLimit(place, key, t, exclude), out = [];
    if (lim < 0) return out;
    for (const iv of openDays(place)) {
      if (iv.a > lim) break;
      const from = Math.max(iv.a, t + MIN_LEN), to = Math.min(iv.b, lim);
      for (let r = from; r <= to; r += HALF) out.push(r);
    }
    return out;
  }
  function hasReturn(place, key, t, exclude) {
    const lim = bestLimit(place, key, t, exclude);
    if (lim < 0) return false;
    for (const iv of openDays(place)) {
      if (iv.a > lim) return false;
      if (Math.max(iv.a, t + MIN_LEN) <= Math.min(iv.b, lim)) return true;
    }
    return false;
  }
  function bookingDays(place) {
    const earliest = Date.now() + leadOf(place);
    return openDays(place).filter(iv => iv.k < DAYS_AHEAD && iv.b - HALF >= earliest);
  }
  function pickupTimes(place, key, n, exclude) {
    const iv = openDays(place).find(x => x.n === n);
    if (!iv || iv.k >= DAYS_AHEAD) return [];
    const earliest = Date.now() + leadOf(place), out = [];
    for (let t = iv.a; t <= iv.b - HALF; t += HALF) if (t >= earliest && hasReturn(place, key, t, exclude)) out.push(t);
    return out;
  }
  function nextFree(place, key, afterN) {
    for (const iv of bookingDays(place)) {
      if (iv.n <= afterN) continue;
      const p = pickupTimes(place, key, iv.n);
      if (p.length) return { n: iv.n, t: p[0] };
    }
    return null;
  }
  const insideOpen = (place, r) => openDays(place).some(iv => r >= iv.a && r <= iv.b);
  // Change your time: same length, so the same price.
  function changeStarts(b, n) {
    const place = placeOf(b), len = b.ret - b.pickup;
    const iv = openDays(place).find(x => x.n === n);
    if (!iv || iv.k >= DAYS_AHEAD) return [];
    const earliest = Date.now() + leadOf(place), out = [];
    for (let t = iv.a; t <= iv.b - HALF; t += HALF) {
      if (t < earliest || t === b.pickup) continue;
      const r = t + len;
      if (insideOpen(place, r) && bestLimit(place, b.gearKey, t, b.code) >= r) out.push(t);
    }
    return out;
  }
  function quote(place, key, pickup, ret) {
    const g = GEAR[key], ms = ret - pickup;
    const subtotal = Math.round(g.rate * ms / HOUR);
    const fee = place.kind === 'delivery' ? place.fee : 0;
    const tax = Math.round((subtotal + fee) * place.tax / 10000);
    return { ms, subtotal, fee, tax, total: subtotal + fee + tax };
  }

  /* ------------------------------------------------------------------
     State (this browser tab only)
     ------------------------------------------------------------------ */
  const newDraft = mode => ({ mode: mode || 'locker', placeId: null, spot: null, gearKey: null, day: null, pickup: null, retDay: null, ret: null, safetySeen: false });
  function freshState() {
    return {
      v: 1, draft: newDraft('locker'), privateUnlocked: false,
      accounts: {
        'google@example.com': { first: 'Gail', last: 'Sample', email: 'google@example.com', provider: 'google', confirmed: true, idv: 'none', video: false },
        'apple@example.com': { first: 'Abe', last: 'Sample', email: 'apple@example.com', provider: 'apple', confirmed: true, idv: 'none', video: false }
      },
      userEmail: null, signup: null, authView: 'signin', afterSignIn: null, hold: null,
      bookings: [], seeded: {}, last: null, lastSteps: null, firstCodeUsed: false, tab: 'upcoming', flash: null
    };
  }
  function load() {
    try {
      const raw = window.sessionStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.v === 1 ? Object.assign(freshState(), s) : null;
    } catch (e) { return null; }
  }
  function save() {
    try { window.sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: the prototype still works, it just forgets on reload */ }
  }
  let state = load() || freshState();
  const user = () => (state.userEmail && state.accounts[state.userEmail]) || null;
  const safetyDone = u => !!(u && (u.idv === 'processing' || u.idv === 'verified') && u.video);
  function draftPlace() {
    const d = state.draft;
    if (d.mode === 'delivery') return d.spot ? DELIVERY : null;
    const p = d.placeId ? PLACES[d.placeId] : null;
    return p && (!p.private || state.privateUnlocked) ? p : null;
  }
  const placeOf = b => b.placeId === 'delivery' ? DELIVERY : PLACES[b.placeId];
  const findBooking = code => state.bookings.find(b => b.code === code) || null;
  const holdKey = d => [d.mode, d.placeId, d.spot ? d.spot.id + d.spot.note : '', d.gearKey, d.pickup, d.ret].join('|');
  function nextFlowStep() {
    const d = state.draft, u = user();
    if (!u) return 'account';
    if (!u.confirmed) return 'confirm-email';
    if (d.gearKey && GEAR[d.gearKey].safety && !safetyDone(u)) return 'safety';
    return 'pay';
  }
  function newCode() {
    const used = new Set(state.bookings.map(b => b.code));
    let code;
    do {
      const a = new Uint32Array(8);
      if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(a);
      else for (let i = 0; i < 8; i++) a[i] = Math.floor(Math.random() * 4294967296);
      const raw = Array.from(a, x => CODE_CHARS[x % CODE_CHARS.length]).join('');
      code = raw.slice(0, 4) + '-' + raw.slice(4);
    } while (used.has(code) || code === FIRST_CODE);
    return code;
  }
  function nameFromEmail(email) {
    const w = (email.split('@')[0].split(/[^a-zA-Z]+/).filter(Boolean)[0] || 'Sample').toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  }

  // Sample history for My bookings, made relative to now when an account first signs in.
  function seedBookings(email) {
    if (state.seeded[email]) return;
    state.seeded[email] = true;
    const push = (place, key, pickup, ret, status, comp) => {
      const g = GEAR[key], q = quote(place, key, pickup, ret);
      state.bookings.push({
        code: newCode(), owner: email, mode: 'locker', placeId: place.id, spot: null, gearKey: key, pickup, ret, comp,
        rate: g.rate, holdAmt: g.hold, subtotal: q.subtotal, fee: 0, tax: q.tax, total: q.total, status, card: '4242', sample: true
      });
    };
    const add = (placeId, key, offset, startMin, lenMin, status, comp) => {
      const place = PLACES[placeId];
      let n = todayIn(place.tz) + offset;
      if (offset >= 0) { let guard = 0; while (!place.hours[civil(n).wd] && guard++ < 7) n++; }
      const c = civil(n), pickup = toUtc(c.y, c.m, c.d, startMin, place.tz);
      push(place, key, pickup, pickup + lenMin * MIN, status, comp);
    };
    add('river', 'kayak', 1, 600, 240, 'attention', 2);       // the bank asked to confirm the card for the refundable hold
    add('mountain', 'skibike', 1, 540, 240, 'hold', 2);
    add('lakeside', 'paddle', 9, 600, 180, 'booked', 3);
    const start = Math.floor(Date.now() / HALF) * HALF;       // started within the last half hour, box not opened yet
    push(PLACES.beach, 'surf', start, start + 2 * HOUR, 'ready', 1);
    add('lakeside', 'paddle', -12, 780, 180, 'completed', 2);
    add('river', 'chairs', -19, 600, 240, 'missed', 7);
    add('mountain', 'board', -26, 540, 180, 'cancelled', 8);
  }

  /* ------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------ */
  const el = {
    band: byId('band'), wrap: byId('wrap'), summary: byId('summary'), screen: byId('screen'),
    nav: byId('headerLinks'), live: byId('live'), dialog: byId('dialog'), top: byId('bkTop')
  };
  let ui = {};               // per-screen state: errors, open panels, messages. Reset on every navigation.
  let timers = [];
  let payTimer = null;
  let firstRender = true;
  let summaryOpen = false;
  const video = { playing: false, pos: 0 };

  function parseRoute() {
    const h = location.hash || '';
    if (h.indexOf('#/') !== 0) return { name: '', parts: [], path: '' };
    const path = h.slice(2);
    const parts = path.split('/').filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
    return { name: parts[0] || '', parts, path };
  }
  function go(path) {
    const target = '#/' + path;
    if (location.hash === target) render(true); else location.hash = target;
  }
  function clearTimers() { timers.forEach(t => clearInterval(t)); timers = []; }
  let liveTimer = null;
  function announce(msg) {
    el.live.textContent = '';
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { el.live.textContent = msg; }, 80);
  }
  function focusById(id, scroll) {
    const n = byId(id);
    if (!n) return;
    if (!n.matches('a, button, input, select, textarea, summary, [tabindex]')) n.setAttribute('tabindex', '-1');
    n.focus({ preventScroll: !scroll });
  }
  function snapshot() {
    const a = document.activeElement;
    const s = { focus: a && a.id && a !== document.body ? a.id : null, scroll: {}, open: {}, val: {}, chk: {} };
    document.querySelectorAll('[data-keep-scroll]').forEach(n => { if (n.id) s.scroll[n.id] = n.scrollLeft; });
    document.querySelectorAll('#screen details[id]').forEach(n => { s.open[n.id] = n.open; });
    document.querySelectorAll('#screen input[id], #screen textarea[id]').forEach(n => {
      if (n.type === 'checkbox') s.chk[n.id] = n.checked;
      else if (n.type !== 'radio' && !n.disabled) s.val[n.id] = n.value;
    });
    return s;
  }
  function restore(s) {
    Object.keys(s.val).forEach(id => { const n = byId(id); if (n && !n.value) n.value = s.val[id]; });
    Object.keys(s.chk).forEach(id => { const n = byId(id); if (n) n.checked = s.chk[id]; });
    Object.keys(s.scroll).forEach(id => { const n = byId(id); if (n) n.scrollLeft = s.scroll[id]; });
    Object.keys(s.open).forEach(id => { const n = byId(id); if (n) n.open = s.open[id]; });
    if (s.focus) { const n = byId(s.focus); if (n && !n.disabled && n.getClientRects().length) n.focus({ preventScroll: true }); }
  }

  function render(isNav) {
    clearTimers();
    if (isNav) { ui = {}; if (payTimer) { clearTimeout(payTimer); payTimer = null; } }
    const r = parseRoute();
    const s = screenFor(r);
    if (s.redirect !== undefined) { location.replace('#/' + s.redirect); return; }
    const keep = isNav ? null : snapshot();
    renderHeader(r);
    el.band.className = 'bk-band dark' + (s.photo ? ' has-photo' : '');
    el.band.innerHTML = bandHTML(s);
    el.wrap.classList.toggle('has-summary', !!s.summary);
    el.summary.hidden = !s.summary;
    el.summary.classList.toggle('is-open', summaryOpen);
    el.summary.innerHTML = s.summary ? summaryHTML() : '';
    el.screen.innerHTML = `<div class="bk-stack">${s.html}</div>`;
    document.title = `${s.docTitle || s.title} · Book online prototype · DailyAdventureBox`;
    if (keep) restore(keep);
    if (s.after) s.after(isNav);
    if (ui.focus) { const f = ui.focus; ui.focus = null; focusById(f, true); }
    else if (isNav) {
      window.scrollTo(0, 0);
      if (!firstRender) { const h = byId('pageTitle'); if (h) h.focus({ preventScroll: true }); }
    }
    firstRender = false;
    save();
  }
  const rerender = () => render(false);

  function renderHeader(r) {
    const u = user();
    const cur = n => (r.name === n ? ' aria-current="page"' : '');
    el.nav.innerHTML =
      `<li>${u ? '<button type="button" data-act="signOut" id="hdrSign">Sign out</button>' : `<a href="#/sign-in" data-act="headerSignIn" id="hdrSign"${cur('sign-in')}>Sign in</a>`}</li>` +
      `<li><a href="#/bookings" id="hdrBookings"${cur('bookings')}>My bookings</a></li>` +
      `<li><a href="#/help" id="hdrHelp"${cur('help')}>Help</a></li>`;
  }

  function bandHTML(s) {
    return `${s.photo ? `<div class="bk-band-photo" aria-hidden="true"><img src="${MEDIA + s.photo}" alt=""></div><div class="bk-band-shade" aria-hidden="true"></div>` : ''}
      <div class="bk-band-inner">
        ${s.step !== undefined && s.step !== null ? stepsHTML(s.step) : ''}
        ${s.eyebrow ? `<p class="eyebrow">${esc(s.eyebrow)}</p>` : ''}
        <h1 class="display bk-title" id="pageTitle" tabindex="-1">${esc(s.title)}</h1>
        ${s.lede ? `<p class="bk-lede">${s.lede}</p>` : ''}
      </div>`;
  }

  // Step indicator for the booking path. Safety appears only for kayaks, paddle boards and surfboards.
  function flowSteps(src) {
    const u = user();
    const safety = !!(src.gearKey && GEAR[src.gearKey].safety && (src.safetySeen || !safetyDone(u)));
    const list = [
      { key: '', label: src.mode === 'delivery' ? 'Spot' : 'Locker', title: src.mode === 'delivery' ? 'Choose a delivery spot' : 'Choose a locker' },
      { key: 'gear', label: 'Gear', title: 'Choose your gear' },
      { key: 'times', label: 'Times', title: 'Pick your times' },
      { key: 'account', label: 'Account', title: 'Sign in' }
    ];
    if (safety) list.push({ key: 'safety', label: 'Safety', title: 'Two quick safety steps' });
    list.push({ key: 'pay', label: 'Pay', title: 'Review and pay' }, { key: 'booked', label: 'Booked', title: 'You’re booked' });
    return list;
  }
  function stepsHTML(stepKey) {
    const src = stepKey === 'booked' && state.lastSteps ? state.lastSteps : state.draft;
    const list = flowSteps(src);
    const idx = Math.max(0, list.findIndex(x => x.key === stepKey));
    const items = list.map((x, i) => {
      const cls = i < idx ? 'is-done' : i === idx ? 'is-current' : '';
      const inner = `<span class="bk-step-bar" aria-hidden="true"></span><span class="bk-step-name" aria-hidden="true">${esc(x.label)}</span>`;
      if (i < idx && stepKey !== 'booked') {
        return `<li class="${cls}"><button type="button" class="bk-step" data-act="goto" data-to="${x.key}" id="step-${x.key || 'start'}">${inner}<span class="sr-only">Step ${i + 1}, ${esc(x.label)}, done. Go back to it.</span></button></li>`;
      }
      const sr = i === idx ? `Step ${i + 1}, ${esc(x.label)}, current step` : `Step ${i + 1}, ${esc(x.label)}${i < idx ? ', done' : ''}`;
      return `<li class="${cls}"${i === idx ? ' aria-current="step"' : ''}><span class="bk-step">${inner}<span class="sr-only">${sr}</span></span></li>`;
    }).join('');
    return `<nav class="bk-steps" aria-label="Booking progress">
      <p class="bk-steps-label" aria-hidden="true">Step ${idx + 1} of ${list.length}<span class="bk-steps-current">: ${esc(list[idx].title)}</span></p>
      <ol class="bk-steps-list">${items}</ol></nav>`;
  }

  // Running order summary: a sticky side panel on wide screens, a collapsible bar on phones.
  function summaryHTML() {
    const d = state.draft, place = draftPlace(), isDel = d.mode === 'delivery';
    const g = d.gearKey ? GEAR[d.gearKey] : null;
    const tz = place ? place.tz : 'America/New_York';
    const q = place && g && d.pickup && d.ret ? quote(place, d.gearKey, d.pickup, d.ret) : null;
    const row = (label, value) => `<div><dt>${label}</dt><dd${value ? '' : ' class="is-empty"'}>${value || 'Not chosen yet'}</dd></div>`;
    let where = '';
    if (isDel && d.spot) where = `${esc(d.spot.name)}<br><span class="bk-muted">${esc(d.spot.note)}</span>`;
    else if (place) where = `${esc(place.name)}<br><span class="bk-muted">${esc(place.town)}, ${zoneName(place.tz)}</span>`;
    const short = q ? `${money(q.subtotal + q.fee)} plus tax` : g ? `${money(g.rate)} an hour` : 'Nothing chosen yet';
    let price = '';
    if (q) {
      price = `<div class="bk-sumprice">
        <div class="bk-sumrow"><span>${durWords(q.ms)} at ${money(g.rate)} an hour</span><span>${money(q.subtotal)}</span></div>
        ${q.fee ? `<div class="bk-sumrow"><span>Delivery fee</span><span>${money(q.fee)}</span></div>` : ''}
        <div class="bk-sumrow"><span>Sales tax</span><span>At checkout</span></div>
        <div class="bk-sumrow is-total"><span>Before tax</span><span>${money(q.subtotal + q.fee)}</span></div>
        <div class="bk-sumrow"><span>Refundable hold</span><span>${money(g.hold)}</span></div>
      </div>`;
    } else if (g) {
      price = `<div class="bk-sumprice">
        <div class="bk-sumrow"><span>Price</span><span>${money(g.rate)} an hour</span></div>
        ${isDel ? `<div class="bk-sumrow"><span>Delivery fee</span><span>${money(DELIVERY.fee)}</span></div>` : ''}
        <div class="bk-sumrow"><span>Refundable hold</span><span>${money(g.hold)}</span></div>
      </div>`;
    }
    return `<div class="bk-summary-card">
      <button type="button" class="bk-summary-toggle" id="summaryToggle" data-act="toggleSummary" aria-expanded="${summaryOpen}" aria-controls="summaryBody">
        <span class="bk-summary-tlabel">Your booking</span><span class="bk-summary-tval">${short}</span>${ICON.chev}
      </button>
      <div class="bk-summary-body" id="summaryBody">
        <h2 class="bk-summary-h" id="summaryHeading">Your booking</h2>
        <dl class="bk-sumlist">
          ${row(isDel ? 'Delivery spot' : 'Locker', where)}
          ${row('Gear', g ? esc(g.name) : '')}
          ${row(isDel ? 'Start' : 'Pickup', d.pickup ? esc(when(d.pickup, tz)) : '')}
          ${row(isDel ? 'End' : 'Return', d.ret ? esc(when(d.ret, tz)) : '')}
        </dl>
        ${price}
        ${g ? '<p class="bk-sumfoot"><span class="bk-sample-tag">Sample prices</span></p>' : ''}
      </div>
    </div>`;
  }

  function errorsHTML() {
    const list = ui.errorList;
    if (!list || !list.length) return '';
    return `<div class="bk-errors" id="errorSummary" role="alert" tabindex="-1" aria-labelledby="errorSummaryTitle">
      <h2 class="bk-errors-title" id="errorSummaryTitle">${list.length === 1 ? 'There is a problem' : `There are ${list.length} problems`}</h2>
      <ul>${list.map(e => `<li><button type="button" class="bk-errors-link" data-act="focusField" data-target="${e.target}">${esc(e.text)}</button></li>`).join('')}</ul>
    </div>`;
  }
  function showErrors(list) {
    ui.errorList = list.map(x => ({ target: x[0], text: x[1] }));
    ui.errors = {};
    list.forEach(x => { ui.errors[x[0]] = x[1]; });
    ui.focus = 'errorSummary';
    rerender();
  }
  function clearErrors() { ui.errorList = null; ui.errors = null; }
  function fieldHTML(o) {
    const e = ui.errors && ui.errors[o.id];
    const desc = [o.hint ? o.id + 'Hint' : '', e ? o.id + 'Err' : ''].filter(Boolean).join(' ');
    return `<div class="bk-field">
      <label class="bk-label" for="${o.id}">${esc(o.label)}</label>
      ${o.hint ? `<p class="bk-hint" id="${o.id}Hint">${esc(o.hint)}</p>` : ''}
      <input class="bk-input" id="${o.id}" name="${o.id}" type="${o.type || 'text'}"${o.autocomplete ? ` autocomplete="${o.autocomplete}"` : ''}${o.inputmode ? ` inputmode="${o.inputmode}"` : ''}${desc ? ` aria-describedby="${desc}"` : ''}${e ? ' aria-invalid="true"' : ''} spellcheck="false">
      ${e ? errLine(o.id + 'Err', e) : ''}
    </div>`;
  }

  /* ------------------------------------------------------------------
     Shared pieces
     ------------------------------------------------------------------ */
  // Time choices as real radio buttons, grouped by part of the day.
  function timeGroupsHTML(times, tz, name, selected, extra, wide) {
    const groups = [];
    times.forEach(t => {
      const z = zoned(t, tz);
      const label = z.h < 5 ? 'Night' : z.h < 12 ? 'Morning' : z.h < 17 ? 'Afternoon' : z.h < 21 ? 'Evening' : 'Night';
      const last = groups[groups.length - 1];
      if (!last || last.label !== label) groups.push({ label, items: [] });
      groups[groups.length - 1].items.push({ t, z });
    });
    return groups.map(gr => `<div class="bk-tgroup"><p class="bk-tgroup-h" aria-hidden="true">${gr.label}</p>
      <div class="bk-times${wide ? ' is-wide' : ''}">${gr.items.map(({ t, z }) => {
        const c = clockParts(z.h, z.mi);
        const more = extra ? `<span class="bk-time-len">${esc(extra(t))}</span>` : '';
        return `<div class="bk-opt"><input class="bk-radio" type="radio" name="${name}" id="${name}-${t}" value="${t}" data-change="${name}"${t === selected ? ' checked' : ''}><label class="bk-time" for="${name}-${t}"><span class="bk-time-clock">${c.clock}</span><span class="bk-time-part">${c.part}<span class="sr-only">,</span></span>${more}</label></div>`;
      }).join('')}</div></div>`).join('');
  }
  function dayChipHTML(name, n, checked, top, bottom, full) {
    const c = civil(n), y = new Date().getFullYear();
    return `<div class="bk-opt"><input class="bk-radio" type="radio" name="${name}" id="${name}-${n}" value="${n}" data-change="${name}"${checked ? ' checked' : ''}>
      <label class="bk-day${full ? ' is-full' : ''}" for="${name}-${n}"><span class="bk-day-w">${esc(top || WEEKDAYS[c.wd])}<span class="sr-only">,</span></span><span class="bk-day-d">${MONTHS[c.m - 1]} ${c.d}${c.y !== y ? ', ' + c.y : ''}</span><span class="bk-day-t">${bottom ? `<span class="sr-only">, </span>${esc(bottom)}` : '&nbsp;'}</span></label></div>`;
  }
  function placeLabel(b) {
    if (b.mode === 'delivery') return `Delivery to ${b.spot.name}`;
    return placeOf(b).name;
  }
  function detailsDL(b, opts) {
    const place = placeOf(b), g = GEAR[b.gearKey], tz = place.tz, isDel = b.mode === 'delivery';
    const rows = [];
    rows.push(isDel
      ? ['Delivery spot', `${esc(b.spot.name)}<br><span class="bk-muted">${esc(b.spot.note)}</span>`]
      : ['Locker', `${esc(place.name)}<br><span class="bk-muted">${esc(place.address)}</span>`]);
    rows.push(['Gear', esc(g.name)]);
    if (!isDel) rows.push(['Compartment', String(b.comp)]);
    rows.push([isDel ? 'Start (we bring it)' : 'Pickup', esc(when(b.pickup, tz))]);
    rows.push([isDel ? 'End (we pick it up)' : 'Return', esc(when(b.ret, tz))]);
    rows.push([b.status === 'cancelled' ? 'Refunded' : 'Amount paid', `${money(b.total)} <span class="bk-sample-tag">Sample</span>`]);
    if (CHANGEABLE.includes(b.status) && !(opts && opts.noDeadline)) rows.push(['Free cancellation until', esc(when(b.pickup, tz))]);
    if (UPCOMING.includes(b.status)) rows.push(['Refundable hold', `${money(b.holdAmt)} on the card ending ${b.card}`]);
    return dlHTML(rows);
  }
  function cardFormHTML(p, withWallets) {
    return `<div class="bk-stripe" role="group" aria-labelledby="${p}CardTitle">
      <p class="bk-stripe-title" id="${p}CardTitle">${ICON.lock}<span>Secure payment</span><span class="bk-sample-tag">Sample form</span></p>
      ${withWallets ? `<div class="bk-wallets">
          <button type="button" class="bk-wallet" disabled aria-describedby="${p}WalletNote">${ICON.apple}<span>Pay</span><span class="sr-only"> with Apple Pay</span></button>
          <button type="button" class="bk-wallet bk-wallet-google" disabled aria-describedby="${p}WalletNote">${ICON.google}<span>Pay</span><span class="sr-only"> with Google Pay</span></button>
        </div>
        <p class="bk-wallet-note" id="${p}WalletNote">Sample Apple Pay and Google Pay buttons. The design adds them in a later phase.</p>
        <p class="bk-or"><span>or pay by card</span></p>` : ''}
      <span class="bk-stab" aria-hidden="true">${ICON.card} Card</span>
      <div class="bk-sfield"><label for="${p}Num">Card number</label><div class="bk-sinput-wrap"><input class="bk-sinput" id="${p}Num" value="4242 4242 4242 4242" disabled>${ICON.card}</div></div>
      <div class="bk-srow">
        <div class="bk-sfield"><label for="${p}Exp">Expiration date</label><input class="bk-sinput" id="${p}Exp" value="12 / 30" disabled></div>
        <div class="bk-sfield"><label for="${p}Cvc">Security code</label><input class="bk-sinput" id="${p}Cvc" value="123" disabled></div>
      </div>
      <div class="bk-srow">
        <div class="bk-sfield"><label for="${p}Country">Country</label><select class="bk-sinput" id="${p}Country" disabled><option>United States</option></select></div>
        <div class="bk-sfield"><label for="${p}Postal">Postal code</label><input class="bk-sinput" id="${p}Postal" value="" placeholder="Sample" disabled></div>
      </div>
      <p class="bk-stripe-foot">${ICON.lock}<span>On the real site this is Stripe’s secure card form. In this prototype the fields are locked and nothing is charged.</span></p>
    </div>`;
  }
  function phoneSketchHTML(b) {
    const place = placeOf(b), g = GEAR[b.gearKey];
    return `<figure class="bk-phone-fig">
      <div class="bk-phone" aria-hidden="true"><div class="bk-phone-screen">
        <span class="bk-phone-pill">Active Rental</span>
        <span class="bk-phone-gear">${esc(g.name)}</span>
        <span class="bk-phone-place">${esc(place.name)}</span>
        <span class="bk-phone-place">Compartment ${b.comp}</span>
        <span class="bk-phone-btn">Open Box</span>
      </div></div>
      <figcaption>Sketch of the app at pickup: Active Rental, then Open Box. Not the real app screen.</figcaption>
    </figure>`;
  }
  function cardStepHTML(b, onBookedPage) {
    const g = GEAR[b.gearKey], place = placeOf(b), wd = WEEKDAYS[civil(localDayOf(b.pickup, place.tz)).wd];
    const intro = `<p>Your bank asked us to confirm your card before we place the ${money(b.holdAmt)} refundable hold for ${wd}’s ${esc(g.lower)}. Nothing is charged, and the hold is released after you return the gear.</p>`;
    const choose = ui.otherCard
      ? `${cardFormHTML('oc', false)}
         <div class="bk-btnrow"><button type="button" class="btn btn-green" data-act="confirmCard" data-code="${b.code}" data-other="1" id="btnConfirmOther">Confirm with this card (sample)</button>
         <button type="button" class="btn btn-outline-dark" data-act="savedCard" id="btnSavedCard">Use the saved card instead</button></div>`
      : `<div class="bk-saved-card"><span class="bk-saved-card-name">${ICON.card}<span>Saved card ending ${b.card}</span></span>
           <button type="button" class="btn btn-green bk-btn-sm" data-act="confirmCard" data-code="${b.code}" id="btnConfirmCard">Confirm<span class="sr-only"> the card ending ${b.card}</span></button></div>
         <p class="bk-small"><button type="button" class="bk-linkbtn" data-act="otherCard" id="btnOtherCard">Use a different card</button></p>`;
    return `<section class="bk-card bk-attention" aria-labelledby="cardStepTitle" id="cardStep">
      <h2 class="bk-h3" id="cardStepTitle">${onBookedPage ? 'One more step: confirm your card for the refundable hold' : 'Your card'}</h2>
      ${intro}${choose}
      ${onBookedPage ? tip('For pickups within 24 hours the bank asks every time here, so you can see this step.') : ''}
    </section>`;
  }

  /* ------------------------------------------------------------------
     Screen 1: choose a locker (or a delivery spot)
     ------------------------------------------------------------------ */
  function scrLockers() {
    const d = state.draft, isDel = d.mode === 'delivery';
    const mode = `<fieldset class="bk-mode">
        <legend class="sr-only">How do you want your gear?</legend>
        <div class="bk-opt"><input class="bk-radio" type="radio" name="mode" id="mode-locker" value="locker" data-change="mode"${isDel ? '' : ' checked'}><label class="bk-mode-btn" for="mode-locker">${ICON.locker}<span>Pick up at a locker</span></label></div>
        <div class="bk-opt"><input class="bk-radio" type="radio" name="mode" id="mode-delivery" value="delivery" data-change="mode"${isDel ? ' checked' : ''}><label class="bk-mode-btn" for="mode-delivery">${ICON.truck}<span>Delivery</span><span class="bk-pill bk-pill-sun">2027</span></label></div>
      </fieldset>`;
    return {
      title: 'Book adventure gear online', docTitle: isDel ? 'Choose a delivery spot' : 'Choose a locker',
      eyebrow: 'Book online', step: '', photo: 'camp-hammock-lake-md.webp',
      lede: isDel
        ? 'Pick an approved spot, choose your gear and times, and pay here. We bring the gear to you.'
        : 'Choose a locker, pick your gear and times, and pay here. Then unlock it with the DailyAdventureBox app when you get there.',
      html: mode + (isDel ? deliveryHTML() : lockersHTML())
    };
  }
  function lockersHTML() {
    const list = Object.values(PLACES).filter(p => !p.private || state.privateUnlocked)
      .sort((a, b) => (b.private ? 1 : 0) - (a.private ? 1 : 0));
    const fe = ui.findError, ce = ui.codeError;
    return `<section class="bk-stack" aria-labelledby="chooseHead">
      <h2 class="bk-h2" id="chooseHead">Choose a locker</h2>
      <div class="bk-find-grid">
        <form class="bk-card" data-form="findNumber" novalidate>
          <label class="bk-label" for="lockerNumber">Have a locker number?</label>
          <p class="bk-hint" id="lockerNumberHint">Enter the 6-digit number printed on the locker.</p>
          <div class="bk-inline">
            <input class="bk-input" id="lockerNumber" name="lockerNumber" type="text" inputmode="numeric" autocomplete="off" maxlength="6" spellcheck="false" aria-describedby="lockerNumberHint${fe ? ' lockerNumberErr' : ''}"${fe ? ' aria-invalid="true"' : ''}>
            <button class="btn btn-green bk-btn-sm" type="submit" id="btnFind">Find</button>
          </div>
          ${fe ? errLine('lockerNumberErr', fe) : ''}
          ${tip('Sample locker numbers are 900101, 900102, 900103 and 900104.')}
        </form>
        <div class="bk-card">
          <button type="button" class="bk-disclosure" id="privateToggle" data-act="togglePrivate" aria-expanded="${ui.codeOpen ? 'true' : 'false'}" aria-controls="privatePanel">${ICON.key}<span>Have a private location code?</span>${ICON.chev}</button>
          <form class="bk-private-panel" id="privatePanel" data-form="privateCode" novalidate${ui.codeOpen ? '' : ' hidden'}>
            <label class="bk-label" for="privateCode">Private location code</label>
            <p class="bk-hint" id="privateCodeHint">Ask the front desk or community office for the code.</p>
            <div class="bk-inline">
              <input class="bk-input" id="privateCode" name="privateCode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="privateCodeHint${ce ? ' privateCodeErr' : ''}"${ce ? ' aria-invalid="true"' : ''}>
              <button class="btn btn-green bk-btn-sm" type="submit" id="btnCode">Use code</button>
            </div>
            ${ce ? errLine('privateCodeErr', ce) : ''}
            ${tip('Enter <strong>DEMO</strong> to see a sample private location.')}
          </form>
          ${state.privateUnlocked ? `<p class="bk-ok" role="status">${ICON.check}<span>Code accepted. Sample Harbor Hotel is at the top of the list.</span></p>` : ''}
        </div>
      </div>
      <div class="bk-note">${ICON.info}<p><strong>Not every DailyAdventureBox locker is listed here.</strong> Some are private to hotels, military bases and communities. Staying at one? Ask the front desk or community office how to book.</p></div>
      <ul class="bk-locker-list" aria-label="Lockers that take online bookings">${list.map(lockerCardHTML).join('')}</ul>
    </section>`;
  }
  function lockerCardHTML(p) {
    const today = todayIn(p.tz), open = !!p.hours[civil(today).wd];
    const kinds = p.gear.map(x => GEAR[x[0]].plural);
    return `<li class="bk-card bk-locker${p.private ? ' is-private' : ''}" data-act="pickLocker" data-id="${p.id}">
      <div class="bk-locker-media"><img src="${MEDIA + p.img}" alt="" loading="lazy" decoding="async"></div>
      <div class="bk-locker-body">
        ${p.private ? `<span class="bk-pill bk-pill-ocean">${ICON.key} Private</span>` : ''}
        <h3 class="bk-h3">${esc(p.name)}</h3>
        <p class="bk-meta">${ICON.pin}<span>${esc(p.town)}</span></p>
        <p class="bk-meta">${ICON.clock}<span>${open ? `Open today, ${esc(hoursText(p, today))}, ${zoneName(p.tz)}` : `Closed today. Hours are in ${zoneName(p.tz)}.`}</span></p>
        <ul class="bk-tags" aria-label="Gear at this locker">${kinds.map(k => `<li>${esc(k)}</li>`).join('')}</ul>
        ${p.private ? '<p class="bk-small">Private to hotel guests. Shown because you entered its code.</p>' : ''}
        <button type="button" class="btn btn-green bk-btn-sm bk-card-cta" data-act="pickLocker" data-id="${p.id}" id="pick-${p.id}">Choose this locker<span class="sr-only">: ${esc(p.name)}</span></button>
      </div>
    </li>`;
  }
  function deliveryHTML() {
    const d = state.draft, e = ui.errors || {};
    const sel = ui.spotSel !== undefined ? ui.spotSel : (d.spot ? d.spot.id : '');
    const spot = (s, title, note) => `<div class="bk-opt"><input class="bk-radio" type="radio" name="spot" id="spot-${s}" value="${s}" data-change="spot"${sel === s ? ' checked' : ''}>
      <label class="bk-spot" for="spot-${s}"><span class="bk-spot-dot" aria-hidden="true"></span><span><span class="bk-spot-name">${esc(title)}</span><span class="bk-spot-note">${esc(note)}</span></span></label></div>`;
    const proposedNote = d.spot && d.spot.proposed ? d.spot.note : '';
    return `<section class="bk-stack" aria-labelledby="spotHead">
      <h2 class="bk-h2" id="spotHead">Choose a delivery spot</h2>
      <div class="bk-card bk-delivery dark">
        <span class="bk-pill bk-pill-sun">Starts in 2027</span>
        <h3 class="bk-h3">We bring the gear to you</h3>
        <p>Delivery is by request, to spots DailyAdventureBox approves.</p>
        <ul class="check-list">
          <li><div><strong>2027 delivery area:</strong> from the Camp Lejeune area down to Wilmington, North Carolina.</div></li>
          <li><div><strong>Approved spots only:</strong> pick a listed spot, or suggest one and our team will check it.</div></li>
          <li><div><strong>Same account, same app:</strong> book and pay here. Your rental shows in the app when we hand you the gear.</div></li>
        </ul>
        ${tip('These spots, the delivery fee and the dates are samples. Delivery details are still being decided.')}
      </div>
      <form class="bk-card" data-form="spot" novalidate>
        ${errorsHTML()}
        <fieldset class="bk-fieldset" id="spotGroup"${e.spotGroup ? ' aria-describedby="spotGroupErr"' : ''}>
          <legend class="bk-legend">Delivery spot</legend>
          ${e.spotGroup ? errLine('spotGroupErr', e.spotGroup) : ''}
          <div class="bk-spots">
            ${DELIVERY.spots.map(s => spot(s.id, s.name, s.note)).join('')}
            ${spot('propose', 'Suggest a spot', 'Somewhere else inside the delivery area')}
          </div>
        </fieldset>
        ${sel === 'propose' ? `<div class="bk-propose">
          <label class="bk-label" for="spotAddress">Where should we meet you?</label>
          <p class="bk-hint" id="spotAddressHint">An address or a clear description inside the delivery area. Our team checks every suggested spot. If we can’t approve it, you get a full refund.</p>
          <textarea class="bk-input" id="spotAddress" rows="3" aria-describedby="spotAddressHint${e.spotAddress ? ' spotAddressErr' : ''}"${e.spotAddress ? ' aria-invalid="true"' : ''}>${esc(proposedNote)}</textarea>
          ${e.spotAddress ? errLine('spotAddressErr', e.spotAddress) : ''}
        </div>` : ''}
        <div class="bk-actions"><button class="btn btn-green" type="submit" id="btnSpot">Continue ${ICON.arrow}</button></div>
      </form>
    </section>`;
  }

  /* ------------------------------------------------------------------
     Screen 2: choose your gear
     ------------------------------------------------------------------ */
  function scrGear() {
    const place = draftPlace();
    if (!place) return { redirect: '' };
    const isDel = place.kind === 'delivery';
    return {
      title: 'Choose your gear', eyebrow: isDel ? 'Delivery preview' : place.name, step: 'gear', summary: true,
      html: `${backHTML('', isDel ? 'Back to delivery spots' : 'Back to lockers')}
        ${isDel ? deliveryHeaderHTML() : placeHeaderHTML(place)}
        <ul class="bk-gear-list" aria-label="Gear you can book">${place.gear.map(x => gearCardHTML(x[0], x[1].length)).join('')}</ul>`
    };
  }
  function placeHeaderHTML(p) {
    const today = todayIn(p.tz);
    const order = [1, 2, 3, 4, 5, 6, 0];
    return `<section class="bk-card bk-place" aria-labelledby="placeName">
      <div class="bk-place-top">
        <div>
          ${p.private ? `<span class="bk-pill bk-pill-ocean">${ICON.key} Private</span>` : ''}
          <h2 class="bk-h2" id="placeName">${esc(p.name)}</h2>
          <p class="bk-meta">${ICON.pin}<span>${esc(p.address)}</span></p>
        </div>
        <button type="button" class="btn btn-outline-dark bk-btn-sm" data-act="directions" data-id="${p.id}" id="btnDirections">${ICON.nav} Directions</button>
      </div>
      <p class="bk-meta">${ICON.clock}<span>Today: ${esc(hoursText(p, today))}, ${zoneName(p.tz)}</span></p>
      <details class="bk-details" id="allHours"><summary>All opening hours ${ICON.chev}</summary>
        <ul class="bk-hours-list">${order.map(wd => { const h = p.hours[wd]; return `<li><span>${WEEKDAYS[wd]}</span><span>${h ? `${minutesWords(h[0])} to ${minutesWords(h[1])}` : 'Closed'}</span></li>`; }).join('')}
          <li><span>Time zone</span><span>${zoneName(p.tz)}</span></li></ul>
      </details>
      ${p.private ? `<div class="bk-callout bk-callout-info">${ICON.key}<p>Private to hotel guests. You can book it because you entered its code.</p></div>` : ''}
      ${p.federal ? `<div class="bk-callout bk-callout-info">${ICON.info}<p>This locker is on federal property, so the Federal Rental Terms apply.</p></div>` : ''}
    </section>`;
  }
  function deliveryHeaderHTML() {
    const s = state.draft.spot;
    return `<section class="bk-card bk-place" aria-labelledby="placeName">
      <div class="bk-place-top"><div>
        <span class="bk-pill bk-pill-sun">Delivery preview, starts in 2027</span>
        <h2 class="bk-h2" id="placeName">${esc(s.name)}</h2>
        <p class="bk-meta">${ICON.pin}<span>${esc(s.note)}</span></p>
      </div></div>
      <p class="bk-meta">${ICON.clock}<span>Delivery hours: ${esc(minutesWords(DELIVERY.hours[0][0]))} to ${esc(minutesWords(DELIVERY.hours[0][1]))}, Eastern time. Book at least a day ahead.</span></p>
      <p class="bk-meta">${ICON.truck}<span>Delivery fee: ${money(DELIVERY.fee)} <span class="bk-sample-tag">Sample price</span></span></p>
      ${s.proposed ? `<div class="bk-callout bk-callout-info">${ICON.info}<p>Our team checks every suggested spot. If we can’t approve yours, you get a full refund.</p></div>` : ''}
    </section>`;
  }
  function gearCardHTML(key, free) {
    const g = GEAR[key], u = user(), done = safetyDone(u);
    const imgs = g.photos.map(p => `<img src="${MEDIA + p[0]}" alt="${esc(p[1])}" loading="lazy" decoding="async">`).join('');
    return `<li class="bk-card bk-gear${free ? '' : ' is-off'}"${free ? ` data-act="pickGear" data-key="${key}"` : ''}>
      <div class="bk-gear-media${g.photos.length > 1 ? ' two' : ''}">${imgs}</div>
      <div class="bk-gear-body">
        <h3 class="bk-h3">${esc(g.name)}</h3>
        <p class="bk-gear-desc">${esc(g.desc)}</p>
        <dl class="bk-facts">
          <div><dt>Price per hour</dt><dd>${money(g.rate)}</dd></div>
          <div><dt>Refundable hold</dt><dd>${money(g.hold)}</dd></div>
          <div><dt>Free to book</dt><dd>${free || 'None'}</dd></div>
        </dl>
        <p class="bk-small" style="margin:0"><span class="bk-sample-tag">Sample price</span></p>
        ${g.safety ? `<div class="bk-callout bk-callout-sun">${ICON.shield}<p>${done ? 'Your account has already done the identity check and the safety video.' : 'Before booking you’ll verify your identity and watch a 2-minute safety video. You only do this once.'}</p></div>` : ''}
        ${free
          ? `<button type="button" class="btn btn-green bk-btn-block" data-act="pickGear" data-key="${key}" id="gear-${key}">Choose ${esc(g.lower)}</button>`
          : '<p class="bk-off">None free to book online right now.</p>'}
      </div>
    </li>`;
  }

  /* ------------------------------------------------------------------
     Screen 3: pick your times
     ------------------------------------------------------------------ */
  function scrTimes() {
    const d = state.draft, place = draftPlace();
    if (!place) return { redirect: '' };
    if (!d.gearKey || !compsOf(place, d.gearKey).length) return { redirect: 'gear' };
    const g = GEAR[d.gearKey], isDel = place.kind === 'delivery', tz = place.tz, today = todayIn(tz);
    const days = bookingDays(place).map(iv => ({ iv, picks: pickupTimes(place, d.gearKey, iv.n) }));
    if (d.day === null || !days.some(x => x.iv.n === d.day)) {
      const first = days.find(x => x.picks.length) || days[0];
      d.day = first ? first.iv.n : null;
    }
    const cur = days.find(x => x.iv.n === d.day);
    const picks = cur ? cur.picks : [];
    if (d.pickup && !picks.includes(d.pickup)) { d.pickup = null; d.ret = null; d.retDay = null; }
    const rets = d.pickup ? returnTimes(place, d.gearKey, d.pickup) : [];
    if (d.ret && !rets.includes(d.ret)) d.ret = null;
    const e = ui.errors || {};
    const flash = state.flash; state.flash = null;

    const dayChips = days.map(({ iv, picks: p }) => {
      const rel = iv.n === today ? 'Today' : iv.n === today + 1 ? 'Tomorrow' : '';
      const bottom = [rel, p.length ? '' : 'Full'].filter(Boolean).join(', ');
      return dayChipHTML('day', iv.n, iv.n === d.day, '', bottom, !p.length);
    }).join('');

    let pickHTML;
    if (!picks.length) {
      const nf = d.day !== null ? nextFree(place, d.gearKey, d.day) : null;
      pickHTML = `<div class="bk-callout bk-callout-sun bk-full" id="fullMsg">
        <p><strong>Fully booked that day.</strong> ${nf ? `Next free time: ${esc(when(nf.t, tz))}.` : 'There are no free times in the next 60 days.'}</p>
        ${nf ? `<button type="button" class="btn btn-outline-dark bk-btn-sm" data-act="jumpTo" data-n="${nf.n}" data-t="${nf.t}" id="jumpNext">Choose that time</button>` : ''}
      </div>`;
    } else {
      pickHTML = `<div role="radiogroup" aria-label="${isDel ? 'Start' : 'Pickup'} times on ${esc(dateWords(d.day))}">${timeGroupsHTML(picks, tz, 'pickup', d.pickup)}</div>`;
    }

    let retHTML = '';
    if (d.pickup) {
      const byDay = new Map();
      rets.forEach(r => { const n = localDayOf(r, tz); if (!byDay.has(n)) byDay.set(n, []); byDay.get(n).push(r); });
      const rdays = Array.from(byDay.keys());
      if (d.retDay === null || !byDay.has(d.retDay)) d.retDay = d.ret ? localDayOf(d.ret, tz) : rdays[0];
      const pickDay = localDayOf(d.pickup, tz);
      const chips = rdays.map(n => {
        const count = byDay.get(n).length;
        return dayChipHTML('retday', n, n === d.retDay, n === pickDay ? 'Same day' : '', `${count} ${count === 1 ? 'time' : 'times'}`, false);
      }).join('');
      retHTML = `<fieldset class="bk-fieldset" id="returnGroup"${e.returnGroup ? ' aria-describedby="returnGroupErr"' : ''}>
        <legend class="bk-legend"><span class="bk-num">3</span>${isDel ? 'End time (we pick it up)' : 'Return time'}</legend>
        ${e.returnGroup ? errLine('returnGroupErr', e.returnGroup) : ''}
        <p class="bk-hint">From 1 to 72 hours after ${isDel ? 'the start' : 'pickup'}, while ${isDel ? 'we deliver' : 'the locker is open'}.</p>
        <div class="bk-days is-wrap" role="radiogroup" aria-label="${isDel ? 'End' : 'Return'} day">${chips}</div>
        <div style="margin-top:14px" role="radiogroup" aria-label="${isDel ? 'End' : 'Return'} times on ${esc(dateWords(d.retDay))}">${timeGroupsHTML(byDay.get(d.retDay) || [], tz, 'ret', d.ret, r => durWords(r - d.pickup))}</div>
      </fieldset>`;
    }

    const q = d.pickup && d.ret ? quote(place, d.gearKey, d.pickup, d.ret) : null;
    const priceText = q
      ? `${durWords(q.ms)} at ${money(g.rate)} an hour: ${money(q.subtotal)}${q.fee ? `, plus the ${money(q.fee)} delivery fee` : ''}, plus sales tax at checkout.`
      : `${money(g.rate)} an hour. Choose ${isDel ? 'a start and an end time' : 'a pickup and a return time'} to see your price.`;
    const chosen = d.pickup ? `<div class="bk-chosen">
        <div>${ICON.check}<span><strong>${isDel ? 'Start' : 'Pickup'}:</strong> ${esc(when(d.pickup, tz))}</span></div>
        ${d.ret ? `<div>${ICON.check}<span><strong>${isDel ? 'End' : 'Return'}:</strong> ${esc(when(d.ret, tz))}</span></div>` : ''}
      </div>` : '';

    return {
      title: 'Pick your times', eyebrow: `${g.name}, ${isDel ? 'delivery preview' : place.name}`, step: 'times', summary: true,
      html: `${backHTML('gear', 'Back to gear')}
        ${flash ? `<div class="bk-callout bk-callout-sun" role="alert">${ICON.alert}<p>${esc(flash)}</p></div>` : ''}
        <form class="bk-card" data-form="times" novalidate>
          ${errorsHTML()}
          <div class="bk-zone">${ICON.globe}<p>All times are in ${isDel ? 'the delivery area’s' : 'the locker’s'} own time: <strong>${zoneName(tz)}</strong>.${isDel ? ' Book at least a day ahead. These are sample dates; delivery starts in 2027.' : ''}</p></div>
          <fieldset class="bk-fieldset" id="dayGroup">
            <legend class="bk-legend"><span class="bk-num">1</span>Pick a day</legend>
            <div class="bk-scroller" id="dayScroller" data-keep-scroll><div class="bk-days">${dayChips}</div></div>
          </fieldset>
          <fieldset class="bk-fieldset" id="pickupGroup"${e.pickupGroup ? ' aria-describedby="pickupGroupErr"' : ''}>
            <legend class="bk-legend"><span class="bk-num">2</span>${isDel ? 'Start time (we bring the gear)' : 'Pickup time'}</legend>
            ${e.pickupGroup ? errLine('pickupGroupErr', e.pickupGroup) : ''}
            ${pickHTML}
          </fieldset>
          ${retHTML}
          ${chosen}
          <div class="bk-price" id="priceLine"><span>${priceText}</span><span class="bk-sample-tag">Sample price</span></div>
          <div class="bk-actions"><button class="btn btn-green" type="submit" id="timesContinue">Continue ${ICON.arrow}</button></div>
        </form>`,
      after: isNav => {
        if (!isNav) return;
        const sc = byId('dayScroller'), input = byId('day-' + d.day);
        if (sc && input && input.nextElementSibling) {
          sc.scrollLeft += input.nextElementSibling.getBoundingClientRect().left - sc.getBoundingClientRect().left - 8;
        }
      }
    };
  }

  /* ------------------------------------------------------------------
     Screen 4: sign in or create your account
     ------------------------------------------------------------------ */
  function scrAccount(standalone) {
    const d = state.draft, u = user();
    if (!standalone) {
      if (!draftPlace()) return { redirect: '' };
      if (!d.gearKey) return { redirect: 'gear' };
      if (!(d.pickup && d.ret)) return { redirect: 'times' };
    }
    if (u && !u.confirmed) return { redirect: 'confirm-email' };
    const base = {
      title: 'Sign in or create your account', eyebrow: standalone ? 'Your account' : 'Book online',
      step: standalone ? null : 'account', summary: !standalone
    };
    if (u) {
      base.title = standalone ? 'You’re signed in' : base.title;
      base.html = `${standalone ? '' : backHTML('times', 'Back to times')}
        <section class="bk-card" aria-labelledby="signedHead">
          <h2 class="bk-h2" id="signedHead">You’re signed in</h2>
          <p>Signed in as <strong>${esc(u.first + ' ' + u.last)}</strong> (${esc(u.email)}), the same account you use in the DailyAdventureBox app.</p>
          <div class="bk-btnrow">
            ${standalone ? '<a class="btn btn-green" href="#/bookings">My bookings</a>' : `<button type="button" class="btn btn-green" data-act="continueFlow" id="btnContinue">Continue ${ICON.arrow}</button>`}
            <button type="button" class="btn btn-outline-dark" data-act="signOut" id="btnSignOut2">Use a different account</button>
          </div>
        </section>`;
      return base;
    }
    base.html = (standalone ? '' : backHTML('times', 'Back to times')) + authHTML();
    return base;
  }
  function authHTML() {
    const view = state.authView === 'create' ? 'create' : 'signin';
    return `<section class="bk-card bk-auth" aria-labelledby="authHead">
        <h2 class="bk-h2" id="authHead">${view === 'create' ? 'Create your account' : 'Sign in'}</h2>
        <p class="bk-lead">Use the same account as the DailyAdventureBox app.</p>
        ${ui.steer ? steerHTML(ui.steer) : ''}
        <div class="bk-social">
          <button type="button" class="bk-social-btn bk-apple" data-act="social" data-provider="apple" id="btnApple">${ICON.apple}<span>Continue with Apple</span></button>
          <button type="button" class="bk-social-btn bk-google" data-act="social" data-provider="google" id="btnGoogle">${ICON.google}<span>Continue with Google</span></button>
        </div>
        <p class="bk-or"><span>or with email</span></p>
        ${view === 'create' ? createFormHTML() : signInFormHTML()}
      </section>
      ${tip('Apple and Google sign you in as a sample customer. With email, any address and a password of 8 or more characters work. Try <strong>google@example.com</strong> to see the message for an email that already has an account through Google.')}`;
  }
  function steerHTML(s) {
    const pname = s.provider === 'apple' ? 'Apple' : 'Google';
    const msg = s.provider === 'email'
      ? 'This email already has a DailyAdventureBox account with a password. Sign in with your email and password.'
      : `This email already has a DailyAdventureBox account through ${pname}. Continue with ${pname}.`;
    const btn = s.provider === 'email' ? '' : `<button type="button" class="bk-social-btn ${s.provider === 'apple' ? 'bk-apple' : 'bk-google'}" data-act="social" data-provider="${s.provider}" data-email="${esc(s.email)}" id="btnSteer">${s.provider === 'apple' ? ICON.apple : ICON.google}<span>Continue with ${pname}</span></button>`;
    return `<div class="bk-callout bk-callout-sun bk-steer" id="steerMsg" tabindex="-1" role="alert">${ICON.info}<div class="bk-callout-body"><p>${msg}</p>${btn}</div></div>`;
  }
  function signInFormHTML() {
    return `<form class="bk-form" data-form="signIn" novalidate aria-label="Sign in with email">
      ${errorsHTML()}
      ${fieldHTML({ id: 'siEmail', label: 'Email', type: 'email', autocomplete: 'email', inputmode: 'email' })}
      ${fieldHTML({ id: 'siPass', label: 'Password', type: 'password', autocomplete: 'current-password' })}
      <p class="bk-forgot"><button type="button" class="bk-linkbtn" data-act="forgot" id="btnForgot">Forgot password?</button></p>
      <button class="btn btn-green bk-btn-block" type="submit" id="btnSignIn">Sign in</button>
      <p class="bk-switch">New here? <button type="button" class="bk-linkbtn" data-act="authView" data-view="create" id="toCreate">Create an account</button></p>
    </form>`;
  }
  function createFormHTML() {
    const e = ui.errors || {};
    return `<form class="bk-form" data-form="create" novalidate aria-label="Create an account">
      ${errorsHTML()}
      <div class="bk-two">
        ${fieldHTML({ id: 'cFirst', label: 'First name', autocomplete: 'given-name' })}
        ${fieldHTML({ id: 'cLast', label: 'Last name', autocomplete: 'family-name' })}
      </div>
      ${fieldHTML({ id: 'cEmail', label: 'Email', type: 'email', autocomplete: 'email', inputmode: 'email' })}
      ${fieldHTML({ id: 'cPass', label: 'Password', type: 'password', autocomplete: 'new-password', hint: 'At least 8 characters.' })}
      <div class="bk-check${e.cAdult ? ' has-error' : ''}"><input type="checkbox" id="cAdult"${e.cAdult ? ' aria-invalid="true" aria-describedby="cAdultErr"' : ''}><label for="cAdult">I am 18 or older</label></div>
      ${e.cAdult ? errLine('cAdultErr', e.cAdult) : ''}
      <button class="btn btn-green bk-btn-block" type="submit" id="btnCreate" style="margin-top:18px">Create account</button>
      <p class="bk-switch">Already have an account? <button type="button" class="bk-linkbtn" data-act="authView" data-view="signin" id="toSignIn">Sign in</button></p>
    </form>`;
  }

  /* ------------------------------------------------------------------
     Screen 5: confirm your email (new email-and-password accounts only)
     ------------------------------------------------------------------ */
  function scrConfirmEmail() {
    const u = user(), s = state.signup, flow = !!(s && s.flow);
    if (!u) return { redirect: 'sign-in' };
    if (u.confirmed && !ui.confirmedShown) return { redirect: flow ? nextFlowStep() : (state.afterSignIn || 'bookings') };
    return {
      title: 'Confirm your email', eyebrow: flow ? 'Book online' : 'Your account', step: flow ? 'account' : null, summary: flow,
      html: `<section class="bk-card bk-center" aria-labelledby="ceHead">
          <div class="bk-icon-circle">${ICON.mail}</div>
          <h2 class="bk-h2" id="ceHead">Check your inbox</h2>
          <p>We sent a confirmation link to <strong>${esc(u.email)}</strong>. Open it, then come back here. This page updates by itself.</p>
          <p class="bk-status-line" role="status" id="ceStatus">${ui.confirmedShown
            ? `${ICON.check}<span>Email confirmed. Continuing…</span>`
            : `<span class="bk-spinner" aria-hidden="true"></span><span>${ui.linkOpened ? 'Checking…' : 'Waiting for you to open the link'}</span>`}</p>
          ${ui.resent ? `<p class="bk-ok" style="justify-content:center">${ICON.check}<span>We sent a new link to ${esc(u.email)}.</span></p>` : ''}
          <div class="bk-btnrow" style="justify-content:center"><button type="button" class="btn btn-outline-dark" data-act="resend" id="btnResend">Resend</button></div>
          <p class="bk-switch">Wrong email? <button type="button" class="bk-linkbtn" data-act="startOver" id="btnStartOver">Start over</button></p>
          ${tip(`There’s no real email in this prototype. <button type="button" class="btn btn-sun bk-btn-sm" data-act="simulateConfirm" id="btnSimConfirm">Pretend I opened the link</button>`)}
        </section>`,
      after: () => {
        // Stands in for polling GET /Auth/profile/get-for-current-user until the email is confirmed.
        timers.push(setInterval(() => {
          const now = user();
          if (!now || !now.confirmed || ui.confirmedShown) return;
          ui.confirmedShown = true;
          announce('Email confirmed. Continuing.');
          rerender();
          timers.push(setTimeout(() => {
            const sg = state.signup, inFlow = !!(sg && sg.flow);
            state.signup = null;
            const to = inFlow ? nextFlowStep() : (state.afterSignIn || 'bookings');
            state.afterSignIn = null;
            go(to);
          }, 1200));
        }, 1500));
      }
    };
  }

  /* ------------------------------------------------------------------
     Screen 6: two quick safety steps (kayaks, paddle boards, surfboards; once per account)
     ------------------------------------------------------------------ */
  function scrSafety() {
    const d = state.draft, u = user();
    if (!draftPlace()) return { redirect: '' };
    if (!d.gearKey) return { redirect: 'gear' };
    if (!(d.pickup && d.ret)) return { redirect: 'times' };
    if (!u) return { redirect: 'account' };
    if (!u.confirmed) return { redirect: 'confirm-email' };
    const g = GEAR[d.gearKey];
    if (!g.safety) return { redirect: 'pay' };
    d.safetySeen = true;
    const idvDone = u.idv === 'processing' || u.idv === 'verified';
    const vidDone = !!u.video;
    const pct = vidDone ? 100 : Math.round(video.pos / VIDEO_SECONDS * 100);
    const t = vidDone ? VIDEO_SECONDS : video.pos;
    const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    return {
      title: 'Two quick safety steps', eyebrow: 'Book online', step: 'safety', summary: true,
      html: `${backHTML('times', 'Back to times')}
        <form class="bk-stack" data-form="safety" novalidate>
          ${errorsHTML()}
          <p class="bk-lead" style="margin:0">Before you can book a ${esc(g.lower)}:</p>
          <ol class="bk-safety" role="list">
            <li class="bk-card bk-safety-step${idvDone ? ' is-done' : ''}">
              <div class="bk-safety-head"><span class="bk-safety-mark" aria-hidden="true">${idvDone ? ICON.check : '1'}</span><h2 class="bk-h3">Verify your identity</h2></div>
              <p>Take a photo of your photo identification and a selfie on our partner Stripe’s secure page, which opens in a new tab.</p>
              ${idvDone
                ? `<p class="bk-ok" id="idvStatus">${ICON.check}<span>${u.idv === 'verified' ? 'Done. Your identity is verified.' : 'Done. Stripe is checking your photos, and you can keep going.'}</span></p>`
                : `<button type="button" class="btn btn-green" data-act="startIdv" id="btnIdv">Verify your identity ${ICON.external}</button>`}
            </li>
            <li class="bk-card bk-safety-step${vidDone ? ' is-done' : ''}">
              <div class="bk-safety-head"><span class="bk-safety-mark" aria-hidden="true">${vidDone ? ICON.check : '2'}</span><h2 class="bk-h3">Watch the 2-minute safety video</h2></div>
              <div class="bk-video">
                <div class="bk-video-screen">
                  <img src="${MEDIA}boat-life-jackets-md.webp" alt="">
                  <span class="bk-video-label">Sample safety video</span>
                  ${vidDone ? '' : `<button type="button" class="bk-video-big" data-act="videoToggle" tabindex="-1" aria-hidden="true">${video.playing ? ICON.pause : ICON.play}</button>`}
                </div>
                <div class="bk-video-bar" id="videoProgress" role="progressbar" aria-label="Safety video progress" aria-valuemin="0" aria-valuemax="${VIDEO_SECONDS}" aria-valuenow="${Math.round(t)}" aria-valuetext="${clock(t)} of 2:00"><span id="videoBar" style="width:${pct}%"></span></div>
                <div class="bk-video-controls">
                  ${vidDone ? `<span class="bk-ok" style="margin:0;color:#fff">${ICON.check}<span>Watched</span></span>` : `<button type="button" class="bk-video-btn" data-act="videoToggle" id="videoBtn">${video.playing ? ICON.pause + '<span>Pause</span>' : ICON.play + `<span>${video.pos ? 'Keep watching' : 'Play the video'}</span>`}</button>`}
                  <span class="bk-video-time" id="videoTime">${clock(t)} of 2:00</span>
                </div>
              </div>
            </li>
          </ol>
          ${tip('The identity check is simulated, and the sample video plays in about 8 seconds.')}
          <div class="bk-actions" style="margin-top:0"><button class="btn btn-green" type="submit" id="btnSafety">Continue to review and pay ${ICON.arrow}</button></div>
        </form>`,
      after: () => { if (video.playing && !vidDone) startVideo(); }
    };
  }
  function startVideo() {
    timers.push(setInterval(() => {
      if (!video.playing) return;
      video.pos = Math.min(VIDEO_SECONDS, video.pos + VIDEO_STEP);
      const bar = byId('videoBar'), time = byId('videoTime'), prog = byId('videoProgress');
      const clock = `${Math.floor(video.pos / 60)}:${String(Math.floor(video.pos % 60)).padStart(2, '0')}`;
      if (bar) bar.style.width = `${video.pos / VIDEO_SECONDS * 100}%`;
      if (time) time.textContent = `${clock} of 2:00`;
      if (prog) { prog.setAttribute('aria-valuenow', String(Math.round(video.pos))); prog.setAttribute('aria-valuetext', `${clock} of 2:00`); }
      if (video.pos >= VIDEO_SECONDS) {
        video.playing = false;
        const u = user();
        if (u) u.video = true;   // stands in for POST /Auth/profile/acknowledge-safety-tutorial
        announce('Safety video finished.');
        ui.focus = safetyDone(u) ? 'btnSafety' : 'btnIdv';
        rerender();
      }
    }, 200));
  }

  /* ------------------------------------------------------------------
     Screen 7: review and pay
     ------------------------------------------------------------------ */
  function scrPay() {
    const d = state.draft, place = draftPlace(), u = user();
    if (!place) return { redirect: '' };
    if (!d.gearKey) return { redirect: 'gear' };
    if (!(d.pickup && d.ret)) return { redirect: 'times' };
    if (!u) return { redirect: 'account' };
    if (!u.confirmed) return { redirect: 'confirm-email' };
    const g = GEAR[d.gearKey];
    if (g.safety && !safetyDone(u)) return { redirect: 'safety' };
    const isDel = place.kind === 'delivery', tz = place.tz;

    // Stands in for POST /Bookings/holds: one compartment held for 20 minutes.
    const key = holdKey(d);
    if (!state.hold || state.hold.key !== key) {
      const comp = freeComp(place, d.gearKey, d.pickup, d.ret);
      if (comp === null || d.pickup < Date.now() + leadOf(place)) {
        d.pickup = null; d.ret = null; d.retDay = null; state.hold = null;
        state.flash = 'Those times were just taken. Please pick new times.';
        return { redirect: 'times' };
      }
      state.hold = { key, comp, expiresAt: Date.now() + HOLD_MS, extended: false };
    }
    const h = state.hold, left = h.expiresAt - Date.now(), expired = left <= 0;
    const q = quote(place, d.gearKey, d.pickup, d.ret);
    const termsUrl = place.federal ? TERMS_URL.federal : TERMS_URL.general;
    const termsName = place.federal ? 'Federal Rental Terms' : 'Rental Terms';
    const holdWhat = isDel ? `your ${esc(g.lower)}` : `compartment ${h.comp}`;
    const e = ui.errors || {};

    const timer = expired
      ? `<div class="bk-timer is-expired" role="alert" id="holdBox">${ICON.clock}<p class="bk-timer-text" id="holdText" tabindex="-1">Your hold ended, so ${holdWhat} was released.</p><button type="button" class="btn btn-green bk-btn-sm" data-act="rehold" id="btnRehold">Hold it again</button></div>`
      : `<div class="bk-timer${left < 2 * MIN ? ' is-low' : ''}" id="holdBox">${ICON.clock}<p class="bk-timer-text" id="holdText" tabindex="-1">We’re holding ${holdWhat} for you: <strong id="holdLeft">${mmss(left)}</strong></p>${h.extended
        ? '<span class="bk-timer-note">10 extra minutes added</span>'
        : '<button type="button" class="bk-timer-btn" data-act="extendHold" id="btnExtend">Need more time?</button>'}</div>`;

    const rows = [
      isDel ? ['Delivery spot', `${esc(d.spot.name)}<br><span class="bk-muted">${esc(d.spot.note)}</span>`] : ['Locker', `${esc(place.name)}<br><span class="bk-muted">${esc(place.address)}</span>`],
      ['Gear', esc(g.name)]
    ];
    if (!isDel) rows.push(['Compartment', String(h.comp)]);
    rows.push([isDel ? 'Start (we bring it)' : 'Pickup', esc(when(d.pickup, tz))], [isDel ? 'End (we pick it up)' : 'Return', esc(when(d.ret, tz))]);

    const payLabel = ui.paying
      ? '<span class="bk-spinner" aria-hidden="true"></span><span>Confirming with your bank</span>'
      : `${ICON.lock}<span>Pay ${money(q.total)} (sample)</span>`;
    const blocked = ui.paying || expired;

    return {
      title: 'Review and pay', eyebrow: 'Book online', step: 'pay', summary: false,
      html: `${backHTML('times', 'Back to times')}
        ${timer}
        <section class="bk-card" aria-labelledby="reviewHead">
          <h2 class="bk-h2" id="reviewHead">Your booking</h2>
          ${dlHTML(rows)}
          <table class="bk-ptable"><caption class="sr-only">Price</caption><tbody>
            <tr><th scope="row">${durWords(q.ms)} at ${money(g.rate)} an hour</th><td>${money(q.subtotal)}</td></tr>
            ${q.fee ? `<tr><th scope="row">Delivery fee</th><td>${money(q.fee)}</td></tr>` : ''}
            <tr><th scope="row">Sales tax</th><td>${money(q.tax)}</td></tr>
            <tr class="is-total"><th scope="row">Total</th><td>${money(q.total)}</td></tr>
          </tbody></table>
          <p class="bk-small"><span class="bk-sample-tag">Sample prices</span> Sales tax comes from the ${isDel ? 'delivery spot’s' : 'locker’s'} address.</p>
        </section>
        <section class="bk-card bk-terms" aria-labelledby="termsHead">
          <h2 class="bk-h2" id="termsHead">Before you pay</h2>
          <h3>Refundable hold</h3>
          <p>A refundable hold of ${money(g.hold)} is placed on your card 24 hours before ${isDel ? 'your start time' : 'pickup'}, or right away if ${isDel ? 'that' : 'pickup'} is sooner, and released after you return the gear.</p>
          <h3>Cancellation</h3>
          <p>Free cancellation until your ${isDel ? 'start' : 'pickup'} time, ${esc(when(d.pickup, tz))}. No refund if you miss your ${isDel ? 'delivery' : 'pickup'}.</p>
          ${place.federal ? `<div class="bk-callout bk-callout-info" style="margin-bottom:12px">${ICON.info}<p>This locker is on federal property, so the Federal Rental Terms apply.</p></div>` : ''}
          <p>Read the <a class="bk-a" href="${termsUrl}" target="_blank" rel="noopener noreferrer">${termsName}<span class="sr-only"> (opens in a new tab)</span></a> and the <a class="bk-a" href="${PRIVACY_URL}" target="_blank" rel="noopener noreferrer">Privacy Policy<span class="sr-only"> (opens in a new tab)</span></a>.</p>
        </section>
        <form class="bk-card" data-form="pay" novalidate aria-labelledby="payHead">
          <h2 class="bk-h2" id="payHead">Pay</h2>
          ${errorsHTML()}
          <div class="bk-check${e.agree ? ' has-error' : ''}">
            <input type="checkbox" id="agree"${e.agree ? ' aria-invalid="true" aria-describedby="agreeErr"' : ''}>
            <label for="agree">I agree to the Rental Terms and the cancellation rules, and I allow DailyAdventureBox to save this card to place a refundable hold before my rental and to charge it for late returns or damage as the terms describe.</label>
          </div>
          ${e.agree ? errLine('agreeErr', e.agree) : ''}
          ${cardFormHTML('pay', true)}
          <button class="btn btn-green bk-btn-block bk-pay" type="submit" id="payBtn"${blocked ? ' aria-disabled="true"' : ''}${ui.paying ? ' aria-busy="true"' : ''}>${payLabel}</button>
          ${expired ? '<p class="bk-small">Hold the compartment again to pay.</p>' : ''}
          ${tip('Card details, Apple Pay and Google Pay are samples. Tick the box and tap Pay to see the confirmation.')}
        </form>`,
      after: () => {
        if (expired) return;
        timers.push(setInterval(() => {
          const hh = state.hold, span = byId('holdLeft');
          if (!hh || !span) return;
          const l = hh.expiresAt - Date.now();
          if (l <= 0) { announce('Your hold ended, and the compartment was released.'); rerender(); return; }
          span.textContent = mmss(l);
          const box = byId('holdBox');
          if (box) box.classList.toggle('is-low', l < 2 * MIN);
          if (l <= 5 * MIN && !hh.warned5) { hh.warned5 = true; announce('5 minutes left on your hold.'); }
          if (l <= MIN && !hh.warned1) { hh.warned1 = true; announce('1 minute left on your hold.'); }
        }, 1000));
      }
    };
  }
  function createBooking() {
    const d = state.draft, place = draftPlace(), g = GEAR[d.gearKey], u = user();
    const q = quote(place, d.gearKey, d.pickup, d.ret);
    const within = d.pickup - Date.now() <= DAY;
    const code = state.firstCodeUsed || findBooking(FIRST_CODE) ? newCode() : FIRST_CODE;
    state.firstCodeUsed = true;
    const b = {
      code, owner: u.email, mode: d.mode, placeId: place.id, spot: d.spot ? Object.assign({}, d.spot) : null, gearKey: d.gearKey,
      pickup: d.pickup, ret: d.ret, comp: state.hold.comp, rate: g.rate, holdAmt: g.hold,
      subtotal: q.subtotal, fee: q.fee, tax: q.tax, total: q.total,
      // Within 24 hours the refundable hold is tried at once; in this prototype the bank always asks to confirm.
      status: within ? 'attention' : 'booked', card: '4242', createdAt: Date.now()
    };
    state.bookings.unshift(b);
    state.last = b.code;
    state.lastSteps = { mode: d.mode, gearKey: d.gearKey, safetySeen: d.safetySeen };
    state.hold = null;
    state.draft = newDraft(d.mode);
    save();
    return b;
  }

  /* ------------------------------------------------------------------
     Screen 8: you're booked
     ------------------------------------------------------------------ */
  function scrBooked() {
    const b = findBooking(state.last), u = user();
    if (!b || !u || b.owner !== u.email) return { redirect: '' };
    const place = placeOf(b), isDel = b.mode === 'delivery';
    const next = isDel
      ? `<ol class="bk-nextlist" role="list">
          <li><span><a class="bk-a" href="${APP_URL}" target="_blank" rel="noopener noreferrer">Get the DailyAdventureBox app<span class="sr-only"> (opens in a new tab)</span></a>.</span></li>
          <li><span>Sign in with the same account.</span></li>
          <li><span>The first time, finish your profile and sign the rental agreement, about 2 minutes.</span></li>
          <li><span>Meet our team at the spot at your start time. Your rental shows in the app when we hand you the gear.</span></li>
        </ol>
        ${b.spot.proposed ? `<div class="bk-callout bk-callout-info">${ICON.info}<p>Our team checks your suggested spot and emails you when it’s approved. If we can’t approve it, you get a full refund.</p></div>` : ''}`
      : `<ol class="bk-nextlist" role="list">
          <li><span><a class="bk-a" href="${APP_URL}" target="_blank" rel="noopener noreferrer">Get the DailyAdventureBox app<span class="sr-only"> (opens in a new tab)</span></a>.</span></li>
          <li><span>Sign in with the same account.</span></li>
          <li><span>The first time, finish your profile and sign the rental agreement, about 2 minutes.</span></li>
          <li><span>At pickup, turn on Bluetooth, open the app, tap Active Rental, then Open Box.</span></li>
        </ol>
        <div class="bk-callout bk-callout-info">${ICON.info}<p>Your rental appears in the app 15 minutes before pickup. If the app is already open, close it and open it again.</p></div>`;
    const cardOk = ui.cardOk === b.code
      ? `<div class="bk-callout bk-callout-ok" role="status" id="cardOkMsg" tabindex="-1">${ICON.check}<p>Card confirmed. Your ${money(b.holdAmt)} refundable hold is in place. It’s released after you return the gear.</p></div>`
      : '';
    return {
      title: 'You’re booked!', eyebrow: 'Book online', step: 'booked', summary: false,
      html: `<section class="bk-card" aria-labelledby="bookedCode">
          <div class="bk-booked-head"><span class="bk-booked-check" aria-hidden="true">${ICON.check}</span>
            <div><p class="bk-code" id="bookedCode">Booking code <strong>${b.code}</strong></p>
            <p class="bk-small" style="margin-top:4px">A confirmation email with a calendar file goes to ${esc(u.email)}. In this prototype, no email is sent.</p></div>
          </div>
          ${detailsDL(b)}
          <div class="bk-btnrow">
            <button type="button" class="btn btn-green" data-act="ics" data-code="${b.code}" id="btnIcs">${ICON.calendar} Add to calendar</button>
            <button type="button" class="btn btn-outline-dark" data-act="directions" data-code="${b.code}" id="btnDir">${ICON.nav} Directions</button>
            <a class="btn btn-outline-dark" href="#/bookings/${b.code}" id="btnManage">Manage booking</a>
          </div>
        </section>
        ${b.status === 'attention' ? cardStepHTML(b, true) : cardOk}
        <section class="bk-card" aria-labelledby="nextHead">
          <div class="bk-next-grid">
            <div>
              <h2 class="bk-h2" id="nextHead">Next steps</h2>
              ${next}
            </div>
            ${isDel ? '' : phoneSketchHTML(b)}
          </div>
        </section>`
    };
  }

  /* ------------------------------------------------------------------
     Screen 9: my bookings, and one booking
     ------------------------------------------------------------------ */
  function signInPrompt(after) {
    return `<section class="bk-card bk-center" aria-labelledby="needSignIn">
      <div class="bk-icon-circle">${ICON.lock}</div>
      <h2 class="bk-h2" id="needSignIn">Sign in to see your bookings</h2>
      <p>Use the same account as the DailyAdventureBox app.</p>
      <div class="bk-btnrow" style="justify-content:center"><button type="button" class="btn btn-green" data-act="signInFor" data-after="${after}" id="btnSignInFor">Sign in</button></div>
    </section>`;
  }
  function scrBookings() {
    const u = user();
    if (!u || !u.confirmed) return { title: 'My bookings', eyebrow: 'Your account', html: signInPrompt('bookings') };
    const mine = state.bookings.filter(b => b.owner === u.email);
    const up = mine.filter(b => UPCOMING.includes(b.status)).sort((a, b) => a.pickup - b.pickup);
    const past = mine.filter(b => !UPCOMING.includes(b.status)).sort((a, b) => b.pickup - a.pickup);
    const tab = state.tab === 'past' ? 'past' : 'upcoming';
    const list = tab === 'past' ? past : up;
    const tabBtn = (v, label, n) => `<div class="bk-opt"><input class="bk-radio" type="radio" name="tab" id="tab-${v}" value="${v}" data-change="tab"${tab === v ? ' checked' : ''}><label class="bk-tab" for="tab-${v}">${label} (${n})</label></div>`;
    return {
      title: 'My bookings', eyebrow: 'Your account',
      html: `<div class="bk-bookings-top">
          <p class="bk-muted">Signed in as <strong>${esc(u.first + ' ' + u.last)}</strong> (${esc(u.email)})</p>
          <fieldset class="bk-tabs"><legend class="sr-only">Show bookings</legend>${tabBtn('upcoming', 'Upcoming', up.length)}${tabBtn('past', 'Past', past.length)}</fieldset>
        </div>
        ${list.length
          ? `<ul class="bk-booking-list" aria-label="${tab === 'past' ? 'Past' : 'Upcoming'} bookings">${list.map(bookingCardHTML).join('')}</ul>`
          : `<p class="bk-card">No ${tab} bookings yet.</p>`}
        ${tip('The first bookings in this list are sample history, so you can see each status.')}
        <div class="bk-actions" style="margin-top:0"><a class="btn btn-green" href="#/">Book more gear ${ICON.arrow}</a></div>`
    };
  }
  function bookingCardHTML(b) {
    const place = placeOf(b), g = GEAR[b.gearKey], tz = place.tz;
    const acts = [];
    if (b.status === 'attention') acts.push(`<a class="btn btn-green bk-btn-sm" href="#/bookings/${b.code}/confirm-card">Confirm your card</a>`);
    acts.push(`<a class="btn btn-outline-dark bk-btn-sm" href="#/bookings/${b.code}">View<span class="sr-only"> booking ${b.code}</span></a>`);
    if (CHANGEABLE.includes(b.status)) {
      acts.push(`<a class="btn btn-outline-dark bk-btn-sm" href="#/bookings/${b.code}/change">Change time<span class="sr-only"> for booking ${b.code}</span></a>`);
    }
    if (UPCOMING.includes(b.status)) acts.push(`<a class="btn btn-outline-dark bk-btn-sm" href="#/bookings/${b.code}/cancel">Cancel<span class="sr-only"> booking ${b.code}</span></a>`);
    const note = {
      attention: 'Your bank asked us to confirm your card for the refundable hold.',
      ready: `Open the app and tap Active Rental to unlock compartment ${b.comp}.`,
      hold: `Your ${money(b.holdAmt)} refundable hold is in place.`
    }[b.status];
    return `<li class="bk-card bk-booking">
      <div class="bk-booking-top">${statusChip(b.status)}<span class="bk-code-sm">Booking code ${b.code}</span></div>
      <h3 class="bk-h3">${esc(g.name)}: ${esc(placeLabel(b))}</h3>
      <p class="bk-booking-when">${ICON.clock}<span>${esc(when(b.pickup, tz))}<br>to ${esc(when(b.ret, tz))}</span></p>
      ${note ? `<p class="bk-small">${esc(note)}</p>` : ''}
      <div class="bk-booking-actions">${acts.join('')}</div>
    </li>`;
  }
  function statusExplainer(b) {
    const map = {
      booked: `Your refundable hold of ${money(b.holdAmt)} is placed on your card 24 hours before ${b.mode === 'delivery' ? 'your start time' : 'pickup'}. ${b.mode === 'delivery' ? '' : 'Your rental appears in the app 15 minutes before pickup.'}`,
      hold: `Your refundable hold of ${money(b.holdAmt)} is in place. It’s released after you return the gear.`,
      attention: 'Your bank asked us to confirm your card before we place the refundable hold. It only takes a moment.',
      ready: `Your rental is ready. Open the DailyAdventureBox app, tap Active Rental, then Open Box to unlock compartment ${b.comp}. If the app is already open, close it and open it again.`,
      completed: 'You returned the gear, and the refundable hold was released.',
      missed: 'The locker wasn’t opened before the return time, so this booking closed as a missed pickup. The rental price wasn’t refunded, and the refundable hold was released.',
      cancelled: `You cancelled this booking. ${money(b.total)} went back to the card ending ${b.card}.`
    };
    return `<div class="bk-callout ${b.status === 'attention' ? 'bk-callout-sun' : 'bk-callout-info'}">${ICON.info}<p>${esc(map[b.status])}</p></div>`;
  }
  function scrBookingDetail(b) {
    const g = GEAR[b.gearKey];
    const upcoming = UPCOMING.includes(b.status);
    return {
      title: 'Your booking', docTitle: `Booking ${b.code}`, eyebrow: 'My bookings',
      html: `${backHTML('bookings', 'Back to my bookings')}
        <section class="bk-card" aria-labelledby="detailHead">
          <div class="bk-booking-top">${statusChip(b.status)}<span class="bk-code-sm">Booking code ${b.code}</span></div>
          <h2 class="bk-h2" id="detailHead">${esc(g.name)}: ${esc(placeLabel(b))}</h2>
          ${statusExplainer(b)}
          <div style="margin-top:16px">${detailsDL(b)}</div>
          <div class="bk-btnrow">
            ${b.status === 'attention' ? `<a class="btn btn-green" href="#/bookings/${b.code}/confirm-card">Confirm your card</a>` : ''}
            ${upcoming ? `<button type="button" class="btn ${b.status === 'attention' ? 'btn-outline-dark' : 'btn-green'}" data-act="ics" data-code="${b.code}" id="btnIcs">${ICON.calendar} Add to calendar</button>` : ''}
            ${upcoming ? `<button type="button" class="btn btn-outline-dark" data-act="directions" data-code="${b.code}" id="btnDir">${ICON.nav} Directions</button>` : ''}
            ${CHANGEABLE.includes(b.status) ? `<a class="btn btn-outline-dark" href="#/bookings/${b.code}/change">Change time</a>` : ''}
            ${upcoming ? `<a class="btn btn-outline-dark" href="#/bookings/${b.code}/cancel">Cancel</a>` : ''}
          </div>
        </section>`
    };
  }

  /* ------------------------------------------------------------------
     Screen 10: change your time (same length, same price)
     ------------------------------------------------------------------ */
  function scrChange(b) {
    const place = placeOf(b), tz = place.tz, len = b.ret - b.pickup, g = GEAR[b.gearKey];
    const head = backHTML('bookings/' + b.code, 'Back to this booking');
    const base = { title: 'Change your time', eyebrow: `Booking code ${b.code}` };
    if (ui.changed) {
      const c = ui.changed;
      base.html = `${head}<section class="bk-card" aria-labelledby="changedHead">
          <div class="bk-callout bk-callout-ok" role="status" style="margin-bottom:16px">${ICON.check}<p id="changedHead"><strong>Your booking is moved.</strong> Same price, nothing to pay.</p></div>
          ${detailsDL(b)}
          ${c.oldComp !== b.comp && b.mode !== 'delivery' ? `<p class="bk-small">Your compartment changed from ${c.oldComp} to ${b.comp}.</p>` : ''}
          <p class="bk-small">We email you the new times with a new calendar file. In this prototype, no email is sent.</p>
          <div class="bk-btnrow">
            <button type="button" class="btn btn-green" data-act="ics" data-code="${b.code}" id="btnIcs">${ICON.calendar} Add to calendar</button>
            <a class="btn btn-outline-dark" href="#/bookings">Back to my bookings</a>
          </div>
        </section>`;
      return base;
    }
    if (b.status === 'ready') {
      base.html = `${head}<section class="bk-card"><p>Your rental is ready to unlock, so its time can’t be changed here. To cancel before you open the locker, use the app: Contact Us, then Cancel rental, within 10 minutes of your start time.</p></section>`;
      return base;
    }
    if (!CHANGEABLE.includes(b.status)) {
      base.html = `${head}<section class="bk-card"><p>This booking can’t be changed. Its status is ${esc(STATUS[b.status].toLowerCase())}.</p></section>`;
      return base;
    }
    const days = bookingDays(place).map(iv => ({ iv, starts: changeStarts(b, iv.n) })).filter(x => x.starts.length);
    if (ui.chDay === undefined || !days.some(x => x.iv.n === ui.chDay)) ui.chDay = days.length ? days[0].iv.n : null;
    const sel = days.find(x => x.iv.n === ui.chDay);
    const e = ui.errors || {};
    const endLabel = t => {
      const r = t + len;
      return localDayOf(r, tz) === localDayOf(t, tz) ? `to ${timeOf(r, tz)}` : `to ${WEEKDAYS[civil(localDayOf(r, tz)).wd]}, ${timeOf(r, tz)}`;
    };
    const chips = days.map(x => dayChipHTML('chday', x.iv.n, x.iv.n === ui.chDay, '', `${x.starts.length} ${x.starts.length === 1 ? 'time' : 'times'}`, false)).join('');
    base.html = `${head}
      <div class="bk-callout bk-callout-info">${ICON.info}<p>Same price. Your compartment number may change. Your refundable hold moves with your booking.</p></div>
      <form class="bk-card" data-form="change" novalidate>
        ${errorsHTML()}
        <h2 class="bk-h3">${esc(g.name)}: ${esc(placeLabel(b))}</h2>
        <p class="bk-small" style="margin-bottom:16px">Now: ${esc(when(b.pickup, tz))} to ${esc(timeOf(b.ret, tz))} (${durWords(len)}). New times keep the same length.</p>
        ${days.length ? `
        <fieldset class="bk-fieldset" id="chDayGroup">
          <legend class="bk-legend"><span class="bk-num">1</span>Pick a new day</legend>
          <div class="bk-scroller" id="chScroller" data-keep-scroll><div class="bk-days">${chips}</div></div>
        </fieldset>
        <fieldset class="bk-fieldset" id="chTimeGroup"${e.chTimeGroup ? ' aria-describedby="chTimeGroupErr"' : ''}>
          <legend class="bk-legend"><span class="bk-num">2</span>Pick a new ${b.mode === 'delivery' ? 'start' : 'pickup'} time</legend>
          ${e.chTimeGroup ? errLine('chTimeGroupErr', e.chTimeGroup) : ''}
          <div role="radiogroup" aria-label="New times on ${esc(dateWords(ui.chDay))}">${timeGroupsHTML(sel ? sel.starts : [], tz, 'cht', ui.chT, endLabel, true)}</div>
          <p class="bk-small">All times are ${zoneName(tz)}.</p>
        </fieldset>
        <div class="bk-actions"><button class="btn btn-green" type="submit" id="btnChange">Confirm new time</button><a class="btn btn-outline-dark" href="#/bookings/${b.code}">Keep the current time</a></div>`
        : '<p>There are no other free times of the same length in the next 60 days.</p>'}
      </form>`;
    return base;
  }

  /* ------------------------------------------------------------------
     Screen 11: cancel your booking
     ------------------------------------------------------------------ */
  function scrCancel(b) {
    const place = placeOf(b), g = GEAR[b.gearKey], tz = place.tz;
    const head = backHTML('bookings/' + b.code, 'Back to this booking');
    const base = { title: 'Cancel your booking', eyebrow: `Booking code ${b.code}` };
    if (ui.cancelled) {
      base.html = `${head}<section class="bk-card" aria-labelledby="cancelledHead">
          <div class="bk-callout bk-callout-ok" role="status">${ICON.check}<p id="cancelledHead"><strong>Your booking is cancelled.</strong> ${money(b.total)} will be back on your card in 5 to 10 business days.</p></div>
          <div class="bk-btnrow"><a class="btn btn-green" href="#/bookings">Back to my bookings</a><a class="btn btn-outline-dark" href="#/">Book something else</a></div>
        </section>`;
      return base;
    }
    if (b.status === 'ready') {
      base.html = `${head}<section class="bk-card" aria-labelledby="readyHead">
          <h2 class="bk-h3" id="readyHead">${esc(g.name)}: ${esc(placeLabel(b))}</h2>
          <div class="bk-callout bk-callout-sun">${ICON.info}<p>Your rental is ready to unlock. To cancel before you open the locker, use the app: Contact Us, then Cancel rental, within 10 minutes of your start time.</p></div>
          <div class="bk-btnrow"><a class="btn btn-outline-dark" href="#/bookings/${b.code}">Back to this booking</a></div>
        </section>`;
      return base;
    }
    if (!CHANGEABLE.includes(b.status)) {
      base.html = `${head}<section class="bk-card"><p>This booking can’t be cancelled. Its status is ${esc(STATUS[b.status].toLowerCase())}.</p></section>`;
      return base;
    }
    base.html = `${head}<section class="bk-card" aria-labelledby="cancelHead">
        <h2 class="bk-h3" id="cancelHead">${esc(g.name)}: ${esc(placeLabel(b))}</h2>
        <p class="bk-booking-when">${ICON.clock}<span>${esc(when(b.pickup, tz))}<br>to ${esc(when(b.ret, tz))}</span></p>
        <div class="bk-callout bk-callout-info" style="margin-top:16px">${ICON.card}<p>You’ll get ${money(b.total)} back on the card ending ${b.card}. Refunds show on your statement in 5 to 10 business days.</p></div>
        <div class="bk-btnrow">
          <button type="button" class="btn btn-danger" data-act="cancelBooking" data-code="${b.code}" id="btnCancel">Cancel booking</button>
          <a class="btn btn-outline-dark" href="#/bookings/${b.code}">Keep my booking</a>
        </div>
      </section>`;
    return base;
  }

  /* ------------------------------------------------------------------
     Screen 12: confirm your card for the refundable hold
     ------------------------------------------------------------------ */
  function scrConfirmCard(b) {
    const head = backHTML('bookings/' + b.code, 'Back to this booking');
    const base = { title: 'Confirm your card for the refundable hold', docTitle: 'Confirm your card', eyebrow: `Booking code ${b.code}` };
    if (ui.cardOk === b.code) {
      base.html = `${head}<section class="bk-card">
          <div class="bk-callout bk-callout-ok" role="status" id="cardOkMsg" tabindex="-1">${ICON.check}<p>Card confirmed. Your ${money(b.holdAmt)} refundable hold is in place. It’s released after you return the gear.</p></div>
          <div class="bk-btnrow"><a class="btn btn-green" href="#/bookings">Back to my bookings</a></div>
        </section>`;
      return base;
    }
    if (b.status !== 'attention') {
      base.html = `${head}<section class="bk-card"><p>There’s nothing to confirm for this booking right now.</p>${statusExplainer(b)}</section>`;
      return base;
    }
    base.html = head + cardStepHTML(b, false) + tip('Reached from the email we send when the automatic hold 24 hours before pickup needs your bank’s OK. Staff can also approve a start without a hold.');
    return base;
  }

  /* ------------------------------------------------------------------
     Screen 13: help (no forms)
     ------------------------------------------------------------------ */
  function scrHelp() {
    const qa = [
      ['How pickup works', `<ol>
          <li>Get the DailyAdventureBox app and sign in with the same account you booked with.</li>
          <li>The first time, finish your profile and sign the rental agreement. It takes about 2 minutes.</li>
          <li>Your rental appears in the app 15 minutes before pickup. If the app is already open, close it and open it again.</li>
          <li>At the locker, turn on Bluetooth, open the app, tap Active Rental, then Open Box.</li>
        </ol>`],
      ['How return works', '<p>Put the gear back in the same compartment and close the door. In the app, tap Return Equipment and take the return photo. That’s it.</p><p>Please return by your booked return time. Late returns follow the same rules as rentals started in the app, as the Rental Terms describe.</p>'],
      ['The refundable hold', '<p>A refundable hold is placed on your saved card 24 hours before pickup, or right away if pickup is sooner. It’s released after you return the gear.</p><p>If your bank asks us to confirm your card first, we email you a link. Confirming doesn’t charge anything.</p>'],
      ['Cancelling or changing your time', '<p>Cancellation is free until your pickup time. In My bookings, tap Cancel and the full amount goes back to your card. Refunds show on your statement in 5 to 10 business days.</p><p>To move a booking, tap Change time. You can pick another time of the same length and price, at least an hour from now. Your compartment number may change.</p><p>Once your rental is ready to unlock, cancel in the app before you open the locker: Contact Us, then Cancel rental, within 10 minutes of your start time.</p>'],
      ['Missed pickups', '<p>If the locker isn’t opened by 5 minutes before your return time, the booking closes as a missed pickup. The rental price isn’t refunded, and your refundable hold is released.</p>'],
      ['If something goes wrong', '<p>If your compartment isn’t free when you arrive, we move your booking to another compartment with the same gear and tell you the new number. If we can’t provide your rental, you get a full refund.</p><p>If a step on your side isn’t done yet, like the card check or the rental agreement, we remind you and our team can help. We never keep your money for a rental that couldn’t start.</p>'],
      ['Lockers you don’t see in the list', '<p>Not every DailyAdventureBox locker is listed. Some are private to hotels, military bases and communities. Staying at one? Ask the front desk or community office how to book.</p>'],
      ['Delivery, starting in 2027', '<p>In 2027 we deliver from the Camp Lejeune area down to Wilmington, North Carolina, to spots DailyAdventureBox approves. Pick an approved spot, or suggest one. If we can’t approve a suggested spot, you get a full refund.</p>'],
      ['Accessibility', '<p>We want everyone to be able to book. This site is built to meet the Web Content Accessibility Guidelines 2.2 at level AA. It works with a keyboard and with screen readers, at 200 percent zoom and on small phone screens. While you pay, you can add 10 minutes to your hold if you need more time.</p><p>If anything gets in your way, email us and we’ll help you book.</p>']
    ];
    return {
      title: 'Help', eyebrow: 'Book online',
      lede: 'Pickup and return, the refundable hold, cancelling, and how to reach us.',
      html: `<div class="bk-help"><div class="faq">${qa.map((x, i) => `<details id="help-${i}"${i === 0 ? ' open' : ''}><summary>${x[0]}</summary><div class="answer">${x[1]}</div></details>`).join('')}</div></div>
        <section class="bk-card" aria-labelledby="contactHead">
          <h2 class="bk-h2" id="contactHead">Still need help?</h2>
          <p>Email <a class="bk-a" href="mailto:${SUPPORT}">${SUPPORT}</a> and we’ll get back to you by email.</p>
        </section>`
    };
  }

  /* ------------------------------------------------------------------
     Router
     ------------------------------------------------------------------ */
  function screenFor(r) {
    switch (r.name) {
      case '': return scrLockers();
      case 'gear': return scrGear();
      case 'times': return scrTimes();
      case 'account': return scrAccount(false);
      case 'sign-in': return scrAccount(true);
      case 'confirm-email': return scrConfirmEmail();
      case 'safety': return scrSafety();
      case 'pay': return scrPay();
      case 'booked': return scrBooked();
      case 'help': return scrHelp();
      case 'bookings': {
        if (!r.parts[1]) return scrBookings();
        const u = user(), b = findBooking(r.parts[1]);
        if (!u || !u.confirmed || !b || b.owner !== u.email) return { redirect: 'bookings' };
        const sub = r.parts[2] || '';
        if (sub === 'change') return scrChange(b);
        if (sub === 'cancel') return scrCancel(b);
        if (sub === 'confirm-card') return scrConfirmCard(b);
        return scrBookingDetail(b);
      }
      default: return { redirect: '' };
    }
  }

  /* ------------------------------------------------------------------
     Dialog (sample stand-ins for windows the real site would open)
     ------------------------------------------------------------------ */
  let dlgReturnId = null, dlgActions = [];
  function openDialog(o) {
    const a = document.activeElement;
    dlgReturnId = a && a.id ? a.id : null;
    dlgActions = o.actions.map(x => x.run);
    el.dialog.innerHTML = `<div class="bk-dialog-head"><h2 class="bk-dialog-title" id="dialogTitle">${esc(o.title)}</h2>
        <button type="button" class="bk-dialog-x" data-act="dialogClose" aria-label="Close">${ICON.x}</button></div>
      <div class="bk-dialog-body">${o.body}</div>
      <div class="bk-dialog-actions">${o.actions.map((x, i) => `<button type="button" class="btn ${x.primary ? 'btn-green' : 'btn-outline-dark'} bk-btn-sm" data-act="dialogAction" data-i="${i}"${i === 0 ? ' data-first' : ''}>${esc(x.label)}</button>`).join('')}</div>`;
    if (typeof el.dialog.showModal === 'function') { if (!el.dialog.open) el.dialog.showModal(); }
    else el.dialog.setAttribute('open', '');
    const first = el.dialog.querySelector('[data-first]');
    if (first) first.focus();
  }
  function closeDialog(returnFocus) {
    if (returnFocus === false) dlgReturnId = null;
    if (typeof el.dialog.close === 'function') { if (el.dialog.open) el.dialog.close(); }
    else { el.dialog.removeAttribute('open'); onDialogClosed(); }
  }
  function onDialogClosed() {
    const id = dlgReturnId;
    dlgReturnId = null;
    if (id) { const n = byId(id); if (n) n.focus(); }
  }
  el.dialog.addEventListener('close', onDialogClosed);

  /* ------------------------------------------------------------------
     Actions
     ------------------------------------------------------------------ */
  function chooseLocker(id) {
    const d = state.draft;
    if (d.mode !== 'locker' || d.placeId !== id) {
      state.draft = newDraft('locker');
      state.draft.placeId = id;
      state.hold = null;
    }
    go('gear');
  }
  function signIn(acct) {
    state.userEmail = acct.email;
    seedBookings(acct.email);
    state.authView = 'signin';
    video.playing = false; video.pos = 0;
    announce(`Signed in as ${acct.first} ${acct.last}.`);
    const r = parseRoute().name;
    if (r === 'account') { go(nextFlowStep()); return; }
    const to = state.afterSignIn;
    state.afterSignIn = null;
    go(to !== null && to !== undefined && to !== 'sign-in' ? to : 'bookings');
  }
  function sampleSocialAccount(provider) {
    const email = provider === 'apple' ? 'jane.sample@example.com' : 'jane@example.com';
    if (!state.accounts[email]) state.accounts[email] = { first: 'Jane', last: 'Sample', email, provider, confirmed: true, idv: 'none', video: false };
    return state.accounts[email];
  }
  function bankCheck(onApprove) {
    openDialog({
      title: 'Your bank (sample)',
      body: '<p>On the real site, your bank’s own check appears here, for example a code sent to your phone.</p><p>Confirming the card doesn’t charge anything.</p>',
      actions: [
        { label: 'Approve (sample)', primary: true, run: () => { closeDialog(false); onApprove(); } },
        { label: 'Cancel', run: () => closeDialog() }
      ]
    });
  }
  function icsText(b) {
    const place = placeOf(b), g = GEAR[b.gearKey], tz = place.tz, isDel = b.mode === 'delivery';
    const stamp = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const where = isDel ? `${b.spot.name}. ${b.spot.note}` : `${place.name}, ${place.address}`;
    const summary = isDel ? `Sample booking: ${g.name} delivery to ${b.spot.name}` : `Sample booking: ${g.name} at ${place.name}`;
    const desc = [
      'Sample booking from the DailyAdventureBox booking prototype. Not a real booking.',
      `Booking code ${b.code}`,
      isDel ? '' : `Compartment ${b.comp}`,
      `${isDel ? 'Start' : 'Pickup'}: ${when(b.pickup, tz)}`,
      `${isDel ? 'End' : 'Return'}: ${when(b.ret, tz)}`,
      isDel ? 'Meet our team at the spot at your start time.' : 'At pickup, turn on Bluetooth, open the DailyAdventureBox app, tap Active Rental, then Open Box. Your rental appears in the app 15 minutes before pickup.',
      `Questions: ${SUPPORT}`
    ].filter(Boolean).join('\n');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DailyAdventureBox//Booking prototype//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${b.code}-${b.pickup}@book-prototype.dailyadventurebox.com`,
      `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(b.pickup)}`, `DTEND:${stamp(b.ret)}`,
      `SUMMARY:${icsEsc(summary)}`, `LOCATION:${icsEsc(where)}`, `DESCRIPTION:${icsEsc(desc)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(isDel ? 'Delivery in 1 hour' : 'Pickup in 1 hour')}`, 'TRIGGER:-PT1H', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ];
    // Fold long lines at 75 bytes, as calendar apps expect.
    const enc = new TextEncoder();
    const fold = line => {
      if (enc.encode(line).length <= 75) return line;
      const out = [];
      let cur = '', limit = 75;
      for (const ch of line) {
        if (enc.encode(cur + ch).length > limit) { out.push(cur); cur = ''; limit = 74; }
        cur += ch;
      }
      out.push(cur);
      return out.join('\r\n ');
    };
    return lines.map(fold).join('\r\n') + '\r\n';
  }
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  const ACTS = {
    headerSignIn: () => {
      const r = parseRoute();
      if (!['sign-in', 'account', 'confirm-email'].includes(r.name)) state.afterSignIn = r.path;
      go('sign-in');
    },
    signInFor: n => { state.afterSignIn = n.dataset.after || 'bookings'; go('sign-in'); },
    signOut: () => {
      state.userEmail = null; state.hold = null; state.signup = null;
      video.playing = false; video.pos = 0;
      announce('Signed out.');
      ui.focus = 'hdrSign';
      rerender();
    },
    goto: n => go(n.dataset.to),
    toggleSummary: () => {
      summaryOpen = !summaryOpen;
      el.summary.classList.toggle('is-open', summaryOpen);
      const t = byId('summaryToggle');
      if (t) t.setAttribute('aria-expanded', String(summaryOpen));
    },
    togglePrivate: () => { ui.codeOpen = !ui.codeOpen; ui.codeError = null; ui.focus = ui.codeOpen ? 'privateCode' : 'privateToggle'; rerender(); },
    pickLocker: n => { if (PLACES[n.dataset.id]) chooseLocker(n.dataset.id); },
    pickGear: n => {
      const key = n.dataset.key, d = state.draft, place = draftPlace();
      if (!place || !compsOf(place, key).length) return;
      if (d.gearKey !== key) { d.gearKey = key; d.day = null; d.pickup = null; d.ret = null; d.retDay = null; d.safetySeen = false; state.hold = null; }
      go('times');
    },
    jumpTo: n => {
      const d = state.draft;
      d.day = Number(n.dataset.n); d.pickup = Number(n.dataset.t); d.ret = null; d.retDay = null; state.hold = null;
      clearErrors();
      ui.focus = 'pickup-' + d.pickup;
      rerender();
      announce(`Pickup set for ${when(d.pickup, draftPlace().tz)}. Now choose a return time.`);
    },
    directions: n => {
      let what = '';
      if (n.dataset.code) {
        const b = findBooking(n.dataset.code);
        what = b ? (b.mode === 'delivery' ? `the delivery spot, ${b.spot.name}` : placeOf(b).address) : '';
      } else if (PLACES[n.dataset.id]) what = PLACES[n.dataset.id].address;
      openDialog({
        title: 'Directions (sample)',
        body: `<p>On the real site, this opens directions to ${esc(what)} in your maps app.</p><p>This prototype uses a sample address, so there’s nothing to open.</p>`,
        actions: [{ label: 'Close', primary: true, run: () => closeDialog() }]
      });
    },
    social: n => {
      const provider = n.dataset.provider, pname = provider === 'apple' ? 'Apple' : 'Google';
      const acct = n.dataset.email && state.accounts[n.dataset.email] ? state.accounts[n.dataset.email] : sampleSocialAccount(provider);
      if (acct.provider !== provider) { ui.steer = { provider: acct.provider, email: acct.email }; clearErrors(); ui.focus = 'steerMsg'; rerender(); return; }
      openDialog({
        title: `Continue with ${pname} (sample)`,
        body: `<p>On the real site, ${pname}’s own sign-in window opens here.</p><p>In this prototype you continue as the sample customer <strong>${esc(acct.first + ' ' + acct.last)}</strong> (${esc(acct.email)}).</p>`,
        actions: [
          { label: `Continue as ${acct.first}`, primary: true, run: () => { closeDialog(false); signIn(acct); } },
          { label: 'Cancel', run: () => closeDialog() }
        ]
      });
    },
    authView: n => { state.authView = n.dataset.view; clearErrors(); ui.steer = null; ui.focus = n.dataset.view === 'create' ? 'cFirst' : 'siEmail'; rerender(); },
    forgot: () => openDialog({
      title: 'Reset your password (sample)',
      body: '<p>On the real site, we email you a link to reset your password.</p><p>This prototype doesn’t send email.</p>',
      actions: [{ label: 'Close', primary: true, run: () => closeDialog() }]
    }),
    continueFlow: () => go(nextFlowStep()),
    resend: () => { ui.resent = true; ui.focus = 'btnResend'; rerender(); announce('We sent a new link.'); },
    simulateConfirm: () => {
      const u = user();
      if (!u) return;
      u.confirmed = true; // the poll on this page notices, as it would after the real link is opened
      ui.linkOpened = true;
      save();
      rerender();
    },
    startOver: () => {
      const u = user(), flow = !!(state.signup && state.signup.flow);
      if (u && !u.confirmed) delete state.accounts[u.email];
      state.userEmail = null; state.signup = null; state.authView = 'create';
      go(flow ? 'account' : 'sign-in');
    },
    startIdv: () => openDialog({
      title: 'Verify your identity (sample)',
      body: `<p>On the real site, this opens Stripe’s secure page in a new tab.</p>
        <div class="bk-browser"><div class="bk-browser-bar">${ICON.lock}<span>Stripe identity check, sample</span></div>
          <div class="bk-browser-body">
            <div class="bk-idv-row">${ICON.idcard}<span>Photo of your photo identification</span></div>
            <div class="bk-idv-row">${ICON.camera}<span>A selfie</span></div>
          </div></div>
        <p>When you finish there, this page shows a check mark.</p>`,
      actions: [
        { label: 'Finish the sample check', primary: true, run: () => {
          closeDialog(false);
          const u = user();
          if (!u) return;
          u.idv = 'processing';
          announce('Identity check sent. Stripe is checking it.');
          ui.focus = u.video ? 'btnSafety' : 'videoBtn';
          rerender();
          setTimeout(() => {
            const now = user();
            if (now && now.idv === 'processing') { now.idv = 'verified'; save(); if (parseRoute().name === 'safety') rerender(); }
          }, 5000);
        } },
        { label: 'Cancel', run: () => closeDialog() }
      ]
    }),
    videoToggle: () => {
      video.playing = !video.playing;
      ui.focus = 'videoBtn';
      rerender();
      announce(video.playing ? 'Playing the sample safety video.' : 'Paused.');
    },
    extendHold: () => {
      const h = state.hold;
      if (!h || h.extended) return;
      h.expiresAt += EXTEND_MS; h.extended = true; h.warned5 = false; h.warned1 = false;
      ui.focus = 'holdText';
      rerender();
      announce(`10 minutes added. You have ${Math.ceil((h.expiresAt - Date.now()) / MIN)} minutes.`);
    },
    rehold: () => {
      const d = state.draft, place = draftPlace();
      state.hold = null;
      if (!place || freeComp(place, d.gearKey, d.pickup, d.ret) === null || d.pickup < Date.now() + leadOf(place)) {
        d.pickup = null; d.ret = null; d.retDay = null;
        state.flash = 'Those times are no longer free. Please pick new times.';
        go('times');
        return;
      }
      ui.focus = 'holdText';
      rerender();
      announce('Held again for 20 minutes.');
    },
    ics: n => {
      const b = findBooking(n.dataset.code);
      if (!b) return;
      download(`dailyadventurebox-sample-booking-${b.code}.ics`, icsText(b), 'text/calendar;charset=utf-8');
      announce('Calendar file downloaded.');
    },
    confirmCard: n => {
      const b = findBooking(n.dataset.code);
      if (!b) return;
      bankCheck(() => {
        b.status = 'hold';   // stands in for POST /Bookings/{id}/deposit-intents and its finalize call
        ui.cardOk = b.code; ui.otherCard = false;
        ui.focus = 'cardOkMsg';
        rerender();
        announce(`Card confirmed. Your ${money(b.holdAmt)} refundable hold is in place.`);
      });
    },
    otherCard: () => { ui.otherCard = true; ui.focus = 'btnConfirmOther'; rerender(); },
    savedCard: () => { ui.otherCard = false; ui.focus = 'btnConfirmCard'; rerender(); },
    cancelBooking: n => {
      const b = findBooking(n.dataset.code);
      if (!b || !CHANGEABLE.includes(b.status)) return;
      b.status = 'cancelled'; b.cancelledAt = Date.now();
      ui.cancelled = true;
      ui.focus = 'cancelledHead';
      rerender();
      announce(`Your booking is cancelled. ${money(b.total)} will be back on your card in 5 to 10 business days.`);
    },
    focusField: n => {
      const t = byId(n.dataset.target);
      if (!t) return;
      const inner = t.matches('input, textarea, select, button') ? t : (t.querySelector('input:checked') || t.querySelector('input:not([disabled]), button, textarea, select'));
      const f = inner || t;
      if (!f.matches('a, button, input, select, textarea, [tabindex]')) f.setAttribute('tabindex', '-1');
      f.focus();
      f.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
    },
    dialogClose: () => closeDialog(),
    dialogAction: n => { const fn = dlgActions[Number(n.dataset.i)]; if (fn) fn(); },
    resetAll: () => openDialog({
      title: 'Start the prototype over?',
      body: '<p>This clears the sample sign-in, bookings and choices kept in this browser tab.</p>',
      actions: [
        { label: 'Start over', primary: true, run: () => {
          closeDialog(false);
          state = freshState(); memo.clear(); video.playing = false; video.pos = 0; summaryOpen = false;
          save();
          announce('The prototype was reset.');
          go('');
        } },
        { label: 'Cancel', run: () => closeDialog() }
      ]
    })
  };

  const CHANGES = {
    mode: n => {
      if (state.draft.mode === n.value) return;
      state.draft = newDraft(n.value); state.hold = null; clearErrors();
      ui.focus = n.id;
      rerender();
      announce(n.value === 'delivery' ? 'Delivery preview. Choose a delivery spot.' : 'Choose a locker.');
    },
    spot: n => { ui.spotSel = n.value; clearErrors(); rerender(); },
    day: n => {
      const d = state.draft, place = draftPlace();
      d.day = Number(n.value); d.pickup = null; d.ret = null; d.retDay = null; state.hold = null; clearErrors();
      rerender();
      const count = pickupTimes(place, d.gearKey, d.day).length;
      announce(count ? `${count} ${count === 1 ? 'time' : 'times'} free on ${dateWords(d.day)}.` : `Fully booked on ${dateWords(d.day)}.`);
    },
    pickup: n => {
      const d = state.draft, place = draftPlace();
      d.pickup = Number(n.value); d.ret = null; d.retDay = null; state.hold = null; clearErrors();
      rerender();
      announce(`${place.kind === 'delivery' ? 'Start' : 'Pickup'} set for ${timeOf(d.pickup, place.tz)}. Now choose a ${place.kind === 'delivery' ? 'end' : 'return'} time below.`);
    },
    retday: n => { const d = state.draft; d.retDay = Number(n.value); d.ret = null; state.hold = null; rerender(); },
    ret: n => {
      const d = state.draft, place = draftPlace(), g = GEAR[d.gearKey];
      d.ret = Number(n.value); state.hold = null; clearErrors();
      rerender();
      const q = quote(place, d.gearKey, d.pickup, d.ret);
      announce(`${durWords(q.ms)} at ${money(g.rate)} an hour: ${money(q.subtotal)}, plus sales tax at checkout.`);
    },
    tab: n => { state.tab = n.value; ui.focus = n.id; rerender(); },
    chday: n => { ui.chDay = Number(n.value); ui.chT = null; clearErrors(); rerender(); },
    cht: n => { ui.chT = Number(n.value); clearErrors(); rerender(); }
  };

  const FORMS = {
    findNumber: () => {
      const v = val('lockerNumber').replace(/\s+/g, '');
      ui.findError = null;
      if (!/^\d{6}$/.test(v)) {
        ui.findError = v ? 'Locker numbers have 6 digits, like 900101.' : 'Enter the 6-digit number printed on the locker.';
        ui.focus = 'lockerNumber';
        rerender();
        return;
      }
      const p = Object.values(PLACES).find(x => x.number === v);
      if (!p) { ui.findError = `We couldn’t find locker ${v}. Check the 6-digit number printed on the locker.`; ui.focus = 'lockerNumber'; rerender(); return; }
      if (p.private && !state.privateUnlocked) {
        ui.codeOpen = true;
        ui.codeError = `Locker ${v} is private. Enter the private location code from the front desk or community office.`;
        ui.focus = 'privateCode';
        rerender();
        return;
      }
      announce(`Found ${p.name}.`);
      chooseLocker(p.id);
    },
    privateCode: () => {
      const v = val('privateCode').trim().toUpperCase();
      if (!v) { ui.codeError = 'Enter your private location code.'; ui.focus = 'privateCode'; rerender(); return; }
      if (v !== 'DEMO') { ui.codeError = 'That code didn’t work. Check the code from your front desk or community office.'; ui.focus = 'privateCode'; rerender(); return; }
      state.privateUnlocked = true;
      ui.codeError = null; ui.codeOpen = false;
      ui.focus = 'pick-harbor';
      rerender();
      announce('Code accepted. Sample Harbor Hotel is now at the top of the list.');
    },
    spot: () => {
      const d = state.draft;
      const sel = ui.spotSel !== undefined ? ui.spotSel : (d.spot ? d.spot.id : '');
      const errs = [];
      let address = '';
      if (!sel) errs.push(['spotGroup', 'Choose a delivery spot.']);
      if (sel === 'propose') {
        address = val('spotAddress').trim();
        if (address.length < 8) errs.push(['spotAddress', address ? 'Add a little more detail so our team can find the spot.' : 'Tell us where to meet you.']);
      }
      if (errs.length) { showErrors(errs); return; }
      const spot = sel === 'propose'
        ? { id: 'propose', name: 'Your suggested spot', note: address, proposed: true }
        : Object.assign({ proposed: false }, DELIVERY.spots.find(s => s.id === sel));
      if (!d.spot || d.spot.id !== spot.id || d.spot.note !== spot.note) { d.spot = spot; state.hold = null; }
      go('gear');
    },
    times: () => {
      const d = state.draft, place = draftPlace(), isDel = place.kind === 'delivery';
      const errs = [];
      if (!d.pickup) errs.push(['pickupGroup', isDel ? 'Choose a start time.' : 'Choose a pickup time.']);
      else if (!d.ret) errs.push(['returnGroup', isDel ? 'Choose an end time.' : 'Choose a return time.']);
      if (errs.length) { showErrors(errs); return; }
      if (d.pickup < Date.now() + leadOf(place) || !returnTimes(place, d.gearKey, d.pickup).includes(d.ret)) {
        d.pickup = null; d.ret = null; d.retDay = null;
        showErrors([['pickupGroup', 'That time is no longer free. Choose another time.']]);
        return;
      }
      go(nextFlowStep());
    },
    signIn: () => {
      const email = val('siEmail').trim().toLowerCase(), pass = val('siPass');
      const errs = [];
      if (!email) errs.push(['siEmail', 'Enter your email address.']);
      else if (!EMAIL_RE.test(email)) errs.push(['siEmail', 'Enter an email address like name@example.com.']);
      if (!pass) errs.push(['siPass', 'Enter your password.']);
      else if (pass.length < 8) errs.push(['siPass', 'Passwords have at least 8 characters.']);
      if (errs.length) { ui.steer = null; showErrors(errs); return; }
      const acct = state.accounts[email];
      if (acct && acct.provider !== 'email') { ui.steer = { provider: acct.provider, email }; clearErrors(); ui.focus = 'steerMsg'; rerender(); return; }
      signIn(acct || (state.accounts[email] = { first: nameFromEmail(email), last: 'Sample', email, provider: 'email', confirmed: true, idv: 'none', video: false }));
    },
    create: () => {
      const first = val('cFirst').trim(), last = val('cLast').trim(), email = val('cEmail').trim().toLowerCase(), pass = val('cPass');
      const errs = [];
      if (!first) errs.push(['cFirst', 'Enter your first name.']);
      if (!last) errs.push(['cLast', 'Enter your last name.']);
      if (!email) errs.push(['cEmail', 'Enter your email address.']);
      else if (!EMAIL_RE.test(email)) errs.push(['cEmail', 'Enter an email address like name@example.com.']);
      if (!pass) errs.push(['cPass', 'Choose a password.']);
      else if (pass.length < 8) errs.push(['cPass', 'Use at least 8 characters for your password.']);
      if (!isChecked('cAdult')) errs.push(['cAdult', 'Confirm that you are 18 or older to make an account.']);
      const acct = email ? state.accounts[email] : null;
      if (acct && acct.provider !== 'email' && !errs.length) { ui.steer = { provider: acct.provider, email }; clearErrors(); ui.focus = 'steerMsg'; rerender(); return; }
      if (acct && acct.provider === 'email') errs.push(['cEmail', 'This email already has an account. Sign in instead.']);
      if (errs.length) { ui.steer = null; showErrors(errs); return; }
      state.accounts[email] = { first, last, email, provider: 'email', confirmed: false, idv: 'none', video: false };
      state.userEmail = email;
      seedBookings(email);
      state.signup = { email, flow: parseRoute().name === 'account' };
      announce('Account created. Check your email.');
      go('confirm-email');
    },
    safety: () => {
      const u = user(), errs = [];
      if (!u) return;
      if (!(u.idv === 'processing' || u.idv === 'verified')) errs.push(['btnIdv', 'Verify your identity.']);
      if (!u.video) errs.push(['videoBtn', 'Watch the 2-minute safety video.']);
      if (errs.length) { showErrors(errs); return; }
      go('pay');
    },
    pay: () => {
      if (ui.paying) return;
      const h = state.hold;
      if (!h || h.expiresAt <= Date.now()) { rerender(); return; }
      if (!isChecked('agree')) { showErrors([['agree', 'Tick the box to agree to the Rental Terms and the cancellation rules.']]); return; }
      clearErrors();
      ui.paying = true;
      ui.focus = 'payBtn';
      rerender();
      announce('Confirming your payment. This is a sample; nothing is charged.');
      // Stands in for stripe.confirmPayment and POST /Bookings/{id}/finalize.
      payTimer = setTimeout(() => {
        payTimer = null;
        ui.paying = false;
        createBooking();
        go('booked');
      }, 1600);
    },
    change: () => {
      const r = parseRoute(), b = findBooking(r.parts[1]);
      if (!b) return;
      if (!ui.chT) { showErrors([['chTimeGroup', `Choose a new ${b.mode === 'delivery' ? 'start' : 'pickup'} time.`]]); return; }
      const place = placeOf(b), len = b.ret - b.pickup, t = ui.chT;
      const comp = freeComp(place, b.gearKey, t, t + len, b.code);
      if (comp === null || t < Date.now() + leadOf(place)) { ui.chT = null; showErrors([['chTimeGroup', 'That time was just taken. Choose another time.']]); return; }
      const oldComp = b.comp;
      b.pickup = t; b.ret = t + len; b.comp = comp;
      // The refundable hold is released and scheduled again for the new time.
      if (b.status === 'hold' && t - Date.now() > DAY) b.status = 'booked';
      else if (b.status === 'booked' && t - Date.now() <= DAY) b.status = 'hold';
      ui.changed = { oldComp };
      ui.focus = 'changedHead';
      rerender();
      announce(`Your booking is moved to ${when(b.pickup, place.tz)}.`);
    }
  };

  /* ------------------------------------------------------------------
     Event wiring (one listener per event type)
     ------------------------------------------------------------------ */
  document.addEventListener('click', ev => {
    const t = ev.target;
    if (!(t instanceof Element)) return;
    const n = t.closest('[data-act]');
    if (!n) return;
    // On clickable cards, let real controls inside the card do their own job.
    const control = t.closest('a, button, input, label, select, textarea, summary');
    if (control && control !== n && n.contains(control)) return;
    if (n.disabled || n.getAttribute('aria-disabled') === 'true') { ev.preventDefault(); return; }
    const fn = ACTS[n.dataset.act];
    if (!fn) return;
    ev.preventDefault();
    fn(n, ev);
  });
  document.addEventListener('change', ev => {
    const n = ev.target instanceof Element ? ev.target.closest('[data-change]') : null;
    if (!n) return;
    const fn = CHANGES[n.dataset.change];
    if (fn) fn(n, ev);
  });
  document.addEventListener('submit', ev => {
    ev.preventDefault();
    const f = ev.target instanceof Element ? ev.target.closest('form[data-form]') : null;
    if (!f) return;
    const submitter = ev.submitter;
    if (submitter && submitter.getAttribute('aria-disabled') === 'true') return;
    const fn = FORMS[f.dataset.form];
    if (fn) fn(f, ev);
  });
  window.addEventListener('hashchange', () => {
    const h = location.hash;
    if (h === '' || h.indexOf('#/') === 0) render(true);
  });
  byId('skipLink').addEventListener('click', ev => {
    ev.preventDefault();
    const h = byId('pageTitle') || byId('main');
    h.focus({ preventScroll: true });
    h.scrollIntoView({ block: 'start' });
  });

  // Keep the page content clear of the fixed banner and header, whatever their height.
  const setTopHeight = () => document.documentElement.style.setProperty('--bk-top-h', el.top.offsetHeight + 'px');
  setTopHeight();
  if ('ResizeObserver' in window) new ResizeObserver(setTopHeight).observe(el.top);
  else window.addEventListener('resize', setTopHeight);

  const year = byId('year');
  if (year) year.textContent = String(new Date().getFullYear());

  if (location.hash.indexOf('#/') !== 0) {
    try { history.replaceState(null, '', '#/'); } catch (e) { /* ignore */ }
  }
  render(true);
})();
