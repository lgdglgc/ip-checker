// ─── geoip-batch interceptor (transparent batching for /api/geoip/{IP}) ───
(function(){
  const _origFetch = window.fetch.bind(window);
  const _q = new Map();
  let _scheduled = false;
  function _mkResp(ok, data){ return {ok: ok, status: ok?200:502, json: async ()=>data||{}}; }
  async function _flush(){
    _scheduled = false;
    if (_q.size === 0) return;
    const queueCopy = new Map(_q);
    _q.clear();
    const ips = Array.from(queueCopy.keys());
    if (ips.length === 1){
      const ip = ips[0];
      try {
        const r = await _origFetch('/api/geoip/' + ip);
        const data = r.ok ? await r.json() : null;
        for (const cb of queueCopy.get(ip)) cb(_mkResp(r.ok, data));
      } catch (e) {
        for (const cb of queueCopy.get(ip)) cb(_mkResp(false, null));
      }
      return;
    }
    try {
      const r = await _origFetch('/api/geoip-batch?ips=' + ips.join(','));
      if (!r.ok) throw new Error('batch ' + r.status);
      const data = await r.json();
      for (const [ip, callbacks] of queueCopy) {
        const ipData = data[ip] || null;
        for (const cb of callbacks) cb(_mkResp(!!ipData, ipData));
      }
    } catch (e) {
      const tasks = Array.from(queueCopy.entries()).map(async ([ip, callbacks]) => {
        try {
          const r = await _origFetch('/api/geoip/' + ip);
          const data = r.ok ? await r.json() : null;
          for (const cb of callbacks) cb(_mkResp(r.ok, data));
        } catch {
          for (const cb of callbacks) cb(_mkResp(false, null));
        }
      });
      await Promise.all(tasks);
    }
  }
  window.fetch = function(url, opts){
    if (typeof url === 'string') {
      const m = url.match(/^\/api\/geoip\/([0-9a-fA-F.:]+)$/);
      if (m) {
        const ip = m[1];
        return new Promise(resolve => {
          if (!_q.has(ip)) _q.set(ip, []);
          _q.get(ip).push(resolve);
          if (!_scheduled) {
            _scheduled = true;
            setTimeout(_flush, 20);
          }
        });
      }
    }
    return _origFetch(url, opts);
  };
})();

// State
const state = {
  ip: null,
  ippure: null,
  ipapis: null,
  geo: null,
  googleRisk: null,
  googleGeo: null,
};

// ===== Flag helper & IPv6 helpers =====
function isIPv6(ip) { return ip && ip.includes(':'); }
function truncateIP(ip) {
  if (!isIPv6(ip) || ip.length <= 20) return ip;
  return ip.substring(0, 18) + '...';
}
function displayIP(ip) {
  if (!ip) return '获取失败';
  if (isIPv6(ip)) {
    return `<span class="ip-truncate ip-mask-target" title="${ip}">${truncateIP(ip)}</span>`;
  }
  return `<span class="ip-mask-target">${ip}</span>`;
}
function linkIP(ip) {
  if (!ip) return '获取失败';
  const inner = displayIP(ip);
  return `<a class="ip-link" href="/ip/${encodeURIComponent(ip)}" target="_blank" rel="noopener">${inner}</a>`;
}

function setGeoText(elId, text) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = '<span class="geo-text"></span>';
  const span = el.firstElementChild;
  span.textContent = text || '';
  el.classList.remove('truncated');
  el.removeAttribute('data-full');
  if (!text) return;
  requestAnimationFrame(() => {
    if (span.scrollWidth > span.clientWidth + 1) {
      el.dataset.full = text;
      el.classList.add('truncated');
    }
  });
}
window.addEventListener('resize', () => {
  ['ipGeoCN', 'ipGeo', 'ipGeoGoogle'].forEach(id => {
    const el = document.getElementById(id);
    const span = el && el.firstElementChild;
    if (!span || !span.classList || !span.classList.contains('geo-text') || !span.textContent) return;
    const truncated = span.scrollWidth > span.clientWidth + 1;
    el.classList.toggle('truncated', truncated);
    if (truncated) el.dataset.full = span.textContent;
    else el.removeAttribute('data-full');
  });
});
function showIPv6Warning() {
  const el = document.getElementById('ipv6Warn');
  if (el) el.style.display = 'block';
}

function flagImg(cc) {
  if (!cc) return '';
  const src = cc === 'cn' ? '/favicons/cn.png' : cc.toLowerCase() === 'tw' ? '/favicons/flags/tw.png' : `/favicons/flags/${cc.toLowerCase()}.png`;
  const altTxt = cc.toLowerCase() === 'tw' ? '中国台湾省' : cc;
  return `<img src="${src}" width="40" height="27" style="width:24px;height:auto;border-radius:2px;vertical-align:middle" alt="${altTxt}" onerror="this.onerror=null;this.style.display='none'">`;
}

// Restricted regions for Google Gemini & Antigravity
const GOOGLE_RESTRICTED_CC = {
  'CN': { name: '中国大陆', desc: '防火墙阻断且未在 Google 官方支持列表，无法直接访问' },
  'HK': { name: '香港', desc: 'Google Gemini / Antigravity 对香港实施官方地理封锁，访问提示 Location not supported' },
  'MO': { name: '澳门', desc: '未在 Google 官方支持列表' },
  'RU': { name: '俄罗斯', desc: '受官方合规制裁限制无法使用' },
  'KP': { name: '朝鲜', desc: '受官方合规制裁限制无法使用' },
  'IR': { name: '伊朗', desc: '受官方合规制裁限制无法使用' },
  'SY': { name: '叙利亚', desc: '受官方合规制裁限制无法使用' },
  'CU': { name: '古巴', desc: '受官方合规制裁限制无法使用' },
  'BY': { name: '白俄罗斯', desc: '受官方合规制裁限制无法使用' }
};

function getRestrictedInfo() {
  const cc = (state.googleRisk?.countryCode || state.googleRisk?.country_code || '').toUpperCase();
  return cc ? (GOOGLE_RESTRICTED_CC[cc] || null) : null;
}

function scoreLabel(trustScore) {
  if (trustScore >= 95) return { text: '极佳支持', cls: 'tag-safe-dark' };
  if (trustScore >= 80) return { text: '良好支持', cls: 'tag-safe' };
  if (trustScore >= 50) return { text: '普通/机房', cls: 'tag-info' };
  if (trustScore >= 25) return { text: '可能受限', cls: 'tag-warn' };
  return { text: '受限/不可用', cls: 'tag-danger' };
}

function boolTag(val, trueText, falseText) {
  if (val === true) return `<span class="tag tag-danger">${trueText || '是'}</span>`;
  if (val === false) return `<span class="tag tag-safe">${falseText || '否'}</span>`;
  return `<span class="tag tag-neutral">未知</span>`;
}

// ===== Render =====
function render() {
  const gr = state.googleRisk;
  const gg = state.googleGeo;
  const a = state.ipapis;

  const asn = (a?.asn ? (String(a.asn).startsWith('AS') ? String(a.asn) : 'AS' + a.asn) : '')
    || (gr?.asn ? (gr.asn.startsWith('AS') ? gr.asn : 'AS' + gr.asn) : '');
  const asnOrg = a?.asOrganization || a?.company?.name || gr?.asOrganization || gr?.isp || '';
  const restrictedInfo = getRestrictedInfo();
  const hasGoogleIp = !!(gr && gr.ip);

  let trustScore;
  let restrictedText = null;
  const ccUpper = (gr?.countryCode || gr?.country_code || '').toUpperCase();

  if (!hasGoogleIp) {
    trustScore = null;
  } else if (restrictedInfo) {
    if (ccUpper === 'HK') {
      trustScore = 15;
      restrictedText = '香港处于 Google Gemini / Antigravity 受限区 (Location not supported)';
    } else if (ccUpper === 'CN') {
      trustScore = 0;
      restrictedText = '中国大陆网络阻断且未在支持列表';
    } else {
      trustScore = 10;
      restrictedText = `处于 ${restrictedInfo.name} 受限地区，Google AI 无法提供服务`;
    }
  } else {
    trustScore = (typeof gr.trust_score === 'number') ? gr.trust_score : 90;
  }

  const gaugePointer = document.getElementById('gaugePointer');
  if (trustScore === null) {
    document.getElementById('gaugeScore').innerHTML = `<span style="color:#9ca3af">—</span> <span class="tag tag-neutral" style="font-size:0.5em;vertical-align:middle">无数据</span>`;
    gaugePointer.style.left = '0%';
    gaugePointer.style.opacity = '0.3';
    document.getElementById('gaugeText').textContent = '未获取到 Google AI 出口 IP，无法评分';
  } else {
    const sl = restrictedInfo ? { text: '地区受限', cls: 'tag-danger' } : scoreLabel(trustScore);
    const scoreColor = trustScore >= 80 ? '#22c55e' : trustScore >= 50 ? '#10b981' : trustScore >= 25 ? '#eab308' : '#ef4444';
    document.getElementById('gaugeScore').innerHTML = `<span style="color:${scoreColor}">${trustScore}</span> <span class="tag ${sl.cls}" style="font-size:0.5em;vertical-align:middle">${sl.text}</span>`;
    gaugePointer.style.left = Math.min(trustScore, 100) + '%';
    gaugePointer.style.opacity = '1';
    document.getElementById('gaugeText').textContent = restrictedText
      || (trustScore >= 95 ? '极佳节点：官方完全支持，优先畅享 Gemini 与 Antigravity' :
          trustScore >= 80 ? '可信节点：官方完全支持，体验流畅' :
          trustScore >= 50 ? '可用节点：机房 IP 偶有验证码或轻度频率控制' : '该节点存在异常或受限');
  }

  // Region restriction banner
  (function(){
    const el = document.getElementById('regionWarn');
    if (!el) return;
    if (restrictedInfo) {
      if (ccUpper === 'HK') {
        el.className = 'region-warn';
        el.innerHTML = '<span class="icon">⚠️</span>当前出口 IP 位于<strong>中国香港 (HK)</strong>！<br>'
          + '<span style="font-size:0.88em;font-weight:normal">Google 官方对香港地区实施地理封锁（访问 Gemini / Antigravity 会提示 <strong>Location not supported</strong>）。强烈建议在分流规则中将 Google AI 域名切换至<strong>美国 (US)</strong>、<strong>日本 (JP)</strong> 或<strong>新加坡 (SG)</strong> 节点！</span>';
        el.style.display = 'block';
      } else if (ccUpper === 'CN') {
        el.className = 'region-warn';
        el.innerHTML = '<span class="icon">⚠️</span>当前出口 IP 位于<strong>中国大陆 (CN)</strong>，防火墙阻断且未在 Google 官方支持列表，无法直接访问。';
        el.style.display = 'block';
      } else {
        el.className = 'region-warn';
        el.innerHTML = `<span class="icon">⚠️</span>当前出口 IP 位于<strong>${restrictedInfo.name}</strong>，受 Google 官方合规限制，无法使用 Gemini / Antigravity。`;
        el.style.display = 'block';
      }
    } else {
      el.style.display = 'none';
    }
  })();

  // Gemini & Antigravity Support Row
  (function(){
    const row = document.getElementById('googleRegionSupportRow');
    const val = document.getElementById('googleRegionSupport');
    const filler = document.querySelector('.trust-score-card .trust-score-filler');
    if (!row || !val) return;
    if (restrictedInfo) {
      row.style.display = 'none';
      if (filler) filler.style.display = 'none';
    } else {
      if (filler) filler.style.display = '';
      if (!hasGoogleIp) {
        val.innerHTML = '<span class="tag tag-neutral">未知</span>';
      } else {
        val.innerHTML = '<span class="tag tag-safe">官方支持</span>';
      }
      row.style.display = '';
    }
  })();

  // IP Properties - 优先权威风控识别结果，保持与 Claude/GPT 判定逻辑统一
  const isResidential = (a && typeof a.is_datacenter === 'boolean')
    ? (!a.is_datacenter && (a.is_residential ?? true))
    : (gr?.isResidential ?? gr?.is_residential ?? null);
  const companyType = a?.company?.type || gr?.company_type || '';
  const regionStr = gg?.country || gr?.country || '';
  const cityStr = gg?.city || gr?.city || regionStr;

  let propTag = '';
  if (isResidential === true) {
    propTag = '<span class="tag tag-safe">家庭住宅IP</span>';
  } else if (isResidential === false) {
    propTag = '<span class="tag tag-warn">机房IP</span>';
  } else {
    propTag = '<span class="tag tag-neutral">未知</span>';
  }
  if (companyType) {
    const typeMap = { 'hosting': 'Hosting', 'isp': 'ISP', 'business': 'Business', 'education': 'Education' };
    propTag += ` <span style="color: var(--text-muted);font-size:0.82em">(${typeMap[companyType] || companyType})</span>`;
  }

  document.getElementById('propsContent').innerHTML = `
    <div class="risk-row"><span class="risk-label">地区</span><span class="risk-value">${regionStr || '未知'}</span></div>
    <div class="risk-row"><span class="risk-label">城市</span><span class="risk-value">${cityStr || '未知'}</span></div>
    <div class="risk-row"><span class="risk-label">IP 属性</span><span class="risk-value">${propTag}</span></div>
    <div class="risk-row"><span class="risk-label">ASN</span><span class="risk-value">${asn ? (asn.startsWith('AS') ? asn : 'AS' + asn) : '未知'}</span></div>
    <div class="risk-row"><span class="risk-label">运营商</span><span class="risk-value" style="font-size:0.85em">${asnOrg || '未知'}</span></div>
  `;

  // Security detection
  const sec = a || gr || {};
  document.getElementById('securityContent').innerHTML = `
    <div class="risk-row"><span class="risk-label">VPN</span><span class="risk-value">${boolTag(sec.is_vpn, 'VPN', '未检测到')}</span></div>
    <div class="risk-row"><span class="risk-label">代理 (Proxy)</span><span class="risk-value">${boolTag(sec.is_proxy, '代理', '未检测到')}</span></div>
    <div class="risk-row"><span class="risk-label">Tor</span><span class="risk-value">${boolTag(sec.is_tor, 'Tor', '未检测到')}</span></div>
    <div class="risk-row"><span class="risk-label">机器人 (Crawler)</span><span class="risk-value">${boolTag(sec.is_crawler, '是', '否')}</span></div>
    <div class="risk-row"><span class="risk-label">滥用记录</span><span class="risk-value">${boolTag(sec.is_abuser, '有记录', '无记录')}</span></div>
  `;
}

// ===== Fetch Cloudflare IP =====
async function fetchCfIP() {
  try {
    const ts = Date.now();
    const r = await fetch(`https://1.1.1.1/cdn-cgi/trace?_=${ts}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    const txt = await r.text();
    const m = txt.match(/ip=([^\n]+)/);
    if (m) state.ip = m[1].trim();
  } catch {}
}

// ===== Fetch CN IP =====
async function fetchCNIP() {
  const ts = Date.now();
  try {
    const r = await fetch(`https://2026.ip138.com/?_=${ts}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    const html = await r.text();
    const m = html.match(/(\d+\.\d+\.\d+\.\d+)/);
    if (m) return { ip: m[1], source: 'iP138.com' };
  } catch {}
  try {
    const r = await fetch(`https://my.ip.cn/?_=${ts}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    const html = await r.text();
    const m = html.match(/(\d+\.\d+\.\d+\.\d+)/);
    if (m) return { ip: m[1], source: 'IP.cn' };
  } catch {}
  return null;
}

// ===== Helper to parse IP from Google DoH Answer =====
function extractIpFromGoogleDns(data) {
  if (!data || !Array.isArray(data.Answer)) return null;
  let candidate = null;
  for (const ans of data.Answer) {
    const raw = String(ans.data || '').replace(/"/g, '').trim();
    const m4 = raw.match(/\b([0-9]{1,3}(?:\.[0-9]{1,3}){3})\b/);
    if (m4 && !m4[1].startsWith('0.') && !m4[1].startsWith('127.')) {
      if (!m4[1].endsWith('.0')) {
        return m4[1];
      }
      candidate = candidate || m4[1];
    }
    const m6 = raw.match(/([a-f0-9:]{5,})/i);
    if (m6) return m6[1];
  }
  return candidate;
}

// ===== Fetch Google AI IP =====
// 优先请求 Google 官方端点以精准命中客户端对 Google 的分流规则
// 全流程添加 cache: 'no-store' 与动态时间戳，杜绝浏览器与代理复用旧结果
async function fetchGoogleIP() {
  const ts = Date.now();

  // 1. 优先通过 Google 官方 DoH 解析本机访问 Google 服务的真实出口 IP
  try {
    const r = await fetch(`https://dns.google/resolve?name=o-o.myaddr.l.google.com&type=TXT&_=${ts}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/dns-json' },
      signal: AbortSignal.timeout(3500)
    });
    if (r.ok) {
      const data = await r.json();
      const ip = extractIpFromGoogleDns(data);
      if (ip) return { ip, source: 'google_doh' };
    }
  } catch {}

  // 2. 回退：api.ipify.org
  try {
    const r = await fetch(`https://api.ipify.org?format=json&_=${ts}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
    });
    if (r.ok) {
      const data = await r.json();
      if (data.ip) return { ip: data.ip, source: 'ipify' };
    }
  } catch {}

  // 3. 回退：api.ip.sb
  try {
    const r = await fetch(`https://api.ip.sb/geoip?_=${ts}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
    });
    if (r.ok) {
      const data = await r.json();
      if (data.ip) return { ip: data.ip, source: 'ipsb' };
    }
  } catch {}

  // 4. 回退：Cloudflare exit IP (state.ip)
  if (state.ip) {
    return { ip: state.ip, source: 'cf' };
  }

  // 5. 回退：Direct Cloudflare trace
  try {
    const r = await fetch(`https://1.1.1.1/cdn-cgi/trace?_=${ts}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000)
    });
    const txt = await r.text();
    const m = txt.match(/ip=([^\n]+)/);
    if (m) return { ip: m[1].trim(), source: 'cf_trace' };
  } catch {}

  return null;
}

// ===== Render a single IP card =====
async function renderIPCard(elId, geoElId, ip, locHint) {
  if (!ip) {
    document.getElementById(elId).textContent = '获取失败';
    document.getElementById(geoElId).textContent = '';
    return;
  }
  if (isIPv6(ip)) showIPv6Warning();
  document.getElementById(elId).innerHTML = `${locHint ? flagImg(locHint) : ''} ${linkIP(ip)}`;
  try {
    const ts = Date.now();
    const r = await fetch(`/api/geoip/${ip}?_=${ts}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const g = await r.json();
      const geo = [g.country, g.region, g.city, g.isp].filter(Boolean).join(' ');
      const cc = g.country_code || locHint || '';
      document.getElementById(elId).innerHTML = `${flagImg(cc)} ${linkIP(ip)}`;
      setGeoText(geoElId, geo);
    }
  } catch {}
}

// ===== DNS Leak Detection =====
async function detectDNSLeak() {
  const el = document.getElementById('dnsLeakContent');
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  for (let i = 1; i <= 2; i++) {
    await new Promise(resolve => {
      const img = new Image();
      const timer = setTimeout(resolve, 2000);
      img.onload = img.onerror = () => { clearTimeout(timer); resolve(); };
      img.src = `https://${token}-${i}.d.ip.net.coffee/pixel.gif?_=${Date.now()}`;
    });
  }

  await new Promise(r => setTimeout(r, 1500));

  let dnsServers = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`/api/dns/result/${token}`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        const data = await r.json();
        dnsServers = data.dns_servers || [];
        if (dnsServers.length > 0) break;
      }
    } catch {}
    if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
  }

  if (dnsServers.length === 0) {
    el.innerHTML = `
      <div class="risk-row"><span class="risk-label">状态</span><span class="risk-value"><span class="tag tag-safe">未检测到泄露</span></span></div>
      <div class="risk-row"><span class="risk-label">DNS 出口</span><span class="risk-value" style="font-size:0.85em;color:var(--text-muted)">DoH / 加密未暴露</span></div>
      <div class="risk-row"><span class="risk-label">归属地区</span><span class="risk-value" style="font-size:0.85em;color:var(--text-soft)">跟随代理环境</span></div>
      <div class="risk-row"><span class="risk-label">DNS 服务商</span><span class="risk-value" style="font-size:0.85em;color:var(--text-muted)">加密保护</span></div>
    `;
    return;
  }

  const googleCountry = (state.googleRisk?.country || '').toLowerCase();
  const googleInChina = googleCountry.includes('china') || googleCountry.includes('中国');

  let showIP = null;
  let isLeaked = false;
  for (const ip of dnsServers) {
    let geo = null;
    try {
      const r = await fetch(`/api/geoip/${ip}`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) geo = await r.json();
    } catch {}
    const cc = geo?.country_code || '';
    const country = geo?.country || cc || '';
    const isp = geo?.isp || '';
    const isCN = cc.toLowerCase() === 'cn';
    if (isCN && !googleInChina) {
      showIP = { ip, cc, country, isp, leaked: true };
      isLeaked = true;
      break;
    }
    if (!showIP) {
      showIP = { ip, cc, country, isp, leaked: false };
    }
  }

  let rows = `<div class="risk-row"><span class="risk-label">状态</span><span class="risk-value">${
    isLeaked
      ? '<span class="tag tag-warn">可能泄露</span>'
      : '<span class="tag tag-safe">未检测到泄露</span>'
  }</span></div>`;

  if (showIP) {
    rows += `<div class="risk-row"><span class="risk-label">DNS 出口</span><span class="risk-value" style="font-size:0.85em">${flagImg(showIP.cc)} <span class="ip-mask-target">${showIP.ip}</span> ${showIP.leaked ? '<span class="tag tag-warn" style="font-size:0.8em">中国DNS</span>' : ''}</span></div>`;
    rows += `<div class="risk-row"><span class="risk-label">归属地区</span><span class="risk-value" style="font-size:0.85em;color:var(--text-soft)">${showIP.country || showIP.cc || '未知'}</span></div>`;
    rows += `<div class="risk-row"><span class="risk-label">DNS 服务商</span><span class="risk-value" style="font-size:0.85em;font-weight:400;color: var(--text-muted)">${showIP.isp || '公共 DNS'}</span></div>`;
  }
  el.innerHTML = rows;
}

// ===== WebRTC UDP Leak Detection =====
async function detectWebRTCLeak() {
  const el = document.getElementById('udpLeakContent');
  const udpIPs = new Set();

  try {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ]
    });
    pc.createDataChannel('');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await new Promise((resolve) => {
      const timeout = setTimeout(() => { pc.close(); resolve(); }, 5000);
      pc.onicecandidate = (e) => {
        if (!e.candidate) { clearTimeout(timeout); pc.close(); resolve(); return; }
        const m = e.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
        if (m) {
          const ip = m[0];
          if (!ip.startsWith('0.') && !ip.startsWith('127.') && ip !== '0.0.0.0') {
            udpIPs.add(ip);
          }
        }
        const m6 = e.candidate.candidate.match(/([a-f0-9]{1,4}:){2,7}[a-f0-9]{1,4}/i);
        if (m6) udpIPs.add(m6[0]);
      };
    });
  } catch {}

  const googleIp = state.googleRisk?.ip || '';
  const allUdp = [...udpIPs];
  const publicUdp = allUdp.filter(ip => !isIPv6(ip) && !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.') && !ip.startsWith('198.18.') && !ip.startsWith('198.19.') && !ip.startsWith('100.64.') && !ip.startsWith('127.') && !ip.startsWith('0.'));

  if (publicUdp.length === 0 && allUdp.length === 0) {
    el.innerHTML = `
      <div class="risk-row"><span class="risk-label">状态</span><span class="risk-value"><span class="tag tag-safe">WebRTC 已禁用</span></span></div>
      <div class="risk-row"><span class="risk-label">UDP 出口</span><span class="risk-value" style="font-size:0.85em;color:var(--text-muted)">无泄露风险</span></div>
      <div class="risk-row"><span class="risk-label">归属地区</span><span class="risk-value" style="font-size:0.85em;color:var(--text-soft)">—</span></div>
      <div class="risk-row"><span class="risk-label">网络服务商</span><span class="risk-value" style="font-size:0.85em;color:var(--text-muted)">浏览器已拦截</span></div>
    `;
    return;
  }

  if (publicUdp.length === 0) {
    el.innerHTML = `
      <div class="risk-row"><span class="risk-label">状态</span><span class="risk-value"><span class="tag tag-safe">未检测到泄露</span></span></div>
      <div class="risk-row"><span class="risk-label">UDP 出口</span><span class="risk-value" style="font-size:0.85em;color:var(--text-muted)">内网保留地址</span></div>
      <div class="risk-row"><span class="risk-label">归属地区</span><span class="risk-value" style="font-size:0.85em;color:var(--text-soft)">局域网内网</span></div>
      <div class="risk-row"><span class="risk-label">网络服务商</span><span class="risk-value" style="font-size:0.85em;color:var(--text-muted)">私有网络</span></div>
    `;
    return;
  }

  const leakIP = googleIp ? publicUdp.find(ip => ip !== googleIp) : undefined;
  let showIP = leakIP || publicUdp.find(ip => ip === googleIp) || publicUdp[0];
  const matchesGoogle = showIP === googleIp;
  const isLeaked = !!leakIP;

  let rows = `<div class="risk-row"><span class="risk-label">状态</span><span class="risk-value">${
    isLeaked
      ? '<span class="tag tag-warn">可能泄露</span>'
      : '<span class="tag tag-safe">未检测到泄露</span>'
  }</span></div>`;

  let showFlag = '', showCountry = '', showIsp = '';
  try {
    const r = await fetch(`/api/geoip/${showIP}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const g = await r.json();
      showFlag = g.country_code || '';
      showCountry = [g.country, g.city].filter(Boolean).join(' ') || g.country || '';
      showIsp = g.isp || g.asOrganization || g.organization || '';
    }
  } catch {}

  rows += `<div class="risk-row"><span class="risk-label">UDP 出口</span><span class="risk-value" style="font-size:0.88em">${flagImg(showFlag)} ${displayIP(showIP)} ${matchesGoogle ? '' : isLeaked ? '<span class="tag tag-warn" style="font-size:0.8em">异常</span>' : ''}</span></div>`;
  rows += `<div class="risk-row"><span class="risk-label">归属地区</span><span class="risk-value" style="font-size:0.85em;color:var(--text-soft)">${showCountry || '未知'}</span></div>`;
  rows += `<div class="risk-row"><span class="risk-label">网络服务商</span><span class="risk-value" style="font-size:0.85em;font-weight:400;color: var(--text-muted)">${showIsp || '未知'}</span></div>`;
  el.innerHTML = rows;
}

// ===== Google Availability Detection =====
async function detectGoogleAvail() {
  const el = document.getElementById('googleAvailContent');
  const targets = [
    { name: 'Gemini', host: 'gemini.google.com', url: 'https://gemini.google.com/favicon.ico', isAI: true },
    { name: 'Antigravity', host: 'antigravity.google', url: 'https://deepmind.google/favicon.ico', isAI: true },
    { name: 'AI Studio', host: 'googleapis.com', url: 'https://generativelanguage.googleapis.com/favicon.ico', isAI: true },
    { name: 'Google 连通性', host: 'generate_204', url: 'https://www.google.com/generate_204', isAI: false },
  ];

  const results = await Promise.allSettled(targets.map(async t => {
    const start = performance.now();
    try {
      await fetch(t.url + '?_=' + Date.now(), { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(5000) });
      return { name: t.name, host: t.host, ms: Math.round(performance.now() - start), ok: true, isAI: t.isAI };
    } catch {
      return { name: t.name, host: t.host, ms: -1, ok: false, isAI: t.isAI };
    }
  }));

  const restricted = getRestrictedInfo();
  const ccUpper = (state.googleRisk?.countryCode || state.googleRisk?.country_code || '').toUpperCase();
  let rows = '';

  results.forEach(r => {
    const d = r.value;
    const titleAttr = d.host ? ` title="${d.name} (${d.host})"` : '';
    if (d.isAI && restricted) {
      if (ccUpper === 'HK') {
        rows += `<div class="risk-row"><span class="risk-label"${titleAttr}>${d.name}</span><span class="risk-value"><span class="tag tag-danger">地区受限</span></span></div>`;
      } else if (ccUpper === 'CN') {
        rows += `<div class="risk-row"><span class="risk-label"${titleAttr}>${d.name}</span><span class="risk-value"><span class="tag tag-danger">网络阻断</span></span></div>`;
      } else {
        rows += `<div class="risk-row"><span class="risk-label"${titleAttr}>${d.name}</span><span class="risk-value"><span class="tag tag-danger">未开放</span></span></div>`;
      }
    } else if (d.ok) {
      const cls = d.ms < 300 ? 'tag-safe-dark' : d.ms < 700 ? 'tag-safe' : 'tag-warn';
      const label = d.ms < 300 ? '极佳' : d.ms < 700 ? '正常' : '较慢';
      rows += `<div class="risk-row"><span class="risk-label"${titleAttr}>${d.name}</span><span class="risk-value"><span class="tag ${cls}">${label}</span> <span style="color: var(--text-muted);font-size:0.85em;margin-left:4px">${d.ms}ms</span></span></div>`;
    } else {
      rows += `<div class="risk-row"><span class="risk-label"${titleAttr}>${d.name}</span><span class="risk-value"><span class="tag tag-danger">连接超时</span></span></div>`;
    }
  });

  el.innerHTML = rows;
}

// ===== Device Info =====
function renderDeviceInfo() {
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '未知';
  const localOffset = -(new Date().getTimezoneOffset() / 60);
  const localUtc = 'UTC' + (localOffset >= 0 ? '+' : '') + localOffset;

  function currentOffsetMinutes(tzName) {
    if (!tzName) return null;
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tzName, timeZoneName: 'longOffset'
      }).formatToParts(new Date());
      const p = parts.find(x => x.type === 'timeZoneName');
      if (!p) return null;
      if (p.value === 'GMT' || p.value === 'UTC') return 0;
      const m = p.value.match(/GMT([+-])(\d{1,2}):?(\d{0,2})/);
      if (!m) return null;
      const sign = m[1] === '+' ? 1 : -1;
      return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3] || '0', 10));
    } catch (e) { return null; }
  }

  function formatOffsetHours(mins) {
    if (mins == null) return '';
    const sign = mins >= 0 ? '+' : '-';
    const abs  = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return 'UTC' + sign + h + (m ? ':' + String(m).padStart(2, '0') : '');
  }

  const gr = state.googleRisk;
  const CC_TO_TZ = {
    'CN': 'Asia/Shanghai', 'TW': 'Asia/Taipei', 'HK': 'Asia/Hong_Kong', 'MO': 'Asia/Macau',
    'JP': 'Asia/Tokyo', 'KR': 'Asia/Seoul', 'SG': 'Asia/Singapore', 'MY': 'Asia/Kuala_Lumpur',
    'US': 'America/Los_Angeles', 'CA': 'America/Toronto', 'GB': 'Europe/London', 'DE': 'Europe/Berlin'
  };
  const _googleCC = (gr?.countryCode || gr?.country_code || '').toUpperCase();
  const googleTz = gr?.timezone || CC_TO_TZ[_googleCC] || '';
  const tzIsExact = !!(gr?.timezone);
  const googleOffMin = currentOffsetMinutes(googleTz);
  const localOffMin = -new Date().getTimezoneOffset();
  let tzMatch = null;
  if (googleTz && googleOffMin != null) {
    tzMatch = Math.abs(googleOffMin - localOffMin) <= 60;
  }

  const localIsCN = (localTz === 'Asia/Shanghai' || localTz === 'Asia/Urumqi');
  let tzHtml = '';
  if (localIsCN) {
    let gLine = 'Google出口: 未知';
    if (googleTz && googleOffMin != null) {
      const gOffStr = formatOffsetHours(googleOffMin);
      const diffHours = Math.round((googleOffMin - localOffMin) / 60);
      const diffLabel = (googleOffMin - localOffMin) === 0 ? '偏移一致' : diffHours === 0 ? '略有微差' : (diffHours > 0 ? `快 ${diffHours} 小时` : `慢 ${-diffHours} 小时`);
      gLine = `Google出口: ${googleTz} (${gOffStr}) — ${diffLabel}`;
    }
    tzHtml = `<div style="display:inline-flex;flex-direction:column;align-items:flex-end;gap:3px;text-align:right">`
           + `<span class="tag tag-warn">本地为中国大陆时区</span>`
           + `<span style="font-size:0.85em;color:var(--text-soft)">本地: ${localTz} (${localUtc})</span>`
           + `<span style="font-size:0.85em;color:var(--text-muted)">${gLine}</span>`
           + `</div>`;
  } else if (tzMatch === true) {
    tzHtml = `<span class="tag tag-safe">时区一致</span> <span style="font-size:0.88em;color:var(--text-soft);margin-left:6px">${localTz} (${localUtc})</span>`;
  } else if (tzMatch === false) {
    const gOffStr = formatOffsetHours(googleOffMin);
    const diffHours = Math.round((googleOffMin - localOffMin) / 60);
    const diffLabel = (googleOffMin - localOffMin) === 0 ? '偏移一致' : diffHours === 0 ? '略有微差' : (diffHours > 0 ? `快 ${diffHours} 小时` : `慢 ${-diffHours} 小时`);
    tzHtml = `<div style="display:inline-flex;flex-direction:column;align-items:flex-end;gap:3px;text-align:right">`
           + `<span class="tag tag-warn">时区不一致</span>`
           + `<span style="font-size:0.85em;color:var(--text-soft)">本地: ${localTz} (${localUtc})</span>`
           + `<span style="font-size:0.85em;color:var(--text-muted)">Google出口: ${googleTz} (${gOffStr}) — ${diffLabel}</span>`
           + `</div>`;
  } else {
    tzHtml = `${localTz} (${localUtc})`;
  }

  const localLangs = (navigator.languages || [navigator.language]);
  const langsStr = localLangs.join(', ') || '未知';
  let langHtml = `<span>${langsStr}</span>`;

  // OS & Browser
  const ua = navigator.userAgent;
  let os = '未知';
  if (/Windows NT 10.0/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/.test(ua)) os = 'Windows 8.1';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = '未知';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';

  // WebGL & Canvas Fingerprints
  let webglRenderer = '未知';
  let canvasHash = '—';
  let webglHash = '—';

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '未知';
      }
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
      const str = vendor + '~' + renderer + '~' + (gl.getParameter(gl.VERSION) || '');
      let h = 0;
      for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
      webglHash = '0x' + (h >>> 0).toString(16).toUpperCase();
    }
  } catch {}

  try {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 50;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('GoogleAI,Antigravity', 2, 15);
      const data = c.toDataURL();
      let hash = 0;
      for (let i = 0; i < data.length; i++) hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
      canvasHash = '0x' + (hash >>> 0).toString(16).toUpperCase();
    }
  } catch {}

  document.getElementById('deviceContent').innerHTML = `
    <div class="risk-row" style="align-items:flex-start;padding:12px 0"><span class="risk-label" style="padding-top:2px">时区</span><span class="risk-value">${tzHtml}</span></div>
    <div class="risk-row"><span class="risk-label">语言偏好</span><span class="risk-value" style="font-size:0.85em">${langHtml}</span></div>
    <div class="risk-row"><span class="risk-label">操作系统 / 浏览器</span><span class="risk-value">${os} / ${browser}</span></div>
    <div class="risk-row"><span class="risk-label">Cookie</span><span class="risk-value">${navigator.cookieEnabled ? '<span class="tag tag-safe">已启用</span>' : '<span class="tag tag-warn">已禁用</span>'}</span></div>
    <div class="risk-row"><span class="risk-label">WebGL 渲染器</span><span class="risk-value dev-long">${webglRenderer}</span></div>
    <div class="risk-row"><span class="risk-label">Canvas 指纹</span><span class="risk-value" style="letter-spacing:1px">${canvasHash}</span></div>
    <div class="risk-row"><span class="risk-label">WebGL 指纹</span><span class="risk-value" style="letter-spacing:1px">${webglHash}</span></div>
  `;
}

// ===== Main Parallel Execution =====
async function main() {
  const [cfResult, cnResult, googleResult] = await Promise.allSettled([
    fetchCfIP(), fetchCNIP(), fetchGoogleIP()
  ]);

  const cn = cnResult.status === 'fulfilled' ? cnResult.value : null;
  const google = googleResult.status === 'fulfilled' ? googleResult.value : null;

  const tasks = [];

  // 1. CN IP card
  tasks.push(renderIPCard('ipAddrCN', 'ipGeoCN', cn?.ip, 'cn'));

  // 2. Cloudflare IP card
  tasks.push((async () => {
    if (!state.ip) {
      document.getElementById('ipAddr').textContent = '获取失败';
      document.getElementById('ipGeo').textContent = '';
      return;
    }
    if (isIPv6(state.ip)) showIPv6Warning();
    document.getElementById('ipAddr').innerHTML = linkIP(state.ip);
    try {
      const ts = Date.now();
      const r = await fetch(`/api/geoip/${state.ip}?_=${ts}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const g = await r.json();
        const cc = (g.country_code || '').toLowerCase();
        state.ippure = {
          ip: state.ip, country: g.country, countryCode: (g.country_code||'').toUpperCase(),
          region: g.region, city: g.city,
        };
        const cfGeo = [g.country, g.region, g.city, g.isp].filter(Boolean).join(' ');
        document.getElementById('ipAddr').innerHTML = `${flagImg(cc)} ${linkIP(state.ip)}`;
        setGeoText('ipGeo', cfGeo);
      }
    } catch {}
  })());

  // 3. Google AI IP card + risk detection
  tasks.push((async () => {
    const googleIp = google?.ip || state.ip;
    if (!googleIp) {
      document.getElementById('ipAddrGoogle').textContent = '获取失败';
      document.getElementById('ipGeoGoogle').textContent = '';
      return;
    }
    if (isIPv6(googleIp)) showIPv6Warning();
    document.getElementById('ipAddrGoogle').innerHTML = linkIP(googleIp);

    const ts = Date.now();
    const [checkResp, geoResp, riskResp] = await Promise.allSettled([
      fetch(`/api/google-check?ip=${googleIp}&_=${ts}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) }),
      fetch(`/api/geoip/${googleIp}&_=${ts}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) }),
      fetch(`/api/iprisk/${googleIp}&_=${ts}`, { cache: 'no-store', signal: AbortSignal.timeout(6000) })
    ]);

    let googleGeoOk = false;
    if (geoResp.status === 'fulfilled' && geoResp.value.ok) {
      try {
        const g = await geoResp.value.json();
        if (g.country) {
          state.googleGeo = { country: g.country, region: g.region, city: g.city, isp: g.isp, country_code: g.country_code };
          const geoStr = [g.country, g.region, g.city, g.isp].filter(Boolean).join(' ');
          document.getElementById('ipAddrGoogle').innerHTML = `${flagImg(g.country_code || '')} ${linkIP(googleIp)}`;
          setGeoText('ipGeoGoogle', geoStr);
          googleGeoOk = true;
        }
      } catch {}
    }

    if (riskResp.status === 'fulfilled' && riskResp.value.ok) {
      try {
        const d = await riskResp.value.json();
        state.ipapis = {
          is_datacenter: d.is_datacenter, is_vpn: d.is_vpn, is_proxy: d.is_proxy,
          is_tor: d.is_tor, is_crawler: d.is_crawler, is_abuser: d.is_abuser,
          is_residential: d.isResidential,
          asn: d.asn,
          asOrganization: d.asOrganization,
          company: { type: d.company_type, name: d.company_name }
        };
      } catch {}
    }

    if (checkResp.status === 'fulfilled' && checkResp.value.ok) {
      try {
        const d = await checkResp.value.json();
        state.googleRisk = {
          ip: googleIp,
          country: d.country,
          countryCode: d.country_code,
          country_code: d.country_code,
          region: d.region,
          city: d.city,
          timezone: d.timezone,
          isp: d.isp,
          asOrganization: d.asOrganization || d.isp,
          asn: d.asn,
          isResidential: d.is_residential,
          is_residential: d.is_residential,
          company_type: d.company_type,
          trust_score: d.trust_score,
          gemini_supported: d.gemini_supported,
          antigravity_supported: d.antigravity_supported,
          region_status: d.region_status,
          region_status_text: d.region_status_text,
          reasons: d.reasons
        };
        if (!googleGeoOk) {
          document.getElementById('ipAddrGoogle').innerHTML = `${flagImg(d.country_code || '')} ${linkIP(googleIp)}`;
          setGeoText('ipGeoGoogle', [d.country, d.region, d.city].filter(Boolean).join(' '));
        }
      } catch {}
    } else if (!state.googleRisk) {
      // Fallback
      state.googleRisk = {
        ip: googleIp,
        country: state.googleGeo?.country || '',
        countryCode: state.googleGeo?.country_code || '',
        city: state.googleGeo?.city || '',
        trust_score: 85
      };
    }
  })());

  await Promise.allSettled(tasks);
  render();

  Promise.allSettled([detectDNSLeak(), detectWebRTCLeak(), detectGoogleAvail()]);
  renderDeviceInfo();
  saveAndRenderIPHistory();
}

// ===== IP History (localStorage) =====
const IP_HISTORY_KEY = 'google_ai_ip_history';
const IP_HISTORY_MAX = 6;

function getIPHistory() {
  try { return JSON.parse(localStorage.getItem(IP_HISTORY_KEY)) || []; } catch { return []; }
}

function saveAndRenderIPHistory() {
  const googleIp = state.googleRisk?.ip || '';
  const googleCC = (state.googleRisk?.countryCode || state.googleRisk?.country_code || '').toLowerCase();
  const googleGeo = state.googleRisk?.city || state.googleRisk?.country || '';

  if (!googleIp) {
    renderIPHistory();
    return;
  }

  const history = getIPHistory();
  const now = new Date();
  const entry = {
    ip: googleIp,
    cc: googleCC,
    geo: googleGeo,
    time: now.toISOString(),
  };

  if (history.length > 0) {
    const lastEntry = history[0];
    const lastTime = new Date(lastEntry.time);
    const hoursSinceLast = (now - lastTime) / (1000 * 60 * 60);

    if (lastEntry.ip === googleIp && hoursSinceLast < 24) {
      renderIPHistory();
      return;
    }
  }

  history.unshift(entry);
  if (history.length > IP_HISTORY_MAX) history.length = IP_HISTORY_MAX;
  localStorage.setItem(IP_HISTORY_KEY, JSON.stringify(history));
  renderIPHistory();
}

function renderIPHistory() {
  const el = document.getElementById('ipHistoryContent');
  const history = getIPHistory();

  if (history.length === 0) {
    el.textContent = '暂无历史记录';
    return;
  }

  el.innerHTML = history.map((h, i) => {
    const d = new Date(h.time);
    const timeStr = `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const isCurrent = i === 0;
    return `<div class="risk-row" style="padding:6px 0">
      <span class="risk-label" style="color:${isCurrent ? 'var(--text)' : 'var(--text-muted)'};font-size:0.88em">${timeStr}${isCurrent ? ' <span style="color:#22c55e;font-size:0.82em">(当前)</span>' : ''}</span>
      <span class="risk-value" style="font-size:0.88em">${flagImg(h.cc)} ${linkIP(h.ip)} <span style="color: var(--text-muted);font-size:0.85em">${h.geo}</span></span>
    </div>`;
  }).join('');
}

function clearIPHistory() {
  localStorage.removeItem(IP_HISTORY_KEY);
  renderIPHistory();
}

// ─── 隐藏IP 开关 ─────────────────────────────────────
function maskIpText(text) {
  if (!text) return '';
  const t = String(text).trim();
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(t)) {
    const parts = t.split('.');
    return parts[0] + '.' + parts[1] + '.*.*';
  }
  if (t.includes('…')) {
    const idx = t.lastIndexOf('…');
    return t.substring(0, idx + 1) + '*';
  }
  if (t.includes(':')) {
    const parts = t.split(':');
    if (parts.length >= 2) return parts[0] + ':' + parts[1] + ':*';
  }
  return t;
}

window.__ipMaskOn = false;

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
  document.querySelectorAll('.ip-link, .ip-mask-target').forEach(applyMaskToElement);
};

document.addEventListener('DOMContentLoaded', () => {
  const tg = document.getElementById('ipMaskToggle');
  if (tg) {
    tg.checked = false;
    tg.addEventListener('change', (e) => {
      window.__ipMaskOn = e.target.checked;
      document.querySelectorAll('.ip-link, .ip-mask-target').forEach(el => {
        if (!el.dataset.realText) el.dataset.realText = el.textContent.trim();
      });
      applyAllIpMasks();
    });
  }
  applyAllIpMasks();
});

(function setupIpMaskObserver(){
  const targets = ['ipHeroCN', 'ipHero', 'ipHeroGoogle', 'ipHistoryContent', 'dnsLeakContent', 'udpLeakContent'];
  const cb = () => requestAnimationFrame(() => window.applyAllIpMasks && window.applyAllIpMasks());
  const observer = new MutationObserver(cb);
  document.addEventListener('DOMContentLoaded', () => {
    targets.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el, { childList: true, subtree: true });
    });
  });
})();

main();
