// praisetc.com: theme toggle, pickers, palette inspector and <dialog> lightbox. No dependencies.
(() => {
  const d = document, R = d.documentElement, $$ = (s, el = d) => [...el.querySelectorAll(s)];
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const theme = () => R.dataset.theme || (mq.matches ? 'dark' : 'light');

  // Theme. The inline head script applied a saved choice before first paint.
  const paint = () => {
    const t = theme();
    $$('.tog').forEach(b => b.setAttribute('aria-pressed', t == 'dark'));
    if (R.dataset.theme) $$('meta[name=theme-color]').forEach(m => (m.content = t == 'dark' ? '#111214' : '#F3F3F0'));
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

  // Pickers: click or focus on a [data-k] button fills its [data-picker] box (fixed-height outputs).
  const pick = (box, btn) => {
    const k = btn.dataset.k, ds = btn.dataset;
    $$('[data-k]', box).forEach(b => b.setAttribute('aria-pressed', b == btn));
    box.dataset.active = k;
    $$('[data-m]', box).forEach(c => c.classList.toggle('on', c.dataset.m == k));
    if (ds.at) {
      const [x, y, s] = ds.at.split(',');
      box.style.cssText = `--x:${x / 5.6};--y:${y / 4};--k:${s || 1}`;
    }
    for (const o of 'td') { const el = box.querySelector(`[data-o=${o}]`); if (el && ds[o]) el.textContent = ds[o]; }
    const out = box.querySelector('[data-out]');
    if (out && ds.b) out.style.cssText = `--b:${ds.b};--f:${ds.f}`;
    const img = box.querySelector('[data-stage]');
    if (img && ds.src) Object.assign(img, { src: ds.src, width: ds.w, height: ds.h, alt: ds.alt });
  };
  $$('[data-picker]').forEach(box => $$('[data-k]', box).forEach(b => {
    b.addEventListener('click', () => pick(box, b));
    b.addEventListener('focus', () => pick(box, b));
  }));

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
  const pal = d.querySelector('[data-pal]');
  if (pal) {
    const sws = $$('.sw', pal), bio = pal.querySelector('[data-bio]'), card = pal.querySelector('[data-pick]'), all = bio.innerHTML;
    sws.forEach(sw => (sw.dataset.baseLabel = sw.getAttribute('aria-label') || sw.dataset.h));
    const fb = $$('.pal-f button', pal), list = s => s.split(' ').join(', ');
    let f = 'all', sel;
    const has = (l, sw) => l.split(' ').some(t => t == sw.dataset.r || t == sw.dataset.h);
    const state = sw => {
      if (f == 'reserved') return RES[sw.dataset.h] ? 'reserved' : 'other';
      const b = BIO[f], q = b && b[2][sw.dataset.h];
      return !b ? '' : q ? 'accent ' + q + '%' : has(b[3], sw) ? 'forbidden' : has(b[1], sw) ? 'base' : 'other';
    };
    const copy = () => {
      const h = sel.dataset.h, msg = card.querySelector('p:last-child');
      const done = ok => (msg.textContent = ok ? `Copied ${h} to the clipboard.` : `Select and copy ${h} by hand.`);
      try { navigator.clipboard.writeText(h).then(() => done(1), () => done(0)); } catch (e) { done(0); }
    };
    const apply = () => {
      for (const sw of sws) {
        const st = state(sw), hot = st[0] == 'a' || st == 'reserved';
        sw.className = 'sw' + (st == 'base' ? ' is-base' : hot ? ' is-hot' : st == 'forbidden' ? ' is-off' : st ? ' is-dim' : '') + (sw == sel ? ' is-sel' : '');
        sw.setAttribute('aria-pressed', sw == sel);
        sw.setAttribute('aria-label', st && st != 'other' ? `${sw.dataset.baseLabel}, ${st}` : sw.dataset.baseLabel);
        if (hot) sw.dataset.q = st == 'reserved' ? 'R' : st.slice(7); else delete sw.dataset.q;
      }
      fb.forEach(b => b.setAttribute('aria-pressed', b.dataset.f == f));
      const b = BIO[f];
      bio.innerHTML = b
        ? `<h4>Biome // ${b[0]}</h4><p class="small" style="margin:0">Base ramps: <b>${list(b[1])}</b>.<br>Accent quotas: ${Object.entries(b[2]).map(([h, q]) => `${h} at ${q}%`).join(', ')}.<br>Forbidden: ${list(b[3])}.</p>`
        : f == 'reserved' ? '<h4>Reserved roles (3)</h4><p class="small" style="margin:0">Three colours carry a meaning and appear nowhere else. R marks them in the grid.</p>' : all;
      if (!sel) return;
      const h = sel.dataset.h, r = sel.dataset.r, rs = sws.filter(s => s.dataset.r == r), st = state(sel);
      card.innerHTML = `<h4>Selected colour</h4><div class="pick" style="--c:${h}"><i></i><div><strong>${h}</strong><span class="mono small mu">${r} ${rs.indexOf(sel) + 1} of ${rs.length}${st && st != 'other' ? ' // ' + st : ''}</span></div><button class="btn" type="button">Copy</button></div>${RES[h] ? `<p class="small" style="margin:12px 0 0">Reserved. ${RES[h]}</p>` : ''}<p class="mono small mu" style="margin:10px 0 0"></p>`;
      card.querySelector('button').onclick = copy;
    };
    fb.forEach(b => (b.onclick = () => { f = b.dataset.f; apply(); }));
    sws.forEach(sw => (sw.onclick = () => { sel = sw; apply(); }));
    apply();
  }

  // Lightbox: <button data-zoom> wraps the image (or a dark/light pair). Esc or an outside click closes.
  $$('[data-zoom]').forEach(btn => (btn.onclick = () => {
    const src = $$('img', btn).find(i => i.offsetWidth), dlg = d.createElement('dialog');
    dlg.className = 'lb';
    dlg.setAttribute('aria-label', 'Image viewer');
    dlg.innerHTML = '<button class="x" type="button">Close // Esc</button><figure><img><figcaption></figcaption></figure>';
    const img = dlg.querySelector('img');
    Object.assign(img, { src: src.currentSrc || src.src, width: src.naturalWidth, height: src.naturalHeight, alt: src.alt });
    if (btn.dataset.zoom == 'px') img.style.imageRendering = 'pixelated';
    dlg.querySelector('figcaption').textContent = btn.dataset.cap || src.alt;
    dlg.querySelector('.x').onclick = () => dlg.close();
    dlg.onclick = e => e.target == dlg && dlg.close();
    dlg.onclose = () => dlg.remove();
    d.body.append(dlg);
    dlg.showModal();
  }));
})();
