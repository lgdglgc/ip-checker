
const NODES = [
  // Asia
  { id: 'n01', name: '中国上海', cc: 'cn', city: 'Shanghai', continent: '亚洲', cIcon: '🌏' },
  { id: 'n02', name: '中国香港', cc: 'hk', city: 'Hong Kong', continent: '亚洲', cIcon: '🌏' },
  { id: 'n03', name: '日本东京', cc: 'jp', city: 'Tokyo', continent: '亚洲', cIcon: '🌏' },
  { id: 'n04', name: '新加坡', cc: 'sg', city: 'Singapore', continent: '亚洲', cIcon: '🌏' },
  { id: 'n05', name: '越南胡志明', cc: 'vn', city: 'Ho Chi Minh City', continent: '亚洲', cIcon: '🌏' },
  { id: 'n06', name: '印尼雅加达', cc: 'id', city: 'Jakarta', continent: '亚洲', cIcon: '🌏' },
  { id: 'n07', name: '印度孟买', cc: 'in', city: 'Mumbai', continent: '亚洲', cIcon: '🌏' },
  { id: 'n08', name: '以色列特拉维夫', cc: 'il', city: 'Tel Aviv', continent: '亚洲', cIcon: '🌏' },
  // Americas
  { id: 'n09', name: '美国洛杉矶', cc: 'us', city: 'Los Angeles', continent: '美洲', cIcon: '🌎' },
  { id: 'n10', name: '美国亚特兰大', cc: 'us', city: 'Atlanta', continent: '美洲', cIcon: '🌎' },
  { id: 'n11', name: '加拿大温哥华', cc: 'ca', city: 'Vancouver', continent: '美洲', cIcon: '🌎' },
  { id: 'n12', name: '巴西圣保罗', cc: 'br', city: 'Sao Paulo', continent: '美洲', cIcon: '🌎' },
  // Europe
  { id: 'n13', name: '德国法兰克福', cc: 'de', city: 'Frankfurt', continent: '欧洲', cIcon: '🌍' },
  { id: 'n14', name: '荷兰阿姆斯特丹', cc: 'nl', city: 'Amsterdam', continent: '欧洲', cIcon: '🌍' },
  { id: 'n15', name: '法国巴黎', cc: 'fr', city: 'Paris', continent: '欧洲', cIcon: '🌍' },
  { id: 'n16', name: '瑞典斯德哥尔摩', cc: 'se', city: 'Stockholm', continent: '欧洲', cIcon: '🌍' },
  { id: 'n17', name: '瑞士苏黎世', cc: 'ch', city: 'Zurich', continent: '欧洲', cIcon: '🌍' },
  { id: 'n18', name: '西班牙马德里', cc: 'es', city: 'Madrid', continent: '欧洲', cIcon: '🌍' },
  { id: 'n19', name: '俄罗斯莫斯科', cc: 'ru', city: 'Moscow', continent: '欧洲', cIcon: '🌍' },
  { id: 'n20', name: '土耳其伊斯坦布尔', cc: 'tr', city: 'Istanbul', continent: '欧洲', cIcon: '🌍' },
];

function pingHostLabel() {
  const pf = window.__PING_PREFILL;
  const h = (pf && pf.ip) || ((document.getElementById('hostInput') || {}).value || '').trim();
  return String(h).replace(/[<>"'&]/g, '');
}
function flagImg(cc, name) {
  const src = cc === 'cn' ? '/favicons/cn.png' : cc === 'tw' ? '/favicons/flags/tw.png' : `/favicons/flags/${cc}.png`;
  const host = name ? pingHostLabel() : '';
  const seo = host ? `从${name}到${host}的Ping延迟数据` : '';
  const altTxt = seo || (cc === 'tw' ? '中国台湾省' : cc);
  const ttl = seo ? ` title="${seo}"` : '';
  return `<img src="${src}" width="40" height="27" alt="${altTxt}"${ttl} onerror="this.onerror=null;this.style.display='none'">`;
}
function refreshFlagTitles(host) {
  const h = String(host || '').replace(/[<>"'&]/g, '');
  if (!h) return;
  NODES.forEach((n, i) => {
    const img = document.querySelector('#row-' + i + ' img');
    if (img) { img.alt = img.title = '从' + n.name + '到' + h + '的Ping延迟数据'; }
  });
}

function pingClass(ms) {
  if (ms < 100) return 'ping-ok';
  if (ms < 200) return 'ping-med';
  if (ms < 350) return 'ping-slow';
  return 'ping-bad';
}


function renderTable() {
  const tbody = document.getElementById('resultsBody');
  let lastContinent = '';
  tbody.innerHTML = NODES.map((n, i) => {
    let sep = '';
    if (n.continent !== lastContinent) {
      lastContinent = n.continent;
      sep = `<tr class="continent-row"><td colspan="4">${n.cIcon} ${n.continent}</td></tr>`;
    }
    return `${sep}<tr id="row-${i}">
      <td><div class="node-cell">${flagImg(n.cc, n.name)} ${n.name}<span class="node-city" style="color: var(--text-muted);font-size:0.82em;margin-left:4px">${n.city}</span></div></td>
      <td class="ping-val ping-wait" id="min-${i}">--</td>
      <td class="ping-val ping-wait" id="avg-${i}">--</td>
      <td class="ping-val ping-wait" id="max-${i}">--</td>
    </tr>`;
  }).join('');
}

function showLoading() {
  NODES.forEach((_, i) => {
    document.getElementById(`min-${i}`).className = 'ping-val ping-wait';
    document.getElementById(`min-${i}`).innerHTML = '<div class="loading-bar" style="width:36px"></div>';
    document.getElementById(`avg-${i}`).innerHTML = '<div class="loading-bar" style="width:36px"></div>';
    document.getElementById(`max-${i}`).innerHTML = '<div class="loading-bar" style="width:36px"></div>';
  });
}

function updateRow(index, data) {
  // data is array of [["OK", latency_sec, ip?], ...] or null
  if (!data || !data[0]) {
    document.getElementById(`min-${index}`).innerHTML = '<span class="ping-err">超时</span>';
    document.getElementById(`avg-${index}`).textContent = '--';
    document.getElementById(`max-${index}`).textContent = '--';
    return;
  }

  const pings = data[0];
  const times = pings.filter(p => p[0] === 'OK').map(p => Math.round(p[1] * 1000));

  if (times.length === 0) {
    document.getElementById(`min-${index}`).innerHTML = '<span class="ping-err">不可达</span>';
    document.getElementById(`avg-${index}`).textContent = '--';
    document.getElementById(`max-${index}`).textContent = '--';
    return;
  }

  const min = Math.min(...times);
  const max = Math.max(...times);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);

  const cls = pingClass(avg);
  document.getElementById(`min-${index}`).className = `ping-val ${cls}`;
  document.getElementById(`min-${index}`).textContent = min + ' ms';
  document.getElementById(`avg-${index}`).className = `ping-val ping-avg ${cls}`;
  document.getElementById(`avg-${index}`).textContent = avg + ' ms';
  document.getElementById(`max-${index}`).className = `ping-val ${cls}`;
  document.getElementById(`max-${index}`).textContent = max + ' ms';
}

let polling = false;

async function startPing() {
  const host = document.getElementById('hostInput').value.trim();
  if (!host) return;
  if (polling) return;
  refreshFlagTitles(host);

  const btn = document.getElementById('pingBtn');
  btn.disabled = true;
  btn.textContent = '检测中...';
  polling = true;
  showLoading();

  try {
    // Build node filter
    const nodeParam = NODES.map(n => `node=${n.id}`).join('&');
    // Get user IP for rate limiting
    let userIp = 'unknown';
    try {
      const tr = await fetch('https://1.1.1.1/cdn-cgi/trace', { signal: AbortSignal.timeout(3000) });
      const txt = await tr.text();
      const m = txt.match(/ip=([^\n]+)/);
      if (m) userIp = m[1].trim();
    } catch {}

    // 点击 Ping = 强制重测(force=1 跳过服务端缓存;每人每目标 24h 10 次的限流仍生效)
    const url = `/api/ping/start?host=${encodeURIComponent(host)}&user_ip=${encodeURIComponent(userIp)}&${nodeParam}&force=1`;
    const _note = document.getElementById('ping-cache-note'); if (_note) _note.style.display = 'none';
    try { if (/^[0-9a-fA-F.:]+$/.test(host) && location.pathname !== '/ping/' + host) history.replaceState(null, '', '/ping/' + host); } catch (e) {}
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const data = await resp.json();

    // Rate limited?
    if (data.error) {
      NODES.forEach((_, i) => {
        document.getElementById(`status-${i}`).innerHTML = `<span class="ping-err">${data.error}</span>`;
        document.getElementById(`min-${i}`).textContent = '--';
        document.getElementById(`avg-${i}`).textContent = '--';
        document.getElementById(`max-${i}`).textContent = '--';
      });
      return;
    }

    // Cached result from server?
    if (data.cached) {
      const results = data.results;
      NODES.forEach((n, i) => { if (results[n.id]) updateRow(i, results[n.id]); });
      return;
    }

    const requestId = data.request_id;
    if (!requestId) throw new Error('No request ID');

    // Poll for results (max 15 seconds)
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      attempts++;
      await new Promise(r => setTimeout(r, 1500));

      const rResp = await fetch(`/api/ping/result/${requestId}`, { signal: AbortSignal.timeout(10000) });
      const results = await rResp.json();

      let allDone = true;
      NODES.forEach((n, i) => {
        const nodeData = results[n.id];
        if (nodeData) {
          updateRow(i, nodeData);
        } else {
          allDone = false;
        }
      });

      if (!allDone && attempts < maxAttempts) {
        await poll();
      }
    };

    await poll();

  } catch (e) {
    NODES.forEach((_, i) => {
      const st = document.getElementById(`status-${i}`);
      if (st.querySelector('.loading-bar')) {
        st.innerHTML = '<span class="ping-err">请求失败</span>';
      }
    });
  } finally {
    polling = false;
    btn.disabled = false;
    btn.textContent = 'Ping';
    // 本次实测结束:把提示语改成"刚刚"并重新显示(CF 会缓存页面 60s,刷新可能仍是旧快照,这里保证当前会话所见即所得)
    const note = document.getElementById('ping-cache-note');
    const txt = document.getElementById('ping-note-text');
    if (note && txt && document.querySelector('#resultsBody .ping-val.ping-ok, #resultsBody .ping-val.ping-med, #resultsBody .ping-val.ping-slow, #resultsBody .ping-val.ping-bad')) {
      const d = new Date(Date.now() + (8 * 60 + new Date().getTimezoneOffset()) * 60000);
      const p = n => String(n).padStart(2, '0');
      txt.textContent = '以上为 ' + host + ' 刚刚的检测结果（'
        + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' '
        + p(d.getHours()) + ':' + p(d.getMinutes()) + '，东八区时间），';
      note.style.display = '';
    }
  }
}

// Auto-fill Cloudflare IP on load
function pingAgain() {
  // 瞬时置顶:平滑滚动会被随后的表格重绘打断(实测停在半路),这里要的是确定性
  try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) {}
  window.scrollTo(0, 0);
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  startPing();
}

async function init() {
  renderTable();
  const again = document.getElementById('ping-again');
  if (again) {
    again.addEventListener('click', pingAgain);
    again.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pingAgain(); }
    });
  }
  // /ping/{ip} 静态页(2026-09-10):服务端已直出缓存结果,这里用同一份数据重绘;不自动填 CF IP、不自动测
  const pf = window.__PING_PREFILL;
  if (pf && pf.ip) {
    document.getElementById('hostInput').value = pf.ip;
    if (pf.results) NODES.forEach((n, i) => { if (pf.results[n.id]) updateRow(i, pf.results[n.id]); });
    return;
  }
  try {
    const r = await fetch('https://1.1.1.1/cdn-cgi/trace', { signal: AbortSignal.timeout(5000) });
    const txt = await r.text();
    const m = txt.match(/ip=([^\n]+)/);
    if (m) {
      document.getElementById('hostInput').value = m[1].trim();
    }
  } catch {}
}

init();

// Enter key triggers ping
document.getElementById('hostInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') startPing();
});

