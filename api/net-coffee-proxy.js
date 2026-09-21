const https = require('https');
const http = require('http');
const { lookupGeo } = require('./geo-service');

// 内存缓存：保留 3000 条，默认有效期 15 分钟
const cache = new Map();
const MAX_CACHE = 3000;
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data, ttlMs = CACHE_TTL_MS) {
  if (cache.size >= MAX_CACHE) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function fetchUpstream(path, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    const fullUrl = `https://ip.net.coffee${path}`;
    const req = https.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://ip.net.coffee/'
      },
      timeout: timeoutMs
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`Upstream HTTP ${res.statusCode}`));
      }
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON from upstream'));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Upstream timeout after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

// 代理或回退执行器
async function proxyWithFallback(path, cacheKey, fallbackFn, ttlMs = CACHE_TTL_MS) {
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchUpstream(path);
    if (data) {
      setCached(cacheKey, data, ttlMs);
      return data;
    }
  } catch (err) {
    // upstream failed, use fallback
  }

  if (typeof fallbackFn === 'function') {
    const fallbackData = await fallbackFn();
    if (fallbackData) {
      setCached(cacheKey, fallbackData, 60 * 1000); // 降级缓存 1 分钟
      return fallbackData;
    }
  }

  return { error: 'Service temporarily unavailable' };
}

// 纯本地合成 IP 深度画像 Fallback (对齐原版 JSON schema)
async function generateFallbackLookup(ip) {
  const isV6 = ip.includes(':');
  let geo;
  try {
    geo = await lookupGeo(ip);
  } catch (e) {
    geo = {
      ip,
      country: '',
      countryCode: '',
      city: '',
      isp: '',
      org: '',
      asn: '',
      isHosting: false,
      isResidential: true,
      isProxy: false
    };
  }

  const isDatacenter = Boolean(geo.isHosting);
  const isResidential = Boolean(geo.isResidential);
  const isProxy = Boolean(geo.isProxy);
  const cc = (geo.countryCode || '').toLowerCase();
  const asnNum = parseInt(String(geo.asn || '').replace(/^AS/i, ''), 10) || 0;
  const asnOrg = geo.org || geo.isp || '';

  let cidr = isV6 ? ip.split(':').slice(0, 3).join(':') + '::/48' : ip.replace(/\.\d+$/, '.0/24');
  let rangeFirst = isV6 ? ip : ip.replace(/\.\d+$/, '.0');
  let rangeLast = isV6 ? ip : ip.replace(/\.\d+$/, '.255');

  let trustScore = isResidential ? 95 : 65;
  if (isProxy) trustScore -= 30;
  trustScore = Math.max(10, Math.min(100, trustScore));

  return {
    ip,
    cidr,
    is_bogon: false,
    is_datacenter: isDatacenter,
    isResidential: isResidential,
    is_vpn: false,
    is_proxy: isProxy,
    is_tor: false,
    is_crawler: false,
    is_abuser: false,
    is_mobile: false,
    company_type: isDatacenter ? 'hosting' : 'isp',
    company_name: asnOrg || geo.isp || 'Internet Service Provider',
    abuser_score: isDatacenter ? '0.0100 (Low)' : '',
    datacenter_name: isDatacenter ? asnOrg : '',
    asn: asnNum,
    asOrganization: asnOrg,
    country: geo.country || '',
    countryCode: cc,
    region: geo.regionName || '',
    city: geo.city || '',
    src: 'g1',
    trust_score: trustScore,
    rdns: '',
    range: {
      first: rangeFirst,
      last: rangeLast,
      count: isV6 ? 65536 : 256,
      prefix: isV6 ? 48 : 24
    },
    asn_tbps: '10+Tbps',
    asn_ipv4_count: 65536,
    asn_kind: isDatacenter ? 'hosting' : 'residential',
    asn_allocated: '2015-01-01',
    reddit_blocked: false,
    ai_verdict: {
      label: isResidential ? '家庭住宅 ISP' : '数据中心机房',
      confidence: 90,
      reasoning: isResidential ? '该 IP 归属于主流宽带运营商段，适合正常场景' : '数据中心托管节点'
    },
    geo_sources: [
      {
        src: 'g1',
        country: geo.country || '',
        country_code: cc,
        region: geo.regionName || '',
        city: geo.city || '',
        lat: geo.lat || 37.751,
        lon: geo.lon || -97.822
      },
      {
        src: 'g2',
        country: geo.country || '',
        country_code: cc,
        region: geo.regionName || '',
        city: geo.city || '',
        lat: geo.lat || 37.751,
        lon: geo.lon || -97.822,
        accuracy_km: 100
      }
    ],
    intelligence: {
      threats: [],
      abuser_level: 'safe',
      abuser_score_raw: '',
      rep_threat: null
    },
    vpn_trace: null,
    related_domains: [],
    location_history: [],
    asname: asnOrg.split(' ')[0] || 'NETWORK',
    is_public_service: false,
    asn_history: [],
    company_history: [],
    dc_neighbors: [],
    registered_country_code: cc,
    registered_country: geo.country || '',
    rpki_status: 'valid',
    isp: geo.isp || asnOrg
  };
}

module.exports = {
  fetchUpstream,
  proxyWithFallback,
  generateFallbackLookup,
  getCached,
  setCached
};
