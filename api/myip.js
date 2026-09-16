module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const forwarded = req.headers['x-forwarded-for'];
  let clientIp = '';
  if (forwarded) {
    clientIp = forwarded.split(',')[0].trim();
  } else if (req.headers['x-real-ip']) {
    clientIp = req.headers['x-real-ip'].trim();
  } else if (req.socket && req.socket.remoteAddress) {
    clientIp = req.socket.remoteAddress;
  }

  // 清洗 ::ffff: 等 IPv4 映射前缀
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.replace('::ffff:', '');
  }

  res.status(200).json({ ip: clientIp });
};
