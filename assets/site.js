// praisetc.com interactions. One deferred file, no dependencies. Each block hydrates the markup it
// finds and does nothing when that markup is absent, so every page loads the same script.
(() => {
  const d = document, R = d.documentElement, raf = requestAnimationFrame;
  const $ = (s, el = d) => el.querySelector(s), $$ = (s, el = d) => [...el.querySelectorAll(s)];
  const mq = matchMedia('(prefers-color-scheme: dark)'), RM = matchMedia('(prefers-reduced-motion: reduce)');
  const theme = () => R.dataset.theme || (mq.matches ? 'dark' : 'light');
  // Calls fn(visible) whenever el enters or leaves the viewport.
  const onView = (el, fn, opt) => (self.IntersectionObserver ? new IntersectionObserver(es => es.forEach(e => fn(e.isIntersecting)), opt).observe(el) : fn(true));
  const WB = { studio: ['#111214', '#F3F3F0'], dawnbringer: ['#0B0710', '#F4EFE6'], openstrut: ['#0B121C', '#EEF3F8'] };

  // Theme toggle and browser chrome colour. The inline head script applied a saved theme before first paint.
  const paint = () => {
    const t = theme(), w = WB[R.dataset.world] || WB.studio;
    $$('.tog').forEach(b => b.setAttribute('aria-pressed', t == 'dark'));
    $$('meta[name=theme-color]').forEach((m, i) => (m.content = R.dataset.theme ? w[t == 'dark' ? 0 : 1] : w[i]));
    d.dispatchEvent(new Event('ptc:paint'));
  };
  $$('.tog').forEach(b => (b.onclick = () => {
    R.dataset.theme = theme() == 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ptc-theme', R.dataset.theme); } catch (e) {}
    paint();
  }));
  mq.addEventListener('change', paint);
  paint();

  // First paint skips the content-visibility:auto sections below the fold; after load they render at idle.
  const showAll = () => $$('.cv').forEach(s => (s.style.contentVisibility = 'visible'));
  addEventListener('load', () => (self.requestIdleCallback ? requestIdleCallback(showAll) : setTimeout(showAll, 200)));

  // Reading progress on the nav's top edge.
  const prog = $('.nav .prog');
  if (prog) {
    let q = 0;
    const upd = () => { q = 0; const h = R.scrollHeight - innerHeight; prog.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0); };
    addEventListener('scroll', () => q || (q = raf(upd)), { passive: true });
    addEventListener('resize', upd);
    upd();
  }

  // Home: sections carry data-world-section; the one under the 45% line sets the world. The pill jumps on.
  const pill = $('.world-pill'), secs = $$('[data-world-section]');
  const setWorld = w => {
    if (R.dataset.world == w) return;
    R.dataset.world = w;
    if (pill) {
      $('span:last-child', pill).textContent = w.toUpperCase();
      if (pill.tagName == 'BUTTON') pill.setAttribute('aria-label', `Visual world: ${w}. Go to the next section`);
    }
    paint();
  };
  if (secs.length && !R.hasAttribute('data-fixed') && self.IntersectionObserver) {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setWorld(e.target.dataset.worldSection)), { rootMargin: '-42% 0px -52% 0px' });
    secs.forEach(s => io.observe(s));
    if (pill && pill.tagName == 'BUTTON') pill.onclick = () => {
      const y = innerHeight * .45, i = secs.findIndex(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
      secs[(i + 1) % secs.length].scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth' });
    };
  }

  // Count-up for [data-count]. The HTML already holds the final number; Reduce motion keeps it.
  $$('[data-count]').forEach(el => {
    const n = +el.dataset.count, sx = el.dataset.suffix || '', fmt = v => Math.round(v).toLocaleString('en-US') + sx;
    if (RM.matches || !n) return;
    let done = 0;
    el.textContent = fmt(0);
    onView(el, v => {
      if (!v || done) return;
      done = 1;
      const t0 = performance.now(), step = t => { const k = Math.min(1, (t - t0) / 1300); el.textContent = fmt(n * (1 - (1 - k) ** 3)); if (k < 1) raf(step); };
      raf(step);
    });
  });

  // Tabs: role=tablist with role=tab buttons that point at their panel with aria-controls.
  $$('[role=tablist]').forEach(tl => {
    const tabs = $$('[role=tab]', tl);
    const sel = t => tabs.forEach(b => { const on = b == t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; d.getElementById(b.getAttribute('aria-controls')).hidden = !on; });
    const panes = tabs.map(b => d.getElementById(b.getAttribute('aria-controls')));
    const even = () => {
      const cur = tabs.find(b => b.getAttribute('aria-selected') == 'true') || tabs[0];
      panes.forEach(p => (p.style.minHeight = ''));
      const h = Math.max(...tabs.map((b, i) => (sel(b), panes[i].offsetHeight)));
      sel(cur);
      panes.forEach(p => (p.style.minHeight = h + 'px'));
    };
    even();
    d.addEventListener('ptc:layout', even);
    let vw = innerWidth;
    addEventListener('resize', () => vw != innerWidth && ((vw = innerWidth), even()));
    tabs.forEach((b, i) => {
      b.onclick = () => sel(b);
      b.onkeydown = e => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { const n = tabs[(i + k + tabs.length) % tabs.length]; sel(n); n.focus(); } };
    });
  });

  // Concept art: the glow follows the pointer and the art shifts against it. Transform only.
  if (!RM.matches && matchMedia('(hover: hover)').matches) $$('[data-lantern]').forEach(el => {
    let q = 0, x = 0, y = 0;
    const apply = () => { q = 0; const r = el.getBoundingClientRect(), u = x - r.left, v = y - r.top; el.style.cssText = `--mx:${u | 0}px;--my:${v | 0}px;--px:${(u / r.width - .5).toFixed(3)};--py:${(v / r.height - .5).toFixed(3)}`; };
    el.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; q || (q = raf(apply)); });
    el.addEventListener('pointerleave', () => (el.style.cssText = ''));
  });

  // Looping videos: play only while a quarter is on screen; Reduce motion keeps the poster until Play.
  $$('[data-vid]').forEach(box => {
    const vs = $$('video', box), btn = $('[data-play]', box);
    let user = RM.matches, vis = false;
    const run = () => {
      const go = vis && !user;
      vs.forEach(v => (go ? v.play().catch(() => {}) : v.pause()));
      if (btn) { btn.textContent = go ? 'Pause' : 'Play'; btn.setAttribute('aria-label', (go ? 'Pause' : 'Play') + ' the video'); }
    };
    onView(box, v => { vis = v; run(); }, { threshold: .25 });
    if (btn) btn.onclick = () => { user = !user; if (vs[1]) vs[0].currentTime = vs[1].currentTime; run(); };
  });

  // OFF / HIGH curtain: drag, range or jump buttons set --pos; the OFF layer follows the HIGH clock.
  $$('[data-cur]').forEach(w => {
    const st = $('.cur', w), lo = $('video.lo', w), hi = $('video.hi', w), rg = $('input[type=range]', w), out = $('output', w);
    let cur = 0;
    const set = p => {
      p = cur = Math.max(0, Math.min(100, Math.round(p)));
      const w = st.clientWidth, x = p / 100 * w;
      st.style.setProperty('--pos', p + '%');
      st.style.setProperty('--hx', (x < 22 ? 22 - x : x > w - 22 ? w - 22 - x : 0) + 'px'); // keep the handle inside the frame
      st.classList.toggle('no-l', p < 8);
      st.classList.toggle('no-r', p > 92);
      rg.value = p;
      out.textContent = p + '% HIGH';
      rg.setAttribute('aria-valuetext', `${p}% of the frame with lighting on high`);
    };
    rg.oninput = () => set(+rg.value);
    $$('[data-pos]', w).forEach(b => (b.onclick = () => set(+b.dataset.pos)));
    // Mouse drags at once. Touch waits for a horizontal move, so a vertical swipe still scrolls the page; a tap jumps.
    let drag = null;
    const at = e => { const r = st.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
    st.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, live: e.pointerType == 'mouse' };
      if (drag.live) { st.setPointerCapture(e.pointerId); at(e); }
    });
    st.addEventListener('pointermove', e => {
      if (!drag) return;
      if (!drag.live) {
        const dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
        if (dy > 8 && dy >= dx) return (drag = null);
        if (dx < 8) return;
        drag.live = true; st.setPointerCapture(e.pointerId);
      }
      at(e);
    });
    st.addEventListener('pointerup', e => { if (drag && !drag.live) at(e); drag = null; });
    st.addEventListener('pointercancel', () => (drag = null));
    addEventListener('resize', () => set(cur));
    hi.addEventListener('timeupdate', () => { if (Math.abs(lo.currentTime - hi.currentTime) > .06) lo.currentTime = hi.currentTime; });
    set(+rg.value);
  });

  // Animation speed lab. Durations from ANIMATION_DIRECTION.md; 33 ms floor; at 4x the smear frame drops.
  const lab = $('[data-alab]');
  if (lab) {
    const DUR = [110, 160, 40, 90, 100, 120], NM = ['anticipation', 'peak hold', 'smear', 'impact', 'follow-through', 'recover'];
    const vp = $('.alab-vp', lab), tag = $('b', vp), cells = $$('.alab-tl button', lab), out = $('.alab-out', lab), pb = $('[data-play]', lab), sb = $$('[data-speed]', lab);
    let sp = 1, f = 0, acc = 0, last = 0, play = !RM.matches, vis = false, id = 0;
    const ms = i => (sp == 4 && i == 2 ? 0 : Math.max(33, Math.round(DUR[i] / sp)));
    const next = i => { do i = (i + 1) % 6; while (!ms(i)); return i; };
    const show = () => {
      vp.style.setProperty('--f', f);
      tag.textContent = `F${f + 1} ${NM[f].toUpperCase()}`;
      cells.forEach((c, i) => c.setAttribute('aria-current', i == f));
      const tot = DUR.reduce((s, _, i) => s + ms(i), 0);
      out.innerHTML = `<b>Frame ${f + 1} of 6, ${NM[f]}.</b> ${DUR[f]} ms at 1x, ${ms(f) ? ms(f) + ' ms' : 'dropped'} at ${sp}x.<br>Loop ${tot} ms at ${sp}x${sp == 4 ? ', smear dropped' : ''}.`;
    };
    const layout = () => cells.forEach((c, i) => { const m = ms(i); c.style.setProperty('--w', m || 26); c.classList.toggle('drop', !m); $('span', c).textContent = m ? m + ' ms' : 'DROP'; });
    const tick = t => {
      id = 0;
      if (!play || !vis) return;
      acc += Math.min(120, t - (last || t)); last = t;
      while (acc >= ms(f)) { acc -= ms(f); f = next(f); }
      show();
      id = raf(tick);
    };
    const go = () => { last = 0; if (play && vis && !id) id = raf(tick); pb.textContent = play ? 'Pause' : 'Play'; };
    sb.forEach(b => (b.onclick = () => { sp = +b.dataset.speed; sb.forEach(x => x.setAttribute('aria-pressed', x == b)); if (!ms(f)) f = next(f); layout(); show(); }));
    pb.onclick = () => { play = !play; go(); };
    $('[data-stepf]', lab).onclick = () => { play = false; f = next(f); acc = 0; show(); go(); };
    cells.forEach((c, i) => (c.onclick = () => { play = false; f = i; acc = 0; show(); go(); }));
    onView(lab, v => { vis = v; go(); });
    layout(); show(); go();
  }

  // Art direction plates (Votive Gothic pillars). Each one hydrates its own markup on the Dawnbringer page.
  // P1: "Wick only" greys the scene and keeps the #FFE9A8 layer, which flickers like the engine's ember glow
  // (alpha +-0.06, a new target every 120-200 ms, ART_DIRECTION.md section 3).
  $$('[data-wick]').forEach(p => {
    const b = $('button', p), w = $('.w', p);
    let t = 0;
    const fl = () => { w.style.setProperty('--fl', (1 - Math.random() * .12).toFixed(3)); t = setTimeout(fl, 120 + Math.random() * 80); };
    b.onclick = () => {
      const on = b.getAttribute('aria-pressed') != 'true';
      b.setAttribute('aria-pressed', on);
      p.classList.toggle('on', on);
      clearTimeout(t);
      if (on && !RM.matches) fl(); else w.style.removeProperty('--fl');
    };
  });
  // P2: each silhouette is a toggle that reveals the figure and its name.
  $$('[data-sil] .st-p2 button').forEach(b => (b.onclick = () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') != 'true')));

  // P4: plays the game's idle tracks (anims.json) on the flat Choirmaster rig, posed as SvgRig does it: a part's
  // bone is parent bone x translate(pivot - parent pivot + p) x rotate(r) x scale(s); ground parts hang from the feet.
  const rigP = $('[data-rig]');
  if (rigP) {
    const A = JSON.parse(rigP.dataset.rig), st = $('.st-p4', rigP), img = $('img', st), run = $('[data-run]', rigP), gh = $('[data-ghost]', rigP);
    const BK = 1.70158, EASE = { linear: f => f, in: f => f ** 3, out: f => 1 - (1 - f) ** 3, inout: f => f * f * (3 - 2 * f), back: f => 1 + (BK + 1) * (f - 1) ** 3 + BK * (f - 1) ** 2, anticipate: f => (BK + 1) * f ** 3 - BK * f * f };
    const key = k => [k.p || [0, 0], k.r || 0, k.s || [1, 1]];
    const lerp = (a, b, f) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * f) : a + (b - a) * f);
    const sample = (ks, t) => {
      if (!ks || !ks.length) return key({});
      let a = ks[0];
      if (t <= a.t) return key(a);
      for (const b of ks.slice(1)) {
        if (t <= b.t) { const f = EASE[b.e || 'inout']((t - a.t) / Math.max(b.t - a.t, 1e-4)), ka = key(a), kb = key(b); return ka.map((v, i) => lerp(v, kb[i], f)); }
        a = b;
      }
      return key(a);
    };
    const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
    const xf = ([p, r, s]) => { const c = Math.cos(r * Math.PI / 180), n = Math.sin(r * Math.PI / 180); return [c * s[0], n * s[0], -n * s[1], c * s[1], p[0], p[1]]; };
    const T = (x, y) => [1, 0, 0, 1, x, y];
    let svg, parts, feet, t = 0, last = 0, id = 0, vis = false, play = !RM.matches, glow, fx = 0;
    const pose = () => {
      const W = { '': mul(T(...feet), xf(sample(A.tracks.root, t))), '@': T(...feet) }, P = { '': feet, '@': feet };
      const place = q => {
        if (W[q.id]) return W[q.id];
        const par = A.ground.includes(q.id) ? '@' : q.par, up = parts[par] ? place(parts[par]) : W[par], pp = P[par] || parts[par].pv, k = sample(A.tracks[q.id], t);
        return (W[q.id] = mul(up, xf([[q.pv[0] - pp[0] + k[0][0], q.pv[1] - pp[1] + k[0][1]], k[1], k[2]])));
      };
      for (const q of Object.values(parts)) { const m = mul(place(q), T(-q.pv[0], -q.pv[1])); q.el.setAttribute('transform', `matrix(${m.map(v => +v.toFixed(3)).join(' ')})`); }
    };
    const flick = now => { if (glow && now > fx) { glow.style.opacity = (1 - Math.random() * .12).toFixed(3); fx = now + 120 + Math.random() * 80; } };
    const tick = now => {
      id = 0;
      if (!play || !vis || !svg) return;
      t = (t + Math.min(100, now - (last || now)) / 1000) % A.length; last = now;
      pose(); flick(now);
      id = raf(tick);
    };
    const go = () => { last = 0; run.textContent = play ? 'Pause' : 'Play'; if (play && vis && !id) id = raf(tick); };
    fetch(img.currentSrc || img.src).then(r => r.text()).then(txt => {
      const box = d.createElement('div');
      box.innerHTML = txt;
      svg = box.querySelector('svg');
      if (!svg) return;
      svg.removeAttribute('width'); svg.removeAttribute('height'); svg.setAttribute('aria-hidden', 'true');
      feet = svg.dataset.feet.split(' ').map(Number);
      parts = {};
      $$('g[data-pivot]', svg).forEach(g => (parts[g.id] = { id: g.id, el: g, pv: g.dataset.pivot.split(' ').map(Number), par: g.dataset.parent || '' }));
      glow = $('circle[fill="url(#glow)"]', svg);
      st.append(svg); st.classList.add('live');
      pose(); go();
    }).catch(() => {});
    run.onclick = () => { play = !play; go(); };
    gh.onclick = () => { const on = gh.getAttribute('aria-pressed') != 'true'; gh.setAttribute('aria-pressed', on); st.classList.toggle('ghost', on); };
    onView(st, v => { vis = v; go(); });
  }

  // P5: the combat loop plays on request; "Freeze and read" pauses it, runs a 2 s bar, then lights the HUD slots.
  $$('[data-freeze]').forEach(p => {
    const st = $('.st-p5', p), v = $('video', st), pb = $('[data-vplay]', p), fz = $('[data-fz]', p), out = $('.ad-o', p), msg = out.textContent;
    let tm = 0;
    const unfreeze = () => { clearTimeout(tm); st.classList.remove('fz', 'rd'); fz.setAttribute('aria-pressed', 'false'); out.textContent = msg; };
    const sync = () => (pb.textContent = v.paused ? 'Play' : 'Pause');
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    pb.onclick = () => { if (v.paused) { unfreeze(); v.play().catch(() => {}); } else v.pause(); };
    fz.onclick = () => {
      if (fz.getAttribute('aria-pressed') == 'true') return unfreeze();
      v.pause();
      fz.setAttribute('aria-pressed', 'true');
      st.classList.add('fz');
      out.textContent = 'Reading the frame for 2 seconds.';
      tm = setTimeout(() => { st.classList.add('rd'); out.textContent = 'Life and stats for each side, and the phase, sit in the same three slots in every frame.'; }, 2000);
    };
    onView(st, vis => vis || v.pause());
  });

  // Generic pickers: a [data-k] button fills its [data-picker] box (used by the code comparator).
  // The box reserves the height of its tallest option, so switching never moves the page below it.
  $$('[data-picker]').forEach(box => {
    const ks = $$('[data-k]', box);
    const pick = b => {
      ks.forEach(x => x.setAttribute('aria-pressed', x == b));
      $$('[data-m]', box).forEach(c => c.classList.toggle('on', c.dataset.m == b.dataset.k));
      for (const o of 'td') { const el = $(`[data-o=${o}]`, box); if (el && b.dataset[o]) el.textContent = b.dataset[o]; }
    };
    const reserve = () => {
      const cur = ks.find(x => x.getAttribute('aria-pressed') == 'true') || ks[0];
      box.style.minHeight = '';
      const h = Math.max(...ks.map(b => (pick(b), box.offsetHeight)));
      pick(cur);
      box.style.minHeight = h + 'px';
    };
    ks.forEach(b => (b.onclick = () => pick(b)));
    reserve();
    let w = innerWidth;
    addEventListener('resize', () => w != innerWidth && ((w = innerWidth), reserve()));
  });

  // Dark Fantasy 32 inspector: [name, base, accent %, forbidden] from palette.json direction.biomes.
  const BIO = {
    ashen_reach: ['Ashen Reach', 'stone ink steel', { '#E0873A': 2, '#7E2E34': 2, '#C9A97B': 3 }, 'steelblu poison'],
    hanging_wood: ['Hanging Wood', 'steel ink #3C6B45', { '#7E2E34': 3, '#B2403F': 3, '#E3CDA4': 2 }, '#FFE9A8'],
    ossuary_steps: ['Ossuary Steps', 'skin stone', { '#5B3A82': 4 }, 'steelblu poison'],
    drowned_vigil: ['Drowned Vigil', 'steelblu ink', { '#C9A97B': 3, '#93A0AE': 6, '#CBD6E2': 4 }, '#FFE9A8 #D66A51'],
    cinder_foundry: ['Cinder Foundry', 'ink blood steel', { '#E0873A': 8, '#F5C05C': 8, '#C9A97B': 4, '#E3CDA4': 3 }, '#FFE9A8 poison'],
    last_light_gate: ['Last Light Gate', 'skin stone #F5C05C', { '#FFE9A8': 1 }, 'poison'],
  };
  const RES = {
    '#FFE9A8': "Wick-white. Hesper's flame, champion wicks, heal, revive and crit FX, The Last Light, UI focus and loot glint.",
    '#C39BE8': 'Arcane top. Landlord glow, Lease text and curse status.',
    '#D66A51': 'Blood top. The lethal skull on the Stone of Despair, danger UI and the Landlord seal reveal.',
  };
  const pal = $('[data-pal]');
  if (pal) {
    const sws = $$('.sw', pal), bio = $('[data-bio]', pal), card = $('[data-pick]', pal), all = bio.innerHTML, fb = $$('.pal-f button', pal), list = s => s.split(' ').join(', ');
    let f = 'all', sel;
    const has = (l, sw) => l.split(' ').some(t => t == sw.dataset.r || t == sw.dataset.h);
    const state = sw => {
      if (f == 'reserved') return RES[sw.dataset.h] ? 'reserved' : 'other';
      const b = BIO[f], q = b && b[2][sw.dataset.h];
      return !b ? '' : q ? 'accent ' + q + '%' : has(b[3], sw) ? 'forbidden' : has(b[1], sw) ? 'base' : 'other';
    };
    const copy = () => {
      const h = sel.dataset.h, msg = $('[data-msg]', card), done = ok => (msg.textContent = ok ? `Copied ${h} to the clipboard.` : `Select and copy ${h} by hand.`);
      try { navigator.clipboard.writeText(h).then(() => done(1), () => done(0)); } catch (e) { done(0); }
    };
    const apply = () => {
      for (const sw of sws) {
        const st = state(sw), hot = st[0] == 'a' || st == 'reserved', base = sw.dataset.label || (sw.dataset.label = sw.getAttribute('aria-label'));
        sw.className = 'sw' + (st == 'base' ? ' is-base' : hot ? ' is-hot' : st == 'forbidden' ? ' is-off' : st ? ' is-dim' : '') + (sw == sel ? ' is-sel' : '');
        sw.setAttribute('aria-pressed', sw == sel);
        sw.setAttribute('aria-label', st && st != 'other' ? `${base}, ${st}` : base);
        if (hot) sw.dataset.q = st == 'reserved' ? 'R' : st.slice(7); else delete sw.dataset.q;
      }
      fb.forEach(b => b.setAttribute('aria-pressed', b.dataset.f == f));
      const b = BIO[f];
      bio.innerHTML = b
        ? `<h4>Biome // ${b[0]}</h4><p class="small">Base ramps: <b>${list(b[1])}</b>.<br>Accent quotas: ${Object.entries(b[2]).map(([h, q]) => `${h} at ${q}%`).join(', ')}.<br>Forbidden: ${list(b[3])}.</p>`
        : f == 'reserved' ? '<h4>Reserved roles (3)</h4><p class="small">Three colours carry one meaning each and appear nowhere else. R marks them in the grid.</p>' : all;
      if (!sel) return;
      const h = sel.dataset.h, r = sel.dataset.r, rs = sws.filter(s => s.dataset.r == r), st = state(sel);
      card.innerHTML = `<h4>Selected colour</h4><div class="pick" style="--c:${h}"><i></i><div><strong>${h}</strong><span class="mono small mu">${r} ${rs.indexOf(sel) + 1} of ${rs.length}${st && st != 'other' ? ' // ' + st : ''}</span></div><button class="btn sm" type="button">Copy</button></div>${RES[h] ? `<p class="small" style="margin-top:10px">Reserved. ${RES[h]}</p>` : ''}<p class="mono small mu" style="margin-top:8px" data-msg></p>`;
      $('button', card).onclick = copy;
    };
    fb.forEach(b => (b.onclick = () => { f = b.dataset.f; apply(); }));
    sws.forEach(sw => (sw.onclick = () => { sel = sw; apply(); if (innerWidth < 980) card.scrollIntoView({ block: 'nearest', behavior: RM.matches ? 'auto' : 'smooth' }); }));
    apply();
  }

  // Orbiting constellations. Icons are 24x24 paths on a 45-degree grid (constellation.mjs); s = stroke, f = fill.
  const sq = (x, y, h) => `M${x - h} ${y - h}H${x + h}V${y + h}H${x - h}Z`;
  const IC = {
    cube: ['M4 9H15V20H4Z M4 9L9 4H20L15 9 M20 4V15L15 20', sq(9.5, 14.5, 1.6)],
    prism: ['M10 4L18 18H2Z M-1 14.4L5.1 12.5 M13.4 10L23.5 7.2 M14.9 12.5H23.5 M16.3 15L23.5 17.8'],
    hooks: ['M3.5 17V8.5L8.5 3.5H14L16.5 6V11 M20.5 7V15.5L15.5 20.5H10L7.5 18V13', sq(10.6, 7.4, .9) + sq(13.4, 16.6, .9)],
    braces: ['M9.5 3.5H8.5L6.5 5.5V9.5L4 12L6.5 14.5V18.5L8.5 20.5H9.5 M14.5 3.5H15.5L17.5 5.5V9.5L20 12L17.5 14.5V18.5L15.5 20.5H14.5 M12 12.6V15L10.8 16.8'],
    ts: ['M7.5 6.5L2 12L7.5 17.5 M16.5 6.5L22 12L16.5 17.5 M9 8.5H15 M12 8.5V16'],
    db: ['M5 6.5L7.5 4H16.5L19 6.5L16.5 9H7.5Z M5 6.5V17.5L7.5 20H16.5L19 17.5V6.5 M5 12L7.5 14.5H16.5L19 12'],
    shell: ['M5 6.5L10.5 12L5 17.5 M12.5 17.5H19.5'],
    layers: ['M3.5 10.5H10.5L13.5 13.5V20.5H3.5Z M7 10.5V7H14L17 10V17H13.5 M10.5 7V3.5H17.5L20.5 6.5V13.5H17'],
    axes: ['M9.5 3.5V14.5H20.5 M9.5 14.5L3.5 20.5 M7.3 5.7L9.5 3.5L11.7 5.7 M18.3 12.3L20.5 14.5L18.3 16.7 M3.5 17.4V20.5H6.6'],
    square: ['M4 20H20L4 4Z M7.5 16.5H12L7.5 12Z', sq(15, 5.5, .9) + sq(19.5, 5.5, .9) + sq(19.5, 10, .9)],
    bim: ['M5.5 9H13.5V20.5H5.5Z M5.5 9L10.5 4H18.5L13.5 9 M18.5 4V15.5L13.5 20.5 M5.5 14.75H13.5L18.5 9.75'],
    mesh: ['M8.5 3.5V20.5 M15.5 3.5V20.5 M3.5 8.5H20.5 M3.5 15.5H20.5', sq(8.5, 8.5, 1.7) + sq(15.5, 8.5, 1.7) + sq(8.5, 15.5, 1.7) + sq(15.5, 15.5, 1.7)],
    floppy: ['M4 4H16.5L20 7.5V20H4Z M8 4V9H15V4 M7.5 20V14H16.5V20'],
    loop: ['M20.5 11.5V15.5L15.5 20.5H8.5L3.5 15.5V8.5L8.5 3.5H16 M13.5 1L16 3.5L13.5 6 M8 12.5L10.75 15.25L16.25 9.75'],
    code: ['M7.5 6.5L2 12L7.5 17.5 M16.5 6.5L22 12L16.5 17.5 M14 5L10 19'],
    vertex: ['M5 19.5V10L10 5H19.5V19.5Z', sq(5, 10, 1.8) + sq(10, 5, 1.8)],
    hex: ['M12 3L19.79 7.5V16.5L12 21L4.21 16.5V7.5Z M8.5 12H15.5 M12.7 9.2L15.5 12L12.7 14.8'],
    reticle: ['M9.5 6H14.5L18 9.5V14.5L14.5 18H9.5L6 14.5V9.5Z M12 2.5V8.5 M12 15.5V21.5 M2.5 12H8.5 M15.5 12H21.5', sq(12, 12, 1)],
    kv: ['M4 7H9 M13.5 7H20 M4 12H7.5 M13.5 12H17.5 M4 17H9 M13.5 17H20', [7, 12, 17].map(y => `M10.4 ${y - 2}H11.6V${y - .8}H10.4Z M10.4 ${y + .8}H11.6V${y + 2}H10.4Z`).join(' ')],
    pipe: ['M2.5 9.5H7.5V14.5H2.5Z M16.5 3.5H21.5V8.5H16.5Z M16.5 15.5H21.5V20.5H16.5Z M7.5 12H9.5L15.5 6H16.5 M9.5 12L15.5 18H16.5'],
  };
  const paths = k => { const [s, f] = IC[k] || ['']; return `<path d="${s}"/>${f ? `<path class="f" d="${f}"/>` : ''}`; };
  $$('[data-orbit]').forEach(box => {
    const stage = $('.orbit-stage', box), hub = $('.orb-hub', stage), orbs = $$('.orb', stage), items = [hub, ...orbs];
    const chipBox = $('.orb-chips', box), tog = $('.orb-tog', stage), t = $('[data-o=t]', box), dd = $('[data-o=d]', box);
    items.forEach(b => {
      const s = b.dataset;
      b.setAttribute('aria-label', `${s.k} ${s.name}, ${s.sub}`);
      b.innerHTML = b == hub
        ? `<svg class="o" viewBox="0 0 100 100" aria-hidden="true"><path class="oc" d="M22 1H78L99 22V78L78 99H22L1 78V22Z"/></svg><span class="n">${s.k}</span><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${paths(s.icon)}</svg><strong>${s.name}</strong><small>${s.sub}</small>`
        : `<span class="orb-u"><svg class="o" viewBox="0 0 48 48" aria-hidden="true"><path class="oc" d="M11 1H37L47 11V37L37 47H11L1 37V11Z"/><g class="ic" transform="translate(12 12)">${paths(s.icon)}</g></svg><b>${s.k}</b></span>`;
    });
    const chips = items.map(b => {
      const c = d.createElement('button');
      c.type = 'button'; c.className = 'orb-chip'; c.dataset.k = b.dataset.k;
      c.innerHTML = `<b>${b.dataset.k}</b><span>${b.dataset.name}</span>`;
      chipBox.append(c);
      return c;
    });
    const sel = k => {
      [...items, ...chips].forEach(b => b.setAttribute('aria-pressed', b.dataset.k == k));
      const s = items.find(b => b.dataset.k == k).dataset;
      t.textContent = `${s.k} // ${s.name} // ${s.sub}`;
      dd.textContent = s.d;
    };
    sel(hub.dataset.k);

    // Motion: hover, focus or a click on a node or chip eases the rings to a stop; leaving eases them back.
    let vis = 0, hov = 0, foc = 0, pin = 0, user = 0, rate = 1, ramp = 0, pinT;
    const target = () => (vis && !hov && !foc && !pin && !user ? 1 : 0);
    const anims = () => (stage.getAnimations ? stage.getAnimations({ subtree: true }).filter(a => /^orb-/.test(a.animationName || '')) : null);
    const step = () => {
      ramp = 0;
      const as = anims(), tg = target();
      if (!as) return stage.classList.toggle('is-paused', !tg);
      if (!as.length) return;
      if (!vis) { rate = 0; return as.forEach(a => a.pause()); }
      rate = Math.abs(tg - rate) < .02 ? tg : rate + (tg - rate) * .14;
      as.forEach(a => { a.playbackRate = rate; if (rate && a.playState != 'running') a.play(); });
      if (!rate) as.forEach(a => a.pause());
      if (rate != tg) ramp = raf(step);
    };
    const drive = () => ramp || (ramp = raf(step));
    const hold = k => { sel(k); pin = 1; clearTimeout(pinT); pinT = setTimeout(() => { pin = 0; drive(); }, 4000); drive(); };
    [...items, ...chips].forEach(b => {
      b.addEventListener('click', () => hold(b.dataset.k));
      b.addEventListener('pointerenter', e => e.pointerType == 'mouse' && sel(b.dataset.k));
      b.addEventListener('focus', () => sel(b.dataset.k));
    });
    [stage, chipBox].forEach(el => {
      el.addEventListener('pointerenter', e => { if (e.pointerType == 'mouse') { hov = 1; drive(); } });
      el.addEventListener('pointerleave', () => { hov = 0; drive(); });
    });
    box.addEventListener('focusin', e => { if (e.target != tog && e.target.matches(':focus-visible')) { foc = 1; drive(); } });
    box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget) || e.relatedTarget == tog) { foc = 0; drive(); } });
    tog.onclick = () => {
      user = !user;
      if (!user) hov = foc = pin = 0;
      tog.setAttribute('aria-pressed', !!user);
      tog.textContent = user ? 'Play' : 'Pause';
      tog.setAttribute('aria-label', user ? 'Resume the orbit' : 'Pause the orbit');
      drive();
    };
    onView(stage, v => { vis = v; drive(); });
  });

  // OpenStrut live app: nothing loads from the app's origin until a click on the facade,
  // or, for a demo marked data-auto, until the panel is mostly in view (skipped under
  // reduced motion or Save-Data). Each button's data-demo is the app's demo link
  // (?exemplo=...&embed=1): the app opens the calculated example on that view.
  $$('[data-app]').forEach(app => {
    const base = app.dataset.src, fr = $('.app-frame', app), face = $('.app-face', app), bar = $('.app-bar', app), hint = $('.hint', bar), ext = $('.ext', bar);
    const frame = () => $('iframe', fr);
    let src = base, started = false;
    const title = b => {
      hint.textContent = '';
      const g = d.createElement('b');
      g.textContent = 'Live // ';
      hint.append(g, b.dataset.label || b.textContent);
    };
    const launch = b => {
      started = true;
      src = base + b.dataset.demo;
      title(b);
      // the external tab is the full app, not the embedded mode
      ext.href = src.replace(/[?&]embed=1$/, '');
      const H = fr.offsetHeight, shown = !bar.hidden;
      bar.hidden = false; bar.classList.remove('idle');
      if (!frame()) {
        const f = d.createElement('iframe');
        f.title = 'OpenStrut V2 live app'; f.allow = 'fullscreen; clipboard-write; xr-spatial-tracking'; f.referrerPolicy = 'no-referrer';
        fr.append(f);
      }
      frame().src = src;
      face.hidden = true;
      const h = Math.max(0, H - (shown ? 0 : bar.offsetHeight)) + 'px';
      fr.style.minHeight = h; frame().style.minHeight = h;
    };
    $$('[data-demo]', face).forEach(b => (b.onclick = () => launch(b)));
    const auto = $('[data-auto]', face), nc = navigator.connection;
    if (auto && !matchMedia('(prefers-reduced-motion: reduce)').matches && !(nc && nc.saveData)) {
      // the bar is laid out from the start (buttons invisible), so the autoplay moves nothing
      title(auto); bar.hidden = false; bar.classList.add('idle');
      d.dispatchEvent(new Event('ptc:layout'));
      onView(app, v => v && !started && launch(auto), { threshold: .5 });
    }
    if (!d.fullscreenEnabled) $('[data-act=fs]', bar).hidden = true; // iPhone Safari has no element fullscreen
    $('[data-act=fs]', bar).onclick = () => (app.requestFullscreen ? app.requestFullscreen().catch(() => {}) : frame() && frame().requestFullscreen && frame().requestFullscreen());
    $('[data-act=reload]', bar).onclick = () => frame() && (frame().src = src);
    $('[data-act=close]', bar).onclick = () => { if (d.fullscreenElement) d.exitFullscreen(); frame() && frame().remove(); bar.hidden = true; face.hidden = false; fr.style.minHeight = ''; };
  });

  // Byte bars grow when they reach the viewport.
  $$('.bars').forEach(b => onView(b, v => v && b.classList.add('in'), { threshold: .4 }));

  // WCAG inspector: ratios computed here from the same tokens as site.css.
  const wc = $('[data-wcag]');
  if (wc) {
    const T = {
      studio: { d: ['#111214', '#1A1C20', '#F3F4F6', '#8E95A2', '#FF5A1F', '#111214'], l: ['#F3F3F0', '#FFFFFF', '#141518', '#5E636E', '#C43A0A', '#FFFFFF'] },
      dawnbringer: { d: ['#0B0710', '#140E1F', '#F2E3C6', '#B39FA8', '#F5C05C', '#0B0710'], l: ['#F4EFE6', '#FCF9F2', '#1B1221', '#5A4B63', '#8F4F0A', '#FFFFFF'] },
      openstrut: { d: ['#0B121C', '#111B29', '#EDF4FB', '#92ABC6', '#38BDF8', '#09111B'], l: ['#EEF3F8', '#FFFFFF', '#0F1D2D', '#475E76', '#0369A1', '#FFFFFF'] },
    };
    const PAIRS = [['Body text on background', 2, 0], ['Muted text on background', 3, 0], ['Accent links on background', 4, 0], ['Accent links on cards', 4, 1], ['Button label on accent', 5, 4]];
    const lum = h => hex(h).map(v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const lvl = v => (v >= 7 ? 'AAA' : v >= 4.5 ? 'AA' : v >= 3 ? 'AA large' : 'Fail');
    const list = $('.wc', wc), out = $('.wc-out', wc);
    let w = R.dataset.world in T ? R.dataset.world : 'studio', m = theme() == 'dark' ? 'd' : 'l', p = 0;
    const render = () => {
      const tk = T[w][m];
      $$('[data-w]', wc).forEach(b => b.setAttribute('aria-pressed', b.dataset.w == w));
      $$('[data-md]', wc).forEach(b => b.setAttribute('aria-pressed', b.dataset.md == m));
      list.innerHTML = PAIRS.map(([n, f, b], i) => { const v = ratio(tk[f], tk[b]); return `<button type="button" aria-pressed="${i == p}" data-i="${i}"><i style="--b:${tk[b]};--f:${tk[f]}">Aa</i><span><b>${n}</b>${tk[f]} on ${tk[b]}</span><em>${v.toFixed(2)}:1<small>${lvl(v)}</small></em></button>`; }).join('');
      $$('button', list).forEach(b => (b.onclick = () => { p = +b.dataset.i; render(); list.children[p].focus(); }));
      const [n, f, b] = PAIRS[p], v = ratio(tk[f], tk[b]);
      out.style.cssText = `--b:${tk[b]};--f:${tk[f]}`;
      $('span', out).textContent = `${v.toFixed(2)}:1 // ${lvl(v)} // ${n}, ${w} ${m == 'd' ? 'dark' : 'light'}. ${tk[f]} on ${tk[b]}.`;
    };
    $$('[data-w]', wc).forEach(b => (b.onclick = () => { w = b.dataset.w; render(); }));
    $$('[data-md]', wc).forEach(b => (b.onclick = () => { m = b.dataset.md; render(); }));
    d.addEventListener('ptc:paint', () => { m = theme() == 'dark' ? 'd' : 'l'; render(); });
    render();
  }

  // Lightbox: <button data-zoom> wraps the image (or a dark/light pair). Esc or an outside click closes.
  $$('[data-zoom]').forEach(btn => (btn.onclick = () => {
    const src = $$('img', btn).find(i => i.offsetWidth), dlg = d.createElement('dialog');
    dlg.className = 'lb';
    dlg.setAttribute('aria-label', 'Image viewer');
    dlg.innerHTML = '<button class="x" type="button">Close // Esc</button><figure><img><figcaption></figcaption></figure>';
    const img = $('img', dlg);
    Object.assign(img, { src: src.currentSrc || src.src, width: src.naturalWidth, height: src.naturalHeight, alt: src.alt });
    $('figcaption', dlg).textContent = btn.dataset.cap || src.alt;
    $('.x', dlg).onclick = () => dlg.close();
    dlg.onclick = e => e.target == dlg && dlg.close();
    dlg.onclose = () => dlg.remove();
    d.body.append(dlg);
    dlg.showModal();
  }));
})();
