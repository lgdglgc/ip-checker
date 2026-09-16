// ===== /cloudflare/ 页脚本(2026-09-15 v2) =====
// 检测由浏览器直接向 Cloudflare 的 cdn-cgi/trace、speed.cloudflare.com、Turnstile 发起;本站提供出口 IP 情报(/api/ip/lookup)与人机验证服务端校验(/api/captcha/verify)。
const CF_COLOS = {"AAE":["Annabah","DZ"],"ABJ":["Abidjan","CI"],"ABQ":["Albuquerque","US"],"ACC":["Accra","GH"],"ACX":["Xingyi","CN"],"ADB":["Izmir","TR"],"ADD":["Addis Ababa","ET"],"ADL":["Adelaide","AU"],"AGR":["","IN"],"AIP":["","IN"],"AKL":["Auckland","NZ"],"AKX":["Aktyubinsk","KZ"],"ALA":["Almaty","KZ"],"ALG":["Algiers","DZ"],"AMD":["Ahmedabad","IN"],"AMM":["Amman","JO"],"AMS":["Amsterdam","NL"],"ANC":["Anchorage","US"],"ARI":["Arica","CL"],"ARN":["Stockholm","SE"],"ARU":["Aracatuba","BR"],"ASK":["Yamoussoukro","CI"],"ASU":["Asuncion","PY"],"ATH":["Athens","GR"],"ATL":["Atlanta","US"],"AUS":["Austin","US"],"AVA":["Anshun","CN"],"BAH":["Manama","BH"],"BAQ":["Barranquilla","CO"],"BBI":["Bhubaneswar","IN"],"BCN":["Barcelona","ES"],"BDQ":["Vadodara","IN"],"BEG":["Belgrad","RS"],"BEL":["Belem","BR"],"BEY":["Beirut","LB"],"BGI":["Bridgetown","BB"],"BGR":["Bangor","US"],"BGW":["Baghdad","IQ"],"BKK":["Bangkok","TH"],"BLR":["Bangalore","IN"],"BNA":["Nashville","US"],"BNE":["Brisbane","AU"],"BOD":["Bordeaux/Merignac","FR"],"BOG":["Bogota","CO"],"BOM":["Mumbai","IN"],"BOS":["Boston","US"],"BRU":["Brussels","BE"],"BSB":["Brasilia","BR"],"BSR":["Basrah","IQ"],"BTS":["Bratislava","SK"],"BUD":["Budapest","HU"],"BUF":["Buffalo","US"],"BWN":["Bandar Seri Begawan","BN"],"CAI":["Cairo","EG"],"CAN":["Guangzhou","CN"],"CAW":["Campos Dos Goytacazes","BR"],"CBR":["Canberra","AU"],"CCU":["Kolkata","IN"],"CDG":["Paris","FR"],"CEB":["Lapu-Lapu City","PH"],"CFC":["Caçador","BR"],"CGB":["Cuiaba","BR"],"CGD":["Changde","CN"],"CGK":["Jakarta","ID"],"CGO":["Zhengzhou","CN"],"CGP":["Chittagong","BD"],"CGY":["Cagayan De Oro City","PH"],"CHC":["Christchurch","NZ"],"CJB":["Coimbatore","IN"],"CKG":["Chongqing","CN"],"CLE":["Cleveland","US"],"CLO":["Cali","CO"],"CLT":["Charlotte","US"],"CMB":["Colombo","LK"],"CMH":["Columbus","US"],"CNF":["Belo Horizonte","BR"],"CNN":["Mattanur","IN"],"CNX":["Chiang Mai","TH"],"COK":["Cochin","IN"],"COR":["Cordoba","AR"],"CPH":["Copenhagen","DK"],"CPT":["Cape Town","ZA"],"CRK":["Mabalacat","PH"],"CSX":["Changsha","CN"],"CTU":["Chengdu","CN"],"CVG":["Hebron","US"],"CWB":["Curitiba","BR"],"CZL":["Constantine","DZ"],"CZX":["Changzhou","CN"],"DAC":["Dhaka","BD"],"DAD":["Da Nang","VN"],"DAR":["Dar es Salaam","TZ"],"DEL":["New Delhi","IN"],"DEN":["Denver","US"],"DFW":["Dallas-Fort Worth","US"],"DKR":["Dakar","SN"],"DLA":["Douala","CM"],"DLC":["Dalian","CN"],"DME":["Moscow","RU"],"DMM":["Ad Dammam","SA"],"DOH":["Doha","QA"],"DPS":["Denpasar-Bali Island","ID"],"DTW":["Detroit","US"],"DUB":["Dublin","IE"],"DUR":["Durban","ZA"],"DUS":["Dusseldorf","DE"],"DXB":["Dubai","AE"],"DYU":["Dushanbe","TJ"],"EBB":["Kampala","UG"],"EBL":["Arbil","IQ"],"EVN":["Yerevan","AM"],"EWR":["Newark","US"],"EZE":["Ezeiza","AR"],"FCO":["Rome","IT"],"FIH":["Kinshasa","CD"],"FLN":["Florianopolis","BR"],"FOC":["Fuzhou","CN"],"FOR":["Fortaleza","BR"],"FRA":["Frankfurt-am-Main","DE"],"FRU":["Bishkek","KG"],"FSD":["Sioux Falls","US"],"FUK":["Fukuoka","JP"],"FUO":["Foshan","CN"],"GBE":["Gaborone","BW"],"GDL":["Guadalajara","MX"],"GEO":["Georgetown","GY"],"GIG":["Rio De Janeiro","BR"],"GND":["Saint George's","GD"],"GOT":["Gothenburg","SE"],"GRU":["Sao Paulo","BR"],"GUA":["Guatemala City","GT"],"GUM":["Hagatna","GU"],"GVA":["Geneva","CH"],"GYD":["Baku","AZ"],"GYE":["Guayaquil","EC"],"GYN":["Goiania","BR"],"HAK":["Haikou","CN"],"HAM":["Hamburg","DE"],"HAN":["Hanoi","VN"],"HBA":["Hobart","AU"],"HEL":["Helsinki","FI"],"HFA":["Haifa","IL"],"HGH":["Shaoxing","CN"],"HKG":["Hong Kong","HK"],"HNL":["Honolulu","US"],"HRE":["Harare","ZW"],"HYD":["Hyderabad","IN"],"HYN":["Taizhou","CN"],"IAD":["Dulles","US"],"IAH":["Houston","US"],"ICN":["Seoul","KR"],"IND":["Indianapolis","US"],"ISB":["Islamabad","PK"],"IST":["Arnavutkoy","TR"],"ISU":["Sulaymaniyah","IQ"],"IXC":["Chandigarh","IN"],"JAX":["Jacksonville","US"],"JDO":["Juazeiro Do Norte","BR"],"JED":["Jeddah","SA"],"JHB":["Senai","MY"],"JIB":["Djibouti City","DJ"],"JNB":["Johannesburg","ZA"],"JOG":["Yogyakarta-Java Island","ID"],"JOI":["Joinville","BR"],"JRG":["Jharsuguda","IN"],"JXG":["Jiaxing","CN"],"KBP":["Kiev","UA"],"KCH":["Kuching","MY"],"KEF":["Reykjavik","IS"],"KGL":["Kigali","RW"],"KHH":["Kaohsiung City","TW"],"KHI":["Karachi","PK"],"KHN":["Xinyu","CN"],"KIN":["Kingston","JM"],"KIV":["Chișinău","MD"],"KIX":["Osaka","JP"],"KMG":["Kunming","CN"],"KNU":["Kanpur","IN"],"KTM":["Kathmandu","NP"],"KUL":["Kuala Lumpur","MY"],"KWE":["Guiyang","CN"],"KWI":["Kuwait City","KW"],"LAD":["Luanda","AO"],"LAS":["Las Vegas","US"],"LAX":["Los Angeles","US"],"LCA":["Larnarca","CY"],"LED":["St. Petersburg","RU"],"LHE":["Lahore","PK"],"LHR":["London","GB"],"LHW":["Lanzhou","CN"],"LIM":["Lima","PE"],"LIS":["Lisbon","PT"],"LJU":["Ljubljana","SI"],"LLK":["Lankaran","AZ"],"LLW":["Lilongwe","MW"],"LOS":["Lagos","NG"],"LPB":["La Paz / El Alto","BO"],"LUH":["","IN"],"LUN":["Lusaka","ZM"],"LUX":["Luxembourg","LU"],"LYA":["Luoyang","CN"],"LYS":["Lyon","FR"],"MAA":["Chennai","IN"],"MAD":["Madrid","ES"],"MAN":["Manchester","GB"],"MAO":["Manaus","BR"],"MBA":["Mombasa","KE"],"MCI":["Kansas City","US"],"MCT":["Muscat","OM"],"MDE":["Rionegro","CO"],"MEL":["Melbourne","AU"],"MEM":["Memphis","US"],"MEX":["Mexico City","MX"],"MFM":["Taipa","MO"],"MIA":["Miami","US"],"MLA":["Luqa","MT"],"MLE":["Male","MV"],"MLG":["Malang-Java Island","ID"],"MNL":["Manila","PH"],"MPM":["Maputo","MZ"],"MRS":["Marseille","FR"],"MRU":["Port Louis","MU"],"MSP":["Minneapolis","US"],"MSQ":["Minsk","BY"],"MUC":["Munich","DE"],"MXP":["Milan","IT"],"NAG":["Naqpur","IN"],"NBO":["Nairobi","KE"],"NJF":["Najaf","IQ"],"NOU":["Noumea","NC"],"NQN":["Neuquen","AR"],"NQZ":["Astana","KZ"],"NRT":["Tokyo","JP"],"NVT":["Navegantes","BR"],"OKA":["Naha","JP"],"OKC":["Oklahoma City","US"],"OMA":["Omaha","US"],"ORD":["Chicago","US"],"ORF":["Norfolk","US"],"ORN":["Oran","DZ"],"OSL":["Oslo","NO"],"OTP":["Bucharest","RO"],"OUA":["Ouagadougou","BF"],"PAT":["Patna","IN"],"PBH":["Paro","BT"],"PBM":["Zandery","SR"],"PDX":["Portland","US"],"PER":["Perth","AU"],"PHL":["Philadelphia","US"],"PHX":["Phoenix","US"],"PIT":["Pittsburgh","US"],"PKX":["Langfang","CN"],"PMO":["Palermo","IT"],"PMW":["Palmas","BR"],"PNH":["Phnom Penh","KH"],"PNQ":["Pune","IN"],"POA":["Porto Alegre","BR"],"POS":["Port of Spain","TT"],"PPT":["Papeete","PF"],"PRG":["Prague","CZ"],"PTY":["Tocumen","PA"],"QRO":["Queretaro","MX"],"QWJ":["Americana","BR"],"RAO":["Ribeirao Preto","BR"],"RDU":["Raleigh/Durham","US"],"REC":["Recife","BR"],"RIC":["Richmond","US"],"RIX":["Riga","LV"],"RUH":["Riyadh","SA"],"RUN":["St Denis","RE"],"SAN":["San Diego","US"],"SAP":["La Mesa","HN"],"SAT":["San Antonio","US"],"SCL":["Santiago","CL"],"SDQ":["Santo Domingo","DO"],"SEA":["Seattle","US"],"SFO":["San Francisco","US"],"SGN":["Ho Chi Minh City","VN"],"SHA":["Shanghai","CN"],"SIN":["Singapore","SG"],"SJC":["San Jose","US"],"SJK":["Sao Jose Dos Campos","BR"],"SJO":["San Jose","CR"],"SJP":["Sao Jose Do Rio Preto","BR"],"SJU":["San Juan","PR"],"SJW":["Hengshui","CN"],"SKG":["Thessaloniki","GR"],"SKP":["Skopje","MK"],"SLC":["Salt Lake City","US"],"SMF":["Sacramento","US"],"SOD":["Sorocaba","BR"],"SOF":["Sofia","BG"],"SSA":["Salvador","BR"],"STI":["Santiago","DO"],"STL":["St Louis","US"],"STR":["Stuttgart","DE"],"SUV":["Nausori","FJ"],"SYD":["Sydney","AU"],"SZX":["Shenzhen","CN"],"TAO":["Qingdao","CN"],"TBS":["Tbilisi","GE"],"TEN":["Tongren","CN"],"TGU":["Tegucigalpa","HN"],"TIA":["Tirana","AL"],"TLH":["Tallahassee","US"],"TLL":["Tallinn","EE"],"TLV":["Tel Aviv","IL"],"TNA":["Jinan","CN"],"TNR":["Antananarivo","MG"],"TPA":["Tampa","US"],"TPE":["Taipei","TW"],"TUN":["Tunis","TN"],"TXL":["Berlin","DE"],"TYN":["Yangquan","CN"],"UDI":["Uberlandia","BR"],"UDR":["Udaipur","IN"],"UIO":["Quito","EC"],"ULN":["Ulan Bator","MN"],"URT":["Surat Thani","TH"],"VCP":["Campinas","BR"],"VIE":["Vienna","AT"],"VIX":["Vitoria","BR"],"VNO":["Vilnius","LT"],"VTE":["Vientiane","LA"],"WAW":["Warsaw","PL"],"WDH":["Windhoek","NA"],"WLG":["Wellington","NZ"],"WRO":["Wroclaw","PL"],"XAP":["Chapeco","BR"],"XFN":["Xiangyang","CN"],"XIY":["Baoji","CN"],"XNH":["Nasiriyah","IQ"],"YHZ":["Halifax","CA"],"YUL":["Montreal","CA"],"YVR":["Vancouver","CA"],"YWG":["Winnipeg","CA"],"YXE":["Saskatoon","CA"],"YYC":["Calgary","CA"],"YYZ":["Toronto","CA"],"ZAG":["Zagreb","HR"],"ZDM":["Ramallah","PS"],"ZRH":["Zurich","CH"]};            // {IATA: [城市英文, 国家码]},共 342 个节点 / 135 个国家地区
const COLO_ZH = {
  HKG:'香港',NRT:'东京',KIX:'大阪',FUK:'福冈',OKA:'那霸',SIN:'新加坡',ICN:'首尔',TPE:'台北',KHH:'高雄',MFM:'澳门',
  SHA:'上海',CAN:'广州',SZX:'深圳',PKX:'北京·廊坊',CTU:'成都',CKG:'重庆',HGH:'杭州·绍兴',TAO:'青岛',TNA:'济南',CGO:'郑州',XIY:'西安·宝鸡',
  KMG:'昆明',CSX:'长沙',FOC:'福州',DLC:'大连',HAK:'海口',KWE:'贵阳',LHW:'兰州',CZX:'常州',JXG:'嘉兴',LYA:'洛阳',SJW:'石家庄·衡水',TYN:'太原·阳泉',
  MNL:'马尼拉',CGK:'雅加达',KUL:'吉隆坡',BKK:'曼谷',SGN:'胡志明市',HAN:'河内',PNH:'金边',CEB:'宿务',DAC:'达卡',KTM:'加德满都',
  BOM:'孟买',DEL:'新德里',MAA:'金奈',BLR:'班加罗尔',HYD:'海得拉巴',CCU:'加尔各答',CMB:'科伦坡',KHI:'卡拉奇',ISB:'伊斯兰堡',LHE:'拉合尔',
  SYD:'悉尼',MEL:'墨尔本',BNE:'布里斯班',PER:'珀斯',ADL:'阿德莱德',AKL:'奥克兰',GUM:'关岛',
  DXB:'迪拜',DOH:'多哈',BAH:'巴林',KWI:'科威特',RUH:'利雅得',JED:'吉达',MCT:'马斯喀特',TLV:'特拉维夫',AMM:'安曼',
  LAX:'洛杉矶',SJC:'圣何塞',SFO:'旧金山',SEA:'西雅图',PDX:'波特兰',DEN:'丹佛',PHX:'凤凰城',LAS:'拉斯维加斯',SLC:'盐湖城',
  DFW:'达拉斯',IAH:'休斯顿',ORD:'芝加哥',ATL:'亚特兰大',MIA:'迈阿密',EWR:'纽瓦克',JFK:'纽约',IAD:'华盛顿',BOS:'波士顿',
  YVR:'温哥华',YYZ:'多伦多',YUL:'蒙特利尔',YYC:'卡尔加里',MEX:'墨西哥城',GRU:'圣保罗',GIG:'里约热内卢',EZE:'布宜诺斯艾利斯',SCL:'圣地亚哥',BOG:'波哥大',LIM:'利马',
  LHR:'伦敦',MAN:'曼彻斯特',CDG:'巴黎',MRS:'马赛',FRA:'法兰克福',MUC:'慕尼黑',DUS:'杜塞尔多夫',BER:'柏林',HAM:'汉堡',AMS:'阿姆斯特丹',
  BRU:'布鲁塞尔',ZRH:'苏黎世',GVA:'日内瓦',VIE:'维也纳',PRG:'布拉格',WAW:'华沙',BUD:'布达佩斯',MAD:'马德里',BCN:'巴塞罗那',LIS:'里斯本',
  MXP:'米兰',FCO:'罗马',ATH:'雅典',IST:'伊斯坦布尔',CPH:'哥本哈根',ARN:'斯德哥尔摩',OSL:'奥斯陆',HEL:'赫尔辛基',DUB:'都柏林',
  DME:'莫斯科',LED:'圣彼得堡',KBP:'基辅',JNB:'约翰内斯堡',CPT:'开普敦',NBO:'内罗毕',LOS:'拉各斯',CAI:'开罗',CMN:'卡萨布兰卡',
};
function ccZh(cc) {
  cc = (cc || '').toUpperCase();
  if (!cc) return '';
  if (cc === 'TW') return '中国台湾省';
  if (cc === 'HK') return '中国香港';
  if (cc === 'MO') return '中国澳门';
  try { const n = new Intl.DisplayNames(['zh-CN'], { type: 'region' }).of(cc); if (n && n !== cc) return n; } catch (e) {}
  return cc;
}
function coloInfo(code) {
  code = (code || '').toUpperCase();
  const row = CF_COLOS[code];
  if (!row) return { code, city: code || '未知', cc: '', zh: code || '未知' };
  return { code, city: row[0], cc: row[1], zh: COLO_ZH[code] || row[0] };
}
function coloHtml(code, big) {
  const c = coloInfo(code);
  if (!c.code) return '<span class="tag tag-neutral">未知</span>';
  return `${flagImg(c.cc)}<span class="code">${c.code}</span><span class="city" style="font-weight:500;font-size:${big ? '0.7em' : '1em'};color:var(--text-soft)">${c.zh}</span>`;
}

// ===== IP 显示 / 国旗 / 归属(与 /gpt/ 同源) =====
function isIPv6(ip) { return ip && ip.includes(':'); }
function truncateIP(ip) { if (!isIPv6(ip) || ip.length <= 20) return ip; return ip.substring(0, 18) + '...'; }
function displayIP(ip) {
  if (!ip) return '获取失败';
  if (isIPv6(ip)) return `<span class="ip-truncate ip-mask-target" title="${ip}">${truncateIP(ip)}</span>`;
  return `<span class="ip-mask-target">${ip}</span>`;
}
function linkIP(ip) { if (!ip) return '获取失败'; return `<a class="ip-link" href="/ip/${encodeURIComponent(ip)}" target="_blank" rel="noopener" title="查看 ${ip} 的 IP 评分">${displayIP(ip)}</a>`; }
function setGeoText(elId, text) {
  const el = document.getElementById(elId); if (!el) return;
  el.innerHTML = '<span class="geo-text"></span>'; const span = el.firstElementChild; span.textContent = text || '';
  el.classList.remove('truncated'); el.removeAttribute('data-full'); if (!text) return;
  requestAnimationFrame(() => { if (span.scrollWidth > span.clientWidth + 1) { el.dataset.full = text; el.classList.add('truncated'); } });
}
function flagImg(cc) {
  if (!cc) return '';
  const l = cc.toLowerCase();
  const src = l === 'cn' ? '/favicons/cn.png' : l === 'tw' ? '/favicons/flags/tw.png' : `/favicons/flags/${l}.png`;
  return `<img src="${src}" width="40" height="27" style="width:24px;height:auto;border-radius:2px;vertical-align:middle" alt="${ccZh(cc)}" title="${ccZh(cc)}" onerror="this.onerror=null;this.style.display='none'">`;
}
function tag(text, cls) { return `<span class="tag ${cls || 'tag-neutral'}">${text}</span>`; }
function row(label, value) { return `<div class="risk-row"><span class="risk-label">${label}</span><span class="risk-value">${value}</span></div>`; }
function sig(v, yesText, noText) { if (v === true) return `<span class="sig sig-yes">${yesText || '检测到'}</span>`; if (v === false) return `<span class="sig sig-no">${noText || '未检测到'}</span>`; return '<span class="sig sig-na">未知</span>'; }

// ===== trace =====
async function trace(domain, timeoutMs) {
  const r = await fetch(`https://${domain}/cdn-cgi/trace`, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs || 6000) });
  const txt = await r.text();
  const o = {};
  txt.trim().split('\n').forEach(l => { const i = l.indexOf('='); if (i > 0) o[l.slice(0, i)] = l.slice(i + 1); });
  if (!o.ip) throw new Error('无 ip 字段');
  return o;
}
async function timedTrace(domain) {
  const t0 = performance.now();
  const o = await trace(domain);
  return { o, ms: Math.round(performance.now() - t0) };
}

const state = { self: null, ip: null, geo: null, look: null, coloSelf: null, tsResult: {} };

function httpLabel(h) { h = (h || '').toLowerCase(); if (h.includes('3')) return 'HTTP/3'; if (h.includes('2')) return 'HTTP/2'; if (h.includes('1.1')) return 'HTTP/1.1'; return h ? h.toUpperCase() : '未知'; }
function tlsLabel(t) { t = t || ''; return t.replace('TLSv', 'TLS ').replace('v', ' ') || '未知'; }
function warpLabel(w) { w = (w || 'off').toLowerCase(); return w === 'plus' ? 'WARP+ 已开启' : w === 'on' ? 'WARP 已开启' : 'WARP 未启用'; }
function sniLabel(s) { s = (s || '').toLowerCase(); return s === 'encrypted' ? '加密 SNI（ECH）' : s === 'plaintext' ? '明文 SNI' : s === 'off' ? '未使用 SNI' : (s || '未知'); }

// ===== 主流程 =====
async function main() {
  let o;
  try { o = await trace('ip.net.coffee'); }
  catch (e) {
    ['ipAddr', 'coloBig', 'warpBig', 'riskIp'].forEach(id => { document.getElementById(id).innerHTML = '<span class="tag tag-danger">Cloudflare 接口不可达</span>'; });
    ['ipGeo', 'coloSub', 'protoSub'].forEach(id => { document.getElementById(id).textContent = ''; });
    document.getElementById('connContent').innerHTML = '<div class="cf-note">无法访问 cdn-cgi/trace，通常是浏览器插件或代理拦截了 Cloudflare 接口。</div>';
    document.getElementById('profileContent').innerHTML = '';
    document.getElementById('riskPill').innerHTML = '<span class="risk-pill lv-high"><span class="dot"></span>无法评估</span>';
    document.getElementById('riskGeo').innerHTML = '<div class="loc">Cloudflare 接口不可达</div>';
    runCompare();
    return;
  }
  state.self = o; state.ip = o.ip; state.coloSelf = o.colo;
  if (isIPv6(o.ip)) document.getElementById('ipv6Warn').style.display = 'block';
  document.getElementById('ipAddr').innerHTML = `${o.loc ? flagImg(o.loc) : ''} ${linkIP(o.ip)}`;
  document.getElementById('riskIp').innerHTML = `${o.loc ? flagImg(o.loc) : ''} ${linkIP(o.ip)}`;
  setGeoText('ipGeo', '归属查询中...');
  const c = coloInfo(o.colo);
  document.getElementById('coloBig').innerHTML = coloHtml(o.colo, true);
  document.getElementById('coloSub').textContent = c.cc ? `${ccZh(c.cc)} · ${c.city} 数据中心 · 代码 ${c.code}` : `节点代码 ${o.colo || '未知'}`;
  const w = (o.warp || 'off').toLowerCase();
  document.getElementById('warpBig').innerHTML = w === 'off' ? tag('WARP 未启用', 'tag-safe') : tag(warpLabel(w), 'tag-warn');
  document.getElementById('protoSub').textContent = `${httpLabel(o.http)} · ${tlsLabel(o.tls)} · ${sniLabel(o.sni)}`;
  renderConn(o);
  saveColoHistory(o);
  applyMask();
  runCompare();
  loadRisk(false);
  try {
    const r = await fetch(`/api/geoip/${o.ip}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const g = await r.json(); state.geo = g;
      const geo = [g.country, g.region, g.city, g.isp].filter(Boolean).join(' ');
      document.getElementById('ipAddr').innerHTML = `${flagImg(g.country_code || o.loc || '')} ${linkIP(o.ip)}`;
      setGeoText('ipGeo', geo);
      applyMask();
    } else setGeoText('ipGeo', '');
  } catch (e) { setGeoText('ipGeo', ''); }
  renderProfile(o);
}

function renderConn(o) {
  const c = coloInfo(o.colo);
  const rows = [
    row('节点代码', `<b>${c.code || '未知'}</b>`),
    row('数据中心', c.code ? `${c.zh}${c.zh !== c.city ? '（' + c.city + '）' : ''}` : '未知'),
    row('节点所在地', c.cc ? `${flagImg(c.cc)} ${ccZh(c.cc)}` : '未知'),
    row('出口 IP 定位', o.loc ? `${flagImg(o.loc)} ${ccZh(o.loc)}` : '未知'),
    row('访问协议', httpLabel(o.http)),
    row('TLS 版本', tlsLabel(o.tls)),
    row('SNI', sniLabel(o.sni)),
    row('密钥交换', o.kex ? `<span class="dev-long">${o.kex}</span>` : '未知'),
    row('WARP', warpLabel(o.warp)),
    row('Zero Trust 网关', (o.gateway || 'off') === 'on' ? tag('已启用', 'tag-info') : '未启用'),
    row('边缘服务器时间', o.ts ? new Date(parseFloat(o.ts) * 1000).toLocaleString('zh-CN', { hour12: false }) : '未知'),
  ];
  document.getElementById('connContent').innerHTML = rows.join('');
}

function renderProfile(o) {
  const c = coloInfo(o.colo);
  const g = state.geo || {}, lk = state.look || {};
  const asn = lk.asn || '';
  const asnNum = parseInt(String(asn).replace(/^AS/i, ''), 10);
  const isCfIp = asnNum === 13335 || (o.warp || 'off') !== 'off';
  const sameRegion = c.cc && o.loc && c.cc.toUpperCase() === o.loc.toUpperCase();
  const nearby = { HK: ['HKG', 'SZX', 'CAN', 'MFM'], CN: ['HKG', 'TPE', 'NRT', 'KIX', 'ICN', 'SIN'], TW: ['TPE', 'KHH', 'HKG'], JP: ['NRT', 'KIX', 'FUK', 'OKA'], SG: ['SIN', 'KUL', 'CGK'], MO: ['MFM', 'HKG'], KR: ['ICN', 'NRT'], MY: ['KUL', 'SIN'] };
  const near = sameRegion || (nearby[(o.loc || '').toUpperCase()] || []).includes(c.code);
  const ts = typeof lk.trust_score === 'number' ? lk.trust_score : null;
  const rows = [
    row('出口是否 Cloudflare IP', isCfIp ? tag('是（WARP / Cloudflare 代理）', 'tag-warn') : tag('否', 'tag-safe')),
    row('出口 ASN', asn ? `<span class="dev-long">AS${String(asn).replace(/^AS/i, '')} ${lk.asOrganization || lk.asname || g.isp || ''}</span>` : (state.look ? '未知' : '查询中...')),
    row('出口 IP 纯净度', ts !== null ? `<a href="/ip/${encodeURIComponent(o.ip)}" target="_blank" rel="noopener" title="查看 ${o.ip} 的 IP 评分" style="text-decoration:none;color:inherit">${ts} / 100 ${tag(scoreLabel(ts).text, scoreLabel(ts).cls)}</a>` : (state.look ? '未知' : '查询中...')),
    row('节点与出口地区', c.code ? (near ? tag('就近接入', 'tag-safe') : tag('跨区接入', 'tag-warn')) : tag('未知')),
    row('HTTP/3（QUIC）', httpLabel(o.http) === 'HTTP/3' ? tag('已启用', 'tag-safe') : tag('未启用', 'tag-neutral')),
    row('TLS 1.3', /1\.3/.test(o.tls || '') ? tag('是', 'tag-safe') : tag(tlsLabel(o.tls), 'tag-warn')),
    row('加密 SNI（ECH）', (o.sni || '') === 'encrypted' ? tag('已启用', 'tag-safe') : tag('未启用', 'tag-neutral')),
    row('IP 版本', isIPv6(o.ip) ? tag('IPv6', 'tag-info') : tag('IPv4', 'tag-info')),
  ];
  document.getElementById('profileContent').innerHTML = rows.join('');
}
function scoreLabel(t) {
  if (t >= 95) return { text: '极度纯净', cls: 'tag-safe' };
  if (t >= 80) return { text: '纯净', cls: 'tag-safe' };
  if (t >= 50) return { text: '良好', cls: 'tag-info' };
  if (t >= 25) return { text: '中性', cls: 'tag-warn' };
  return { text: '可疑', cls: 'tag-danger' };
}

// ===== 环境风险评估(本站等效 Bot Management:多源 IP 情报 + Cloudflare 连接特征) =====
let riskLoading = false;
async function loadRisk(force) {
  if (!state.ip || riskLoading) return;
  riskLoading = true;
  const btn = document.getElementById('btnRisk'); btn.disabled = true;
  if (force) {
    document.getElementById('riskPill').innerHTML = '<span class="risk-pill lv-mid"><span class="dot"></span>风险指数：计算中</span>';
    document.querySelectorAll('#riskList .risk-value').forEach(el => { el.innerHTML = '<span class="sig sig-na">检测中</span>'; });
  }
  try {
    const r = await fetch(`/api/ip/lookup/${encodeURIComponent(state.ip)}`, { signal: AbortSignal.timeout(20000), cache: force ? 'no-store' : 'default' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json(); state.look = d;
    renderRisk(d);
    renderProfile(state.self);
  } catch (e) {
    document.getElementById('riskPill').innerHTML = '<span class="risk-pill lv-mid"><span class="dot"></span>暂时无法评估</span>';
    document.getElementById('riskGeo').innerHTML = '<div class="loc">情报接口暂时不可用，请稍后刷新</div>';
    document.querySelectorAll('#riskList .risk-value').forEach(el => { el.innerHTML = '<span class="sig sig-na">未知</span>'; });
  }
  btn.disabled = false; riskLoading = false;
}
function renderRisk(d) {
  const o = state.self || {};
  const warpOn = (o.warp || 'off') !== 'off';
  const ts = typeof d.trust_score === 'number' ? d.trust_score : 50;
  let risk = 100 - ts;
  if (warpOn) risk += 10;
  if (d.is_tor) risk = Math.max(risk, 90);
  if (d.is_proxy) risk = Math.max(risk, 75);
  if (d.is_abuser) risk = Math.max(risk, 70);
  risk = Math.max(0, Math.min(100, Math.round(risk)));
  const lv = risk < 30 ? 'low' : risk < 60 ? 'mid' : 'high';
  const lvText = risk < 30 ? '环境干净' : risk < 60 ? '存在风险特征' : '高风险';
  document.getElementById('riskPill').innerHTML = `<span class="risk-pill lv-${lv}"><span class="dot"></span>风险指数：<span class="num">${risk}</span> / 100 · ${lvText}</span>`;
  const cc = (d.countryCode || o.loc || '').toUpperCase();
  const loc = [d.region, d.city].filter(Boolean).join(' · ') || '—';
  const isp = [d.isp, d.company_name && d.company_name !== d.isp ? d.company_name : ''].filter(Boolean).join(' / ');
  document.getElementById('riskGeo').innerHTML = `<div class="cc">${flagImg(cc)}${cc || '未知'} <span style="font-size:0.72em;font-weight:500;color:var(--text-soft)">${ccZh(cc)}</span></div><div class="loc">${loc}</div><div class="isp">${isp || ''}${d.is_datacenter ? '（机房网络）' : d.isResidential ? '（住宅网络）' : ''}</div>`;
  const anyProxy = !!(d.is_proxy || d.is_vpn);
  const ctype = (d.company_type || '').toLowerCase();
  const signals = [
    !!d.is_proxy,
    anyProxy && (d.isResidential === true || ctype === 'isp'),
    anyProxy && ctype === 'business',
    !!d.is_vpn,
    !!d.is_tor,
    !!d.is_datacenter,
    !!d.is_abuser,
  ];
  const cells = document.querySelectorAll('#riskList .risk-value');
  signals.forEach((v, i) => { if (cells[i]) cells[i].innerHTML = sig(v); });
  const hits = ['公开代理', '住宅代理', '企业代理', 'VPN', 'Tor', '机房 IP', '滥用记录'].filter((_, i) => signals[i]);
  document.getElementById('riskNote').innerHTML = hits.length
    ? `检测到 <b>${hits.join('、')}</b> 特征。信誉基础分 ${ts}/100${warpOn ? '，且当前经 WARP 出口' : ''}；访问接入 Cloudflare 的站点时更容易遇到人机验证，下方 Turnstile 结果可以直接印证。`
    : `未检测到代理、VPN、Tor 与滥用特征，信誉基础分 ${ts}/100${warpOn ? '，但当前经 WARP 出口，Cloudflare 站点风控会更严格' : ''}。`;
}

// ===== 人机验证:Turnstile 双模式 + reCAPTCHA v3 =====
const TS = { ni: { id: null, key: '', t0: 0, interactive: false, box: 'tsBoxNi', st: 'tsNiState', sv: 'tsNiServer', tm: 'tsNiTime', vd: 'tsNiVerdict', tk: 'tsNiToken', mode: 'non-interactive' },
             mg: { id: null, key: '', t0: 0, interactive: false, box: 'tsBoxMg', st: 'tsMgState', sv: 'tsMgServer', tm: 'tsMgTime', vd: 'tsMgVerdict', tk: 'tsMgToken', mode: 'managed' } };
let RC = { key: '', ready: false };
function verdict(id, cls, title, text) { const el = document.getElementById(id); el.className = 'verdict ' + cls; el.innerHTML = `<b>${title}</b>${text}`; }
async function serverVerify(provider, mode, token) {
  const r = await fetch('/api/captcha/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, mode, token }), signal: AbortSignal.timeout(15000), cache: 'no-store' });
  return r.json();
}
function tsOnToken(k, token) {
  const c = TS[k]; const dt = Date.now() - c.t0;
  document.getElementById(c.st).innerHTML = tag('校验成功', 'tag-safe');
  document.getElementById(c.tk).textContent = token;
  document.getElementById(c.sv).innerHTML = tag('验证中', 'tag-neutral');
  serverVerify('turnstile', c.mode, token).then(j => {
    if (!j.ok) { document.getElementById(c.sv).innerHTML = tag('未配置', 'tag-neutral'); return; }
    document.getElementById(c.sv).innerHTML = j.success ? '<span style="color:#1b8a2d;font-weight:700">PASS ✅</span>' : `<span style="color:#c62828;font-weight:700">FAIL</span> <span style="font-size:0.8em;color:var(--text-muted)">${(j.error_codes || []).join(',')}</span>`;
    document.getElementById(c.tm).textContent = j.elapsed_ms + ' ms';
    state.tsResult[k] = { success: j.success, interactive: c.interactive, dt };
    if (!j.success) { verdict(c.vd, 'bad', '服务端校验失败', 'Cloudflare 拒绝了这个 token，通常是环境异常或 token 已过期，请重置后再试。'); return; }
    if (k === 'ni') verdict(c.vd, 'ok', '智能无感通过！', '无需任何用户交互，后台静默校验成功。');
    else if (c.interactive) verdict(c.vd, 'mid', '需要点击验证（良好）', '托管模式要求你点了一次确认才通过：浏览器环境整体正常，但存在少量可疑特征，Cloudflare 未完全信任当前环境。');
    else verdict(c.vd, 'ok', '智能无感通过！', 'Managed 模式表现极佳，Cloudflare 自动判定安全，免除了用户点击，体验完美。');
  }).catch(() => { document.getElementById(c.sv).innerHTML = tag('校验接口超时', 'tag-warn'); });
}
function tsOnError(k, code) {
  const c = TS[k];
  document.getElementById(c.st).innerHTML = tag('校验失败', 'tag-danger');
  document.getElementById(c.tm).textContent = (Date.now() - c.t0) + ' ms';
  verdict(c.vd, 'bad', '无法通过（较差）', `Turnstile 返回错误 ${code || ''}。通常意味着浏览器指纹异常、自动化特征明显或网络信誉较低，访问很多站点会频繁遇到验证码。`);
}
function tsRender(k) {
  const c = TS[k]; if (!c.key || typeof turnstile === 'undefined') return;
  const box = document.getElementById(c.box); box.innerHTML = '';
  c.t0 = Date.now(); c.interactive = false;
  document.getElementById(c.st).innerHTML = tag('校验中', 'tag-neutral');
  document.getElementById(c.sv).textContent = '—'; document.getElementById(c.tm).textContent = '—'; document.getElementById(c.tk).textContent = '—';
  verdict(c.vd, 'wait', '校验中', 'Turnstile 正在评估当前浏览器与网络环境...');
  c.id = turnstile.render(box, {
    sitekey: c.key, theme: siteTheme(), language: 'zh-cn', action: 'cf_env_check',   // 跟站内主题(data-theme 或系统偏好),不用 auto:auto 只看系统偏好,站内切暗色时小组件仍是白的
    callback: t => tsOnToken(k, t),
    'error-callback': code => { tsOnError(k, code); return true; },
    'expired-callback': () => { document.getElementById(c.st).innerHTML = tag('token 已过期', 'tag-warn'); },
    'before-interactive-callback': () => { c.interactive = true; document.getElementById(c.st).innerHTML = tag('需要点击确认', 'tag-warn'); },
    'unsupported-callback': () => { tsOnError(k, 'unsupported'); },
  });
}
function siteTheme() {
  const a = document.documentElement.getAttribute('data-theme');
  if (a === 'dark' || a === 'light') return a;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
let _tsTheme = null;
function tsRerenderOnTheme() {                  // 站内切换主题 → 两个小组件按新主题重画(只在主题真的变了时)
  const t = siteTheme(); if (t === _tsTheme) return; _tsTheme = t;
  ['ni', 'mg'].forEach(k => { if (TS[k].id !== null) tsReset(k); });
}
new MutationObserver(tsRerenderOnTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', tsRerenderOnTheme);
function tsReset(k) { const c = TS[k]; if (c.id !== null && typeof turnstile !== 'undefined') { try { turnstile.remove(c.id); } catch (e) {} c.id = null; } tsRender(k); }
window.__cfTsReady = function () { _tsTheme = siteTheme(); tsRender('ni'); tsRender('mg'); };

function rcSetup() {
  if (!RC.key) return;
  document.getElementById('rcCard').style.display = '';
  const s = document.createElement('script'); s.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(RC.key); s.async = true;
  s.onload = () => { grecaptcha.ready(() => { RC.ready = true; document.getElementById('rcEngine').innerHTML = tag('Google 安全引擎已就绪', 'tag-safe'); }); };
  s.onerror = () => { document.getElementById('rcEngine').innerHTML = tag('无法加载 Google 脚本（可能被拦截）', 'tag-danger'); };
  document.head.appendChild(s);
}
async function rcRun() {
  if (!RC.ready) { document.getElementById('rcState').innerHTML = tag('引擎未就绪', 'tag-warn'); return; }
  const btn = document.getElementById('btnRc'); btn.disabled = true;
  document.getElementById('rcState').innerHTML = tag('评分中', 'tag-neutral');
  const t0 = Date.now();
  try {
    const token = await grecaptcha.execute(RC.key, { action: 'cf_env_check' });
    const j = await serverVerify('recaptcha', 'v3', token);
    document.getElementById('rcTime').textContent = (Date.now() - t0) + ' ms';
    if (!j.ok || !j.success) { document.getElementById('rcState').innerHTML = tag('校验失败', 'tag-danger'); document.getElementById('rcScore').textContent = '—'; verdict('rcVerdict', 'bad', '校验失败', 'Google 未接受这次评分请求：' + ((j.error_codes || []).join(',') || j.error || '未知原因')); btn.disabled = false; return; }
    const sc = typeof j.score === 'number' ? j.score : 0;
    document.getElementById('rcState').innerHTML = tag('校验成功', 'tag-safe');
    document.getElementById('rcScore').textContent = sc.toFixed(1);
    document.querySelectorAll('#rcScale tr').forEach(tr => tr.classList.remove('on'));
    const trs = [...document.querySelectorAll('#rcScale tr')]; const hit = trs.find(tr => sc >= parseFloat(tr.dataset.min)); if (hit) hit.classList.add('on');
    if (sc >= 0.7) verdict('rcVerdict', 'ok', sc >= 0.9 ? '极佳：环境非常干净' : '良好：环境可信度较高', `Google 可信分数 ${sc.toFixed(1)}，浏览器指纹和网络环境表现良好，绝大多数场景不会遇到验证码。`);
    else if (sc >= 0.5) verdict('rcVerdict', 'mid', '一般：存在一定风险特征', `Google 可信分数 ${sc.toFixed(1)}，部分严格的站点可能要求二次验证。`);
    else verdict('rcVerdict', 'bad', '较差：容易被识别为异常流量', `Google 可信分数 ${sc.toFixed(1)}，注册、登录类操作容易触发图片验证甚至被拒。`);
  } catch (e) {
    document.getElementById('rcState').innerHTML = tag('执行失败', 'tag-danger');
    verdict('rcVerdict', 'bad', '执行失败', '浏览器无法完成 reCAPTCHA 请求，常见于 Google 域名被拦截。');
  }
  btn.disabled = false;
}
function rcReset() { document.getElementById('rcState').innerHTML = tag('等待触发', 'tag-neutral'); document.getElementById('rcScore').textContent = '—'; document.getElementById('rcTime').textContent = '—'; verdict('rcVerdict', 'wait', '等待触发', '点击「开始校验」后由 Google 静默评分。'); document.querySelectorAll('#rcScale tr').forEach(tr => tr.classList.remove('on')); }
(async function captchaInit() {
  try {
    const cfg = await (await fetch('/api/captcha/config', { signal: AbortSignal.timeout(6000) })).json();
    TS.ni.key = (cfg.turnstile || {})['non-interactive'] || '';
    TS.mg.key = (cfg.turnstile || {})['managed'] || '';
    RC.key = (cfg.recaptcha || {}).sitekey || '';
  } catch (e) {}
  if (TS.ni.key || TS.mg.key) {
    const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__cfTsReady'; s.async = true; s.defer = true;
    s.onerror = () => { ['ni', 'mg'].forEach(k => { document.getElementById(TS[k].box).innerHTML = '<span style="font-size:0.85em;color:#c62828">无法加载 Turnstile 脚本（challenges.cloudflare.com 被拦截）</span>'; tsOnError(k, 'load'); }); };
    document.head.appendChild(s);
  } else {
    document.getElementById('tsGrid').style.display = 'none';
  }
  rcSetup();
})();

// ===== 节点等级对比 =====
const COMPARE_TARGETS = [
  { name: 'Cloudflare 免费站', domain: 'ip.net.coffee', tier: '免费版', tcls: 'free', icon: '/favicon-32.png?v=8', note: '普通免费套餐' },
  { name: 'cloudflare.com', domain: 'www.cloudflare.com', tier: '企业版', tcls: 'ent', icon: '/favicons/cloudflare.webp', note: 'Cloudflare 官网' },
  { name: 'openai.com', domain: 'openai.com', tier: '企业版', tcls: 'ent', icon: '/favicons/openai.webp', note: 'ChatGPT 所属站点' },
  { name: 'discord.com', domain: 'gateway.discord.gg', tier: '企业版', tcls: 'ent', icon: '/favicons/discord.webp', note: 'Discord 网关' },
  { name: '1.1.1.1', domain: '1.1.1.1', tier: 'WARP / DNS 网络', tcls: '', icon: '/favicons/cloudflare.webp', note: 'WARP 与公共 DNS 使用的网络' },
  { name: 'speed.cloudflare.com', domain: 'speed.cloudflare.com', tier: '测速网络', tcls: '', icon: '/favicons/cloudflare.webp', note: '官方测速服务' },
  { name: 'cdnjs.cloudflare.com', domain: 'cdnjs.cloudflare.com', tier: '静态资源 CDN', tcls: '', icon: '/favicons/cdnjs.webp', note: '' },
  { name: 'workers.cloudflare.com', domain: 'workers.cloudflare.com', tier: 'Workers 平台', tcls: '', icon: '/favicons/cloudflare.webp', note: '' },
];
let compareRunning = false;
function msClass(ms) { return ms < 80 ? 'ms-good' : ms < 200 ? 'ms-ok' : 'ms-bad'; }
async function runCompare() {
  if (compareRunning) return;
  compareRunning = true;
  const btn = document.getElementById('btnCompare'); btn.disabled = true;
  const tb = document.getElementById('compareBody');
  tb.innerHTML = COMPARE_TARGETS.map((t, i) => `<tr id="cmp-${i}"><td class="site"><img src="${t.icon}" alt="${t.name}" onerror="this.style.display='none'">${t.name}<small>${t.note || '&nbsp;'}</small></td><td><span class="tier ${t.tcls}">${t.tier}</span></td><td class="colo"><span class="loading-bar" style="width:90px"></span></td><td class="ms"><span class="loading-bar" style="width:50px"></span></td><td><span class="loading-bar" style="width:50px"></span></td></tr>`).join('');
  document.getElementById('compareNote').textContent = '正在测试，每个站点预热 1 次后取 3 次最小值...';
  const results = [];
  await Promise.all(COMPARE_TARGETS.map(async (t, i) => {
    const tr = document.getElementById(`cmp-${i}`);
    try {
      await trace(t.domain);
      let best = Infinity, o = null;
      for (let k = 0; k < 3; k++) { const r = await timedTrace(t.domain); if (r.ms < best) { best = r.ms; o = r.o; } }
      results[i] = { t, o, ms: best };
      tr.children[2].innerHTML = coloHtml(o.colo);
      tr.children[3].innerHTML = `<span class="${msClass(best)}">${best} ms</span>`;
      tr.children[4].textContent = httpLabel(o.http);
    } catch (e) {
      results[i] = { t, err: true };
      tr.children[2].innerHTML = '<span class="tag tag-danger">不可达</span>';
      tr.children[3].textContent = '—';
      tr.children[4].textContent = '—';
    }
  }));
  const ok = results.filter(r => r && !r.err);
  const maxMs = Math.max(...ok.map(r => r.ms), 1);
  ok.forEach(r => { const i = results.indexOf(r); const cell = document.getElementById(`cmp-${i}`).children[3]; cell.innerHTML += `<span class="lat-bar" style="width:${Math.max(6, Math.round(120 * r.ms / maxMs))}px;background:${r.ms < 80 ? '#6fcf7c' : r.ms < 200 ? '#f0c040' : '#e17055'}"></span>`; });
  const self = results[0] && !results[0].err ? results[0] : null;
  const ent = ok.filter(r => r.t.tcls === 'ent');
  const colos = [...new Set(ok.map(r => r.o.colo))];
  let note = '';
  if (!ok.length) note = '所有 Cloudflare 站点都不可达，请检查网络或浏览器插件。';
  else if (colos.length === 1) note = `这条线路下所有等级的站点都命中同一个节点 <b>${colos[0]} ${coloInfo(colos[0]).zh}</b>，没有被差异化调度，属于理想状态。`;
  else {
    const parts = colos.map(c => `<b>${c} ${coloInfo(c).zh}</b>（${ok.filter(r => r.o.colo === c).map(r => r.t.name).join('、')}）`);
    note = `这条线路命中了 ${colos.length} 个不同节点：${parts.join('；')}。`;
    if (self && ent.length) {
      const entBest = ent.reduce((a, b) => a.ms < b.ms ? a : b);
      if (self.o.colo !== entBest.o.colo) note += ` 免费版站点被调度到 <b>${self.o.colo}</b>，企业版命中 <b>${entBest.o.colo}</b>，延迟相差 <b>${Math.abs(self.ms - entBest.ms)} ms</b>，这就是套餐等级带来的差异。`;
    }
  }
  document.getElementById('compareNote').innerHTML = note;
  btn.disabled = false; compareRunning = false;
}

// ===== 边缘测速(2026-09-16 v2:浏览器直连 speed.cloudflare.com,自适应分级,与本站服务器无关) =====
// 下载 1MB 预热(不计) → 10 → 25 → 64 → 200 MB(合计 300 MB),累计有效测量 ≥10s 或达上限即停;上传 1MB 预热 → 5 → 10 → 34 MB(合计 50 MB),≥8s 或达上限即停(2026-09-16 用户定稿)。
// 每一级取"去掉前 15% 慢启动后的平均速率",各级取最高值,避免小文件被 TCP 慢启动拉低。
let speedRunning = false;
const SPEED_DL = [10e6, 25e6, 64e6, 200e6], SPEED_UL = [5e6, 10e6, 34e6];   // 含 1MB 预热:下载合计 300 MB,上传合计 50 MB
function rateFromSamples(samples) {           // samples: [{t(ms), b(累计字节)}]
  if (samples.length < 4) return 0;
  const total = samples[samples.length - 1].t - samples[0].t;
  const cut = samples[0].t + total * 0.15;
  const from = samples.find(x => x.t >= cut) || samples[0];
  const last = samples[samples.length - 1];
  const dt = (last.t - from.t) / 1000;
  return dt > 0.05 ? (last.b - from.b) * 8 / dt / 1e6 : 0;
}
async function dlOnce(bytes, onProgress) {
  const r = await fetch('https://speed.cloudflare.com/__down?bytes=' + bytes, { cache: 'no-store', signal: AbortSignal.timeout(60000) });
  const reader = r.body.getReader(); const samples = [{ t: performance.now(), b: 0 }]; let got = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; got += value.length; samples.push({ t: performance.now(), b: got }); if (onProgress) onProgress(got, samples); }
  return { bytes: got, ms: samples[samples.length - 1].t - samples[0].t, rate: rateFromSamples(samples) };
}
async function ulOnce(bytes) {
  const t0 = performance.now();
  await fetch('https://speed.cloudflare.com/__up', { method: 'POST', body: new Blob([new Uint8Array(bytes)]), cache: 'no-store', signal: AbortSignal.timeout(60000) });
  const ms = performance.now() - t0;
  return { bytes, ms, rate: bytes * 8 / (ms / 1000) / 1e6 };
}
async function runSpeed() {
  if (speedRunning) return;
  speedRunning = true;
  const btn = document.getElementById('btnSpeed'); btn.disabled = true;
  const note = document.getElementById('speedNote');
  const set = (id, v) => { document.getElementById(id).textContent = v; };
  set('spDown', '...'); set('spUp', '...'); set('spRtt', '...');
  let colo = '', used = 0;
  const mb = n => (n / 1e6).toFixed(0);
  try {
    const warm = await fetch('https://speed.cloudflare.com/__down?bytes=1000000', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    await warm.arrayBuffer(); used += 1e6;
    colo = warm.headers.get('cf-meta-colo') || '';
    if (!colo) { try { colo = (await trace('speed.cloudflare.com')).colo || ''; } catch (e) {} }
    const m = (warm.headers.get('server-timing') || '').match(/rtt=(\d+)/);
    set('spRtt', m ? (parseInt(m[1], 10) / 1000).toFixed(1) : '—');
    const cname = colo ? colo + ' ' + coloInfo(colo).zh : '未知';
    // 下载:分级,累计有效测量 6s 或跑完 100MB 即停
    let best = 0, measured = 0;
    for (const sz of SPEED_DL) {
      note.textContent = `测速节点 ${cname}，下载 ${mb(sz)} MB 中...`;
      const r = await dlOnce(sz, (got, samples) => { const live = rateFromSamples(samples); if (live > 0) set('spDown', live.toFixed(1)); });
      used += r.bytes; measured += r.ms; best = Math.max(best, r.rate);
      set('spDown', best.toFixed(1));
      if (measured >= 10000) break;
    }
    // 上传:分级,累计 5s 或跑完 25MB 即停
    let bestUp = 0, measuredUp = 0;
    try {
      await ulOnce(1e6); used += 1e6;                         // 预热
      for (const sz of SPEED_UL) {
        note.textContent = `测速节点 ${cname}，上传 ${mb(sz)} MB 中...`;
        const r = await ulOnce(sz); used += r.bytes; measuredUp += r.ms; bestUp = Math.max(bestUp, r.rate);
        set('spUp', bestUp.toFixed(1));
        if (measuredUp >= 8000) break;
      }
    } catch (e) { if (!bestUp) set('spUp', '—'); }
    note.innerHTML = `测速节点 <b>${cname}</b>，本次共传输约 <b>${(used / 1e6).toFixed(0)} MB</b>。由你的浏览器直连 speed.cloudflare.com 分级实测（下载最多 300 MB、上传最多 50 MB，跑够时长自动停止），取各级中去掉慢启动后的最高稳定速率；边缘 RTT 为 Cloudflare 节点侧测得的 TCP 往返时延。与本站服务器无关。`;
  } catch (e) {
    set('spDown', '—'); set('spUp', '—'); set('spRtt', '—');
    note.textContent = '测速失败：speed.cloudflare.com 不可达或被拦截。';
  }
  btn.disabled = false; speedRunning = false;
}

// ===== 节点历史(仅本地) =====
const HIST_KEY = 'cf_colo_history', HIST_MAX = 6;
function getHist() { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { return []; } }
function saveColoHistory(o) {
  try {
    let h = getHist();
    const last = h[0];
    if (!(last && last.ip === o.ip && last.colo === o.colo && Date.now() - last.ts < 10 * 60 * 1000)) {
      h.unshift({ ip: o.ip, colo: o.colo, warp: o.warp || 'off', http: o.http || '', ts: Date.now() });
      h = h.slice(0, HIST_MAX);
      localStorage.setItem(HIST_KEY, JSON.stringify(h));
    }
  } catch (e) {}
  renderHist();
}
function renderHist() {
  const h = getHist(); const el = document.getElementById('historyContent');
  if (!h.length) { el.textContent = '暂无记录'; return; }
  el.innerHTML = h.map(x => `<div class="risk-row"><span class="risk-label" style="font-size:0.82em">${new Date(x.ts).toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span><span class="risk-value" style="font-size:0.85em">${coloHtml(x.colo)} · ${linkIP(x.ip)}${x.warp !== 'off' ? ' · ' + tag('WARP', 'tag-warn') : ''}</span></div>`).join('');
  applyMask();
}
function clearColoHistory() { try { localStorage.removeItem(HIST_KEY); } catch (e) {} renderHist(); }

// ===== 隐藏 IP 开关 =====
const MASK_KEY = 'ip_mask_on';
function maskIpText(t) {
  return (t || '').replace(/\b(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}\b/g, '$1.$2.*.*')
    .replace(/\b([0-9a-fA-F]{1,4}:[0-9a-fA-F]{1,4}:[0-9a-fA-F]{1,4}:[0-9a-fA-F]{1,4})(:[0-9a-fA-F:.]+)/g, '$1:****');
}
function applyMask() {
  const on = (() => { try { return localStorage.getItem(MASK_KEY) === '1'; } catch (e) { return false; } })();
  document.querySelectorAll('.ip-mask-target').forEach(el => {
    if (!el.dataset.orig) el.dataset.orig = el.textContent;
    el.textContent = on ? maskIpText(el.dataset.orig) : el.dataset.orig;
  });
  const cb = document.getElementById('ipMaskToggle'); if (cb) cb.checked = on;
}
document.getElementById('ipMaskToggle').addEventListener('change', function () {
  try { localStorage.setItem(MASK_KEY, this.checked ? '1' : '0'); } catch (e) {}
  applyMask();
});

// ===== 节点速查芯片 =====
(function () {
  const asia = ['HKG', 'NRT', 'KIX', 'SIN', 'ICN', 'TPE', 'KHH', 'MFM', 'MNL', 'KUL', 'BKK', 'CGK', 'SGN', 'BOM', 'SYD'];
  const west = ['LAX', 'SJC', 'SEA', 'DFW', 'ORD', 'IAD', 'EWR', 'YVR', 'LHR', 'FRA', 'AMS', 'CDG', 'MAD', 'ARN', 'DME'];
  const chip = c => { const i = coloInfo(c); return `<span class="colo-chip">${flagImg(i.cc)}<b>${c}</b>${i.zh}</span>`; };
  document.getElementById('coloChipsAsia').innerHTML = asia.map(chip).join('');
  document.getElementById('coloChipsWest').innerHTML = west.map(chip).join('');
})();

renderHist();
main();

