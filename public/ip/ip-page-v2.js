/* /ip/ 页面 v2 展示层增强（2026-09-15）
 * 只做 DOM 层面的加工，不改 ip-page.js 的任何逻辑：
 *  - 头部：搜索框移出、评分条 + 档位文案
 *  - 两张卡片：行的增删挪位、原生性中文、适用场景评估三环
 *  - 新区块：C 段画像 + 地图定位、BGP 路由拓扑、DNSBL、同机房供应商/客户
 * 数据来自 /api/ip/lookup（服务端缓存）与 /api/ipv2/*。
 */
(function(){"use strict";
var API2='/api/ipv2/';
var out=document.getElementById('result');
if(!out)return;
(function(){var sb=document.querySelector('.container > .search-bar');var w=null;if(sb&&!sb.parentNode.classList.contains('search-top-wrap')){w=document.createElement('div');w.className='search-top-wrap';sb.parentNode.insertBefore(w,sb);w.appendChild(sb);sb.classList.add('v2-top');}else if(sb){w=sb.parentNode;}
/* 标题与搜索框同一行：<div class="v2-titlebar"><h1/><div.search-top-wrap/></div>；IPv6 标题加 v2-v6 缩小字号 */
var h1=document.querySelector('.container > h1');if(h1&&w&&!document.querySelector('.v2-titlebar')){var tb=document.createElement('div');tb.className='v2-titlebar';h1.parentNode.insertBefore(tb,h1);tb.appendChild(h1);tb.appendChild(w);var m=(location.pathname||'').match(/^\/ip\/([^\/?#]+)/);if(m&&m[1].indexOf(':')!==-1||(m&&m[1].indexOf('%3A')!==-1))h1.classList.add('v2-v6');}})();
var _cap={};
(function(){var of=window.fetch;if(!of)return;window.fetch=function(u,o){var p=of.apply(this,arguments);try{var url=(typeof u==='string')?u:((u&&u.url)||'');var m=url.match(/\/api\/ip\/lookup\/([^?#]+)/);if(m){var ip;try{ip=decodeURIComponent(m[1]);}catch(e){ip=m[1];}var e2=_cap[ip]={data:null,promise:null};e2.promise=p.then(function(r){return r.clone().json();}).then(function(d){e2.data=d;return d;}).catch(function(){e2.data=null;return null;});}}catch(err){}return p;};})();

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function ccZh2(cc,fb){cc=(cc||'').toUpperCase();if(!cc)return fb||'';if(cc==='TW')return'台湾省';if(cc==='HK')return'香港';if(cc==='MO')return'澳门';try{var n=new Intl.DisplayNames(['zh-CN'],{type:'region'}).of(cc);if(n&&n!==cc)return n;}catch(e){}return fb||cc;}
function roundHalfUp(x){return Math.floor(x+0.5);}
function el(html){var t=document.createElement('div');t.innerHTML=html;return t.firstElementChild;}
function closestGrid(node){while(node&&node!==out){if(node.classList&&(node.classList.contains('grid')||node.classList.contains('grid-3')))return node;node=node.parentNode;}return null;}
function cardByTitle(prefix){var hs=out.querySelectorAll('.result-body .card > h3');for(var i=0;i<hs.length;i++){if(hs[i].textContent.trim().indexOf(prefix)===0)return hs[i].parentNode;}return null;}
function rowByLabel(card,label){if(!card)return null;var kvs=card.querySelectorAll('.kv');for(var i=0;i<kvs.length;i++){var k=kvs[i].querySelector('.k');if(!k)continue;var t=(k.childNodes[0]&&k.childNodes[0].nodeType===3)?k.childNodes[0].textContent.trim():k.textContent.trim();if(t===label)return kvs[i];}return null;}

/* ---------- 档位（与 /claude/ 一致） ---------- */
function tierOf(s){s=Number(s);if(!isFinite(s))return{text:'-',cls:'neutral'};if(s>=95)return{text:'极度纯净',cls:'safe'};if(s>=80)return{text:'纯净',cls:'safe'};if(s>=50)return{text:'良好',cls:'info'};if(s>=25)return{text:'中性',cls:'warn'};return{text:'可疑',cls:'danger'};}

/* ---------- 适用场景评估 ---------- */
var REGION={
  tiktok:{block:['CN','HK','IN','IR','AF','KP','JO','SO','SN','KG','UZ'],partial:[]},
  social:{block:['CN','IR','KP','TM'],partial:['RU','MM']},
  ai:{block:['CN','RU','BY','IR','KP','CU','SY','AF'],partial:['HK','MO','VE','MM']}
};
var NOTE={
  tiktok:{HK:'香港：TikTok 2020 年起退出，不可用',CN:'中国大陆：TikTok 不可用',IN:'印度：TikTok 已封禁'},
  social:{RU:'俄罗斯：Instagram / Facebook / X 封锁，YouTube 限速',MM:'缅甸：Facebook 封锁',CN:'中国大陆：海外主流社媒不可用'},
  ai:{HK:'香港：ChatGPT ✗ · Claude ✗ · Gemini ✓',MO:'澳门：ChatGPT ✗ · Claude ✗ · Gemini ✓',CN:'中国大陆：ChatGPT ✗ · Claude ✗ · Gemini ✗',VE:'委内瑞拉：仅 Gemini 可用',MM:'缅甸：仅 Gemini 可用'}
};
function regionNote(kind,cc,mode){var m=NOTE[kind]||{};if(m[cc])return m[cc];return ccZh2(cc)+'：'+(mode==='block'?'该地区不可用':'该地区部分可用');}
function sceneScores(d){
  var trust=Number(d.trust_score);if(!isFinite(trust))return null;
  var base=roundHalfUp(trust/10);
  var cc=(d.countryCode||'').toUpperCase(),reg=(d.registered_country_code||'').toUpperCase();
  var dc=!!(d.is_datacenter||d.company_type==='hosting'||d.asn_kind==='hosting'||d.asn_kind==='cdn');
  var native=!!(cc&&reg&&cc===reg),broadcast=!!(cc&&reg&&cc!==reg);
  var human=!dc&&!d.is_crawler&&!d.is_public_service;
  var business=(d.company_type||'')==='business';
  var pv=!!(d.is_proxy||d.is_vpn||d.is_tor);
  /* 风险信号显式扣分（2026-09-16 用户定稿）：阈值与页面 IP 情报卡各项文案一致 */
  var intel=d.intelligence||{};
  /* 风险标记 行是 代理/VPN/Tor/历史滥用/蜜罐/移动蜂窝/爬虫 的派生汇总，不是独立信号；这里只取其中未被其它项覆盖的 历史滥用 */
  var threats=!!d.is_abuser;
  var abRaw=parseFloat(intel.abuser_score_raw!=null?intel.abuser_score_raw:d.abuser_score);
  var abPen=0;if(isFinite(abRaw)){abPen=abRaw>0.05?2:abRaw>0.025?1:abRaw>0.01?0.5:0;}else{var lv=String(intel.abuser_level||'').toLowerCase();abPen=(lv==='high'||lv==='very_high'||lv==='veryhigh')?2:lv==='elevated'?1:0;}
  var hpRaw=(intel.rep_threat!=null&&intel.rep_threat!=='')?intel.rep_threat:intel.httpbl_threat;var hp=Number(hpRaw);var hpPen=(isFinite(hp)&&hp>0)?(hp<=25?1:2):0;
  var crawler=!!d.is_crawler;
  var risky=threats||abPen>0||hpPen>0||crawler||pv;
  function calc(kind){
    var s=base;if(native)s+=0.5;if(human)s+=0.5;if(business)s-=0.5;if(dc)s-=2;if(broadcast)s-=1;if(kind!=='ai'&&dc)s-=1;if(pv)s-=(kind==='ai'?2:3);
    if(threats)s-=(kind==='ai'?0.5:1);s-=abPen;s-=hpPen;if(crawler)s-=0.5;
    s=roundHalfUp(s);if(s<0)s=0;if(s>10)s=10;if(risky&&s>9)s=9;
    var r=REGION[kind];var blocked=r.block.indexOf(cc)>=0,partial=r.partial.indexOf(cc)>=0;
    if(blocked)return{score:0,blocked:true,cls:'off',verdict:'地区不可用',note:regionNote(kind,cc,'block')};
    if(partial&&s>5)s=5;
    var v,c,tip='';if(partial){v='部分可用';c='warn';}else if(s>=10){v='极佳';c='best';}else if(s>=8){v='推荐';c='good';}else if(s>=5){if(kind==='ai'){v='可以尝试';tip='GPT和Gemini可用，Claude不建议使用';}else{v='可用';}c='warn';}else{v='不推荐';c='warn';}
    return{score:s,blocked:false,cls:c,verdict:v,note:partial?regionNote(kind,cc,'partial'):'',tip:tip};
  }
  return{tiktok:calc('tiktok'),social:calc('social'),ai:calc('ai')};
}
function ringHtml(name,r){
  var k=r.score;var fg=k>0?(new Array(k+1).join('8 2 ')+'0 100'):'0 100';
  var inner=r.blocked?'<text x="22" y="26.5" class="rg-num rg-blocked">🚫</text>':'<text x="22" y="26.5" class="rg-num">'+k+'</text>';
  var t='';var tipTxt=r.tip||r.note||'';
  return'<div class="rg '+r.cls+'"'+t+'><svg viewBox="0 0 44 44" aria-label="'+esc(name)+' '+k+'/10"><circle class="rg-track" cx="22" cy="22" r="18" pathLength="100"/><circle class="rg-fill" cx="22" cy="22" r="18" pathLength="100" style="stroke-dasharray:'+fg+'"/>'+inner+'</svg><span class="rg-txt"><span class="rg-name">'+esc(name)+'</span><span class="rg-verdict">'+esc(r.verdict)+(tipTxt?'<span class="tip-wrap">ⓘ<span class="tip-text">'+esc(tipTxt)+'</span></span>':'')+'</span></span></div>';
}

/* ---------- 头部 ---------- */
function enhanceHead(d){
  var head=out.querySelector('.ip-head');if(!head)return;
  var sb=head.querySelector('.search-bar');
  if(sb){var cont=out.parentNode;cont.insertBefore(sb,out);sb.classList.add('v2-top');}
  if(head.querySelector('.ip-gauge'))return;
  var sg=head.querySelector('.score-gauge');var trust=Number(d.trust_score);var ok=isFinite(trust);
  var pct=ok?Math.max(0,Math.min(100,trust)):0;
  var g=el('<div class="ip-gauge"><div class="gauge-bar"><div class="gauge-pointer" style="left:'+pct+'%"></div></div><div class="gauge-labels"><span>0 高危</span><span>25</span><span>50</span><span>75</span><span>100 可信</span></div></div>');
  if(sg){head.insertBefore(g,sg);var t=tierOf(trust);sg.className='score-gauge score-v2 tier-'+t.cls;sg.innerHTML='<span class="score-num">'+(ok?trust:'-')+'</span><span class="score-tier">'+esc(t.text)+'</span>';}
  else head.appendChild(g);
  fitSearch();
}
/* 搜索框宽度 = 头部右缘 − 评分条左缘，让搜索框左缘正好对齐"0 高危"起点；窄屏交给 CSS 全宽 */
function fitSearch(){var sb=document.querySelector('.search-top-wrap > .search-bar.v2-top');var head=out.querySelector('.ip-head');var bar=head&&head.querySelector('.gauge-bar');if(!sb||!bar)return;if(innerWidth<=760){sb.style.width='';return;}var w=Math.round(head.getBoundingClientRect().right-bar.getBoundingClientRect().left);if(w>200&&w<head.getBoundingClientRect().width)sb.style.width=w+'px';}
var _fsT=null;window.addEventListener('resize',function(){clearTimeout(_fsT);_fsT=setTimeout(fitSearch,120);});

/* ---------- 两张卡片 ---------- */
function enhanceCards(d){
  var typeCard=cardByTitle('使用场景 / 类型'),asnCard=cardByTitle('ASN / 运营商');
  if(!typeCard||!asnCard||typeCard.classList.contains('kv-grid'))return;
  // 原生性：归属地中文 + 广播 IP (注册国中文)
  var rNative=rowByLabel(typeCard,'IP 原生性');
  if(rNative){var v=rNative.querySelector('.v');var geoZh=ccZh2(d.countryCode,d.country);var chip=v.querySelector('.chip');
    if(chip&&/广播 IP/.test(chip.textContent)){var regZh=ccZh2(d.registered_country_code,d.registered_country);chip.textContent='广播 IP ('+regZh+')';var tip=v.querySelector('.tip-text');if(tip)tip.textContent='IP 注册在'+regZh+'、归属地为'+geoZh+'，两者不一致属常见现象，并不影响使用。';}
    if(geoZh&&!v.querySelector('.geo-zh')){var cc2=(d.countryCode||'').toLowerCase(),ipTxt=currentIp()||'';var fsrc=cc2==='cn'?'/favicons/cn.png':'/favicons/flags/'+cc2+'.png';
      var flag=(cc2.length===2)?'<img class="flag-inline" src="'+fsrc+'" alt="'+esc(ipTxt+' 归属于'+geoZh+' IP')+'" title="'+esc(ipTxt+' 归属于'+geoZh+' IP')+'" width="20" height="14" loading="lazy" decoding="async">':'';
      v.insertBefore(el('<span class="geo-zh">'+flag+esc(geoZh)+'</span>'),v.firstChild);v.insertBefore(document.createTextNode(' '),v.childNodes[1]||null);}}
  var rAsn=rowByLabel(typeCard,'ASN归属'),rCo=rowByLabel(typeCard,'企业信息'),rHuman=rowByLabel(typeCard,'人机流量');
  var rCidr=rowByLabel(asnCard,'CIDR'),rRange=rowByLabel(asnCard,'IP 范围'),rAsnNo=rowByLabel(asnCard,'ASN');
  if(rCidr)rCidr.remove();if(rRange)rRange.remove();
  if(rAsn){if(rAsnNo&&rAsnNo.nextSibling)asnCard.insertBefore(rAsn,rAsnNo.nextSibling);else asnCard.appendChild(rAsn);}
  if(rCo)asnCard.appendChild(rCo);
  var sc=sceneScores(d);
  if(sc&&rHuman&&!d.is_public_service){
    var row=el('<div class="kv kv-scene"><span class="k">场景评估<span class="tip-wrap">ⓘ<span class="tip-text">满分10分，分数越高越好。包含：极佳、推荐、可用、可以尝试、不推荐以及部分可用等</span></span></span><span class="v v-scene">'+ringHtml('TikTok',sc.tiktok)+ringHtml('社媒运营',sc.social)+ringHtml('AI应用',sc.ai)+'</span></div>');
    rHuman.parentNode.insertBefore(row,rHuman.nextSibling);
  }
  typeCard.classList.add('kv-grid');asnCard.classList.add('kv-grid');
}

/* ---------- 新区块骨架 ---------- */
function fullCard(id,title,inner,extraCls){return el('<div class="grid v2-grid"><div class="card-full"><div class="card v2sec v2-collapsible'+(extraCls?' '+extraCls:'')+'" id="'+id+'"><h3>'+title+'<button type="button" class="v2-toggle" aria-expanded="false">展开</button></h3><div class="v2-body">'+inner+'</div></div></div></div>');}
document.addEventListener('click',function(e){var b=e.target.closest('.v2-toggle');if(!b)return;e.preventDefault();var c=b.closest('.v2-collapsible');if(!c)return;var open=c.classList.toggle('open');b.textContent=open?'收起':'展开';b.setAttribute('aria-expanded',open?'true':'false');});
function insertAfter(ref,node){if(ref&&ref.parentNode)ref.parentNode.insertBefore(node,ref.nextSibling);}
function loadingHtml(t){return'<div class="v2-loading"><span class="ai-spinner"></span>'+esc(t||'加载中…')+'</div>';}
function getJSON(url,ms){return fetch(url,{signal:AbortSignal.timeout(ms||15000)}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}

function buildSections(ip,d){
  var body=out.querySelector('.result-body');if(!body||body.querySelector('#v2-heat'))return;
  var isV6=ip.indexOf(':')!==-1;
  var pingGrid=document.getElementById('globalPingGrid');var afterPing=pingGrid?closestGrid(pingGrid):null;
  var g3=body.querySelector('.grid-3');
  var histCard=cardByTitle('位置历史');var histGrid=histCard?closestGrid(histCard):null;
  var asnHxCard=cardByTitle('ASN 历史');var asnHxGrid=asnHxCard?closestGrid(asnHxCard):null;
  // C 段 + 地图
  var row2=el('<div class="grid v2-grid v2-row2">'
    +'<div class="card v2sec" id="v2-heat"><h3>网段热度趋势 <span class="v2-sub" id="v2-heat-sub"></span></h3><div class="v2-body">'+(isV6?'<div class="muted v2-note">IPv6 地址暂不提供网段热度</div>':loadingHtml('读取热度趋势…'))+'</div></div>'
    +'<div class="card v2sec" id="v2-map"><h3>地图定位</h3><div class="v2-body map-body">'+loadingHtml('绘制地图…')+'</div></div>'
    +'</div>');
  insertAfter(afterPing||g3,row2);
  // BGP + DNSBL
  var bgp=fullCard('v2-bgp','BGP 路由拓扑',loadingHtml('读取路由观测…'));
  var dnsbl=fullCard('v2-dnsbl','全球威胁与垃圾邮件黑名单 (DNSBL)',isV6?'<div class="muted v2-note">IPv6 地址暂不查询黑名单</div>':loadingHtml('并行查询 12 家黑名单…'));
  insertAfter(histGrid||row2,bgp);insertAfter(bgp,dnsbl);
  // 同机房供应商 / 客户
  var cos=fullCard('v2-cos','同机房供应商 / 客户',d.asn?loadingHtml('聚合同 ASN 记录…'):'<div class="muted v2-note">无 ASN 信息</div>');
  insertAfter(asnHxGrid||dnsbl,cos);
  renderMap(ip,d);
  if(!isV6)getJSON(API2+'heat/'+encodeURIComponent(ip)).then(function(j){renderHeat(ip,j);}).catch(function(){setBody('v2-heat','<div class="muted v2-note">暂时无法读取</div>');});
  getJSON(API2+'bgp/'+encodeURIComponent(ip),22000).then(function(j){renderBgp(j);}).catch(function(){setBody('v2-bgp','<div class="muted v2-note">暂时无法读取路由数据</div>');});
  if(!isV6)getJSON(API2+'dnsbl/'+encodeURIComponent(ip),15000).then(function(j){renderDnsbl(j);}).catch(function(){setBody('v2-dnsbl','<div class="muted v2-note">黑名单查询暂不可用</div>');});
  if(d.asn)pollCos(d,0);
}
function pollCos(d,tries){
  getJSON(API2+'asncos/'+encodeURIComponent(d.asn),15000).then(function(j){
    if(j&&j.pending){if(tries<12){setTimeout(function(){pollCos(d,tries+1);},1500);}else{setBody('v2-cos','<div class="muted v2-note">聚合超时，请稍后刷新</div>');}return;}
    renderCos(j,d);
  }).catch(function(){setBody('v2-cos','<div class="muted v2-note">暂时无法读取</div>');});
}
function setBody(id,html){var c=document.getElementById(id);if(!c)return;var b=c.querySelector('.v2-body');if(b)b.innerHTML=html;else{var nb=document.createElement('div');nb.className='v2-body';nb.innerHTML=html;c.appendChild(nb);}}

/* ---------- 网段热度趋势（只有相对值） ---------- */
var HEAT_TIP={'热门':'关注火爆，常见于促销、热门产品，或者亦可能是代理、NAT、WARP 等公共出口','活跃':'关注度高，该段备受关注，常见于促销、热门产品，或者亦可能新投入使用的IP 段','正常':'处于正常水平，多为常见IP或者是使用者查看自己的出口IP','冷门':'冷门IP段，鲜有使用，还未受到广泛关注'};
var HEAT_CLS={'热门':'ht-m-hot','活跃':'ht-m-act','正常':'ht-m-nor','冷门':'ht-m-cold'};
var _heatLast=null;
function md(s){return (s||'').slice(5).replace('-','/');}
function renderHeat(ip,j){
  if(!j||j.error||j.supported===false){setBody('v2-heat','<div class="muted v2-note">暂无数据</div>');return;}
  _heatLast=j;var vals=j.vals||[],days=j.days||[],n=vals.length;if(n<2){setBody('v2-heat','<div class="muted v2-note">暂无数据</div>');return;}
  var card=document.getElementById('v2-heat');var W=Math.max(320,Math.round(((card&&card.clientWidth)||520)-36)),H=118,TOP=22;
  function X(i){return i/(n-1)*W;}function Y(v){return H-2-(v/100)*(H-TOP-2);}
  var pts=vals.map(function(v,i){return [X(i),Y(v)];});
  var line='M'+pts[0][0].toFixed(1)+','+pts[0][1].toFixed(1);
  for(var i=1;i<n;i++){var x0=pts[i-1][0],y0=pts[i-1][1],x1=pts[i][0],y1=pts[i][1],cx=(x0+x1)/2;line+=' C'+cx.toFixed(1)+','+y0.toFixed(1)+' '+cx.toFixed(1)+','+y1.toFixed(1)+' '+x1.toFixed(1)+','+y1.toFixed(1);}
  var area=line+' L'+W+','+H+' L0,'+H+' Z';
  var pk=j.peak||{};var pi=(typeof pk.i==='number')?pk.i:0;var px=pts[pi][0],py=pts[pi][1];var pa=px<W/2?'start':'end';var ptx=pa==='start'?px+8:px-8;
  var peak='<g class="ht-peak"><line x1="'+px.toFixed(1)+'" y1="'+py.toFixed(1)+'" x2="'+px.toFixed(1)+'" y2="'+H+'"/><circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="4"/><text x="'+ptx.toFixed(1)+'" y="'+Math.max(13,py-10).toFixed(1)+'" text-anchor="'+pa+'">峰值 '+vals[pi]+' · '+esc(md(days[pi]))+'</text></g>';
  var dots='';for(var k=0;k<n;k++){var x=pts[k][0],y=pts[k][1];var an=x<W*0.25?'start':x>W*0.75?'end':'middle';dots+='<g class="ht-pt"><rect x="'+(x-W/(2*(n-1))).toFixed(1)+'" y="0" width="'+(W/(n-1)).toFixed(1)+'" height="'+H+'" fill="transparent"/><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="3"/><text x="'+x.toFixed(1)+'" y="'+Math.max(12,y-9).toFixed(1)+'" text-anchor="'+an+'">'+esc(md(days[k]))+' · '+vals[k]+'</text></g>';}
  var svg='<svg viewBox="0 0 '+W+' '+H+'" class="ht-trend" role="img" aria-label="网段热度趋势曲线"><defs><linearGradient id="htg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ht-g0"/><stop offset="1" class="ht-g1"/></linearGradient></defs><path d="'+area+'" fill="url(#htg)"/><path class="ht-line" d="'+line+'"/>'+peak+dots+'</svg>';
  var chg=Number(j.chg)||0;var arrow=chg>8?'↑':chg<-8?'↓':'→';var chgTxt=(chg>0?'+':'')+chg+'%';
  var mode=j.mode||'正常';
  var html='<div class="ht-top">'
    +'<div class="ht-tile ht-idx"><b>'+(Number(j.idx)||0)+'</b><span>热度指数<span class="tip-wrap">ⓘ<span class="tip-text">最高值为100，无比例关系，仅代表趋势变化</span></span></span></div>'
    +'<div class="ht-tile"><b>'+arrow+' '+esc(chgTxt)+'</b><span>近 7 天较前 7 天</span></div>'
    +'<div class="ht-tile '+(HEAT_CLS[mode]||'')+'"><b>'+esc(mode)+'</b><span>趋势<span class="tip-wrap">ⓘ<span class="tip-text">'+esc(HEAT_TIP[mode]||'')+'</span></span></span></div>'
    +'</div><div class="ht-chart">'+svg+'<div class="ht-axis"><span>'+esc(md(days[0]))+'</span><span>'+esc(md(days[n-1]))+'</span></div></div>'
    +'<div class="ht-foot">每日更新 · 指数与曲线均为相对趋势，不代表实际数量</div>';
  setBody('v2-heat',html);
  var sub=document.getElementById('v2-heat-sub');if(sub)sub.textContent=(j.base||ip.split('.').slice(0,3).join('.'))+'.0/24 · 近 14 天';
}
var _heatRT=null;addEventListener('resize',function(){if(!_heatLast)return;clearTimeout(_heatRT);_heatRT=setTimeout(function(){var ip=currentIp();if(ip&&document.getElementById('v2-heat'))renderHeat(ip,_heatLast);},200);});

/* ---------- 地图 ---------- */
var _land=null,_landP=null;
function landPath(){if(_land)return Promise.resolve(_land);if(_landP)return _landP;_landP=fetch('/ip/land110.txt',{cache:'force-cache'}).then(function(r){return r.text();}).then(function(t){_land=t;return t;});return _landP;}
function renderMap(ip,d){
  var gs=Array.isArray(d.geo_sources)?d.geo_sources:[];var rank={g1:0,g7:1,g3:2,g2:3};
  var pts=gs.filter(function(r){return r&&r.lat!=null&&r.lon!=null&&isFinite(r.lat)&&isFinite(r.lon);}).sort(function(a,b){return (rank[a.src]==null?9:rank[a.src])-(rank[b.src]==null?9:rank[b.src]);});
  if(!pts.length){setBody('v2-map','<div class="muted v2-note">暂无经纬度数据</div>');return;}
  var p0=pts[0];var W=1000,H=500;function px(lon){return (lon+180)/360*W;}function py(lat){return (90-lat)/180*H;}
  var cx=px(p0.lon),cy=py(p0.lat);var vw=94.4,vh=47.2;var vx=Math.max(0,Math.min(W-vw,cx-vw/2)),vy=Math.max(0,Math.min(H-vh,cy-vh/2));
  var city=[d.city||p0.city,d.country?ccZh2(d.countryCode,d.country):''].filter(Boolean).join(' · ');
  landPath().then(function(path){
    var pins=pts.slice(1).map(function(p){return'<circle cx="'+px(p.lon).toFixed(2)+'" cy="'+py(p.lat).toFixed(2)+'" r=".28" fill="var(--v2-accent)" opacity=".9"/>';}).join('');
    var html='<a class="map" href="https://www.google.com/maps?q='+encodeURIComponent(p0.lat+','+p0.lon)+'" target="_blank" rel="nofollow noopener noreferrer" title="'+esc('在 Google 地图中查看'+ip+'的IP定位点')+'">'
      +'<svg viewBox="'+vx.toFixed(2)+' '+vy.toFixed(2)+' '+vw+' '+vh+'" preserveAspectRatio="xMidYMid slice"><path class="land" d="'+path+'"/>'
      +'<g transform="translate('+cx.toFixed(2)+','+cy.toFixed(2)+')"><circle class="pulse" r="2.2" fill="var(--v2-pin)" opacity=".22"><animate attributeName="r" values="1.8;3.6;1.8" dur="2.4s" repeatCount="indefinite"/></circle><circle class="pin" r=".9" fill="var(--v2-pin)" stroke="#fff" stroke-width=".25"/><text x="'+(((cx-vx)/vw)>0.58?'-2':'2')+'" y=".85" text-anchor="'+(((cx-vx)/vw)>0.58?'end':'start')+'" class="map-label">'+esc(city.length>26?city.slice(0,25)+'…':city)+'</text></g>'+pins+'</svg>'
      +'<div class="coord">'+p0.lat.toFixed(2)+', '+p0.lon.toFixed(2)+'</div>'
      +'<div class="srcs"><span><i style="background:var(--v2-pin)"></i>主定位<em class="map-coord"> · '+p0.lat.toFixed(2)+', '+p0.lon.toFixed(2)+'</em></span>'+(pts.length>1?'<span><i style="background:var(--v2-accent)"></i>其他来源<em class="map-cnt"> '+(pts.length-1)+' 个</em></span>':'')+'</div>'
      +'<div class="inset"><svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice"><rect width="1000" height="500" fill="var(--v2-sea)"/><path class="land" d="'+path+'"/><circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="9" fill="var(--v2-pin)"/></svg></div></a>';
    setBody('v2-map',html);fitMap();try{var _ma=document.querySelector('#v2-map .map');if(_ma&&window.ResizeObserver){new ResizeObserver(function(){fitMap();}).observe(_ma);}}catch(e){}
  }).catch(function(){setBody('v2-map','<div class="muted v2-note">底图加载失败</div>');});
}
/* 标签与定位点固定像素大小：SVG 随地图宽度缩放，这里用 用户单位 = 目标像素 × (视窗宽/地图宽) 反算 */
function fitMap(){
  var a=document.querySelector('#v2-map .map');if(!a)return;var svg=a.querySelector('svg');if(!svg)return;
  var vb=(svg.getAttribute('viewBox')||'').split(' ');var vw=parseFloat(vb[2])||94.4;var mw=a.clientWidth||520;var k=vw/mw;
  var mobile=innerWidth<=700;var fs=(mobile?14:13.5)*k,pr=(mobile?6.5:5.5)*k,gap=(mobile?10:9)*k;
  var t=svg.querySelector('.map-label');if(t){t.style.fontSize=fs.toFixed(3)+'px';t.style.strokeWidth=(2.5*k).toFixed(3)+'px';t.setAttribute('y',(fs*0.36).toFixed(3));t.setAttribute('x',(t.getAttribute('text-anchor')==='end'?-gap:gap).toFixed(3));}
  var pin=svg.querySelector('.pin');if(pin){pin.setAttribute('r',pr.toFixed(3));pin.setAttribute('stroke-width',(1.6*k).toFixed(3));}
  var pu=svg.querySelector('.pulse');if(pu){pu.setAttribute('r',(pr*2.4).toFixed(3));var an=pu.querySelector('animate');if(an)an.setAttribute('values',(pr*2).toFixed(3)+';'+(pr*4).toFixed(3)+';'+(pr*2).toFixed(3));}
}
var _mapRT=null;addEventListener('resize',function(){clearTimeout(_mapRT);_mapRT=setTimeout(fitMap,150);});

/* ---------- BGP ---------- */
function bgpName(n,max){n=(n||'').trim();return n.length>max?n.slice(0,max-1)+'…':n;}
function bgpNode(x,y,asn,name,cls,w){var mx=(w||176)>=200?24:20;return'<g class="bn '+cls+'" transform="translate('+x+','+y+')"><rect width="'+(w||176)+'" height="46" rx="8"/><text x="12" y="19" class="bn-asn">AS'+asn+'</text><text x="12" y="36" class="bn-name">'+esc(bgpName(name,mx))+'</text></g>';}
function bgpSvg(p){
  var ups=(p.upstreams||[]).slice(0,4);var sec=(p.second||[]).slice(0,8);var origin=(p.origins||[])[0]||{asn:'?',name:''};
  var TOP=30;var H=Math.max(220,Math.max(ups.length,sec.length)*58+TOP+10);var svg='<svg viewBox="0 0 980 '+H+'" class="bgp" role="img" aria-label="BGP 路由拓扑">';
  var oy=(H+TOP)/2-23;svg+=bgpNode(20,oy,origin.asn,origin.name,'origin',190);
  var ux=330;var uys=ups.map(function(_,i){return TOP+i*(ups.length>1?(H-TOP-56)/(ups.length-1):0);});if(ups.length===1)uys=[oy];
  ups.forEach(function(u,i){var w=1+u.share/12;svg+='<path class="be" style="stroke-width:'+w.toFixed(1)+'" d="M210,'+(oy+23)+' C270,'+(oy+23)+' 270,'+(uys[i]+23)+' '+ux+','+(uys[i]+23)+'"/>';svg+='<text x="'+(ux-62)+'" y="'+(uys[i]+18)+'" class="be-lbl">'+u.share+'%</text>';});
  var tx=700;var tys=sec.map(function(_,i){return TOP+i*(sec.length>1?(H-TOP-56)/(sec.length-1):0);});
  sec.forEach(function(s,i){var ui=-1;ups.forEach(function(u,k){if(u.asn===s.via)ui=k;});if(ui<0)return;var w=1+s.share/12;svg+='<path class="be" style="stroke-width:'+w.toFixed(1)+'" d="M'+(ux+176)+','+(uys[ui]+23)+' C'+(ux+240)+','+(uys[ui]+23)+' '+(ux+240)+','+(tys[i]+23)+' '+tx+','+(tys[i]+23)+'"/>';});
  ups.forEach(function(u,i){svg+=bgpNode(ux,uys[i],u.asn,u.name,'up'+(u.tier1?' t1':''));});
  sec.forEach(function(s,i){svg+=bgpNode(tx,tys[i],s.asn,s.name,s.tier1?'t1':'t2',200);});
  svg+='<text x="20" y="'+(oy-8)+'" class="col-lbl">源 AS</text><text x="330" y="16" class="col-lbl">直接上游 · 路径占比</text><text x="700" y="16" class="col-lbl">二级上游 · 蓝框 = Tier 1</text></svg>';return svg;
}
function bgpList(p){
  var ups=(p.upstreams||[]).slice(0,4);var sec=(p.second||[]).slice(0,8);var origin=(p.origins||[])[0]||{asn:'?',name:''};
  function row(n,extra,cls){var sh=Number(n.share)||0;return'<div class="bl-row'+(cls?' '+cls:'')+'"><b>AS'+esc(String(n.asn))+'</b><span>'+esc(bgpName(n.name,30))+(extra||'')+'</span><em>'+sh.toFixed(1)+'%</em><i style="width:'+Math.max(2,Math.min(100,sh))+'%"></i></div>';}
  var h='<div class="bgp-list"><div class="bl-h">源 AS</div><div class="bl-row origin"><b>AS'+esc(String(origin.asn))+'</b><span>'+esc(bgpName(origin.name,30))+'</span></div>';
  h+='<div class="bl-h">直接上游 · 路径占比</div>'+ups.map(function(u){return row(u,'',u.tier1?'t1':'');}).join('');
  if(sec.length)h+='<div class="bl-h">二级上游 · 蓝色 = Tier 1</div>'+sec.map(function(x){return row(x,x.via?'<small>经 AS'+esc(String(x.via))+'</small>':'',x.tier1?'t1':'');}).join('');
  return h+'</div>';
}
function renderBgp(p){
  if(!p||p.error||p.ok===false||!p.upstreams||!p.upstreams.length){setBody('v2-bgp','<div class="muted v2-note">暂无路由观测数据</div>');return;}
  var snaps=(p.snapshots||[]);
  var thumbs=snaps.map(function(s,i){var dt=new Date((s.taken_at||0)*1000).toISOString().slice(0,10);return'<button class="th'+(i===0?' cur':'')+'" type="button" data-i="'+i+'"><span>'+dt+'</span><small>'+(i===0?'当前 · ':'')+(s.upstreams||[]).length+' 上游</small></button>';}).join('');
  var sub='<span class="v2-sub">'+esc(p.prefix||'')+' · '+(p.paths||0)+' 条观测路径</span>';
  var h3=document.querySelector('#v2-bgp > h3');if(h3&&!h3.querySelector('.v2-sub'))h3.insertAdjacentHTML('beforeend',' '+sub);
  setBody('v2-bgp','<div class="ths">'+thumbs+'</div><div class="bgp-wrap">'+bgpSvg(p)+'</div>'+bgpList(p)+'<div class="muted v2-foot">点击日期可切换历史快照；连线粗细 = 路径占比，蓝色 = Tier 1 骨干。</div>');
  var wrap=document.querySelector('#v2-bgp .ths');if(wrap)wrap.addEventListener('click',function(e){var b=e.target.closest('.th');if(!b)return;var i=parseInt(b.dataset.i,10);var s=snaps[i];if(!s)return;wrap.querySelectorAll('.th').forEach(function(x){x.classList.toggle('cur',x===b);});var q={origins:p.origins,upstreams:s.upstreams,second:s.second};var w2=document.querySelector('#v2-bgp .bgp-wrap');if(w2)w2.innerHTML=bgpSvg(q);var l2=document.querySelector('#v2-bgp .bgp-list');if(l2)l2.outerHTML=bgpList(q);});
}

/* ---------- DNSBL ---------- */
var CAT_ZH={Spam:'垃圾邮件',Botnet:'僵尸网络',Malware:'恶意代码',Reputation:'声誉','Proxy/Tor':'代理/Tor'};
function renderDnsbl(p){
  if(!p||p.error||p.ok===false||!Array.isArray(p.results)||!p.results.length){setBody('v2-dnsbl','<div class="muted v2-note">黑名单查询暂不可用</div>');return;}
  var PBL={'127.0.0.10':1,'127.0.0.11':1};
  var res=p.results.map(function(r){var o={};for(var k in r)o[k]=r[k];if(o.listed&&/spamhaus/i.test(o.zone||'')){var real=(o.codes||[]).filter(function(c){return !PBL[c];});if(!real.length){o.listed=false;o.pbl=true;}else{o.codes=real;}}return o;});
  var listed=res.filter(function(r){return r.listed;}).length;var to=res.filter(function(r){return r.status==='timeout';}).length;
  var cats={};res.forEach(function(r){cats[r.category]=(cats[r.category]||0)+1;});
  var tabs='<button class="tab on" data-cat="">全部 ('+res.length+')</button>'+Object.keys(cats).map(function(c){return'<button class="tab" data-cat="'+esc(c)+'">'+esc(CAT_ZH[c]||c)+' ('+cats[c]+')</button>';}).join('');
  var engs=res.map(function(r){var pill=r.listed?'<span class="pill bad">黑名单'+(r.codes&&r.codes.length?' '+esc(r.codes[0]):'')+'</span>':(r.pbl?'<span class="pill ok">纯净<span class="tip-wrap">ⓘ<span class="tip-text">Spamhaus PBL 策略列表：标记家宽 / 动态 IP 段不应直接发送邮件，属于运营商网段策略，不代表该 IP 有恶意或垃圾邮件行为，故按纯净计。</span></span></span>':(r.status==='timeout'?'<span class="pill mute">超时</span>':'<span class="pill ok">纯净</span>'));return'<div class="eng" data-cat="'+esc(r.category)+'"><div class="eng-top"><div><b>'+esc(r.engine)+'</b><div class="mono muted">'+esc(r.zone)+'</div></div>'+pill+'</div><div class="eng-bot"><span class="tag">'+esc(CAT_ZH[r.category]||r.category)+'</span><span class="muted mono">'+(r.ms||0)+' ms</span></div></div>';}).join('');
  var kpis='<div class="kpis"><div class="kpi"><b>'+res.length+'</b><span>检测源</span></div><div class="kpi '+(listed?'':'ok')+'"><b>'+(res.length-listed-to)+'</b><span>纯净</span></div><div class="kpi '+(listed?'bad':'')+'"><b>'+listed+'</b><span>黑名单</span></div>'+(to?'<div class="kpi"><b>'+to+'</b><span>超时</span></div>':'')+'</div>';
  var h3=document.querySelector('#v2-dnsbl > h3');if(h3&&!h3.querySelector('.kpis'))h3.insertAdjacentHTML('beforeend',kpis);
  setBody('v2-dnsbl','<div class="tabs" id="v2-dtabs">'+tabs+'</div><div class="engs" id="v2-engs">'+engs+'</div>');
  var tb=document.getElementById('v2-dtabs');if(tb)tb.addEventListener('click',function(e){var t=e.target.closest('.tab');if(!t)return;tb.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('on',x===t);});var c=t.dataset.cat;document.querySelectorAll('#v2-engs .eng').forEach(function(n){n.hidden=!!c&&n.dataset.cat!==c;});});
}

/* ---------- 同机房供应商 / 客户 ---------- */
function renderCos(j,d){
  var list=((j&&Array.isArray(j.companies))?j.companies:[]).filter(function(c){var n=String(c&&c.name||'').trim();return n&&!/^(n\/a|na|none|null|unknown|-|—)$/i.test(n);});
  if(!list.length){setBody('v2-cos','<div class="muted v2-note">暂无同 ASN 的公司记录</div>');return;}
  function tag(t){t=(t||'').toLowerCase();if(t==='hosting')return'<span class="tag idc">IDC</span>';if(t==='business')return'<span class="tag biz">企业</span>';if(t==='isp')return'<span class="tag isp">ISP</span>';return'';}
  var rows=list.map(function(c){return'<div class="co" data-type="'+esc((c.type||'').toLowerCase())+'"><span class="co-name" title="'+esc(c.name)+'">'+esc(c.name)+'</span><span class="co-meta">'+tag(c.type)+'</span></div>';}).join('');
  var hasIdc=list.some(function(c){return (c.type||'').toLowerCase()==='hosting';});
  var tabs=hasIdc?'<div class="tabs" id="v2-ctabs"><button class="tab on" data-t="">显示所有</button><button class="tab" data-t="hosting">仅 IDC</button></div>':'';
  setBody('v2-cos',tabs+'<div class="cogrid" id="v2-cogrid">'+rows+'</div>');
  var h3=document.querySelector('#v2-cos > h3');if(h3&&!h3.querySelector('.v2-sub'))h3.insertAdjacentHTML('beforeend',' <span class="v2-sub">AS'+esc(String(j.asn||d.asn||''))+'</span>');
  var tb=document.getElementById('v2-ctabs');if(tb)tb.addEventListener('click',function(e){var t=e.target.closest('.tab');if(!t)return;tb.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('on',x===t);});var c=t.dataset.t;document.querySelectorAll('#v2-cogrid .co').forEach(function(n){n.hidden=!!c&&n.dataset.type!==c;});});
}

/* ---------- 入口：等 ip-page.js 渲染完成后加工 ---------- */
function currentIp(){var m=(location.pathname||'').match(/^\/ip\/([^\/?#]+)/);if(m){try{return decodeURIComponent(m[1]);}catch(e){return m[1];}}var a=out.querySelector('.ip-head a.ip');return a?a.textContent.trim():'';}
function ready(){var b=out.querySelector('.result-body');if(!b)return false;if(b.querySelector('.skeleton-card'))return false;return !!cardByTitle('ASN / 运营商');}
function enhance(){
  if(!ready())return;var ip=currentIp();if(!ip)return;var body=out.querySelector('.result-body');
  if(body.getAttribute('data-v2')===ip)return;body.setAttribute('data-v2',ip);
  function apply(d){if(!d||d.error||d.is_bogon)return;try{enhanceHead(d);}catch(e){}try{enhanceCards(d);}catch(e){}if(d.is_public_service)return;try{buildSections(ip,d);}catch(e){}}
  var cap=_cap[ip];
  if(cap&&cap.data){apply(cap.data);return;}
  if(cap&&cap.promise){cap.promise.then(function(d){if(d)apply(d);else fallback();});return;}
  fallback();
  function fallback(){fetch(API2+'lookup/'+encodeURIComponent(ip),{signal:AbortSignal.timeout(20000)}).then(function(r){return r.json();}).then(apply).catch(function(){body.removeAttribute('data-v2');});}
}
var mo=new MutationObserver(function(){enhance();});
mo.observe(out,{childList:true,subtree:true});
enhance();
})();
