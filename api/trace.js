module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.socket?.remoteAddress ||
           '127.0.0.1';

  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  const ts = Math.floor(Date.now() / 1000);
  const uag = req.headers['user-agent'] || 'Mozilla/5.0';
  const host = req.headers.host || 'localhost';

  const body = [
    `fl=500f12`,
    `h=${host}`,
    `ip=${ip}`,
    `ts=${ts}`,
    `visit_scheme=https`,
    `uag=${uag}`,
    `colo=HKG`,
    `sliver=none`,
    `http=http/2`,
    `loc=HK`,
    `tls=TLSv1.3`,
    `sni=plaintext`,
    `warp=off`,
    `gateway=off`,
    `rbi=off`,
    `kex=X25519`
  ].join('\n') + '\n';

  res.statusCode = 200;
  res.end(body);
};
