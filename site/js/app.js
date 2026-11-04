(function () {
  var T = {
    en: {
      tag: 'Bronze Director', bigword: 'BEAUTY', badgeB: "Let's Talk", ring: "TAP ME • LET'S TALK • TAP ME • LET'S TALK •",
      role: 'Farmasi Bronze Director',
      shopT: 'Shop My Favorites', shopS: 'Makeup, skincare and fragrance I actually use.',
      whyT: 'Why My Team', whyS: 'Nobody starts alone here.',
      callT: "Let's Talk for 15 Minutes", callS: 'Free call, no strings attached.',
      evT: 'My Next Event', evS: 'Save your spot at my next opportunity night.', evAt: 'at', evSoon: 'New date coming soon. Tap to stay in the loop.',
      hubT: 'Team Hub', hubS: 'For my team only: training and links.',
      spotH: 'Team spotlight', save: 'Save Contact', call: 'Call', text: 'Text', email: 'Email',
      shareH: 'Share my card', shareS: 'Tap the code to show it full screen.', share: 'Send link',
      qrScan: 'Scan with your camera to save my card', qrDone: 'Done',
      ref: 'Get your own vCard', refSms: 'or send a text', crafted: 'Crafted by',
      copied: 'Link copied. Paste it anywhere.', copyFail: 'Copy this link: '
    },
    es: {
      tag: 'Directora Bronze', bigword: 'BELLEZA', badgeB: 'Hablemos', ring: 'TÓCAME • HABLEMOS • TÓCAME • HABLEMOS •',
      role: 'Directora Bronze Farmasi',
      shopT: 'Compra Mis Favoritos', shopS: 'Maquillaje, piel y fragancias que de verdad uso.',
      whyT: 'Por Qué Mi Equipo', whyS: 'Aquí nadie empieza sola.',
      callT: 'Hablemos 15 Minutos', callS: 'Llamada gratis, sin compromiso.',
      evT: 'Mi Próximo Evento', evS: 'Guarda tu lugar en mi próxima noche de oportunidad.', evAt: 'a las', evSoon: 'Pronto anuncio la nueva fecha. Toca para enterarte.',
      hubT: 'Team Hub', hubS: 'Solo para mi equipo: entrenamientos y enlaces.',
      spotH: 'Logros del equipo', save: 'Guardar Contacto', call: 'Llamar', text: 'Texto', email: 'Correo',
      shareH: 'Comparte mi tarjeta', shareS: 'Toca el código para verlo en pantalla completa.', share: 'Enviar enlace',
      qrScan: 'Escanea con la cámara para guardar mi tarjeta', qrDone: 'Listo',
      ref: 'Obtén tu propia vCard', refSms: 'o envía un texto', crafted: 'Hecho por',
      copied: 'Enlace copiado. Pégalo donde quieras.', copyFail: 'Copia este enlace: '
    }
  };
  var CARD_URL = 'https://mayra.okunami.pro/';

  // ---------- language (Spanish first; the visitor's choice is shared with the inner pages) ----------
  var lang = 'es';
  try { lang = localStorage.getItem('card-lang') || 'es'; } catch (e) {}
  if (!T[lang]) lang = 'es';
  function apply(l) {
    lang = l;
    document.documentElement.lang = l;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (T[l][k]) el.textContent = T[l][k];
    });
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === l ? 'true' : 'false');
    });
    try { localStorage.setItem('card-lang', l); } catch (e) {}
    renderContent();
  }
  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });

  // ---------- next event and team spotlight (Mayra edits these in her panel) ----------
  var C = null;
  function time(d) {
    var h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function pick(o) { return o ? (o[lang] || o.es || '') : ''; }
  function renderContent() {
    if (!C) return;
    var sub = document.getElementById('eventSub'), ev = C.event, start = ev && ev.start && new Date(ev.start);
    if (sub) {
      if (start && !isNaN(start) && start.getTime() + (ev.minutes || 60) * 60000 > Date.now()) {
        var d = start.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-US', { weekday: 'long', month: 'long', day: 'numeric' });
        sub.textContent = pick(ev.title) + ' · ' + d.charAt(0).toUpperCase() + d.slice(1) + ' ' + T[lang].evAt + ' ' + time(start);
      } else {
        sub.textContent = T[lang].evSoon;
      }
    }
    var list = document.getElementById('spotList'), wrap = document.getElementById('spot');
    if (!list || !wrap) return;
    list.innerHTML = '';
    (C.spotlight || []).filter(function (x) { return x && x.name; }).forEach(function (x) {
      var li = document.createElement('li'), av = document.createElement('span'), nm = document.createElement('b'), rk = document.createElement('span');
      av.className = 'spot-av';
      av.textContent = x.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
      nm.textContent = x.name; rk.textContent = x[lang] || x.es || '';
      li.appendChild(av); li.appendChild(nm); li.appendChild(rk); list.appendChild(li);
    });
    wrap.hidden = !list.children.length;
  }
  fetch('/api/content', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw r; return r.json(); })
    .catch(function () { return fetch('data/content.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }); })
    .then(function (c) { C = c; renderContent(); }).catch(function () {});
  apply(lang);

  // ---------- soft tap sound (always on) ----------
  var ctx;
  document.addEventListener('pointerdown', function (e) {
    if (!e.target.closest('a, button')) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = 'sine';
      o.frequency.setValueAtTime(880, t);
      o.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.2);
    } catch (err) {}
  });

  // ---------- remember where a visitor came from (?src=flyer) so call requests and RSVPs show it ----------
  try {
    var src = new URLSearchParams(location.search).get('src');
    if (src) sessionStorage.setItem('card-src', src);
  } catch (e) {}

  // ---------- Mayra's private button ----------
  // A phone counts as Mayra's once she opens the card with ?equipo=abrir or signs in to /equipo with her PIN.
  // On her phone only, holding her name (or tapping it 5 times) shows "Mi panel" for 10 seconds. The PIN is the real lock.
  (function () {
    var KEY = 'card-owner', owner = false;
    try {
      var q = new URLSearchParams(location.search);
      if (q.get('equipo') === 'abrir') {
        localStorage.setItem(KEY, '1');
        q.delete('equipo');
        history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
      }
      owner = localStorage.getItem(KEY) === '1';
    } catch (e) {}
    if (!owner) return;
    var name = document.querySelector('.cover-name h1'), pill = document.getElementById('ownerPill');
    if (!name || !pill) return;
    var hold = null, hide, taps = [];
    function show() { pill.hidden = false; clearTimeout(hide); hide = setTimeout(function () { pill.hidden = true; }, 10000); }
    function start() { clearTimeout(hold); hold = setTimeout(show, 700); }
    function stop() { clearTimeout(hold); }
    function tap() {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < 2000; });
      taps.push(now);
      if (taps.length >= 5) { taps = []; show(); }
    }
    name.addEventListener('touchstart', start, { passive: true });
    name.addEventListener('touchend', function () { stop(); tap(); });
    name.addEventListener('touchmove', stop, { passive: true });
    name.addEventListener('touchcancel', stop);
    name.addEventListener('mousedown', start);
    name.addEventListener('mouseup', function () { stop(); tap(); });
    name.addEventListener('mouseleave', stop);
    name.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  })();

  // ---------- full-screen QR ----------
  var full = document.getElementById('qrfull'), lastFocus = null;
  function openQR() { lastFocus = document.activeElement; full.hidden = false; document.body.style.overflow = 'hidden'; document.getElementById('qrDone').focus(); }
  function closeQR() { full.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  document.getElementById('qrOpen').addEventListener('click', openQR);
  document.getElementById('qrClose').addEventListener('click', closeQR);
  document.getElementById('qrDone').addEventListener('click', closeQR);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !full.hidden) closeQR(); });

  // ---------- share with fallback ----------
  var toast = document.getElementById('toast');
  function say(msg) {
    toast.textContent = msg; toast.hidden = false;
    clearTimeout(say.t); say.t = setTimeout(function () { toast.hidden = true; }, 4000);
  }
  function copy(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { say(T[lang].copied); }, function () { say(T[lang].copyFail + url); });
    } else {
      say(T[lang].copyFail + url);
    }
  }
  document.getElementById('shareBtn').addEventListener('click', function () {
    var data = { title: 'Mayra Soto Burgos', text: 'Mayra Soto Burgos | ' + T[lang].role, url: CARD_URL };
    if (navigator.share) {
      navigator.share(data).catch(function (err) { if (err && err.name === 'AbortError') return; copy(CARD_URL); });
    } else {
      copy(CARD_URL);
    }
  });
})();
