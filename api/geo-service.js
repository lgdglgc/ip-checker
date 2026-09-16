const http = require('http');
const https = require('https');

// 内存缓存：最多保留 2000 条解析记录
const geoCache = new Map();
const MAX_CACHE_SIZE = 2000;

function setCache(key, value) {
  if (geoCache.size >= MAX_CACHE_SIZE) {
    const firstKey = geoCache.keys().next().value;
    geoCache.delete(firstKey);
  }
  geoCache.set(key, value);
}

// 统一带超时的 HTTP/HTTPS GET
function requestJson(urlStr, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;
      const req = client.get(urlStr, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        timeout: timeoutMs
      }, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('JSON parse error'));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      });

      req.on('error', (err) => {
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
}

// 规范化 IP（IPv4 使用 /24 网段聚合减少查询压力）
function normalizeIp(ip) {
  if (!ip) return '';
  const trimmed = ip.trim();
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) {
    return trimmed.replace(/\.\d+$/, '.1');
  }
  return trimmed.toLowerCase();
}

// Primary 数据源：ip-api.com
async function queryIpApi(ip) {
  const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,hosting,proxy`;
  const json = await requestJson(url, 2500);
  if (json.status !== 'success') {
    throw new Error(json.message || 'Lookup failed');
  }
  const isHosting = Boolean(json.hosting);
  return {
    ip: json.query || ip,
    country: json.country || '',
    countryCode: (json.countryCode || '').toLowerCase(),
    regionName: json.regionName || '',
    city: json.city || '',
    isp: json.isp || '',
    org: json.org || '',
    asn: json.as || '',
    isHosting: isHosting,
    isProxy: Boolean(json.proxy),
    isResidential: !isHosting,
    source: 'ip-api.com'
  };
}

// Fallback 1 数据源：ipwho.is
async function queryIpWhoIs(ip) {
  const url = `https://ipwho.is/${ip}`;
  const json = await requestJson(url, 2500);
  if (!json.success) {
    throw new Error(json.message || 'ipwho.is failed');
  }
  const isHosting = Boolean(json.security?.is_hosting);
  return {
    ip: json.ip || ip,
    country: json.country || '',
    countryCode: (json.country_code || '').toLowerCase(),
    regionName: json.region || '',
    city: json.city || '',
    isp: json.connection?.isp || json.connection?.org || '',
    org: json.connection?.org || '',
    asn: json.connection?.asn ? `AS${json.connection.asn} ${json.connection.org || ''}`.trim() : '',
    isHosting: isHosting,
    isProxy: Boolean(json.security?.is_proxy || json.security?.is_vpn),
    isResidential: !isHosting,
    source: 'ipwho.is'
  };
}

// Fallback 2 数据源：api.ip.sb
async function queryIpSb(ip) {
  const url = `https://api.ip.sb/geoip/${ip}`;
  const json = await requestJson(url, 2500);
  if (!json.country_code) {
    throw new Error('ip.sb failed');
  }
  const isHosting = (json.organization || '').toLowerCase().includes('cloud') ||
                    (json.isp || '').toLowerCase().includes('hosting');
  return {
    ip: json.ip || ip,
    country: json.country || '',
    countryCode: (json.country_code || '').toLowerCase(),
    regionName: json.region || '',
    city: json.city || '',
    isp: json.isp || json.organization || '',
    org: json.organization || '',
    asn: json.asn ? `AS${json.asn} ${json.organization || ''}`.trim() : '',
    isHosting: isHosting,
    isProxy: false,
    isResidential: !isHosting,
    source: 'ip.sb'
  };
}

// 多源融合查询（带缓存与依次降级）
async function lookupGeo(ip) {
  if (!ip) return { ip, error: 'Empty IP' };
  const cleanIp = ip.trim();
  const cacheKey = normalizeIp(cleanIp);

  if (geoCache.has(cacheKey)) {
    const cached = geoCache.get(cacheKey);
    return { ...cached, ip: cleanIp };
  }

  const providers = [
    { name: 'ip-api', fn: queryIpApi },
    { name: 'ipwhois', fn: queryIpWhoIs },
    { name: 'ipsb', fn: queryIpSb }
  ];

  let lastError = null;
  for (const p of providers) {
    try {
      const result = await p.fn(cleanIp);
      setCache(cacheKey, result);
      return result;
    } catch (err) {
      lastError = err;
    }
  }

  return {
    ip: cleanIp,
    error: lastError ? lastError.message : 'All GeoIP providers failed'
  };
}

module.exports = {
  lookupGeo,
  normalizeIp
};
