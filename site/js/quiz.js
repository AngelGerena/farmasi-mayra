/* Mayra's quizzes: "Find Your Glow" (products) and "Beauty Boss" (join the team).
   One engine, two data sets. The page picks one with <body data-quiz="glow|boss">. */
(function () {
  var STORE = 'https://www.farmasius.com/mayrasotoburgos';
  var JOIN = STORE + '/package-selection';
  var WA = '17874528141';
  var IMG = 'https://content.farmasius.com/Product/';

  // Products from Mayra's store. Links open by product code, with her ID in the URL so she gets credit.
  var P = {
    sunkiss: { n: 'Sunkiss Drops', pid: '1002775', img: '1002775_400_1',
      es: 'Gotas bronceadoras para un brillo cálido en segundos. Mézclalas con tu crema.',
      en: 'Bronzing drops for a warm glow in seconds. Mix them into your moisturizer.' },
    mist: { n: 'Dr. C. Tuna Glow Face Mist', pid: '1002871', img: '1002871_400_1',
      es: 'Bruma facial que hidrata y refresca, incluso sobre el maquillaje.',
      en: 'A face mist that hydrates and refreshes, even over makeup.' },
    zen: { n: 'Zen Extension Lash Mascara', pid: '1301322', img: '1301322_400_1',
      es: 'Pestañas largas y definidas a un precio fácil de amar.',
      en: 'Long, defined lashes at a price that is easy to love.' },
    fullblast: { n: 'Full Blast Mascara', pid: '1001504', img: '1001504_400_1',
      es: 'Volumen dramático para un look de glam total.',
      en: 'Dramatic volume for a full glam look.' },
    primer: { n: 'VFX PRO Blur Primer', pid: '1001516', img: '1001516_400',
      es: 'Suaviza poros y líneas para que tu base dure todo el día.',
      en: 'Blurs pores and fine lines so your base lasts all day.' },
    bronzer: { n: 'Air Bronzer Duo, Caramel', pid: '1002614', img: '1002614_400_1',
      es: 'Dúo bronceador para dar calidez y definición al rostro.',
      en: 'A bronzer duo for warmth and definition.' },
    blush: { n: 'Air Blush Duo, Coral Pop', pid: '1002616', img: '1002616_400_1',
      es: 'Rubor ligero en tono coral para un color fresco y natural.',
      en: 'A light coral blush for fresh, natural color.' },
    stickblush: { n: 'Creamy Stick Blush, Joy', pid: '1001705', img: '1001705_400',
      es: 'Rubor cremoso en barra. Se aplica con los dedos en segundos.',
      en: 'A creamy stick blush you apply with your fingers in seconds.' },
    essentials: { n: 'Full Face Essentials', pid: 'PK93310', img: 'PK93310_400_1',
      es: 'Un kit con lo básico para un rostro completo. Ideal para empezar.',
      en: 'A kit with the basics for a full face. A great place to start.' },
    toner: { n: 'Dr. C. Tuna Tea Tree Face Toner', pid: '1000289', img: '1000289_400',
      es: 'Tónico de árbol de té que ayuda a controlar el brillo.',
      en: 'A tea tree toner that helps control shine.' },
    teaserum: { n: 'Dr. C. Tuna Tea Tree Serum', pid: '1000292', img: '1000292_400',
      es: 'Sérum de árbol de té para piel con tendencia a imperfecciones.',
      en: 'A tea tree serum for blemish-prone skin.' },
    aqua: { n: 'Dr. C. Tuna Aqua Hydrating Cream', pid: '1000267', img: '1000267_400',
      es: 'Crema hidratante para piel que se siente seca o tirante.',
      en: 'A hydrating cream for skin that feels dry or tight.' },
    rich: { n: 'Dr. C. Tuna Age Reversist Rich Moisturizer', pid: '1000271', img: '1000271_400',
      es: 'Hidratante rica de la línea Age Reversist para piel madura.',
      en: 'A rich moisturizer from the Age Reversist line for mature skin.' },
    eye: { n: 'Dr. C. Tuna Lumi Radiance Eye Balm', pid: '1000299', img: '1000299_400',
      es: 'Bálsamo para el contorno de ojos que ilumina la mirada.',
      en: 'An eye balm that brightens the under-eye area.' }
  };

  var UI = {
    es: { back: 'Mi tarjeta', start: 'Empezar', q: 'Pregunta', of: 'de', prev: 'Atrás',
      result: 'Tu resultado', retake: 'Hacer el quiz otra vez', shop: 'Ver en mi tienda',
      formH: '¿Quieres que te escriba?', formS: 'Déjame tu nombre y número, y te escribo por WhatsApp.',
      name: 'Tu nombre', phone: 'Tu número de WhatsApp', send: 'Enviar',
      ok: 'Listo, {n}. Te escribo pronto.', fail: 'No se pudo enviar. Escríbeme directo por WhatsApp.',
      need: 'Escribe tu nombre y un número de teléfono válido.' },
    en: { back: 'My card', start: 'Start', q: 'Question', of: 'of', prev: 'Back',
      result: 'Your result', retake: 'Take the quiz again', shop: 'See it in my store',
      formH: 'Want me to reach out?', formS: 'Leave your name and number, and I will message you on WhatsApp.',
      name: 'Your name', phone: 'Your WhatsApp number', send: 'Send',
      ok: 'Got it, {n}. I will message you soon.', fail: 'That did not send. Message me directly on WhatsApp.',
      need: 'Enter your name and a valid phone number.' }
  };

  function o(id, es, en, pts) { return { id: id, es: es, en: en, pts: pts || {} }; }

  var QUIZZES = {
    boss: {
      eyebrow: { es: 'Quiz · 6 preguntas · 1 minuto', en: 'Quiz · 6 questions · 1 minute' },
      title: { es: '¿Qué tipo de Beauty Boss eres?', en: 'What kind of Beauty Boss are you?' },
      sub: { es: 'Responde 6 preguntas rápidas y descubre cómo sería tu negocio de belleza con Farmasi, y cómo te ayudaría yo.',
             en: 'Answer 6 quick questions and see what your Farmasi beauty business could look like, and how I would help you.' },
      qs: [
        { es: '¿Qué te llama la atención de Farmasi?', en: 'What draws you to Farmasi?', opts: [
          o('income', 'Ganar un dinero extra', 'Earning some extra money', { leader: 2, connector: 1 }),
          o('discount', 'Descuentos en productos que ya uso', 'Discounts on products I already use', { shopper: 3 }),
          o('own', 'Tener algo propio', 'Having something of my own', { leader: 2, creator: 1 }),
          o('team', 'Conocer gente y ser parte de un equipo', 'Meeting people and being part of a team', { connector: 3 })] },
        { es: '¿Cuánto tiempo podrías darle cada semana?', en: 'How much time could you give it each week?', opts: [
          o('t1', '1 a 3 horas', '1 to 3 hours', { shopper: 2, creator: 1 }),
          o('t2', '4 a 7 horas', '4 to 7 hours', { creator: 1, connector: 1 }),
          o('t3', '8 horas o más', '8 hours or more', { leader: 2, connector: 1 })] },
        { es: '¿Qué disfrutas más?', en: 'What do you enjoy most?', opts: [
          o('content', 'Crear fotos y videos', 'Making photos and videos', { creator: 3 }),
          o('talk', 'Conversar con la gente', 'Talking with people', { connector: 3 }),
          o('try', 'Probar productos nuevos', 'Trying new products', { shopper: 3 }),
          o('teach', 'Enseñar y motivar a otras', 'Teaching and motivating others', { leader: 3 })] },
        { es: '¿Cómo te sientes frente a la cámara?', en: 'How do you feel in front of a camera?', opts: [
          o('love', 'Me encanta', 'I love it', { creator: 3 }),
          o('behind', 'Prefiero estar detrás', 'I prefer to stay behind it', { shopper: 1, leader: 1 }),
          o('person', 'Prefiero en persona o por WhatsApp', 'I prefer in person or on WhatsApp', { connector: 2 })] },
        { es: '¿Quiénes te rodean?', en: 'Who is in your circle?', opts: [
          o('fam', 'Familia y amigas que aman la belleza', 'Family and friends who love beauty', { connector: 2, shopper: 1 }),
          o('social', 'Seguidores en redes sociales', 'Followers on social media', { creator: 2 }),
          o('groups', 'Grupos del trabajo, la iglesia o la comunidad', 'Groups from work, church or my community', { leader: 2, connector: 1 }),
          o('zero', 'Empiezo desde cero', 'I am starting from zero', { shopper: 1, creator: 1 })] },
        { es: '¿Dónde te ves en un año?', en: 'Where do you see yourself in a year?', opts: [
          o('clients', 'Con clientas fieles que me compran', 'With loyal customers who buy from me', { connector: 2 }),
          o('side', 'Con un negocio estable de medio tiempo', 'With a steady part-time business', { creator: 1, connector: 1, leader: 1 }),
          o('lead', 'Liderando mi propio equipo', 'Leading my own team', { leader: 3 }),
          o('enjoy', 'Disfrutando mis productos a mejor precio', 'Enjoying my products at a better price', { shopper: 3 })] }
      ],
      order: ['leader', 'creator', 'connector', 'shopper'],
      results: {
        creator: {
          name: { es: 'Glow Creator', en: 'Glow Creator' },
          desc: { es: 'Tu fuerza es el contenido. Una foto, un video corto o una reseña honesta tuya puede hacer que alguien quiera probar un producto.',
                  en: 'Your strength is content. A photo, a short video or an honest review from you can make someone want to try a product.' },
          steps: { es: ['Elige 3 productos que te encanten y grábate usándolos.', 'Publica un video corto por semana con tu rutina.', 'Comparte el enlace de tu tienda en cada publicación.'],
                   en: ['Pick 3 products you love and film yourself using them.', 'Post one short video a week showing your routine.', 'Share your store link in every post.'] },
          help: { es: 'Te paso ideas de contenido y te ayudo con tus primeras publicaciones.', en: 'I will share content ideas with you and help with your first posts.' },
          picks: ['sunkiss', 'blush', 'zen'] },
        connector: {
          name: { es: 'Conectora Social', en: 'Social Connector' },
          desc: { es: 'A ti te encanta la gente, y a la gente le encantas tú. Recomiendas lo que te gusta de forma natural, en persona o por WhatsApp.',
                  en: 'You love people, and people love you. You recommend what you like naturally, in person or on WhatsApp.' },
          steps: { es: ['Haz una lista de 20 personas que aman la belleza.', 'Organiza una pequeña reunión de belleza en casa.', 'Crea una lista de difusión de WhatsApp para tus ofertas.'],
                   en: ['Make a list of 20 people who love beauty.', 'Host a small beauty get-together at home.', 'Start a WhatsApp broadcast list for your deals.'] },
          help: { es: 'Te ayudo a planear tu primera reunión y te doy mensajes listos para enviar.', en: 'I will help you plan your first get-together and give you ready-to-send messages.' },
          picks: ['essentials', 'mist', 'stickblush'] },
        shopper: {
          name: { es: 'Compradora Inteligente', en: 'Smart Shopper' },
          desc: { es: 'Ya amas los productos y quieres pagar menos por ellos. Es una gran forma de empezar, y si un día quieres compartir, ya sabrás de lo que hablas.',
                  en: 'You already love the products and want to pay less for them. That is a great way to start, and if you ever want to share, you will already know what you are talking about.' },
          steps: { es: ['Arma tu primer pedido con tus favoritos.', 'Prueba cada producto y anota lo que te encanta.', 'Cuéntale a una amiga cuando algo te funcione.'],
                   en: ['Build your first order with your favorites.', 'Try each product and note what you love.', 'Tell a friend when something works for you.'] },
          help: { es: 'Te ayudo a escoger el paquete y los productos que más te convienen.', en: 'I will help you choose the package and products that fit you best.' },
          picks: ['aqua', 'fullblast', 'toner'] },
        leader: {
          name: { es: 'Futura Líder', en: 'Future Leader' },
          desc: { es: 'Piensas en grande. Te motiva crecer, aprender y ayudar a otras mujeres a crecer contigo.',
                  en: 'You think big. You are motivated to grow, learn and help other women grow with you.' },
          steps: { es: ['Aprende el sistema conmigo en tu primera semana.', 'Comparte tu historia y por qué empezaste.', 'Invita a una amiga a hacer este quiz.'],
                   en: ['Learn the system with me in your first week.', 'Share your story and why you started.', 'Invite a friend to take this quiz.'] },
          help: { es: 'Te enseño paso a paso lo que yo hago, y crecemos juntas.', en: 'I will show you step by step what I do, and we will grow together.' },
          picks: ['essentials', 'sunkiss', 'rich'] }
      },
      score: function (ans) {
        var s = { leader: 0, creator: 0, connector: 0, shopper: 0 };
        ans.forEach(function (a) { for (var k in a.pts) s[k] += a.pts[k]; });
        var best = this.order[0];
        this.order.forEach(function (k) { if (s[k] > s[best]) best = k; });
        return best;
      },
      stepsH: { es: 'Tu primera semana', en: 'Your first week' },
      helpH: { es: 'Cómo te ayudo yo', en: 'How I will help you' },
      picksH: { es: 'Productos que podrías compartir', en: 'Products you could share' },
      cta1: { es: 'Únete a mi equipo', en: 'Join my team', href: JOIN },
      cta2: { es: 'Háblame primero', en: 'Talk to me first' },
      wa: { es: 'Hola Mayra, hice tu quiz y soy {r}. Tengo algunas preguntas sobre unirme a tu equipo.',
            en: 'Hi Mayra, I took your quiz and I am a {r}. I have a few questions about joining your team.' },
      cross: { es: '¿Solo quieres productos? Haz el quiz Encuentra tu Glow', en: 'Just here for products? Take the Find Your Glow quiz', href: '../glow/' }
    },

    glow: {
      eyebrow: { es: 'Quiz · 4 preguntas · 30 segundos', en: 'Quiz · 4 questions · 30 seconds' },
      title: { es: 'Encuentra tu Glow', en: 'Find Your Glow' },
      sub: { es: 'Cuatro preguntas y te digo qué productos de Farmasi van contigo.',
             en: 'Four questions and I will tell you which Farmasi products fit you.' },
      qs: [
        { es: '¿Cómo es tu look de todos los días?', en: 'What does your everyday look feel like?', opts: [
          o('natural', 'Natural, casi sin maquillaje', 'Natural, barely there'),
          o('soft', 'Glam suave', 'Soft glam'),
          o('full', 'Glam total, siempre lista para la foto', 'Full glam, always camera ready')] },
        { es: '¿Cómo se siente tu piel a mediodía?', en: 'How does your skin feel by midday?', opts: [
          o('oily', 'Con brillo', 'Shiny'),
          o('dry', 'Seca o tirante', 'Dry or tight'),
          o('combo', 'Brillo en la zona T, seca en las mejillas', 'Shiny T-zone, dry cheeks'),
          o('normal', 'Cómoda, sin problemas', 'Comfortable, no complaints')] },
        { es: '¿Qué quieres mejorar primero?', en: 'What do you want to work on first?', opts: [
          o('glow', 'Más brillo y luminosidad', 'More glow'),
          o('clear', 'Menos imperfecciones', 'Fewer breakouts'),
          o('age', 'Líneas finas y firmeza', 'Fine lines and firmness'),
          o('lashes', 'Pestañas de impacto', 'Bigger lashes'),
          o('color', 'Más color en las mejillas', 'More color on my cheeks')] },
        { es: '¿Cuánto tiempo le das a tu rutina?', en: 'How much time do you give your routine?', opts: [
          o('t5', '5 minutos y salgo', '5 minutes and I am out the door'),
          o('t15', 'Unos 15 minutos', 'About 15 minutes'),
          o('tlove', 'Me encanta el proceso', 'I love the process')] }
      ],
      results: {
        natural: { name: { es: 'Glow Natural', en: 'Effortless Glow' },
          desc: { es: 'Te gusta verte fresca y como tú misma, solo que más luminosa. Tu rutina es corta, así que cada producto tiene que valer la pena.',
                  en: 'You like looking fresh and like yourself, only more radiant. Your routine is short, so every product has to earn its spot.' } },
        soft: { name: { es: 'Glam Suave', en: 'Soft Glam' },
          desc: { es: 'Te gusta un look pulido que se ve natural de cerca. Un poco de color, buena piel y lista.',
                  en: 'You like a polished look that still reads natural up close. A little color, great skin, and you are set.' } },
        full: { name: { es: 'Glam Total', en: 'Full Glam Icon' },
          desc: { es: 'El maquillaje es tu momento. Te gusta un acabado de impacto que dure de la mañana a la noche.',
                  en: 'Makeup is your moment. You want a high-impact finish that lasts from morning to night.' } }
      },
      time: {
        t5: { es: 'Elegí productos rápidos para tu rutina de 5 minutos.', en: 'I kept these quick for your 5-minute routine.' },
        t15: { es: 'Tres productos que caben fácil en tus 15 minutos.', en: 'Three products that fit easily into your 15 minutes.' },
        tlove: { es: 'Como disfrutas el proceso, estos te van a encantar.', en: 'Since you enjoy the process, you are going to love these.' }
      },
      score: function (ans) { return ans[0].id; },
      picks: function (ans) {
        var look = ans[0].id, skin = ans[1].id, goal = ans[2].id, out = [];
        function add(k) { if (out.indexOf(k) < 0 && out.length < 3) out.push(k); }
        // Skin care first, by concern and skin type
        if (goal === 'clear' || skin === 'oily') add('toner');
        else if (goal === 'age') add('rich');
        else if (skin === 'dry') add('aqua');
        else add('mist');
        // The makeup hero for her look
        add({ natural: 'sunkiss', soft: 'blush', full: 'primer' }[look]);
        // One more for what she wants to work on
        var extra = {
          glow: 'sunkiss', clear: 'teaserum', age: 'eye',
          lashes: look === 'full' ? 'fullblast' : 'zen',
          color: look === 'natural' ? 'stickblush' : 'bronzer'
        }[goal];
        add(extra);
        ['mist', 'zen', 'sunkiss', 'blush'].forEach(add);
        return out;
      },
      picksH: { es: 'Mis recomendaciones para ti', en: 'My picks for you' },
      cta1: { es: 'Ver toda mi tienda', en: 'Browse my whole store', href: STORE },
      cta2: { es: 'Envíame mis productos', en: 'Send me my picks' },
      wa: { es: 'Hola Mayra, hice tu quiz de belleza y mi resultado es {r}. Me interesan: {p}. ¿Me ayudas?',
            en: 'Hi Mayra, I took your beauty quiz and my result is {r}. I am interested in: {p}. Can you help me?' },
      cross: { es: '¿Te encanta Farmasi? Descubre qué tipo de Beauty Boss eres', en: 'Love Farmasi? Find out what kind of Beauty Boss you are', href: '../boss/' }
    }
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function mount(root, key, opts) {
    opts = opts || {};
    var Q = QUIZZES[key];
    var lang = 'es';
    try { lang = localStorage.getItem('card-lang') || 'es'; } catch (e) {}
    if (!UI[lang]) lang = 'es';
    var step = -1, ans = [], sent = null;
    // Where the visitor came from (?src=flyer, ?src=status...). Kept for the visit so it survives quiz-to-quiz links.
    var src = '';
    try { src = new URLSearchParams(location.search).get('src') || sessionStorage.getItem('card-src') || ''; } catch (e) {}
    src = src.replace(/[^\w-]/g, '').slice(0, 40);
    try { if (src) sessionStorage.setItem('card-src', src); } catch (e) {}

    function t(x) { return x[lang]; }
    function u(k) { return UI[lang][k]; }

    function header() {
      return '<div class="qz-top">' +
        '<a class="qz-back" href="' + (opts.cardHref || '../') + '">&larr; ' + u('back') + '</a>' +
        '<div class="qz-lang" role="group" aria-label="Language">' +
        ['en', 'es'].map(function (l) {
          return '<button type="button" data-l="' + l + '" aria-pressed="' + (l === lang) + '">' + l.toUpperCase() + '</button>';
        }).join('') + '</div></div>';
    }

    function intro() {
      return '<section class="qz-intro">' +
        '<p class="qz-eyebrow">' + t(Q.eyebrow) + '</p>' +
        '<h1 class="qz-h1">' + t(Q.title) + '</h1>' +
        '<p class="qz-lede">' + t(Q.sub) + '</p>' +
        '<p class="qz-by">Mayra Soto Burgos · Farmasi Beauty Director</p>' +
        '<button type="button" class="qz-pill coral" data-go="start"><span>' + u('start') + '</span></button>' +
        '</section>';
    }

    function question() {
      var q = Q.qs[step], n = Q.qs.length;
      return '<section class="qz-q">' +
        '<div class="qz-prog"><span>' + u('q') + ' ' + (step + 1) + ' ' + u('of') + ' ' + n + '</span>' +
        '<div class="qz-bar" aria-hidden="true"><i style="width:' + ((step) / n * 100) + '%"></i></div></div>' +
        '<h2 class="qz-h2">' + t(q) + '</h2>' +
        '<div class="qz-opts">' + q.opts.map(function (op, i) {
          var on = ans[step] && ans[step].id === op.id;
          return '<button type="button" class="qz-opt' + (on ? ' on' : '') + '" data-opt="' + i + '">' +
            '<span class="qz-mark" aria-hidden="true">' + String.fromCharCode(65 + i) + '</span><span>' + t(op) + '</span></button>';
        }).join('') + '</div>' +
        '<button type="button" class="qz-link" data-go="prev">&larr; ' + u('prev') + '</button>' +
        '</section>';
    }

    function card(k) {
      var p = P[k];
      return '<a class="qz-prod" href="' + STORE + '/product-detail/p?pid=' + p.pid + '" target="_blank" rel="noopener">' +
        '<span class="qz-img"><img src="' + IMG + p.img + '.webp" alt="" loading="lazy" onerror="this.parentNode.classList.add(\'none\');this.remove()"><b>Farmasi</b></span>' +
        '<span class="qz-ptext"><span class="qz-pname">' + esc(p.n) + '</span>' +
        '<span class="qz-pwhy">' + p[lang] + '</span>' +
        '<span class="qz-shop">' + u('shop') + ' &rarr;</span></span></a>';
    }

    function result() {
      var rk = Q.score(ans), R = Q.results[rk];
      var picks = Q.picks ? Q.picks(ans) : R.picks;
      var rname = t(R.name);
      var msg = t(Q.wa).replace('{r}', rname).replace('{p}', picks.map(function (k) { return P[k].n; }).join(', '));
      var wa = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
      var h = '<section class="qz-res">' +
        '<p class="qz-eyebrow">' + u('result') + '</p>' +
        '<h1 class="qz-type">' + esc(rname) + '</h1>' +
        '<p class="qz-lede">' + t(R.desc) + (Q.time ? ' ' + t(Q.time[ans[3].id]) : '') + '</p>';
      if (R.steps) {
        h += '<h2 class="qz-h3">' + t(Q.stepsH) + '</h2><ol class="qz-steps">' +
          t(R.steps).map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
          '<div class="qz-help"><p class="qz-h3">' + t(Q.helpH) + '</p><p>' + t(R.help) + '</p></div>';
      }
      h += '<h2 class="qz-h3">' + t(Q.picksH) + '</h2><div class="qz-prods">' + picks.map(card).join('') + '</div>' +
        '<div class="qz-ctas">' +
        '<a class="qz-pill coral" href="' + Q.cta1.href + '" target="_blank" rel="noopener"><span>' + t(Q.cta1) + '</span></a>' +
        '<a class="qz-pill ink" href="' + wa + '" target="_blank" rel="noopener"><span>' + t(Q.cta2) + '</span></a></div>';
      h += '<form class="qz-form" id="qzForm" novalidate>' +
        '<p class="qz-h3">' + u('formH') + '</p><p class="qz-small">' + u('formS') + '</p>' +
        '<label for="qzName">' + u('name') + '</label><input id="qzName" name="name" autocomplete="name" required>' +
        '<label for="qzPhone">' + u('phone') + '</label><input id="qzPhone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required>' +
        '<button type="submit" class="qz-send">' + u('send') + '</button>' +
        '<p class="qz-msg" id="qzMsg" role="status" aria-live="polite"' + (sent ? '' : ' hidden') + '>' + (sent ? esc(u('ok').replace('{n}', sent)) : '') + '</p></form>';
      if (Q.note) h += '<p class="qz-note">' + t(Q.note) + '</p>';
      h += '<a class="qz-cross" href="' + (opts.crossHref ? opts.crossHref(Q.cross.href) : Q.cross.href) + '">' + t(Q.cross) + ' &rarr;</a>' +
        '<button type="button" class="qz-link" data-go="restart">' + u('retake') + '</button></section>';
      return { html: h, key: rk, name: rname, picks: picks };
    }

    var last = null;
    function render() {
      var body;
      if (step < 0) body = intro();
      else if (step < Q.qs.length) body = question();
      else { last = result(); body = last.html; }
      root.innerHTML = header() + '<div class="qz-stage" data-step="' + step + '">' + body + '</div>';
      document.documentElement.lang = lang;
      var f = root.querySelector('#qzForm');
      if (f) f.addEventListener('submit', submit);
    }

    function submit(e) {
      e.preventDefault();
      var name = root.querySelector('#qzName').value.trim();
      var phone = root.querySelector('#qzPhone').value.trim();
      var msg = root.querySelector('#qzMsg');
      msg.hidden = false;
      if (!name || phone.replace(/\D/g, '').length < 10) { msg.textContent = u('need'); return; }
      var data = {
        'form-name': 'quiz-leads', name: name, phone: phone, quiz: key, result: last.name,
        products: last.picks.map(function (k) { return P[k].n; }).join(', '),
        answers: ans.map(function (a) { return a.en; }).join(' | '), lang: lang, source: src || 'direct'
      };
      var bodyStr = Object.keys(data).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]); }).join('&');
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: bodyStr })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          sent = name;
          msg.textContent = u('ok').replace('{n}', name);
          root.querySelector('.qz-send').disabled = true;
        })
        .catch(function () { msg.textContent = u('fail'); });
    }

    root.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !root.contains(b)) return;
      if (b.dataset.l) {
        lang = b.dataset.l;
        try { localStorage.setItem('card-lang', lang); } catch (x) {}
        render();
      } else if (b.dataset.opt) {
        ans[step] = Q.qs[step].opts[+b.dataset.opt];
        b.classList.add('on');
        setTimeout(function () { step++; render(); scrollTop(); }, 180);
      } else if (b.dataset.go === 'start') { step = 0; render(); scrollTop(); }
      else if (b.dataset.go === 'prev') { step--; render(); }
      else if (b.dataset.go === 'restart') { step = -1; ans = []; sent = null; render(); scrollTop(); }
    });

    function scrollTop() { try { root.scrollIntoView({ block: 'start' }); } catch (x) {} }

    render();
  }

  window.CardQuiz = { mount: mount };
  var auto = document.querySelector('[data-quiz]');
  if (auto && !auto.hasAttribute('data-manual')) mount(auto, auto.getAttribute('data-quiz'));
})();
