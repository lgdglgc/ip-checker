
(function () {
  'use strict';
  var input = document.getElementById('wInput');
  var btn = document.getElementById('wBtn');
  var box = document.getElementById('wResult');
  var busy = false;
  var lastQ = '';

  var STATUS_CN = {
    'active': ['正常', 'good', '正常状态：域名无任何限制或异常，解析与使用一切正常。'],
    'ok': ['正常', 'good', '正常状态：域名无任何限制或异常，解析与使用一切正常。'],
    'clienttransferprohibited': ['注册商转移锁', '', '注册商设置的转移锁：禁止把域名转移到其他注册商，防止域名被恶意过户。绝大多数域名默认开启，属于正常保护。'],
    'servertransferprohibited': ['注册局转移锁', '', '注册局层面的转移锁：由注册局直接锁定禁止转移，保护级别高于注册商锁，常见于高价值域名。'],
    'clientupdateprohibited': ['注册商更新锁', '', '注册商设置的更新锁：禁止修改域名注册信息（联系人、DNS 服务器等），防止信息被篡改。'],
    'serverupdateprohibited': ['注册局更新锁', '', '注册局层面的更新锁：由注册局锁定禁止修改任何注册信息，保护级别更高。'],
    'clientdeleteprohibited': ['注册商删除锁', '', '注册商设置的删除锁：禁止删除该域名，防止误删或被恶意删除。'],
    'serverdeleteprohibited': ['注册局删除锁', '', '注册局层面的删除锁：由注册局锁定禁止删除，保护级别更高。'],
    'clienthold': ['暂停解析(异常)', 'warn', '注册商暂停解析：域名 DNS 已停止工作，网站和邮箱都会失效。常因欠费、未实名或争议导致，需尽快联系注册商处理。'],
    'serverhold': ['注册局暂停解析', 'warn', '注册局暂停解析：常见于未完成实名认证或违规，域名完全无法解析，需联系注册商核实原因。'],
    'pendingdelete': ['等待删除', 'warn', '等待删除：域名即将从注册局彻底删除并重新开放注册，通常持续约 5 天，此阶段无法赎回。'],
    'redemptionperiod': ['赎回期', 'warn', '赎回期：域名已过期并被删除，原持有人约 30 天内可付高额赎回费找回，逾期将进入删除流程。'],
    'pendingtransfer': ['转移中', 'warn', '转移中：域名正在进行注册商之间的转移，通常 5-7 天内完成。'],
    'autorenewperiod': ['自动续费宽限期', '', '自动续费宽限期：到期后注册局自动续费的宽限窗口（约 45 天），期间注册商可取消续费。'],
    'addperiod': ['新注册宽限期', '', '新注册宽限期：域名注册后的头 5 天，注册商可在此期间删除并获得退款。'],
    'inactive': ['未配置DNS', 'warn', '未配置 DNS：域名没有设置名称服务器，处于无法解析的状态。'],
    'connect': ['正常', 'good', '正常状态：域名已注册并正常连接（DENIC 注册局的状态表示法）。']
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function fmtDate(iso) {
    if (!iso) return '';
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[1] + '-' + m[2] + '-' + m[3] : esc(String(iso).slice(0, 19));
  }
  function daysBetween(iso, future) {
    if (!iso) return null;
    var t = Date.parse(iso);
    if (isNaN(t)) return null;
    var d = (future ? t - Date.now() : Date.now() - t) / 86400000;
    return Math.floor(d);
  }
  function row(k, vHtml) {
    return vHtml ? '<div class="w-row"><span class="k">' + k + '</span><span class="v">' + vHtml + '</span></div>' : '';
  }
  function card(title, inner) {
    return inner ? '<div class="w-card"><h3>' + title + '</h3>' + inner + '</div>' : '';
  }

  var ICONS = {
    domain: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
    ip: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
    asn: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/><path d="M12 7.2 6 17M12 7.2 18 17M7.2 19h9.6"/></svg>'
  };

  function statusMeta(list) {
    var locks = 0, bad = false, badges = '', seen = {};
    (list || []).forEach(function (s) {
      var k = String(s).toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[\s_-]/g, '');
      if (!k || seen[k]) return; seen[k] = 1;
      var info = STATUS_CN[k];
      if (/prohibited$/.test(k)) locks++;
      if (info && info[1] === 'warn') bad = true;
      var tip = (info && info[2]) ? esc(s) + String.fromCharCode(10) + info[2] : esc(s);
      badges += '<span class="w-badge ' + (info ? info[1] : '') + '" title="' + tip + '">' + (info ? info[0] : esc(s)) + '</span> ';
    });
    return { locks: locks, bad: bad, badges: badges };
  }

  function dateLine(d) {
    if (!d.cached_at) return '';
    var t = new Date(d.cached_at * 1000);
    var st = t.getFullYear() + '/' + String(t.getMonth() + 1).padStart(2, '0') + '/' + String(t.getDate()).padStart(2, '0');
    return '<div class="w-meta" style="display:flex;justify-content:flex-start;align-items:center;gap:10px;margin:0 0 12px">最近查询日期：' + st +
      '<span class="w-chip" data-act="refresh" title="强制刷新，马上查询最新数据" style="display:inline-flex;align-items:center;gap:5px"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>刷新</span></div>';
  }

  function copyIco(v) {
    return '<span class="w-copy" data-v="' + esc(v) + '" title="复制">📋</span>';
  }

  function syncMeta(d) {
    var t = d.type, base = ' - Net.Coffee', name = d.query;
    if (d.unicode_name && d.unicode_name !== d.query) name = d.unicode_name;
    if (t === 'asn') name = 'AS' + d.query;
    var title;
    if (t === 'domain') {
      title = d.unregistered ? name + ' WHOIS查询 - 该域名未注册' + base
        : name + ' WHOIS查询 - 注册商/注册时间/到期时间' + base;
    } else if (t === 'asn') {
      title = name + ' WHOIS查询 - 自治系统归属信息' + base;
    } else {
      title = name + ' WHOIS查询 - IP段归属/RIR注册信息' + base;
    }
    document.title = title;
    var pid = (t === 'asn') ? 'AS' + d.query : d.query;
    var can = document.getElementById('canonical');
    if (can) can.href = 'https://ip.net.coffee/whois/' + pid;
  }

  function render(d) {
    if (d && (d.ok || d.unregistered) && d.type) syncMeta(d);
    if (!d.ok && !d.unregistered) {
      box.innerHTML = '<div class="w-error">' + esc(d.error || '查询失败,请稍后重试') + '</div>';
      return;
    }
    var typeName = { domain: '域名', ipv4: 'IPv4 地址', ipv6: 'IPv6 地址', asn: 'ASN 自治系统' }[d.type] || d.type;
    if (d.unregistered) {
      box.innerHTML = dateLine(d) +
        '<div class="w-free"><div style="font-size:1.6em">🎉</div>' +
        '<div style="font-weight:700;font-size:1.1em;margin:6px 0"><span style="word-break:break-all">' + esc(d.query) + '</span> 尚未注册</div>' +
        '<div style="color:var(--text-soft);font-size:0.88em">该' + typeName + '当前处于可注册状态(注册局权威数据)</div></div>';
      return;
    }

    var isDomain = d.type === 'domain';
    var sm = statusMeta(d.status);
    var name = d.unicode_name && d.unicode_name !== d.query ? d.unicode_name : (d.type === 'asn' ? 'AS' + d.query : d.query);

    // ---- 头部聚合卡 ----
    var pill;
    if (isDomain) pill = sm.bad ? '<span class="w-pill bad">已注册 · 状态异常</span>' : '<span class="w-pill ok">已注册 · 状态正常</span>';
    else pill = '<span class="w-pill mut">' + esc(d.net_type || (d.type === 'asn' ? '自治系统' : '已分配')) + '</span>';
    var sub = [];
    if (d.registrar && d.registrar.name) sub.push(esc(d.registrar.name) + (d.registrar.iana_id ? ' · IANA #' + esc(d.registrar.iana_id) : ''));
    else if (d.name) sub.push(esc(d.name));
    if (!isDomain && d.rir_whois) sub.push(esc(d.rir_whois));
    if (d.unicode_name && d.unicode_name !== d.query) sub.push(esc(d.query));
    var age = d.created ? daysBetween(d.created, false) : null;
    var ageChip = (age != null && age >= 0)
      ? '<span class="w-pill mut">' + (isDomain ? '域名年龄 ' : '分配 ') + (age >= 365 ? (age / 365).toFixed(1) + ' 年' : age + ' 天') + '</span>' : '';

    var hero = '<div class="w-hero"><div class="w-hero-top">' +
      '<div class="w-hero-ic">' + (ICONS[isDomain ? 'domain' : (d.type === 'asn' ? 'asn' : 'ip')]) + '</div>' +
      '<div style="flex:1;min-width:160px">' +
      ((d.type === 'ipv4' || d.type === 'ipv6')
        ? '<a class="w-hero-name" href="/ip/' + esc(d.query) + '" target="_blank" rel="noopener"'
          + ' title="查看 ' + esc(d.query) + ' 的 IP 评分与风险检测">' + esc(name)
          + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'
          + '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg></a>'
        : '<div class="w-hero-name">' + esc(name) + '</div>') +
      '<div class="w-hero-sub">' + (sub.join(' · ') || typeName) + '</div></div>' +
      pill + ageChip + '</div>';

    // ---- 生命周期时间轴 ----
    if (isDomain && d.created && d.expires) {
      var t0 = Date.parse(d.created), t1 = Date.parse(d.expires), now = Date.now();
      if (!isNaN(t0) && !isNaN(t1) && t1 > t0) {
        var pct = Math.min(100, Math.max(0, Math.round((now - t0) / (t1 - t0) * 100)));
        var left = daysBetween(d.expires, true);
        var color = '#1a7f3c', cap;
        if (left == null) { cap = ''; }
        else if (left < 0) { color = '#c0392b'; pct = 100; cap = '已过期 <b style="color:#c0392b">' + (-left) + ' 天</b>'; }
        else if (left <= 45) { color = '#c0392b'; cap = '距到期仅剩 <b style="color:#c0392b">' + left + ' 天</b> · 生命周期已走过 ' + pct + '%'; }
        else if (left <= 90) { color = '#d97706'; cap = '距到期还有 <b style="color:#d97706">' + left + ' 天</b> · 生命周期已走过 ' + pct + '%'; }
        else { cap = '距到期还有 <b style="color:#1a7f3c">' + left + ' 天</b> · 生命周期已走过 ' + pct + '%'; }
        hero += '<div class="w-tl"><div class="w-tl-lab">' +
          '<span>注册 ' + fmtDate(d.created) + '</span><span style="color:var(--text-soft)">今天</span><span>到期 ' + fmtDate(d.expires) + '</span></div>' +
          '<div class="w-tl-bar"><div class="w-tl-fill" style="width:' + pct + '%;background:' + color + '"></div></div>' +
          (cap ? '<div class="w-tl-cap">' + cap + '</div>' : '') + '</div>';
      }
    }
    hero += '</div>';

    // ---- 辅助卡 ----
    var stCard = '';
    if (sm.badges) {
      stCard = '<div style="line-height:2.1">' + sm.badges + '</div>' +
        (sm.locks ? '<div style="font-size:0.78em;color:var(--text-muted);margin-top:6px">' + sm.locks + ' 项注册局/注册商级保护</div>' : '');
    }

    var dt = '';
    if (d.created) dt += row('注册时间', fmtDate(d.created));
    if (d.expires) dt += row('到期时间', fmtDate(d.expires));
    if (d.updated) dt += row('最近更新', fmtDate(d.updated));

    var ns = '';
    if (d.nameservers && d.nameservers.length) {
      ns = '<div class="w-ns">' + d.nameservers.map(function (n) {
        return '• ' + esc(n) + copyIco(n);
      }).join('<br>') + '</div>';
    }

    var sec = '';
    if (d.dnssec === true) sec += row('DNSSEC', '<span class="w-badge good">已签名</span>');
    else if (d.dnssec === false) sec += row('DNSSEC', '未启用');
    if (d.abuse_email) sec += row('滥用举报', '<a href="mailto:' + esc(d.abuse_email) + '" style="color:inherit">' + esc(d.abuse_email) + '</a>');
    if (d.handle) sec += row('注册局句柄', esc(d.handle));

    var own = '';
    if (d.registrant && (d.registrant.org || d.registrant.name)) own += row(isDomain ? '注册人/组织' : '所属组织', esc(d.registrant.org || d.registrant.name));
    if (d.registrant && d.registrant.country) own += row('国家/地区', esc(d.registrant.country));
    else if (d.country) own += row('国家/地区', esc(d.country));
    if (d.cidr) own += row('CIDR', esc(d.cidr) + copyIco(d.cidr));
    if (d.start && d.end) own += row('地址范围', esc(d.start) + '<br>~ ' + esc(d.end));

    var html = dateLine(d) + hero + '<div class="w-grid">' +
      card('🔖 状态保护', stCard) + card('📅 关键日期', dt) +
      card('🌐 DNS 服务器', ns) + card('🛡️ 安全', sec) +
      card(isDomain ? '🏢 归属信息' : '🏢 网段归属', own) + '</div>';

    var raws = '';
    if (d.raw_whois) raws += '<details class="w-raw"><summary>📄 原始 WHOIS 数据<span class="w-rawact"><span class="w-chip w-rawbtn" data-act="copy">复制</span><span class="w-chip w-rawbtn" data-act="toggle">展开</span></span></summary><pre>' + esc(d.raw_whois) + '</pre></details>';
    if (d.raw_rdap) raws += '<details class="w-raw"><summary>🧾 原始 RDAP 数据 (JSON)<span class="w-rawact"><span class="w-chip w-rawbtn" data-act="copy">复制</span><span class="w-chip w-rawbtn" data-act="toggle">展开</span></span></summary><pre>' + esc(JSON.stringify(d.raw_rdap, null, 2)) + '</pre></details>';
    box.innerHTML = html + raws;
  }


  function vget(vc, want) {
    try {
      for (var i = 0; i < vc[1].length; i++) {
        var it = vc[1][i];
        if (it[0] === want) {
          if (want === 'adr') {
            var p = it[3];
            if (Array.isArray(p) && p.length) return String(p[p.length - 1] || '').trim();
          } else return String(it[3]).trim();
        }
      }
    } catch (e) {}
    return '';
  }
  function entWalk(ents, out, depth) {
    if (!ents || depth > 3) return out;
    for (var i = 0; i < ents.length; i++) {
      var ent = ents[i];
      var roles = (ent.roles || []).map(function (r) { return String(r).toLowerCase(); });
      var vc = ent.vcardArray;
      var fn = vc ? vget(vc, 'fn') : '', org = vc ? vget(vc, 'org') : '';
      var email = vc ? vget(vc, 'email') : '', country = vc ? vget(vc, 'adr') : '';
      if (roles.indexOf('registrar') > -1 && !out.registrar) {
        var iid = '';
        (ent.publicIds || []).forEach(function (p) {
          if (String(p.type || '').toLowerCase().indexOf('iana') > -1) iid = String(p.identifier || '');
        });
        out.registrar = { name: fn || org || ent.handle || '', iana_id: iid };
      }
      if (roles.indexOf('registrant') > -1 && !out.registrant) out.registrant = { name: fn, org: org, country: country };
      if (roles.indexOf('abuse') > -1 && email && !out.abuse_email) out.abuse_email = email;
      entWalk(ent.entities, out, depth + 1);
    }
    return out;
  }
  function rdapParseClient(j, type, q) {
    var d = { ok: true, query: q, type: type, source: 'RDAP', cached: false,
      cached_at: Math.floor(Date.now() / 1000), raw_rdap: j };
    d.handle = j.handle || '';
    d.unicode_name = j.unicodeName || '';
    d.status = j.status || [];
    (j.events || []).forEach(function (ev) {
      if (ev.eventAction === 'registration') d.created = ev.eventDate;
      else if (ev.eventAction === 'expiration') d.expires = ev.eventDate;
      else if (ev.eventAction === 'last changed') d.updated = ev.eventDate;
    });
    var nsSet = {};
    (j.nameservers || []).forEach(function (n) { var v = (n.ldhName || '').toLowerCase(); if (v) nsSet[v] = 1; });
    d.nameservers = Object.keys(nsSet).sort();
    if (type === 'domain') d.dnssec = !!(j.secureDNS && j.secureDNS.delegationSigned);
    entWalk(j.entities, d, 0);
    if (type !== 'domain') {
      d.name = j.name || ''; d.net_type = j.type || ''; d.country = j.country || '';
      if (j.port43) d.rir_whois = j.port43;
      if (type !== 'asn') {
        d.start = j.startAddress || ''; d.end = j.endAddress || '';
        d.cidr = (j.cidr0_cidrs || []).map(function (c) {
          return (c.v4prefix || c.v6prefix) + '/' + c.length;
        }).join(', ');
      }
    }
    return d;
  }

  function lookup(q, force) {    q = (q || '').trim();
    if (!q || busy) return;
    lastQ = q;
    busy = true; btn.disabled = true;
    var skC='<div class=\"w-card\"><div class=\"w-skel\" style=\"height:14px;width:34%\"></div><div class=\"w-skel\" style=\"height:12px;margin-top:12px\"></div><div class=\"w-skel\" style=\"height:12px;margin-top:8px;width:78%\"></div></div>';box.innerHTML = '<div class=\"w-hero\"><div class=\"w-hero-top\"><div class=\"w-skel\" style=\"width:42px;height:42px;border-radius:10px\"></div><div style=\"flex:1\"><div class=\"w-skel\" style=\"height:20px;width:42%\"></div><div class=\"w-skel\" style=\"height:12px;width:64%;margin-top:8px\"></div></div><div class=\"w-skel\" style=\"height:26px;width:118px;border-radius:20px\"></div></div><div class=\"w-skel\" style=\"height:8px;margin-top:18px\"></div></div><div class=\"w-grid\">'+skC+skC+skC+skC+'</div>';
    try { history.replaceState(null, '', '/whois/' + encodeURIComponent(q)); } catch (e) {}
    var api = '/api/whois/lookup/' + encodeURIComponent(q);
    function unlock() { busy = false; btn.disabled = false; }
    function fetchServer(url) {
      fetch(url, { signal: AbortSignal.timeout(40000), cache: 'no-store' })
        .then(function (r) {
          if (r.status === 429) throw { _rl: true };
          return r.json().catch(function () { throw { _bad: true }; });
        })
        .then(render)
        .catch(function (e) {
          var msg = (e && e._rl) ? '查询太频繁了，请等几秒再试'
            : (e && e._bad) ? '服务响应异常,请稍后重试'
            : (e && e.name === 'TimeoutError') ? '查询超时,注册局响应较慢,请稍后重试'
            : '网络异常,请稍后重试';
          box.innerHTML = '<div class="w-error">' + msg + '</div>';
        })
        .finally(unlock);
    }
    function directRdap(type, norm) {
      var u = 'https://rdap.org/' + (type === 'asn' ? 'autnum/' : (type === 'domain' ? 'domain/' : 'ip/')) + encodeURIComponent(norm);
      fetch(u, { signal: AbortSignal.timeout(6500), headers: { Accept: 'application/rdap+json' } })
        .then(function (r) { if (r.status !== 200) throw 0; return r.json(); })
        .then(function (j) { render(rdapParseClient(j, type, norm)); unlock(); })
        .catch(function () { fetchServer('/api/whois/lookup/' + encodeURIComponent(norm)); });
    }
    if (force) { fetchServer(api + '?refresh=1'); return; }
    fetch(api + '?cacheonly=1', { signal: AbortSignal.timeout(12000), cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.miss) directRdap(d.type, d.normalized || q);
        else { render(d); unlock(); }
      })
      .catch(function () { fetchServer(api); });
  }

  btn.addEventListener('click', function () { lookup(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') lookup(input.value); });
  document.querySelectorAll('.w-chip').forEach(function (c) {
    c.addEventListener('click', function () { input.value = c.dataset.q; lookup(c.dataset.q); });
  });
  function writeClip(v, onOk) {
    function legacy() {
      try {
        var ta = document.createElement('textarea');
        ta.value = v; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) onOk();
      } catch (err) {}
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).then(onOk).catch(legacy);
    } else legacy();
  }
  box.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest('.w-copy') : null;
    if (c) {
      writeClip(c.getAttribute('data-v') || '', function () {
        c.textContent = '✅'; setTimeout(function () { c.textContent = '📋'; }, 900);
      });
      return;
    }
    var rf = e.target.closest ? e.target.closest('[data-act="refresh"]') : null;
    if (rf) { if (lastQ) lookup(lastQ, true); return; }
    var t = e.target.closest ? e.target.closest('.w-rawbtn') : null;
    if (t) {
      e.preventDefault();
      var det = t.closest('details');
      if (!det) return;
      if (t.getAttribute('data-act') === 'toggle') {
        det.open = !det.open;
      } else {
        var pre = det.querySelector('pre');
        writeClip(pre ? pre.textContent : '', function () {
          var o = t.textContent; t.textContent = '已复制';
          setTimeout(function () { t.textContent = o; }, 900);
        });
      }
    }
  });
  box.addEventListener('toggle', function (e) {
    var det = e.target;
    if (det && det.classList && det.classList.contains('w-raw')) {
      var b = det.querySelector('[data-act="toggle"]');
      if (b) b.textContent = det.open ? '折叠' : '展开';
    }
  }, true);
  var pm = location.pathname.match(/^\/whois\/([^\/]+)\/?$/);
  var qm = location.search.match(/[?&]q=([^&]+)/);
  var q0 = pm ? decodeURIComponent(pm[1]) : (qm ? decodeURIComponent(qm[1]) : '');
  if (q0) { input.value = q0; lookup(q0); }
  else input.focus();
})();

;

(function () {
  'use strict';
  var CATN = { cc: '国家和地区', new: '新通用', generic: '传统通用', idn: '国际化(IDN)', sponsored: '赞助型' };
  fetch('/api/whois/tlds', { signal: AbortSignal.timeout(15000) })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.ok) return;
      function stat(label, val, sub) {
        return '<div class="w-card"><div style="font-size:0.82em;color:var(--text-muted)">' + label +
          '</div><div style="font-size:1.5em;font-weight:700;color:#1a7f3c;margin:2px 0">' + val +
          '</div><div style="font-size:0.78em;color:var(--text-soft)">' + sub + '</div></div>';
      }
      document.getElementById('wTldStats').innerHTML =
        stat('可查询域名后缀', d.total.toLocaleString(), 'IANA 根区全量覆盖,含全部国家域与新通用域') +
        stat('RDAP 直连注册局', d.rdap.toLocaleString(), '现代协议,结构化数据,秒级响应') +
        stat('传统 WHOIS 兜底', d.whois_fallback.toLocaleString(), '无 RDAP 的后缀自动切换 43 端口查询') +
        stat('查询维度', '10+', '注册商 / 日期 / 状态 / DNS / DNSSEC / 归属等');

      var cats = document.getElementById('wTldCats');
      var chips = document.getElementById('wTldChips');
      var more = document.getElementById('wTldMore');
      var search = document.getElementById('wTldSearch');
      var order = ['cc', 'new', 'generic', 'idn', 'sponsored'];
      var state = { cat: 'all', q: '', expanded: false };

      function filtered() {
        return d.tlds.filter(function (i) {
          if (state.cat !== 'all' && i.c !== state.cat) return false;
          if (state.q && i.t.indexOf(state.q) !== 0) return false;
          return true;
        });
      }
      function paintCats() {
        cats.innerHTML = order.map(function (c) {
          return '<span class="w-badge w-cat' + (state.cat === c ? ' good' : '') + '" data-cat="' + c + '">' +
            CATN[c] + ': <b style="color:#1a7f3c">' + (d.categories[c] || 0).toLocaleString() + '</b></span>';
        }).join('') + '<span class="w-badge w-cat' + (state.cat === 'all' ? ' good' : '') +
          '" data-cat="all">全部: <b>' + d.total.toLocaleString() + '</b></span>';
      }
      function paint() {
        var list = filtered();
        var n = state.expanded ? list.length : 60;
        chips.innerHTML = list.slice(0, n).map(function (i) {
          return '<span class="w-chip" style="cursor:default">.' + i.t + '</span>';
        }).join('') || '<span style="font-size:0.85em;color:var(--text-muted)">无匹配的后缀</span>';
        if (list.length > 60) {
          more.style.display = 'inline-block';
          more.textContent = state.expanded ? '收起' : '显示全部 ' + list.length.toLocaleString() + ' 个';
        } else {
          more.style.display = 'none';
        }
      }
      cats.addEventListener('click', function (e) {
        var c = e.target.closest ? e.target.closest('.w-cat') : null;
        if (!c) return;
        state.cat = c.getAttribute('data-cat');
        state.expanded = false;
        paintCats(); paint();
      });
      search.addEventListener('input', function () {
        state.q = search.value.trim().toLowerCase().replace(/^\./, '');
        state.expanded = false;
        paint();
      });
      more.addEventListener('click', function () {
        state.expanded = !state.expanded;
        paint();
      });
      paintCats(); paint();
    }).catch(function () { document.getElementById('wTldSec').style.display = 'none'; });
})();

