/* Shared card catalogue and renderer. Used by the compose page, the mailbox pages and the card view page. */
(function (g) {
  'use strict';
  var MOTIFS = {
    none: { n: 'Байхгүй', svg: '' },
    heart: { n: 'Зүрх', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><path d="M24 41S6 30 6 17.5C6 11 11 7 16 7c3.5 0 6.5 2 8 5 1.5-3 4.5-5 8-5 5 0 10 4 10 10.5C42 30 24 41 24 41z"/></svg>' },
    cake: { n: 'Бялуу', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><rect x="8" y="26" width="32" height="14" rx="3"/><rect x="8" y="22" width="32" height="5" rx="2" opacity=".55"/><rect x="22" y="12" width="4" height="10" rx="1"/><path d="M24 4c3 3 3 6 0 8-3-2-3-5 0-8z"/></svg>' },
    envelope: { n: 'Дугтуй', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><rect x="5" y="11" width="38" height="27" rx="3" opacity=".3"/><path d="M5 14l19 14 19-14" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>' },
    star: { n: 'Од', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><path d="M24 5l5.5 12 13 1.5-9.7 8.8 2.7 12.9L24 33.4 12.5 40.2l2.7-12.9L5.5 18.5l13-1.5z"/></svg>' },
    flower: { n: 'Цэцэг', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><circle cx="24" cy="11" r="7"/><circle cx="37" cy="21" r="7"/><circle cx="32" cy="37" r="7"/><circle cx="16" cy="37" r="7"/><circle cx="11" cy="21" r="7"/><circle cx="24" cy="26" r="6" fill="#fff" opacity=".85"/></svg>' },
    balloon: { n: 'Бөмбөлөг', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><ellipse cx="24" cy="19" rx="12" ry="15"/><path d="M24 34l-3 5h6z"/><path d="M24 39c-4 3 4 5 0 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
    sun: { n: 'Нар', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><circle cx="24" cy="24" r="9"/><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/></g></svg>' },
    moon: { n: 'Сар', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><path d="M33 6a19 19 0 1 0 9 31A16 16 0 0 1 33 6z"/></svg>' },
    gift: { n: 'Бэлэг', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><rect x="7" y="20" width="34" height="21" rx="2"/><rect x="5" y="14" width="38" height="8" rx="2" opacity=".6"/><rect x="22" y="14" width="4" height="27" fill="#fff" opacity=".5"/><path d="M24 14c-4-9-12-8-10-3 1 3 6 3 10 3zM24 14c4-9 12-8 10-3-1 3-6 3-10 3z" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>' },
    ring: { n: 'Бөгж', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><circle cx="18" cy="31" r="10" fill="none" stroke="currentColor" stroke-width="3.5"/><circle cx="31" cy="31" r="10" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M24 4l5 6-5 7-5-7z"/></svg>' },
    cap: { n: 'Төгсөлт', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><path d="M24 8L3 18l21 10 21-10z"/><path d="M12 25v9c0 3 6 6 12 6s12-3 12-6v-9l-12 6z" opacity=".7"/><rect x="42" y="19" width="2.5" height="14" rx="1"/></svg>' },
    snow: { n: 'Цасан ширхэг', svg: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M24 4v40M6.7 14l34.6 20M6.7 34l34.6-20"/><path d="M19 8l5 4 5-4M19 40l5-4 5 4"/></svg>' },
    firework: { n: 'Салют', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M24 4v9M24 35v9M4 24h9M35 24h9M10 10l6 6M32 32l6 6M38 10l-6 6M16 32l-6 6"/></g><circle cx="24" cy="24" r="4"/></svg>' },
    butterfly: { n: 'Эрвээхэй', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><path d="M24 24C14 8 3 12 6 24c2 8 12 8 18 0z"/><path d="M24 24c10-16 21-12 18 0-2 8-12 8-18 0z"/><path d="M24 24c-8 2-12 14-6 18 4 2 8-6 6-18z" opacity=".75"/><path d="M24 24c8 2 12 14 6 18-4 2-8-6-6-18z" opacity=".75"/></svg>' },
    ger: { n: 'Гэр', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><path d="M24 5L5 22h38z"/><rect x="8" y="22" width="32" height="18"/><rect x="20" y="28" width="8" height="12" rx="4" fill="#fff" opacity=".85"/></svg>' },
    bell: { n: 'Хонх', svg: '<svg viewBox="0 0 48 48" fill="currentColor"><path d="M24 5c-8 0-12 6-12 14v8l-4 5h32l-4-5v-8c0-8-4-14-12-14z"/><circle cx="24" cy="41" r="4"/></svg>' },
    rainbow: { n: 'Солонго', svg: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M5 38a19 19 0 0 1 38 0"/><path d="M12 38a12 12 0 0 1 24 0" opacity=".75"/><path d="M19 38a5 5 0 0 1 10 0" opacity=".5"/></svg>' }
  };
  var MOTIF_ORDER = ['heart', 'cake', 'envelope', 'star', 'flower', 'balloon', 'sun', 'moon', 'gift', 'ring', 'cap', 'snow', 'firework', 'butterfly', 'ger', 'bell', 'rainbow', 'none'];
  var PATTERNS = { none: 'Хээгүй', confetti: 'Цацраг', dots: 'Цэг', stripes: 'Судал', waves: 'Долгион', hearts: 'Зүрхэн хээ', stars: 'Одон хээ', lines: 'Дэвтрийн шугам', snow: 'Цасан хээ', sparkle: 'Гялбаа', flowers: 'Цэцэгт хээ' };
  var PATTERN_ORDER = ['none', 'confetti', 'dots', 'stripes', 'waves', 'hearts', 'stars', 'lines', 'snow', 'sparkle', 'flowers'];
  var FONTS = { hand: 'Гар бичмэл', serif: 'Сонгодог', sans: 'Энгийн', round: 'Дугуй', bold: 'Тод' };
  var FONT_ORDER = ['hand', 'serif', 'sans', 'round', 'bold'];
  var PALETTES = [
    { n: 'Сарнай', c: ['#8e1b4a', '#d6456f', '#fff3f7'] }, { n: 'Нар жаргах', c: ['#f2b134', '#f07a3c', '#3a1d05'] },
    { n: 'Далай', c: ['#0f4c81', '#3aa0d8', '#eef8ff'] }, { n: 'Ой', c: ['#1e6b52', '#3aa07d', '#effaf4'] },
    { n: 'Лаванда', c: ['#5a3d8a', '#8f6fc7', '#f6f0ff'] }, { n: 'Ягаан', c: ['#f7c6d0', '#f9a8b8', '#4a1c2a'] },
    { n: 'Шөнө', c: ['#141a3a', '#3b3f8f', '#eef0ff'] }, { n: 'Алт', c: ['#7a5a12', '#d9a93a', '#fff8e6'] },
    { n: 'Гүргэм', c: ['#bfe8d8', '#8fd3bd', '#10382e'] }, { n: 'Тэнгэр', c: ['#d6e8fb', '#a9cdf3', '#122a47'] },
    { n: 'Шүр', c: ['#e2574c', '#f2955c', '#fff5f0'] }, { n: 'Цаас', c: ['#eaf0f9', '#d8e2f2', '#1d2b4a'] },
    { n: 'Хар', c: ['#1f1f24', '#4a4a55', '#f5f5f7'] },
    { n: 'Цагаан сар', c: ['#14367a', '#2f64c4', '#fff8e1'] }, { n: 'Салют', c: ['#0c1b3f', '#7a2fb5', '#fff2c2'] },
    { n: 'Хурим', c: ['#f1d9c9', '#e3b09a', '#4d2424'] }, { n: 'Төгсөлт', c: ['#13294b', '#2c5aa0', '#ffe9a8'] },
    { n: 'Ээж', c: ['#d9508a', '#f59ac0', '#fff5fa'] }, { n: 'Найз', c: ['#2aa198', '#86d9b0', '#052f2b'] },
    { n: 'Эдгэрэлт', c: ['#6ec1e4', '#bfe6a3', '#0d3446'] }, { n: 'Нялх', c: ['#bfe3ff', '#ffd6e8', '#274060'] }
  ];
  // scene: six decorations that float behind the text (matched to the template's own motif)
  var TEMPLATES = {
    love: { label: 'Хайрын үг', pal: 0, pattern: 'hearts', font: 'hand', motif: 'heart', align: 'left', scene: ['heart', 'heart', 'heart', 'star', 'heart', 'heart'] },
    bday: { label: 'Төрсөн өдрийн мэнд', pal: 1, pattern: 'confetti', font: 'hand', motif: 'cake', align: 'left', scene: ['balloon', 'star', 'balloon', 'gift', 'star', 'balloon'] },
    letter: { label: 'Сэтгэлийн захидал', pal: 11, pattern: 'lines', font: 'hand', motif: 'envelope', align: 'left', scene: ['envelope', 'heart', 'envelope', 'star', 'heart', 'envelope'] },
    cheers: { label: 'Баяр хүргэе', pal: 3, pattern: 'stars', font: 'round', motif: 'star', align: 'center', scene: ['star', 'firework', 'star', 'star', 'firework', 'star'] },
    thanks: { label: 'Талархлын үг', pal: 4, pattern: 'dots', font: 'serif', motif: 'flower', align: 'center', scene: ['flower', 'heart', 'flower', 'butterfly', 'flower', 'heart'] },
    night: { label: 'Сайхан амраарай', pal: 6, pattern: 'stars', font: 'serif', motif: 'moon', align: 'center', scene: ['moon', 'star', 'star', 'star', 'star', 'star'] },
    sunny: { label: 'Сайхан өдрийн мэнд', pal: 7, pattern: 'waves', font: 'bold', motif: 'sun', align: 'left', scene: ['sun', 'rainbow', 'butterfly', 'sun', 'flower', 'sun'] },
    gift: { label: 'Бэлгийн карт', pal: 10, pattern: 'stripes', font: 'sans', motif: 'gift', align: 'center', scene: ['gift', 'star', 'gift', 'heart', 'star', 'gift'] },
    tsagaan: { label: 'Цагаан сарын мэнд', pal: 13, pattern: 'sparkle', font: 'serif', motif: 'ger', align: 'center', scene: ['ger', 'sun', 'star', 'ger', 'star', 'sun'] },
    newyear: { label: 'Шинэ жилийн мэнд', pal: 14, pattern: 'snow', font: 'round', motif: 'firework', align: 'center', scene: ['firework', 'star', 'bell', 'firework', 'star', 'snow'] },
    wedding: { label: 'Аз жаргал хүсье', pal: 15, pattern: 'flowers', font: 'serif', motif: 'ring', align: 'center', scene: ['ring', 'heart', 'flower', 'heart', 'ring', 'flower'] },
    graduation: { label: 'Төгсөлтийн мэнд', pal: 16, pattern: 'stars', font: 'bold', motif: 'cap', align: 'center', scene: ['cap', 'star', 'cap', 'star', 'firework', 'star'] },
    mother: { label: 'Хайрт ээждээ', pal: 17, pattern: 'flowers', font: 'hand', motif: 'flower', align: 'left', scene: ['flower', 'heart', 'flower', 'butterfly', 'heart', 'flower'] },
    friend: { label: 'Найздаа', pal: 18, pattern: 'confetti', font: 'round', motif: 'rainbow', align: 'center', scene: ['rainbow', 'star', 'heart', 'butterfly', 'star', 'sun'] },
    getwell: { label: 'Эдгэрэхийг хүсье', pal: 19, pattern: 'dots', font: 'hand', motif: 'butterfly', align: 'left', scene: ['butterfly', 'flower', 'sun', 'heart', 'butterfly', 'star'] },
    baby: { label: 'Хүүхэдтэй болсонд баяр хүргэе', pal: 20, pattern: 'dots', font: 'round', motif: 'balloon', align: 'center', scene: ['balloon', 'star', 'heart', 'balloon', 'star', 'bell'] }
  };
  var TEMPLATE_ORDER = ['love', 'bday', 'letter', 'cheers', 'thanks', 'night', 'sunny', 'gift', 'tsagaan', 'newyear', 'wedding', 'graduation', 'mother', 'friend', 'getwell', 'baby'];
  var HEX = /^#[0-9a-fA-F]{6}$/;
  var SLOTS = [
    { x: 76, y: 4, s: 64, r: 14, o: .22 }, { x: 3, y: 60, s: 50, r: -12, o: .18 }, { x: 86, y: 56, s: 40, r: 10, o: .18 },
    { x: 48, y: 86, s: 36, r: -8, o: .15 }, { x: 60, y: 28, s: 30, r: 20, o: .13 }, { x: -1, y: 16, s: 34, r: -16, o: .15 }
  ];

  // Styles for the card extras live here so every page that shows a card gets them with this one file.
  (function () {
    if (!g.document || g.document.getElementById('sc-style')) return;
    var css = '' +
      '.card{isolation:isolate}' +
      '.card>*{position:relative;z-index:1}' +
      '.card>.scene{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}' +
      '.scene .sc{position:absolute;display:block}' +
      '.scene .sc svg{width:100%;height:100%;display:block}' +
      '@media (prefers-reduced-motion:no-preference){.scene .sc{animation:scFloat 8s ease-in-out infinite}}' +
      '@keyframes scFloat{0%,100%{translate:0 0}50%{translate:0 -9px}}' +
      '.card .card-video{display:block;width:100%;max-height:340px;background:#000;border:5px solid #fff;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,.25);box-sizing:border-box}' +
      '.card .media-imgs{gap:10px;padding:4px 2px}' +
      '.card .media-imgs img{border:5px solid #fff;border-radius:6px;box-shadow:0 6px 16px rgba(0,0,0,.25)}' +
      '.card .media-imgs img:nth-child(odd){transform:rotate(-1.4deg)}' +
      '.card .media-imgs img:nth-child(even){transform:rotate(1.2deg)}';
    var st = g.document.createElement('style');
    st.id = 'sc-style';
    st.textContent = css;
    g.document.head.appendChild(st);
  })();

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmt(ts) {
    if (!ts) return '';
    var d = new Date(ts), p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
  }

  function resolve(c) {
    var t = TEMPLATES[c.type] || TEMPLATES.love;
    var p = PALETTES[t.pal].c;
    return {
      type: TEMPLATES[c.type] ? c.type : 'love',
      c1: HEX.test(c.c1) ? c.c1 : p[0], c2: HEX.test(c.c2) ? c.c2 : p[1], ink: HEX.test(c.ink) ? c.ink : p[2],
      pattern: PATTERNS[c.pattern] ? c.pattern : t.pattern, font: FONTS[c.font] ? c.font : t.font,
      motif: MOTIFS[c.motif] ? c.motif : t.motif,
      align: c.align === 'center' ? 'center' : (c.align === 'left' ? 'left' : t.align)
    };
  }

  function patternLayers(p, ink) {
    var mix = function (pct) { return 'color-mix(in srgb, currentColor ' + pct + '%, transparent)'; };
    var img = [], size = [];
    function svgUrl(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }
    var head = "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>";
    if (p === 'confetti') {
      img.push('radial-gradient(circle at 18% 78%,' + mix(18) + ' 0 5px,transparent 6px)');
      img.push('radial-gradient(circle at 82% 62%,' + mix(14) + ' 0 7px,transparent 8px)');
      img.push('radial-gradient(circle at 60% 90%,' + mix(18) + ' 0 4px,transparent 5px)');
      img.push('radial-gradient(circle at 34% 24%,' + mix(12) + ' 0 3px,transparent 4px)');
      img.push('radial-gradient(circle at 70% 12%,' + mix(14) + ' 0 5px,transparent 6px)');
      size = ['auto', 'auto', 'auto', 'auto', 'auto'];
    } else if (p === 'dots') {
      img.push('radial-gradient(' + mix(18) + ' 1.6px,transparent 2.2px)'); size.push('16px 16px');
    } else if (p === 'stripes') {
      img.push('repeating-linear-gradient(45deg,transparent 0 14px,' + mix(10) + ' 14px 28px)'); size.push('auto');
    } else if (p === 'waves') {
      img.push('repeating-radial-gradient(circle at 0 100%,transparent 0 18px,' + mix(12) + ' 18px 20px)'); size.push('auto');
    } else if (p === 'hearts') {
      img.push(svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><path d='M28 42S12 32 12 21c0-5 4-9 8-9 3 0 6 2 8 5 2-3 5-5 8-5 4 0 8 4 8 9 0 11-16 21-16 21z' fill='" + ink + "' fill-opacity='.13'/></svg>")); size.push('56px 56px');
    } else if (p === 'stars') {
      img.push(svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M30 10l4 9 10 1-7.5 6.6 2.3 9.8L30 31l-8.8 5.4 2.3-9.8L16 20l10-1z' fill='" + ink + "' fill-opacity='.14'/></svg>")); size.push('60px 60px');
    } else if (p === 'snow') {
      img.push(svgUrl(head + "<g stroke='" + ink + "' stroke-opacity='.17' stroke-width='1.6' stroke-linecap='round'><path d='M16 8v14M9 15h14M11 10l10 10M21 10L11 20'/></g><circle cx='46' cy='44' r='2.6' fill='" + ink + "' fill-opacity='.15'/><circle cx='52' cy='14' r='1.8' fill='" + ink + "' fill-opacity='.13'/><circle cx='30' cy='52' r='1.6' fill='" + ink + "' fill-opacity='.12'/></svg>")); size.push('64px 64px');
    } else if (p === 'sparkle') {
      img.push(svgUrl(head + "<path d='M16 5c1 7 2 8 9 9-7 1-8 2-9 9-1-7-2-8-9-9 7-1 8-2 9-9z' fill='" + ink + "' fill-opacity='.17'/><path d='M46 38c.7 4 1.3 4.7 5 5.3-3.700.6-4.300 1.300-5 5.300-.7-4-1.300-4.700-5-5.300 3.700-.6 4.300-1.300 5-5.300z' fill='" + ink + "' fill-opacity='.17'/></svg>")); size.push('64px 64px');
    } else if (p === 'flowers') {
      var fl = "<g fill='" + ink + "' fill-opacity='.14'><circle cx='16' cy='9' r='4'/><circle cx='23' cy='14' r='4'/><circle cx='20' cy='22' r='4'/><circle cx='12' cy='22' r='4'/><circle cx='9' cy='14' r='4'/></g><circle cx='16' cy='16' r='2.6' fill='" + ink + "' fill-opacity='.22'/>";
      img.push(svgUrl(head + fl + "<g transform='translate(30 32)'>" + fl + '</g></svg>')); size.push('64px 64px');
    }
    return { img: img, size: size };
  }

  var scenes = 0;
  function buildScene(d, t) {
    var keys = d.motif === t.motif && t.scene ? t.scene : [d.motif, d.motif, d.motif, 'star', 'heart', d.motif];
    var wrap = el('div', 'scene');
    wrap.setAttribute('aria-hidden', 'true');
    SLOTS.forEach(function (s, i) {
      var k = keys[i % keys.length];
      if (!MOTIFS[k] || !MOTIFS[k].svg) return;
      var sp = el('span', 'sc');
      sp.innerHTML = MOTIFS[k].svg;
      sp.style.left = s.x + '%'; sp.style.top = s.y + '%';
      sp.style.width = s.s + 'px'; sp.style.height = s.s + 'px';
      sp.style.opacity = String(s.o);
      sp.style.transform = 'rotate(' + s.r + 'deg)';
      sp.style.animationDuration = (6 + ((scenes + i) % 5)) + 's';
      sp.style.animationDelay = '-' + ((scenes * 3 + i * 2) % 9) + 's';
      wrap.appendChild(sp);
    });
    scenes++;
    return wrap;
  }

  function buildCard(c, ghost) {
    var d = resolve(c);
    var t = TEMPLATES[d.type];
    var card = el('article', 'card f-' + d.font + ' a-' + d.align + (d.pattern === 'lines' ? ' p-lines' : '') + (ghost ? ' ghosted' : ''));
    var pl = patternLayers(d.pattern, d.ink);
    // a soft light from the top corner, then the pattern, then the colour wash
    card.style.backgroundImage = ['radial-gradient(circle at 88% -4%,rgba(255,255,255,.30),transparent 58%)'].concat(pl.img, ['linear-gradient(150deg,' + d.c1 + ',' + d.c2 + ')']).join(',');
    card.style.backgroundSize = ['auto'].concat(pl.size, ['auto']).join(',');
    card.style.backgroundColor = d.c1;
    card.style.color = d.ink;
    card.appendChild(buildScene(d, t));
    var top = el('div', 'card-top');
    top.appendChild(el('span', 'chip', t.label));
    var m = el('span', 'motif');
    m.innerHTML = MOTIFS[d.motif].svg;
    top.appendChild(m);
    card.appendChild(top);
    var who = el('div');
    who.appendChild(el('div', 'to-label', 'Хэнд'));
    who.appendChild(el('div', 'to', String(c.to == null ? '' : c.to)));
    card.appendChild(who);
    card.appendChild(el('div', 'msg', String(c.message == null ? '' : c.message)));
    if (c.videoSrc) {
      var vid = document.createElement('video');
      vid.className = 'card-video';
      vid.src = c.videoSrc; vid.controls = true; vid.playsInline = true; vid.preload = 'metadata';
      vid.setAttribute('playsinline', '');
      card.appendChild(vid);
    }
    if (Array.isArray(c.imageSrcs) && c.imageSrcs.length) {
      var gal = el('div', 'media-imgs' + (c.imageSrcs.length === 1 ? ' one' : ''));
      c.imageSrcs.slice(0, 3).forEach(function (src) {
        var im = document.createElement('img');
        im.src = src; im.alt = 'Мэндчилгээний зураг';
        gal.appendChild(im);
      });
      card.appendChild(gal);
    }
    var foot = el('div', 'card-foot');
    foot.appendChild(el('span', 'from', '— ' + String(c.from == null ? '' : c.from)));
    foot.appendChild(el('span', '', fmt(c.createdAt)));
    card.appendChild(foot);
    return card;
  }

  function imageUrls(cardId, n) {
    var out = [];
    for (var i = 0; i < Math.min(3, Number(n) || 0); i++) out.push('/api/cards/' + cardId + '/img/' + i);
    return out;
  }

  // Shrink a picked photo to a JPEG data URL (the server checks the bytes again).
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader(), im = new Image();
      reader.onerror = function () { reject(); };
      reader.onload = function () { im.src = reader.result; };
      reader.readAsDataURL(file);
      im.onload = function () {
        var side = 1200, tries = 0, q = 0.82;
        var s = Math.min(1, side / Math.max(im.width, im.height));
        var cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(im.width * s)); cv.height = Math.max(1, Math.round(im.height * s));
        var cx = cv.getContext('2d');
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
        cx.drawImage(im, 0, 0, cv.width, cv.height);
        var out = cv.toDataURL('image/jpeg', q);
        while (out.length * 0.75 > 400 * 1024 && tries < 8) {
          q -= 0.1;
          if (q < 0.3) { cv.width = Math.round(cv.width * 0.8); cv.height = Math.round(cv.height * 0.8); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height); q = 0.7; }
          out = cv.toDataURL('image/jpeg', q); tries++;
        }
        out.length * 0.75 > 440 * 1024 ? reject() : resolve(out);
      };
      im.onerror = function () { reject(); };
    });
  }

  // Sends a video to the server as raw bytes and resolves with a one-time token the card will carry.
  var VIDEO_LIMIT = 25 * 1024 * 1024;
  function uploadVideo(file) {
    if (!file || !/^video\//.test(file.type || '')) return Promise.reject(new Error('Видео сонгоно уу.'));
    if (file.size > VIDEO_LIMIT) return Promise.reject(new Error('Видео 25MB-аас бага байх ёстой. Богино бичлэг сонгоно уу.'));
    return fetch('/api/uploads/video', { method: 'POST', headers: { 'Content-Type': file.type }, body: file }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error((j && j.error) || 'Видео оруулж чадсангүй.'); return j.token; });
    });
  }
  function videoUrl(cardId, has) { return has ? '/api/cards/' + cardId + '/video' : ''; }

  // Suggested messages: a small menu under the message box. Tapping one fills the box; the person can still edit it.
  var SUGGEST = {
    love: ['Чамайг хайрлах сэтгэл минь өдөр ирэх тусам нэмэгдсээр байна.', 'Чи миний амьдралын хамгийн сайхан бэлэг мөн.', 'Хаана ч, хэзээ ч чамайгаа санасаар байх болно.'],
    bday: ['Төрсөн өдрийн мэнд хүргэе! Бүх хүсэл мөрөөдөл чинь биелэх болтугай.', 'Шинэ нас чинь аз жаргал, эрүүл энхээр дүүрэн байг.', 'Өнөөдөр чиний өдөр, хамгийн их баяр хөөрийг мэдэр!'],
    letter: ['Чамд хэлэх үг олон байсан ч бичиж үлдээхийг хүслээ.', 'Өдөр бүр чамайг дурсан бодож явдаг шүү.', 'Энэ захидал чамд сэтгэлийн дулааныг минь дамжуулах болтугай.'],
    cheers: ['Амжилт гаргасан чамд чин сэтгэлээсээ баяр хүргэе!', 'Чиний хичээл зүтгэл үр дүнгээ өгсөнд маш их баярлаж байна.', 'Цаашдын бүхий л ажил чинь бүтэмжтэй байх болтугай.'],
    thanks: ['Надад хийсэн бүх сайн сайхан зүйлд чинь чин сэтгэлээсээ баярлалаа.', 'Чи миний хажууд байдаг нь надад маш том хүч.', 'Талархлаа үгээр илэрхийлэхэд бэрх ч сэтгэлээсээ баярлаж байна.'],
    night: ['Сайхан амраарай, амар амгалан нойр чинь хүрэх болтугай.', 'Өнөөдрийн ядаргаагаа мартаад тайван унт.', 'Сайхан мөрөөдөл зүүдлээрэй, маргааш уулзъя.'],
    sunny: ['Өдрийн мэнд! Өнөөдөр чамд сайхан өдөр болог.', 'Нарлаг сэтгэлтэй, инээмсэглэлтэй өдөр өнгөрүүлээрэй.', 'Өглөө бүр чамд шинэ боломж, шинэ баяр авчирах болтугай.'],
    gift: ['Энэ бэлгийг сэтгэлээсээ чамд зориулав.', 'Бяцхан бэлэг боловч сэтгэл минь дүүрэн байгаа.', 'Чамд таалагдана гэж найдаж байна.'],
    tsagaan: ['Цагаан сарын мэнд хүргэе! Идээ ундаа элбэг, амгалан тайван жил болтугай.', 'Шинэ жилдээ амар амгалан, аз жаргалтай, эрүүл энхтэй байгаарай.', 'Өтгөн цагаан сарын мэнд! Эрүүл энх, элбэг дэлбэг байгаарай.'],
    newyear: ['Шинэ жилийн мэнд хүргэе! Шинэ онд бүх хүсэл чинь биелэх болтугай.', 'Шинэ жил чамд аз жаргал, эрүүл мэнд авчрах болтугай.', 'Ирэх жил урамтай, амжилттай жил байх болтугай.'],
    wedding: ['Хос бүрэлдсэн танд аз жаргал хүсье!', 'Та хоёрын хайр насан туршдаа хүчтэй байх болтугай.', 'Гэр бүл болсон танд чин сэтгэлээсээ баяр хүргэе.'],
    graduation: ['Төгссөн танд чин сэтгэлээсээ баяр хүргэе!', 'Энэ бол шинэ замын эхлэл. Амжилт хүсье!', 'Чиний хичээл зүтгэлд бахархаж байна.'],
    mother: ['Ээж минь, чамд маш их хайртай шүү.', 'Таны халуун дулаан сэтгэлд үргэлж талархдаг.', 'Ээж минь эрүүл энхтэй, аз жаргалтай байгаарай.'],
    friend: ['Найз минь, чамтай нөхөрлөж байгаадаа аз жаргалтай байна.', 'Хамтдаа инээж баярласан өдрүүд минь үргэлж санагддаг.', 'Чам шиг найзтай болсондоо баяртай байна.'],
    getwell: ['Эрт эдгэрээрэй, чамайг бодож байна.', 'Эрүүл мэнд чинь удахгүй сайжрах болтугай.', 'Бүх зүйл сайхан болно, хүч оруулаад байна.'],
    baby: ['Хүүхэдтэй болсонд чинь чин сэтгэлээсээ баяр хүргэе!', 'Бяцхан хүүхэд чинь эрүүл энхтэй, аз жаргалтай өсөх болтугай.', 'Гэр бүлд тань шинэ жаргал ирсэнд баяртай байна.']
  };
  (function () {
    if (!g.document) return;
    var ta = g.document.getElementById('message'), tiles = g.document.getElementById('types');
    if (!ta || !tiles) return;
    var st = g.document.createElement('style');
    st.textContent = '.sc-sug{margin:-4px 0 14px;border:1px solid var(--line);border-radius:12px;background:var(--soft);padding:2px 12px}' +
      '.sc-sug summary{cursor:pointer;font-weight:700;font-size:.92rem;padding:10px 0;list-style:none}' +
      '.sc-sug summary::-webkit-details-marker{display:none}' +
      '.sc-sug summary::after{content:" ▾";color:var(--muted)}' +
      '.sc-sug[open] summary::after{content:" ▴"}' +
      '.sc-sug .sc-list{display:flex;flex-direction:column;gap:8px;padding:0 0 12px}' +
      '.sc-sug .sc-pick{font:inherit;font-size:.92rem;text-align:left;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 12px;cursor:pointer;overflow-wrap:anywhere}' +
      '.sc-sug .sc-pick:hover{border-color:var(--accent)}';
    g.document.head.appendChild(st);
    var wrap = g.document.createElement('details');
    wrap.className = 'sc-sug';
    var sum = g.document.createElement('summary');
    sum.textContent = 'Санал болгох үгс';
    var list = g.document.createElement('div');
    list.className = 'sc-list';
    wrap.appendChild(sum); wrap.appendChild(list);
    var field = ta.parentNode;
    field.parentNode.insertBefore(wrap, field.nextSibling);
    var current = '';
    function currentKey() {
      var on = tiles.querySelector('[aria-pressed="true"] .tile-name');
      var label = on ? on.textContent : '';
      for (var k in TEMPLATES) if (TEMPLATES[k].label === label) return k;
      return 'love';
    }
    function fill() {
      var k = currentKey();
      if (k === current) return;
      current = k;
      list.textContent = '';
      (SUGGEST[k] || []).forEach(function (txt) {
        var b = g.document.createElement('button');
        b.type = 'button'; b.className = 'sc-pick'; b.textContent = txt;
        b.addEventListener('click', function () {
          var max = ta.maxLength > 0 ? ta.maxLength : 300;
          ta.value = txt.slice(0, max);
          ta.dispatchEvent(new g.Event('input', { bubbles: true }));
          ta.focus();
        });
        list.appendChild(b);
      });
    }
    new g.MutationObserver(fill).observe(tiles, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
    fill();
  })();

  g.SC = {
    uploadVideo: uploadVideo, videoUrl: videoUrl,
    imageUrls: imageUrls, shrink: shrink,
    MOTIFS: MOTIFS, MOTIF_ORDER: MOTIF_ORDER, PATTERNS: PATTERNS, PATTERN_ORDER: PATTERN_ORDER, FONTS: FONTS, FONT_ORDER: FONT_ORDER,
    PALETTES: PALETTES, TEMPLATES: TEMPLATES, TEMPLATE_ORDER: TEMPLATE_ORDER, buildCard: buildCard, el: el
  };
})(typeof window !== 'undefined' ? window : globalThis);
