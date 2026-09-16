
const ASSET = 'https://ip.net.coffee/favicons/';
const LBASE = ASSET + 'link/';
const GROUPS = [
  { cc:'cn', name:'中国', flag: ASSET+'flags/cn.png' },
  { cc:'jp', name:'日本', flag: ASSET+'flags/jp.png' },
  { cc:'us', name:'美国', flag: ASSET+'flags/us.png' },
  { cc:'gl', name:'全球', flag: ASSET+'link/googleearth.ico', plain: true },
];

const LINK_ICONS = {
  baidu:"baidu.ico", tmall:"tmall.png", jd:"jd.ico", weibo:"weibo.ico", bilibili:"bilibili.ico",
  zhihu:"zhihu.ico", douyin:"douyin.ico", meituan:"meituan.ico", pinduoduo:"pinduoduo.png",
  mi:"mi.ico", alipay:"alipay.ico", csdn:"csdn.ico",
  yahoojp:"yahoojp.ico", rakuten:"rakuten.ico", amazonjp:"amazonjp.ico", line:"line.png",
  niconico:"niconico.ico", pixiv:"pixiv.ico", mercari:"mercari.ico", dmm:"dmm.ico",
  hatena:"hatena.ico", kakaku:"kakaku.ico", tabelog:"tabelog.ico", nhk:"nhk.ico",
  softbank:"softbank.ico", nikkei:"nikkei.ico", sony:"sony.ico", nintendo:"nintendo.ico",
  google:"google.ico", facebook:"facebook.ico", instagram:"instagram.png", amazon:"amazon.ico",
  microsoft:"microsoft.ico", apple:"apple.ico", netflix:"netflix.ico", reddit:"reddit.png",
  wikipedia:"wikipedia.ico", twitch:"twitch.ico", linkedin:"linkedin.ico", steam:"steam.ico",
  deepseek:"deepseek.ico", xiaohongshu:"xiaohongshu.ico", gemini:"gemini.png", oracle:"oracle.ico", bing:"bing.ico",
  tiktok:"tiktok.png", spotify:"spotify.ico", npm:"npm.png", yandex:"yandex.ico", mistral:"mistral.ico", jumia:"jumia.ico", takealot:"takealot.png", bbc:"bbc.ico", naver:"naver.ico", noon:"noon.png", mercadolibre:"mercadolibre.ico", pixpix:"pixpix.ico"
};

const TARGETS = [
  { cc:'cn', name:'DeepSeek', slug:'deepseek', host:'www.deepseek.com' },
  { cc:'cn', name:'抖音',     slug:'douyin', host:'www.douyin.com', url:'https://lf3-static.bytednsdoc.com/obj/eden-cn/favicon.ico' },
  { cc:'cn', name:'哔哩哔哩', slug:'bilibili', host:'www.bilibili.com' },
  { cc:'cn', name:'京东',     slug:'jd', host:'www.jd.com' },
  { cc:'cn', name:'腾讯QQ',   icon: ASSET+'tencent.webp', host:'www.qq.com' },
  { cc:'cn', name:'微信',     icon: ASSET+'weixin.webp', url:'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico' },
  { cc:'cn', name:'小红书',   slug:'xiaohongshu', url:'https://fe-static.xhscdn.com/favicon.ico' },
  { cc:'cn', name:'新浪微博', slug:'weibo', host:'weibo.com', url:'https://tva1.sinaimg.cn/favicon.ico' },
  { cc:'cn', name:'百度',     slug:'baidu', host:'www.baidu.com' },
  { cc:'cn', name:'网易',     icon: ASSET+'netease.png', host:'www.163.com' },
  { cc:'cn', name:'淘宝',     icon: ASSET+'taobao.webp', host:'www.taobao.com' },
  { cc:'cn', name:'小米',     slug:'mi', host:'www.mi.com' },
  { cc:'jp', name:'Sony',      slug:'sony', host:'www.sony.jp' },
  { cc:'jp', name:'任天堂',    slug:'nintendo', host:'www.nintendo.co.jp' },
  { cc:'jp', name:'Yahoo! JP', slug:'yahoojp', host:'www.yahoo.co.jp' },
  { cc:'jp', name:'LINE',      slug:'line', host:'line.me' },
  { cc:'us', name:'Apple',      slug:'apple', host:'www.apple.com' },
  { cc:'us', name:'Google',     slug:'google', url:'https://www.google.com/generate_204' },
  { cc:'us', name:'YouTube',    icon: ASSET+'youtube.webp', url:'https://www.youtube.com/generate_204' },
  { cc:'us', name:'GitHub',     icon: ASSET+'github.webp', url:'https://github.com/generate_204' },
  { cc:'us', name:'Cloudflare', icon: ASSET+'cloudflare.webp', url:'https://1.1.1.1/cdn-cgi/trace' },
  { cc:'us', name:'Claude',     icon: ASSET+'claude.webp', url:'https://api.anthropic.com/favicon.ico' },
  { cc:'us', name:'ChatGPT',    icon: ASSET+'chatgpt.webp', url:'https://chatgpt.com/cdn-cgi/trace' },
  { cc:'us', name:'AI Studio',  slug:'gemini', url:'https://generativelanguage.googleapis.com/favicon.ico' },
  { cc:'us', name:'Amazon',     slug:'amazon', host:'www.amazon.com' },
  { cc:'us', name:'Bing',       slug:'bing', url:'https://www.bing.com/favicon.ico' },
  { cc:'us', name:'Steam',      slug:'steam', host:'store.steampowered.com' },
  { cc:'us', name:'Oracle',     slug:'oracle', host:'www.oracle.com' },
  { cc:'us', name:'Zoom',       icon: ASSET+'zoom.webp', url:'https://st1.zoom.us/favicon.ico' },
  { cc:'us', name:'Facebook',   slug:'facebook', host:'www.facebook.com', url:'https://static.xx.fbcdn.net/rsrc.php/yb/r/hLRJ1GG_y0J.ico' },
  { cc:'us', name:'Instagram',  slug:'instagram', host:'www.instagram.com', url:'https://static.cdninstagram.com/rsrc.php/yb/r/hLRJ1GG_y0J.ico' },
  { cc:'us', name:'X',          icon: ASSET+'x.webp', url:'https://abs.twimg.com/favicons/twitter.3.ico' },
  { cc:'us', name:'Reddit',     slug:'reddit', host:'www.reddit.com' },
  { cc:'us', name:'LinkedIn',   slug:'linkedin', host:'www.linkedin.com', url:'https://static.licdn.com/favicon.ico' },
  { cc:'us', name:'Twitch',     slug:'twitch', host:'www.twitch.tv', url:'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png' },
  { cc:'us', name:'Netflix',    slug:'netflix', host:'www.netflix.com', url:'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico' },
  { cc:'gl', name:'TikTok',     slug:'tiktok', url:'https://www.tiktok.com/favicon.ico' },
  { cc:'gl', name:'Spotify',    slug:'spotify', url:'https://open.spotify.com/favicon.ico' },
  { cc:'gl', name:'npm',        slug:'npm', url:'https://registry.npmjs.org/' },
  { cc:'gl', name:'Takealot',   slug:'takealot', url:'https://static.takealot.com/favicon.ico' },
  { cc:'gl', name:'PixPix',     slug:'pixpix', url:'https://www.pixpix.com/favicon.ico' },
  { cc:'gl', name:'Naver',      slug:'naver', url:'https://www.naver.com/favicon.ico' },
  { cc:'gl', name:'Noon',       slug:'noon', url:'https://www.noon.com/favicon.ico' },
  { cc:'gl', name:'Wikipedia',  slug:'wikipedia', url:'https://www.wikipedia.org/static/favicon/wikipedia.ico' },
  { cc:'gl', name:'BBC',        slug:'bbc', url:'https://www.bbc.com/favicon.ico' },
  { cc:'gl', name:'Mistral AI', slug:'mistral', url:'https://mistral.ai/favicon.ico' },
  { cc:'gl', name:'Yandex',     slug:'yandex', url:'https://yastatic.net/favicon.ico' },
  { cc:'gl', name:'MercadoLibre', slug:'mercadolibre', url:'https://http2.mlstatic.com/favicon.ico' },
];
TARGETS.forEach(t => {
  if (!t.icon && t.slug && LINK_ICONS[t.slug]) t.icon = LBASE + LINK_ICONS[t.slug] + '?v=4';
  if (!t.url)  t.url  = 'https://' + t.host + '/favicon.ico';
  if (!t.icon) t.icon = t.host ? ('https://' + t.host + '/favicon.ico') : '';
});

const ROUNDS = 8;             // 每站测量轮数
const POOL = 9;               // 并发上限：最多 9 个站同时探测（限流削峰）
const MIN_INTERVAL_MS = 90;   // 每轮最短间隔
const JITTER_MS = 140;        // 轮间随机抖动上限
const pingHistory = TARGETS.map(() => []);
let running = false;

function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function render() {
  const root = document.getElementById('linkRoot');
  root.innerHTML = GROUPS.map(g => {
    const items = TARGETS.map((t, i) => ({ t, i })).filter(x => x.t.cc === g.cc);
    const flagHtml = g.globe
      ? `<svg class="country-flag country-globe" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="#3a86c8"/><g fill="none" stroke="#eaf4ff" stroke-width="1.1" opacity="0.9"><ellipse cx="12" cy="12" rx="4.4" ry="10.5"/><line x1="1.5" y1="12" x2="22.5" y2="12"/><path d="M3 7.2 Q12 4.5 21 7.2"/><path d="M3 16.8 Q12 19.5 21 16.8"/></g></svg>`
      : `<img class="country-flag${g.plain ? ' country-globe' : ''}" src="${g.flag}" alt="${esc(g.name)}" onerror="this.style.display='none'">`;
    return `
    <section class="country-block">
      <div class="country-head">
        ${flagHtml}
        <h2>${esc(g.name)}</h2>
        <span class="country-sum" id="sum-${g.cc}">准备测试…</span>
        <button class="group-refresh" data-cc="${g.cc}" title="重新测试「${esc(g.name)}」分流" aria-label="刷新">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>刷新
        </button>
      </div>
      <div class="ping-grid">
        ${items.map(({ t, i }) => `
          <div class="ping-item" id="ping-${i}">
            <img class="ping-icon" src="${t.icon}" alt="${esc(t.name)}" onerror="this.style.visibility='hidden'">
            <div style="flex:1;min-width:0">
              <div class="ping-name" title="${esc(t.name)}">${esc(t.name)}</div>
              <div class="ping-dots" id="ping-dots-${i}">${'<div class="ping-dot dot-pending"></div>'.repeat(ROUNDS)}</div>
            </div>
            <div class="ping-ms" id="ping-ms-${i}" style="color:var(--text-muted)">--</div>
          </div>`).join('')}
      </div>
    </section>`;
  }).join('');
}

async function singlePing(url) {
  const start = performance.now();
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(2500) });
    return Math.round(performance.now() - start);
  } catch { return -1; }
}

function dotClass(ms) {
  if (ms < 0) return 'dot-fail';
  if (ms < 100) return 'dot-good';
  if (ms < 400) return 'dot-warn';
  return 'dot-bad';
}

function medianOf(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function updateSummary(cc) {
  const el = document.getElementById('sum-' + cc);
  if (!el) return;
  const items = TARGETS.map((t, i) => ({ t, i })).filter(x => x.t.cc === cc);
  const meds = [];
  let reach = 0;
  items.forEach(({ i }) => { const m = medianOf(pingHistory[i]); if (m !== null) { meds.push(m); reach++; } });
  if (meds.length) {
    const avg = Math.round(meds.reduce((a, b) => a + b, 0) / meds.length);
    el.innerHTML = `可达 <b>${reach}/${items.length}</b> · 平均 <b>${Math.min(avg,999)}ms</b>`;
  } else {
    el.innerHTML = `可达 <b>0/${items.length}</b>`;
  }
}

async function probeTarget(t, i) {
  await singlePing(t.url).catch(() => -1);
  for (let round = 0; round < ROUNDS; round++) {
    const roundStart = performance.now();
    const ms = await singlePing(t.url);
    const dotsEl = document.getElementById(`ping-dots-${i}`);
    const msEl = document.getElementById(`ping-ms-${i}`);
    if (dotsEl && dotsEl.children[round]) dotsEl.children[round].className = 'ping-dot ' + dotClass(ms);
    if (ms >= 0) pingHistory[i].push(ms);
    const med = medianOf(pingHistory[i]);
    if (msEl) {
      if (med !== null) {
        msEl.textContent = Math.min(med, 999) + 'ms';
        msEl.style.color = med < 100 ? '#1b8a2d' : med < 400 ? '#6fcf7c' : '#f0c040';
      } else if (ms < 0) {
        msEl.textContent = '超时';
        msEl.style.color = '#e17055';
      }
    }
    updateSummary(t.cc);
    if (round < ROUNDS - 1) {
      const elapsed = performance.now() - roundStart;
      const wait = Math.max(0, MIN_INTERVAL_MS - elapsed) + Math.random() * JITTER_MS;
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

async function runPool(items, worker, size) {
  let idx = 0;
  async function lane() { while (idx < items.length) { const c = idx++; await worker(items[c], c); } }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, lane));
}

async function runPings() {
  running = true;
  const btn = document.getElementById('retestBtn');
  const lbl = document.getElementById('retestLabel');
  btn.disabled = true; btn.classList.add('spinning'); lbl.textContent = '测试中…';
  await runPool(TARGETS, probeTarget, POOL);
  running = false;
  btn.disabled = false; btn.classList.remove('spinning'); lbl.textContent = '重新测试';
}

const busyGroups = new Set();
async function retestGroup(cc, btn) {
  if (running || busyGroups.has(cc)) return;
  busyGroups.add(cc);
  if (btn) { btn.disabled = true; btn.classList.add('spinning'); }
  const items = TARGETS.map((t, i) => ({ t, i })).filter(x => x.t.cc === cc);
  items.forEach(({ i }) => {
    pingHistory[i] = [];
    const dotsEl = document.getElementById(`ping-dots-${i}`);
    if (dotsEl) [...dotsEl.children].forEach(d => d.className = 'ping-dot dot-pending');
    const msEl = document.getElementById(`ping-ms-${i}`);
    if (msEl) { msEl.textContent = '--'; msEl.style.color = 'var(--text-muted)'; }
  });
  updateSummary(cc);
  await runPool(items, ({ t, i }) => probeTarget(t, i), POOL);
  busyGroups.delete(cc);
  if (btn) { btn.disabled = false; btn.classList.remove('spinning'); }
}

function resetAndRun() {
  if (running || busyGroups.size) return;
  for (let i = 0; i < pingHistory.length; i++) pingHistory[i] = [];
  render();
  runPings();
}

document.getElementById('retestBtn').addEventListener('click', resetAndRun);
document.getElementById('linkRoot').addEventListener('click', e => {
  const b = e.target.closest('.group-refresh');
  if (b) retestGroup(b.dataset.cc, b);
});
render();
runPings();

