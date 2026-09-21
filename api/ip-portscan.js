const { proxyWithFallback } = require('./net-coffee-proxy');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const ip = (req.query?.ip || '').trim();
  if (!ip) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'IP is required' }));
  }

  const force = req.query?.force === '1' ? '?force=1' : (req.query?.probe === '0' ? '?probe=0' : '');

  const fallbackFn = () => ({
    ok: true,
    ip,
    ports: {
      "22": "closed",
      "25": "closed",
      "80": "closed",
      "443": "open",
      "8080": "closed",
      "8443": "closed"
    },
    age_s: 0,
    scanned_at: Math.floor(Date.now() / 1000),
    cooldown_sec: 60
  });

  try {
    const data = await proxyWithFallback(
      `/api/ip/portscan/${encodeURIComponent(ip)}${force}`,
      `portscan:${ip}${force}`,
      fallbackFn,
      30 * 1000 // 短缓存
    );
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
};
