const http = require('http');

const geoCache = new Map();

function fetchUpstreamGeo(ip) {
  return new Promise((resolve) => {
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { ips } = req.query || {};
  if (!ips) {
    return res.status(400).json({ error: 'ips query parameter required' });
  }

  const ipList = ips.split(',').map(s => s.trim()).filter(Boolean);
  const result = {};

  await Promise.all(ipList.map(async (ip) => {
    if (geoCache.has(ip)) {
      result[ip] = geoCache.get(ip);
    } else {
      const geo = await fetchUpstreamGeo(ip);
      geoCache.set(ip, geo);
      result[ip] = geo;
    }
  }));

  res.status(200).json(result);
};
