const { proxyWithFallback } = require('./net-coffee-proxy');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const token = req.query?.token || '';
  if (!token) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'token is required' }));
  }

  try {
    const data = await proxyWithFallback(
      `/api/dns/result/${encodeURIComponent(token)}`,
      `dns:${token}`,
      async () => ({ token, dns_servers: [] }),
      10000
    );
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ token, dns_servers: [] }));
  }
};
