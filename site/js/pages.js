// Shared helpers for Mayra's inner pages: language (shared with the card), tap sound, content, dates, lead form posting.
(function () {
  var lang = 'es', subs = [];
  try { lang = localStorage.getItem('card-lang') || 'es'; } catch (e) {}
  if (lang !== 'en') lang = 'es';

  function setLang(l) {
    lang = l === 'en' ? 'en' : 'es';
    document.documentElement.lang = lang;
    try { localStorage.setItem('card-lang', lang); } catch (e) {}
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    subs.forEach(function (fn) { fn(lang); });
  }

  // Fill every [data-t] element from a {es:{}, en:{}} dictionary
  function translate(dict) {
    function run(l) {
      document.querySelectorAll('[data-t]').forEach(function (el) {
        var v = dict[l][el.getAttribute('data-t')];
        if (v != null) el.textContent = v;
      });
      document.querySelectorAll('[data-ph]').forEach(function (el) {
        var v = dict[l][el.getAttribute('data-ph')];
        if (v != null) el.setAttribute('placeholder', v);
      });
      if (dict[l].title) document.title = dict[l].title;
    }
    subs.push(run);
  }

  // Times always show as AM/PM, in both languages
  function time(d) {
    var h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function date(d, l, opts) {
    var s = d.toLocaleDateString(l === 'en' ? 'en-US' : 'es-US', opts || { weekday: 'long', month: 'long', day: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  var contentP;
  function content() {
    contentP = contentP || fetch('/data/content.json', { cache: 'no-cache' }).then(function (r) { return r.json(); });
    return contentP;
  }

  // Where this visitor came from (?src=flyer), remembered for the visit
  function src() {
    var s = '';
    try {
      s = new URLSearchParams(location.search).get('src') || sessionStorage.getItem('card-src') || '';
      if (s) sessionStorage.setItem('card-src', s);
    } catch (e) {}
    return String(s).replace(/[^\w-]/g, '').slice(0, 20) || 'direct';
  }

  // Sends a lead to the "quiz-leads" Netlify form; the quiz-intake function puts it on Mayra's leads page
  function postLead(data) {
    var all = Object.assign({ 'form-name': 'quiz-leads', 'bot-field': '', lang: lang, source: src() }, data);
    var body = Object.keys(all).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(all[k] == null ? '' : all[k]); }).join('&');
    return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
      .then(function (r) { if (!r.ok) throw new Error('form ' + r.status); });
  }

  function digits(p) { var d = String(p || '').replace(/\D/g, ''); return d.length === 10 ? '1' + d : d; }

  // Soft tap sound (always on, same as the card)
  var ctx;
  document.addEventListener('pointerdown', function (e) {
    if (!e.target.closest('a, button, label')) return;
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

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });
    src();
    setLang(lang);
  });

  window.MS = {
    lang: function () { return lang; },
    onLang: function (fn) { subs.push(fn); },
    translate: translate, time: time, date: date, content: content, postLead: postLead, digits: digits,
    WA: '17874528141',
    JOIN: 'https://www.farmasius.com/mayrasotoburgos/package-selection',
    STORE: 'https://www.farmasius.com/mayrasotoburgos'
  };
})();
