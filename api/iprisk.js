const { proxyWithFallback, generateFallbackLookup } = require('./net-coffee-proxy');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  let ip = req.query?.ip;
  if (!ip) {
    const forwarded = req.headers['x-forwarded-for'];
    ip = (forwarded ? forwarded.split(',')[0].trim() : req.headers['x-real-ip'] || req.socket?.remoteAddress || '').replace('::ffff:', '');
  }

  if (!ip) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'IP is required' }));
  }

  try {
    const cleanIp = ip.trim();
    const data = await proxyWithFallback(
      `/api/iprisk/${encodeURIComponent(cleanIp)}`,
      `iprisk:${cleanIp}`,
      () => generateFallbackLookup(cleanIp)
    );
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || 'Lookup failed' }));
  }
};
