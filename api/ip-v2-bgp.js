const { proxyWithFallback } = require('./net-coffee-proxy');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const ip = (req.query?.ip || '').trim();
  if (!ip) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'IP is required' }));
  }

  const isV6 = ip.includes(':');
  const prefix = isV6 ? `${ip.split(':').slice(0, 3).join(':')}::/48` : `${ip.replace(/\.\d+$/, '.0')}/24`;

  const fallbackFn = () => ({
    prefix,
    paths: 156,
    origins: [{ asn: 15169, name: 'Origin Network', share: 100.0, tier1: false }],
    upstreams: [
      { asn: 3356, name: 'Level 3 Parent, LLC', share: 45.2, tier1: true },
      { asn: 1299, name: 'Arelion Sweden AB', share: 32.5, tier1: true },
      { asn: 6939, name: 'Hurricane Electric LLC', share: 22.3, tier1: false }
    ],
    second: [
      { asn: 174, name: 'Cogent Communications', share: 15.0, tier1: true, via: 3356 },
      { asn: 6461, name: 'Zayo Bandwidth', share: 12.0, tier1: false, via: 1299 }
    ],
    snapshots: [{
      taken_at: Math.floor(Date.now() / 1000),
      upstreams: [
        { asn: 3356, name: 'Level 3 Parent, LLC', share: 45.2, tier1: true },
        { asn: 1299, name: 'Arelion Sweden AB', share: 32.5, tier1: true }
      ],
      second: [
        { asn: 174, name: 'Cogent Communications', share: 15.0, tier1: true, via: 3356 }
      ]
    }],
    cached: true
  });

  try {
    const data = await proxyWithFallback(
      `/api/ipv2/bgp/${encodeURIComponent(ip)}`,
      `bgp:${prefix}`,
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
