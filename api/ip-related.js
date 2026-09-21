const { proxyWithFallback } = require('./net-coffee-proxy');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const ip = (req.query?.ip || '').trim();
  if (!ip) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'IP is required' }));
  }

  const fallbackFn = () => ({
    ip,
    related_domains: [],
    pending: false
  });

  try {
    const data = await proxyWithFallback(
      `/api/ip/related/${encodeURIComponent(ip)}`,
      `related:${ip}`,
      fallbackFn
    );
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
};
