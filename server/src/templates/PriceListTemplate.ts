export interface CompanyInfo {
  name: string;
  shortName: string;
  phones: string[];
  address: string[];
  website: string;
  docTitle: string;

  /** Optional: replace the generated gold/fireworks hero banner on page 1
   *  with a fully custom designed image (your own logo + artwork already
   *  baked in). Accepts a URL, local file path, or — recommended for
   *  reliable Puppeteer/PDF rendering — a base64 data URI
   *  ("data:image/png;base64,..."), since that has no network/file-access
   *  dependency at render time. When set, the generated banner (gradient,
   *  fireworks, brand text) is skipped entirely and this image fills the
   *  banner area edge-to-edge; the contact bar still renders underneath
   *  it as usual. */
  bannerImageUrl?: string;

  /** Pixel height of the banner area when `bannerImageUrl` is set.
   *  Defaults to 107 (the same height as the generated banner) — set
   *  this to match your image's natural aspect ratio at 816px wide.
   *  Pagination recalculates automatically to match whatever you pass. */
  bannerHeight?: number;

  /** Optional: replace the generated starburst logo (the circular badge
   *  on page 1, and the small logo on every continuation page's mini
   *  header) with your own logo image. Ignored on page 1 if
   *  `bannerImageUrl` is set, since the custom banner is assumed to
   *  already include your logo. Still applies to continuation pages. */
  logoImageUrl?: string;
}

export interface PriceListProduct {
  name: string;
  mrp: string;
  unit: string;
  offer: string;
}

export interface PriceListCategory {
  cat: string;
  items: PriceListProduct[];
}

const PAGE_H = 1056;

/* Contact bar grew from a fixed 64px to a safer min-height so a
   multi-line address always has room (see CONTACT_BAR_MIN_H below).
   getHeaderFullH() must stay in sync with the real rendered height. */
const CONTACT_BAR_MIN_H = 84;
const DEFAULT_BANNER_H = 107;
const HEADER_MINI_H = 56;
const FOOTER_H = 34 + 3;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;
const THEAD_H = 33;
const ROW_CAT_H = 30;
const ROW_PR_H = 28;

/** Page-1 header height depends on whether a custom banner image (with
 *  its own height) is in play — pagination must stay in sync with
 *  whatever the real rendered height ends up being. */
function getHeaderFullH(company: CompanyInfo): number {
  const bannerH = company.bannerImageUrl ? (company.bannerHeight ?? DEFAULT_BANNER_H) : DEFAULT_BANNER_H;
  return bannerH + 4 + CONTACT_BAR_MIN_H + 2.5;
}

/* ════════════════════════════════════════════════════════════
   THEME  –  the single place all colors come from. Swap any value
   here to retheme every page, every header, every band, every
   row stripe consistently. Default is a premium "Navy & Metallic
   Gold" palette: deep near-black navy for structure, a classic
   gold for accents/category bands, warm ivory for zebra striping
   (rather than the colder blue-tinted grey used previously).
   ════════════════════════════════════════════════════════════ */
export const THEME = {
  primaryDark: "#10162E",   // header / footer / table-head background
  primaryDeep: "#0A0E20",   // gradient depth, page border accent
  gold: "#D4AF37",   // classic metallic gold — primary accent
  goldSoft: "#E9D9A6",   // pale champagne — "(continued)" band, soft glow
  goldDeep: "#9C7A1E",   // bronze — borders, depth, price emphasis
  ivory: "#FAF7F0",   // warm zebra-stripe background
  borderWarm: "#E3DCC8",   // hairline borders (warmer than cold grey)
  textDark: "#1C1C1C",   // body text
  white: "#FFFFFF",
  pageSurround: "#EDEAE2",   // backdrop behind each page sheet
};


/* ════════════════════════════════════════════════════════════
   BANNER CONFIG  –  the "changeable" knobs for the top banner.
   Tune these once; every company name auto-fits within them
   instead of needing per-client font-size tweaks.
   ════════════════════════════════════════════════════════════ */
const BANNER_CONFIG = {
  brand: { maxWidthPx: 470, minSize: 22, maxSize: 40, charFactor: 0.60 },
  miniBrand: { maxWidthPx: 230, minSize: 13, maxSize: 20, charFactor: 0.58 },
  docTitle: { maxWidthPx: 190, minSize: 22, maxSize: 38, charFactor: 0.62 },
};

/** Estimates a font size (px) that keeps `text` on a single line within
 *  `maxWidthPx`, without needing real DOM measurement — safe to use in
 *  server-side / Puppeteer HTML generation. Heuristic, not pixel-exact,
 *  but reliable across the range of company names this template sees. */
function fitFontSize(
  text: string,
  cfg: { maxWidthPx: number; minSize: number; maxSize: number; charFactor: number }
): number {
  const len = Math.max(text.length, 1);
  const estimated = cfg.maxWidthPx / (len * cfg.charFactor);
  return Math.max(cfg.minSize, Math.min(cfg.maxSize, Math.round(estimated)));
}

type Row =
  | { type: "cat"; text: string; contd?: boolean }
  | { type: "pr"; cat: string; item: PriceListProduct; sno?: number };

function svgFireworkBg() {
  return `<svg class="fw-bg" viewBox="0 0 816 107" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
<defs>
  <filter id="glo1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glo2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <radialGradient id="gcore1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFF6DE"/><stop offset="60%" stop-color="${THEME.gold}" stop-opacity="0.9"/><stop offset="100%" stop-color="${THEME.goldDeep}" stop-opacity="0"/></radialGradient>
  <radialGradient id="gcore2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#F3EEDD"/><stop offset="50%" stop-color="${THEME.goldSoft}" stop-opacity="0.8"/><stop offset="100%" stop-color="${THEME.goldDeep}" stop-opacity="0"/></radialGradient>
</defs>
<g filter="url(#glo1)">
  <circle cx="68" cy="54" r="22" fill="url(#gcore1)" opacity="0.85"/>
  <line x1="68" y1="54" x2="18" y2="10" stroke="${THEME.gold}" stroke-width="2.2" opacity="0.9"/>
  <line x1="68" y1="54" x2="30" y2="4" stroke="${THEME.goldSoft}" stroke-width="1.8" opacity="0.85"/>
  <line x1="68" y1="54" x2="50" y2="2" stroke="${THEME.goldDeep}" stroke-width="1.5" opacity="0.8"/>
  <line x1="68" y1="54" x2="68" y2="2" stroke="#FFF6DE" stroke-width="1.5" opacity="0.75"/>
  <line x1="68" y1="54" x2="90" y2="4" stroke="${THEME.gold}" stroke-width="1.8" opacity="0.85"/>
  <line x1="68" y1="54" x2="108" y2="12" stroke="${THEME.goldDeep}" stroke-width="2.0" opacity="0.9"/>
  <line x1="68" y1="54" x2="120" y2="30" stroke="${THEME.goldDeep}" stroke-width="1.5" opacity="0.8"/>
  <line x1="68" y1="54" x2="122" y2="54" stroke="${THEME.goldSoft}" stroke-width="1.5" opacity="0.75"/>
  <line x1="68" y1="54" x2="115" y2="78" stroke="${THEME.gold}" stroke-width="1.8" opacity="0.8"/>
  <line x1="68" y1="54" x2="100" y2="96" stroke="${THEME.goldDeep}" stroke-width="2.0" opacity="0.85"/>
  <line x1="68" y1="54" x2="68" y2="104" stroke="${THEME.goldDeep}" stroke-width="1.5" opacity="0.75"/>
  <line x1="68" y1="54" x2="38" y2="100" stroke="${THEME.goldSoft}" stroke-width="1.5" opacity="0.8"/>
  <line x1="68" y1="54" x2="14" y2="82" stroke="${THEME.gold}" stroke-width="1.8" opacity="0.85"/>
  <line x1="68" y1="54" x2="6" y2="54" stroke="${THEME.goldDeep}" stroke-width="2.0" opacity="0.9"/>
  <line x1="68" y1="54" x2="10" y2="30" stroke="${THEME.goldDeep}" stroke-width="1.5" opacity="0.8"/>
  <circle cx="18" cy="10" r="2.5" fill="${THEME.goldSoft}"/><circle cx="30" cy="4" r="2.0" fill="${THEME.gold}"/>
  <circle cx="50" cy="2" r="1.8" fill="#FFF6DE"/><circle cx="68" cy="2" r="2.0" fill="${THEME.goldSoft}"/>
  <circle cx="90" cy="4" r="2.2" fill="${THEME.goldDeep}"/><circle cx="108" cy="12" r="2.5" fill="${THEME.goldSoft}"/>
  <circle cx="120" cy="30" r="2.0" fill="${THEME.gold}"/><circle cx="122" cy="54" r="1.8" fill="${THEME.goldSoft}"/>
  <circle cx="115" cy="78" r="2.0" fill="${THEME.goldDeep}"/><circle cx="100" cy="96" r="2.2" fill="${THEME.goldSoft}"/>
  <circle cx="68" cy="104" r="1.8" fill="${THEME.gold}"/><circle cx="38" cy="100" r="2.0" fill="${THEME.goldSoft}"/>
  <circle cx="14" cy="82" r="2.2" fill="${THEME.goldDeep}"/><circle cx="6" cy="54" r="2.5" fill="${THEME.goldSoft}"/>
  <circle cx="10" cy="30" r="2.0" fill="${THEME.gold}"/>
</g>
<g filter="url(#glo2)">
  <circle cx="750" cy="54" r="20" fill="url(#gcore2)" opacity="0.8"/>
  <line x1="750" y1="54" x2="700" y2="12" stroke="#F3EEDD" stroke-width="2.0" opacity="0.85"/>
  <line x1="750" y1="54" x2="720" y2="6" stroke="${THEME.goldSoft}" stroke-width="1.6" opacity="0.8"/>
  <line x1="750" y1="54" x2="750" y2="4" stroke="#FFFFFF" stroke-width="1.5" opacity="0.75"/>
  <line x1="750" y1="54" x2="778" y2="6" stroke="${THEME.goldSoft}" stroke-width="1.6" opacity="0.8"/>
  <line x1="750" y1="54" x2="800" y2="14" stroke="#FFFFFF" stroke-width="2.0" opacity="0.85"/>
  <line x1="750" y1="54" x2="812" y2="36" stroke="${THEME.gold}" stroke-width="1.5" opacity="0.78"/>
  <line x1="750" y1="54" x2="814" y2="54" stroke="#F3EEDD" stroke-width="1.5" opacity="0.75"/>
  <line x1="750" y1="54" x2="808" y2="78" stroke="${THEME.gold}" stroke-width="1.8" opacity="0.82"/>
  <line x1="750" y1="54" x2="792" y2="98" stroke="${THEME.goldDeep}" stroke-width="2.0" opacity="0.85"/>
  <line x1="750" y1="54" x2="750" y2="104" stroke="${THEME.goldSoft}" stroke-width="1.5" opacity="0.75"/>
  <line x1="750" y1="54" x2="706" y2="98" stroke="${THEME.gold}" stroke-width="1.8" opacity="0.8"/>
  <line x1="750" y1="54" x2="694" y2="78" stroke="${THEME.goldDeep}" stroke-width="2.0" opacity="0.85"/>
  <line x1="750" y1="54" x2="690" y2="54" stroke="${THEME.goldDeep}" stroke-width="1.5" opacity="0.78"/>
  <line x1="750" y1="54" x2="696" y2="32" stroke="${THEME.goldSoft}" stroke-width="1.5" opacity="0.75"/>
  <circle cx="700" cy="12" r="2.5" fill="#F3EEDD"/><circle cx="720" cy="6" r="2.0" fill="${THEME.goldSoft}"/>
  <circle cx="750" cy="4" r="1.8" fill="#FFFFFF"/><circle cx="778" cy="6" r="2.0" fill="${THEME.goldSoft}"/>
  <circle cx="800" cy="14" r="2.5" fill="#FFFFFF"/><circle cx="812" cy="36" r="2.0" fill="${THEME.gold}"/>
  <circle cx="814" cy="54" r="1.8" fill="#F3EEDD"/><circle cx="808" cy="78" r="2.0" fill="${THEME.gold}"/>
  <circle cx="792" cy="98" r="2.2" fill="${THEME.goldDeep}"/><circle cx="750" cy="104" r="1.8" fill="${THEME.goldSoft}"/>
  <circle cx="706" cy="98" r="2.0" fill="${THEME.gold}"/><circle cx="694" cy="78" r="2.2" fill="${THEME.goldDeep}"/>
  <circle cx="690" cy="54" r="2.5" fill="${THEME.goldDeep}"/><circle cx="696" cy="32" r="2.0" fill="${THEME.goldSoft}"/>
</g>
<g opacity="0.65">
  <circle cx="180" cy="8" r="1.5" fill="${THEME.goldSoft}"/><circle cx="220" cy="20" r="1.2" fill="#fff"/>
  <circle cx="160" cy="90" r="1.5" fill="${THEME.gold}"/><circle cx="590" cy="10" r="1.5" fill="#F3EEDD"/>
  <circle cx="630" cy="88" r="1.2" fill="${THEME.goldSoft}"/><circle cx="550" cy="96" r="1.5" fill="${THEME.gold}"/>
  <circle cx="140" cy="40" r="1.0" fill="#fff"/><circle cx="660" cy="28" r="1.0" fill="${THEME.goldDeep}"/>
</g>
</svg>`;
}

function logoSvg() {
  return `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="34" cy="34" r="32" stroke="#FFFDF5" stroke-width="2.5" fill="none" opacity="0.85"/>
<circle cx="34" cy="34" r="26" stroke="${THEME.goldDeep}" stroke-width="1.5" fill="none" opacity="0.6"/>
<g transform="translate(34,34)" fill="${THEME.primaryDark}">
  <ellipse cx="0" cy="-14" rx="2.5" ry="7" transform="rotate(0)"/>
  <ellipse cx="0" cy="-14" rx="2.5" ry="7" transform="rotate(45)"/>
  <ellipse cx="0" cy="-14" rx="2.5" ry="7" transform="rotate(90)"/>
  <ellipse cx="0" cy="-14" rx="2.5" ry="7" transform="rotate(135)"/>
  <ellipse cx="0" cy="-14" rx="2.5" ry="7" transform="rotate(180)"/>
  <ellipse cx="0" cy="-14" rx="2.5" ry="7" transform="rotate(225)"/>
  <ellipse cx="0" cy="-14" rx="2.5" ry="7" transform="rotate(270)"/>
  <ellipse cx="0" cy="-14" rx="2.5" ry="7" transform="rotate(315)"/>
  <circle cx="0" cy="0" r="6" fill="${THEME.primaryDark}"/>
</g>
</svg>`;
}

function phoneIcon() {
  return `<svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.32.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.01L6.6 10.8z"/></svg>`;
}
function pinIcon() {
  return `<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>`;
}
function globeIcon() {
  return `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;
}

/** Renders the circular logo: a real image if the company supplied one,
 *  otherwise the generated gold starburst. Used for both the big page-1
 *  badge and the small continuation-page mini-logo. */
function logoMarkup(company: CompanyInfo) {
  if (company.logoImageUrl) {
    return `<img src="${company.logoImageUrl}" alt="${company.name} logo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  }
  return logoSvg();
}

function renderContactBar(company: CompanyInfo) {
  return `
<div class="contact-bar">
<div class="contact-item">
  <div class="c-icon">${phoneIcon()}</div>
  <div class="c-text">${company.phones.join("<br>")}</div>
</div>
<div class="contact-item">
  <div class="c-icon">${pinIcon()}</div>
  <div class="c-text c-text--address">${company.address.join("<br>")}</div>
</div>
<div class="contact-item">
  <div class="c-icon">${globeIcon()}</div>
  <div class="c-text">${company.website}</div>
</div>
</div>`;
}

/** The "changeable" header: pass `company.bannerImageUrl` to swap the
 *  entire generated hero banner (gradient + fireworks + brand text) for
 *  your own designed image — useful when you already have professional
 *  banner artwork and don't want the procedural gold theme. The contact
 *  bar underneath is unaffected either way. Omit `bannerImageUrl` to
 *  keep the generated banner (optionally with your own logo image via
 *  `logoImageUrl` instead of the generated starburst). */
function renderFullHeader(company: CompanyInfo) {
  if (company.bannerImageUrl) {
    const h = company.bannerHeight ?? DEFAULT_BANNER_H;
    return `
<div class="header-full--image" style="height:${h}px">
  <img class="header-banner-img" src="${company.bannerImageUrl}" alt="${company.name}" />
</div>
${renderContactBar(company)}`;
  }

  const brandSize = fitFontSize(company.name, BANNER_CONFIG.brand);
  const titleSize = fitFontSize(company.docTitle, BANNER_CONFIG.docTitle);
  return `
<div class="header-full">
${svgFireworkBg()}
<div class="header-inner">
  <div class="logo-badge">${logoMarkup(company)}</div>
  <div class="brand-block"><div class="brand-name" style="font-size:${brandSize}px">${company.name}</div></div>
  <div class="pricelist-badge" style="font-size:${titleSize}px">${company.docTitle}</div>
</div>
</div>
${renderContactBar(company)}`;
}

function renderMiniHeader(company: CompanyInfo) {
  const miniBrandSize = fitFontSize(company.name, BANNER_CONFIG.miniBrand);
  return `
<div class="header-mini">
<div class="header-mini-left">
  <div class="header-mini-logo">${logoMarkup(company)}</div>
  <div class="header-mini-name" style="font-size:${miniBrandSize}px">${company.name}</div>
</div>
<div class="header-mini-right">${company.docTitle} — Continued</div>
</div>`;
}

function renderFooter(company: CompanyInfo, pageNum: number, totalPages: number) {
  return `
<div class="page-footer">
<div class="footer-left"><strong>${company.shortName}</strong> &nbsp;|&nbsp; ${company.phones[0] || ""} &nbsp;|&nbsp; ${company.website}</div>
<div class="footer-right">Page ${pageNum} of ${totalPages}</div>
</div>`;
}


function renderTable(pageRows: Row[]) {
  const trs = pageRows.map(row => {
    if (row.type === "cat") {
      return `<tr class="cat${row.contd ? " cat-contd" : ""}"><td colspan="7">${row.text}</td></tr>`;
    }
    const { name, mrp, unit, offer } = row.item;
    return `<tr class="pr">
  <td class="td-sno">${row.sno}</td>
  <td class="td-prod">${name}</td>
  <td class="td-mrp">${mrp}</td>
  <td class="td-unit">${unit}</td>
  <td class="td-offer">${offer}</td>
  <td class="td-qty"></td>
  <td class="td-amt"></td>
</tr>`;
  }).join("");

  return `
<table class="pt">
<colgroup>
  <col class="c-sno"/><col class="c-prod"/><col class="c-mrp"/>
  <col class="c-unit"/><col class="c-offer"/><col class="c-qty"/><col class="c-amt"/>
</colgroup>
<thead>
  <tr>
    <th>Sno</th><th class="th-prod">Product</th><th>MRP</th><th>Unit</th>
    <th>Price</th><th>Qty</th><th>Amount</th>
  </tr>
</thead>
<tbody>${trs}</tbody>
</table>`;
}

function buildRows(data: PriceListCategory[]): Row[] {
  const rows: Row[] = [];
  data.forEach(group => {
    rows.push({ type: "cat", text: group.cat });
    group.items.forEach(it => rows.push({ type: "pr", cat: group.cat, item: it }));
  });
  return rows;
}

function paginate(rows: Row[], headerFullH: number): Row[][] {
  const pages: Row[][] = [];
  let i = 0;
  let pageIndex = 0;
  let openCategory: string | null = null;

  while (i < rows.length) {
    const isFirstPage = pageIndex === 0;
    const headerH = isFirstPage ? headerFullH : HEADER_MINI_H;
    let capacity = PAGE_H - headerH - FOOTER_H - PAD_TOP - PAD_BOTTOM - THEAD_H;

    const pageRows: Row[] = [];

    // continuation label if we're resuming mid-category
    if (openCategory && rows[i].type === "pr") {
      pageRows.push({ type: "cat", text: openCategory + " (continued)", contd: true });
      capacity -= ROW_CAT_H;
    }

    let used = 0;
    while (i < rows.length) {
      const row = rows[i];
      const h = row.type === "cat" ? ROW_CAT_H : ROW_PR_H;

      let needed = h;
      if (row.type === "cat" && rows[i + 1] && rows[i + 1].type === "pr") {
        needed = h + ROW_PR_H;
      }

      if (used + needed > capacity && pageRows.length > 0) break;

      pageRows.push(row);
      used += h;
      if (row.type === "cat") openCategory = row.text;
      if (row.type === "pr" && rows[i + 1] && rows[i + 1].type === "cat") openCategory = null;
      i++;
    }

    if (i >= rows.length) openCategory = null;
    else if (rows[i] && rows[i].type === "cat") openCategory = null;

    pages.push(pageRows);
    pageIndex++;
  }
  return pages;
}

const CSS_STYLES = `
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: ${THEME.pageSurround}; font-family: 'Open Sans', Arial, sans-serif; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.page { width: 816px; height: 1056px; margin: 24px auto; background: #fff; box-shadow: 0 8px 30px rgba(10, 14, 32, 0.25); border: 1px solid rgba(212, 175, 55, 0.22); position: relative; display: flex; flex-direction: column; overflow: hidden; }
.page-body { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 26px; }
.page-body .table-pad-top { height: 16px; flex-shrink: 0; }
.page-body .table-pad-bottom { height: 16px; flex-shrink: 0; }
.page-body .table-area { flex: 1; min-height: 0; }

.header-full { background: linear-gradient(135deg, ${THEME.primaryDark} 0%, ${THEME.primaryDeep} 100%); position: relative; height: 107px; flex-shrink: 0; overflow: hidden; border-bottom: 4px solid ${THEME.gold}; }

/* Custom image banner mode (company.bannerImageUrl): the whole hero
   area becomes your image, cropped to fill via object-fit:cover. Swap
   to object-fit:contain (with a background-color fallback) below if
   you'd rather letterbox than crop a non-matching aspect ratio. */
.header-full--image { position: relative; flex-shrink: 0; overflow: hidden; border-bottom: 4px solid ${THEME.gold}; background: ${THEME.primaryDark}; }
.header-banner-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.fw-bg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.header-inner { position: relative; z-index: 2; height: 100%; display: flex; align-items: center; padding: 0 16px; gap: 12px; }
.logo-badge { width: 78px; height: 78px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #FFF6DE, ${THEME.gold} 55%, ${THEME.goldDeep}); border: 3px solid #FFFDF5; flex-shrink: 0; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(212, 175, 55, 0.55); overflow: hidden; }
.logo-badge svg { width: 68px; height: 68px; }

/* brand-block / brand-name: font-size is set inline per-render via
   fitFontSize() so any company name auto-fits on one line — this is
   the "changeable" banner. min-width:0 lets the flex child actually
   shrink instead of forcing overflow. */
.brand-block { flex: 1; min-width: 0; text-align: center; line-height: 1; overflow: hidden; }
.brand-name {
  font-family: 'Anton', Impact, 'Arial Black', sans-serif;
  font-weight: 900; color: ${THEME.gold}; letter-spacing: 1.5px; text-transform: uppercase;
  text-shadow: 1px 1px 0 ${THEME.goldDeep}, 0 0 22px rgba(212, 175, 55, 0.35);
  white-space: nowrap; display: inline-block; max-width: 100%;
}
.pricelist-badge {
  font-family: 'Anton', Impact, 'Arial Black', sans-serif;
  font-weight: 900; color: #FFFFFF; letter-spacing: 2px;
  text-shadow: 2px 2px 0 ${THEME.primaryDeep}, 0 0 14px rgba(255, 255, 255, 0.25);
  flex-shrink: 0; white-space: nowrap; padding: 0 4px; max-width: 220px;
  overflow: hidden; text-overflow: ellipsis;
}

/* ── Contact bar ──
   Grid (not equal flex) columns: the address column is deliberately
   wider (1.3fr) than phone/website (1fr) because real addresses run
   longer than a phone number or a short URL — equal columns were the
   bug that made the address wrap an extra line and get truncated.
   min-height (not fixed height) guarantees breathing room even when
   an address needs its full 4 allotted lines. */
.contact-bar {
  background: #fff; border-bottom: 2px solid ${THEME.gold}; flex-shrink: 0;
  min-height: 84px;
  display: grid; grid-template-columns: 1fr 1.3fr 1fr;
  align-items: center; column-gap: 18px;
  padding: 10px 28px;
}
.contact-item {
  display: flex; align-items: flex-start; gap: 10px;
  min-width: 0; width: 100%; padding: 2px 16px 2px 4px;
}
.contact-item:not(:last-child) { border-right: 1.5px solid ${THEME.borderWarm}; }
.c-icon {
  width: 32px; height: 32px; background: ${THEME.primaryDark}; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  margin-top: 1px;
}
.c-icon svg { width: 17px; height: 17px; fill: ${THEME.gold}; }
.c-text {
  font-size: 11px; font-weight: 700; color: ${THEME.primaryDark}; line-height: 1.4;
  flex: 1 1 auto; min-width: 0;
  overflow-wrap: break-word; word-break: break-word;
  display: -webkit-box; -webkit-box-orient: vertical;
  -webkit-line-clamp: 3; overflow: hidden;
}
.c-text--address { -webkit-line-clamp: 4; font-size: 10.5px; }

.header-mini { background: ${THEME.primaryDark}; height: 56px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; border-bottom: 4px solid ${THEME.gold}; gap: 16px; }
.header-mini-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1 1 auto; }
.header-mini-logo { width: 36px; height: 36px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #FFF6DE, ${THEME.gold} 55%, ${THEME.goldDeep}); border: 2px solid #FFFDF5; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.header-mini-logo svg { width: 30px; height: 30px; }
.header-mini-name {
  font-family: 'Barlow Condensed', 'Open Sans', sans-serif;
  font-weight: 900; color: ${THEME.gold}; letter-spacing: 1px; text-transform: uppercase;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
}
.header-mini-right { font-size: 11px; font-weight: 700; color: ${THEME.goldSoft}; letter-spacing: 1px; text-transform: uppercase; opacity: 0.9; flex-shrink: 0; white-space: nowrap; }

.page-footer { height: 34px; flex-shrink: 0; background: ${THEME.primaryDark}; border-top: 3px solid ${THEME.gold}; display: flex; align-items: center; justify-content: space-between; padding: 0 26px; gap: 12px; }
.footer-left { font-size: 10px; font-weight: 600; color: rgba(255, 255, 255, 0.72); letter-spacing: 0.5px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.footer-left strong { color: ${THEME.gold}; font-weight: 800; }
.footer-right { font-size: 10.5px; font-weight: 700; color: #fff; letter-spacing: 0.5px; flex-shrink: 0; white-space: nowrap; }

table.pt { width: 100%; border-collapse: collapse; table-layout: fixed; }
col.c-sno { width: 42px; }
col.c-prod { width: auto; }
col.c-mrp { width: 82px; }
col.c-unit { width: 60px; }
col.c-offer { width: 90px; }
col.c-qty { width: 48px; }
col.c-amt { width: 68px; }
table.pt thead th { background: ${THEME.primaryDark}; color: #fff; font-size: 12px; font-weight: 700; text-align: center; padding: 0 6px; height: 33px; border: 1px solid #232B4D; line-height: 1.2; vertical-align: middle; }
table.pt thead th.th-prod { text-align: left; padding-left: 10px; }
tr.cat td { background: ${THEME.gold}; color: ${THEME.primaryDark}; text-align: center; font-family: 'Barlow Condensed', 'Open Sans', sans-serif; font-size: 12.5px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; height: 30px; border: 1px solid ${THEME.goldDeep}; vertical-align: middle; }
tr.cat.cat-contd td { background: ${THEME.goldSoft}; font-style: italic; letter-spacing: 1.2px; }
tr.pr td { font-size: 11.5px; font-weight: 400; color: ${THEME.textDark}; padding: 0 6px; height: 28px; border: 1px solid ${THEME.borderWarm}; vertical-align: middle; }
tr.pr td.td-sno { text-align: center; font-weight: 700; color: ${THEME.primaryDark}; }
tr.pr td.td-prod { text-align: left; padding-left: 10px; font-weight: 600; }
tr.pr td.td-mrp { text-align: right; }
tr.pr td.td-unit { text-align: center; }
tr.pr td.td-offer { text-align: right; font-weight: 800; color: ${THEME.goldDeep}; }
tr.pr td.td-qty { text-align: center; }
tr.pr td.td-amt { text-align: right; }
tr.pr:nth-child(even) td { background: ${THEME.ivory}; }
tr.pr:nth-child(odd) td { background: #ffffff; }
@media print {
  html, body { background: none; }
  .page { margin: 0; box-shadow: none; page-break-after: always; break-after: page; width: 100%; height: 100vh; }
}
`;

export function generatePriceListHtml(data: PriceListCategory[], company: CompanyInfo): string {
  const rows = buildRows(data);
  let sno = 1;
  rows.forEach(r => { if (r.type === "pr") r.sno = sno++; });

  const headerFullH = getHeaderFullH(company);
  const pages = paginate(rows, headerFullH);
  const total = pages.length;

  const pageHtmls = pages.map((pageRows, idx) => {
    const pageNum = idx + 1;
    const isFirst = idx === 0;
    return `
<div class="page">
  ${isFirst ? renderFullHeader(company) : renderMiniHeader(company)}
  <div class="page-body">
    <div class="table-pad-top"></div>
    <div class="table-area">${renderTable(pageRows)}</div>
    <div class="table-pad-bottom"></div>
  </div>
  ${renderFooter(company, pageNum, total)}
</div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${company.docTitle}</title>
<style>${CSS_STYLES}</style>
</head>
<body>
${pageHtmls}
</body>
</html>`;
}