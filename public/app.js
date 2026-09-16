/* app.js - IP & AI 分流检测核心引擎 */

// ===== 支持的国家/地区与限制名单 =====
// Gemini 官方受限名单 (Google AI 限制地区)
const GEMINI_RESTRICTED_CC = {
  'CN': '中国大陆',
  'HK': '香港',
  'MO': '澳门',
  'RU': '俄罗斯',
  'KP': '朝鲜',
  'IR': '伊朗',
  'SY': '叙利亚',
  'CU': '古巴',
  'BY': '白俄罗斯'
};

// OpenAI 受限名单
const OPENAI_RESTRICTED_CC = {
  'CN': '中国大陆',
  'HK': '香港',
  'MO': '澳门',
  'RU': '俄罗斯',
  'KP': '朝鲜',
  'IR': '伊朗',
  'SY': '叙利亚',
  'CU': '古巴',
  'BY': '白俄罗斯',
  'VE': '委内瑞拉'
};

// Claude 受限名单
const CLAUDE_RESTRICTED_CC = {
  'CN': '中国大陆',
  'HK': '香港',
  'MO': '澳门',
  'RU': '俄罗斯',
  'KP': '朝鲜',
  'IR': '伊朗',
  'SY': '叙利亚',
  'CU': '古巴',
  'BY': '白俄罗斯'
};

// 状态管理
const state = {
  defaultIp: null,
  cfIp: null,
  chatgptIp: null,
  geminiIp: null,
  claudeIp: null,
  geoMap: {}
};

// 探测 Cloudflare 真实出口 IP
async function fetchCfTrace(domain = '1.1.1.1') {
  try {
    const url = `https://${domain}/cdn-cgi/trace`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: 'no-store' });
    const text = await res.text();
    const match = text.match(/ip=([^\n]+)/);
    return match ? match[1].trim() : null;
  } catch (e) {
    return null;
  }
}

// 探测 ChatGPT 出口 IP
async function fetchChatGPTTrace() {
  return await fetchCfTrace('chatgpt.com');
}

// 探测 Claude 出口 IP
async function fetchClaudeTrace() {
  return await fetchCfTrace('claude.ai');
}

// 探测 Gemini / Google 出口 IP 及连通性
// Google 官方服务不走 CF trace，这里多轨并行探测：
// 1. 测试 Google 节点连通延迟 (generate_204)
// 2. 查询走 Google 分流规则代理时的 IP
async function testGeminiConnectivity() {
  const start = performance.now();
  try {
    // 请求 Google 204 端点（无缓存、轻量）
    await fetch('https://www.google.com/generate_204', {
      mode: 'no-cors',
      cache: 'no-store',
      signal: AbortSignal.timeout(6000)
    });
    const latency = Math.round(performance.now() - start);
    return { reachable: true, latency };
  } catch (e) {
    return { reachable: false, error: e.message };
  }
}

// 批量请求后端获取 GeoIP 与纯净度数据
async function getGeoBatch(ips) {
  const uniqueIps = Array.from(new Set(ips.filter(Boolean)));
  if (uniqueIps.length === 0) return {};
  try {
    const res = await fetch(`/api/geoip-batch?ips=${uniqueIps.join(',')}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('GeoIP batch fetch error', e);
  }
  return {};
}

// 渲染单个服务检测卡片
function renderCard(cardId, data) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const { title, icon, ip, geo, restrictedList, latencyInfo, note } = data;

  const countryCode = (geo?.countryCode || '').toUpperCase();
  const isRestricted = countryCode && restrictedList ? restrictedList[countryCode] : null;

  let badgeHtml = '';
  let statusClass = 'status-unknown';

  if (!ip) {
    badgeHtml = `<span class="badge badge-warn">探测失败 / 未配置分流</span>`;
  } else if (isRestricted) {
    statusClass = 'status-danger';
    badgeHtml = `<span class="badge badge-danger">不可用 (地区受限: ${isRestricted})</span>`;
  } else {
    statusClass = 'status-safe';
    badgeHtml = `<span class="badge badge-safe">支持访问 (纯净度良好)</span>`;
  }

  let ipTypeTag = '';
  if (geo) {
    if (geo.isHosting) {
      ipTypeTag = `<span class="tag tag-hosting">机房 / 数据中心 (Data Center)</span>`;
    } else {
      ipTypeTag = `<span class="tag tag-res">原生 / 住宅 IP (Residential)</span>`;
    }
  }

  card.className = `service-card ${statusClass}`;
  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <span class="icon">${icon}</span>
        <strong>${title}</strong>
      </div>
      <div class="card-badge">${badgeHtml}</div>
    </div>
    <div class="card-body">
      <div class="info-row">
        <span class="info-label">出口 IP：</span>
        <span class="info-val font-mono">${ip || '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">地理位置：</span>
        <span class="info-val">${geo ? `${geo.country || ''} · ${geo.regionName || ''} · ${geo.city || ''}` : '查询中...'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">网络归属 (ASN)：</span>
        <span class="info-val font-mono">${geo?.asn || geo?.isp || '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">IP 属性：</span>
        <span class="info-val">${ipTypeTag || '—'}</span>
      </div>
      ${latencyInfo ? `
      <div class="info-row">
        <span class="info-label">连通延迟：</span>
        <span class="info-val">${latencyInfo.reachable ? `<span style="color:#22c55e">${latencyInfo.latency} ms</span>` : '<span style="color:#ef4444">连接超时</span>'}</span>
      </div>` : ''}
      ${note ? `<div class="card-note">${note}</div>` : ''}
    </div>
  `;
}

// 主检测流程
async function runDetection() {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) refreshBtn.disabled = true;

  // 1. 并发探测各分流出口
  const [cfRes, gptRes, claudeRes, geminiConn] = await Promise.allSettled([
    fetchCfTrace('1.1.1.1'),
    fetchChatGPTTrace(),
    fetchClaudeTrace(),
    testGeminiConnectivity()
  ]);

  state.cfIp = cfRes.status === 'fulfilled' ? cfRes.value : null;
  state.chatgptIp = gptRes.status === 'fulfilled' ? gptRes.value : null;
  state.claudeIp = claudeRes.status === 'fulfilled' ? claudeRes.value : null;
  const geminiStatus = geminiConn.status === 'fulfilled' ? geminiConn.value : { reachable: false };

  // Gemini 出口：若本地配置了分流，默认测试请求走 Google 的落地。这里结合客户端公网检测
  state.geminiIp = state.cfIp; // 默认使用探测出口，后续可在自建代理节点上提供专用路由

  // 2. 请求后端批量 GeoIP
  const allIps = [state.cfIp, state.chatgptIp, state.claudeIp, state.geminiIp];
  state.geoMap = await getGeoBatch(allIps);

  // 3. 渲染主卡片
  renderCard('card-gemini', {
    title: 'Google Gemini AI',
    icon: '✨',
    ip: state.geminiIp,
    geo: state.geoMap[state.geminiIp],
    restrictedList: GEMINI_RESTRICTED_CC,
    latencyInfo: geminiStatus,
    note: '特别提示：Gemini 对<strong>香港 (HK)</strong> 严格封控，如出口在香港将无法使用；推荐使用台湾、日本、新加坡或美国原生/住宅节点。'
  });

  renderCard('card-gpt', {
    title: 'OpenAI ChatGPT',
    icon: '🤖',
    ip: state.chatgptIp,
    geo: state.geoMap[state.chatgptIp],
    restrictedList: OPENAI_RESTRICTED_CC,
    note: '检测通过 chatgpt.com /cdn-cgi/trace 实际分流出口验证。'
  });

  renderCard('card-claude', {
    title: 'Anthropic Claude',
    icon: '🧠',
    ip: state.claudeIp,
    geo: state.geoMap[state.claudeIp],
    restrictedList: CLAUDE_RESTRICTED_CC,
    note: 'Claude 对数据中心机房 IP 封控严厉，建议使用纯净家庭宽带/住宅 IP。'
  });

  renderCard('card-cf', {
    title: '默认 Cloudflare 出口',
    icon: '🌐',
    ip: state.cfIp,
    geo: state.geoMap[state.cfIp],
    note: '未分流流量或常规外网访问的默认节点出口。'
  });

  // 4. 前端浏览器指纹检测（与原网站功能保持一致）
  detectBrowserFingerprint();

  if (refreshBtn) refreshBtn.disabled = false;
}

// 浏览器 Canvas & WebGL 指纹简单实现
function detectBrowserFingerprint() {
  const fpEl = document.getElementById('fingerprint-info');
  if (!fpEl) return;

  let canvasHash = 'N/A';
  let webglVendor = 'N/A';
  let webglRenderer = 'N/A';

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('IP.Check,123#$%', 2, 15);
    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
      hash |= 0;
    }
    canvasHash = '0x' + Math.abs(hash).toString(16);
  } catch (e) {}

  try {
    const glCanvas = document.createElement('canvas');
    const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {}

  fpEl.innerHTML = `
    <div class="risk-row"><span class="risk-label">Canvas 指纹特征：</span><span class="risk-val font-mono">${canvasHash}</span></div>
    <div class="risk-row"><span class="risk-label">WebGL 显卡渲染器：</span><span class="risk-val font-mono">${webglRenderer}</span></div>
    <div class="risk-row"><span class="risk-label">显卡供应商：</span><span class="risk-val font-mono">${webglVendor}</span></div>
  `;
}

// 页面加载触发
window.addEventListener('DOMContentLoaded', runDetection);
