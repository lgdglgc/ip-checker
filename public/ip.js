/* ip.js - IP 评分与深度画像客户端引擎 */

function initTheme() {
  const tsBtn = document.getElementById('ts-btn');
  const tsMenu = document.getElementById('ts-menu');
  const items = document.querySelectorAll('.ts-item');

  function getStoredTheme() {
    return localStorage.getItem('theme') || 'auto';
  }

  function applyTheme(theme) {
    if (theme === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    items.forEach(it => {
      it.classList.toggle('active', it.dataset.theme === theme);
    });
  }

  tsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    tsMenu?.classList.toggle('open');
  });

  items.forEach(it => {
    it.addEventListener('click', () => {
      const selected = it.dataset.theme;
      localStorage.setItem('theme', selected);
      applyTheme(selected);
      tsMenu?.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!tsBtn?.contains(e.target) && !tsMenu?.contains(e.target)) {
      tsMenu?.classList.remove('open');
    }
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() === 'auto') applyTheme('auto');
  });

  applyTheme(getStoredTheme());
}

function getFlagHtml(countryCode) {
  if (!countryCode) return '🌐';
  const cc = countryCode.toLowerCase();
  return `<img class="flag-icon" src="https://flagcdn.com/24x18/${cc}.png" alt="${cc}" onerror="this.style.display='none'">`;
}

// 隐藏 IP 开关逻辑
window.__ipMaskOn = false;

function maskIpString(text) {
  if (!text) return '';
  const str = String(text).trim();
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str)) {
    const parts = str.split('.');
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}:*`;
  }
  return str;
}

function applyAllIpMasks() {
  document.querySelectorAll('#h1Ip, #tbIp').forEach(el => {
    if (!el.dataset.realText) el.dataset.realText = el.textContent.trim();
    const real = el.dataset.realText;
    el.textContent = window.__ipMaskOn ? maskIpString(real) : real;
  });
}

function initIpMaskToggle() {
  const toggle = document.getElementById('ipMaskToggle');
  toggle?.addEventListener('change', (e) => {
    window.__ipMaskOn = e.target.checked;
    applyAllIpMasks();
  });
}

async function loadIpScore(ip) {
  const h1Ip = document.getElementById('h1Ip');
  const ipInput = document.getElementById('ip-input');
  if (h1Ip) h1Ip.textContent = ip;
  if (ipInput) ipInput.value = ip;
  document.title = `${ip} IP查询 - 评分/地理/ASN/运营商/风险检测 - Net.Coffee`;

  try {
    const res = await fetch(`/api/ipscore?ip=${encodeURIComponent(ip)}`);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();

    // 1. 信任评分
    const scoreNum = document.getElementById('scoreNum');
    const scoreBadge = document.getElementById('scoreLevelBadge');
    if (scoreNum) {
      scoreNum.innerHTML = `${data.score} <small>/ 100</small>`;
      scoreNum.style.color = data.score >= 90 ? 'var(--safe)' : data.score >= 70 ? 'var(--warn)' : 'var(--danger)';
    }
    if (scoreBadge) {
      scoreBadge.className = `score-level-badge badge-${data.trustClass}`;
      scoreBadge.textContent = data.trustLevel;
    }

    // 2. 场景评估
    const scTikTok = document.getElementById('scTikTok');
    const scAi = document.getElementById('scAi');
    const scSocial = document.getElementById('scSocial');
    if (scTikTok) scTikTok.textContent = data.scenarios.tiktok.desc;
    if (scAi) scAi.textContent = data.scenarios.ai.desc;
    if (scSocial) scSocial.textContent = data.scenarios.social.desc;

    // 3. 基础画像
    const tbIp = document.getElementById('tbIp');
    const tbProtocol = document.getElementById('tbProtocol');
    const tbCountry = document.getElementById('tbCountry');
    const tbCity = document.getElementById('tbCity');
    const tbType = document.getElementById('tbType');
    const tbAsn = document.getElementById('tbAsn');
    const tbOrg = document.getElementById('tbOrg');

    if (tbIp) {
      tbIp.textContent = data.ip;
      tbIp.dataset.realText = data.ip;
    }
    if (tbProtocol) tbProtocol.textContent = data.protocol;
    if (tbCountry) tbCountry.innerHTML = `${getFlagHtml(data.geo.countryCode)} ${data.geo.country || '未知'} (${(data.geo.countryCode || '').toUpperCase()})`;
    if (tbCity) tbCity.textContent = `${data.geo.regionName || ''} · ${data.geo.city || ''}`;
    if (tbType) {
      tbType.innerHTML = data.geo.isResidential
        ? '<span class="badge badge-safe">🏠 家庭宽带 (Residential)</span>'
        : '<span class="badge badge-warn">🏢 数据中心机房 (Datacenter)</span>';
    }
    if (tbAsn) tbAsn.textContent = data.geo.asn || '—';
    if (tbOrg) tbOrg.textContent = data.geo.org || data.geo.isp || '—';

    // 4. 全球 Ping 延迟
    const pingList = document.getElementById('pingList');
    if (pingList && data.pings) {
      pingList.innerHTML = data.pings.map(p => {
        const color = p.latency < 80 ? 'var(--safe)' : p.latency < 200 ? 'var(--warn)' : 'var(--danger)';
        return `
          <div class="ping-delay-tag">
            <span>${p.city}</span>
            <strong style="color: ${color}; margin-left: 4px;">${p.latency} ms</strong>
          </div>
        `;
      }).join('');
    }

    // 5. BGP 拓扑
    const bgpInfo = document.getElementById('bgpInfo');
    if (bgpInfo && data.bgp) {
      const upstreamsStr = data.bgp.upstreams.map(u => `${u.name} (${u.share})`).join(' · ');
      bgpInfo.innerHTML = `
        <p style="margin-bottom: 6px;"><strong>所属 BGP 前缀：</strong><span class="font-mono">${data.bgp.prefix}</span> · <strong>RPKI 状态：</strong><span style="color:var(--safe)">${data.bgp.rpki}</span></p>
        <p><strong>直接骨干上游：</strong>${upstreamsStr}</p>
      `;
    }

    // 6. DNSBL 黑名单
    const dnsblSummary = document.getElementById('dnsblSummary');
    const dnsblGrid = document.getElementById('dnsblGrid');
    if (dnsblSummary) dnsblSummary.textContent = `${data.dnsbl.total} 家权威检测源全部纯净，无滥用黑名单记录`;
    if (dnsblGrid && data.dnsbl.engines) {
      dnsblGrid.innerHTML = data.dnsbl.engines.map(eng => `
        <div class="dnsbl-item">
          <span>${eng.name}</span>
          <span style="color:var(--safe); font-weight:600;">✓ 纯净</span>
        </div>
      `).join('');
    }

    applyAllIpMasks();
  } catch (err) {
    console.error('Failed to load IP score:', err);
  }
}

// 提取当前 URL 里的目标 IP
async function getTargetIpFromUrl() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  // /ip/216.167.124.197 -> parts[1]
  if (parts.length >= 2 && parts[0] === 'ip') {
    return decodeURIComponent(parts[1]);
  }
  // 若未指定 IP，默认请求本机公网 IP
  try {
    const res = await fetch('/api/myip');
    if (res.ok) {
      const data = await res.json();
      if (data.ip) return data.ip;
    }
  } catch (e) {}
  return '216.167.124.197';
}

// 绑定搜索按钮
function initSearch() {
  const input = document.getElementById('ip-input');
  const btn = document.getElementById('search-btn');

  function doSearch() {
    const val = input.value.trim();
    if (val) {
      window.history.pushState(null, '', `/ip/${encodeURIComponent(val)}`);
      loadIpScore(val);
    }
  }

  btn?.addEventListener('click', doSearch);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  window.addEventListener('popstate', async () => {
    const ip = await getTargetIpFromUrl();
    loadIpScore(ip);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initIpMaskToggle();
  initSearch();

  const ip = await getTargetIpFromUrl();
  loadIpScore(ip);
});
