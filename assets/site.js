/* Toke After Dark: interactions. Vanilla, no dependencies. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  root.classList.remove('no-js');
  var RM = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  var sess = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };
  var STORES = w.TOKE_STORES || {};

  /* ---------------- age gate (answer first) ---------------- */
  var gate = $('#agegate');
  if (gate) {
    var ok = +store('toke-age-ok') || 0;
    if (Date.now() - ok < 30 * 864e5) gate.hidden = true;
    else { gate.hidden = false; d.body.classList.add('no-scroll'); var yes = $('[data-age-yes]', gate); if (yes) setTimeout(function () { try { yes.focus({ preventScroll: true }); } catch (e) {} }, 30); }
    gate.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-age-yes')) {
        store('toke-age-ok', String(Date.now())); gate.classList.add('lit');
        setTimeout(function () { gate.classList.add('go'); }, 260);
        setTimeout(function () { gate.hidden = true; d.body.classList.remove('no-scroll'); }, 760);
      } else if (t.hasAttribute('data-age-no')) gate.classList.add('denied');
    });
  }

  /* ---------------- header + mega menus + drawer ---------------- */
  var hdr = $('.hdr');
  var onScrollHdr = function () { if (hdr) hdr.classList.toggle('is-solid', w.scrollY > 40 || !$('.hero')); };
  onScrollHdr();
  w.addEventListener('scroll', onScrollHdr, { passive: true });
  $$('.nav__item').forEach(function (it) {
    var btn = $('.nav__btn', it); if (!btn || !$('.mega', it)) return;
    var t; var open = function () { clearTimeout(t); $$('.nav__item.open').forEach(function (o) { if (o !== it) o.classList.remove('open'); }); it.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); };
    var close = function () { t = setTimeout(function () { it.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }, 160); };
    it.addEventListener('mouseenter', open); it.addEventListener('mouseleave', close);
    btn.addEventListener('click', function (e) { e.preventDefault(); if (it.classList.contains('open')) { it.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } else open(); });
    it.addEventListener('focusout', function (e) { if (!it.contains(e.relatedTarget)) { it.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
  });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { $$('.nav__item.open').forEach(function (o) { o.classList.remove('open'); }); if (root.classList.contains('drawer-open')) toggleDrawer(false); } });
  var burger = $('.burger');
  function toggleDrawer(on) { root.classList.toggle('drawer-open', on); d.body.classList.toggle('no-scroll', on); if (burger) burger.setAttribute('aria-expanded', on ? 'true' : 'false'); updateBar(); }
  if (burger) burger.addEventListener('click', function () { toggleDrawer(!root.classList.contains('drawer-open')); });
  $$('.drawer a').forEach(function (a) { a.addEventListener('click', function () { toggleDrawer(false); }); });

  /* ---------------- store preference + open status ---------------- */
  function hoursOf(id) { return (STORES[id] || {}).hm || {}; }
  function nyNow() { var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()); var o = {}; p.forEach(function (x) { o[x.type] = x.value; }); var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }; return { day: days[o.weekday], h: (+o.hour % 24) + (+o.minute) / 60 }; }
  function fmt(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60), ap = hh >= 12 ? 'PM' : 'AM', h12 = hh % 12 || 12; return h12 + (mm ? ':' + (mm < 10 ? '0' : '') + mm : '') + ' ' + ap; }
  function statusOf(id) {
    var hm = hoursOf(id), n = nyNow(), today = hm[n.day];
    if (today && n.h >= today[0] && n.h < today[1]) return { open: true, text: 'Open until ' + fmt(today[1]) };
    var next = today && n.h < today[0] ? today : hm[(n.day + 1) % 7];
    return { open: false, text: next ? 'Closed · opens ' + fmt(next[0]) + (today && n.h < today[0] ? '' : ' tomorrow') : 'Closed' };
  }
  var cur = store('toke-store') || 'yonkers';
  function swapHref(h, id) { return id === 'spring-valley' ? h.replace('shop-yonkers/', 'shop-spring-valley/') : h.replace('shop-spring-valley/', 'shop-yonkers/'); }
  function applyStore(id) {
    cur = id; store('toke-store', id);
    var s = STORES[id] || {};
    $$('[data-store-link]').forEach(function (a) { a.setAttribute('href', swapHref(a.getAttribute('href'), id)); });
    $$('[data-store-name]').forEach(function (el) { el.textContent = s.label || ''; });
    $$('[data-store-full]').forEach(function (el) { el.textContent = s.name || ''; });
    $$('[data-store-pick]').forEach(function (b) { var on = b.getAttribute('data-store-pick') === id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    paintStatus();
  }
  function paintStatus() {
    $$('[data-status]').forEach(function (el) {
      var id = el.getAttribute('data-status') || cur; if (id === 'current') id = cur;
      var st = statusOf(id); el.classList.toggle('is-open', st.open); el.classList.toggle('is-closed', !st.open);
      var t = $('[data-status-text]', el); if (t) t.textContent = st.text;
    });
  }
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-store-pick]'); if (!b) return;
    var id = b.getAttribute('data-store-pick'); if (id === cur && !b.hasAttribute('data-reload')) return;
    applyStore(id);
    if (b.hasAttribute('data-reload')) { e.preventDefault(); var h = b.getAttribute('data-href'); if (h) location.href = h; }
  });
  var chip = $('.storechip');
  if (chip) chip.addEventListener('click', function () { applyStore(cur === 'yonkers' ? 'spring-valley' : 'yonkers'); });
  applyStore(cur);
  setInterval(paintStatus, 60000);

  /* ---------------- sticky bar ---------------- */
  var bar = $('.sbar'), hero = $('.hero, .phero'), foot = $('.foot'), typing = false;
  var dismissed = sess('toke-bar-x') === '1';
  function updateBar() {
    if (!bar) return;
    var y = w.scrollY, vh = w.innerHeight;
    var past = hero ? y > hero.offsetTop + hero.offsetHeight * 0.65 : y > vh * 0.5;
    var nearFoot = foot ? foot.getBoundingClientRect().top < vh - 40 : false;
    var show = past && !nearFoot && !typing && !dismissed && !root.classList.contains('drawer-open') && !(gate && !gate.hidden);
    bar.classList.toggle('show', show); bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    $$('a,button', bar).forEach(function (x) { x.tabIndex = show ? 0 : -1; });
  }
  if (bar) {
    w.addEventListener('scroll', updateBar, { passive: true }); w.addEventListener('resize', updateBar);
    d.addEventListener('focusin', function (e) { if (e.target.matches('input,textarea,select') && !bar.contains(e.target)) { typing = true; updateBar(); } });
    d.addEventListener('focusout', function (e) { if (e.target.matches('input,textarea,select')) { typing = false; setTimeout(updateBar, 50); } });
    var x = $('.sbar__x', bar); if (x) x.addEventListener('click', function () { dismissed = true; sess('toke-bar-x', '1'); updateBar(); });
    updateBar();
  }

  /* ---------------- cinematic headings + reveals ---------------- */
  $$('.ch').forEach(function (h) {
    if (h.dataset.split) return; h.dataset.split = '1';
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/); var frag = d.createDocumentFragment();
          parts.forEach(function (p) { if (!p) return; if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; } var o = d.createElement('span'); o.className = 'w'; var i = d.createElement('span'); i.textContent = p; o.appendChild(i); frag.appendChild(o); });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR' && !c.classList.contains('w')) {
          if (c.tagName === 'EM') { var o2 = d.createElement('span'); o2.className = 'w'; c.parentNode.insertBefore(o2, c); var i2 = d.createElement('span'); o2.appendChild(i2); i2.appendChild(c); }
          else walk(c);
        }
      });
    };
    walk(h);
  });
  if ('IntersectionObserver' in w && !RM) {
    // a clip-path reveal starts fully clipped, which IntersectionObserver never reports: watch its parent instead
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var t = e.target._rv || e.target; t.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    $$('[data-reveal], .ch, .feat').forEach(function (el) { if (el.getAttribute('data-reveal') === 'clip' && el.parentElement) { var p = el.parentElement; p._rv = el; io.observe(p); } else io.observe(el); });
    // safety: after a fast fling, everything at or above the bottom of the screen is revealed once scrolling stops
    var sweep = function () { var vh = w.innerHeight; $$('[data-reveal]:not(.in), .ch:not(.in), .feat:not(.in)').forEach(function (el) { var r = (el.getAttribute('data-reveal') === 'clip' && el.parentElement ? el.parentElement : el).getBoundingClientRect(); if (r.top < vh) el.classList.add('in'); }); };
    var flingT; w.addEventListener('scroll', function () { clearTimeout(flingT); flingT = setTimeout(sweep, 120); }, { passive: true });
    setTimeout(sweep, 400);
  } else { $$('[data-reveal], .ch, .feat').forEach(function (el) { el.classList.add('in'); }); }
  $$('.stagger').forEach(function (g) { Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); }); });

  /* ---------------- ember trails: draw with scroll ---------------- */
  var trails = $$('.trail');
  trails.forEach(function (t) {
    $$('path', t).forEach(function (p) { p.setAttribute('pathLength', '1'); });
    t._core = $('.t-core', t); t._head = $('.t-head', t); t._len = t._core ? t._core.getTotalLength() : 0;
  });
  function drawTrails() {
    var vh = w.innerHeight;
    trails.forEach(function (t) {
      var r = t.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      var p = RM ? 1 : Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
      if (Math.abs((t._p || 0) - p) < 0.002) return; t._p = p;
      t.style.setProperty('--p', p.toFixed(3));
      if (t._head && t._core && t._len) { var pt = t._core.getPointAtLength(t._len * p); t._head.setAttribute('cx', pt.x); t._head.setAttribute('cy', pt.y); }
    });
  }
  if (trails.length) { var raf = 0; w.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; drawTrails(); }); }, { passive: true }); w.addEventListener('resize', drawTrails); drawTrails(); }

  /* ---------------- pointer light, tilt + glare, magnetic, parallax ---------------- */
  var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !RM) {
    $$('[data-lit]').forEach(function (s) { s.addEventListener('pointermove', function (e) { var r = s.getBoundingClientRect(); s.style.setProperty('--mx', (e.clientX - r.left) + 'px'); s.style.setProperty('--my', (e.clientY - r.top) + 'px'); }); });
    $$('[data-tilt]').forEach(function (c) {
      c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; c.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 9).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 11).toFixed(2) + 'deg)'; c.style.setProperty('--gx', (x * 100) + '%'); c.style.setProperty('--gy', (y * 100) + '%'); });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
    $$('[data-magnetic]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)'; });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }
  var px = $$('[data-parallax]');
  if (px.length && !RM) {
    var pr = 0; var doPx = function () { pr = 0; var vh = w.innerHeight; px.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return; var s = +el.getAttribute('data-parallax') || 0.1; var c = r.top + r.height / 2 - vh / 2; el.style.transform = 'translate3d(0,' + (c * -s).toFixed(1) + 'px,0)'; }); };
    w.addEventListener('scroll', function () { if (!pr) pr = requestAnimationFrame(doPx); }, { passive: true }); doPx();
  }

  /* ---------------- hero video ---------------- */
  var hv = $('.hero video');
  if (hv) {
    var btn = $('.hero__ctl');
    var play = function () { var p = hv.play(); if (p && p.catch) p.catch(function () {}); };
    if (RM) { hv.removeAttribute('autoplay'); hv.pause(); } else play();
    d.addEventListener('touchstart', function once() { if (hv.paused && !RM && !hv.dataset.user) play(); d.removeEventListener('touchstart', once); }, { passive: true });
    if (btn) btn.addEventListener('click', function () { if (hv.paused) { hv.dataset.user = ''; play(); btn.setAttribute('aria-label', 'Pause the background video'); btn.innerHTML = btn.dataset.pause; } else { hv.dataset.user = '1'; hv.pause(); btn.setAttribute('aria-label', 'Play the background video'); btn.innerHTML = btn.dataset.play; } });
  }

  /* ---------------- ember particles (hero + footer) ---------------- */
  $$('canvas.embers').forEach(function (cv) {
    if (RM) return; var ctx = cv.getContext('2d'); if (!ctx) return;
    var P = [], W, H, on = false, dpr = Math.min(2, w.devicePixelRatio || 1), n = w.innerWidth < 700 ? 16 : 34;
    var size = function () { W = cv.width = cv.offsetWidth * dpr; H = cv.height = cv.offsetHeight * dpr; };
    size(); w.addEventListener('resize', size);
    for (var i = 0; i < n; i++) P.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, v: 0.0006 + Math.random() * 0.0016, a: Math.random() * 6.28, o: 0.3 + Math.random() * 0.6 });
    var tick = function () { if (!on) return; ctx.clearRect(0, 0, W, H); P.forEach(function (p) { p.y -= p.v; p.a += 0.02; if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); } var x = (p.x + Math.sin(p.a) * 0.01) * W, y = p.y * H; var g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 5 * dpr); g.addColorStop(0, 'rgba(255,214,160,' + p.o + ')'); g.addColorStop(0.4, 'rgba(240,122,26,' + p.o * 0.5 + ')'); g.addColorStop(1, 'rgba(240,122,26,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p.r * 5 * dpr, 0, 6.29); ctx.fill(); }); requestAnimationFrame(tick); };
    new IntersectionObserver(function (es) { es.forEach(function (e) { var was = on; on = e.isIntersecting; if (on && !was) tick(); }); }).observe(cv);
  });

  /* ---------------- reviews carousel ---------------- */
  $$('[data-revs]').forEach(function (box) {
    var items = $$('.rev', box), i = 0, bar = $('.revs__bar', box), t;
    if (!items.length) return;
    var go = function (n) { items[i].classList.remove('on'); i = (n + items.length) % items.length; items[i].classList.add('on'); if (bar) { bar.classList.remove('run'); void bar.offsetWidth; if (!RM) bar.classList.add('run'); } clearTimeout(t); if (!RM) t = setTimeout(function () { go(i + 1); }, 7000); };
    var prev = $('[data-prev]', box), next = $('[data-next]', box);
    if (prev) prev.addEventListener('click', function () { go(i - 1); }); if (next) next.addEventListener('click', function () { go(i + 1); });
    box.addEventListener('mouseenter', function () { clearTimeout(t); if (bar) bar.classList.remove('run'); });
    box.addEventListener('mouseleave', function () { go(i); });
    go(0);
  });

  /* ---------------- rewards gauge ---------------- */
  $$('[data-gauge]').forEach(function (g) {
    var dial = $('.gauge', g), val = $('.gauge__val', g), lab = $('.gauge__lab', g), btns = $$('.tiers button', g);
    var sel = function (b) { btns.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); dial.style.setProperty('--g', b.getAttribute('data-g')); val.textContent = b.getAttribute('data-off'); lab.textContent = b.getAttribute('data-pts') + ' points'; };
    btns.forEach(function (b) { b.addEventListener('click', function () { sel(b); }); b.addEventListener('mouseenter', function () { if (fine) sel(b); }); });
    if (btns[0]) sel(btns[0]);
  });

  /* ---------------- delivery finder ---------------- */
  $$('[data-finder]').forEach(function (f) {
    var inp = $('input', f), msg = $('.finder__msg', f), items = $$('.towns li', f);
    var run = function () {
      var q = inp.value.trim().toLowerCase(); var hits = 0;
      items.forEach(function (li) { var hay = li.getAttribute('data-q'); var m = !q || hay.indexOf(q) >= 0; li.classList.toggle('hide', !m); li.classList.toggle('hit', !!q && m); if (m) hits++; });
      if (!q) { msg.innerHTML = msg.getAttribute('data-default'); return; }
      msg.innerHTML = hits ? '<strong>' + hits + (hits === 1 ? ' town' : ' towns') + '</strong> on our delivery routes match “' + q.replace(/[<>&"]/g, '') + '”.' : 'No match on our town list. Add to cart online and your ZIP will confirm coverage, or call the store.';
    };
    inp.addEventListener('input', run);
  });

  /* ---------------- blog tabs ---------------- */
  $$('[data-tabs]').forEach(function (tb) {
    var grid = $(tb.getAttribute('data-tabs'));
    $$('button', tb).forEach(function (b) { b.addEventListener('click', function () { $$('button', tb).forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); var k = b.getAttribute('data-k'); $$('[data-k]', grid).forEach(function (c) { c.classList.toggle('hide', k !== 'all' && c.getAttribute('data-k') !== k); }); }); });
  });

  /* ---------------- article TOC + progress ---------------- */
  var prog = $('.progress'), art = $('.article');
  if (prog && art) {
    var links = $$('.toc a'), heads = links.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
    var tocRaf = 0; var onArt = function () { tocRaf = 0; var r = art.getBoundingClientRect(), vh = w.innerHeight; var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh))); prog.style.setProperty('--rp', p.toFixed(4)); var on = -1; heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < vh * 0.35) on = i; }); links.forEach(function (a, i) { a.classList.toggle('on', i === on); }); };
    w.addEventListener('scroll', function () { if (!tocRaf) tocRaf = requestAnimationFrame(onArt); }, { passive: true }); onArt();
  }

  /* ---------------- preview forms (inert: nothing is sent) ---------------- */
  $$('form[data-preview]').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); f.classList.add('sent'); var ok = $('.form__ok', f); if (ok) ok.setAttribute('tabindex', '-1'), ok.focus(); }); });

  /* ---------------- dismissible notices ---------------- */
  $$('[data-notice]').forEach(function (n) { var k = 'toke-n-' + n.getAttribute('data-notice'); if (store(k)) { n.remove(); return; } var x = $('.notice__x', n); if (x) x.addEventListener('click', function () { store(k, '1'); n.remove(); }); });

  /* ---------------- Dutchie menu (the client's own embed) ---------------- */
  var menu = $('[data-menu]');
  if (menu) {
    var fixed = menu.getAttribute('data-store'); var id = fixed || cur; var s = STORES[id];
    var cat = menu.getAttribute('data-category');
    if (cat && !/[?&]dtche/.test(location.search)) { try { history.replaceState(null, '', location.pathname + '?dtche%5Bcategory%5D=' + encodeURIComponent(cat) + location.hash); } catch (e) {} }
    var qs = new URLSearchParams(location.search); var qc = qs.get('dtche[category]');
    $$('.menu__cats a', menu).forEach(function (a) { var m = (a.getAttribute('href') || '').match(/category%5D=([a-z-]+)/); var c = m ? m[1] : ''; a.classList.toggle('on', (qc || '') === c); });
    var slot = $('.menu__frame', menu);
    if (s && slot) {
      var sc = d.createElement('script'); sc.async = true; sc.id = 'dutchie--embed__script'; sc.src = 'https://dutchie.com/api/v2/embedded-menu/' + s.dutchie + '.js';
      var host = d.createElement('div'); slot.appendChild(host); host.appendChild(sc);
      var mo = new MutationObserver(function () { var f = $('iframe', slot); if (f) { f.addEventListener('load', function () { menu.classList.add('loaded'); }); setTimeout(function () { menu.classList.add('loaded'); }, 2500); mo.disconnect(); } });
      mo.observe(slot, { childList: true, subtree: true });
      setTimeout(function () { if (!$('iframe', slot)) menu.classList.add('slow'); }, 9000);
      setTimeout(function () { if (!menu.classList.contains('loaded')) menu.classList.add('slow'); }, 16000);
    }
  }
})();
