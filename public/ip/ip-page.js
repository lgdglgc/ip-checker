(function(){"use strict";const input=document.getElementById("ip-input");const btn=document.getElementById("search-btn");const out=document.getElementById("result");function isValidIp(v){if(!v||typeof v!=="string")return false;v=v.trim();if(v.length<2||v.length>45)return false;var v4=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(v);if(v4){for(var i=1;i<=4;i++){var part=v4[i];if(part.length>1&&part[0]==="0")return false;var n=+part;if(n<0||n>255)return false;}
return true;}
if(v.indexOf(":")<0)return false;if(v.indexOf("::")!==v.lastIndexOf("::"))return false;var hasCompress=v.indexOf("::")>=0;var parts=v.split(":");if(parts.length<3||parts.length>9)return false;if(!hasCompress&&parts.length!==8)return false;var groups=0;for(var j=0;j<parts.length;j++){var pp=parts[j];if(pp==="")continue;if(!/^[0-9a-fA-F]{1,4}$/.test(pp))return false;groups++;}
if(groups<1||groups>8)return false;return true;}
function redirectToIndex(msg){out.innerHTML='<div class="error-box" style="padding:16px;text-align:center">'
+'<strong>非标准 IP 地址</strong><br>'
+'<span style="color: var(--text-soft);font-size:0.9em">'+escapeHtml(msg||"")+'</span><br>'
+'<span style="color:#999;font-size:0.85em;margin-top:8px;display:inline-block">2 秒后自动返回首页...</span>'
+'</div>';setTimeout(function(){window.location.replace("/ip");},2000);}
const pm=window.location.pathname.match(/^\/ip\/([^\/]+)\/?$/);if(pm){var raw;try{raw=decodeURIComponent(pm[1]);}catch(e){raw=pm[1];}
if(!isValidIp(raw)){redirectToIndex("URL 中的 "+raw+" 不是合法的 IPv4 或 IPv6 地址");return;}
input.value=raw;const can=document.getElementById("canonical");if(can)can.href="https://ip.net.coffee/ip/"+raw;document.title=raw+" IP查询 - 评分/地理/ASN/运营商/风险检测 - Net.Coffee";lookup(raw);}else{getBody().innerHTML='<p class="loading">正在检测当前 IP...</p>';fetch("/cdn-cgi/trace").then(r=>r.text()).then(t=>{const line=t.split("\n").find(l=>l.startsWith("ip="));if(!line)throw new Error("no ip in trace");const ip=line.slice(3).trim();input.value=ip;lookup(ip);}).catch(e=>{getBody().innerHTML='<div class="error-box">未能自动检测 IP：'+e.message+'。请手动输入。</div>';});}
btn.addEventListener("click",handleSearch);input.addEventListener("keydown",function(e){if(e.key==="Enter")handleSearch();});function handleSearch(){const v=(input.value||"").trim();if(!v)return;if(!isValidIp(v)){alert("请输入有效的 IPv4 或 IPv6 地址");return;}
window.location.href="/ip/"+v;}
function renderHead(headHTML){const tmp=document.createElement('div');tmp.innerHTML=headHTML;const newHead=tmp.firstElementChild;if(!newHead)return null;const oldHead=out.querySelector('.ip-head');const sb=(oldHead&&oldHead.querySelector('.search-bar'))||document.querySelector('.container > .search-bar');if(sb)newHead.appendChild(sb);if(oldHead)oldHead.replaceWith(newHead);else out.insertBefore(newHead,out.firstChild);return newHead;}
function getBody(){let body=out.querySelector('.result-body');if(!body){body=document.createElement('div');body.className='result-body';out.appendChild(body);}
return body;}
function lookup(ip){var _ss=document.getElementById("ssr-snapshot");if(_ss&&_ss.parentNode)_ss.parentNode.removeChild(_ss);const _isV6skel=ip.indexOf(':')!==-1;const _ccSkel=_isV6skel?'country no-divider':'country';const skeletonHead=''
+'<div class="ip-head">'
+'<div class="flag flag-skel"></div>'
+'<a class="ip'+(_isV6skel?' is-v6':'')+'" href="/ip/'+encodeURIComponent(ip)+'">'+escapeHtml(ip)+'</a>'
+'<span class="'+_ccSkel+'"><small>正在深度查询中...请稍后...</small></span>'
+'<div class="score-gauge score-mid" style="background: var(--bg-soft);color: var(--text-muted)">'
+'<span class="score-label">IP 评分</span>'
+'<span class="score-num">··</span>'
+'</div>'
+'</div>';const skeletonCard=''
+'<div class="skeleton-card">'
+'<div class="skeleton-line title"></div>'
+'<div class="skeleton-line"></div>'
+'<div class="skeleton-line medium"></div>'
+'<div class="skeleton-line short"></div>'
+'</div>';renderHead(skeletonHead);getBody().innerHTML=''
+'<div class="grid">'+skeletonCard+skeletonCard+'</div>'
+'<div class="grid">'+skeletonCard+skeletonCard+'</div>';window.__lkGen=(window.__lkGen||0)+1;var _myGen=window.__lkGen;function _lkAttempt(isRetry){if(_myGen!==window.__lkGen)return;fetch("/api/ip/lookup/"+encodeURIComponent(ip),{signal:AbortSignal.timeout(45000),cache:"no-store"}).then(function(r){if(r.status===400){var e0=new Error("bad");e0._bad=true;throw e0;}if(!r.ok){var e=new Error("HTTP "+r.status);e._to=true;throw e;}var ct=(r.headers.get("content-type")||"");if(ct.indexOf("json")===-1){var e2=new Error("nonjson");e2._to=true;throw e2;}return r.json();}).then(function(d){if(_myGen!==window.__lkGen)return;render(ip,d);}).catch(function(err){if(_myGen!==window.__lkGen)return;if(err&&err._bad){getBody().innerHTML='<div class="error-box">无效的 IP 地址。</div>';return;}if(!isRetry){var left=15;var paint=function(){if(_myGen!==window.__lkGen)return;getBody().innerHTML='<div class="error-box">查询超时，<b>'+left+'</b> 秒后自动重试一次…<br><span style="font-size:0.85em;opacity:0.75">拼命查询中，请耐心等待</span></div>';};paint();var t=setInterval(function(){if(_myGen!==window.__lkGen){clearInterval(t);return;}left--;if(left<=0){clearInterval(t);getBody().innerHTML='<div class="error-box">正在重试查询…</div>';_lkAttempt(true);}else{paint();}},1000);}else{getBody().innerHTML='<div class="error-box">查询超时，请稍后重试。<br><button type="button" id="lkRetryBtn" style="margin-top:10px;padding:6px 16px;border:1px solid #d0d7de;border-radius:6px;background:#fff;cursor:pointer;font-size:0.9em">重新查询</button></div>';var b=document.getElementById("lkRetryBtn");if(b)b.onclick=function(){lookup(ip);};}});}_lkAttempt(false);}
function render(ip,d){if(d.error&&!d.cidr){getBody().innerHTML='<div class="error-box">'+escapeHtml(d.error)+'</div>';return;}
const _ccName=ccZh(d.countryCode||"",d.country||"");const _flagAlt=(d.ip||ip)+(_ccName?' 归属于'+_ccName+' IP':' 的归属地');const flagHtml=flagImg(d.countryCode||"",{big:true,alt:_flagAlt,title:_flagAlt});const scoreClass=(d.trust_score>=75)?"score-high":(d.trust_score>=45?"score-mid":"score-low");const score=(d.trust_score==null)?"-":d.trust_score;const country=[d.country,d.region,d.city,d.isp].filter(Boolean).join(" ")||"-";const ipStr=d.ip||ip;const isV6=ipStr.indexOf(':')!==-1;const countryClass=isV6?'country no-divider':'country';const head=''
+'<div class="ip-head">'
+'<a class="ip'+(isV6?' is-v6':'')+'" href="/ip/'+encodeURIComponent(ipStr)+'" title="'+escapeHtml(ipStr)+' IP查询与评分">'+escapeHtml(ipStr)+'</a>'
+'<span class="'+countryClass+'" title="'+escapeHtml(country)+'">'
+'<span class="flag flag-country" style="display:inline-flex;vertical-align:middle;margin-right:6px;flex-shrink:0">'+(flagHtml||'<span class="flag-fallback">🌐</span>')+'</span>'
+'<span class="country-text">'+escapeHtml(country)+'</span>'
+'</span>'
+'<div class="score-gauge '+scoreClass+'">'
+'<span class="score-label">IP 评分</span>'
+'<span class="score-num">'+score+'</span>'
+'</div>'
+'</div>';const actions=''
+'<div class="actions">'
+'<a href="/dns/">🔍 DNS 泄露检测</a>'
+'<a href="/webrtc/">🔊 WebRTC 泄露检测</a>'
+'</div>';const contradictCard='';if(d.is_bogon){renderHead(head);getBody().innerHTML=actions
+'<div class="ai-card">'
+'<div class="ai-label">非公网地址</div>'
+'<div class="ai-verdict">'+escapeHtml(d.bogon_reason||"Bogon")+' ('+escapeHtml(d.bogon_rfc||"")+')</div>'
+'<div class="ai-reason">该地址为 IANA 保留/私有/文档用途，不会出现在公网路由中。</div>'
+'</div>';return;}
const flags=[];if(d.is_public_service){flags.push('<span class="chip chip-info">任播 DNS</span>');}else if(d.is_datacenter||d.asn_kind==='hosting'||d.asn_kind==='cdn'||d.company_type==='hosting'||(d.intelligence&&d.intelligence.company_type==='hosting')){flags.push('<span class="chip chip-warn">机房IP</span>');}else{flags.push('<span class="chip chip-ok">家庭住宅IP</span>');}
if(d.is_vpn)flags.push('<span class="chip chip-warn">VPN</span>');if(d.is_proxy)flags.push('<span class="chip chip-warn">Proxy</span>');if(d.is_tor)flags.push('<span class="chip chip-bad">Tor</span>');if(d.is_crawler)flags.push('<span class="chip chip-info">Crawler</span>');if(d.is_abuser)flags.push('<span class="chip chip-warn">历史滥用</span>');if(d.is_mobile)flags.push('<span class="chip chip-info">移动网络</span>');let nativeChipHtml='';const _ccLo=(d.countryCode||'').toLowerCase();const _regLo=(d.registered_country_code||'').toLowerCase();if(!d.is_public_service&&_ccLo&&_regLo){if(_ccLo===_regLo){nativeChipHtml='<div class="kv"><span class="k">IP 原生性</span>'
+'<span class="v"><span class="chip chip-ok">原生 IP</span></span></div>';}else{const _regUp=_regLo.toUpperCase();const _regName=d.registered_country||'';const _tipMore=_regName?(' ('+_regName+')'):'';nativeChipHtml='<div class="kv"><span class="k">IP 原生性</span>'
+'<span class="v"><span class="chip chip-warn">广播 IP ('+escapeHtml(_regUp)+')</span>'
+' <span class="tip-wrap">ⓘ<span class="tip-text">IP注册在 '+escapeHtml(_regUp)+escapeHtml(_tipMore)
+' 和IP归属地 '+escapeHtml((d.country||'').toUpperCase())
+' 不一致，属于常见现象，并不影响使用。</span></span></span></div>';}}
const typeCard=''
+'<div class="card">'
+'<h3>使用场景 / 类型</h3>'
+nativeChipHtml
+'<div class="kv"><span class="k">标记</span><span class="v">'+flags.join("")+'</span></div>'
+'<div class="kv"><span class="k">运营商类型</span><span class="v"><strong'+(((d.company_type||'').toString().toLowerCase()==='isp')?' class="ct-isp"':'')+'>'+escapeHtml(formatCompanyType(d.company_type))+(((d.company_type||'').toString().toLowerCase()==='isp'&&d.is_mobile)?'（Mobile）':'')+'</strong></span></div>'
+'<div class="kv"><span class="k">人机流量</span><span class="v">'+(d.is_public_service?'<span class="ht-pill ht-pill-satellite"><svg><use href="#htp-satellite"/></svg><span>服务器/任播 DNS</span></span>':d.is_crawler?'<span class="ht-pill ht-pill-crawler"><svg><use href="#htp-crawler"/></svg><span>偏爬虫</span></span>':d.is_datacenter?'<span class="ht-pill ht-pill-robot"><svg><use href="#htp-robot"/></svg><span>机器偏多</span></span>':'<span class="ht-pill ht-pill-human"><svg><use href="#htp-human"/></svg><span>人类偏多</span></span>')+'</span></div>'
+'<div class="kv"><span class="k">ASN归属</span><span class="v" style="font-weight:400" title="'+escapeHtml(d.asOrganization||d.company_name||"-")+'"><span class="trunc">'+escapeHtml(d.asname||d.asOrganization||d.company_name||"-")+'</span></span></div>'
+(function(){const _co=d.datacenter_name||d.company_name||(d.is_datacenter?"未知机房":"-");return'<div class="kv"><span class="k">企业信息</span><span class="v" style="font-weight:400" title="'+escapeHtml(_co)+'"><span class="trunc">'+escapeHtml(_co)+'</span></span></div>';})()
+(function(){const _isp=((d.isp||'').trim()||(d.company_name||'').trim()||(d.asOrganization||'').trim()||(d.datacenter_name||'').trim()||'-');return'<div class="kv"><span class="k">服务商</span><span class="v" style="font-weight:400" title="'+escapeHtml(_isp)+'"><span class="trunc">'+escapeHtml(_isp)+'</span></span></div>';})()
+'</div>';const r=d.range||{};const rangeStr=(r.first&&r.last)?(r.first+" - "+r.last):"-";const countStr=r.count?r.count.toLocaleString():"-";const asnCard=''
+'<div class="card">'
+'<h3>ASN / 运营商</h3>'
+'<div class="kv"><span class="k">ASN</span><span class="v" style="font-weight:400">AS'+escapeHtml(String(d.asn||"-"))+''+(d.asn?copyBtn('AS'+d.asn):'')+'</span></div>'
+'<div class="kv"><span class="k">CIDR<span class="tip-wrap">ⓘ<span class="tip-text">无类别域间路由记法，表示 IP 所属的地址块范围。斜杠后数字越小，段越大（如 /24 = 256 个 IP，/16 = 65536 个 IP）。</span></span></span><span class="v" style="font-weight:400">'+escapeHtml(d.cidr||"-")+(d.cidr?copyBtn(d.cidr):'')+'</span></div>'
+(function(){const kind=d.asn_kind||"-";const KIND_CN={hosting:'机房/托管',mobile:'移动网络',residential:'住宅宽带',backbone:'骨干网',isp:'运营商',cdn:'CDN 内容分发',business:'商业专线',mixed:'混合',unknown:'未知',};const _cn=KIND_CN[(kind||'').toLowerCase()];const conflict=d.is_datacenter&&/residential|isp/i.test(kind);const _greenRes=!conflict&&(kind||'').toLowerCase()==='residential';const kindDisplay=(_greenRes?'<span class="asn-residential">'+escapeHtml(kind)+'</span>':escapeHtml(kind))+(_cn?'<span style="color: var(--text-soft);margin-left:6px;font-weight:400">（'+_cn+'）</span>':'');const tip=conflict?' <span class="tip-wrap">ⓘ<span class="tip-text">ASN 自报为 '+escapeHtml(kind)+'（住宅/ISP 段），但本 IP 被判定为机房IP，请注意斟酌。</span></span>':'';const valStyle=conflict?' style="color:#a13131"':'';return'<div class="kv"><span class="k">ASN 自报类型</span><span class="v"'+valStyle+'>'+kindDisplay+tip+'</span></div>';})()
+'<div class="kv kv-iprange"><span class="k">IP 范围</span><span class="v" style="font-weight:400">'+escapeHtml(rangeStr)+'</span></div>'
+'<div class="kv"><span class="k">ASN IPv4 总量</span><span class="v" style="font-weight:400">'+(d.asn_ipv4_count?d.asn_ipv4_count.toLocaleString():"-")+'</span></div>'
+'<div class="kv"><span class="k">预估带宽</span><span class="v" style="font-weight:400">'+escapeHtml(d.asn_tbps||"-")+'</span></div>'
+'<div class="kv"><span class="k">ASN 注册日期</span><span class="v" style="font-weight:400">'+escapeHtml(d.asn_allocated||"-")+'</span></div>'
+'</div>';const _GEO_RANK={'g1':0,'g7':1,'g3':2,'g2':3};const _gs0=Array.isArray(d.geo_sources)?d.geo_sources:[];const gs=_gs0.slice().sort(function(a,b){const ra=_GEO_RANK[(a&&a.src)||''];const rb=_GEO_RANK[(b&&b.src)||''];return(ra==null?99:ra)-(rb==null?99:rb);});let geoRows='';if(gs.length){geoRows=gs.map(function(r){const loc=[r.country,r.region,r.city].filter(Boolean).join(" / ")||"-";const f=flagImg(r.country_code||"",{alt:ip+' 多源地理定位：'+loc,title:ip+' 多源地理定位：'+loc})||"🌐";const hasCoord=(r.lat!=null&&r.lon!=null);const coord=hasCoord?(r.lat.toFixed(3)+", "+r.lon.toFixed(3)):"";const titleStr=hasCoord?(loc+' · '+coord):loc;const coordHtml=hasCoord?' <a class="muted geo-coord" href="https://www.google.com/maps?q='+r.lat+','+r.lon+'" target="_blank" rel="nofollow noopener" title="在 Google 地图查看" style="font-size:0.82em;margin-left:8px;font-weight:400;color:#888;text-decoration:none;cursor:pointer">经纬度 '+escapeHtml(coord)+'</a>':'';return'<div class="kv kv-wide" title="'+escapeHtml(titleStr)+'">'
+'<span class="k">'+f+'</span>'
+'<span class="v">'+escapeHtml(loc)+coordHtml+'</span>'
+'</div>';}).join("");}else{geoRows='<div class="kv"><span class="muted">无地理数据</span></div>';}
const GP_NODES=[{id:'n01',cc:'cn',name:'上海'},{id:'n02',cc:'hk',name:'香港'},{id:'n03',cc:'jp',name:'东京'},{id:'n04',cc:'sg',name:'新加坡'},{id:'n09',cc:'us',name:'洛杉矶'},{id:'n11',cc:'ca',name:'温哥华'},{id:'n13',cc:'de',name:'法兰克福'},{id:'n15',cc:'fr',name:'巴黎'},];const gpCells=GP_NODES.map(function(n,i){const src=(n.cc==='cn')?'/favicons/cn.png':('/favicons/flags/'+n.cc+'.png');return'<div class="gp-cell">'
+'<span class="gp-head">'
+'<img src="'+src+'" alt="从'+n.name+'到'+escapeHtml(ip)+'的Ping延迟数据" title="从'+n.name+'到'+escapeHtml(ip)+'的Ping延迟数据" width="40" height="27" onerror="this.onerror=null;this.style.display=\'none\'">'
+'<span class="gp-city">'+n.name+'</span>'
+'</span>'
+'<span class="gp-val gp-wait" id="gp-min-'+i+'" title="'+n.name+'节点到'+escapeHtml(ip)+'的最小Ping延迟">测试中</span>'
+'</div>';}).join('');const globalPingCard=''
+'<div class="card">'
+'<h3 style="display:flex;align-items:baseline;justify-content:space-between;gap:12px">'+'<span>全球主要地区延迟测试</span>'+'<a href="/ping/'+encodeURIComponent(ip)+'" target="_blank" rel="noopener" title="从全球多节点探测'+escapeHtml(ip)+'的延迟数据" style="font-size:0.75em;color: var(--text-soft);font-weight:400;text-decoration:none;padding:2px 8px;border: 1px solid var(--border-strong);border-radius:6px">全球Ping</a>'+'</h3>'
+'<div class="gp-grid" id="globalPingGrid">'+gpCells+'</div>'
+'</div>';const geoCard=''
+'<div class="card">'
+'<h3>地理位置（多源对比）</h3>'
+'<div class="geo-rows-grid">'
+geoRows
+'</div>'
+(function(){const _mode=function(arr){const c={};let b='',bv=0;arr.forEach(function(v){if(!v)return;c[v]=(c[v]||0)+1;if(c[v]>bv){bv=c[v];b=v;}});return b;};const _ccList=gs.map(function(r){return (r.country_code||'')+'|'+(r.country||'');});const _ccPick=_mode(_ccList)||'';const _ccParts=_ccPick.split('|');const _cc=_ccParts[0],_cn=_ccParts[1];const _locCands=gs.map(function(r){return [r.region,r.city].filter(Boolean).join(' / ');}).filter(Boolean);let _city='';if(_locCands.length){const _c={};_locCands.forEach(function(v){_c[v]=(_c[v]||0)+1;});const _es=Object.keys(_c).map(function(k){return{v:k,n:_c[k]};});_es.sort(function(a,b){if(b.n!==a.n)return b.n-a.n;return a.v.length-b.v.length;});_city=_es[0].v;if(_city.length>20){const _sh=_locCands.slice().sort(function(a,b){return a.length-b.length;})[0];_city=_sh;}}const _pts=gs.filter(function(r){return r.lat!=null&&r.lon!=null;});let _maxKm=null;if(_pts.length>=2){const _r=6371,_tr=function(d){return d*Math.PI/180;};let _m=0;for(let i=0;i<_pts.length;i++){for(let j=i+1;j<_pts.length;j++){const a=_pts[i],b=_pts[j];const dLat=_tr(b.lat-a.lat),dLon=_tr(b.lon-a.lon);const la1=_tr(a.lat),la2=_tr(b.lat);const h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)*Math.sin(dLon/2);const d2=2*_r*Math.asin(Math.min(1,Math.sqrt(h)));if(d2>_m)_m=d2;}}_maxKm=_m;}if(!_cn&&!_city){return '<div class="muted" style="font-size:0.8em;margin-top:8px;text-align:right">同一 IP 的城市归属如有偏移差异，属正常现象。</div>';}const _flag=_cc?flagImg(_cc):'';const _loc=[_cn,_city].filter(Boolean).map(escapeHtml).join(' / ');let _distFrag='';if(_maxKm!=null){const _num=(_maxKm<10?_maxKm.toFixed(1):Math.round(_maxKm).toString())+' km';const _green=_maxKm<=100;_distFrag='（最大距离偏移 <span style="'+(_green?'color:#0d5c27;font-weight:600':'')+'">'+_num+'</span> 内）';}return '<div class="muted" style="font-size:0.8em;margin-top:8px;text-align:right"><span class="geo-sum-full">综合地理源定位：'+_flag+' '+_loc+_distFrag+'，</span>同一 IP 的城市归属如有偏移差异，属正常现象</div>';})()
+'</div>';const sysCard=''
+'<div class="card">'
+'<h3>技术指标</h3>'
+'<div class="kv"><span class="k">Bogon / 广播<span class="tip-wrap">ⓘ<span class="tip-text">Bogon 是指不应该出现在公网路由上的 IP 段，包括私有地址（10.0.0.0/8、192.168.0.0/16 等）、保留地址、未分配地址。广播 IP 一般指这类不可公网访问或只能用于特殊用途的地址。正常公网 IP 显示否（公网可达）即可。</span></span></span><span class="v">'+(d.is_bogon?'<span class="chip chip-bad">是</span>':'<span class="chip chip-ok">否（公网可达）</span>')+'</span></div>'
+'<div class="kv"><span class="k">反向 DNS</span><span class="v trunc" title="'+escapeHtml(d.rdns||"-")+'">'+escapeHtml(d.rdns||"-")+'</span></div>'
+'<div class="kv" id="portScanRow"><span class="k">开放端口<span class="tip-wrap">ⓘ<span class="tip-text">家宽和纯净落地 IP，建议关闭或修改常见端口如 SSH 22 等端口，防止被深度识别为服务器行为</span></span></span><span class="v" id="portScanCell"><button type="button" class="chip chip-ok" id="portScanBtn" title="检测 '+escapeHtml(ip)+' 的常见 8 个开放端口，点击触发" style="cursor:pointer;border:1px solid #86a;">🔍 检测常见端口</button></span></div>'
+'</div>';const intel=d.intelligence||{threats:[]};const threatChips=(intel.threats||[]).map(function(t){const cls=t.severity==="bad"?"chip-bad":t.severity==="warn"?"chip-warn":t.severity==="info"?"chip-info":"chip-ok";let label=t.label;const m=/^(?:httpBL|信誉)\s*威胁值\s*(\d+)/i.exec(label);if(m){const raw=parseInt(m[1],10);const lv=httpblLevelLabel(raw);label='蜜罐 '+lv.label;return'<span class="chip" style="background:'+lv.bg+';color:'+lv.color+'">'+escapeHtml(label)+'</span>';}
return'<span class="chip '+cls+'">'+escapeHtml(label)+'</span>';}).join("")||'<span class="chip" style="background:#e8f7ee;color:#0d5c27">未发现明显威胁</span>';const intelCard=''
+'<div class="card">'
+'<h3>IP 情报（威胁指标）</h3>'
+'<div class="kv"><span class="k">风险标记</span><span class="v">'+threatChips+'</span></div>'
+(function(){const _m=String(intel.abuser_score_raw||'').match(/^\s*([0-9]*\.?[0-9]+)/);const _rs=_m?parseFloat(_m[1]):null;let _lv=abuserLevelLabel(intel.abuser_level,_rs);const _hasThreat=(intel.threats||[]).length>0;if(_rs!=null&&_rs<=0.025&&_hasThreat){_lv={label:"低风险",color:"#8a6d00",risk:false,extraPure:false};}
const _palette={'极度纯净':{bg:'#e8f7ee',fg:'#0d5c27'},'纯净':{bg:'#e8f7ee',fg:'#0d5c27'},'低风险':{bg:'#fff6e0',fg:'#8a6d00'},'中风险':{bg:'#fff0d6',fg:'#b87700'},'高风险':{bg:'#fcecec',fg:'#a13131'},'极高风险':{bg:'#f8dada',fg:'#8b1a1a'}};const _pal=_palette[_lv.label]||{bg:'#eef0f3',fg:'#6a737d'};const _wt=_lv.extraPure?'font-weight:700;':'';const _mobileTip=(d.is_mobile&&(_lv.label==='低风险'||_lv.label==='中风险'))?' <span class="tip-wrap">ⓘ<span class="tip-text">全球移动蜂窝 IPv4 普遍采用 CGNAT（运营商级 NAT），数千用户共享同一出口 IP，出现'+_lv.label+'提示属于背景噪声，不一定代表你本人有问题。</span></span>':'';return'<div class="kv"><span class="k">滥用等级</span><span class="v"><span class="chip" style="background:'+_pal.bg+';color:'+_pal.fg+';'+_wt+'">'+_lv.label+'</span>'+_mobileTip+'</span></div>';})()
+(function(){const raw=(intel.rep_threat!=null&&intel.rep_threat!==undefined)?intel.rep_threat:intel.httpbl_threat;const lv=httpblLevelLabel(raw);const tip='<span class="tip-wrap">ⓘ<span class="tip-text">HTTP 蜜罐（Honeypot）黑名单是一种基于网络安全诱骗技术产生的威胁情报。包含但不限于追踪评论机器人、内容采集、表单垃圾、暴力破解、扫描、SQL 注入、敏感文件枚举、垃圾邮件发送等恶意行为。威胁值 0-10，越高越危险。</span></span>';const _inner=lv.risk?(lv.label+' · '+normalizeHttpblThreat(raw)+' / 10'):lv.label;const val='<span class="chip" style="background:'+lv.bg+';color:'+lv.color+';font-variant-numeric:tabular-nums">'+_inner+'</span>';return'<div class="kv"><span class="k">HTTP 蜜罐黑名单'+tip+'</span><span class="v">'+val+'</span></div>';})()
+(function(){const st=(d.rpki_status||'').toLowerCase();const tip='<span class="tip-wrap">ⓘ<span class="tip-text">RPKI（Resource Public Key Infrastructure）是 BGP 路由签名机制。ROA（路由起源授权）声明某个 IP 段只能由指定 ASN 对外宣告。Valid = 路由被 ROA 授权、合法；Invalid = 来源 ASN 与 ROA 不符，疑似路由劫持；NotFound = 该前缀没有 ROA 覆盖（互联网大部分段仍是这个状态）。</span></span>';let val;if(st==='valid')val='<span class="chip chip-ok">✓ Valid</span>';else if(st==='invalid')val='<span class="chip chip-bad">✗ Invalid<span class="tip-wrap" style="margin-left:4px">ⓘ<span class="tip-text">Invalid 通常是 ROA 配置过期/疏忽，并不必然代表路由劫持或 IP 不可信；互联网上约 8% 的路由段长期处于此状态。</span></span></span>';else if(st==='notfound')val='<span class="chip" style="background:#f1f3f5;color: var(--text-soft)">NotFound（未声明）</span>';else return'';return'<div class="kv"><span class="k">RPKI 状态'+tip+'</span><span class="v">'+val+'</span></div>';})()
+'</div>';function _deepChip(detected,severity){if(detected===true){const palette={bad:['#fcecec','#a13131'],warn:['#fff6e0','#7a5a00'],info:['#e7f0fc','#1f4d8a']};const p=palette[severity]||palette.warn;return'<span class="chip" style="background:'+p[0]+';color:'+p[1]+';font-weight:700">已检测到</span>';}
if(detected===false){return'<span class="chip" style="background:#e8f7ee;color:#0d5c27;font-weight:700">未检测到</span>';}
return'<span class="muted">暂无数据</span>';}
function _deepRow(label,detected,severity,tipText){const tip=tipText?'<span class="tip-wrap">ⓘ<span class="tip-text">'+escapeHtml(tipText)+'</span></span>':'';return'<div class="kv"><span class="k">'+label+tip+'</span><span class="v">'+_deepChip(detected,severity)+'</span></div>';}
const deepCheckCard=''
+'<div class="card">'
+'<h3>风险深度检测</h3>'
+_deepRow('VPN',d.is_vpn,'warn','')
+_deepRow('代理 (Proxy)',d.is_proxy,'bad','是否为公开的 HTTP / SOCKS 代理，可被任意第三方中转流量。')
+_deepRow('Tor',d.is_tor,'bad','是否为 Tor 匿名网络的出口节点，流量来自 Tor 洋葱路由。')
+_deepRow('爬虫/机器人',d.is_crawler,'info','')
+'</div>';let vpnCard='';if(d.vpn_trace){const vt=d.vpn_trace;vpnCard=''
+'<div class="grid"><div class="card card-full" style="border-color:#f5c2c7">'
+'<h3 style="color:#a13131">VPN 溯源</h3>'
+'<div class="kv"><span class="k">疑似提供方</span><span class="v">'+escapeHtml(vt.provider_name||"-")+'</span></div>'
+'<div class="kv"><span class="k">归属 ASN</span><span class="v trunc" title="AS'+escapeHtml(String(vt.asn||"-"))+' · '+escapeHtml(vt.asn_org||"")+'">AS'+escapeHtml(String(vt.asn||"-"))+' · '+escapeHtml(vt.asn_org||"")+'</span></div>'
+'<div class="kv"><span class="k">出口池 CIDR</span><span class="v">'+escapeHtml(vt.pool_cidr||"-")+'</span></div>'
+'</div></div>';}
const rds=Array.isArray(d.related_domains)?d.related_domains:[];const rdPending=!!d.related_domains_pending;function renderRelatedRows(list){if(!list||!list.length){return'<div class="muted" style="font-size:0.75em;padding:6px 0">暂未发现关联域名</div>';}
function _item(x){return'<div class="rd-item">'
+'<div class="rd-domain" title="'+escapeHtml(x.domain)+' 解析到 '+escapeHtml(ip)+'">'+escapeHtml(x.domain)+'</div>'
+'<div class="rd-via" title="via '+escapeHtml(x.via)+'">via '+escapeHtml(x.via)+'</div>'
+'</div>';}
const LIMIT=9;if(list.length<=LIMIT){return'<div class="rd-grid">'+list.map(_item).join('')+'</div>';}
const visible=list.slice(0,LIMIT).map(_item).join('');const hidden=list.slice(LIMIT).map(_item).join('');const extra=list.length-LIMIT;return'<div class="rd-collapse" data-open="0">'
+'<div class="rd-grid">'+visible+'</div>'
+'<div class="rd-more" style="display:none">'
+'<div class="rd-grid" style="margin-top:8px">'+hidden+'</div>'
+'</div>'
+'<button type="button" class="rd-toggle" '
+'style="margin-top:10px;padding:4px 10px;font-size:0.85em;'
+'background:var(--bg-hover);border:1px solid var(--border-strong);border-radius:6px;cursor:pointer;color:var(--text-soft)" '
+'onclick="(function(b){'
+'var w=b.parentNode;'
+'var more=w.querySelector(\'.rd-more\');'
+'var open=w.getAttribute(\'data-open\')===\'1\';'
+'w.setAttribute(\'data-open\',open?\'0\':\'1\');'
+'more.style.display=open?\'none\':\'\';'
+'b.textContent=open?\'展开全部 ('+extra+' 条)\':\'收起\';'
+'})(this)">'
+'展开全部 ('+extra+' 条)'
+'</button>'
+'</div>';}
let rdRows;if(rdPending){rdRows='<div class="muted" style="display:flex;align-items:center;gap:8px">'
+'<span class="ai-spinner"></span>'
+'正在扫描反向 DNS 邻居（约 3–5 秒）...'
+'</div>';}else{rdRows=renderRelatedRows(rds);}
const domainsCard=''
+'<div class="card" id="related-card">'
+'<h3>关联域名</h3>'
+'<div id="related-body">'+rdRows+'</div>'
+'</div>';if(rdPending){const pollUrl='/api/ip/related/'+encodeURIComponent(ip);let tries=0;const maxTries=10;const tick=function(){tries++;fetch(pollUrl).then(function(r){return r.json();}).then(function(j){const body=document.getElementById('related-body');if(!body)return;if(!j.pending&&Array.isArray(j.related_domains)){body.innerHTML=renderRelatedRows(j.related_domains);return;}
if(tries<maxTries){setTimeout(tick,1500);}
else{body.innerHTML='<div class="muted">扫描超时，请刷新重试</div>';}}).catch(function(){if(tries<maxTries)setTimeout(tick,1500);});};setTimeout(tick,1200);}
const lh=Array.isArray(d.location_history)?d.location_history:[];let lhRows='';if(lh.length){lhRows=lh.map(function(h){const ts=h.seen_at?new Date(h.seen_at*1000).toISOString().slice(0,10):"-";const loc=[h.country,h.region,h.city].filter(Boolean).join(" / ")||"-";const fl=flagImg(h.country_code||'',{alt:ip+' 位置历史：'+loc,title:ip+' 位置历史：'+loc})||'';return'<div class="kv kv-lh" title="'+escapeHtml(ts+'  '+loc)+'"><span class="k" style="font-size:0.82em">'+escapeHtml(ts)+'</span>'
+'<span class="v lh-val">'+(fl?fl+' ':'')+'<span class="lh-text">'+escapeHtml(loc)+'</span></span></div>';}).join("");}else{lhRows='<div class="muted" style="font-size:0.85em;padding:6px 0">暂无历史记录</div>';}
const historyCard=''
+'<div class="card">'
+'<h3>位置历史</h3>'
+lhRows
+'</div>';function formatCompanyType(raw){var _raw=(raw||'').toString().trim().toLowerCase();if(!_raw)return'-';var _map={'isp':'ISP','hosting':'Hosting','datacenter':'Datacenter','business':'Business','education':'Education','government':'Government','anycast_dns':'Anycast DNS'};return _map[_raw]||(_raw.charAt(0).toUpperCase()+_raw.slice(1));}
const ah=Array.isArray(d.asn_history)?d.asn_history:[];let ahRows='';if(ah.length){ahRows=ah.map(function(r){const ts=r.seen_at?new Date(r.seen_at*1000).toISOString().slice(0,10):"-";const asnStr=r.asn?('AS'+r.asn):'-';const org=r.asn_org||'';return'<div class="kv kv-hx"><span class="k" style="font-size:0.82em">'+escapeHtml(ts)+'</span>'
+'<span class="v" title="'+escapeHtml(asnStr+(org?' · '+org:''))
+'" style="display:flex;align-items:baseline;gap:4px;min-width:0;white-space:nowrap;overflow:hidden;font-weight:400;justify-content:flex-end">'
+'<span style="flex:0 0 auto">'+escapeHtml(asnStr)+'</span>'
+(org?'<span class="muted" style="font-size:0.85em;flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis">· '+escapeHtml(org)+'</span>':'')
+'</span></div>';}).join('');}else{ahRows='<div class="muted" style="font-size:0.85em;padding:6px 0">暂无 ASN 变更记录</div>';}
const asnHxCard=''
+'<div class="card">'
+'<h3>ASN 历史</h3>'
+ahRows
+'</div>';const ch=Array.isArray(d.company_history)?d.company_history:[];let chRows='';if(ch.length){const _topCT=(d.company_type||'').toString().trim().toLowerCase();const _topNames=[(d.company_name||'').trim().toLowerCase(),(d.asOrganization||'').trim().toLowerCase(),].filter(Boolean);chRows=ch.map(function(r){const ts=r.seen_at?new Date(r.seen_at*1000).toISOString().slice(0,10):"-";const name=r.company_name||'-';let ctype=r.company_type||'';if(_topCT==='hosting'&&_topNames.indexOf((name||'').trim().toLowerCase())!==-1){ctype='hosting';}
const ctypeLabel=ctype?formatCompanyType(ctype):'';return'<div class="kv kv-hx"><span class="k" style="font-size:0.82em">'+escapeHtml(ts)+'</span>'
+'<span class="v" title="'+escapeHtml(name+(ctypeLabel?' · '+ctypeLabel:''))
+'" style="display:flex;align-items:baseline;gap:4px;min-width:0;white-space:nowrap;overflow:hidden;font-weight:400;justify-content:flex-end">'
+'<span style="flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(name)+'</span>'
+(ctypeLabel?'<span class="muted" style="font-size:0.85em;flex:0 0 auto">· '+escapeHtml(ctypeLabel)+'</span>':'')
+'</span></div>';}).join('');}else{chRows='<div class="muted" style="font-size:0.85em;padding:6px 0">暂无企业变更记录</div>';}
const companyHxCard=''
+'<div class="card">'
+'<h3>企业历史</h3>'
+chRows
+'</div>';const dn=Array.isArray(d.dc_neighbors)?d.dc_neighbors:[];let dnRows='';if(dn.length){const cells=dn.map(function(r){const ip2=r.ip||'';const meta=[r.city||'',r.company||''].filter(Boolean).join(' · ');return'<div class="dn-cell" title="'+escapeHtml(meta||ip2)+'">'
+'<a class="dn-ip mono" href="/ip/'+encodeURIComponent(ip2)+'" title="同机房活跃 IP '+escapeHtml(ip2)+' 的评分">'+escapeHtml(ip2)+'</a>'
+'</div>';}).join('');const _dnCount=dn.length;const _dnToggle=_dnCount>6?'<a href="#" class="dn-toggle" data-expanded="0">查看更多（共 '+_dnCount+' 条）</a>':'';dnRows='<div class="dn-grid">'+cells+'</div>'+_dnToggle;}else{dnRows='<div class="muted" style="font-size:0.85em;padding:6px 0">暂无已知同机房 IP</div>';}
const dcNeighborsCard=''
+'<div class="card">'
+'<h3>同机房 / 客户活跃<span class="tip-wrap">ⓘ<span class="tip-text">展示与当前 IP 归属同一 ASN 的其他活跃 IP，或同机房邻居的近似参考</span></span></h3>'
+dnRows
+'</div>';const signalBanner=buildSignalBanner(d);const extTools=buildExtTools(d.ip||ip);let publicSvcCard='';if(d.is_public_service&&d.public_service){const svc=d.public_service;publicSvcCard=''
+'<div class="card" style="background:linear-gradient(135deg,#e7f0fc 0%,#f5f9ff 100%);border:1px solid #b8d4f5;margin-bottom:16px">'
+'<h3 style="margin:0 0 10px 0;color:#1f4d8a">🌐 '+escapeHtml(svc.service||'公共 DNS 服务')+'</h3>'
+'<div style="color:#2c3e50;font-size:0.95em;line-height:1.6">'
+'<div><strong>运营方：</strong>'+escapeHtml(svc.operator||'-')+'</div>'
+'<div><strong>部署方式：</strong>'+escapeHtml(svc.note||'-')+'</div>'
+'<div style="margin-top:10px;padding:10px;background:rgba(255,255,255,0.6);border-radius:6px;font-size:0.88em;color: var(--text-soft)">'
+'⚠️ 这是公共 DNS 任播（Anycast）IP，在全球多个 POP 节点同时宣告。'
+'下方显示的地理位置 / ASN 归属仅反映本次查询到达的某个具体节点，<strong>不代表该 IP 的"真实物理位置"</strong>——对这类 IP 而言根本没有单一真实位置。'
+'位置历史、ASN 历史等时间线信息对任播 IP 没有意义，已自动隐藏。'
+'</div>'
+'</div>'
+'</div>';}
const _hideHx=!!d.is_public_service;renderHead(head);getBody().innerHTML=''+publicSvcCard+contradictCard
+'<div class="grid">'+typeCard+asnCard+'</div>'
+(_hideHx?'':'<div class="grid-3">'+sysCard+intelCard+deepCheckCard+'</div>')
+vpnCard
+(_hideHx?'<div class="grid"><div class="card-full">'+sysCard+'</div></div>'
+'<div class="grid"><div class="card-full">'+domainsCard+'</div></div>':(isV6?'':'<div class="grid"><div class="card-full">'+globalPingCard+'</div></div>')
+'<div class="grid"><div class="card-full">'+geoCard+'</div></div>'
+'<div class="grid"><div class="card-full">'+domainsCard+'</div></div>'
+'<div class="grid">'+historyCard+dcNeighborsCard+'</div>'
+'<div class="grid">'+asnHxCard+companyHxCard+'</div>')
+'<div class="actions-row">'+actions+extTools+'</div>';wireCopyButtons(out);if(!_hideHx&&!isV6){try{setTimeout(function(){gpStartPing(ip);},2000);}catch(e){}}}
function flagEmoji(cc){if(!cc||cc.length!==2)return"";const A=0x1F1E6;return String.fromCodePoint(A+(cc.toUpperCase().charCodeAt(0)-65))
+String.fromCodePoint(A+(cc.toUpperCase().charCodeAt(1)-65));}
function flagImg(cc,opts){cc=(cc||'').toLowerCase();if(!cc||cc.length!==2)return'';const big=opts&&opts.big;const src=cc==='cn'?'/favicons/cn.png':cc==='tw'?'/favicons/flags/tw.png':'/favicons/flags/'+cc+'.png';const cls=big?'':' class="flag-inline"';const alt=(opts&&opts.alt)?escapeHtml(opts.alt):(cc==='tw'?'中国台湾省':cc.toUpperCase());const ttl=(opts&&opts.title)?' title="'+escapeHtml(opts.title)+'"':'';const oe=' onerror="this.onerror=null;this.style.display=\'none\'"';if(big){return'<img src="'+src+'" alt="'+alt+'"'+ttl+' width="40" height="27"'+oe+' loading="lazy" decoding="async" style="width:20px;height:auto;border-radius:2px;box-shadow:0 1px 1.5px rgba(0,0,0,0.1)">';}
return'<img'+cls+' width="40" height="27" src="'+src+'" alt="'+alt+'"'+ttl+oe+' loading="lazy" decoding="async">';}
function ccZh(cc,fallback){cc=(cc||'').toUpperCase();if(!cc)return fallback||'';if(cc==='TW')return'中国台湾省';if(cc==='HK')return'中国香港';if(cc==='MO')return'中国澳门';try{var n=new Intl.DisplayNames(['zh-CN'],{type:'region'}).of(cc);if(n&&n!==cc)return n;}catch(e){}return fallback||cc;}
function escapeHtml(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function abuserLevelLabel(raw,rawScore){const n=(rawScore==null)?null:parseFloat(rawScore);if(n!=null&&isFinite(n)){if(n>0.25)return{label:"极高风险",color:"#8b1a1a",risk:true,extraPure:false};if(n>0.05)return{label:"高风险",color:"#b87700",risk:true,extraPure:false};if(n>0.025)return{label:"中风险",color:"#a46a00",risk:true,extraPure:false};if(n>0.01)return{label:"低风险",color:"#8a6d00",risk:false,extraPure:false};if(n>0.003)return{label:"纯净",color:"#0d5c27",risk:false,extraPure:false};return{label:"极度纯净",color:"#0d5c27",risk:false,extraPure:true};}
const v=String(raw||"").toLowerCase();if(v==="very_high"||v==="veryhigh")return{label:"极高风险",color:"#8b1a1a",risk:true,extraPure:false};if(v==="high")return{label:"高风险",color:"#b87700",risk:true,extraPure:false};if(v==="elevated")return{label:"中风险",color:"#a46a00",risk:true,extraPure:false};if(v==="low")return{label:"纯净",color:"#0d5c27",risk:false,extraPure:false};return{label:"-",color:"#6a737d",risk:false,extraPure:false};}
function normalizeAbuserScore(raw){if(raw==null||raw===""||raw==="-")return"-";const m=String(raw).match(/^\s*([0-9]*\.?[0-9]+)/);if(!m)return"-";const numStr=m[1];const v=parseFloat(numStr);if(isNaN(v))return"-";const hasDot=/\./.test(numStr);if(!hasDot){return Math.max(0,Math.min(10,v/10)).toFixed(2);}
const bands=[[0,0],[0.0025,2],[0.005,4],[0.05,6],[0.25,8],[1.0,10],];let front=10;for(let i=1;i<bands.length;i++){const[r1,f1]=bands[i-1];const[r2,f2]=bands[i];if(v<=r2){front=f1+((v-r1)/(r2-r1))*(f2-f1);break;}}
front=Math.max(0,Math.min(10,front));return front.toFixed(2);}
function normalizeHttpblThreat(raw){if(raw==null||raw===""||raw==="-")return"-";const v=Number(raw);if(!isFinite(v))return"-";const ten=v/25.5;return Math.max(0,Math.min(10,ten)).toFixed(2);}
function httpblLevelLabel(raw){const v=(raw==null||raw===""||raw==="-")?0:Number(raw);if(!isFinite(v)||v<=0)return{label:"纯净",color:"#0d5c27",bg:"#e8f7ee",risk:false};if(v<=2)return{label:"极低风险",color:"#1a7f37",bg:"#e8f7ee",risk:true};if(v<=25)return{label:"低风险",color:"#8a6d00",bg:"#fff6e0",risk:true};if(v<=50)return{label:"中风险",color:"#b87700",bg:"#fff0d6",risk:true};if(v<=100)return{label:"高风险",color:"#a13131",bg:"#fcecec",risk:true};return{label:"极高风险",color:"#8b1a1a",bg:"#f8dada",risk:true};}
function buildSignalBanner(d){const pills=[];const _hostingLike=d.asn_kind==='hosting'||d.asn_kind==='cdn'||d.company_type==='hosting'||(d.intelligence&&d.intelligence.company_type==='hosting');if(d.is_datacenter||_hostingLike)pills.push({cls:'sig-warn',label:'数据中心'});else if(d.is_mobile)pills.push({cls:'sig-info',label:'移动网络'});else pills.push({cls:'sig-ok',label:'住宅/商用宽带'});if(d.is_vpn)pills.push({cls:'sig-warn',label:'VPN'});if(d.is_proxy)pills.push({cls:'sig-warn',label:'Proxy'});if(d.is_tor)pills.push({cls:'sig-bad',label:'Tor 出口'});if(d.is_abuser)pills.push({cls:'sig-warn',label:'历史滥用'});if(d.is_crawler)pills.push({cls:'sig-info',label:'爬虫'});const abLvl=(d.intelligence&&d.intelligence.abuser_level)||'';if(abLvl){const _m=String((d.intelligence&&d.intelligence.abuser_score_raw)||'').match(/^\s*([0-9]*\.?[0-9]+)/);const _rs=_m?parseFloat(_m[1]):null;const _lv=abuserLevelLabel(abLvl,_rs);if(_lv.risk){const _pc=(_rs!=null&&_rs>0.25)?'sig-bad':'sig-warn';pills.push({cls:_pc,label:'滥用等级 '+_lv.label});}}
if(d.is_bogon)pills.push({cls:'sig-bad',label:'Bogon'});if(!pills.length||(pills.length===1&&pills[0].cls==='sig-ok')){if(!pills.length)pills.push({cls:'sig-ok',label:'无风险标记'});}
const html=pills.map(function(p){return'<span class="sig-pill '+p.cls+'"><span class="dot"></span>'
+escapeHtml(p.label)+'</span>';}).join('');return'<div class="signal-banner-big"><span class="sig-label">信号速览</span>'+html+'</div>';}
function buildExtTools(ip){const enc=encodeURIComponent(ip);const tools=[{name:'Shodan',url:'https://www.shodan.io/search?query='+enc},{name:'AbuseIPDB',url:'https://www.abuseipdb.com/check/'+enc},{name:'VirusTotal',url:'https://www.virustotal.com/gui/ip-address/'+enc},{name:'BGP.tools',url:'https://bgp.tools/prefix/'+enc},{name:'IPinfo',url:'https://ipinfo.io/'+enc},{name:'Spamhaus',url:'https://check.spamhaus.org/results/?query='+enc},{name:'ipdata.co',url:'https://ipdata.co/'+enc},{name:'IP2Location',url:'https://www.ip2location.com/'+enc},{name:'Scamalytics',url:'https://scamalytics.com/ip/'+enc},];var primary=tools.slice(0,4);var more=tools.slice(4);var html='<div class="ext-tools"><span class="ext-label">更多工具交叉验证</span>'
+primary.map(function(t){return'<a href="'+t.url+'" target="_blank" rel="nofollow noopener" title="在 '+t.name+' 查询 '+escapeHtml(ip)+'">'+t.name+'</a>';}).join('')
+more.map(function(t){return'<a class="ext-more" href="'+t.url+'" target="_blank" rel="nofollow noopener" title="在 '+t.name+' 查询 '+escapeHtml(ip)+'">'+t.name+'</a>';}).join('')
+'<span class="ext-toggle" onclick="this.parentNode.classList.toggle(\'open\')">'
+'<span class="ext-toggle-open">展开 ▾</span>'
+'<span class="ext-toggle-close">收起 ▴</span>'
+'</span>'
+'</div>';return html;}
function ipv4ToInt(s){const p=s.split('.');if(p.length!==4)return null;let n=0;for(let i=0;i<4;i++){const x=parseInt(p[i],10);if(isNaN(x)||x<0||x>255)return null;n=n*256+x;}
return n>>>0;}
function intToIpv4(n){return[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');}
function buildNeighborNav(ip,range){const n=ipv4ToInt(ip);if(n==null)return'';const prev=n>0?intToIpv4(n-1):null;const next=n<0xFFFFFFFF?intToIpv4(n+1):null;const first=range&&range.first;const last=range&&range.last;const row1=['<span class="nn-label">邻居：</span>'];if(prev)row1.push('<a href="/ip/'+prev+'" title="相邻 IP '+prev+' 的评分">← '+prev+'</a>');if(next)row1.push('<a href="/ip/'+next+'" title="相邻 IP '+next+' 的评分">'+next+' →</a>');const row2=[];if(first&&first!==ip)row2.push('<span class="nn-label">段首：</span><a href="/ip/'+first+'" title="网段首个 IP '+first+' 的评分">'+first+'</a>');if(last&&last!==ip)row2.push('<span class="nn-label">段尾：</span><a href="/ip/'+last+'" title="网段末尾 IP '+last+' 的评分">'+last+'</a>');let html='<div class="neighbor-nav">';html+='<div class="nn-row">'+row1.join('')+'</div>';if(row2.length)html+='<div class="nn-row">'+row2.join('')+'</div>';html+='</div>';return html;}
function wireCopyButtons(container){(container||document).querySelectorAll('.copy-btn').forEach(function(btn){if(btn.dataset.wired)return;btn.dataset.wired='1';btn.addEventListener('click',function(){const txt=btn.dataset.copy||'';if(!txt||!navigator.clipboard)return;navigator.clipboard.writeText(txt).then(function(){const orig=btn.textContent;btn.textContent='已复制';btn.classList.add('copied');setTimeout(function(){btn.textContent=orig;btn.classList.remove('copied');},1400);});});});}
function copyBtn(value){return' <button class="copy-btn" data-copy="'+escapeHtml(value)+'" title="复制 '+escapeHtml(value)+'">📋</button>';}})();
;
(function(){var PORT_SVC={22:'SSH',25:'SMTP',80:'HTTP',443:'HTTPS',8080:'',8443:''};var WEB_PORTS={80:1,443:1,8080:1,8443:1};var COOLDOWN_SEC=60;var _tickHandle=null;function escHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function portChipsHtml(data){var ports=(data&&data.ports)||{};var openList=[];Object.keys(ports).forEach(function(k){if(ports[k]===true||ports[k]==='open')openList.push(parseInt(k,10));});openList.sort(function(a,b){return a-b;});if(!openList.length){return'<span class="chip chip-ok">未发现常见端口开放</span>'
+'<span id="portScanCtrl"></span>';}
var html='';openList.forEach(function(pt){var svc=PORT_SVC[pt]||'';var icon='';if(pt===22){icon='<img src="/favicons/ipinfo-ssh.svg" alt="" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px">';}else if(WEB_PORTS[pt]){icon='<img src="/favicons/ipinfo-webserver.svg" alt="" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px">';}
html+='<span class="chip" style="display:inline-flex;align-items:center;background:#f3f6ff;color:#224;border:1px solid #cdd">'
+icon
+escHtml(pt)+(svc?' '+escHtml(svc):'')
+'</span> ';});return html;}
function renderWithControl(data){var chips=portChipsHtml(data);var openCount=0;var ports=(data&&data.ports)||{};Object.keys(ports).forEach(function(k){if(ports[k]===true||ports[k]==='open')openCount++;});if(openCount===0){return chips;}
var ctrl='<span id="portScanCtrl"></span>';return chips+ctrl;}
function clearTick(){if(_tickHandle!=null){clearInterval(_tickHandle);_tickHandle=null;}}
function renderCtrlRefresh(){var ctrl=document.getElementById('portScanCtrl');if(!ctrl)return;ctrl.innerHTML='<a href="#" id="portScanRefreshBtn" '
+'style="color:#5a3dbd;text-decoration:none;cursor:pointer">🔄 刷新</a>';}
function renderCtrlCountdown(remaining){var ctrl=document.getElementById('portScanCtrl');if(!ctrl)return;ctrl.innerHTML='<span class="muted" style="font-size:0.85em">稍等'
+'<span id="portScanCd" style="font-variant-numeric:tabular-nums">'
+escHtml(remaining)+'</span>s</span>';}
function startCooldown(remaining){clearTick();if(remaining<=0){renderCtrlRefresh();return;}
renderCtrlCountdown(remaining);var left=remaining;_tickHandle=setInterval(function(){left-=1;if(left<=0){clearTick();renderCtrlRefresh();}else{var cd=document.getElementById('portScanCd');if(cd)cd.textContent=String(left);}},1000);}
function getCurrentIp(){var m=(location.pathname||'').match(/\/ip\/([^\/?#]+)/);if(m)return m[1];var el=document.getElementById('ip-input');return el?(el.value||'').trim():'';}
function triggerScan(force){var ip=getCurrentIp();if(!ip)return;var cell=document.getElementById('portScanCell');if(!cell)return;clearTick();var _prevHTML=cell.innerHTML;cell.innerHTML='<span class="muted" style="font-weight:400;font-size:0.85em">进行全球多节点扫描…请稍等</span>';var url='/api/ip/portscan/'+encodeURIComponent(ip)+(force?'?force=1':'');fetch(url,{cache:'no-store'}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});}).then(function(pair){var body=pair.body||{};if(pair.status===429&&body.error==='cooldown'){if(_prevHTML&&_prevHTML.indexOf('portScanCtrl')!==-1){cell.innerHTML=_prevHTML;}var _rem=parseInt(body.remaining_s||COOLDOWN_SEC,10);renderCtrlCountdown(_rem);var left=_rem;_tickHandle=setInterval(function(){left-=1;if(left<=0){clearTick();renderCtrlRefresh();return;}
var cd=document.getElementById('portScanCd');if(cd)cd.textContent=String(left);},1000);return;}
if(pair.status===429||body.error==='rate_limited'){cell.innerHTML='<span class="chip chip-warn">24h 配额耗尽（>'
+escHtml(body.limit||20)+' 次）：请稍后再试...</span>';return;}
if(!body.ok){cell.innerHTML='<span class="chip chip-warn">扫描失败</span>';return;}
cell.innerHTML=renderWithControl(body);renderCtrlRefresh();}).catch(function(){cell.innerHTML='<span class="chip chip-warn">扫描失败（网络错误）</span>';});}
function triggerPingCheck(){var ip=getCurrentIp();if(!ip)return;var btn=document.getElementById('portScanPingBtn');var slot=document.getElementById('pingVerdictSlot');if(btn){btn.disabled=true;btn.textContent='Ping 中…';btn.style.background='#eee';}
if(slot)slot.innerHTML='';fetch('/api/ip/pingcheck/'+encodeURIComponent(ip),{cache:'no-store'}).then(function(r){return r.json();}).then(function(body){if(!body||!body.ok){if(slot)slot.innerHTML='<span class="chip chip-warn">Ping 判断失败</span>';if(btn){btn.disabled=false;btn.textContent='Ping 判断';btn.style.background='#f5f0ff';}
return;}
if(btn&&btn.parentNode)btn.parentNode.removeChild(btn);if(!slot)return;if(body.verdict==='reachable'){slot.innerHTML='<span class="chip chip-ok">可 Ping</span>';}else if(body.verdict==='unreachable'){var tail=body.marked_dead?' <span class="muted" style="font-size:0.8em;margin-left:4px">已从同机房列表排除</span>':'';slot.innerHTML='<span class="chip chip-bad">不可 Ping</span>'+tail;}else{slot.innerHTML='<span class="chip chip-warn">结论不明</span>';}}).catch(function(){if(slot)slot.innerHTML='<span class="chip chip-warn">Ping 判断失败（网络错误）</span>';if(btn){btn.disabled=false;btn.textContent='Ping 判断';btn.style.background='#f5f0ff';}});}
function tryRenderExisting(){var ip=getCurrentIp();if(!ip)return;var cell=document.getElementById('portScanCell');if(!cell)return;var btn=document.getElementById('portScanBtn');if(!btn)return;fetch('/api/ip/portscan/'+encodeURIComponent(ip)+'?probe=0',{cache:'no-store'}).then(function(r){return r.json();}).then(function(body){if(!body||!body.ok)return;if(!document.getElementById('portScanBtn'))return;cell.innerHTML=renderWithControl(body);renderCtrlRefresh();}).catch(function(){});}
function _waitAndRenderExisting(){if(document.getElementById('portScanCell')){tryRenderExisting();return;}
var mo=new MutationObserver(function(){if(document.getElementById('portScanCell')){mo.disconnect();tryRenderExisting();}});mo.observe(document.body,{childList:true,subtree:true});setTimeout(function(){try{mo.disconnect();}catch(e){}},15000);}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',_waitAndRenderExisting);}else{_waitAndRenderExisting();}
document.addEventListener('click',function(ev){var target=ev.target;if(!target||!target.closest)return;if(target.closest('#portScanBtn')){ev.preventDefault();triggerScan(false);return;}
if(target.closest('#portScanRefreshBtn')){ev.preventDefault();triggerScan(true);return;}
if(target.closest('#portScanPingBtn')){ev.preventDefault();triggerPingCheck();return;}const _dnt=target.closest('.dn-toggle');if(_dnt){ev.preventDefault();const _grid=_dnt.parentElement&&_dnt.parentElement.querySelector('.dn-grid');if(_grid){const _exp=_grid.classList.toggle('expanded');const _n=_grid.querySelectorAll('.dn-cell').length;_dnt.textContent=_exp?'收起':('查看更多（共 '+_n+' 条）');}return;}},false);})();(function(){function gpPingClass(ms){if(ms<100)return'gp-ok';if(ms<200)return'gp-med';if(ms<350)return'gp-slow';return'gp-bad';}
function gpRenderMin(idx,data){var el=document.getElementById('gp-min-'+idx);if(!el)return;if(!data||!data[0]){el.textContent='超时';el.className='gp-val gp-err';return;}
var times=data[0].filter(function(p){return p[0]==='OK';}).map(function(p){return Math.round(p[1]*1000);});if(!times.length){el.textContent='不可达';el.className='gp-val gp-err';return;}
var min=Math.min.apply(null,times);el.textContent=min+' ms';el.className='gp-val '+gpPingClass(min);}
function gpMarkAllErr(label){for(var i=0;i<8;i++){var el=document.getElementById('gp-min-'+i);if(el){el.textContent=label;el.className='gp-val gp-err';}}}
function gpGetCurrentIp(){var m=(location.pathname||'').match(/\/ip\/([^\/?#]+)/);if(m)return m[1];var el=document.getElementById('ip-input');return el?(el.value||'').trim():'';}
window.gpStartPing=async function(host){if(!host)host=gpGetCurrentIp();if(!host)return;if(!document.getElementById('globalPingGrid'))return;var NODE_IDS=['n01','n02','n03','n04','n09','n11','n13','n15'];var nodeParam=NODE_IDS.map(function(n){return'node='+n;}).join('&');var url='/api/ping/global?host='+encodeURIComponent(host)+'&'+nodeParam;var data;try{var resp=await fetch(url,{signal:AbortSignal.timeout(8000)});data=await resp.json();}catch(e){gpMarkAllErr('失败');return;}
var results=data.results||{};var pending=data.pending||[];NODE_IDS.forEach(function(id,i){var el=document.getElementById('gp-min-'+i);if(!el)return;var ms=results[id];if(typeof ms==='number'){el.textContent=ms+' ms';el.className='gp-val '+gpPingClass(ms);}else if(pending.indexOf(id)!==-1){el.textContent='稍后';el.className='gp-val gp-pending';}else{el.textContent='超时';el.className='gp-val gp-err';}});};})();
;
/* 隐藏IP 开关:仅改显示不动数据。搜索框用 CSS 遮罩(value 不变,避免影响依赖 input.value 的 ping/端口扫描逻辑) */
(function(){"use strict";
var maskOn=false;
var originals=new WeakMap();
var written=new WeakMap();
function hasIp(s){return /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(s)||/\b\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}\b/.test(s)||/[0-9a-fA-F]{1,4}:[0-9a-fA-F]{1,4}:[0-9a-fA-F:.]{2,}/.test(s);}
function maskText(s){
  return String(s)
    .replace(/\b(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}\b/g,'$1.$2.*.*')
    .replace(/\b(\d{1,3})-(\d{1,3})-\d{1,3}-\d{1,3}\b/g,'$1-$2-*-*')
    .replace(/\b([0-9a-fA-F]{1,4}):([0-9a-fA-F]{1,4}):[0-9a-fA-F:.]{2,}/g,function(m,a,b){return m.split(':').length>=4?a+':'+b+':*':m;});
}
function walkMask(){
  var roots=[document.getElementById('result'),document.querySelector('h1')];
  var nodes=[];
  roots.forEach(function(root){
    if(!root)return;
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
    var n;
    while((n=w.nextNode()))nodes.push(n);
  });
  nodes.forEach(function(node){
    var cur=node.nodeValue;
    if(!originals.has(node)){
      if(!maskOn||!hasIp(cur))return;
      originals.set(node,cur);
    }
    var real=originals.get(node);
    if(cur!==real&&cur!==written.get(node)){real=cur;originals.set(node,real);}
    var want=maskOn?maskText(real):real;
    if(node.nodeValue!==want){node.nodeValue=want;written.set(node,want);}
  });
}
var moPending=false;
var mo=new MutationObserver(function(){
  if(!maskOn||moPending)return;
  moPending=true;
  requestAnimationFrame(function(){moPending=false;walkMask();});
});
function initMask(){
  var res=document.getElementById('result');
  if(res)mo.observe(res,{childList:true,subtree:true,characterData:true});
  var tg=document.getElementById('ipMaskToggle');
  var inp=document.getElementById('ip-input');
  if(tg){
    tg.checked=false;
    tg.addEventListener('change',function(e){
      maskOn=e.target.checked;
      if(inp)inp.classList.toggle('ip-mask-on',maskOn);
      walkMask();
    });
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMask);else initMask();
})();
