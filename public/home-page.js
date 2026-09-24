
// ================================================================
//  Section 1: 我的 IP 查询 + 网络连通性
// ================================================================

const pingTargets = [
  { name: '字节跳动', icon: '/favicons/bytedance.webp', url: 'https://perfops.byte-test.com/500b-bench.jpg', tag: '国内' },
  { name: '淘宝',     icon: '/favicons/taobao.webp', url: 'https://www.taobao.com/favicon.ico', tag: '国内' },
  { name: '微信',     icon: '/favicons/weixin.webp', url: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico', tag: '国内' },
  { name: 'GitHub',   icon: '/favicons/github.webp', url: 'https://github.com/generate_204', tag: '国际' },
  { name: 'Cloudflare', icon: '/favicons/cloudflare.webp', url: 'https://1.1.1.1/cdn-cgi/trace', tag: '国际' },
  { name: 'YouTube',  icon: '/favicons/youtube.webp', url: 'https://www.youtube.com/generate_204', tag: '国际' },
];

// Render ping grid
function renderPingGrid() {
  const grid = document.getElementById('pingGrid');
  grid.innerHTML = pingTargets.map((t, i) => `
    <div class="ping-item" id="ping-${i}">
      <img class="ping-icon" src="${t.icon}" alt="${t.name}" onerror="this.style.display='none'">
      <div style="flex:1;min-width:0">
        <div class="ping-name">${t.name === '字节跳动' ? '<span class="bd-full">字节跳动</span><span class="bd-short">字节</span>' : t.name}${t.tag==='国内' ? ' <img src="/favicons/cn.png" alt="中国国旗" width="40" height="27" style="width:14px;height:auto;vertical-align:-1px;border-radius:1px">' : ''}</div>
        <div class="ping-dots" id="ping-dots-${i}">${'<div class="ping-dot dot-pending"></div>'.repeat(12)}</div>
      </div>
      <div class="ping-ms" id="ping-ms-${i}" style="color: var(--text-muted)">--ms</div>
    </div>
  `).join('');
}

// Single ping: fetch no-cors with 3s timeout
async function singlePing(url) {
  const start = performance.now();
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(2500) });
    return Math.round(performance.now() - start);
  } catch {
    return -1;
  }
}

function dotClass(ms) {
  if (ms < 0) return 'dot-fail';
  if (ms < 100) return 'dot-good';
  if (ms < 400) return 'dot-warn';
  return 'dot-bad';
}

// Run pings: 1 warmup (hidden) + 12 measured rounds, display median
const pingHistory = pingTargets.map(() => []);

async function runPings() {
  // Warmup: establish TCP+TLS connections (not displayed, 3s timeout per target)
  await Promise.allSettled(pingTargets.map(t => singlePing(t.url).catch(() => -1)));

  const ROUNDS = 12;
  const MIN_INTERVAL_MS = 80;
  // Per-site independent loops: a slow/failed site doesn't block others
  await Promise.allSettled(pingTargets.map(async (t, i) => {
    for (let round = 0; round < ROUNDS; round++) {
      const roundStart = performance.now();
      const ms = await singlePing(t.url);
      const dotsEl = document.getElementById(`ping-dots-${i}`);
      const msEl = document.getElementById(`ping-ms-${i}`);
      dotsEl.children[round].className = 'ping-dot ' + dotClass(ms);

      if (ms >= 0) pingHistory[i].push(ms);

      // Display median
      const valid = pingHistory[i].slice().sort((a, b) => a - b);
      if (valid.length > 0) {
        const median = valid[Math.floor(valid.length / 2)];
        msEl.textContent = Math.min(median, 999) + 'ms';
        msEl.style.color = median < 100 ? '#1b8a2d' : median < 400 ? '#6fcf7c' : '#f0c040';
      } else if (ms < 0) {
        msEl.textContent = '超时';
        msEl.style.color = '#e17055';
      }

      // Minimum 100ms per round (pad only if this round finished fast; skip last round)
      const elapsed = performance.now() - roundStart;
      if (elapsed < MIN_INTERVAL_MS && round < ROUNDS - 1) {
        await new Promise(r => setTimeout(r, MIN_INTERVAL_MS - elapsed));
      }
    }
  }));
}

// Fetch IP from ip138
async function fetchIP138() {
  try {
    const ts = Date.now();
    const resp = await fetch(`https://2026.ip138.com/?_=${ts}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const html = await resp.text();
    const ipMatch = html.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    const geoMatch = html.match(/来自：([^<\n]+)/);
    if (ipMatch) return { ip: ipMatch[1], geo: geoMatch ? geoMatch[1].trim() : '', source: 'iP138.com' };
  } catch {}
  return null;
}

// Fetch IP from ip.cn
async function fetchIPCN() {
  try {
    const ts = Date.now();
    const resp = await fetch(`https://my.ip.cn/?_=${ts}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const text = await resp.text();
    // Format: "ip：x.x.x.x 归属地：xxx"
    const ipMatch = text.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    const geoMatch = text.match(/归属地：(.+)/);
    if (ipMatch) return { ip: ipMatch[1], geo: geoMatch ? geoMatch[1].trim() : '', source: 'IP.cn' };
  } catch {}
  return null;
}

// --- Hero IP geo validation against backend country code (MaxMind/BGP) ---
// Main page calls iP138.com / IP.cn for Chinese-language locale text, but those
// providers' databases are stale for many APNIC-handover ranges (e.g. 103.x).
// When their Chinese text disagrees with backend's authoritative country code,
// fall back to building Chinese geo from the backend response. The flag was
// already coming from the backend, so this brings text in line with the flag.

const CC_TO_CN_PREFIX = {
  'cn': ['中国'], 'hk': ['香港', '中国香港'], 'mo': ['澳门', '中国澳门'],
  'tw': ['台湾', '中国台湾'],
  'jp': ['日本'], 'kr': ['韩国'], 'sg': ['新加坡'], 'my': ['马来西亚'],
  'th': ['泰国'], 'vn': ['越南'], 'id': ['印度尼西亚', '印尼'],
  'ph': ['菲律宾'], 'in': ['印度'], 'pk': ['巴基斯坦'], 'bd': ['孟加拉'],
  'ir': ['伊朗'], 'il': ['以色列'], 'ae': ['阿联酋', '阿拉伯联合酋长国'],
  'sa': ['沙特'], 'tr': ['土耳其'],
  'us': ['美国'], 'ca': ['加拿大'], 'mx': ['墨西哥'],
  'br': ['巴西'], 'ar': ['阿根廷'], 'cl': ['智利'],
  'gb': ['英国'], 'ie': ['爱尔兰'], 'fr': ['法国'], 'de': ['德国'],
  'it': ['意大利'], 'es': ['西班牙'], 'pt': ['葡萄牙'], 'nl': ['荷兰'],
  'be': ['比利时'], 'ch': ['瑞士'], 'at': ['奥地利'],
  'se': ['瑞典'], 'no': ['挪威'], 'dk': ['丹麦'], 'fi': ['芬兰'],
  'pl': ['波兰'], 'cz': ['捷克'], 'ru': ['俄罗斯', '俄国'],
  'ua': ['乌克兰'], 'au': ['澳大利亚', '澳洲'], 'nz': ['新西兰'],
  'za': ['南非'], 'eg': ['埃及'], 'ng': ['尼日利亚'], 'ke': ['肯尼亚']
};

const CC_TO_CN_NAME = {
  'cn': '中国', 'hk': '中国香港', 'mo': '中国澳门', 'tw': '中国台湾',
  'jp': '日本', 'kr': '韩国', 'sg': '新加坡', 'my': '马来西亚',
  'th': '泰国', 'vn': '越南', 'id': '印度尼西亚', 'ph': '菲律宾',
  'in': '印度', 'pk': '巴基斯坦', 'bd': '孟加拉国',
  'ir': '伊朗', 'il': '以色列', 'ae': '阿联酋', 'sa': '沙特',
  'tr': '土耳其', 'us': '美国', 'ca': '加拿大', 'mx': '墨西哥',
  'br': '巴西', 'ar': '阿根廷', 'cl': '智利',
  'gb': '英国', 'ie': '爱尔兰', 'fr': '法国', 'de': '德国',
  'it': '意大利', 'es': '西班牙', 'pt': '葡萄牙', 'nl': '荷兰',
  'be': '比利时', 'ch': '瑞士', 'at': '奥地利',
  'se': '瑞典', 'no': '挪威', 'dk': '丹麦', 'fi': '芬兰',
  'pl': '波兰', 'cz': '捷克', 'ru': '俄罗斯', 'ua': '乌克兰',
  'au': '澳大利亚', 'nz': '新西兰', 'za': '南非', 'eg': '埃及',
  'ng': '尼日利亚', 'ke': '肯尼亚'
};

async function pickValidatedGeo(ip, candidates) {
  let geoData = null;
  try { geoData = await lookupGeo(ip); } catch {}
  const cc = (geoData && geoData.countryCode || '').toLowerCase();
  const prefixes = cc ? (CC_TO_CN_PREFIX[cc] || null) : null;

  function matches(text) {
    if (!prefixes || !text) return false;
    return prefixes.some(p => {
      if (!text.startsWith(p)) return false;
      const next = text[p.length];
      return !next || next === ' ' || next === '　';
    });
  }

  if (!cc) {
    const longest = candidates.filter(c => c && c.geo)
      .reduce((a, b) => (a.geo.length >= b.geo.length ? a : b),
              { geo: '', source: '' });
    return longest.geo ? longest : (candidates[0] || { geo: '', source: '' });
  }

  const valid = candidates.filter(c => c && c.geo && matches(c.geo));
  if (valid.length > 0) {
    return valid.reduce((a, b) => a.geo.length >= b.geo.length ? a : b);
  }

  const cnName = CC_TO_CN_NAME[cc] || geoData.country || '未知';
  const parts = [cnName];
  if (geoData.region && geoData.region !== geoData.city) parts.push(geoData.region);
  if (geoData.city) parts.push(geoData.city);
  if (geoData.isp) parts.push(geoData.isp);
  return { geo: parts.join(' '), source: 'GeoIP（地区库纠正）' };
}

// Display IP result with dedup logic
async function runIPQuery() {
  const [r138, rCN] = await Promise.allSettled([fetchIP138(), fetchIPCN()]);
  const ip138 = r138.status === 'fulfilled' ? r138.value : null;
  const ipCN = rCN.status === 'fulfilled' ? rCN.value : null;

  const ipValueEl = document.getElementById('ipValue');
  const ipGeoEl = document.getElementById('ipGeo');
  const ipSourceEl = document.getElementById('ipSource');

  // Both failed
  if (!ip138 && !ipCN) {
    ipValueEl.textContent = '获取失败';
    ipGeoEl.textContent = '无法连接国内 IP 查询服务';
    return;
  }

  // Only one succeeded
  if (!ip138 || !ipCN) {
    const r = ip138 || ipCN;
    await renderIPResult(r.ip, r.geo, r.source, ipValueEl, ipGeoEl, ipSourceEl);
    return;
  }

  // Both succeeded — check if same IP
  if (ip138.ip === ipCN.ip) {
    // Same IP: validate both candidates against backend cc, pick best
    const picked = await pickValidatedGeo(ip138.ip, [
      { geo: ip138.geo, source: 'iP138.com' },
      { geo: ipCN.geo,  source: 'IP.cn' },
    ]);
    const finalSource = picked.source && picked.source.indexOf('GeoIP') === 0 ? picked.source : 'iP138.com / IP.cn';
    await renderIPResult(ip138.ip, picked.geo, finalSource, ipValueEl, ipGeoEl, ipSourceEl);
  } else {
    // Different IPs: validate each separately
    const picked1 = await pickValidatedGeo(ip138.ip, [{ geo: ip138.geo, source: 'iP138.com' }]);
    await renderIPResult(ip138.ip, picked1.geo, picked1.source, ipValueEl, ipGeoEl, ipSourceEl);
    // Add second card
    const card2 = document.createElement('div');
    card2.className = 'ip-card';
    card2.innerHTML = `
      <div class="label">IPv4 (备用出口)</div>
      <div class="ip-value" id="ipValue2"></div>
      <div class="ip-geo" id="ipGeo2"></div>
      <div class="ip-source" id="ipSource2"></div>
    `;
    document.getElementById('ipCard').after(card2);
    const picked2 = await pickValidatedGeo(ipCN.ip, [{ geo: ipCN.geo, source: 'IP.cn' }]);
    await renderIPResult(ipCN.ip, picked2.geo, picked2.source,
      document.getElementById('ipValue2'),
      document.getElementById('ipGeo2'),
      document.getElementById('ipSource2'));
  }
}

async function renderIPResult(ip, geo, source, valueEl, geoEl, sourceEl) {
  // Use our server-side geo cache for the flag
  let flagHtml = '';
  try {
    const geoData = await lookupGeo(ip);
    if (geoData && geoData.countryCode) {
      const cc = geoData.countryCode;
      const flagSrc = cc === 'cn' ? '/favicons/cn.png' : cc === 'tw' ? '/favicons/flags/tw.png' : `/favicons/flags/${cc}.png`;
      const flagAlt = cc === 'tw' ? '中国台湾省' : cc;
      flagHtml = `<img src="${flagSrc}" width="40" height="27" style="width:22px;height:auto;border-radius:2px;vertical-align:middle" alt="${flagAlt}" onerror="this.onerror=null;this.style.display='none'">`;
    }
    if (!geo && geoData) geo = geoData.geoString;
  } catch {}
  const ipLink = `<a class="ip-link" href="/ip/${encodeURIComponent(ip)}" target="_blank" rel="noopener">${ip}</a>`;
  valueEl.innerHTML = `${flagHtml} ${ipLink}`;
  geoEl.textContent = geo || '';
  geoEl.title = geo || '';  // 鼠标悬停显示完整 geo（超长被截断时仍可看全文）

  // Fetch IP property from risk API
  try {
    const r = await fetch(`/api/iprisk/${ip}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const d = await r.json();
      const t = d.company_type || '';
      const typeLabel = { 'isp': 'ISP', 'hosting': 'Hosting', 'business': 'Business', 'education': 'Education' };
      const tStr = typeLabel[t] || t;
      let prop = '';
      if (d.isResidential === true && t === 'business') prop = '商业宽带 (Business)';
      else if (d.isResidential === true) prop = '家庭宽带' + (tStr ? ` (${tStr})` : '');
      else if (d.is_datacenter === true && t === 'business') prop = '商业专线 (Business)';
      else if (d.is_datacenter === true) prop = '机房IP' + (tStr ? ` (${tStr})` : '');
      else if (t === 'education') prop = '专用 (Education)';
      else prop = tStr ? `未知 (${tStr})` : '未知';
      sourceEl.innerHTML = prop;
    }
  } catch {}
}

// ================================================================
//  Section 2: 网站分流测试
// ================================================================

// ============ Test Items ============
const tests = [
  // ---- 1. 国内 ----
  { name: '网易',              type: 'domestic', method: 'netease' },
  { name: '字节跳动',          type: 'domestic', method: 'bytedance', url: 'https://perfops.byte-test.com/500b-bench.jpg' },
  { name: 'Cloudflare中国', type: 'domestic', method: 'cftrace', domain: 'www.cloudflare-cn.com' },
  { name: '高通中国',   type: 'domestic', method: 'cftrace', domain: 'www.qualcomm.cn' },

  // ---- 2. 国际 社交/通讯 ----
  { name: 'discord.com',       type: 'international', extra: ['social'], method: 'cftrace', domain: 'gateway.discord.gg' },
  { name: 'x.com',             type: 'international', extra: ['social'], method: 'cftrace', domain: 'x.com' },
  { name: 'medium.com',        type: 'international', extra: ['social'], method: 'cftrace', domain: 'medium.com' },
  { name: 'signal.org',        type: 'international', extra: ['social'], method: 'cftrace', domain: 'signal.org' },

    // ---- 2.5 国际 AI 专属 ----
  { name: 'Google Gemini',     type: 'international', extra: ['ai'], method: 'google', domain: 'gemini.google.com' },
  // ---- 3. 国际 AI ----
  { name: 'anthropic.com',     type: 'international', extra: ['ai'], method: 'cftrace', domain: 'anthropic.com' },
  { name: 'claude.ai',         type: 'international', extra: ['ai'], method: 'cftrace', domain: 'claude.ai' },
  { name: 'chatgpt.com',       type: 'international', extra: ['ai'], method: 'cftrace', domain: 'chatgpt.com' },
  { name: 'openai.com',        type: 'international', extra: ['ai'], method: 'cftrace', domain: 'openai.com' },
  { name: 'sora.com',          type: 'international', extra: ['ai'], method: 'cftrace', domain: 'sora.com' },
  { name: 'grok.com',          type: 'international', extra: ['ai'], method: 'cftrace', domain: 'grok.com' },
  { name: 'pixpix.com',        type: 'international', extra: ['ai'], method: 'cftrace', domain: 'pixpix.com' },
  { name: 'perplexity.ai', type: 'international', extra: ['ai'], method: 'cftrace', domain: 'www.perplexity.ai' },
  { name: 'midjourney.com',    type: 'international', extra: ['ai'], method: 'cftrace', domain: 'midjourney.com' },
  { name: 'mistral.ai',        type: 'international', extra: ['ai'], method: 'cftrace', domain: 'mistral.ai' },

  // ---- 4. 国际 Crypto ----
  { name: 'coinbase.com',      type: 'international', extra: ['crypto'], method: 'cftrace', domain: 'coinbase.com' },
  { name: 'www.okx.com',       type: 'international', extra: ['crypto'], method: 'cftrace', domain: 'www.okx.com' },
  { name: 'binance.com',      type: 'international', extra: ['crypto'], method: 'cftrace', domain: 'www.binance.info' },
  { name: 'crypto.com',        type: 'international', extra: ['crypto'], method: 'cftrace', domain: 'crypto.com' },

  // ---- 5. 国际 办公/工具 ----
  { name: 'zoom.us',           type: 'international', extra: ['tools'], method: 'cftrace', domain: 'zoom.us' },
  { name: '1password.com',     type: 'international', extra: ['tools'], method: 'cftrace', domain: '1password.com' },
  { name: 'wise.com',          type: 'international', extra: ['tools'], method: 'cftrace', domain: 'wise.com' },
  { name: 'poe.com',           type: 'international', extra: ['tools'], method: 'cftrace', domain: 'poe.com' },
  { name: 'notion.so',         type: 'international', extra: ['tools'], method: 'cftrace', domain: 'notion.so' },
  { name: 'shopify.com',       type: 'international', extra: ['tools'], method: 'cftrace', domain: 'shopify.com' },
  { name: 'godaddy.com',       type: 'international', extra: ['tools'], method: 'cftrace', domain: 'godaddy.com' },
  { name: 'producthunt.com',   type: 'international', extra: ['tools'], method: 'cftrace', domain: 'producthunt.com' },

  // ---- 6. 国际 测速/网络 ----
  { name: 'cloudflare.com', type: 'international', extra: ['speed'], method: 'cftrace', domain: 'www.cloudflare.com' },

  // ---- 7. 国际 开发/CDN ----
  { name: 'cloudflare cdnjs',  type: 'international', extra: ['static'], method: 'cftrace', domain: 'cdnjs.cloudflare.com' },
  { name: 'npm registry',    type: 'international', extra: ['static'], method: 'cftrace', domain: 'registry.npmjs.org' },
  { name: 'kali.download',         type: 'international', extra: ['static'], method: 'cftrace', domain: 'kali.download' },
  { name: 'unpkg.com',             type: 'international', extra: ['static'], method: 'cftrace', domain: 'unpkg.com' },
  { name: 'nodejs.org',        type: 'international', extra: ['dev'], method: 'cftrace', domain: 'nodejs.org' },
  { name: 'gitlab.com',        type: 'international', extra: ['dev'], method: 'cftrace', domain: 'gitlab.com' },

  // ---- 8. 国际 流媒体 ----
  { name: 'crunchyroll.com',   type: 'international', extra: ['media'], method: 'cftrace', domain: 'crunchyroll.com' },
];

// ============ State ============
const state = new Array(tests.length).fill(null).map(() => ({
  status: 'pending', // pending | loading | done | error
  ip: null,
  geo: null,
  countryCode: null,
  error: null,
}));

// ============ Favicon URL helper ============
const LOCAL_FAVICONS = {
  'Google Gemini': 'gemini',
  '阿里巴巴': 'alibaba', '网易': 'netease', '字节跳动': 'bytedance',
  '高通中国': 'qualcomm', 'Cloudflare中国': 'cloudflare',
  'cloudflare.com': 'cloudflare',
  'discord.com': 'discord', 'x.com': 'x', 'medium.com': 'medium',
  'chatgpt.com': 'chatgpt', 'sora.com': 'sora', 'openai.com': 'openai',
  'claude.ai': 'claude', 'grok.com': 'grok', 'anthropic.com': 'anthropic',
  'perplexity.ai': 'perplexity',
  'telegram.org': 'telegram', 'substack.com': 'substack',
  'midjourney.com': 'midjourney',
  'coinbase.com': 'coinbase', 'www.okx.com': 'okx', 'binance.com': 'binance',
  'zoom.us': 'zoom', '1password.com': '1password', 'wise.com': 'wise',
  'godaddy.com': 'godaddy', 'producthunt.com': 'producthunt',
  'fast.com': 'fast',
  'cdn.jsdelivr.net': 'jsdelivr', 'cloudflare cdnjs': 'cdnjs',
  'cloudflaremirrors.com': 'cloudflaremirrors', 'npm registry': 'npmjs',
  'kali.download': 'kali', 'unpkg.com': 'unpkg',
  'crunchyroll.com': 'crunchyroll', 'nodejs.org': 'nodejs', 'gitlab.com': 'gitlab',
  'crypto.com': 'crypto', 'notion.so': 'notion', 'shopify.com': 'shopify', 'pixpix.com': 'pixpix',
  'signal.org': 'signal', 'mistral.ai': 'mistral', 'poe.com': 'poe',   // 2026-09-15 新增三站
};
// Files on server: .webp preferred, .png fallback
const ICO_ICONS = new Set(['alibaba']);
const WEBP_ICONS = new Set([
  'anthropic','bytedance','cdnjs','chatgpt','claude','cloudflare',
  'cloudflaremirrors','coinbase','crunchyroll','discord','fast','gitlab',
  'godaddy','grok','jsdelivr','medium','midjourney','nodejs','npmjs',
  'okx','substack','telegram','unpkg','wise','x',
  // 2026-05-19 本地化
  'sora','openai','perplexity','zoom','1password','producthunt','taobao','weixin','github','youtube','javdb',
  'signal','mistral','poe',   // 2026-09-15
]);
// These don't have local files — use Google Favicon as fallback
const GOOGLE_FALLBACK = new Set();  // 2026-05-19 全部本地化
const PINNED_ICONS = { 'pixpix': '/favicons/link/pixpix.ico?v=4', 'grok': '/favicons/grok.png?v=4', 'chatgpt': '/favicons/chatgpticon.png?v=1', 'gemini': '/favicons/gemini.svg?v=1' };
function faviconUrl(name, domain) {
  const key = LOCAL_FAVICONS[name];
  if (key && PINNED_ICONS[key]) return PINNED_ICONS[key];
  if (key && !GOOGLE_FALLBACK.has(key)) {
    const ext = ICO_ICONS.has(key) ? 'ico' : WEBP_ICONS.has(key) ? 'webp' : 'png';
    return `/favicons/${key}.${ext}`;
  }
  // 2026-05-19 不再调用 Google s2 favicons (隐私 + 自托管)。未知站点返回 1x1 透明像素，
  // 图标位置保持 layout 不抖动，配合 <img onerror="style.display='none'"> 自动隐藏。
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
}

// ============ Badge HTML ============
function badgeHTML(type, extras) {
  let html = '';
  if (type === 'domestic') {
    html += '<span class="badge badge-domestic">国内</span>';
  } else {
    html += '<span class="badge badge-international">国际</span>';
  }
  if (extras) {
    for (const e of extras) {
      const labels = { ai:'AI', crypto:'Crypto', social:'Social', tools:'Tools', speed:'Speed', dev:'Dev', media:'Media', static:'Static' };
      html += `<span class="badge badge-${e}">${labels[e] || e}</span>`;
    }
  }
  return html;
}

// ============ Country flag ============
function flagHTML(countryCode) {
  if (!countryCode) return '';
  const cc = countryCode.toLowerCase();
  const src = cc === 'cn' ? '/favicons/cn.png' : cc === 'tw' ? '/favicons/flags/tw.png' : `/favicons/flags/${cc}.png`;
  const altTxt = cc === 'tw' ? '中国台湾省' : cc;
  return `<img class="flag-icon" width="40" height="27" src="${src}" alt="${altTxt}" onerror="if(this.dataset.f){this.style.display='none';return;}this.style.display='none';">`;
}

// ============ Render table ============
function renderTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = tests.map((t, i) => {
    const s = state[i];
    const fav = t.domain ? faviconUrl(t.name, t.domain) : faviconUrl(t.name);
    const siteCell = `
      <td>
        <div class="site-cell">
          <img class="favicon" src="${fav}" alt="${t.name}" onerror="this.style.display='none'">
          <span class="site-name">${t.name}</span>
          ${badgeHTML(t.type, t.extra)}
        </div>
      </td>`;

    let flagCell, ipCell, geoCell;

    if (s.status === 'pending') {
      flagCell = '<td></td>';
      ipCell = '<td><span class="pending-text"></span></td>';
      geoCell = '<td class="geo-col"></td>';
    } else if (s.status === 'loading') {
      flagCell = '<td><div class="loading-bar" style="width:24px;height:24px;border-radius:50%"></div></td>';
      ipCell = '<td><div class="loading-bar" style="width:120px"></div></td>';
      geoCell = '<td class="geo-col"><div class="loading-bar" style="width:180px"></div></td>';
    } else if (s.status === 'error') {
      flagCell = '<td>?</td>';
      ipCell = `<td><span class="error-text">${s.error || '获取失败'}</span></td>`;
      geoCell = '<td class="geo-col"></td>';
    } else {
      flagCell = `<td>${flagHTML(s.countryCode)}</td>`;
      ipCell = `<td class="ip-cell">${s.ip || '未获取到 IP'}</td>`;
      geoCell = `<td class="geo-col geo-cell">${s.geo || ''}</td>`;
    }

    return `<tr>${siteCell}${flagCell}${ipCell}${geoCell}</tr>`;
  }).join('');
}

// ============ Geo lookup — multi-provider fallback + dedup cache ============
const geoCache = new Map();    // normalized IP → { geoString, countryCode }
const geoInflight = new Map(); // normalized IP → Promise (dedup concurrent)

function normalizeIp(ip) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return ip.replace(/\.\d+$/, '.1');
  return ip;
}

// Primary: our own server-side cache API (/24 subnet, 30-day TTL, SQLite-backed)
// Fallback: direct third-party APIs if our server is down
async function fetchGeoFromServer(ip) {
  const ts = Date.now();
  const r = await fetch(`/api/geoip/${ip}?_=${ts}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!r.ok) return null;
  const d = await r.json();
  const parts = [d.country, d.region, d.city, d.isp].filter(Boolean);
  const cc = (d.countryCode || d.country_code || '').toLowerCase() || null;
  return { geoString: parts.join(' '), countryCode: cc, isp: d.isp || '', country: d.country || '', region: d.region || '', city: d.city || '' };
}

async function fetchGeoFallback(ip) {
  // Fallback 1: ipwho.is (返回详细的城市、省份和 ISP 运营商，保证和原版一样详细)
  try {
    const r = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    if (d.success) {
      const parts = [d.country, d.region, d.city, d.connection && d.connection.isp].filter(Boolean);
      return {
        geoString: parts.join(' '),
        countryCode: (d.countryCode || d.country_code || '').toLowerCase() || null,
        country: d.country || '',
        region: d.region || '',
        city: d.city || '',
        isp: (d.connection && d.connection.isp) || ''
      };
    }
  } catch {}
  // Fallback 2: api.ip.sb
  try {
    const r = await fetch(`https://api.ip.sb/geoip/${ip}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const d = await r.json();
      if (d.country) {
        const parts = [d.country, d.region, d.city, d.isp || d.organization].filter(Boolean);
        return {
          geoString: parts.join(' '),
          countryCode: (d.countryCode || d.country_code || '').toLowerCase() || null,
          country: d.country || '',
          region: d.region || '',
          city: d.city || '',
          isp: d.isp || d.organization || ''
        };
      }
    }
  } catch {}
  return null;
}

async function lookupGeo(ip) {
  if (!ip) return null;
  const key = normalizeIp(ip);

  // L1: browser memory cache
  if (geoCache.has(key)) return geoCache.get(key);
  // L2: dedup in-flight
  if (geoInflight.has(key)) return geoInflight.get(key);

  // L3: server cache → fallback to third-party
  const promise = (async () => {
    let result = null;
    try { result = await fetchGeoFromServer(ip); } catch {}
    if (!result) {
      try { result = await fetchGeoFallback(ip); } catch {}
    }
    if (result) geoCache.set(key, result);
    return result;
  })();

  geoInflight.set(key, promise);
  try { return await promise; }
  finally { geoInflight.delete(key); }
}

// ============ Detection methods ============

// 1. Cloudflare cdn-cgi/trace — the primary method for most sites
async function detectCftrace(domain) {
  const ts = Date.now();
  const resp = await fetch(`https://${domain}/cdn-cgi/trace?_=${ts}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  const text = await resp.text();
  const entries = Object.fromEntries(text.trim().split('\n').map(l => l.split('=')));
  return { ip: entries.ip || null, loc: entries.loc?.toLowerCase() || null };
}

// 2. Alibaba — JSONP via alicdn.com DNS detection
function detectAlibaba() {
  return new Promise((resolve, reject) => {
    const cbName = '__ali_cb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const randomStr = Date.now() + '-' + Math.random().toString(36).slice(2, 18);
    const url = `https://${randomStr}.dns-detect.alicdn.com/api/detect/DescribeDNSLookup?cb=${cbName}`;

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('超时'));
    }, 5000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      const el = document.getElementById('script-' + cbName);
      if (el) el.remove();
    }

    window[cbName] = (data) => {
      cleanup();
      if (data?.content?.localIp) {
        resolve({
          ip: data.content.localIp,
          countryCode: data.content.ipCountry?.toLowerCase() || null,
        });
      } else {
        reject(new Error('无IP数据'));
      }
    };

    const script = document.createElement('script');
    script.id = 'script-' + cbName;
    script.src = url;
    script.async = true;
    script.onerror = () => { cleanup(); reject(new Error('加载失败')); };
    document.body.appendChild(script);
  });
}

// 3. Netease — HEAD request checking cdn-user-ip header
async function detectNetease() {
  const resp = await fetch('https://necaptcha.nosdn.127.net/ab7f4275c1744aa28e0a8f3a1c58c532.png', {
    method: 'HEAD',
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  const ip = resp.headers.get('cdn-user-ip');
  if (ip) return { ip };
  throw new Error('未获取到 IP');
}

// 4. Bytedance — HEAD request checking x-request-ip / x-response-cinfo
async function detectBytedance(url) {
  const resp = await fetch(url, {
    method: 'HEAD',
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  const ip = resp.headers.get('x-request-ip') || resp.headers.get('x-response-cinfo');
  if (ip) return { ip };
  throw new Error('未获取到 IP');
}

// 5. Google Gemini — actual proxy exit IP detection
async function detectGoogle() {
  const ts = Date.now();
  // Strategy 1: Server-side check
  try {
    const resp = await fetch(`/api/google-check?_=${ts}`, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (resp.ok) {
      const data = await resp.json();
      if (data.ip) return { ip: data.ip, loc: data.country_code || null };
    }
  } catch {}

  // Strategy 2: api.ipify.org through proxy
  try {
    const resp = await fetch(`https://api.ipify.org?format=json&_=${ts}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.ip) return { ip: data.ip };
    }
  } catch {}

  throw new Error('未获取到 IP');
}

// ============ Run single test ============
async function runTest(index) {
  const test = tests[index];
  state[index].status = 'loading';
  renderRow(index);

  try {
    let ip = null, geo = null, countryCode = null;

    switch (test.method) {
      case 'cftrace': {
        let result;
        try {
          result = await detectCftrace(test.domain);
        } catch (e) {
          if (test.fallbackDomain) {
            result = await detectCftrace(test.fallbackDomain);
          } else {
            throw e;
          }
        }
        ip = result.ip;
        countryCode = result.loc;
        break;
      }
      case 'ip138': {
        const result = await fetchIP138();
        if (result) { ip = result.ip; geo = result.geo; }
        break;
      }
      case 'netease': {
        const result = await detectNetease();
        ip = result.ip;
        if (test.type === 'domestic') countryCode = 'cn';
        break;
      }
      case 'bytedance': {
        const result = await detectBytedance(test.url);
        ip = result.ip;
        if (test.type === 'domestic') countryCode = 'cn';
        break;
      }
      case 'google': {
        const result = await detectGoogle();
        ip = result.ip;
        if (result.loc) countryCode = result.loc;
        break;
      }
    }

    state[index].ip = ip;
    state[index].countryCode = countryCode;
    state[index].status = ip ? 'done' : 'error';
    state[index].error = ip ? null : '未获取到 IP';

    // Geo lookup — always fetch for country code; use existing geo text if available
    if (ip) {
      if (geo) state[index].geo = geo;
      renderRow(index);
      const geoResult = await lookupGeo(ip);
      if (geoResult) {
        if (!geo) state[index].geo = geoResult.geoString;
        const resCC = (geoResult.countryCode || geoResult.country_code || '').toLowerCase();
        if (resCC) {
          state[index].countryCode = resCC;
        }
      }
    }

    renderRow(index);
  } catch (e) {
    state[index].status = 'error';
    state[index].error = e.message || '获取失败';
    renderRow(index);
  }
}

// ============ Render single row (efficient update) ============
function renderRow(index) {
  const tbody = document.getElementById('tableBody');
  const row = tbody.children[index];
  if (!row) { renderTable(); return; }

  const t = tests[index];
  const s = state[index];
  const fav = t.domain ? faviconUrl(t.name, t.domain) : faviconUrl(t.name);

  let flagCell, ipCell, geoCell;

  if (s.status === 'pending') {
    flagCell = '<td></td>';
    ipCell = '<td><span class="pending-text"></span></td>';
    geoCell = '<td class="geo-col"></td>';
  } else if (s.status === 'loading') {
    flagCell = '<td><div class="loading-bar" style="width:24px;height:24px;border-radius:50%"></div></td>';
    ipCell = '<td><div class="loading-bar" style="width:120px"></div></td>';
    geoCell = '<td class="geo-col"><div class="loading-bar" style="width:180px"></div></td>';
  } else if (s.status === 'error') {
    flagCell = '<td style="font-size:1.2em;text-align:center">?</td>';
    ipCell = `<td><span class="error-text">${s.error || '获取失败'}</span></td>`;
    geoCell = '<td class="geo-col"></td>';
  } else {
    flagCell = `<td>${flagHTML(s.countryCode)}</td>`;
    ipCell = `<td class="ip-cell">${s.ip || '未获取到 IP'}</td>`;
    geoCell = `<td class="geo-col geo-cell">${s.geo || (s.status === 'done' ? '<div class="loading-bar" style="width:160px"></div>' : '')}</td>`;
  }

  const siteCell = `
    <td>
      <div class="site-cell">
        <img class="favicon" src="${fav}" alt="${t.name}" onerror="this.style.display='none'">
        <span class="site-name">${t.name}</span>
        ${badgeHTML(t.type, t.extra)}
      </div>
    </td>`;

  row.innerHTML = `${siteCell}${flagCell}${ipCell}${geoCell}`;
  renderSplitIpSummary();
}

// ============ 分流 IP 汇总 (flag + IP, /ip/{ip} new-tab) ============
// Compact IPv6 for display: "2400:6ea0::5145:8d6b:78ff:fe91:a6c" → "2400:6ea0…a6c"
// Keeps first 2 hextets + last 1 hextet to stay within ~15ch (IPv4 width).
// Full IP is preserved in href and title for click + tooltip.
function compactIp(ip) {
  if (!ip || !ip.includes(':')) return ip;  // IPv4 or empty
  if (ip.length <= 22) return ip;             // short IPv6 fits already
  const parts = ip.split(':');
  return parts[0] + ':' + parts[1] + '…' + parts[parts.length - 1];
}

function renderSplitIpSummary() {
  const grid = document.getElementById('splitIpGrid');
  if (!grid) return;
  // Dedupe by IP; keep first non-empty countryCode seen.
  const seen = new Map();
  for (let i = 0; i < state.length; i++) {
    const s = state[i];
    if (!s || s.status !== 'done' || !s.ip) continue;
    if (!seen.has(s.ip)) {
      seen.set(s.ip, s.countryCode || '');
    } else if (!seen.get(s.ip) && s.countryCode) {
      seen.set(s.ip, s.countryCode);
    }
  }
  const cells = [];
  for (const [ip, cc] of seen.entries()) {
    const lc = (cc || '').toLowerCase();
    const flagSrc = lc === 'cn'
      ? '/favicons/cn.png'
      : lc === 'tw'
      ? '/favicons/flags/tw.png'
      : (lc ? `/favicons/flags/${lc}.png` : '');
    const flagAlt = lc === 'tw' ? '中国台湾省' : lc;
    const flagHtml = flagSrc
      ? `<img class="split-flag" width="40" height="27" src="${flagSrc}" alt="${flagAlt}" onerror="this.style.display='none'">`
      : '<span class="split-flag" style="display:inline-block"></span>';
    const ipEsc = String(ip).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const displayEsc = String(compactIp(ip)).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    cells.push(
      `<a class="split-ip-cell" href="/ip/${encodeURIComponent(ip)}" target="_blank" rel="noopener" title="查询 ${ipEsc} 的 IP 质量">`
      + flagHtml
      + `<span class="split-ip">${displayEsc}</span>`
      + '</a>'
    );
  }
  grid.innerHTML = cells.join('');
}

// ============ Concurrency limiter (sliding window) ============
function runWithLimit(items, limit, worker) {
  return new Promise(resolve => {
    let cursor = 0, active = 0, done = 0;
    const total = items.length;
    if (total === 0) return resolve();
    function next() {
      while (active < limit && cursor < total) {
        const i = cursor++;
        active++;
        Promise.resolve(worker(i)).catch(() => {}).finally(() => {
          active--;
          done++;
          if (done === total) resolve();
          else next();
        });
      }
    }
    next();
  });
}

// ============ Run all tests with auto-retry ============
async function runAll() {
  const MAX_RETRIES = 2;
  // First pass: run all concurrently
  await runWithLimit(tests, 12, i => runTest(i));

  // Retry failed ones, up to MAX_RETRIES times
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const failedIndices = state
      .map((s, i) => (s.status === 'error') ? i : -1)
      .filter(i => i >= 0);
    if (failedIndices.length === 0) break;
    // Wait a bit before retrying
    await new Promise(r => setTimeout(r, 2000 * attempt));
    await runWithLimit(failedIndices, 12, idx => runTest(failedIndices[idx]));
  }
}

// ============ Init ============
// Section 1: IP query + ping
renderPingGrid();
runIPQuery();
runPings();

// Section 2: Split tunnel tests
renderTable();
runAll();

// ─── 隐藏真实IP 开关：屏蔽 IPv4 的 C/D 段、IPv6 的尾部 ─────────────────────
// 默认关；开启后通过 textContent 替换只改显示，不动 href / 数据。
// 元素保留 data-real-text 以便切换回真实值，URL 链接照常指向完整 IP。
function maskIpText(text) {
  if (!text) return '';
  const t = String(text).trim();
  // IPv4: 1.2.3.4 → 1.2.*.*
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(t)) {
    const parts = t.split('.');
    return parts[0] + '.' + parts[1] + '.*.*';
  }
  // 压缩展示形式 IPv6 (compactIp 输出): "2400:6ea0…a6c" → "2400:6ea0…*"
  if (t.includes('…')) {
    const idx = t.lastIndexOf('…');
    return t.substring(0, idx + 1) + '*';
  }
  // 普通 IPv6: 保留首 2 hextet
  if (t.includes(':')) {
    const parts = t.split(':');
    if (parts.length >= 2) {
      return parts[0] + ':' + parts[1] + ':*';
    }
  }
  return t;
}

window.__ipMaskOn = false;  // 每次刷新都默认关闭，不持久化用户偏好

function applyMaskToElement(el) {
  if (!el) return;
  if (!el.dataset.realText) {
    el.dataset.realText = el.textContent.trim();
  }
  const real = el.dataset.realText;
  const want = window.__ipMaskOn ? maskIpText(real) : real;
  if (el.textContent !== want) el.textContent = want;
}

window.applyAllIpMasks = function applyAllIpMasks() {
  document.querySelectorAll('.ip-card .ip-link, .split-ip-cell .split-ip, .main-table td.ip-cell').forEach(applyMaskToElement);
};

document.addEventListener('DOMContentLoaded', () => {
  const tg = document.getElementById('ipMaskToggle');
  if (tg) {
    tg.checked = window.__ipMaskOn;
    tg.addEventListener('change', (e) => {
      window.__ipMaskOn = e.target.checked;
      // 不持久化：用户关闭浏览器/刷新后回到默认关闭
      // Re-render all IP-bearing elements: clear realText first so next pass picks up real value
      document.querySelectorAll('.ip-card .ip-link, .split-ip-cell .split-ip, .main-table td.ip-cell').forEach(el => {
        // If we're switching ON, ensure realText is captured BEFORE we overwrite textContent
        if (!el.dataset.realText) el.dataset.realText = el.textContent.trim();
      });
      applyAllIpMasks();
    });
  }
  applyAllIpMasks();
});

// Re-apply mask whenever IP-bearing containers update (idempotent — only writes when needed)
(function setupIpMaskObserver(){
  const targets = ['ipCard', 'splitIpGrid', 'tableBody'];
  const cb = () => requestAnimationFrame(() => window.applyAllIpMasks && window.applyAllIpMasks());
  const observer = new MutationObserver(cb);
  document.addEventListener('DOMContentLoaded', () => {
    targets.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el, { childList: true, subtree: true });
    });
  });
})();


