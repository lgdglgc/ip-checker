// 站点定义配置（集成 Gemini、ChatGPT、Claude 及常用国际服务）
const SITES = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    desc: 'gemini.google.com',
    icon: 'https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7fcd9a9b2.svg',
    traceType: 'cf',
    traceHost: '1.1.1.1',
    isAi: true,
    badge: 'Gemini'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    desc: 'chatgpt.com',
    icon: 'https://chatgpt.com/favicon.ico',
    traceType: 'cf',
    traceHost: 'chatgpt.com',
    isAi: true,
    badge: 'OpenAI'
  },
  {
    id: 'claude',
    name: 'Claude AI',
    desc: 'claude.ai',
    icon: 'https://claude.ai/favicon.ico',
    traceType: 'cf',
    traceHost: 'claude.ai',
    isAi: true,
    badge: 'Anthropic'
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    desc: 'cloudflare.com',
    icon: 'https://www.cloudflare.com/favicon.ico',
    traceType: 'cf',
    traceHost: '1.1.1.1'
  },
  {
    id: 'github',
    name: 'GitHub',
    desc: 'github.com',
    icon: 'https://github.githubassets.com/favicons/favicon.svg',
    traceType: 'cf',
    traceHost: '1.1.1.1'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    desc: 'youtube.com',
    icon: 'https://www.youtube.com/s/desktop/f71584c3/img/favicon.ico',
    traceType: 'cf',
    traceHost: '1.1.1.1'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    desc: 'netflix.com',
    icon: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico',
    traceType: 'cf',
    traceHost: '1.1.1.1'
  }
];

const GEMINI_RESTRICTED = ['CN', 'HK', 'MO', 'RU', 'KP', 'IR', 'SY', 'CU', 'BY'];

let hideIpMode = false;
const ipStore = {};

function maskIp(ip) {
  if (!ip || !hideIpMode) return ip;
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return ip.substring(0, Math.min(8, ip.length)) + '****';
}

function toggleMask() {
  hideIpMode = document.getElementById('maskToggle').checked;
  renderAllIps();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// 初始化主题
(function initTheme() {
  const saved = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', saved);
})();

// 测试各服务的网络延迟 Ping
async function pingService(id, url) {
  const start = performance.now();
  const el = document.getElementById(`ping-${id}`);
  if (!el) return;
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(4000) });
    const ms = Math.round(performance.now() - start);
    el.textContent = `${ms} ms`;
    el.className = `ping-ms ${ms < 100 ? 'ms-fast' : ms < 250 ? 'ms-medium' : 'ms-slow'}`;
  } catch (e) {
    el.textContent = '超时';
    el.className = 'ping-ms ms-slow';
  }
}

// 获取 Cloudflare Trace 出口 IP
async function fetchTrace(host) {
  try {
    const res = await fetch(`https://${host}/cdn-cgi/trace`, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    const text = await res.text();
    const m = text.match(/ip=([^\n]+)/);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

// 批量请求后端 GeoIP 数据
async function queryGeoBatch(ips) {
  const list = Array.from(new Set(ips.filter(Boolean)));
  if (list.length === 0) return {};
  try {
    const res = await fetch(`/api/geoip-batch?ips=${list.join(',')}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Geo query error', e);
  }
  return {};
}

function renderAllIps() {
  // 渲染直连 IP
  const myIpVal = document.getElementById('myIp');
  if (ipStore['myIp']) {
    myIpVal.textContent = maskIp(ipStore['myIp']);
  }

  // 渲染表格各站 IP
  SITES.forEach(site => {
    const ip = ipStore[site.id];
    const el = document.getElementById(`ip-${site.id}`);
    if (el) el.textContent = ip ? maskIp(ip) : '—';
  });

  // 渲染出口汇总卡片
  if (ipStore['gemini']) document.getElementById('sum-gemini-ip').textContent = maskIp(ipStore['gemini']);
  if (ipStore['chatgpt']) document.getElementById('sum-gpt-ip').textContent = maskIp(ipStore['chatgpt']);
  if (ipStore['claude']) document.getElementById('sum-claude-ip').textContent = maskIp(ipStore['claude']);
}

async function init() {
  // 1. 初始化表格结构
  const tbody = document.getElementById('splitTableBody');
  tbody.innerHTML = SITES.map(s => `
    <tr id="row-${s.id}">
      <td>
        <div class="site-cell">
          <img class="site-icon" src="${s.icon}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><circle cx=%2212%22 cy=%2212%22 r=%2210%22 fill=%22%23cbd5e1%22/></svg>'">
          <div>
            <div>${s.name} ${s.badge ? `<span class="badge badge-gemini">${s.badge}</span>` : ''}</div>
            <div style="font-size:0.8em;color:var(--text-muted)">${s.desc}</div>
          </div>
        </div>
      </td>
      <td class="font-mono" id="ip-${s.id}"><span class="loading-pulse"></span></td>
      <td id="geo-${s.id}"><span class="loading-pulse"></span></td>
    </tr>
  `).join('');

  // 2. 并行测试直连与各分流
  pingService('google', 'https://www.google.com/generate_204');
  pingService('cf', 'https://1.1.1.1/cdn-cgi/trace');
  pingService('github', 'https://github.com');
  pingService('openai', 'https://chatgpt.com/cdn-cgi/trace');

  // 获取直连 IP
  fetchTrace('1.1.1.1').then(async ip => {
    ipStore['myIp'] = ip;
    document.getElementById('myIp').textContent = maskIp(ip);
    if (ip) {
      const g = await queryGeoBatch([ip]);
      const data = g[ip];
      if (data) {
        document.getElementById('myGeo').textContent = `${data.country || ''} · ${data.regionName || ''} · ${data.city || ''}`;
        document.getElementById('myAsn').textContent = `${data.asn || ''} (${data.isp || ''})`;
      }
    }
  });

  // 获取各站出口 IP
  const tracePromises = SITES.map(async s => {
    const ip = await fetchTrace(s.traceHost);
    ipStore[s.id] = ip;
    return { id: s.id, ip };
  });

  const results = await Promise.all(tracePromises);
  renderAllIps();

  // 批量获取 Geo 信息
  const ipsToQuery = results.map(r => r.ip).filter(Boolean);
  const geoData = await queryGeoBatch(ipsToQuery);

  // 渲染表格 Geo 状态
  SITES.forEach(s => {
    const ip = ipStore[s.id];
    const geo = geoData[ip];
    const geoEl = document.getElementById(`geo-${s.id}`);
    if (!geoEl) return;

    if (!ip || !geo) {
      geoEl.innerHTML = `<span class="badge badge-warn">未知 / 超时</span>`;
      return;
    }

    const cc = (geo.countryCode || '').toUpperCase();
    let statusBadge = '';
    
    // 专属 Gemini / AI 区域检测逻辑
    if (s.id === 'gemini') {
      if (GEMINI_RESTRICTED.includes(cc)) {
        statusBadge = `<span class="badge badge-danger">Gemini 受限区域 (${cc === 'HK' ? '香港节点严格封禁' : geo.country})</span>`;
      } else {
        statusBadge = `<span class="badge badge-safe">Gemini 可用 (${geo.country})</span>`;
      }
    } else if (s.isAi) {
      if (['CN', 'HK', 'MO', 'RU'].includes(cc)) {
        statusBadge = `<span class="badge badge-danger">不可用 (${geo.country})</span>`;
      } else {
        statusBadge = `<span class="badge badge-safe">支持访问</span>`;
      }
    }

    geoEl.innerHTML = `
      <div>
        <span>${geo.country || ''} · ${geo.city || ''}</span>
        ${statusBadge ? `<span style="margin-left:8px">${statusBadge}</span>` : ''}
      </div>
      <div style="font-size:0.8em;color:var(--text-muted);font-family:var(--font-mono)">${geo.asn || ''}</div>
    `;
  });

  // 填充汇总卡片
  if (geoData[ipStore['gemini']]) {
    const g = geoData[ipStore['gemini']];
    document.getElementById('sum-gemini-loc').textContent = `${g.country || ''} · ${g.city || ''}`;
  }
  if (geoData[ipStore['chatgpt']]) {
    const g = geoData[ipStore['chatgpt']];
    document.getElementById('sum-gpt-loc').textContent = `${g.country || ''} · ${g.city || ''}`;
  }
  if (geoData[ipStore['claude']]) {
    const g = geoData[ipStore['claude']];
    document.getElementById('sum-claude-loc').textContent = `${g.country || ''} · ${g.city || ''}`;
  }
}

window.addEventListener('DOMContentLoaded', init);
