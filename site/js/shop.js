/* Search Mayra's Farmasi store from her card. Results come from /api/catalog (a copy of her store, refreshed hourly).
   Every product opens in her own Farmasi store, so the sale is hers. */
(function () {
  var STORE = 'https://www.farmasius.com/mayrasotoburgos';
  // Bienestar chip: health products (weight loss first), and its "see all" opens her Weight Control page
  var WELL = 'https://www.farmasius.com/mayrasotoburgos/product-list/weight-control?cid=19c9e693-aa3d-f111-8519-02f716a02c8f';
  var T = {
    es: { h: 'Busca en mi tienda', ph: 'Ej. piel seca, bienestar, perfume, labial', btn: 'Buscar', loading: 'Buscando...',
      none: 'No encontré eso. Mira toda mi tienda:', all: 'Ver toda mi tienda', allWell: 'Ver productos de control de peso', fail: 'No pude buscar ahora. Mira mi tienda:', count: '{n} productos',
      chips: [['piel', 'Cuidado de piel'], ['maquillaje', 'Maquillaje'], ['bienestar peso', 'Bienestar', WELL], ['perfume', 'Perfumes'], ['peso', 'Control de peso'], ['cabello', 'Cabello']] },
    en: { h: 'Search my store', ph: 'E.g. dry skin, wellness, perfume, lipstick', btn: 'Search', loading: 'Searching...',
      none: 'I could not find that. See my whole store:', all: 'See my whole store', allWell: 'See weight control products', fail: 'Search is not available right now. See my store:', count: '{n} products',
      chips: [['skin', 'Skin care'], ['makeup', 'Makeup'], ['wellness weight', 'Wellness', WELL], ['perfume', 'Perfumes'], ['weight', 'Weight control'], ['hair', 'Hair']] }
  };
  var sec = document.getElementById('shop'); if (!sec) return;
  var form = document.getElementById('shopF'), input = document.getElementById('shopQ'), list = document.getElementById('shopList'),
      msg = document.getElementById('shopMsg'), chips = document.getElementById('shopChips'), last = '', seq = 0;
  function L() { return T[document.documentElement.lang === 'en' ? 'en' : 'es']; }
  function money(n) { return '$' + Number(n).toFixed(2); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function say(text, withLink) {
    msg.innerHTML = ''; msg.hidden = !text; if (!text) return;
    msg.appendChild(document.createTextNode(text + ' '));
    if (withLink) { var a = el('a', null, L().all); a.href = STORE; a.target = '_blank'; a.rel = 'noopener'; msg.appendChild(a); }
  }
  function card(p) {
    var li = el('li'), a = el('a', 'prod'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
    var ph = el('span', 'prod-ph');
    if (p.img) { var im = new Image(); im.src = p.img; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; ph.appendChild(im); }
    a.appendChild(ph); a.appendChild(el('b', null, p.name));
    var pr = el('span', 'prod-pr');
    if (p.promo) { pr.appendChild(el('s', null, money(p.price))); pr.appendChild(document.createTextNode(' ' + money(p.promo))); }
    else if (p.price) pr.textContent = money(p.price);
    a.appendChild(pr); li.appendChild(a); return li;
  }
  function run(q, chip) {
    q = String(q || '').trim(); last = q; list.innerHTML = '';
    if (!q) { say(''); return; }
    var me = ++seq; say(L().loading);
    fetch('/api/catalog?q=' + encodeURIComponent(q) + (chip && chip[2] ? '&n=24' : '')).then(function (r) { if (!r.ok) throw r; return r.json(); })
      .then(function (d) {
        if (me !== seq) return;
        var ps = (d && d.products) || [];
        if (!ps.length) { say(L().none, true); return; }
        say(''); ps.forEach(function (p) { list.appendChild(card(p)); });
        var more = el('li', 'prod-more'), a = el('a', null, chip && chip[2] ? L().allWell : L().all); a.href = chip && chip[2] ? chip[2] : STORE; a.target = '_blank'; a.rel = 'noopener'; more.appendChild(a); list.appendChild(more);
      })
      .catch(function () { if (me === seq) say(L().fail, true); });
  }
  function paint() {
    var t = L();
    document.getElementById('shopH').textContent = t.h; input.placeholder = t.ph;
    document.getElementById('shopBtn').setAttribute('aria-label', t.btn);
    chips.innerHTML = '';
    t.chips.forEach(function (c) { var b = el('button', 'shop-chip', c[1]); b.type = 'button'; b.addEventListener('click', function () { input.value = c[1]; run(c[0], c); }); chips.appendChild(b); });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); input.blur(); run(input.value); });
  document.querySelectorAll('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { setTimeout(function () { paint(); if (msg.textContent && !list.children.length && last) run(last); }, 0); }); });
  paint();
})();
