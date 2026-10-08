(function () {
  'use strict';

  /* ------------------------------------------------------------------
   * Savings estimator settings. PSC sets these. Until then the page
   * shows a [CLIENT TO CONFIRM] note under the estimate.
   * ------------------------------------------------------------------ */
  var calcConfig = {
    phonesPerTrunk: 3,        // [CLIENT TO CONFIRM] phones served by one SIP trunk
    minTrunksPerOffice: 2,    // [CLIENT TO CONFIRM] minimum trunks for each office
    trunkMonthly: 14.17,      // [CLIENT TO CONFIRM] $ per trunk per month (Pacific Sailing: $85 for 6)
    rangeLow: 0.9,            // [CLIENT TO CONFIRM] low end of the illustrative range
    rangeHigh: 1.3            // [CLIENT TO CONFIRM] high end of the illustrative range
  };

  var LEAD_EMAIL = 'PSC@Pacificsoftcom.com';
  var PHONE = '562-489-7760';

  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- count animation helper ---------- */
  function animateNumber(el, from, to, dur, fmt) {
    fmt = fmt || function (v) { return Math.round(v); };
    if (reduce) { el.textContent = fmt(to); return; }
    var t0 = null;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- hero headline: word-by-word reveal ---------- */
  var title = $('[data-words]');
  if (title) {
    var wi = 0;
    var wrapWords = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span');
            w.className = 'w';
            var inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--wi', wi++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          wrapWords(n);
        }
      });
    };
    wrapWords(title);
    requestAnimationFrame(function () { requestAnimationFrame(function () { title.classList.add('is-in'); }); });
  }

  /* hero proof: $360 counts down to $85 */
  var heroCount = $('#hero-count');
  if (heroCount) {
    var hFrom = +heroCount.getAttribute('data-from'), hTo = +heroCount.getAttribute('data-to');
    heroCount.textContent = hFrom;
    setTimeout(function () { animateNumber(heroCount, hFrom, hTo, 1800); }, 900);
  }

  /* ---------- call network canvas ---------- */
  function Network(canvas, opts) {
    var ctx = canvas.getContext('2d');
    var faint = !!opts.faint;
    var nodes = [], edges = [], pulses = [];
    var w = 0, h = 0, dpr = 1, running = false, visible = false, raf = 0, lastSpawn = 0;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var seed = opts.seed || 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var TEAL = 'rgba(20, 189, 199, ', AMBER = '#F5A623';

    function build() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed = opts.seed || 7;
      nodes = []; edges = [];
      var count = clamp(Math.round((w * h) / 26000), 12, 34);
      var types = ['office', 'desk', 'desk', 'cell', 'cell'];
      for (var i = 0; i < count; i++) {
        nodes.push({ x: rnd() * w, y: rnd() * h, z: .35 + rnd() * .65, type: types[Math.floor(rnd() * types.length)], ph: rnd() * 6.28 });
      }
      nodes.forEach(function (a, i) {
        var near = nodes.map(function (b, j) { return { j: j, d: (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) }; })
          .filter(function (o) { return o.j !== i; }).sort(function (p, q) { return p.d - q.d; }).slice(0, 2);
        near.forEach(function (o) {
          var key = Math.min(i, o.j) + '-' + Math.max(i, o.j);
          if (!edges.some(function (e) { return e.k === key; })) edges.push({ a: i, b: o.j, k: key });
        });
      });
      pulses = [];
    }

    function pos(n) {
      var k = faint ? 10 : 26;
      return { x: n.x + mouse.x * n.z * k, y: n.y + mouse.y * n.z * k };
    }

    function drawNode(n, t) {
      var p = pos(n);
      var glow = .55 + .45 * Math.sin(t / 900 + n.ph);
      ctx.strokeStyle = TEAL + (faint ? .5 : .9) + ')';
      ctx.fillStyle = 'rgba(12, 29, 48, .9)';
      ctx.lineWidth = 1.5;
      if (n.type === 'office') {
        ctx.beginPath(); ctx.rect(p.x - 7, p.y - 7, 14, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(245, 166, 35, ' + (.4 + .5 * glow) + ')';
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      } else if (n.type === 'desk') {
        ctx.beginPath(); ctx.rect(p.x - 6, p.y - 4, 12, 8); ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 6.283); ctx.fill(); ctx.stroke();
      }
    }

    function frame(t) {
      mouse.x += (mouse.tx - mouse.x) * .06;
      mouse.y += (mouse.ty - mouse.y) * .06;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      edges.forEach(function (e) {
        var a = pos(nodes[e.a]), b = pos(nodes[e.b]);
        ctx.strokeStyle = TEAL + (faint ? .12 : .22) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      if (!reduce && t - lastSpawn > (faint ? 700 : 320) && pulses.length < (faint ? 6 : 16) && edges.length) {
        lastSpawn = t;
        pulses.push({ e: edges[Math.floor(Math.random() * edges.length)], t: 0, s: .004 + Math.random() * .006, d: Math.random() < .5 });
      }
      pulses = pulses.filter(function (p) { return p.t <= 1; });
      pulses.forEach(function (p) {
        p.t += p.s;
        var a = pos(nodes[p.d ? p.e.a : p.e.b]), b = pos(nodes[p.d ? p.e.b : p.e.a]);
        var x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        ctx.strokeStyle = 'rgba(245, 166, 35, .55)';
        ctx.lineWidth = 2;
        var tt = Math.max(0, p.t - .12);
        ctx.beginPath(); ctx.moveTo(a.x + (b.x - a.x) * tt, a.y + (b.y - a.y) * tt); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = AMBER;
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.283); ctx.fill();
      });
      nodes.forEach(function (n) { drawNode(n, t); });
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() { if (running || reduce) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    build();
    frame(0);
    if (reduce) return;

    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }).observe(canvas);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) start(); });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); if (!running) frame(0); }, 200); });
    if (finePointer) {
      canvas.parentNode.addEventListener('mousemove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.tx = ((e.clientX - r.left) / r.width - .5) * 2;
        mouse.ty = ((e.clientY - r.top) / r.height - .5) * 2;
      });
    }
  }
  if ($('#hero-net')) new Network($('#hero-net'), { seed: 11 });
  if ($('#final-net')) new Network($('#final-net'), { seed: 29, faint: true });

  /* ---------- estimator ---------- */
  var est = $('#estimator');
  var estState = { phones: 12, offices: 2 };
  if (est) {
    var range = $('#est-phones'), rangeOut = $('#est-phones-out'), offOut = $('#est-offices');
    var billIn = $('#est-bill'), rangeTxt = $('#est-range'), diffTxt = $('#est-diff');
    var stepBtns = $$('[data-step]', est);
    var update = function () {
      estState.phones = +range.value;
      rangeOut.textContent = estState.phones;
      range.style.setProperty('--pct', ((range.value - range.min) / (range.max - range.min) * 100) + '%');
      offOut.textContent = estState.offices;
      stepBtns[0].disabled = estState.offices <= 1;
      stepBtns[1].disabled = estState.offices >= 10;
      var c = calcConfig;
      if (!c.phonesPerTrunk || !c.trunkMonthly) {
        rangeTxt.textContent = 'Quote on request';
        diffTxt.textContent = 'Bring your bill for an exact quote.';
        return;
      }
      var trunks = Math.max(Math.ceil(estState.phones / c.phonesPerTrunk), c.minTrunksPerOffice * estState.offices);
      var base = trunks * c.trunkMonthly;
      var lo = base * c.rangeLow, hi = base * c.rangeHigh;
      rangeTxt.textContent = money(lo) + ' to ' + money(hi) + ' / mo';
      var bill = parseFloat(billIn.value);
      if (bill > 0) {
        diffTxt.textContent = bill > hi
          ? 'Against your ' + money(bill) + ' bill, that is roughly ' + money(bill - hi) + ' to ' + money(bill - lo) + ' less each month on lines. Bring your bill for an exact quote.'
          : 'Your ' + money(bill) + ' bill is already in this range on lines alone. Send it anyway and we will check the rest.';
      } else {
        diffTxt.textContent = 'Bring your bill for an exact quote.';
      }
    };
    range.addEventListener('input', update);
    billIn.addEventListener('input', update);
    stepBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        estState.offices = clamp(estState.offices + (+b.getAttribute('data-step')), 1, 10);
        update();
      });
    });
    update();
  }

  /* ---------- header, progress, back-to-top, timeline, stepper ---------- */
  var hdr = $('#hdr');
  var topbar = $('.topbar');
  var bar = $('#scroll-bar');
  var toTop = $('#to-top');
  var toTopFill = $('#to-top-fill');
  var hero = $('.hero');
  var tlList = $('.tl__list');
  var tlItems = $$('.tl__item');
  var stepper = $('#stepper');
  var stepFill = $('#stepper-fill');
  var stepAuto = true;
  var hideTop = false;
  var mobile = window.matchMedia('(max-width: 767px)');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? y / max : 0;
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    var tb = topbar ? topbar.offsetHeight : 0;
    hdr.style.top = Math.max(0, tb - y) + 'px';
    hdr.classList.toggle('is-solid', y > 40);
    var pastHero = hero ? y > hero.offsetHeight - 200 : y > 600;
    toTop.classList.toggle('is-visible', pastHero && !(mobile.matches && hideTop));
    if (toTopFill) toTopFill.style.strokeDashoffset = 182.2 * (1 - p);

    var vh = window.innerHeight;
    if (tlList) {
      var r = tlList.getBoundingClientRect();
      var tp = clamp((vh * .6 - r.top) / r.height, 0, 1);
      tlList.style.setProperty('--tl', tp);
      tlItems.forEach(function (it) { it.classList.toggle('is-lit', it.getBoundingClientRect().top < vh * .6); });
    }
    if (stepper && stepAuto) {
      var sr = stepper.getBoundingClientRect();
      var sp = clamp((vh * .75 - sr.top) / (vh * .6), 0, 1);
      setStepFill(sp);
      var idx = Math.min(3, Math.floor(sp * 4.0001 - .0001));
      if (sp > 0 && idx >= 0 && idx !== activeStep) selectStep(idx, false, true);
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var logo = $('.hdr__logo');
    if (logo) logo.focus({ preventScroll: true });
  });
  /* keep the back-to-top button off the form and footer on phones */
  if ('IntersectionObserver' in window) {
    var guarded = $$('.contact__form, .ftr');
    var inView = new Set();
    var guardIo = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) inView.add(e.target); else inView.delete(e.target); });
      hideTop = inView.size > 0;
      onScroll();
    });
    guarded.forEach(function (g) { guardIo.observe(g); });
  }

  /* scroll-spy */
  var navLinks = $$('.hdr__nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        var link = byId[e.target.id];
        if (!link || !e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
        link.classList.add('is-current');
        link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
    var heroSpy = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) navLinks.forEach(function (a) { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    if (hero) heroSpy.observe(hero);
  }

  /* ---------- full-screen menu ---------- */
  var menu = $('#menu'), burger = $('.hdr__burger'), lastFocus = null;
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) { menu.removeAttribute('inert'); menu.inert = false; } else { menu.setAttribute('inert', ''); menu.inert = true; }
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { lastFocus = document.activeElement; setTimeout(function () { $('.menu__close').focus(); }, 50); }
    else if (lastFocus) lastFocus.focus();
  }
  if (menu && burger) {
    burger.addEventListener('click', function () { setMenu(true); });
    $('.menu__close').addEventListener('click', function () { setMenu(false); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { lastFocus = null; setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setMenu(false); return; }
      if (e.key === 'Tab') {
        var f = $$('a, button', menu), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- custom cursor + magnetic buttons ---------- */
  if (finePointer && !reduce) {
    root.classList.add('has-cursor');
    var cur = $('.cursor'), ring = $('#cursor-ring'), dot = $('#cursor-dot');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    var darkSel = '.hero, .places, .final, .ftr, .topbar, .menu, .form, .stats, .callback, .rate--feat, .stat--big';
    document.addEventListener('mousemove', function (e) {
      if (cur.classList.contains('is-hidden')) { rx = e.clientX; ry = e.clientY; cur.classList.remove('is-hidden'); }
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      var t = e.target;
      var cta = t.closest('[data-cursor="cta"], .btn--amber');
      var hov = t.closest('a, button, summary, input, select, textarea, label, .tile, .chip, .note, .rate');
      cur.classList.toggle('is-cta', !!cta);
      cur.classList.toggle('is-hover', !cta && !!hov);
      cur.classList.toggle('on-dark', !!t.closest(darkSel));
    });
    document.documentElement.addEventListener('mouseleave', function () { cur.classList.add('is-hidden'); });
    window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) cur.classList.add('is-hidden'); });
    window.addEventListener('blur', function () { cur.classList.add('is-hidden'); });
    (function loop() {
      rx += (mx - rx) * .15; ry += (my - ry) * .15;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();

    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .25, y = (e.clientY - r.top - r.height / 2) * .35;
        b.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- generic tab helper ---------- */
  function tabs(list, opts) {
    var btns = $$('[role="tab"]', list);
    var select = function (btn, focus) {
      btns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(b.getAttribute('aria-controls'));
        if (panel && opts.panels !== false) { panel.hidden = !on; panel.classList.toggle('is-active', on); }
      });
      if (focus) btn.focus();
      if (opts.onSelect) opts.onSelect(btns.indexOf(btn), btn);
    };
    var vertical = list.getAttribute('aria-orientation') === 'vertical';
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(b); });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === (vertical ? 'ArrowDown' : 'ArrowRight')) n = btns[(i + 1) % btns.length];
        if (e.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) n = btns[(i - 1 + btns.length) % btns.length];
        if (e.key === 'Home') n = btns[0];
        if (e.key === 'End') n = btns[btns.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
      if (opts.hover && finePointer) {
        var ht;
        b.addEventListener('mouseenter', function () { ht = setTimeout(function () { if (!b.classList.contains('is-active')) select(b); }, 140); });
        b.addEventListener('mouseleave', function () { clearTimeout(ht); });
      }
    });
    return { select: select, btns: btns };
  }

  /* services */
  var svcList = $('.svc__list');
  if (svcList) tabs(svcList, { hover: true });

  /* compare toggle */
  var cmpToggle = $('.cmp__toggle');
  if (cmpToggle) tabs(cmpToggle, { panels: false, onSelect: function (i, b) { $('#cmp-table').setAttribute('data-show', b.getAttribute('data-col')); } });

  /* cases */
  var caseData = [
    { l1: 'PACIFIC SAILING', l2: 'Long Beach ↔ San Pedro', l3: 'CONNECTED', badge: '-76%', sub: 'monthly bill' },
    { l1: 'THE PADRE HOTEL', l2: 'Front desk ↔ Roommaster', l3: 'PMS LINKED', badge: 'PMS', sub: 'linked to the phones' },
    { l1: 'BATCHMASTER', l2: 'Laguna Hills ↔ Indore', l3: 'TRUNK OPEN', badge: '3', sub: 'countries, one system' }
  ];
  var caseList = $('.cases__tabs');
  if (caseList) {
    var badge = $('#case-badge');
    tabs(caseList, {
      onSelect: function (i) {
        var d = caseData[i];
        ['l1', 'l2', 'l3'].forEach(function (k) {
          var t = $('#ph-line' + k.slice(1));
          t.textContent = d[k];
          t.classList.remove('swap'); void t.getBBox(); t.classList.add('swap');
        });
        badge.innerHTML = '<strong>' + d.badge + '</strong><span>' + d.sub + '</span>';
        badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');
        var after = $('#cp-' + (i + 1) + ' .case__after[data-from]');
        if (after) animateNumber(after, +after.getAttribute('data-from'), +after.getAttribute('data-to'), 1200, function (v) { return '$' + Math.round(v); });
      }
    });
  }

  /* bento spotlight + keyboard reveal */
  $$('.tile').forEach(function (t) {
    t.tabIndex = 0;
    t.addEventListener('pointermove', function (e) {
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* process stepper */
  var activeStep = 0;
  var stepTabs = null;
  function setStepFill(p) {
    if (!stepFill) return;
    stepFill.style.transform = (mobile.matches ? 'scaleY(' : 'scaleX(') + p + ')';
  }
  function selectStep(i, focus, fromScroll) {
    if (!stepTabs) return;
    activeStep = i;
    stepTabs.select(stepTabs.btns[i], focus);
    stepTabs.btns.forEach(function (b, n) { b.classList.toggle('is-done', n < i); });
    if (!fromScroll) setStepFill(i / 3);
  }
  if (stepper) {
    stepTabs = tabs($('.stepper-x__steps'), {
      onSelect: function (i) { activeStep = i; stepTabs && stepTabs.btns.forEach(function (b, n) { b.classList.toggle('is-done', n < i); }); }
    });
    stepTabs.btns.forEach(function (b, i) {
      b.addEventListener('click', function () { stepAuto = false; selectStep(i); });
    });
  }

  /* ---------- FAQ accordion ---------- */
  $$('.faq__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- reveal on scroll (staggered per group) ---------- */
  var rvEls = $$('[data-rv]');
  if ('IntersectionObserver' in window && !reduce) {
    var groups = new Map();
    rvEls.forEach(function (el) {
      var g = el.parentElement;
      var n = groups.get(g) || 0;
      el.style.setProperty('--d', (n * 0.09) + 's');
      groups.set(g, n + 1);
    });
    var rvIo = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rvIo.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    rvEls.forEach(function (el) { rvIo.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* count-ups */
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cIo = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var to = +e.target.getAttribute('data-count');
        animateNumber(e.target, 0, to, 1400);
        cIo.unobserve(e.target);
      });
    }, { threshold: .5 });
    counters.forEach(function (c) { if (!reduce) c.textContent = '0'; cIo.observe(c); });
  }

  /* ---------- prefill the form ---------- */
  var serviceSel = $('#f-service'), sizeSel = $('#f-size');
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var want = a.getAttribute('data-service');
      $$('option', serviceSel).forEach(function (o) { if (o.textContent === want) serviceSel.value = o.value || o.textContent; });
    });
  });
  var estCta = $('#est-cta');
  if (estCta) estCta.addEventListener('click', function () {
    var p = estState.phones;
    sizeSel.value = p <= 10 ? '1 to 10' : p <= 25 ? '11 to 25' : p <= 50 ? '26 to 50' : p <= 100 ? '51 to 100' : 'More than 100';
    serviceSel.value = 'Free bill review';
    var msg = $('#f-message');
    var note = 'From the estimator: ' + p + ' phones, ' + estState.offices + ' office' + (estState.offices > 1 ? 's' : '') + ($('#est-bill').value ? ', current bill about $' + $('#est-bill').value + ' a month' : '') + '.';
    if (msg && msg.value.indexOf('From the estimator') === -1) msg.value = note + (msg.value ? '\n' + msg.value : '');
  });

  /* ---------- review form ---------- */
  var digits = function (v) { return (v || '').replace(/\D/g, ''); };
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v || ''); };
  var form = $('#review-form');
  if (form) {
    var status = $('#form-status');
    var bill = $('#f-bill'), drop = $('#drop'), fileTag = $('#f-bill-name'), dropText = $('.drop__text', drop);
    var checks = {
      'f-name': function (v) { return v.trim().length >= 2 ? '' : 'Enter your name.'; },
      'f-email': function (v) { return emailOk(v.trim()) ? '' : 'Enter an email address like name@company.com.'; },
      'f-phone': function (v) { return digits(v).length >= 10 ? '' : 'Enter a phone number with at least 10 digits.'; }
    };
    var setErr = function (el, msg) {
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      var box = document.getElementById('e-' + el.id.slice(2));
      if (box) box.textContent = msg;
    };
    Object.keys(checks).forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('blur', function () { if (el.value) setErr(el, checks[id](el.value)); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true' || !checks[id](el.value)) setErr(el, checks[id](el.value)); });
    });

    var showFile = function (f) {
      if (!f) { fileTag.hidden = true; dropText.hidden = false; return; }
      if (f.size > 10 * 1024 * 1024) {
        bill.value = '';
        status.className = 'form__status';
        status.textContent = 'That file is over 10 MB. Pick a smaller scan or a PDF.';
        fileTag.hidden = true; dropText.hidden = false;
        return;
      }
      status.textContent = '';
      $('span', fileTag).textContent = f.name;
      fileTag.hidden = false; dropText.hidden = true;
    };
    bill.addEventListener('change', function () { showFile(bill.files && bill.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      try { var dt = new DataTransfer(); dt.items.add(f); bill.files = dt.files; } catch (err) { /* older browsers: name preview only */ }
      showFile(f);
    });

    form.addEventListener('submit', function (e) {
      var bad = null;
      Object.keys(checks).forEach(function (id) {
        var el = document.getElementById(id), msg = checks[id](el.value);
        setErr(el, msg);
        if (msg && !bad) bad = el;
      });
      if (bad) { e.preventDefault(); bad.focus(); return; }
      if ($('#f-website').value) { e.preventDefault(); return; }
      var btn = $('button[type="submit"]', form);
      if (form.getAttribute('data-mode') !== 'mailto') { btn.disabled = true; btn.firstChild.textContent = 'Sending…'; return; }

      e.preventDefault();
      var v = function (id) { return (document.getElementById(id).value || '').trim(); };
      var f = bill.files && bill.files[0];
      var body = ['Name: ' + v('f-name'), 'Company: ' + v('f-company'), 'Email: ' + v('f-email'), 'Phone: ' + v('f-phone'), 'Request: ' + v('f-service'), 'Phones on system: ' + (v('f-size') || 'Not sure'), '', v('f-message'), '', f ? '(I will attach my phone bill to this email: ' + f.name + ')' : ''].join('\n');
      window.location.href = 'mailto:' + LEAD_EMAIL + '?subject=' + encodeURIComponent(v('f-service') + ' request from ' + v('f-name')) + '&body=' + encodeURIComponent(body);
      $('.form__body', form).hidden = true;
      var done = $('#form-done');
      done.hidden = false;
      done.focus();
    });
  }

  /* ---------- callback form ---------- */
  var cb = $('#callback-form');
  if (cb) {
    var cbIn = $('#cb-phone'), cbMsg = $('#cb-msg');
    cbIn.addEventListener('input', function () {
      if (cbIn.getAttribute('aria-invalid') === 'true' && digits(cbIn.value).length >= 10) { cbIn.setAttribute('aria-invalid', 'false'); cbMsg.textContent = ''; }
    });
    cb.addEventListener('submit', function (e) {
      if (digits(cbIn.value).length < 10) {
        e.preventDefault();
        cbIn.setAttribute('aria-invalid', 'true');
        cbMsg.textContent = 'Enter a phone number with at least 10 digits.';
        cbIn.focus();
        return;
      }
      cbIn.setAttribute('aria-invalid', 'false');
      if (cb.getAttribute('data-mode') !== 'mailto') return;
      e.preventDefault();
      window.location.href = 'mailto:' + LEAD_EMAIL + '?subject=' + encodeURIComponent('Call-back request') + '&body=' + encodeURIComponent('Please call me back at ' + cbIn.value.trim());
      cb.classList.add('is-done');
      cbMsg.textContent = 'Got it. Press send in your email app and a technician will call you back.';
    });
  }

  onScroll();
})();
