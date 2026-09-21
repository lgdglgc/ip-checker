const { lookupGeo } = require('./geo-service');

// Google Gemini 与 Google Antigravity 官方受限地区
const RESTRICTED_REGIONS = {
  'cn': { name: '中国大陆', reason: '防火墙阻断且未在 Google 官方支持列表，无法直接访问' },
  'hk': { name: '中国香港', reason: 'Google Gemini / Antigravity 官方对香港 IP 实施地区封锁（提示 Location not supported），建议切换美国/日本/新加坡等节点' },
  'mo': { name: '中国澳门', reason: '未在 Google 官方支持列表中' },
  'ru': { name: '俄罗斯', reason: '受官方合规制裁限制无法使用' },
  'ir': { name: '伊朗', reason: '受官方合规制裁限制无法使用' },
  'kp': { name: '朝鲜', reason: '受官方合规制裁限制无法使用' },
  'cu': { name: '古巴', reason: '受官方合规制裁限制无法使用' },
  'sy': { name: '叙利亚', reason: '受官方合规制裁限制无法使用' },
  'by': { name: '白俄罗斯', reason: '受官方合规制裁限制无法使用' }
};

// 常见官方全面支持的核心地区
const FULLY_SUPPORTED_REGIONS = new Set([
  'us', 'jp', 'sg', 'tw', 'gb', 'de', 'ca', 'au', 'kr', 'fr', 'in', 'nl',
  'se', 'ch', 'ie', 'br', 'my', 'ph', 'th', 'vn', 'ae', 'nz', 'es', 'it',
  'mx', 'id', 'pl', 'no', 'fi', 'dk', 'at', 'be', 'pt', 'il', 'za', 'cl',
  'co', 'pe', 'ar'
]);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  let ip = req.query?.ip;
  if (!ip) {
    const forwarded = req.headers['x-forwarded-for'];
    ip = (forwarded ? forwarded.split(',')[0].trim() : req.headers['x-real-ip'] || req.socket?.remoteAddress || '').replace('::ffff:', '');
  }

  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    // 默认回退或测试 IP
    ip = '216.167.124.197';
  }

  try {
    const geo = await lookupGeo(ip);
    const cc = (geo.countryCode || geo.country_code || '').toLowerCase();

    const isRestricted = Boolean(RESTRICTED_REGIONS[cc]);
    const restrictedInfo = RESTRICTED_REGIONS[cc];
    const isSupported = !isRestricted && (FULLY_SUPPORTED_REGIONS.has(cc) || Boolean(cc));

    // 计算 Google AI & Antigravity 信任度与可用性得分
    let trustScore = 95;
    const reasons = [];

    if (isRestricted) {
      trustScore = Math.min(trustScore, 20);
      reasons.push(restrictedInfo.reason);
    } else {
      if (cc === 'us') {
        reasons.push('美国原生出口，Gemini 与 Antigravity 体验最佳，具备最高功能优先权');
      } else if (cc === 'jp' || cc === 'sg' || cc === 'tw') {
        reasons.push('亚洲合规出口，延迟较低，官方全面支持');
      } else {
        reasons.push('官方受支持国家与地区');
      }
    }

    if (geo.isHosting) {
      trustScore -= 20;
      reasons.push('机房/数据中心 IP，可能遭遇 Google reCAPTCHA 频繁验证码或临时并发频率限制');
    } else {
      trustScore += 5;
      reasons.push('原生家庭宽带/住宅 ISP，通过率高');
    }

    if (geo.isProxy || geo.is_proxy) {
      trustScore -= 15;
      reasons.push('检测到公共代理特征');
    }

    trustScore = Math.max(10, Math.min(100, trustScore));

    let trustLevel = '可信';
    if (trustScore < 40) trustLevel = '高危 / 不可用';
    else if (trustScore < 70) trustLevel = '中危 / 偶受限';

    let regionStatusText = '';
    if (isRestricted) {
      if (cc === 'hk') {
        regionStatusText = '香港受限 (Gemini/Antigravity 网页端不直接支持，需换美/日/新节点)';
      } else if (cc === 'cn') {
        regionStatusText = '中国大陆受限 (防火墙阻断且不在支持列表)';
      } else {
        regionStatusText = `${restrictedInfo.name}受限 (${restrictedInfo.reason})`;
      }
    } else {
      regionStatusText = '官方全面支持 (Gemini & Antigravity 可直接使用)';
    }

    const payload = {
      ip,
      country: geo.country || '',
      country_code: cc,
      region: geo.regionName || geo.region || '',
      city: geo.city || '',
      timezone: geo.timezone || '',
      isp: geo.isp || '',
      asn: geo.asn || '',
      is_residential: !geo.isHosting,
      is_hosting: Boolean(geo.isHosting),
      is_proxy: Boolean(geo.isProxy),
      is_vpn: false,
      is_tor: false,
      is_crawler: false,
      is_abuser: false,
      gemini_supported: !isRestricted,
      antigravity_supported: !isRestricted,
      region_status: isRestricted ? 'restricted' : 'supported',
      region_status_text: regionStatusText,
      restricted_details: restrictedInfo || null,
      trust_score: trustScore,
      trust_level: trustLevel,
      reasons
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: err.message || 'Check failed' }));
  }
};
