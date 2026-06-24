// ============================================================================
// Айман · Қыз ұзату · 主逻辑
// 6 张 slide 横向滑动 + 5 重引导 + 音乐 + RSVP
// ============================================================================
(() => {
  'use strict';

  const CFG = window.WEDDING_CONFIG;
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  let hintHidden = false;

  // ─── 滑动 dots 同步 ───────────────────────────────────
  function setupDots() {
    const slides = $('#slides');
    const dots   = $$('.dot');
    if (!slides || !dots.length) return;

    let scrollTimer;
    slides.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const idx = Math.round(slides.scrollLeft / slides.clientWidth);
        dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
        if (idx > 0) hideSwipeHint();
      }, 60);
    }, { passive: true });

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = Number(dot.dataset.goto || 0);
        slides.scrollTo({ left: idx * slides.clientWidth, behavior: 'smooth' });
        hideSwipeHint();
      });
    });
  }

  // ─── 左右边缘点击导航（手机额外保险）─────────────────
  function setupEdgeTaps() {
    const slides = $('#slides');
    const prev   = $('#tap-prev');
    const next   = $('#tap-next');
    if (!slides) return;
    if (prev) prev.addEventListener('click', () => {
      slides.scrollBy({ left: -slides.clientWidth, behavior: 'smooth' });
    });
    if (next) next.addEventListener('click', () => {
      slides.scrollBy({ left: slides.clientWidth, behavior: 'smooth' });
      hideSwipeHint();
    });
  }

  // ─── 滑动提示淡出 ────────────────────────────────────
  function hideSwipeHint() {
    if (hintHidden) return;
    hintHidden = true;
    const hint = $('#swipe-hint');
    if (hint) hint.classList.add('is-hidden');
  }

  // ─── 首次访问 demo wobble ────────────────────────────
  // 让页面自己往右滚一段再回来，用手指告诉用户"是这样滑"
  function setupDemoWobble() {
    if (sessionStorage.getItem('swipeDemoSeen')) return;
    if (window.matchMedia('(min-width: 768px)').matches) return;  // 桌面不演示

    sessionStorage.setItem('swipeDemoSeen', '1');
    const slides = $('#slides');
    if (!slides) return;
    setTimeout(() => {
      slides.scrollTo({ left: 50, behavior: 'smooth' });
      setTimeout(() => slides.scrollTo({ left: 0, behavior: 'smooth' }), 700);
    }, 1400);
  }

  // ─── 2GIS 链接 ───────────────────────────────────────
  function setup2gisLink() {
    const btn = $('#btn-2gis');
    if (!btn || !CFG.venue) return;
    if (CFG.venue.gis2) btn.href = CFG.venue.gis2;
  }

  // ─── 音乐 · 尽量自动播放 + 首次交互响起 ────────────
  function setupMusic() {
    const audio = $('#bg-audio');
    const btn   = $('#music-btn');
    if (!CFG.music || !audio || !btn) { if (btn) btn.hidden = true; return; }
    audio.src = CFG.music;
    audio.preload = 'none';   // 不自动下载音乐，点播放/首次交互时才取 → 省流量

    fetch(CFG.music, { method: 'HEAD' }).catch(() => {}).then((r) => {
      if (!r || !r.ok) btn.hidden = true;
    });

    let userPaused = false;

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
      }).catch(() => { /* 浏览器拦 — 等下次交互 */ });
    }

    startMusic();

    const kick = () => startMusic();
    ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll'].forEach((ev) => {
      window.addEventListener(ev, kick, { once: true, passive: true });
    });

    btn.addEventListener('click', () => {
      if (audio.paused) {
        userPaused = false;
        audio.play().then(() => { btn.classList.add('is-playing'); fadeIn(); }).catch(() => {});
      } else {
        userPaused = true;
        audio.pause();
        btn.classList.remove('is-playing');
      }
    });
  }

  // ─── RSVP 表单 · no-cors 提交到 Google Apps Script ─
  function setupRsvp() {
    const form = $('#rsvp-form');
    if (!form) return;
    const countField = $('#count-field');
    const statusEl   = $('#rsvp-status');

    if (countField) countField.hidden = false;   // 默认显示「几人到场」

    form.addEventListener('change', (e) => {
      if (e.target.name === 'attending' && countField) {
        // 仅在明确选「不能来」时隐藏人数；其余始终显示
        countField.hidden = e.target.value === 'no';
      }
    });

    $$('.count-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const input = $('input[name="count"]', form);
        const step  = Number(b.dataset.step) || 0;
        const next  = Math.max(1, Math.min(20, Number(input.value || 1) + step));
        input.value = next;
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {
        type: 'rsvp',
        name:      (fd.get('name')    || '').toString().trim(),
        attending:  fd.get('attending'),
        count:     Number(fd.get('count') || 1),
        message:   (fd.get('message') || '').toString().trim(),
        lang:      'kk',
        ts:        new Date().toISOString(),
      };
      if (!payload.name || !payload.attending) {
        statusEl.textContent = 'Атыңыз бен қатысуыңызды толтырыңыз';
        statusEl.className   = 'rsvp-status is-error';
        return;
      }
      const submitBtn = $('#btn-submit');
      submitBtn.disabled = true;
      statusEl.className = 'rsvp-status';
      statusEl.textContent = 'Жіберілуде…';

      const ok = await sendToSheet(payload);
      saveLocal('rsvp', payload);

      if (ok) {
        form.classList.add('is-submitted');
        const msg = payload.attending === 'yes'
          ? 'Рахмет! Сіздерді күтеміз.'
          : 'Рахмет, түсіндік. Тілегіңіз бізге жетті.';
        statusEl.className = 'rsvp-status is-ok';
        statusEl.textContent = msg + (ok === 'demo' ? ' (демо режим)' : '');
        if (payload.message) setTimeout(loadWishes, 1200);  // 留言后刷新祝福墙
      } else {
        submitBtn.disabled = false;
        statusEl.className = 'rsvp-status is-error';
        statusEl.textContent = 'Өкінішке орай қате кетті. Қайта жіберіп көріңіз.';
      }
    });
  }

  async function sendToSheet(payload) {
    if (!CFG.rsvpEndpoint) return 'demo';
    try {
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

  // ─── 宾客祝福墙 · JSONP 读取（绕过 Apps Script 的 CORS）────
  function localWishes() {
    const arr = JSON.parse(localStorage.getItem('wed.rsvp') || '[]');
    return arr.filter((r) => r.message).map((r) => ({ name: r.name, message: r.message }));
  }

  function renderWishes(wishes) {
    const list = $('#wishes-list');
    if (!list || !wishes || !wishes.length) return;
    list.innerHTML = '';
    wishes.slice(-40).reverse().forEach((w) => {
      const li = document.createElement('li');
      const n = document.createElement('span');
      n.className = 'wish-name'; n.textContent = w.name || '—';
      const m = document.createElement('span');
      m.className = 'wish-text'; m.textContent = w.message || '';
      li.append(n, m);
      list.appendChild(li);
    });
  }

  function loadWishes() {
    if (!$('#wishes-list')) return;
    const local = localWishes();
    if (!CFG.rsvpEndpoint) { renderWishes(local); return; }

    const cb = 'aimanWishes' + Date.now();
    let done = false;
    window[cb] = (data) => {
      done = true;
      const remote = Array.isArray(data) ? data : [];
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
    setTimeout(() => { if (!done) renderWishes(local); }, 6000);
  }

  // ─── init ────────────────────────────────────────────
  function init() {
    setupDots();
    setupEdgeTaps();
    setup2gisLink();
    setupMusic();
    setupRsvp();
    setupDemoWobble();
    loadWishes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
