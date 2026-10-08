(() => {
  'use strict';

  const WA_NUMBER = '5524999880401';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  if (!hasGSAP || reduceMotion) document.documentElement.classList.add('no-gsap');

  /* ------------------------------------------------------------
     Produtos (mesmos textos dos posts do Instagram)
     ------------------------------------------------------------ */
  const PRODUCTS = [
    { id: 'bolo-meio-amargo', group: 'Bolos', name: 'Bolo · meio amargo', desc: 'cobertura de brigadeiro meio amargo', msg: 'Bolo de cenoura com brigadeiro meio amargo', img: 'img/bolo-meio-amargo.jpg' },
    { id: 'bolo-ao-leite', group: 'Bolos', name: 'Bolo · ao leite', desc: 'cobertura de brigadeiro ao leite', msg: 'Bolo de cenoura com brigadeiro ao leite', img: 'img/bolo-ao-leite.jpg' },
    { id: 'bolo-craquelado', group: 'Bolos', name: 'Bolo · craquelado', desc: 'cobertura de chocolate craquelado', msg: 'Bolo de cenoura com chocolate craquelado', img: 'img/bolo-craquelado.jpg' },
    { id: 'barra', group: 'Chocolates recheados', name: 'Barra', desc: 'bolo de cenoura e brigadeiro meio amargo', msg: 'Barra recheada', img: 'img/barra.jpg' },
    { id: 'picole', group: 'Chocolates recheados', name: 'Picolé', desc: 'bolo de cenoura e brigadeiro ao leite', msg: 'Picolé recheado', img: 'img/picole.jpg' },
    { id: 'cone', group: 'Chocolates recheados', name: 'Cone', desc: 'bolo de cenoura e creme de avelã', msg: 'Cone recheado', img: 'img/cone.jpg' },
    { id: 'cubos', group: 'Chocolates recheados', name: 'Cubos', desc: 'mini cubos com bolo de cenoura', msg: 'Cubos recheados', img: 'img/cubos.jpg' },
  ];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

  /* ------------------------------------------------------------
     Rolagem suave (Lenis) ligada ao ScrollTrigger
     ------------------------------------------------------------ */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const scrollToEl = el => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: el.id === 'topo' ? 0 : -90, duration: 1.6 });
    else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const hash = a.getAttribute('href');
    if (hash.length < 2) return;
    const el = document.getElementById(hash.slice(1));
    if (!el) return;
    e.preventDefault();
    scrollToEl(el);
  }));

  /* ------------------------------------------------------------
     Navegação, barra de progresso e botões flutuantes
     ------------------------------------------------------------ */
  const navWrap = $('.nav-wrap');
  const bar = $('.progress');
  const fab = $('.fab');
  const pill = $('.cart-pill');
  const pedidoSec = $('#pedido');
  let lastY = scrollY;

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (Math.abs(y - lastY) > 6) {
      navWrap.classList.toggle('hide', y > lastY && y > 260);
      lastY = y;
    }
    updateFloating();
  };
  addEventListener('scroll', onScroll, { passive: true });

  function pedidoInView() {
    const r = pedidoSec.getBoundingClientRect();
    return r.top < innerHeight * .75 && r.bottom > innerHeight * .25;
  }
  function updateFloating() {
    const items = totalItems();
    const showPill = items > 0 && !pedidoInView();
    pill.classList.toggle('show', showPill);
    fab.classList.toggle('hide', items > 0 || scrollY < 300 || pedidoInView());
  }

  /* ------------------------------------------------------------
     Horário de funcionamento (horário de Brasília)
     ------------------------------------------------------------ */
  const HOURS = { 1: [12, 18], 2: [11, 19], 3: [11, 19], 4: [11, 19], 5: [11, 19], 6: [10, 19] };
  const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  function nowInPetropolis() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    return {
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
      mins: Number(get('hour')) * 60 + Number(get('minute')),
    };
  }

  function openStatus() {
    const { day, mins } = nowInPetropolis();
    const today = HOURS[day];
    if (today && mins >= today[0] * 60 && mins < today[1] * 60) return { open: true, text: `Aberto agora · até ${today[1]}h`, day };
    if (today && mins < today[0] * 60) return { open: false, text: `Fechado · abre hoje às ${today[0]}h`, day };
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d]) return { open: false, text: `Fechado · abre ${i === 1 ? 'amanhã' : DAY_NAMES[d]} às ${HOURS[d][0]}h`, day };
    }
    return { open: false, text: 'Confira nossos horários', day };
  }

  function renderStatus() {
    const st = openStatus();
    $$('[data-status]').forEach(el => {
      el.textContent = st.text;
      el.closest('.status')?.classList.toggle('is-open', st.open);
    });
    $$('[data-day]').forEach(li => li.classList.toggle('is-today', li.dataset.day.split(',').includes(String(st.day))));
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* ------------------------------------------------------------
     Pedido → WhatsApp
     ------------------------------------------------------------ */
  const cart = {};
  const list = $('#order-list');
  const form = $('#order-form');
  const preview = $('#preview');
  const hint = $('#form-hint');
  const addrField = $('#field-endereco');

  let lastGroup = '';
  list.innerHTML = PRODUCTS.map(p => {
    const head = p.group !== lastGroup ? `<p class="order-group">${p.group}</p>` : '';
    lastGroup = p.group;
    return `${head}
      <div class="oi" data-id="${p.id}">
        <img src="${p.img}" alt="" width="58" height="70" loading="lazy">
        <div class="oi-txt"><b>${p.name}</b><span>${p.desc}</span></div>
        <div class="step" role="group" aria-label="Quantidade: ${p.name}">
          <button type="button" data-dec aria-label="Tirar um ${p.name}" disabled><svg class="ic"><use href="#i-minus"/></svg></button>
          <output aria-live="polite">0</output>
          <button type="button" data-inc aria-label="Adicionar um ${p.name}"><svg class="ic"><use href="#i-plus"/></svg></button>
        </div>
      </div>`;
  }).join('');

  const totalItems = () => Object.values(cart).reduce((a, b) => a + b, 0);

  function setQty(id, qty) {
    cart[id] = Math.max(0, Math.min(99, qty));
    const row = list.querySelector(`[data-id="${id}"]`);
    row.querySelector('output').textContent = cart[id];
    row.querySelector('[data-dec]').disabled = cart[id] === 0;
    row.classList.toggle('has', cart[id] > 0);
    refreshOrder();
  }

  list.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.closest('.oi').dataset.id;
    setQty(id, (cart[id] || 0) + (btn.hasAttribute('data-inc') ? 1 : -1));
  });

  function addOne(id, sourceBtn) {
    setQty(id, (cart[id] || 0) + 1);
    pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
    if (sourceBtn) {
      sourceBtn.classList.remove('added'); void sourceBtn.offsetWidth; sourceBtn.classList.add('added');
      const label = sourceBtn.querySelector('span');
      if (label) {
        label.dataset.orig ??= label.textContent;
        label.textContent = `No pedido (${cart[id]}) ✓`;
        clearTimeout(sourceBtn._t);
        sourceBtn._t = setTimeout(() => { label.textContent = label.dataset.orig; }, 1600);
      }
    }
  }

  $$('[data-add]').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    addOne(btn.dataset.add, btn);
  }));
  $$('[data-add-card]').forEach(card => card.addEventListener('click', e => {
    if (e.target.closest('button, a')) return;
    addOne(card.dataset.addCard, card.querySelector('[data-add]'));
  }));
  pill.addEventListener('click', () => scrollToEl(pedidoSec));
  pill.hidden = false;

  const fmtDate = iso => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  };

  function buildMessage() {
    const f = form.elements;
    const items = PRODUCTS.filter(p => cart[p.id] > 0).map(p => `• ${cart[p.id]}x ${p.msg}`);
    const lines = ['Olá, Senorita! 🥕 Quero fazer um pedido:', ''];
    lines.push(...(items.length ? items : ['• (escolha os produtos ao lado)']));
    lines.push('');
    if (f.entrega.value === 'delivery') {
      const end = f.endereco.value.trim();
      lines.push(`Entrega: delivery${end ? ` para ${end}` : ''}`);
    } else {
      lines.push('Entrega: vou retirar no quiosque');
    }
    if (f.data.value) lines.push(`Para: ${fmtDate(f.data.value)}`);
    if (f.obs.value.trim()) lines.push(`Obs.: ${f.obs.value.trim()}`);
    if (f.nome.value.trim()) lines.push('', `Meu nome é ${f.nome.value.trim()}.`);
    return lines.join('\n');
  }

  function refreshOrder() {
    addrField.hidden = form.elements.entrega.value !== 'delivery';
    preview.textContent = buildMessage();
    const n = totalItems();
    $('[data-cart-count]').textContent = n;
    $('[data-cart-label]').textContent = n === 1 ? 'item' : 'itens';
    if (n > 0) hint.hidden = true;
    updateFloating();
  }

  form.addEventListener('input', refreshOrder);
  form.addEventListener('change', refreshOrder);

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  form.elements.data.min = today.toISOString().slice(0, 10);

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (totalItems() === 0) {
      hint.textContent = 'Escolha pelo menos um produto antes de enviar.';
      hint.hidden = false;
      list.querySelector('.oi')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!form.elements.nome.value.trim()) {
      hint.textContent = 'Diz seu nome pra gente saber quem está pedindo :)';
      hint.hidden = false;
      form.elements.nome.focus();
      return;
    }
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildMessage())}`, '_blank', 'noopener');
  });

  refreshOrder();
  onScroll();
  $('#ano').textContent = new Date().getFullYear();

  /* ------------------------------------------------------------
     Cursor, botões magnéticos e cards com inclinação 3D
     ------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    const cursor = $('.cursor');
    const label = cursor.querySelector('span');
    cursor.hidden = false;
    let mx = -100, my = -100, cx = mx, cy = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cursor.classList.remove('is-out'); }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-out'));
    const loop = () => {
      cx += (mx - cx) * .2;
      cy += (my - cy) * .2;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mouseover', e => {
      const labelled = e.target.closest('[data-cursor]');
      const interactive = e.target.closest('a, button, input, label, [data-add-card]');
      const onButton = e.target.closest('button, a');
      cursor.classList.toggle('is-label', !!labelled && !onButton);
      cursor.classList.toggle('is-hover', !!interactive);
      label.textContent = labelled && !onButton ? labelled.dataset.cursor : '';
    });

    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * .22}px, ${y * .32}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    $$('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------
     Animações de rolagem (GSAP + ScrollTrigger)
     ------------------------------------------------------------ */
  if (!hasGSAP || reduceMotion) return;
  gsap.registerPlugin(ScrollTrigger);

  // Quebra o texto em palavras, preservando <em>, <mark> etc.
  function splitWords(el, cls = 'w') {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const inners = [];
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const outer = document.createElement('span');
        outer.className = cls;
        const inner = document.createElement('span');
        inner.className = cls === 'w' ? 'wi' : '';
        inner.textContent = part;
        outer.appendChild(inner);
        frag.appendChild(outer);
        inners.push(cls === 'w' ? inner : outer);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return inners;
  }

  /* Entrada do hero */
  const heroWords = splitWords($('.hero h1'));
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.nav', { y: -30, opacity: 0, duration: 1.2 }, 0)
    .from(heroWords, { yPercent: 115, rotate: 4, duration: 1.3, stagger: .07 }, .15)
    .from('.hero .eyebrow, .hero .lead, .hero .cta-row', { y: 26, opacity: 0, duration: 1.1, stagger: .12 }, .55)
    .from('.hero-photo-in', { yPercent: 102, duration: 1.6, ease: 'expo.inOut' }, .1)
    .from('.hero-photo img', { scale: 1.45, duration: 2.2 }, .1)
    .from('.hero .chip', { y: 24, opacity: 0, scale: .85, duration: 1, stagger: .15 }, 1.1)
    .from('.badge-wrap--hero', { scale: 0, rotate: -120, duration: 1.4, ease: 'back.out(1.5)' }, 1.2);

  /* Parallax do hero ao rolar */
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero-copy', { yPercent: 22, opacity: .15, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero-photo img', { yPercent: 10, ease: 'none', scrollTrigger: heroST });
  gsap.to('.badge-wrap--hero .badge', { rotate: 160, y: -40, ease: 'none', scrollTrigger: heroST });
  gsap.to('.chip--a', { y: -70, ease: 'none', scrollTrigger: heroST });
  gsap.to('.chip--b', { y: -30, ease: 'none', scrollTrigger: heroST });

  /* Títulos que sobem palavra por palavra */
  $$('[data-split]').forEach(el => {
    if (el.closest('.hero')) return;
    const words = splitWords(el);
    gsap.from(words, {
      yPercent: 115, rotate: 3, duration: 1.2, ease: 'expo.out', stagger: .05,
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });

  /* Revelações simples e em grupo */
  $$('[data-reveal]').forEach(el => gsap.from(el, {
    y: 50, opacity: 0, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 88%' },
  }));
  $$('[data-stagger]').forEach(group => gsap.from(group.children, {
    y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12,
    scrollTrigger: { trigger: group, start: 'top 86%' },
  }));
  $$('.sec-head .eyebrow, .sec-head .sub, .choco-head .eyebrow, .origem-txt .eyebrow, .q-info .eyebrow, .q-info .status').forEach(el => gsap.from(el, {
    y: 24, opacity: 0, duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 90%' },
  }));

  /* Fotos com parallax interno */
  $$('.bcard-photo img').forEach(img => gsap.fromTo(img, { yPercent: -6, scale: 1.16 }, {
    yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
  }));
  gsap.fromTo('.q-photo img', { yPercent: -7 }, {
    yPercent: 7, ease: 'none',
    scrollTrigger: { trigger: '.q-photo', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.fromTo('.blob img', { yPercent: -6 }, {
    yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: '.blob', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.to('.badge-wrap--origem', {
    rotate: 200, ease: 'none',
    scrollTrigger: { trigger: '.origem', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  /* Faixa infinita que acelera com a velocidade da rolagem */
  const marquee = gsap.to('.marquee-track', { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
  let boost = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => { boost = Math.min(Math.abs(self.getVelocity()) / 220, 9); },
  });
  gsap.ticker.add(() => {
    boost *= .93;
    marquee.timeScale(1 + boost);
  });

  /* Manifesto: as palavras acendem conforme a leitura */
  const mWords = splitWords($('.manifesto-text'), 'mw');
  gsap.fromTo(mWords, { opacity: .16 }, {
    opacity: 1, ease: 'none', stagger: .08,
    scrollTrigger: { trigger: '.manifesto-text', start: 'top 78%', end: 'bottom 50%', scrub: true },
  });

  /* Chocolates: no desktop a seção trava e os painéis correm na horizontal */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const sec = $('.choco');
    const track = $('.htrack');
    const progressBar = $('.hprog-bar i');
    const counter = $('[data-hcount]');
    const panels = $$('.panel:not(.panel--end)', track);
    sec.classList.add('is-pinned');

    const distance = () => track.scrollWidth - document.documentElement.clientWidth;
    const slide = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: self => {
          progressBar.style.transform = `scaleX(${.25 + self.progress * .75})`;
          const idx = Math.min(panels.length, Math.floor(self.progress * panels.length) + 1);
          counter.textContent = String(idx).padStart(2, '0');
        },
      },
    });

    $$('.panel-photo img', track).forEach(img => gsap.fromTo(img, { xPercent: -6, scale: 1.14 }, {
      xPercent: 6, ease: 'none',
      scrollTrigger: { trigger: img.closest('.panel'), containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
    }));
    $$('.panel h3', track).forEach(h => gsap.from(h, {
      y: 60, opacity: 0, ease: 'expo.out', duration: 1,
      scrollTrigger: { trigger: h.closest('.panel'), containerAnimation: slide, start: 'left 75%' },
    }));

    return () => sec.classList.remove('is-pinned');
  });

  /* Rodapé */
  gsap.from('.footer-logo', {
    y: 60, opacity: 0, rotate: -6, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.footer', start: 'top 85%' },
  });
  gsap.from('.footer-claim', {
    y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', delay: .1,
    scrollTrigger: { trigger: '.footer', start: 'top 85%' },
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
