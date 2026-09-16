const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// 简易内存缓存，避免频繁请求上游 GeoIP 接口
const geoCache = new Map();

function fetchUpstreamGeo(ip) {
  return new Promise((resolve) => {
    // 使用 free ip-api.com
    const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,hosting,proxy`;
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'success') {
            resolve({
              ip: json.query,
              country: json.country,
              countryCode: json.countryCode,
              regionName: json.regionName,
              city: json.city,
              isp: json.isp,
              org: json.org,
              asn: json.as,
              isHosting: json.hosting || false,
              isProxy: json.proxy || false
            });
          } else {
            resolve({ ip, error: json.message || 'Lookup failed' });
          }
        } catch (e) {
          resolve({ ip, error: 'Parse error' });
        }
      });
    }).on('error', (err) => {
      resolve({ ip, error: err.message });
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS 响应头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. 获取直连客户端 IP / cdn trace 兼容
  if (pathname === '/api/myip') {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket.remoteAddress || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ip: clientIp }));
    return;
  }

  // 2. GeoIP 单个查询 /api/geoip/:ip
  if (pathname.startsWith('/api/geoip/')) {
    const ip = pathname.replace('/api/geoip/', '').trim();
    if (!ip) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'IP is required' }));
      return;
    }

    if (geoCache.has(ip)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(geoCache.get(ip)));
      return;
    }

    const geo = await fetchUpstreamGeo(ip);
    geoCache.set(ip, geo);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(geo));
    return;
  }

  // 3. GeoIP 批量查询 /api/geoip-batch?ips=x,y,z
  if (pathname === '/api/geoip-batch') {
    const ipsParam = parsedUrl.searchParams.get('ips') || '';
    const ips = ipsParam.split(',').map(s => s.trim()).filter(Boolean);
    const result = {};

    await Promise.all(ips.map(async (ip) => {
      if (geoCache.has(ip)) {
        result[ip] = geoCache.get(ip);
      } else {
        const geo = await fetchUpstreamGeo(ip);
        geoCache.set(ip, geo);
        result[ip] = geo;
      }
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // 4. 静态资源服务
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // 默认尝试提供文件或 index.html
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png'
    };

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`[IP Checker] Server listening on http://localhost:${PORT}`);
});
