// Mayra's card editor (tab "Tarjeta" on her PIN page). Loads /api/content?scope=owner with her session,
// lets her edit the event, spotlight, story, Team Hub and team code, and saves back to Netlify Blobs.
(function () {
  var root = document.getElementById('editor');
  if (!root) return;
  var TOKEN = 'card-equipo-token';
  function token() { try { return localStorage.getItem(TOKEN) || ''; } catch (e) { return ''; } }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var toastT;
  function toast(msg) { var t = $('toast'); if (!t) return; t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2800); }
  function api(method, body, q) {
    var opts = { method: method, headers: { 'Authorization': 'Bearer ' + token() } };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch('/api/content' + (q || ''), opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw { code: r.status, error: d.error }; return d; });
    });
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function get(o, path) { return path.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function set(o, path, v) {
    var ks = path.split('.'), last = ks.pop(), cur = o;
    ks.forEach(function (k, i) { if (cur[k] == null) cur[k] = /^\d+$/.test(ks[i + 1] || last) ? [] : {}; cur = cur[k]; });
    cur[last] = v;
  }

  // ---------- field schemas (Spanish required, English optional) ----------
  var LISTS = {
    spotlight: { doc: 'public', path: 'spotlight', title: 'Logros del equipo', add: '+ Agregar persona',
      note: 'Salen en tu tarjeta como reconocimientos. Solo nombre y logro, sin cantidades de dinero.',
      fields: [{ k: 'name', l: 'Nombre (ej. Carmen R.)' }, { k: 'es', l: 'Logro (ej. Nueva Manager)' }, { k: 'en', l: 'Logro en inglés', en: true }] },
    promises: { doc: 'public', path: 'promises', title: 'Lo que le das a tu equipo', add: '+ Agregar punto',
      fields: [{ k: 'es.0', l: 'Título' }, { k: 'es.1', l: 'Descripción', area: true }, { k: 'en.0', l: 'Title', en: true }, { k: 'en.1', l: 'Description', en: true, area: true }] },
    plan: { doc: 'public', path: 'plan', title: 'Primeros 30 días', add: '+ Agregar paso',
      fields: [{ k: 'es.0', l: 'Cuándo (ej. Semana 1)' }, { k: 'es.1', l: 'Qué pasa', area: true }, { k: 'en.0', l: 'When', en: true }, { k: 'en.1', l: 'What happens', en: true, area: true }] },
    checklist: { doc: 'hub', path: 'checklist', title: 'Team Hub: primera semana', add: '+ Agregar tarea',
      fields: [{ k: 'es', l: 'Tarea' }, { k: 'en', l: 'Task', en: true }] },
    schedule: { doc: 'hub', path: 'schedule', title: 'Team Hub: calendario', add: '+ Agregar reunión',
      note: 'Escribe la hora con AM o PM, por ejemplo: Lunes · 8:00 PM',
      fields: [{ k: 'es.0', l: 'Reunión' }, { k: 'es.1', l: 'Día y hora' }, { k: 'en.0', l: 'Meeting', en: true }, { k: 'en.1', l: 'Day and time', en: true }] },
    links: { doc: 'hub', path: 'links', title: 'Team Hub: enlaces', add: '+ Agregar enlace',
      fields: [{ k: 'es', l: 'Nombre del enlace' }, { k: 'url', l: 'Enlace (https://...)', type: 'url' }, { k: 'en', l: 'Link name', en: true }] },
    promos: { doc: 'hub', path: 'promos', title: 'Team Hub: este mes', add: '+ Agregar aviso',
      fields: [{ k: 'es.0', l: 'Título' }, { k: 'es.1', l: 'Texto', area: true }, { k: 'en.0', l: 'Title', en: true }, { k: 'en.1', l: 'Text', en: true, area: true }] },
    team: { doc: 'hub', path: 'team', title: 'Team Hub: directorio del equipo', add: '+ Agregar persona',
      note: 'Solo lo ve tu equipo después de poner el código.',
      fields: [{ k: 'name', l: 'Nombre' }, { k: 'phone', l: 'WhatsApp (10 dígitos)', type: 'tel' }, { k: 'es', l: 'Rango (ej. Manager)' }, { k: 'en', l: 'Rank', en: true }] }
  };

  var DATA = null;

  function input(labelText, value, opts) {
    opts = opts || {};
    var lab = el('label', 'ef' + (opts.en ? ' en' : '') + (opts.full ? ' full' : ''));
    lab.appendChild(el('span', null, labelText));
    var i = opts.area ? el('textarea') : el('input');
    if (!opts.area) i.type = opts.type || 'text';
    i.value = value == null ? '' : value;
    if (opts.area) i.rows = opts.rows || 3;
    lab.appendChild(i);
    return { label: lab, input: i };
  }

  function section(title, open) {
    var d = el('details', 'esec'); if (open) d.open = true;
    d.appendChild(el('summary', null, title));
    var body = el('div', 'ebody'); d.appendChild(body);
    root.appendChild(d);
    return body;
  }

  // English falls back to Spanish so English visitors never see an empty line
  function fillEnglish(obj) {
    if (Array.isArray(obj)) { obj.forEach(fillEnglish); return obj; }
    if (obj && typeof obj === 'object') {
      if ('es' in obj && 'en' in obj) {
        if (Array.isArray(obj.es)) obj.en = obj.es.map(function (v, i) { return (obj.en && obj.en[i]) || v; });
        else if (!obj.en) obj.en = obj.es;
      }
      Object.keys(obj).forEach(function (k) { if (k !== 'es' && k !== 'en') fillEnglish(obj[k]); });
    }
    return obj;
  }

  // ---------- list editor ----------
  function listEditor(body, key) {
    var cfg = LISTS[key];
    if (cfg.note) body.appendChild(el('p', 'enote', cfg.note));
    var wrap = el('div', 'elist'); body.appendChild(wrap);
    function render() {
      wrap.innerHTML = '';
      var arr = get(DATA[cfg.doc], cfg.path) || [];
      arr.forEach(function (item, idx) {
        var card = el('div', 'eitem');
        cfg.fields.forEach(function (f) {
          var x = input(f.l, get(item, f.k), { en: f.en, area: f.area, type: f.type });
          x.input.addEventListener('input', function () { set(item, f.k, x.input.value); });
          card.appendChild(x.label);
        });
        var row = el('div', 'erow');
        var up = el('button', 'btn line', 'Subir'); up.type = 'button'; up.disabled = idx === 0;
        up.addEventListener('click', function () { arr.splice(idx - 1, 0, arr.splice(idx, 1)[0]); render(); });
        var del = el('button', 'del', 'Quitar'); del.type = 'button';
        del.addEventListener('click', function () {
          if (del.dataset.confirm) { arr.splice(idx, 1); render(); }
          else { del.dataset.confirm = '1'; del.textContent = 'Toca otra vez para quitar'; }
        });
        row.appendChild(up); row.appendChild(del); card.appendChild(row);
        wrap.appendChild(card);
      });
    }
    var add = el('button', 'btn soft', cfg.add); add.type = 'button';
    add.addEventListener('click', function () {
      var arr = get(DATA[cfg.doc], cfg.path); if (!arr) { arr = []; set(DATA[cfg.doc], cfg.path, arr); }
      var blank = {};
      cfg.fields.forEach(function (f) { set(blank, f.k, ''); });
      if (key === 'checklist') blank.id = 't' + Date.now().toString(36);
      arr.push(blank); render();
      var last = wrap.lastElementChild; if (last) { var f = last.querySelector('input,textarea'); if (f) f.focus(); }
    });
    body.appendChild(add);
    render();
  }

  // ---------- event editor ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function eventEditor(body) {
    var ev = DATA.public.event || (DATA.public.event = { title: {}, where: {}, about: {}, minutes: 60 });
    ['title', 'where', 'about'].forEach(function (k) { if (!ev[k]) ev[k] = {}; });
    var d = ev.start ? new Date(ev.start) : null;
    var grid = el('div', 'egrid'); body.appendChild(grid);
    function bind(labelText, path, opts) {
      var x = input(labelText, get(ev, path), opts);
      x.input.addEventListener('input', function () { set(ev, path, x.input.value); });
      grid.appendChild(x.label); return x.input;
    }
    bind('Nombre del evento', 'title.es', { full: true });
    var date = input('Fecha', d && !isNaN(d) ? d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) : '', { type: 'date' });
    var time = input('Hora', d && !isNaN(d) ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : '', { type: 'time' });
    grid.appendChild(date.label); grid.appendChild(time.label);
    var mins = input('Duración (minutos)', ev.minutes || 60, { type: 'number' });
    grid.appendChild(mins.label);
    var preview = el('p', 'enote full'); grid.appendChild(preview);
    function updateStart() {
      if (date.input.value && time.input.value) {
        var s = new Date(date.input.value + 'T' + time.input.value);
        if (!isNaN(s)) {
          ev.start = s.toISOString();
          var h = s.getHours(), m = s.getMinutes();
          preview.textContent = 'Sale en tu tarjeta: ' + s.toLocaleDateString('es-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' a las ' + (h % 12 || 12) + ':' + pad(m) + ' ' + (h >= 12 ? 'PM' : 'AM');
          return;
        }
      }
      preview.textContent = 'Si no pones fecha, tu tarjeta dice "Pronto anuncio la nueva fecha".';
      if (!date.input.value) ev.start = '';
    }
    date.input.addEventListener('input', updateStart); time.input.addEventListener('input', updateStart);
    mins.input.addEventListener('input', function () { ev.minutes = Math.max(15, Math.min(600, parseInt(mins.input.value, 10) || 60)); });
    updateStart();
    bind('Dónde (ej. En línea por Zoom)', 'where.es', { full: true });
    bind('Descripción', 'about.es', { full: true, area: true });
    bind('Event name', 'title.en', { full: true, en: true });
    bind('Where', 'where.en', { full: true, en: true });
    bind('Description', 'about.en', { full: true, en: true, area: true });
  }

  // ---------- story editor (paragraphs separated by a blank line) ----------
  function storyEditor(body) {
    var st = DATA.public.story || (DATA.public.story = { es: [], en: [] });
    body.appendChild(el('p', 'enote', 'Sale en "Por qué mi equipo". Separa los párrafos con una línea en blanco.'));
    ['es', 'en'].forEach(function (lg) {
      var x = input(lg === 'es' ? 'Tu historia' : 'Your story', (st[lg] || []).join('\n\n'), { area: true, rows: 7, en: lg === 'en', full: true });
      x.input.addEventListener('input', function () {
        st[lg] = x.input.value.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
      });
      body.appendChild(x.label);
    });
  }

  function welcomeEditor(body) {
    var w = DATA.hub.welcome || (DATA.hub.welcome = { es: '', en: '' });
    [['es', 'Mensaje de bienvenida'], ['en', 'Welcome message']].forEach(function (p) {
      var x = input(p[1], w[p[0]], { area: true, en: p[0] === 'en', full: true });
      x.input.addEventListener('input', function () { w[p[0]] = x.input.value; });
      body.appendChild(x.label);
    });
  }

  // ---------- save / restore bars ----------
  function saveBar(which, label) {
    var bar = el('div', 'esave');
    var save = el('button', 'btn coral', label); save.type = 'button';
    var undo = el('button', 'btn line', 'Volver a la versión anterior'); undo.type = 'button';
    save.addEventListener('click', function () {
      if (which === 'public' && !valid()) return;
      save.disabled = true;
      var data = fillEnglish(clone(DATA[which]));
      api('PUT', { which: which, data: data }).then(function () {
        toast(which === 'public' ? 'Guardado. Tu tarjeta ya lo muestra.' : 'Guardado. Tu equipo ya lo ve en el Team Hub.');
      }).catch(fail).then(function () { save.disabled = false; });
    });
    undo.addEventListener('click', function () {
      if (!undo.dataset.confirm) { undo.dataset.confirm = '1'; undo.textContent = 'Toca otra vez para confirmar'; return; }
      undo.disabled = true;
      api('POST', { restore: which }).then(function () { toast('Listo, volvió la versión anterior.'); load(); })
        .catch(function (x) { toast(x && x.error === 'nothing_to_restore' ? 'Todavía no hay una versión anterior.' : 'No se pudo. Intenta otra vez.'); undo.disabled = false; });
    });
    bar.appendChild(save); bar.appendChild(undo);
    root.appendChild(bar);
  }
  function valid() {
    var bad = (DATA.public.spotlight || []).some(function (x) { return (x.es || x.en) && !x.name; });
    if (bad) { toast('A una persona en Logros le falta el nombre.'); return false; }
    return true;
  }
  function fail(x) {
    if (x && x.code === 401) { toast('Tu sesión terminó. Sal y entra con tu PIN otra vez.'); return; }
    toast('No se pudo guardar. Revisa tu conexión e intenta otra vez.');
  }

  function codeEditor(body, current) {
    body.appendChild(el('p', 'enote', 'Es el código que le das a tu equipo para entrar al Team Hub. Cámbialo si alguien sale del equipo. No uses tu número de teléfono.'));
    var x = input('Código del equipo', current, { full: true });
    x.input.autocomplete = 'off'; x.input.spellcheck = false;
    body.appendChild(x.label);
    var b = el('button', 'btn coral', 'Cambiar código'); b.type = 'button';
    b.addEventListener('click', function () {
      var v = x.input.value.trim();
      if (v.length < 4) { toast('El código necesita al menos 4 letras o números.'); return; }
      b.disabled = true;
      api('PUT', { teamCode: v }).then(function () { toast('Código cambiado. Avísale a tu equipo.'); }).catch(fail).then(function () { b.disabled = false; });
    });
    body.appendChild(b);
  }

  function build(d) {
    DATA = { public: d.public, hub: d.hub };
    root.innerHTML = '';
    root.appendChild(el('h2', 'egroup', 'Tu tarjeta'));
    eventEditor(section('Próximo evento', true));
    listEditor(section('Logros del equipo'), 'spotlight');
    storyEditor(section('Tu historia'));
    listEditor(section('Lo que le das a tu equipo'), 'promises');
    listEditor(section('Primeros 30 días'), 'plan');
    saveBar('public', 'Guardar mi tarjeta');
    root.appendChild(el('h2', 'egroup', 'Team Hub'));
    welcomeEditor(section('Mensaje de bienvenida'));
    ['checklist', 'schedule', 'links', 'promos', 'team'].forEach(function (k) { listEditor(section(LISTS[k].title.replace('Team Hub: ', '').replace(/^./, function (c) { return c.toUpperCase(); })), k); });
    saveBar('hub', 'Guardar Team Hub');
    root.appendChild(el('h2', 'egroup', 'Código del equipo'));
    codeEditor(section('Cambiar el código', false), d.teamCode || '');
  }

  var loaded = false;
  function load() {
    root.innerHTML = '<p class="status">Cargando tu contenido...</p>';
    api('GET', null, '?scope=owner').then(function (d) { loaded = true; build(d); })
      .catch(function (x) { root.innerHTML = ''; root.appendChild(el('p', 'status', x && x.code === 401 ? 'Entra con tu PIN para editar tu tarjeta.' : 'No se pudo cargar. Revisa tu conexión y vuelve a abrir esta pestaña.')); });
  }
  // Load when the tab is opened (and right away if it is the remembered tab)
  var tab = $('t-edit');
  if (tab) tab.addEventListener('click', function () { if (!loaded) load(); });
  if (tab && tab.getAttribute('aria-selected') === 'true' && token()) load();
})();
