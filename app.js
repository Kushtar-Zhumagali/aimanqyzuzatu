// ============================================================================
// 米莱婚礼邀请函 · 交互逻辑
// 依赖： config.js (window.WEDDING_CONFIG)  ·  i18n.js (window.I18N)
// ============================================================================
(() => {
  'use strict';

  const CFG  = window.WEDDING_CONFIG;
  const I18N = window.I18N;

  // ---------- helpers ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, '0');
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

  // ---------- state ----------
  const STORAGE_LANG = 'wed.lang';
  let lang = localStorage.getItem(STORAGE_LANG)
    || (navigator.language || '').slice(0, 2).toLowerCase()
    || CFG.defaultLang;
  if (!I18N[lang]) lang = CFG.defaultLang;

  // ---------- i18n apply ----------
  function applyLang(next) {
    if (!I18N[next]) return;
    lang = next;
    localStorage.setItem(STORAGE_LANG, lang);
    const t = I18N[lang];
    document.documentElement.lang = t.htmlLang;
    document.documentElement.dir  = t.direction;

    // simple [data-i18n="key.path"] replacement
    $$('[data-i18n]').forEach((el) => {
      const v = get(t, el.getAttribute('data-i18n'));
      if (typeof v === 'string') el.textContent = v;
    });

    // dynamic content — null-safe (some sections may have been removed in config)
    const setText = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };
    // null-safe pick — supports both multi-lang configs and single-lang
    const pick = (obj) => obj ? (obj[lang] || obj.ru || obj.kk || obj.zh || '') : '';
    if (CFG.groom) setText('#name-groom', pick(CFG.groom));
    // hero bride name uses brideDisplay (Latin 花体) if provided, else Cyrillic
    setText('#name-bride',     CFG.brideDisplay || pick(CFG.bride));
    setText('#blessing-quote', pick(CFG.blessing));
    setText('#dress-text',     pick(CFG.dressCode));

    // details
    const d = new Date(CFG.date);
    setText('#d-date',    formatDate(d, lang));
    setText('#d-time',    `сағат ${formatTime(d, lang)}`);
    setText('#d-venue',   pick(CFG.venue.name));
    setText('#d-address', pick(CFG.venue.address));

    // той иелері (wedding hosts)
    if (CFG.toiHosts) {
      setText('#toi-welcome', pick(CFG.toiHosts.welcome));
      setText('#toi-father',  CFG.toiHosts.father);
      setText('#toi-mother',  CFG.toiHosts.mother);
    }

    // contact list
    renderContacts();

    // form placeholders
    const namePh = $('input[name="name"]');
    if (namePh) namePh.placeholder = t.fieldNamePh;
    const msgPh = $('textarea[name="message"]');
    if (msgPh) msgPh.placeholder = t.fieldMessagePh;

    // music btn aria
    const audio = $('#bg-audio');
    const playing = audio && !audio.paused;
    $('#music-btn').setAttribute('aria-label', playing ? t.music.on : t.music.off);

    // active tab
    $$('.lang-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.lang === lang));

    // wishes toggle button label follows language
    updateWishesToggle();

    document.dispatchEvent(new CustomEvent('lang:changed', { detail: { lang } }));
  }

  // ---------- date formatting (always Almaty time, regardless of viewer) ----------
  const TZ = 'Asia/Almaty';
  const MONTHS = {
    kk: ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'],
    ru: ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
    zh: ['1 月','2 月','3 月','4 月','5 月','6 月','7 月','8 月','9 月','10 月','11 月','12 月'],
  };
  // pull individual date parts as they appear in Asia/Almaty
  function partsIn(tz, d) {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const out = {};
    fmt.formatToParts(d).forEach((p) => { if (p.type !== 'literal') out[p.type] = p.value; });
    return out;  // { year, month, day, hour, minute }
  }
  function formatDate(d, l) {
    const p = partsIn(TZ, d);
    const y = p.year, mi = Number(p.month) - 1, day = Number(p.day);
    const m = MONTHS[l][mi];
    if (l === 'kk') return `${day} ${m} ${y}`;       // 13 маусым 2026 (无 «жылғы»)
    if (l === 'zh') return `${y} 年 ${mi + 1} 月 ${day} 日`;
    return `${day} ${m} ${y}`;
  }
  function formatTime(d, _l) {
    const p = partsIn(TZ, d);
    return `${p.hour}:${p.minute}`;
  }

  // ---------- contacts ----------
  function renderContacts() {
    const list = $('#contact-list');
    if (!list) return;
    list.innerHTML = '';
    (CFG.hosts || []).forEach((h) => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.className = 'c-label';
      label.textContent = h.label[lang] || h.label.ru || '';
      const a = document.createElement('a');
      a.className = 'c-phone';
      a.href = `tel:${h.phone.replace(/[^\d+]/g, '')}`;
      a.textContent = h.phone;
      li.append(label, a);
      list.appendChild(li);
    });
  }

  // ---------- countdown ----------
  function tickCountdown() {
    const target = new Date(CFG.date).getTime();
    const now = Date.now();
    let diff = Math.max(0, target - now);
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
    const m = Math.floor(diff / 60000);    diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    $('#cd-d').textContent = pad(d);
    $('#cd-h').textContent = pad(h);
    $('#cd-m').textContent = pad(m);
    $('#cd-s').textContent = pad(s);
  }

  // ---------- 2GIS + map ----------
  function setup2gisLinks() {
    const url = CFG.venue.gis2 || `https://2gis.kz/geo/${CFG.venue.coords.lon}%2C${CFG.venue.coords.lat}`;
    const btn = $('#btn-2gis');
    const mapLink = $('#map-link');
    if (btn) btn.href = url;
    if (mapLink) mapLink.href = url;

    // OpenStreetMap embed (free, works on GitHub Pages)
    const { lat, lon } = CFG.venue.coords;
    const span = 0.006;
    const bbox = `${lon - span},${lat - span},${lon + span},${lat + span}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
    const iframe = $('#map-iframe');
    if (iframe) iframe.src = src;
  }

  // ---------- .ics calendar download ----------
  function buildICS() {
    const start = new Date(CFG.date);
    const end = new Date(start.getTime() + 5 * 3600 * 1000); // 5h
    const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const t = I18N[lang];
    const pick = (obj) => obj ? (obj[lang] || obj.ru || obj.kk || obj.zh || '') : '';
    const groom = CFG.groom ? pick(CFG.groom) : '';
    const bride = pick(CFG.bride);
    const couple = groom ? `${groom} & ${bride}` : bride;
    const venue = pick(CFG.venue.name);
    const addr  = pick(CFG.venue.address);

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//wedding-invite//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${start.getTime()}@wedding-invite`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${couple} — ${t.detailsTitle}`,
      `LOCATION:${venue}\\, ${addr}`,
      `DESCRIPTION:${t.heroInvite}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invite-${bride}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- music ----------
  function setupMusic() {
    const audio = $('#bg-audio');
    const btn = $('#music-btn');
    if (!CFG.music) { btn.hidden = true; return; }
    audio.src = CFG.music;
    audio.preload = 'auto';   // 预加载，第一次交互能立刻响

    // probe file — hide button if missing
    fetch(CFG.music, { method: 'HEAD' }).catch(() => {}).then((r) => {
      if (!r || !r.ok) btn.hidden = true;
    });

    let userPaused = false;   // 用户手动暂停后，就不再自动接管

    // 平滑淡入到目标音量
    function fadeIn() {
      audio.volume = 0;
      let v = 0;
      const id = setInterval(() => {
        v = Math.min(0.6, v + 0.04);
        audio.volume = v;
        if (v >= 0.6) clearInterval(id);
      }, 60);
    }

    function startMusic() {
      if (!audio.paused || userPaused) return;
      audio.play().then(() => {
        btn.classList.add('is-playing');
        fadeIn();
        const t = I18N[lang];
        btn.setAttribute('aria-label', t.music.on);
      }).catch(() => { /* 仍被拦截 — 等下一次交互 */ });
    }

    // ① 尝试直接自动播放（多数手机会被拦截，桌面端可能成功）
    startMusic();

    // ② 被拦截时：客人第一次碰屏幕 / 滑动 / 点击就自动响起
    const kick = () => { startMusic(); };
    ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll'].forEach((ev) => {
      window.addEventListener(ev, kick, { once: true, passive: true });
    });

    // ③ 音乐按钮：手动开关
    btn.addEventListener('click', () => {
      if (audio.paused) {
        userPaused = false;
        audio.play().then(() => { btn.classList.add('is-playing'); fadeIn(); }).catch(() => {});
      } else {
        userPaused = true;
        audio.pause();
        btn.classList.remove('is-playing');
      }
      const t = I18N[lang];
      btn.setAttribute('aria-label', audio.paused ? t.music.off : t.music.on);
    });
  }

  // ---------- RSVP form ----------
  function setupRsvp() {
    const form = $('#rsvp-form');
    const countField = $('#count-field');
    const statusEl = $('#rsvp-status');

    // toggle count visibility
    form.addEventListener('change', (e) => {
      if (e.target.name === 'attending') {
        countField.hidden = e.target.value !== 'yes';
      }
    });

    // stepper
    $$('.count-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const input = $('input[name="count"]', form);
        const step = Number(b.dataset.step) || 0;
        const next = Math.max(1, Math.min(20, Number(input.value || 1) + step));
        input.value = next;
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {
        type: 'rsvp',
        name: (fd.get('name') || '').toString().trim(),
        attending: fd.get('attending'),
        count: Number(fd.get('count') || 1),
        message: (fd.get('message') || '').toString().trim(),
        lang,
        ts: new Date().toISOString(),
      };
      if (!payload.name || !payload.attending) {
        statusEl.textContent = I18N[lang].fieldName + ' ✱';
        statusEl.className = 'rsvp-status is-error';
        return;
      }
      const btn = $('#btn-submit');
      btn.disabled = true;
      statusEl.className = 'rsvp-status';
      statusEl.textContent = I18N[lang].submitting;

      const ok = await sendToSheet(payload);

      // always keep a local copy so the guestbook can show the guest's own wish
      saveLocal('rsvp', payload);

      if (ok === 'demo') {
        finishRsvp(payload, true, I18N[lang].demoNotice);
      } else if (ok) {
        finishRsvp(payload, true);
        if (payload.message) setTimeout(loadWishes, 400);
      } else {
        btn.disabled = false;
        statusEl.className = 'rsvp-status is-error';
        statusEl.textContent = I18N[lang].errorSend;
      }
    });
  }

  function finishRsvp(payload, ok, extraNote) {
    const form = $('#rsvp-form');
    const statusEl = $('#rsvp-status');
    form.classList.add('is-submitted');

    // big medallion as success mark
    let mark = $('.thanks-mark', form);
    if (!mark) {
      mark = document.createElement('div');
      mark.className = 'thanks-mark';
      mark.innerHTML =
        '<svg width="80" height="80" viewBox="0 0 120 120" style="color:#C9A961"><use href="#orn-medallion"/></svg>';
      form.prepend(mark);
    }

    const msg = payload.attending === 'yes' ? I18N[lang].thanksYes : I18N[lang].thanksNo;
    statusEl.className = 'rsvp-status is-ok';
    statusEl.textContent = extraNote ? `${msg}  ·  ${extraNote}` : msg;
  }

  async function sendToSheet(payload) {
    if (!CFG.rsvpEndpoint) return 'demo';
    try {
      // Google Apps Script /exec 302-redirects to googleusercontent.com which
      // has no CORS headers — so a cors fetch can't read the reply. We use
      // no-cors: the POST still reaches the script and writes the row; the
      // response is opaque, so a resolved promise = optimistic success.
      await fetch(CFG.rsvpEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (err) {
      console.warn('RSVP send failed', err);
      return false;
    }
  }

  function saveLocal(kind, data) {
    const key = `wed.${kind}`;
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push(data);
    localStorage.setItem(key, JSON.stringify(arr));
  }

  // ---------- Wishes (guestbook) ----------
  function localWishes() {
    const arr = JSON.parse(localStorage.getItem('wed.rsvp') || '[]');
    return arr.filter((r) => r.message).map((r) => ({ name: r.name, message: r.message }));
  }

  // wishes collapse/expand state
  const WISHES_PREVIEW = 3;
  let wishesExpanded = false;
  let wishesTotal = 0;

  function renderWishes(wishes) {
    const list = $('#wishes-list');
    if (!list || !wishes || !wishes.length) return;
    list.innerHTML = '';
    const ordered = wishes.slice(-60).reverse();   // newest first
    wishesTotal = ordered.length;
    ordered.forEach((w, i) => {
      const li = document.createElement('li');
      if (i >= WISHES_PREVIEW) li.className = 'wish-extra';
      const n = document.createElement('span');
      n.className = 'wish-name'; n.textContent = w.name || '—';
      const m = document.createElement('span');
      m.className = 'wish-text'; m.textContent = w.message || '';
      li.append(n, m);
      list.appendChild(li);
    });
    list.classList.toggle('is-expanded', wishesExpanded);
    updateWishesToggle();
  }

  // toggle button — shown only when there are more than WISHES_PREVIEW wishes
  function updateWishesToggle() {
    const btn = $('#wishes-toggle');
    if (!btn) return;
    if (wishesTotal <= WISHES_PREVIEW) { btn.hidden = true; return; }
    btn.hidden = false;
    btn.classList.toggle('is-open', wishesExpanded);
    const t = I18N[lang];
    const txt = $('.wishes-toggle-text', btn);
    if (txt) {
      txt.textContent = wishesExpanded
        ? t.wishesCollapse
        : `${t.wishesShowAll} (${wishesTotal})`;
    }
  }

  function setupWishesToggle() {
    const btn = $('#wishes-toggle');
    const list = $('#wishes-list');
    if (!btn || !list) return;
    btn.addEventListener('click', () => {
      wishesExpanded = !wishesExpanded;
      list.classList.toggle('is-expanded', wishesExpanded);
      updateWishesToggle();
      if (!wishesExpanded) {
        // on collapse, bring the section back into view
        document.getElementById('chapter-wishes')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Reads wishes from the Sheet via JSONP (a plain fetch can't — Apps Script
  // gives no CORS headers). Falls back to the visitor's own local wishes.
  function loadWishes() {
    if (!$('#wishes-list')) return;
    const local = localWishes();

    if (!CFG.rsvpEndpoint) { renderWishes(local); return; }

    const cb = 'wedWishes' + Date.now();
    let done = false;
    window[cb] = (data) => {
      done = true;
      const remote = Array.isArray(data) ? data : [];
      // merge remote + local, de-dup by name+message
      const seen = new Set();
      const merged = [...remote, ...local].filter((w) => {
        const k = (w.name || '') + '|' + (w.message || '');
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
      renderWishes(merged);
      delete window[cb];
    };
    const s = document.createElement('script');
    s.src = CFG.rsvpEndpoint + '?action=wishes&callback=' + cb;
    s.onerror = () => { if (!done) { renderWishes(local); delete window[cb]; } };
    document.head.appendChild(s);
    setTimeout(() => { if (!done) { renderWishes(local); } }, 6000);
  }

  // ---------- Reveal on scroll ----------
  function setupReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    $$('.reveal').forEach((el) => io.observe(el));
  }

  // ---------- Custom cursor (desktop) ----------
  function setupCursor() {
    const cursor = document.getElementById('cursor');
    if (!cursor) return;
    if (!window.matchMedia('(hover: hover)').matches) { cursor.remove(); return; }
    if (window.matchMedia('(max-width: 768px)').matches) { cursor.remove(); return; }

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let cx = x, cy = y;
    let active = false;

    document.addEventListener('mousemove', (e) => {
      x = e.clientX; y = e.clientY;
      if (!active) { active = true; cursor.classList.add('is-active'); }
    });
    document.addEventListener('mouseleave', () => {
      active = false; cursor.classList.remove('is-active');
    });

    function loop() {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    }
    loop();

    // hover targets
    const hoverSel = 'a, button, input, textarea, label, .radio-pill, .progress-dot, .map-frame, .detail-card, .contact-list li, .swatch';
    document.body.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSel)) cursor.classList.add('is-hover');
    });
    document.body.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSel) && !e.relatedTarget?.closest(hoverSel)) cursor.classList.remove('is-hover');
    });
    document.documentElement.style.cursor = 'none';
  }

  // ---------- Scroll progress rail ----------
  function setupProgress() {
    const dots = $$('.progress-dot');
    if (!dots.length) return;
    const sections = dots.map((d) => document.querySelector(d.getAttribute('href')));

    function update() {
      const mid = window.scrollY + window.innerHeight * 0.4;
      let active = -1;
      sections.forEach((s, i) => { if (s && s.offsetTop <= mid) active = i; });
      dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
    }

    update();
    window.addEventListener('scroll', update, { passive: true });

    dots.forEach((d) => {
      d.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(d.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ---------- Marquee strip (date + names looped) ----------
  function setupMarquee() {
    const track = document.getElementById('marquee-track');
    if (!track) return;
    const render = () => {
      const pick = (obj) => obj ? (obj[lang] || obj.ru || obj.kk || obj.zh || '') : '';
      const groom = CFG.groom ? pick(CFG.groom) : '';
      const bride = pick(CFG.bride);
      const names = groom
        ? `${groom} <span class="star">&amp;</span> ${bride}`
        : bride;
      const date = new Date(CFG.date);
      const dateStr = partsIn(TZ, date);
      const dateLine = `${dateStr.day}.${dateStr.month}.${dateStr.year}`;
      const venue = pick(CFG.venue.name);

      // build one chunk
      const chunk = () => {
        const w = document.createElement('div');
        w.className = 'marquee-item';
        w.innerHTML =
          `<span>${names}</span>` +
          `<span class="dot"></span>` +
          `<span>${dateLine}</span>` +
          `<span class="dot"></span>` +
          `<span>${venue}</span>` +
          `<span class="dot"></span>`;
        return w;
      };
      track.innerHTML = '';
      // duplicate enough so it loops seamlessly
      for (let i = 0; i < 8; i++) track.appendChild(chunk());
    };
    render();
    // re-render on language change
    document.addEventListener('lang:changed', render);
  }

  // ---------- Hero names mouse parallax ----------
  function setupNamesParallax() {
    const names = document.querySelector('.names');
    if (!names) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    let raf = 0;
    let target = { x: 0, y: 0 };
    let cur = { x: 0, y: 0 };

    document.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 to 1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      target.x = nx;
      target.y = ny;
      if (!names.classList.contains('has-tilt')) names.classList.add('has-tilt');
      if (!raf) raf = requestAnimationFrame(loop);
    });

    function loop() {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      names.style.setProperty('--tilt-y', `${(cur.x * 5).toFixed(2)}deg`);
      names.style.setProperty('--tilt-x', `${(-cur.y * 4).toFixed(2)}deg`);
      if (Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    }
  }

  // ---------- Ambient floating gold particles ----------
  function spawnAmbient() {
    const c = document.getElementById('ambient');
    if (!c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const N = window.innerWidth < 500 ? 18 : 28;
    for (let i = 0; i < N; i++) {
      const s = document.createElement('span');
      const size = 2 + Math.random() * 4;
      const dur = 14 + Math.random() * 18;
      s.style.setProperty('--x', `${Math.random() * 100}%`);
      s.style.setProperty('--s', `${size.toFixed(1)}px`);
      s.style.setProperty('--g', `${(size * 2.5).toFixed(1)}px`);
      s.style.setProperty('--dur', `${dur.toFixed(1)}s`);
      s.style.setProperty('--delay', `${(-Math.random() * dur).toFixed(1)}s`);
      s.style.setProperty('--swayMid', `${((Math.random() - 0.5) * 80).toFixed(0)}px`);
      s.style.setProperty('--swayEnd', `${((Math.random() - 0.5) * 60).toFixed(0)}px`);
      s.style.setProperty('--o', (0.35 + Math.random() * 0.45).toFixed(2));
      c.appendChild(s);
    }
  }

  // ---------- Intro envelope animation ----------
  function fillEnvelopeCard() {
    const pick = (obj) => obj ? (obj[lang] || obj.ru || obj.kk || obj.zh || '') : '';
    const eg = document.getElementById('env-groom');
    const eb = document.getElementById('env-bride');
    if (eg && CFG.groom) eg.textContent = pick(CFG.groom);
    // 信封 bride 用 brideDisplay（Latin 花体），没有就退回 Cyrillic
    if (eb) eb.textContent = CFG.brideDisplay || pick(CFG.bride);

    const eyebrow = { kk: 'Қыз ұзату', ru: 'Свадьба', zh: '婚礼' };
    const ee = document.getElementById('env-eyebrow');
    if (ee) ee.textContent = eyebrow[lang] || eyebrow.kk;

    const ed = document.getElementById('env-date');
    if (ed) {
      const p = partsIn(TZ, new Date(CFG.date));
      ed.textContent = `${p.day} · ${p.month} · ${p.year}`;
    }
  }

  function setupIntro() {
    const intro = document.getElementById('intro');
    if (!intro) return;

    fillEnvelopeCard();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      intro.remove();
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-loaded');
      return;
    }

    // generate gold dust particles around the perimeter (random distance + angle)
    const dust = document.getElementById('dust');
    const N = 28;
    for (let i = 0; i < N; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 220 + Math.random() * 240;  // 220-460px from center
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const span = document.createElement('span');
      span.style.setProperty('--x', `${x.toFixed(1)}px`);
      span.style.setProperty('--y', `${y.toFixed(1)}px`);
      span.style.transitionDelay = `${(Math.random() * 0.25).toFixed(2)}s`;
      dust.appendChild(span);
    }

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      intro.classList.add('is-fade');
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-loaded');
      setTimeout(() => intro.remove(), 1000);
    };

    // skip on tap/click
    intro.addEventListener('click', () => {
      if (!intro.classList.contains('is-open')) {
        // accelerate the sequence: skip to opening
        intro.classList.add('is-particles', 'is-burst', 'is-open');
        setTimeout(dismiss, 500);
      } else {
        dismiss();
      }
    });

    // sequence (use setTimeout — rAF is throttled when the tab is hidden)
    setTimeout(() => intro.classList.add('is-particles'),   80);
    setTimeout(() => intro.classList.add('is-burst'),     1450);
    setTimeout(() => intro.classList.add('is-open'),      1850);
    setTimeout(dismiss,                                   2900);
  }

  // ---------- Wire up ----------
  function init() {
    // language tabs
    $$('.lang-btn').forEach((b) => {
      b.addEventListener('click', () => applyLang(b.dataset.lang));
    });

    // calendar
    $('#btn-calendar').addEventListener('click', buildICS);

    // setup pieces
    setupIntro();
    spawnAmbient();
    setupCursor();
    setupProgress();
    setupMarquee();
    setupNamesParallax();
    setup2gisLinks();
    setupMusic();
    setupRsvp();
    setupWishesToggle();
    setupReveal();

    // apply language + initial render
    applyLang(lang);

    // countdown
    tickCountdown();
    setInterval(tickCountdown, 1000);

    // wishes
    loadWishes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
