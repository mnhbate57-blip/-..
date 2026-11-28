'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const config = require('./config');
const createStore = require('./store');
const provider = config.provider === 'qpay' ? require('./providers/qpay') : require('./providers/mock');

if (config.provider === 'qpay' && !(config.qpay.username && config.qpay.password && config.qpay.invoiceCode)) {
  console.error('PAYMENT_PROVIDER=qpay needs QPAY_USERNAME, QPAY_PASSWORD and QPAY_INVOICE_CODE.');
  process.exit(1);
}
if (config.isProd && config.provider === 'qpay' && !/^https:\/\//.test(config.baseUrl)) {
  console.error('BASE_URL must be an https address in production, QPay calls it back.');
  process.exit(1);
}

const store = createStore(config.dataFile);
// Mailboxes need no account: a public id to receive cards, a secret key to read them. The key is kept in the record's cardId slot so the same store code can look it up.
const mailboxes = createStore(path.join(path.dirname(config.dataFile), 'mailboxes.json'));
const MAILBOX_MAX_MESSAGES = 500;
function boxMessages(box) {
  return store.all().filter((o) => o.mailboxId === box.id && o.status === 'paid').sort((a, b) => b.paidAt - a.paidAt);
}
function htmlEscape(v) { return String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ---------- card validation: the browser is never trusted ---------- */
const TYPES = ['love', 'bday', 'letter', 'cheers', 'thanks', 'night', 'sunny', 'gift', 'tsagaan', 'newyear', 'wedding', 'graduation', 'mother', 'friend', 'getwell', 'baby'];
const PATTERNS = ['none', 'confetti', 'dots', 'stripes', 'waves', 'hearts', 'stars', 'lines', 'snow', 'sparkle', 'flowers'];
const FONTS = ['hand', 'serif', 'sans', 'round', 'bold'];
const MOTIFS = ['none', 'heart', 'cake', 'envelope', 'star', 'flower', 'balloon', 'sun', 'moon', 'gift', 'ring', 'cap', 'snow', 'firework', 'butterfly', 'ger', 'bell', 'rainbow'];

// What the free plan gets: the template's own look. The server applies it, so the browser cannot ask for more.
const FREE_STYLE = {
  love:   { c: ['#8e1b4a', '#d6456f', '#fff3f7'], pattern: 'hearts',   font: 'hand',  motif: 'heart',    align: 'left' },
  bday:   { c: ['#f2b134', '#f07a3c', '#3a1d05'], pattern: 'confetti', font: 'hand',  motif: 'cake',     align: 'left' },
  letter: { c: ['#eaf0f9', '#d8e2f2', '#1d2b4a'], pattern: 'lines',    font: 'hand',  motif: 'envelope', align: 'left' },
  cheers: { c: ['#1e6b52', '#3aa07d', '#effaf4'], pattern: 'stars',    font: 'round', motif: 'star',     align: 'center' },
  thanks: { c: ['#5a3d8a', '#8f6fc7', '#f6f0ff'], pattern: 'dots',     font: 'serif', motif: 'flower',   align: 'center' },
  night:  { c: ['#141a3a', '#3b3f8f', '#eef0ff'], pattern: 'stars',    font: 'serif', motif: 'moon',     align: 'center' },
  sunny:  { c: ['#7a5a12', '#d9a93a', '#fff8e6'], pattern: 'waves',    font: 'bold',  motif: 'sun',      align: 'left' },
  gift:   { c: ['#e2574c', '#f2955c', '#fff5f0'], pattern: 'stripes',  font: 'sans',  motif: 'gift',     align: 'center' },
  tsagaan:    { c: ['#14367a', '#2f64c4', '#fff8e1'], pattern: 'sparkle', font: 'serif', motif: 'ger',       align: 'center' },
  newyear:    { c: ['#0c1b3f', '#7a2fb5', '#fff2c2'], pattern: 'snow',    font: 'round', motif: 'firework',  align: 'center' },
  wedding:    { c: ['#f1d9c9', '#e3b09a', '#4d2424'], pattern: 'flowers', font: 'serif', motif: 'ring',      align: 'center' },
  graduation: { c: ['#13294b', '#2c5aa0', '#ffe9a8'], pattern: 'stars',   font: 'bold',  motif: 'cap',       align: 'center' },
  mother:     { c: ['#d9508a', '#f59ac0', '#fff5fa'], pattern: 'flowers', font: 'hand',  motif: 'flower',    align: 'left' },
  friend:     { c: ['#2aa198', '#86d9b0', '#052f2b'], pattern: 'confetti', font: 'round', motif: 'rainbow',  align: 'center' },
  getwell:    { c: ['#6ec1e4', '#bfe6a3', '#0d3446'], pattern: 'dots',    font: 'hand',  motif: 'butterfly', align: 'left' },
  baby:       { c: ['#bfe3ff', '#ffd6e8', '#274060'], pattern: 'dots',    font: 'round', motif: 'balloon',   align: 'center' }
};
const FREE_MESSAGE_MAX = 300;

function validateCard(b, plan) {
  if (!b || typeof b !== 'object') return null;
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const to = str(b.to, 60);
  const from = str(b.from, 60) || 'Нэргүй';
  const message = str(b.message, plan === 'premium' ? 600 : FREE_MESSAGE_MAX);
  if (!to || !message) return null;
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  const hex = (v, d) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d);
  const type = pick(b.type, TYPES, 'love');
  if (plan !== 'premium') {
    const f = FREE_STYLE[type];
    return { plan: 'free', type, c1: f.c[0], c2: f.c[1], ink: f.c[2], pattern: f.pattern, font: f.font, motif: f.motif, align: f.align, to, from, message };
  }
  return {
    plan: 'premium',
    type,
    c1: hex(b.c1, '#8e1b4a'),
    c2: hex(b.c2, '#d6456f'),
    ink: hex(b.ink, '#fff3f7'),
    pattern: pick(b.pattern, PATTERNS, 'none'),
    font: pick(b.font, FONTS, 'hand'),
    motif: pick(b.motif, MOTIFS, 'heart'),
    align: b.align === 'center' ? 'center' : 'left',
    to, from, message
  };
}

/* Up to 3 JPEG pictures per card. The browser shrinks them first; the server still checks every byte count. */
const MEDIA_DIR = path.join(path.dirname(config.dataFile), 'media');
const MAX_IMAGES = 3;
const FREE_MAX_IMAGES = 1;
const MAX_IMAGE_BYTES = 450 * 1024;

function validateImages(list, max) {
  if (list == null) return [];
  if (!Array.isArray(list) || list.length > (max || MAX_IMAGES)) return null;
  const out = [];
  for (const s of list) {
    const m = typeof s === 'string' && /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(s);
    if (!m) return null;
    const buf = Buffer.from(m[1], 'base64');
    if (buf.length < 200 || buf.length > MAX_IMAGE_BYTES) return null;
    if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) return null;
    out.push(buf);
  }
  return out;
}

/* One short video per card. It is uploaded first as raw bytes (not JSON), checked by its first bytes, then attached to the card by a one-time token. */
const VIDEO_MAX = 25 * 1024 * 1024;
const VIDEO_TYPES = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
function sniffVideo(buf) {
  if (buf.length > 16 && buf.slice(4, 8).toString('latin1') === 'ftyp') return buf.slice(8, 12).toString('latin1') === 'qt  ' ? 'mov' : 'mp4';
  if (buf.length > 16 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'webm';
  return null;
}
function readBuffer(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function findTmpVideo(token) {
  if (token == null || token === '') return { none: true };
  if (typeof token !== 'string' || !/^[a-f0-9]{32}$/.test(token)) return null;
  for (const ext of Object.keys(VIDEO_TYPES)) {
    const f = path.join(MEDIA_DIR, 'tmp-' + token + '.' + ext);
    if (fs.existsSync(f)) return { file: f, ext };
  }
  return null;
}
async function attachVideo(tmp, cardId) {
  if (!tmp || tmp.none) return null;
  await fs.promises.rename(tmp.file, path.join(MEDIA_DIR, cardId + '-v.' + tmp.ext));
  return tmp.ext;
}
function videoFile(order) { return order && order.video ? path.join(MEDIA_DIR, order.cardId + '-v.' + order.video) : null; }
// Videos that were uploaded but never attached to a card are removed after an hour.
setInterval(() => {
  fs.readdir(MEDIA_DIR, (err, names) => {
    if (err) return;
    names.filter((n) => n.startsWith('tmp-')).forEach((n) => {
      const f = path.join(MEDIA_DIR, n);
      fs.stat(f, (e, st) => { if (!e && Date.now() - st.mtimeMs > 3600e3) fs.unlink(f, () => {}); });
    });
  });
}, 15 * 60e3).unref();

function isFree() { return config.freeUntil > 0 && Date.now() <= config.freeUntil; }

/* ---------- small helpers ---------- */
function send(res, status, body, headers) {
  const isJson = typeof body === 'object' && !Buffer.isBuffer(body);
  const payload = isJson ? JSON.stringify(body) : body;
  res.writeHead(status, Object.assign({
    'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  }, headers || {}));
  res.end(payload);
}

function readJson(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null')); }
      catch (e) { reject(Object.assign(new Error('bad json'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function clientIp(req) {
  if (config.trustProxy) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

const hits = new Map();
function rateLimited(ip, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}
setInterval(() => { const now = Date.now(); hits.forEach((arr, ip) => { if (!arr.some((t) => now - t < 3600e3)) hits.delete(ip); }); }, 600e3).unref();
// Wrong admin keys are counted per IP so the key cannot be guessed by trying again and again.
const adminFails = new Map();
function adminBlocked(ip) {
  const now = Date.now();
  const arr = (adminFails.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  adminFails.set(ip, arr);
  return arr.length >= 8;
}
function adminFailed(ip) { const arr = adminFails.get(ip) || []; arr.push(Date.now()); adminFails.set(ip, arr); }

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/* ---------- payment state ---------- */
const inflight = new Set();

async function markPaid(order, result) {
  if (order.status === 'paid') return;
  order.status = 'paid';
  order.paidAt = Date.now();
  order.paidAmount = result.paidAmount;
  await store.put(order);
  console.log('order paid', order.id, result.paidAmount);
}

// Ask the provider if the order is paid. Throttled so polling cannot flood the provider.
async function refresh(order, force) {
  if (order.status === 'paid') return order;
  const now = Date.now();
  if (!force && now - (order.lastCheck || 0) < 2500) return order;
  if (inflight.has(order.id)) return order;
  inflight.add(order.id);
  order.lastCheck = now;
  try {
    const r = await provider.checkPayment(order);
    if (r && r.paid && r.paidAmount >= order.amount) await markPaid(order, r);
  } catch (e) {
    console.error('payment check failed', order.id, e.message);
  } finally {
    inflight.delete(order.id);
  }
  return order;
}

function publicOrder(order) {
  const out = { id: order.id, status: order.status, amount: order.amount };
  if (order.status === 'paid') out.cardId = order.cardId;
  else if (Date.now() - order.createdAt > 30 * 60 * 1000) out.status = 'expired';
  return out;
}

/* ---------- static files ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon'
};
const PUBLIC = path.join(__dirname, 'public');
const SECURITY = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
};

// Public address used in share-preview tags. BASE_URL wins; otherwise the request's own host (validated).
function originOf(req) {
  if (process.env.BASE_URL) return config.baseUrl;
  const host = String((req && req.headers.host) || '');
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return config.baseUrl;
  const proto = config.trustProxy && req.headers['x-forwarded-proto'] === 'https' ? 'https' : (req.socket && req.socket.encrypted ? 'https' : 'http');
  return proto + '://' + host;
}

function serveStatic(res, rel, req, vars) {
  const file = path.normalize(path.join(PUBLIC, rel));
  if (file !== PUBLIC && !file.startsWith(PUBLIC + path.sep)) return send(res, 404, 'Not found');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found');
    const type = MIME[path.extname(file)] || 'application/octet-stream';
    if (type.startsWith('text/html')) {
      let html = buf.toString('utf8').replace(/__ORIGIN__/g, originOf(req));
      Object.keys(vars || {}).forEach((k) => { html = html.split('__' + k + '__').join(htmlEscape(vars[k])); });
      buf = Buffer.from(html, 'utf8');
    }
    res.writeHead(200, Object.assign({ 'Content-Type': type, 'Cache-Control': /^(text\/html|text\/css|text\/javascript)/.test(type) ? 'no-cache' : 'public, max-age=300' }, SECURITY));
    res.end(buf);
  });
}

/* ---------- routes ---------- */
async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  const m = req.method;

  if (m === 'GET' && p === '/api/config') {
    return send(res, 200, { price: config.price, free: isFree(), freeUntil: isFree() ? config.freeUntilText : '', mock: provider.name === 'mock' && !config.isProd });
  }

  if (m === 'POST' && p === '/api/uploads/video') {
    if (rateLimited(clientIp(req) + ':vid', 6, 10 * 60 * 1000)) return send(res, 429, { error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.' });
    const len = Number(req.headers['content-length'] || 0);
    if (!len || len > VIDEO_MAX) return send(res, 413, { error: 'Видео 25MB-аас бага байх ёстой.' });
    let buf;
    try { buf = await readBuffer(req, VIDEO_MAX); } catch (e) { return send(res, 413, { error: 'Видео 25MB-аас бага байх ёстой.' }); }
    const ext = sniffVideo(buf);
    if (!ext) return send(res, 400, { error: 'Зөвхөн MP4, MOV, WebM видео оруулна уу.' });
    const token = crypto.randomBytes(16).toString('hex');
    try {
      await fs.promises.mkdir(MEDIA_DIR, { recursive: true });
      await fs.promises.writeFile(path.join(MEDIA_DIR, 'tmp-' + token + '.' + ext), buf);
    } catch (e) { return send(res, 500, { error: 'Видео хадгалж чадсангүй.' }); }
    return send(res, 201, { token });
  }

  if (m === 'POST' && p === '/api/orders') {
    if (rateLimited(clientIp(req), 10, 10 * 60 * 1000)) return send(res, 429, { error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.' });
    let body;
    try { body = await readJson(req, 2 * 1024 * 1024); } catch (e) { return send(res, e.status || 400, { error: 'Хүсэлт буруу эсвэл хэт том байна.' }); }
    const plan = body && body.plan === 'premium' ? 'premium' : 'free';
    const card = validateCard(body && body.card, plan);
    if (!card) return send(res, 400, { error: 'Хэнд, зурвас хоёрыг заавал бичнэ үү.' });
    const images = validateImages(body.images, plan === 'premium' ? MAX_IMAGES : FREE_MAX_IMAGES);
    if (!images) return send(res, 400, { error: plan === 'premium' ? 'Зураг буруу байна. 3 хүртэл JPG зураг оруулна уу.' : 'Зураг буруу байна. Үнэгүй картад 1 JPG зураг оруулна.' });
    const tmpVideo = findTmpVideo(body.video);
    if (!tmpVideo) return send(res, 400, { error: 'Видео олдсонгүй. Дахин оруулна уу.' });
    const orderId = crypto.randomBytes(12).toString('hex');
    const cardId = crypto.randomBytes(16).toString('hex');
    let video = null;
    if (images.length || !tmpVideo.none) {
      try {
        await fs.promises.mkdir(MEDIA_DIR, { recursive: true });
        await Promise.all(images.map((buf, i) => fs.promises.writeFile(path.join(MEDIA_DIR, cardId + '-' + i + '.jpg'), buf)));
        video = await attachVideo(tmpVideo, cardId);
      } catch (e) {
        console.error('media save failed', e.message);
        return send(res, 500, { error: 'Зураг, видео хадгалж чадсангүй.' });
      }
    }
    if (plan === 'free' || isFree()) {
      // Free plan, or a free promotion on premium: no invoice, the card is ready at once. The price is still decided only here on the server.
      const freeOrder = {
        id: orderId, cardId, status: 'paid', amount: 0, card, images: images.length, video,
        invoiceId: 'free', createdAt: Date.now(), paidAt: Date.now(), paidAmount: 0, lastCheck: 0
      };
      await store.put(freeOrder);
      return send(res, 201, { id: orderId, status: 'paid', cardId, amount: 0 });
    }
    let invoice;
    try {
      invoice = await provider.createInvoice({ orderId, amount: config.price, description: 'Setgeliin shuudan mendchilgee' });
    } catch (e) {
      console.error('invoice failed', e.message);
      return send(res, 502, { error: 'Төлбөрийн нэхэмжлэх үүсгэж чадсангүй. Түр хүлээгээд дахин оролдоно уу.' });
    }
    const order = {
      id: orderId, cardId, status: 'pending', amount: config.price, card, images: images.length, video,
      invoiceId: invoice.invoiceId, createdAt: Date.now(), lastCheck: 0
    };
    await store.put(order);
    return send(res, 201, { id: orderId, amount: order.amount, qrSrc: invoice.qrSrc, links: invoice.links, status: 'pending' });
  }

  let mm;
  if (m === 'GET' && (mm = /^\/api\/orders\/([a-f0-9]{24})$/.exec(p))) {
    const order = store.get(mm[1]);
    if (!order) return send(res, 404, { error: 'Захиалга олдсонгүй.' });
    await refresh(order, false);
    return send(res, 200, publicOrder(order));
  }

  // QPay calls this when someone pays. The body is ignored. We ask QPay directly.
  if ((m === 'GET' || m === 'POST') && p === '/api/payments/callback') {
    const id = url.searchParams.get('order') || '';
    const order = /^[a-f0-9]{24}$/.test(id) ? store.get(id) : null;
    if (!order) return send(res, 404, 'order not found');
    await refresh(order, true);
    return send(res, 200, 'SUCCESS');
  }

  if (m === 'POST' && (mm = /^\/api\/mock\/pay\/([a-f0-9]{24})$/.exec(p))) {
    if (provider.name !== 'mock' || config.isProd) return send(res, 404, { error: 'Not found' });
    const order = store.get(mm[1]);
    if (!order) return send(res, 404, { error: 'Захиалга олдсонгүй.' });
    provider.simulatePay(order.id);
    await refresh(order, true);
    return send(res, 200, publicOrder(order));
  }

  // A card is shown only after its order is paid. The 32-hex card id is unguessable.
  if (m === 'GET' && (mm = /^\/api\/cards\/([a-f0-9]{32})$/.exec(p))) {
    const order = store.getByCard(mm[1]);
    if (!order || order.status !== 'paid') return send(res, 404, { error: 'Мэндчилгээ олдсонгүй.' });
    return send(res, 200, Object.assign({}, order.card, { createdAt: order.paidAt, images: order.images || 0, video: !!order.video }));
  }

  if (m === 'GET' && (mm = /^\/api\/cards\/([a-f0-9]{32})\/video$/.exec(p))) {
    const order = store.getByCard(mm[1]);
    const file = order && order.status === 'paid' ? videoFile(order) : null;
    if (!file) return send(res, 404, { error: 'Not found' });
    return fs.stat(file, (err, st) => {
      if (err) return send(res, 404, { error: 'Not found' });
      const h = { 'Content-Type': VIDEO_TYPES[order.video], 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' };
      const rg = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));
      if (rg && (rg[1] || rg[2])) {
        let a = rg[1] === '' ? Math.max(0, st.size - Number(rg[2])) : Number(rg[1]);
        let b = rg[1] === '' || rg[2] === '' ? st.size - 1 : Math.min(Number(rg[2]), st.size - 1);
        if (a > b || a >= st.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end(); }
        res.writeHead(206, Object.assign(h, { 'Content-Range': 'bytes ' + a + '-' + b + '/' + st.size, 'Content-Length': b - a + 1 }));
        return fs.createReadStream(file, { start: a, end: b }).pipe(res);
      }
      res.writeHead(200, Object.assign(h, { 'Content-Length': st.size }));
      fs.createReadStream(file).pipe(res);
    });
  }

  if (m === 'GET' && (mm = /^\/api\/cards\/([a-f0-9]{32})\/img\/([0-2])$/.exec(p))) {
    const order = store.getByCard(mm[1]);
    if (!order || order.status !== 'paid' || Number(mm[2]) >= (order.images || 0)) return send(res, 404, { error: 'Not found' });
    return fs.readFile(path.join(MEDIA_DIR, mm[1] + '-' + mm[2] + '.jpg'), (err, buf) => {
      if (err) return send(res, 404, { error: 'Not found' });
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
      res.end(buf);
    });
  }

  /* ---------- mailboxes ---------- */
  if (m === 'POST' && p === '/api/mailboxes') {
    if (rateLimited(clientIp(req) + ':mk', 5, 10 * 60 * 1000)) return send(res, 429, { error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.' });
    let body;
    try { body = await readJson(req, 4096); } catch (e) { return send(res, e.status || 400, { error: 'Хүсэлт буруу байна.' }); }
    const name = body && typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ').slice(0, 40) : '';
    if (!name) return send(res, 400, { error: 'Нэрээ бичнэ үү.' });
    const id = crypto.randomBytes(6).toString('hex');
    const ownerKey = crypto.randomBytes(16).toString('hex');
    await mailboxes.put({ id, cardId: ownerKey, name, createdAt: Date.now() });
    return send(res, 201, { id, ownerKey, name });
  }

  if (m === 'GET' && (mm = /^\/api\/mailboxes\/([a-f0-9]{12})$/.exec(p))) {
    const box = mailboxes.get(mm[1]);
    if (!box) return send(res, 404, { error: 'Хайрцаг олдсонгүй.' });
    return send(res, 200, { name: box.name });
  }

  // Anyone with the public link can drop a card in. It is always a free card addressed to the box owner.
  if (m === 'POST' && (mm = /^\/api\/mailboxes\/([a-f0-9]{12})\/cards$/.exec(p))) {
    if (rateLimited(clientIp(req) + ':send', 10, 10 * 60 * 1000)) return send(res, 429, { error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.' });
    const box = mailboxes.get(mm[1]);
    if (!box) return send(res, 404, { error: 'Хайрцаг олдсонгүй.' });
    let body;
    try { body = await readJson(req, 700 * 1024); } catch (e) { return send(res, e.status || 400, { error: 'Хүсэлт буруу байна.' }); }
    if (boxMessages(box).length >= MAILBOX_MAX_MESSAGES) return send(res, 429, { error: 'Энэ хайрцаг дүүрсэн байна.' });
    const src = body && typeof body.card === 'object' && body.card ? body.card : {};
    const card = validateCard(Object.assign({}, src, { to: box.name }), 'free');
    if (!card) return send(res, 400, { error: 'Зурвасаа бичнэ үү.' });
    const images = validateImages(body.images, FREE_MAX_IMAGES);
    if (!images) return send(res, 400, { error: 'Зураг буруу байна. 1 JPG зураг оруулна уу.' });
    const tmpVideo = findTmpVideo(body.video);
    if (!tmpVideo) return send(res, 400, { error: 'Видео олдсонгүй. Дахин оруулна уу.' });
    const orderId = crypto.randomBytes(12).toString('hex');
    const cardId = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    let video = null;
    if (images.length || !tmpVideo.none) {
      try {
        await fs.promises.mkdir(MEDIA_DIR, { recursive: true });
        await Promise.all(images.map((buf, i) => fs.promises.writeFile(path.join(MEDIA_DIR, cardId + '-' + i + '.jpg'), buf)));
        video = await attachVideo(tmpVideo, cardId);
      } catch (e) { return send(res, 500, { error: 'Зураг, видео хадгалж чадсангүй.' }); }
    }
    await store.put({ id: orderId, cardId, status: 'paid', amount: 0, card, images: images.length, video, invoiceId: 'mailbox', mailboxId: box.id, createdAt: now, paidAt: now, paidAmount: 0, lastCheck: 0 });
    return send(res, 201, { cardId });
  }

  // Only the secret key opens the inbox.
  if (m === 'GET' && (mm = /^\/api\/inbox\/([a-f0-9]{32})$/.exec(p))) {
    const box = mailboxes.getByCard(mm[1]);
    if (!box) return send(res, 404, { error: 'Хайрцаг олдсонгүй.' });
    const messages = boxMessages(box).slice(0, 300).map((o) => Object.assign({}, o.card, { cardId: o.cardId, createdAt: o.paidAt, images: o.images || 0, video: !!o.video }));
    return send(res, 200, { id: box.id, name: box.name, createdAt: box.createdAt, messages });
  }

  if (m === 'DELETE' && (mm = /^\/api\/inbox\/([a-f0-9]{32})\/cards\/([a-f0-9]{32})$/.exec(p))) {
    const box = mailboxes.getByCard(mm[1]);
    const order = box ? store.getByCard(mm[2]) : null;
    if (!box || !order || order.mailboxId !== box.id) return send(res, 404, { error: 'Олдсонгүй.' });
    for (let i = 0; i < (order.images || 0); i++) fs.promises.unlink(path.join(MEDIA_DIR, order.cardId + '-' + i + '.jpg')).catch(() => {});
    if (videoFile(order)) fs.promises.unlink(videoFile(order)).catch(() => {});
    await store.remove(order.id);
    return send(res, 200, { ok: true });
  }

  if (m === 'GET' && p === '/api/admin/orders') {
    const ip = clientIp(req);
    if (adminBlocked(ip)) return send(res, 429, { error: 'Too many attempts' });
    const key = req.headers['x-admin-key'];
    if (!config.adminKey || typeof key !== 'string' || !safeEqual(key, config.adminKey)) { adminFailed(ip); return send(res, 401, { error: 'Unauthorized' }); }
    const rows = store.all().sort((a, b) => b.createdAt - a.createdAt).slice(0, 500).map((o) => ({
      id: o.id, status: o.status, amount: o.amount, paidAmount: o.paidAmount || 0,
      createdAt: o.createdAt, paidAt: o.paidAt || null, plan: o.card.plan || 'premium', to: o.card.to, from: o.card.from,
      type: o.card.type || '', images: o.images || 0, video: !!o.video, mailbox: !!o.mailboxId
    }));
    const revenue = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.paidAmount, 0);
    const all = store.all();
    const boxes = mailboxes.all().sort((a, b) => b.createdAt - a.createdAt).slice(0, 300).map((b) => {
      const msgs = all.filter((o) => o.mailboxId === b.id);
      return { id: b.id, name: b.name, createdAt: b.createdAt, messages: msgs.length, withPictures: msgs.filter((o) => (o.images || 0) > 0).length };
    });
    return send(res, 200, { revenue, orders: rows, mailboxes: boxes });
  }

  if ((m === 'GET' || m === 'HEAD') && p === '/robots.txt') {
    return send(res, 200, 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /inbox/\nDisallow: /c/\nDisallow: /m/\nDisallow: /api/\nSitemap: ' + originOf(req) + '/sitemap.xml\n', { 'Cache-Control': 'public, max-age=3600' });
  }
  if ((m === 'GET' || m === 'HEAD') && p === '/sitemap.xml') {
    return send(res, 200, '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' + originOf(req) + '/</loc></url></urlset>\n', { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
  }

  if (m === 'GET' || m === 'HEAD') {
    if (p === '/') return serveStatic(res, 'index.html', req);
    if ((mm = /^\/m\/([a-f0-9]{12})$/.exec(p))) {
      const box = mailboxes.get(mm[1]);
      return serveStatic(res, 'mailbox.html', req, { TITLE: box ? box.name + '-д мэндчилгээ илгээх' : 'Сэтгэлийн шуудан' });
    }
    if (/^\/inbox\/[a-f0-9]{32}$/.test(p)) return serveStatic(res, 'inbox.html', req);
    if (p === '/admin') return serveStatic(res, 'admin.html', req);
    if (/^\/c\/[a-f0-9]{32}$/.test(p)) return serveStatic(res, 'card.html', req);
    if (p.startsWith('/api/')) return send(res, 404, { error: 'Not found' });
    let rel;
    try { rel = decodeURIComponent(p).replace(/^\/+/, ''); } catch (e) { return send(res, 400, 'Bad request'); }
    return serveStatic(res, rel, req);
  }

  return send(res, 405, { error: 'Method not allowed' });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error('unhandled', e);
    if (!res.headersSent) send(res, 500, { error: 'Серверийн алдаа.' });
    else res.end();
  });
});

if (require.main === module) {
  server.listen(config.port, () => {
    console.log('Setgeliin shuudan on :' + config.port + ' provider=' + provider.name + ' price=' + config.price);
    if (!config.adminKey) console.log('ADMIN_KEY is empty: the admin orders list is disabled.');
  });
}

module.exports = server;
