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
          if (c.tagName === 'EM') {
            var ws = c.textContent.trim().split(/\s+/), frag2 = d.createDocumentFragment();
            ws.forEach(function (wd, k) { if (k) frag2.appendChild(d.createTextNode(' ')); var o2 = d.createElement('span'); o2.className = 'w'; var i2 = d.createElement('span'); var e2 = d.createElement('em'); e2.className = 'acc' + (k === ws.length - 1 ? ' acc-end' : ''); e2.textContent = wd; i2.appendChild(e2); o2.appendChild(i2); frag2.appendChild(o2); });
            c.parentNode.replaceChild(frag2, c);
          }
          else walk(c);
        }
      });
    };
    walk(h);
  });
  // the accent underline bridges the space to the next accent word, except at the end of a line
  var eol = function (h) { var accs = $$('em.acc', h); accs.forEach(function (e, i) { var nx = accs[i + 1]; e.classList.toggle('acc-eol', !!nx && Math.abs(nx.getBoundingClientRect().top - e.getBoundingClientRect().top) > 4); }); };
  var land = function (el) { if (el.classList && el.classList.contains('ch') && !el._land) { el._land = 1; setTimeout(function () { eol(el); el.classList.add('done'); }, RM ? 0 : 1500); } };
  var eolT; w.addEventListener('resize', function () { clearTimeout(eolT); eolT = setTimeout(function () { $$('.ch.done').forEach(eol); }, 200); });
  var mo2 = new MutationObserver(function (ms) { ms.forEach(function (m) { if (m.target.classList.contains('in')) land(m.target); }); });
  $$('.ch').forEach(function (h) { mo2.observe(h, { attributes: true, attributeFilter: ['class'] }); });
  if ('IntersectionObserver' in w && !RM) {
    // a clip-path reveal starts fully clipped, which IntersectionObserver never reports: watch its parent instead
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var t = e.target._rv || e.target; t.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    $$('[data-reveal], .ch, .feat').forEach(function (el) { if (el.getAttribute('data-reveal') === 'clip' && el.parentElement) { var p = el.parentElement; p._rv = el; io.observe(p); } else io.observe(el); });
    // safety: after a fast fling, everything at or above the bottom of the screen is revealed once scrolling stops
    var sweep = function () { var vh = w.innerHeight; $$('[data-reveal]:not(.in), .ch:not(.in), .feat:not(.in)').forEach(function (el) { var r = (el.getAttribute('data-reveal') === 'clip' && el.parentElement ? el.parentElement : el).getBoundingClientRect(); if (r.top < vh) el.classList.add('in'); }); };
    var flingT; w.addEventListener('scroll', function () { clearTimeout(flingT); flingT = setTimeout(sweep, 120); }, { passive: true });
    setTimeout(sweep, 400);
  } else { $$('[data-reveal], .ch, .feat').forEach(function (el) { el.classList.add('in'); }); $$('.ch').forEach(function (h) { h.classList.add('done'); }); }
  $$('.stagger').forEach(function (g) { Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); }); });

  /* ---------------- ember trails: draw with scroll ---------------- */
  var trails = $$('.trail');
  trails.forEach(function (t) {
    $$('path', t).forEach(function (p) { p.setAttribute('pathLength', '1'); });
    t._core = $('.t-core', t); t._head = $('.t-head', t); t._bloom = $('.t-bloom', t); t._len = t._core ? t._core.getTotalLength() : 0;
  });
  function drawTrails() {
    var vh = w.innerHeight;
    trails.forEach(function (t) {
      var r = t.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      var p = RM ? 1 : Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
      if (Math.abs((t._p || 0) - p) < 0.002) return; t._p = p;
      t.style.setProperty('--p', p.toFixed(3));
      if (t._head && t._core && t._len) { var pt = t._core.getPointAtLength(t._len * Math.min(p, 0.999)); t._head.setAttribute('cx', pt.x); t._head.setAttribute('cy', pt.y); if (t._bloom) { t._bloom.setAttribute('cx', pt.x); t._bloom.setAttribute('cy', pt.y); } }
      t.classList.toggle('drawn', p > 0.985);
    });
  }
  if (trails.length) { var raf = 0; w.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; drawTrails(); }); }, { passive: true }); w.addEventListener('resize', drawTrails); drawTrails(); }

  /* ---------------- pointer light, tilt + glare, magnetic, parallax ---------------- */
  var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !RM) {
    $$('[data-lit], [data-lamp]').forEach(function (s) { s.addEventListener('pointermove', function (e) { var r = s.getBoundingClientRect(); s.style.setProperty('--mx', (e.clientX - r.left) + 'px'); s.style.setProperty('--my', (e.clientY - r.top) + 'px'); }); });
    $$('[data-tilt]').forEach(function (c) {
      c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; c.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 9).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 11).toFixed(2) + 'deg)'; c.style.setProperty('--gx', (x * 100) + '%'); c.style.setProperty('--gy', (y * 100) + '%'); });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
    $$('[data-magnetic]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)'; });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }
  var zm = $$('[data-zoom]');
  if (zm.length && !RM) {
    var zr = 0; var doZm = function () { zr = 0; var vh = w.innerHeight; zm.forEach(function (el) { var r = el.parentElement.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return; var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))); el.style.transform = 'scale(' + (1.16 - p * 0.16).toFixed(4) + ') translate3d(0,' + ((p - 0.5) * -40).toFixed(1) + 'px,0)'; }); };
    w.addEventListener('scroll', function () { if (!zr) zr = requestAnimationFrame(doZm); }, { passive: true }); doZm();
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

  /* ---------------- rewards dial: the ring fills with points, the value stays inside the ring ---------------- */
  var nf = function (n) { return Math.round(n).toLocaleString('en-US'); };
  $$('[data-gauge]').forEach(function (g) {
    var btns = $$('.tiers button', g), val = $('.gauge__val', g), lab = $('.gauge__lab', g), fill = $('.rw__fill', g), knob = $('.rw__knob', g), ticks = $$('.rw__tick', g), dialEl = $('.rw__dial', g);
    var max = +g.getAttribute('data-max') || 5000, cur = 0, raf = 0, user = false, target = -1;
    var T = btns.map(function (b) { return { v: +b.getAttribute('data-v'), amt: b.getAttribute('data-amt'), pts: b.getAttribute('data-pts'), b: b }; });
    // the ring and ticks follow v; the readout shows the tier the visitor picked (target), or, on the first count-up, the tier reached
    var paint = function (v, showPts) {
      var f = Math.max(0, Math.min(1, v / max)); cur = v;
      if (fill) fill.style.strokeDashoffset = String(1 - f);
      if (knob) { var a = f * 2 * Math.PI - Math.PI / 2; knob.setAttribute('transform', 'translate(' + (170 + 138 * Math.cos(a)).toFixed(1) + ' ' + (170 + 138 * Math.sin(a)).toFixed(1) + ')'); }
      var k = -1; T.forEach(function (t, i) { if (v >= t.v - 0.5) k = i; });
      var on = target >= 0 ? target : k;
      ticks.forEach(function (t, i) { t.classList.toggle('on', i <= k); });
      T.forEach(function (t, i) { t.b.classList.toggle('got', i <= k); t.b.classList.toggle('on', i === on); t.b.setAttribute('aria-pressed', i === on ? 'true' : 'false'); });
      if (on >= 0 && val.textContent !== T[on].amt) { val.textContent = T[on].amt; val.classList.remove('pop'); void val.offsetWidth; val.classList.add('pop'); }
      if (on < 0) val.textContent = '$0';
      lab.textContent = (showPts && target < 0 ? nf(v) : (on >= 0 ? T[on].pts : '0')) + ' points';
    };
    var tween = function (to, ms, showPts) {
      cancelAnimationFrame(raf); var from = cur, t0 = performance.now();
      var step = function (now) { var p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3); paint(from + (to - from) * e, showPts && p < 1); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    var sel = function (b) { user = true; target = btns.indexOf(b); var t = T[target]; if (RM) paint(t.v); else { paint(cur); tween(t.v, 650, false); } };
    btns.forEach(function (b) { b.addEventListener('click', function () { sel(b); }); b.addEventListener('mouseenter', function () { if (fine) sel(b); }); b.addEventListener('focus', function () { sel(b); }); });
    paint(T.length ? T[0].v : 0);
    // first view: the dial counts up through every tier to the top one
    if (!RM && 'IntersectionObserver' in w && dialEl) {
      var ob = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { ob.disconnect(); if (!user) { paint(0, true); setTimeout(function () { if (!user) tween(max, 2600, true); }, 350); } } }, { threshold: 0.45 });
      ob.observe(dialEl);
    } else if (T.length) paint(T[T.length - 1].v);
  });

  /* ---------------- numbered steps: numerals fill with light as you reach them, the rail follows ---------------- */
  $$('[data-steps]').forEach(function (ol) {
    var lis = $$('li', ol);
    if (RM || !('IntersectionObserver' in w)) { lis.forEach(function (li) { li.classList.add('lit'); }); ol.style.setProperty('--sp', 1); return; }
    ol.classList.add('steps--live');
    var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('lit'); so.unobserve(e.target); } }); }, { rootMargin: '0px 0px -28% 0px' });
    lis.forEach(function (li) { so.observe(li); });
    var sr = 0; var rail = function () { sr = 0; var r = ol.getBoundingClientRect(), vh = w.innerHeight; ol.style.setProperty('--sp', Math.min(1, Math.max(0, (vh * 0.72 - r.top) / Math.max(1, r.height))).toFixed(3)); };
    w.addEventListener('scroll', function () { if (!sr) sr = requestAnimationFrame(rail); }, { passive: true }); rail();
    // safety after a fast fling: anything already above the light line is lit
    var stepSweep = function () { var vh = w.innerHeight; lis.forEach(function (li) { if (li.getBoundingClientRect().top < vh * 0.72) li.classList.add('lit'); }); };
    setTimeout(stepSweep, 600); var stT; w.addEventListener('scroll', function () { clearTimeout(stT); stT = setTimeout(stepSweep, 140); }, { passive: true });
  });

  /* ---------------- count-up numbers (review score, bonus points) ---------------- */
  $$('[data-count]').forEach(function (el) {
    var to = parseFloat(el.getAttribute('data-count')), dec = +el.getAttribute('data-dec') || 0, pre = el.getAttribute('data-prefix') || '', fin = el.textContent;
    if (RM || !('IntersectionObserver' in w) || isNaN(to)) return;
    el.textContent = pre + (0).toFixed(dec);
    var co = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; co.disconnect(); var t0 = performance.now(), ms = 1600; var st = function (now) { var p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 4); el.textContent = p < 1 ? pre + (to * e).toFixed(dec) : fin; if (p < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); }, { threshold: 0.6 });
    co.observe(el);
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
