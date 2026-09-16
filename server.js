const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// 内存缓存
const geoCache = new Map();
const riskCache = new Map();

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 适配 ip.net.coffee 契约的 GeoIP 响应
async function getGeoIP(ip) {
  if (geoCache.has(ip)) return geoCache.get(ip);
  try {
    const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,hosting,proxy`;
    const json = await fetchJson(url);
    if (json.status === 'success') {
      const res = {
        country: json.country || '',
        region: json.regionName || '',
        city: json.city || '',
        isp: json.isp || '',
        country_code: (json.countryCode || '').toLowerCase()
      };
      geoCache.set(ip, res);
      return res;
    }
  } catch (e) {}
  return { country: '', region: '', city: '', isp: '', country_code: '' };
}

// 适配 ip.net.coffee 契约的 iprisk 响应
async function getIpRisk(ip) {
  if (riskCache.has(ip)) return riskCache.get(ip);
  try {
    const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,isp,org,as,query,hosting,proxy`;
    const json = await fetchJson(url);
    if (json.status === 'success') {
      const isHosting = !!json.hosting;
      const isProxy = !!json.proxy;
      const res = {
        ip: json.query,
        cidr: ip.replace(/\.\d+$/, '.0/24'),
        is_bogon: false,
        is_datacenter: isHosting,
        isResidential: !isHosting && !isProxy,
        is_vpn: false,
        is_proxy: isProxy,
        is_tor: false,
        is_crawler: false,
        is_abuser: false,
        is_mobile: false,
        company_type: isHosting ? 'hosting' : 'isp',
        company_name: json.org || json.isp || '',
        abuser_score: isHosting ? '0.0150 (Elevated)' : '0.0000 (Low)',
        datacenter_name: isHosting ? json.isp : '',
        asn: parseInt((json.as || '').replace(/^AS/, '')) || 0,
        asOrganization: json.isp || '',
        country: json.country || '',
        countryCode: (json.countryCode || '').toLowerCase(),
        region: json.regionName || '',
        city: json.city || '',
        trust_score: isHosting ? 55 : 92,
        ai_verdict: {
          label: isHosting ? 'Suspicious' : 'Clean',
          confidence: 85,
          reasoning: isHosting ? 'Datacenter / Hosting IP' : 'Residential ISP IP'
        },
        rep_threat: isHosting ? 20 : 0
      };
      riskCache.set(ip, res);
      return res;
    }
  } catch (e) {}
  return { ip, trust_score: 50 };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 1: /api/myip
  if (pathname === '/api/myip') {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket.remoteAddress || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ip: clientIp }));
    return;
  }

  // API 2: /api/geoip/:ip
  if (pathname.startsWith('/api/geoip/')) {
    const ip = pathname.replace('/api/geoip/', '').trim();
    const data = await getGeoIP(ip);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // API 3: /api/iprisk/:ip
  if (pathname.startsWith('/api/iprisk/')) {
    const ip = pathname.replace('/api/iprisk/', '').trim();
    const data = await getIpRisk(ip);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // 静态文件与页面路由
  let relPath = pathname;
  if (relPath === '/' || relPath === '') {
    relPath = '/index.html';
  }

  let filePath = path.join(PUBLIC_DIR, relPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon'
  };

  res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`[Net.Coffee Server] Running on http://localhost:${PORT}`);
});
