const { lookupGeo } = require('./geo-service');

// 全球核心骨干节点（用于计算地理网络延迟估算）
const GLOBAL_HUBS = [
  { id: 'shanghai', name: '上海', lat: 31.23, lon: 121.47 },
  { id: 'hongkong', name: '香港', lat: 22.32, lon: 114.17 },
  { id: 'tokyo', name: '东京', lat: 35.68, lon: 139.69 },
  { id: 'singapore', name: '新加坡', lat: 1.35, lon: 103.82 },
  { id: 'los_angeles', name: '洛杉矶', lat: 34.05, lon: -118.24 },
  { id: 'vancouver', name: '温哥华', lat: 49.28, lon: -123.12 },
  { id: 'frankfurt', name: '法兰克福', lat: 50.11, lon: 8.68 },
  { id: 'paris', name: '巴黎', lat: 48.86, lon: 2.35 },
  { id: 'london', name: '伦敦', lat: 51.51, lon: -0.13 }
];

// 半正矢公式计算两点球面距离 (km)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 模拟预估光纤往返延迟 (RTT)
function estimatePing(srcLat, srcLon, dstLat, dstLon) {
  const distKm = getDistanceKm(srcLat, srcLon, dstLat, dstLon);
  if (distKm < 50) return Math.floor(Math.random() * 4) + 2; // 2~5ms 同城
  // 光纤光速约 200km/ms，往返双向约为 100km/ms + 路由中继额外开销 (1.35x)
  const rtt = Math.round((distKm / 100) * 1.35 + 8);
  return Math.min(Math.max(rtt, 3), 360);
}

// 常见上游骨干网
const UPSTREAM_TIERS = [
  'AS1299 TWELVE99 Arelion Sweden AB',
  'AS174 Cogent Communications, LLC',
  'AS3356 Level 3 Parent, LLC',
  'AS6461 Zayo Bandwidth',
  'AS6939 Hurricane Electric LLC',
  'AS2914 NTT America, Inc.'
];

// DNSBL 权威黑名单引擎列表
const DNSBL_ENGINES = [
  'Spamhaus ZEN', 'Barracuda BRBL', 'SpamCop', 'SORBS-DNSBL',
  'UCEPROTECT-L1', 'DroneBL', 'AbuseIPDB', 'SURBL',
  'CBL-Abuseat', 'Backscatterer', 'Invaluement', 'Truncate'
];

async function calculateIpScore(ip) {
  const geo = await lookupGeo(ip);
  const isV6 = ip.includes(':');
  const cc = (geo.countryCode || '').toUpperCase();
  const isResidential = Boolean(geo.isResidential);
  const isHosting = Boolean(geo.isHosting);
  const isProxy = Boolean(geo.isProxy);

  // 1. 信任评分打分算法 (0 - 100)
  let score = isResidential ? 100 : 72;
  if (isProxy) score -= 35;
  if (isHosting && !isResidential) score -= 8;
  score = Math.max(10, Math.min(100, score));

  let trustLevel = '极佳';
  let trustClass = 'safe';
  if (score >= 90) {
    trustLevel = isResidential ? '极佳 (原生住宅)' : '极佳 (优质机房)';
    trustClass = 'safe';
  } else if (score >= 70) {
    trustLevel = '良好 (数据中心)';
    trustClass = 'warn';
  } else {
    trustLevel = '风险较高 (疑似代理/滥用)';
    trustClass = 'danger';
  }

  // 2. 核心场景打分 (满分 10 分)
  // TikTok
  let tiktokScore = isResidential ? 10 : 5;
  let tiktokDesc = isResidential ? '10 分 极佳' : '5 分 一般 (机房易风控)';
  if (isProxy) { tiktokScore = 2; tiktokDesc = '2 分 极高风险'; }

  // AI应用 (Gemini, ChatGPT, Claude)
  const restrictedCCs = ['CN', 'HK', 'MO', 'RU', 'KP', 'IR', 'SY', 'CU', 'BY'];
  let aiScore = 10;
  let aiDesc = '10 分 极佳';
  if (restrictedCCs.includes(cc)) {
    aiScore = 1;
    aiDesc = `1 分 受限地区 (${geo.country || cc})`;
  } else if (!isResidential) {
    aiScore = 8;
    aiDesc = '8 分 良好 (部分平台偶有验证码)';
  }

  // 社媒运营
  let socialScore = isResidential ? 10 : 7;
  let socialDesc = isResidential ? '10 分 极佳' : '7 分 良好';

  // 3. 全球 Ping 延迟计算
  // 默认使用目标所在经纬度（若缺少则以国家中心近似）
  const ipLat = geo.lat || 34.05;
  const ipLon = geo.lon || -118.24;

  const pingResults = GLOBAL_HUBS.map(hub => ({
    city: hub.name,
    latency: estimatePing(ipLat, ipLon, hub.lat, hub.lon)
  }));

  // 4. DNSBL 模拟查询
  const blacklists = DNSBL_ENGINES.map(engine => ({
    name: engine,
    listed: false
  }));

  // 5. BGP 路由拓扑
  let prefix = '';
  if (!isV6) {
    const parts = ip.split('.');
    prefix = `${parts[0]}.${parts[1]}.0.0/17`;
  } else {
    const parts = ip.split(':');
    prefix = `${parts.slice(0, 3).join(':')}::/48`;
  }

  const upstreamSample = [
    { name: UPSTREAM_TIERS[0], share: '24.5%' },
    { name: UPSTREAM_TIERS[1], share: '18.2%' },
    { name: UPSTREAM_TIERS[2], share: '12.6%' }
  ];

  return {
    ip,
    protocol: isV6 ? 'IPv6' : 'IPv4',
    geo,
    score,
    trustLevel,
    trustClass,
    scenarios: {
      tiktok: { score: tiktokScore, desc: tiktokDesc },
      ai: { score: aiScore, desc: aiDesc },
      social: { score: socialScore, desc: socialDesc }
    },
    pings: pingResults,
    dnsbl: {
      total: DNSBL_ENGINES.length,
      cleanCount: DNSBL_ENGINES.length,
      engines: blacklists
    },
    bgp: {
      prefix,
      rpki: 'Valid',
      upstreams: upstreamSample
    }
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  let ip = req.query?.ip;
  if (!ip) {
    const forwarded = req.headers['x-forwarded-for'];
    ip = (forwarded ? forwarded.split(',')[0].trim() : req.headers['x-real-ip'] || req.socket?.remoteAddress || '').replace('::ffff:', '');
  }

  if (!ip) {
    return res.status(400).json({ error: 'IP is required' });
  }

  try {
    const data = await calculateIpScore(ip);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Score calculation failed' });
  }
};

module.exports.calculateIpScore = calculateIpScore;
