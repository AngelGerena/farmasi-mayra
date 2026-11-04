/* Lola: the chat assistant on Mayra's card (/api/lola). The button only shows once Lola is switched on.
   Products she finds show as cards that open Mayra's store. WhatsApp and Text buttons reach Mayra with the chat so far. */
(function () {
  var PHONE = '17874528141';
  var T = {
    es: { btn: 'Pregúntale a Lola', title: 'Lola', sub: 'Asistente de Mayra · IA', close: 'Cerrar', ph: 'Escribe tu pregunta', send: 'Enviar',
      hi: '¡Hola! Soy Lola, la asistente de Mayra. Te ayudo con productos y precios de Farmasi, su próximo evento o cómo unirte a su equipo. ¿Qué te gustaría saber?',
      chips: ['¿Qué me recomiendas para piel seca?', '¿Cómo me uno al equipo de Mayra?', '¿Cuándo es el próximo evento?', 'Busco un perfume'],
      wa: 'WhatsApp a Mayra', sms: 'Texto a Mayra', busy: 'Lola está ocupada ahora mismo. Escríbele a Mayra directo:', limit: 'Por hoy llegaste al límite de mensajes con Lola. Escríbele a Mayra directo:',
      long: 'Esta conversación ya está larga. Sigue con Mayra directo:', fail: 'No pude responder ahora. Intenta otra vez o escríbele a Mayra:',
      note: 'Lola es una asistente de IA y puede equivocarse. Confirma precios en la tienda.', typing: 'Lola está escribiendo',
      msg: 'Hola Mayra, estaba hablando con Lola en tu tarjeta.' },
    en: { btn: 'Ask Lola', title: 'Lola', sub: "Mayra's assistant · AI", close: 'Close', ph: 'Type your question', send: 'Send',
      hi: "Hi! I'm Lola, Mayra's assistant. I can help with Farmasi products and prices, her next event, or joining her team. What would you like to know?",
      chips: ['What do you recommend for dry skin?', "How do I join Mayra's team?", 'When is the next event?', "I'm looking for a perfume"],
      wa: 'WhatsApp Mayra', sms: 'Text Mayra', busy: 'Lola is busy right now. Message Mayra directly:', limit: "You've reached today's message limit with Lola. Message Mayra directly:",
      long: 'This chat is getting long. Keep going with Mayra directly:', fail: "I couldn't answer just now. Try again, or message Mayra:",
      note: 'Lola is an AI assistant and can make mistakes. Check prices in the store.', typing: 'Lola is typing',
      msg: 'Hi Mayra, I was chatting with Lola on your card.' }
  };
  var ICON = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 10.5h7M8.5 13.5h4"/></svg>';
  function L() { return T[document.documentElement.lang === 'en' ? 'en' : 'es']; }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function money(n) { return '$' + Number(n).toFixed(2); }
  var S = { messages: [], lead: null, products: {} };
  try { var saved = JSON.parse(sessionStorage.getItem('lola') || 'null'); if (saved && saved.messages) S = saved; } catch (e) {}
  function keep() { try { sessionStorage.setItem('lola', JSON.stringify(S)); } catch (e) {} }

  fetch('/api/lola', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { if (d && d.on) build(); }).catch(function () {});

  function build() {
    var fab = el('button', 'lola-fab gl gl-coral'); fab.type = 'button'; fab.setAttribute('aria-haspopup', 'dialog');
    fab.innerHTML = ICON; var fl = el('span', null, L().btn); fab.appendChild(fl);
    document.body.appendChild(fab); document.body.classList.add('has-lola');

    var sheet = el('div', 'lola'); sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'lolaT');
    var scrim = el('div', 'lola-scrim'), panel = el('div', 'lola-panel');
    var head = el('header', 'lola-head'), who = el('div', 'lola-who'), av = el('span', 'lola-av', 'L'), names = el('div');
    var h = el('h2', null, L().title); h.id = 'lolaT'; var sub = el('p', null, L().sub);
    names.appendChild(h); names.appendChild(sub); who.appendChild(av); who.appendChild(names);
    var x = el('button', 'lola-x'); x.type = 'button'; x.innerHTML = '&times;'; x.setAttribute('aria-label', L().close);
    head.appendChild(who); head.appendChild(x);
    var reach = el('div', 'lola-reach'), wa = el('a', 'gl gl-blush'), sms = el('a', 'gl gl-blush');
    wa.target = '_blank'; wa.rel = 'noopener'; reach.appendChild(wa); reach.appendChild(sms);
    var log = el('div', 'lola-log'); log.setAttribute('aria-live', 'polite');
    var quick = el('div', 'lola-quick');
    var form = el('form', 'lola-form'), input = el('textarea'), send = el('button', 'gl gl-coral');
    input.rows = 1; input.maxLength = 600; input.setAttribute('enterkeyhint', 'send'); send.type = 'submit';
    send.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg>';
    form.appendChild(input); form.appendChild(send);
    var note = el('p', 'lola-note');
    panel.appendChild(head); panel.appendChild(reach); panel.appendChild(log); panel.appendChild(quick); panel.appendChild(form); panel.appendChild(note);
    sheet.appendChild(scrim); sheet.appendChild(panel); document.body.appendChild(sheet);

    var busy = false, lastFocus = null;
    function transcript() {
      var said = S.messages.filter(function (m) { return m.role === 'user'; }).slice(-3).map(function (m) { return '- ' + m.content; }).join('\n');
      return L().msg + (said ? '\n' + said : '');
    }
    function refreshReach() {
      var t = encodeURIComponent(transcript());
      wa.href = 'https://wa.me/' + PHONE + '?text=' + t; sms.href = 'sms:+' + PHONE + '?&body=' + t;
    }
    function labels() {
      var l = L(); fl.textContent = l.btn; h.textContent = l.title; sub.textContent = l.sub; x.setAttribute('aria-label', l.close);
      input.placeholder = l.ph; input.setAttribute('aria-label', l.ph); send.setAttribute('aria-label', l.send); note.textContent = l.note;
      wa.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z"/></svg><span>' + l.wa + '</span>';
      sms.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H3l2.5-3A8 8 0 1 1 21 12z"/></svg><span>' + l.sms + '</span>';
      refreshReach(); render();
    }
    function linkify(p, text) {
      var re = /(https:\/\/(?:mayra\.okunami\.pro|www\.farmasius\.com\/mayrasotoburgos)[^\s)]*[^\s).,;:!?])/g, last = 0, m;
      while ((m = re.exec(text))) {
        p.appendChild(document.createTextNode(text.slice(last, m.index)));
        var a = el('a', null, m[1].replace('https://', '').replace(/\/$/, '')); a.href = m[1]; if (m[1].indexOf('farmasius') > -1) { a.target = '_blank'; a.rel = 'noopener'; }
        p.appendChild(a); last = re.lastIndex;
      }
      p.appendChild(document.createTextNode(text.slice(last)));
    }
    function bubble(role, text) { var b = el('div', 'lola-msg ' + (role === 'user' ? 'me' : 'her')); text.split(/\n{2,}/).forEach(function (para) { var p = el('p'); linkify(p, para); b.appendChild(p); }); log.appendChild(b); return b; }
    function prods(list) {
      var ul = el('ul', 'lola-prods');
      list.forEach(function (p) {
        var li = el('li'), a = el('a'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
        var ph = el('span', 'ph'); if (p.img) { var im = new Image(); im.src = p.img; im.alt = ''; im.loading = 'lazy'; ph.appendChild(im); }
        var tx = el('span', 'tx'); tx.appendChild(el('b', null, p.name));
        var pr = el('span', 'pr'); if (p.promo) { pr.appendChild(el('s', null, money(p.price))); pr.appendChild(document.createTextNode(' ' + money(p.promo))); } else pr.textContent = money(p.price);
        tx.appendChild(pr); a.appendChild(ph); a.appendChild(tx); li.appendChild(a); ul.appendChild(li);
      });
      log.appendChild(ul);
    }
    function render() {
      log.innerHTML = ''; bubble('assistant', L().hi);
      S.messages.forEach(function (m, i) { bubble(m.role, m.content); if (S.products[i]) prods(S.products[i]); });
      quick.innerHTML = '';
      if (!S.messages.length) L().chips.forEach(function (c) { var b = el('button', 'lola-chip', c); b.type = 'button'; b.onclick = function () { ask(c); }; quick.appendChild(b); });
      quick.hidden = !quick.children.length;
      log.scrollTop = log.scrollHeight;
    }
    function fallback(text) {
      var b = bubble('assistant', text), row = el('div', 'lola-fallback');
      row.appendChild(wa.cloneNode(true)); row.appendChild(sms.cloneNode(true)); b.appendChild(row); log.scrollTop = log.scrollHeight;
    }
    function ask(text) {
      text = String(text || '').trim(); if (!text || busy) return;
      busy = true; send.disabled = true; quick.hidden = true;
      S.messages.push({ role: 'user', content: text }); keep(); bubble('user', text); refreshReach();
      var dots = el('div', 'lola-msg her typing'); dots.setAttribute('aria-label', L().typing); dots.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(dots); log.scrollTop = log.scrollHeight;
      fetch('/api/lola', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: S.messages, lang: document.documentElement.lang === 'en' ? 'en' : 'es', lead_id: S.lead }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          dots.remove();
          if (d.lead_id) S.lead = d.lead_id;
          if (d.reply) {
            S.messages.push({ role: 'assistant', content: d.reply });
            if (d.products && d.products.length) S.products[S.messages.length - 1] = d.products;
            keep(); bubble('assistant', d.reply); if (d.products && d.products.length) prods(d.products);
          } else { S.messages.pop(); keep(); fallback(L()[d.error === 'limit' ? 'limit' : d.error === 'long' ? 'long' : d.offline || d.error === 'busy' ? 'busy' : 'fail']); }
        })
        .catch(function () { dots.remove(); S.messages.pop(); keep(); fallback(L().fail); })
        .then(function () { busy = false; send.disabled = false; log.scrollTop = log.scrollHeight; });
    }
    function open() { lastFocus = document.activeElement; labels(); sheet.hidden = false; document.body.style.overflow = 'hidden'; setTimeout(function () { input.focus({ preventScroll: true }); }, 50); }
    function close() { sheet.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
    fab.addEventListener('click', open);
    x.addEventListener('click', close); scrim.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; input.style.height = ''; ask(v); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); } });
    input.addEventListener('input', function () { input.style.height = ''; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });
    // follow the card's language switch
    new MutationObserver(function () { labels(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    labels();
  }
})();
