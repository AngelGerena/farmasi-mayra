(function () {
  var T = {
    en: {
      issue: 'The Beauty Issue', s1: 'Now', s2: 'Hiring', s3: 'beauty bosses',
      b1: 'BEAU', b2: 'TY.', st1: 'Shop & Glow!', st3: 'Join the team',
      ring: 'TAP ME • JOIN MY TEAM • TAP ME • JOIN MY TEAM •',
      role: 'Farmasi Beauty Director', inside: 'In this issue',
      shopT: 'Shop My Farmasi Picks', shopS: 'Makeup, skincare and fragrance I actually use. Tap to shop.',
      joinT: 'Join My Beauty Team', joinS: 'Become a Farmasi influencer and build your own beauty business with me.',
      whyT: 'Why My Team', whyS: 'How I train and support everyone who starts with me. Nobody starts alone.',
      callT: "Let's Talk for 15 Minutes", callS: 'Curious about Farmasi? Book a free call and ask me anything.',
      evT: 'My Next Event', evS: 'Save your spot at my next opportunity night.', evAt: 'at', evSoon: 'New date coming soon. Tap to stay in the loop.',
      hubT: 'Team Hub', hubS: 'Already on my team? Training, calendar and links, all in one place.',
      spotH: 'Team spotlight', crafted: 'Crafted by',
      call: 'Call', email: 'Email', save: 'Save Contact', share: 'Share my card',
      ref: 'Get your own vCard', copied: 'Link copied. Paste it anywhere.', copyFail: 'Copy this link: '
    },
    es: {
      issue: 'Edición Belleza', s1: 'Únete', s2: 'Ahora', s3: 'a mi equipo',
      b1: 'BELLE', b2: 'ZA.', st1: '¡Compra y Brilla!', st3: 'Únete al equipo',
      ring: 'TÓCAME • ÚNETE A MI EQUIPO • TÓCAME •',
      role: 'Directora de Belleza Farmasi', inside: 'En esta edición',
      shopT: 'Compra Mis Favoritos de Farmasi', shopS: 'Maquillaje, cuidado de la piel y fragancias que de verdad uso. Toca para comprar.',
      joinT: 'Únete a Mi Equipo de Belleza', joinS: 'Conviértete en influencer de Farmasi y crea tu propio negocio de belleza conmigo.',
      whyT: 'Por Qué Mi Equipo', whyS: 'Cómo entreno y apoyo a cada persona que empieza conmigo. Aquí nadie empieza sola.',
      callT: 'Hablemos 15 Minutos', callS: '¿Te da curiosidad Farmasi? Pide una llamada gratis y pregúntame lo que quieras.',
      evT: 'Mi Próximo Evento', evS: 'Guarda tu lugar en mi próxima noche de oportunidad.', evAt: 'a las', evSoon: 'Pronto anuncio la nueva fecha. Toca para enterarte.',
      hubT: 'Team Hub', hubS: '¿Ya eres de mi equipo? Entrenamientos, calendario y enlaces, todo en un solo lugar.',
      spotH: 'Logros del equipo', crafted: 'Hecho por',
      call: 'Llamar', email: 'Correo', save: 'Guardar Contacto', share: 'Compartir mi tarjeta',
      ref: 'Obtén tu propia vCard', copied: 'Enlace copiado. Pégalo donde quieras.', copyFail: 'Copia este enlace: '
    }
  };
  // Spanish by default; a visitor's own EN/ES choice is remembered on their phone
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

  // Next event date and team spotlight come from data/content.json, so they can change without touching the page
  var C = null;
  function time(d) {
    var h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function renderContent() {
    if (!C) return;
    var sub = document.getElementById('eventSub'), ev = C.event, start = ev && new Date(ev.start);
    if (sub) {
      if (start && !isNaN(start) && start.getTime() + (ev.minutes || 60) * 60000 > Date.now()) {
        var d = start.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-US', { weekday: 'long', month: 'long', day: 'numeric' });
        sub.textContent = ev.title[lang] + ' \u00b7 ' + d.charAt(0).toUpperCase() + d.slice(1) + ' ' + T[lang].evAt + ' ' + time(start);
      } else {
        sub.textContent = T[lang].evSoon;
      }
    }
    var list = document.getElementById('spotList'), wrap = document.getElementById('spot');
    if (list && wrap && C.spotlight && C.spotlight.length) {
      list.innerHTML = '';
      C.spotlight.forEach(function (x) {
        var li = document.createElement('li'), av = document.createElement('span'), nm = document.createElement('b'), rk = document.createElement('span');
        av.className = 'spot-av';
        av.textContent = x.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2);
        nm.textContent = x.name; rk.textContent = x[lang] || x.es;
        li.appendChild(av); li.appendChild(nm); li.appendChild(rk); list.appendChild(li);
      });
      wrap.hidden = false;
    }
  }
  fetch('data/content.json', { cache: 'no-cache' }).then(function (r) { return r.json(); })
    .then(function (c) { C = c; renderContent(); }).catch(function () {});
  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });
  apply(lang);

  // Soft tap sound (always on)
  var ctx;
  function tick() {
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
    } catch (e) {}
  }
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a, button')) tick();
  });

  // Remember a source code (?src=flyer) for this visit so call requests and RSVPs show where they came from
  try {
    var src = new URLSearchParams(location.search).get('src');
    if (src) sessionStorage.setItem('card-src', src);
  } catch (e) {}

  // Mayra's private "Mis leads" button. A phone counts as Mayra's once she opens the card with ?equipo=abrir
  // or signs in to /equipo with her PIN. On her phone only, holding her name (or tapping it 5 times quickly)
  // shows the button for 10 seconds. The team page itself is protected by her PIN; this only keeps the button out of sight.
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
    function show() {
      pill.hidden = false;
      clearTimeout(hide);
      hide = setTimeout(function () { pill.hidden = true; }, 10000);
    }
    function start() { clearTimeout(hold); hold = setTimeout(show, 700); }
    function stop() { clearTimeout(hold); }
    function tap() {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < 2000; });
      taps.push(now);
      if (taps.length >= 5) { taps = []; show(); }
    }
    // Touch events for phones (iOS cancels pointer events during a long press), mouse for computers
    name.addEventListener('touchstart', start, { passive: true });
    name.addEventListener('touchend', function () { stop(); tap(); });
    name.addEventListener('touchmove', stop, { passive: true });
    name.addEventListener('touchcancel', stop);
    name.addEventListener('mousedown', start);
    name.addEventListener('mouseup', function () { stop(); tap(); });
    name.addEventListener('mouseleave', stop);
    name.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  })();

  // Share with fallback
  var toast = document.getElementById('toast');
  function say(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(say.t);
    say.t = setTimeout(function () { toast.hidden = true; }, 4000);
  }
  document.getElementById('shareBtn').addEventListener('click', function () {
    var url = location.href.split('#')[0];
    var data = { title: 'Mayra Soto Burgos', text: 'Mayra Soto Burgos | Farmasi Beauty Director', url: url };
    if (navigator.share) {
      navigator.share(data).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        copy(url);
      });
    } else {
      copy(url);
    }
  });
  function copy(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { say(T[lang].copied); }, function () { say(T[lang].copyFail + url); });
    } else {
      say(T[lang].copyFail + url);
    }
  }
})();
