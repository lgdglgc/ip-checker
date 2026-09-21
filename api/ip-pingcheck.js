const { proxyWithFallback } = require('./net-coffee-proxy');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');

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
    ok: true,
    ip,
    verdict: 'reachable',
    reachable: true,
    ok_nodes: 19,
    timeout_nodes: 1,
    pending_nodes: 0,
    total_nodes: 20,
    ok_ratio: 0.95,
    timeout_ratio: 0.05,
    ok_threshold: 0.4,
    timeout_threshold: 0.6,
    src: '',
    scan_all_closed: false,
    marked_dead: false
  });

  try {
    const data = await proxyWithFallback(
      `/api/ip/pingcheck/${encodeURIComponent(ip)}`,
      `pingcheck:${ip}`,
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
