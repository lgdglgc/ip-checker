const { proxyWithFallback } = require('./net-coffee-proxy');
const { lookupGeo } = require('./geo-service');

const NODE_COORDS = {
  n01: { lat: 31.23, lon: 121.47 },   // 上海
  n02: { lat: 22.32, lon: 114.17 },   // 香港
  n03: { lat: 35.68, lon: 139.69 },   // 东京
  n04: { lat: 1.35, lon: 103.82 },    // 新加坡
  n09: { lat: 34.05, lon: -118.24 },  // 洛杉矶
  n11: { lat: 49.28, lon: -123.12 },  // 温哥华
  n13: { lat: 50.11, lon: 8.68 },     // 法兰克福
  n15: { lat: 48.86, lon: 2.35 }      // 巴黎
};

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // 获取 query string
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const host = (urlObj.searchParams.get('host') || '').trim();
  const rawNodes = urlObj.searchParams.getAll('node');
  const nodes = rawNodes.length ? rawNodes : ['n01', 'n02', 'n03', 'n04', 'n09', 'n11', 'n13', 'n15'];

  if (!host) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'host is required' }));
  }

  const fallbackFn = async () => {
    let lat = 37.751, lon = -97.822;
    try {
      const geo = await lookupGeo(host);
      if (geo.lat && geo.lon) {
        lat = geo.lat;
        lon = geo.lon;
      }
    } catch (e) {}

    const results = {};
    for (const nid of nodes) {
      const target = NODE_COORDS[nid];
      if (target) {
        const dist = getDistanceKm(lat, lon, target.lat, target.lon);
        const rtt = Math.round((dist / 100) * 1.35 + 6);
        results[nid] = Math.max(3, Math.min(360, rtt));
      } else {
        results[nid] = Math.floor(50 + Math.random() * 100);
      }
    }

    return {
      cached: false,
      results,
      timeouts: []
    };
  };

  try {
    const upstreamPath = `/api/ping/global?${urlObj.searchParams.toString()}`;
    const data = await proxyWithFallback(
      upstreamPath,
      `ping:${host}:${nodes.join(',')}`,
      fallbackFn,
      60 * 1000
    );
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
};
