const { lookupGeo } = require('./geo-service');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 获取目标 IP，优先取 query.ip，未传则取客户端 IP
  let ip = req.query?.ip;
  if (!ip) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      ip = forwarded.split(',')[0].trim();
    } else {
      ip = req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
    }
    if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }
  }

  if (!ip) {
    return res.status(400).json({ error: 'IP is required' });
  }

  try {
    const result = await lookupGeo(ip);
    const cc = (result.countryCode || result.country_code || '').toLowerCase();
    res.status(200).json({
      ...result,
      countryCode: cc,
      country_code: cc
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Lookup error' });
  }
};
