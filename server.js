const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// 导入 API 模块
const traceHandler = require('./api/trace');
const ipLookupHandler = require('./api/ip-lookup');
const ipHeatHandler = require('./api/ip-v2-heat');
const ipBgpHandler = require('./api/ip-v2-bgp');
const ipDnsblHandler = require('./api/ip-v2-dnsbl');
const ipAsncosHandler = require('./api/ip-v2-asncos');
const ipRelatedHandler = require('./api/ip-related');
const ipPingcheckHandler = require('./api/ip-pingcheck');
const ipPortscanHandler = require('./api/ip-portscan');
const pingGlobalHandler = require('./api/ping-global');
const geoipHandler = require('./api/geoip');
const geoipBatchHandler = require('./api/geoip-batch');
const ipscoreHandler = require('./api/ipscore');
const myipHandler = require('./api/myip');

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 扩展标准 Express/Vercel 辅助方法
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  if (!res.status) {
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
  }
  if (!res.json) {
    res.json = function(data) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
      this.end(JSON.stringify(data));
      return this;
    };
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Cloudflare trace 模拟
  if (pathname === '/cdn-cgi/trace') {
    return traceHandler(req, res);
  }

  // 2. /api/myip
  if (pathname === '/api/myip') {
    return myipHandler(req, res);
  }

  // 3. /api/geoip/:ip
  if (pathname.startsWith('/api/geoip/')) {
    req.query.ip = pathname.replace('/api/geoip/', '').trim();
    return geoipHandler(req, res);
  }
  if (pathname === '/api/geoip') {
    return geoipHandler(req, res);
  }

  // 4. /api/geoip-batch
  if (pathname === '/api/geoip-batch') {
    return geoipBatchHandler(req, res);
  }

  // 5. /api/ipscore/:ip
  if (pathname.startsWith('/api/ipscore/')) {
    req.query.ip = pathname.replace('/api/ipscore/', '').trim();
    return ipscoreHandler(req, res);
  }
  if (pathname === '/api/ipscore') {
    return ipscoreHandler(req, res);
  }

  // 6. /api/ip/lookup/:ip & /api/ipv2/lookup/:ip
  if (pathname.startsWith('/api/ip/lookup/')) {
    req.query.ip = pathname.replace('/api/ip/lookup/', '').trim();
    return ipLookupHandler(req, res);
  }
  if (pathname.startsWith('/api/ipv2/lookup/')) {
    req.query.ip = pathname.replace('/api/ipv2/lookup/', '').trim();
    return ipLookupHandler(req, res);
  }

  // 7. /api/ipv2/heat/:ip
  if (pathname.startsWith('/api/ipv2/heat/')) {
    req.query.ip = pathname.replace('/api/ipv2/heat/', '').trim();
    return ipHeatHandler(req, res);
  }

  // 8. /api/ipv2/bgp/:ip
  if (pathname.startsWith('/api/ipv2/bgp/')) {
    req.query.ip = pathname.replace('/api/ipv2/bgp/', '').trim();
    return ipBgpHandler(req, res);
  }

  // 9. /api/ipv2/dnsbl/:ip
  if (pathname.startsWith('/api/ipv2/dnsbl/')) {
    req.query.ip = pathname.replace('/api/ipv2/dnsbl/', '').trim();
    return ipDnsblHandler(req, res);
  }

  // 10. /api/ipv2/asncos/:asn
  if (pathname.startsWith('/api/ipv2/asncos/')) {
    req.query.asn = pathname.replace('/api/ipv2/asncos/', '').trim();
    return ipAsncosHandler(req, res);
  }

  // 11. /api/ip/related/:ip
  if (pathname.startsWith('/api/ip/related/')) {
    req.query.ip = pathname.replace('/api/ip/related/', '').trim();
    return ipRelatedHandler(req, res);
  }

  // 12. /api/ip/pingcheck/:ip
  if (pathname.startsWith('/api/ip/pingcheck/')) {
    req.query.ip = pathname.replace('/api/ip/pingcheck/', '').trim();
    return ipPingcheckHandler(req, res);
  }

  // 13. /api/ip/portscan/:ip
  if (pathname.startsWith('/api/ip/portscan/')) {
    req.query.ip = pathname.replace('/api/ip/portscan/', '').trim();
    return ipPortscanHandler(req, res);
  }

  // 14. /api/ping/global
  if (pathname === '/api/ping/global') {
    return pingGlobalHandler(req, res);
  }

  // 15. /ip SPA 页面路由处理
  // 若请求的是 /ip、/ip/ 或 /ip/<目标IP>（排除静态资源拓展名），统一交付 /public/ip/index.html
  const isIpRoute = pathname === '/ip' || pathname === '/ip/' || pathname.startsWith('/ip/');
  const hasStaticExt = /\.(js|css|png|jpg|jpeg|svg|webp|ico|txt|json|woff2?|ttf)$/i.test(pathname);

  if (isIpRoute && !hasStaticExt) {
    const ipHtmlPath = path.join(PUBLIC_DIR, 'ip', 'index.html');
    if (fs.existsSync(ipHtmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(ipHtmlPath).pipe(res);
      return;
    }
  }

  // 16. 静态文件处理
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

  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
  };

  res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`[Net.Coffee Server] Running on http://localhost:${PORT}`);
});
