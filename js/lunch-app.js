// js/lunch-app.js
function initLunchApp() {
  if (!Array.isArray(window.DISHES)) return;

  // ===== Утилиты =====
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const byName = (a, b) => a.name.localeCompare(b.name, 'ru');

  // ===== Данные =====
  const data = window.DISHES.slice();

  const soups    = data.filter(d => d.category === 'soup').sort(byName);
  const mains    = data.filter(d => d.category === 'main').sort(byName);
  const drinks   = data.filter(d => d.category === 'drink').sort(byName);
  const salads   = data.filter(d => d.category === 'salad').sort(byName);
  const desserts = data.filter(d => d.category === 'dessert').sort(byName);
  const kids     = data.filter(d => d.category === 'kids').sort(byName);

  // ===== Корзина (localStorage) =====
  const CART_KEY = 'cart';
  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
    catch { return {}; }
  };
  const saveCart = (obj) => {
    localStorage.setItem(CART_KEY, JSON.stringify(obj));
    updateCartBadge();
  };
  const cartCount = () => Object.values(loadCart())
    .reduce((s, it) => s + (Number(it.qty) || 0), 0);

  const updateCartBadge = () => {
    const val = cartCount();
    const idBadge = $('#cart-count');
    if (idBadge) idBadge.textContent = String(val);
    $$('.cart-count').forEach(b => b.textContent = String(val));
  };

  // Добавить одну позицию (свободный режим)
  const addSingle = (keyword, qty) => {
    if (!keyword || qty <= 0) return;
    const dish = data.find(d => d.keyword === keyword);
    if (!dish) return;

    const cart = loadCart();
    const id = 'single_' + keyword;

    if (!cart[id]) {
      cart[id] = {
        type: 'free',
        keyword: dish.keyword,
        name: dish.name,
        price: dish.price,
        img: dish.image,
        desc: dish.count,
        qty: 0
      };
    }
    cart[id].qty += qty;
    saveCart(cart);
  };

  // Добавить бизнес-ланч как набор
  const addBusiness = (items, price) => {
    const cart = loadCart();
    const id = 'blanch_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    cart[id] = {
      type: 'business',
      id,
      items,
      qty: 1,
      price
    };
    saveCart(cart);
  };

  // Небольшая анимация «полет к корзине»
  function flyToCart(startEl) {
    const cartLink = $('.cart-link') || $('#cart-count') || document.body;
    if (!startEl || !cartLink) return;

    const rectS = startEl.getBoundingClientRect();
    const rectC = cartLink.getBoundingClientRect();

    const dot = document.createElement('div');
    dot.style.position = 'fixed';
    dot.style.left = rectS.left + rectS.width / 2 + 'px';
    dot.style.top  = rectS.top  + rectS.height / 2 + 'px';
    dot.style.width = '18px';
    dot.style.height = '18px';
    dot.style.borderRadius = '50%';
    dot.style.background = '#2a7d2e';
    dot.style.zIndex = 9999;
    document.body.appendChild(dot);

    const dx = rectC.left - rectS.left;
    const dy = rectC.top  - rectS.top;

    dot.animate(
      [
        { transform: 'translate(0,0) scale(1)',   opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.1 }
      ],
      { duration: 600, easing: 'ease-in-out' }
    ).onfinish = () => dot.remove();
  }

  // =====================================================================
  //                           КОМБО
  // =====================================================================

  // Лёгкое уведомление (для комбо)
  function toast(msg) {
    const box = document.createElement('div');
    box.style.cssText = `
      position:fixed; left:50%; bottom:26px; transform:translateX(-50%);
      background:#2a7d2e; color:#fff; padding:10px 14px; border-radius:10px;
      box-shadow:0 8px 24px rgba(0,0,0,.2); z-index:9999; font-weight:700;
    `;
    box.textContent = msg;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 1400);
  }

  // Современный рендер карточек комбо
  function renderCombos() {
    const grid = document.querySelector('.combo-grid');
    if (!grid || !window.COMBOS) return;

    grid.innerHTML = window.COMBOS.map(c => `
      <article class="combo-card" data-key="${c.keyword}">
        <div class="combo-imgwrap">
          <img src="${c.image}" alt="${c.name}">
          <button class="combo-add" type="button" aria-label="Добавить комбо">Добавить</button>
        </div>
        <div class="combo-info">
          <h3 class="combo-title">${c.name}</h3>
          <p class="combo-comp">${c.composition}</p>
          <div class="combo-foot">
            <span class="combo-price">${c.price}₽</span>
          </div>
        </div>
      </article>
    `).join('');

    // Делегирование кликов по кнопке "Добавить"
    grid.onclick = (e) => {
      const addBtn = e.target.closest('.combo-add');
      if (!addBtn) return;

      const card = addBtn.closest('.combo-card');
      const key  = card?.dataset.key;
      const combo = window.COMBOS.find(x => x.keyword === key);
      if (!combo) return;

      const cart = loadCart();
      if (!cart[key]) {
        cart[key] = {
          type: 'combo',
          name: combo.name,
          price: combo.price,
          img: combo.image,
          qty: 0
        };
      }
      cart[key].qty += 1;
      saveCart(cart);
      flyToCart(card);
      toast(`✓ ${combo.name} добавлен`);
    };
  }

  // Обновляем бейдж при загрузке
  updateCartBadge();

  // =====================================================================
  //                           РЕЖИМЫ СТРАНИЦЫ
  // =====================================================================
  const modeSelect = $('#mode-select');  // экран выбора режима
  const business   = $('#business');
  const free       = $('#free');
  const combo      = $('#combo');        // НОВОЕ: секция комбо (если есть в HTML)

  // Если режимов нет — это другая страница, выходим
  if (!modeSelect && !business && !free && !combo) return;

  // Выбор режима
  if (modeSelect) {
    modeSelect.addEventListener('click', (e) => {
      const btn = e.target.closest('.mode-btn');
      if (!btn) return;
      const mode = btn.dataset.mode;
      modeSelect.classList.add('hidden');

      if (mode === 'business' && business) {
        business.classList.remove('hidden');
        const steps = document.querySelector('#steps');
        const orderBox = document.querySelector('#order-box');
        if (steps && orderBox) {
          steps.classList.add('hidden');
          orderBox.classList.add('hidden');
        }
        updateVisibility();
      } else if (mode === 'combo' && combo) {
        combo.classList.remove('hidden');
        renderCombos(); // рендерим только при входе в раздел
      } else if (free) {
        free.classList.remove('hidden');
        if (free && !business) renderFree();
      }
      });
  }

  // Кнопки «назад»
  $$('.back-btn[data-back]').forEach(b => {
    b.addEventListener('click', () => {
      if (business) business.classList.add('hidden');
      if (free) {
        free.classList.add('hidden');
        // сброс временных значений «свободного» режима
        freeTotal = 0;
        freeStage.clear();
        const cnt = $('[data-fcount]');
        if (cnt) cnt.textContent = '0';
      }
      if (combo) combo.classList.add('hidden'); // НОВОЕ: скрываем комбо при возврате

      if (modeSelect) modeSelect.classList.remove('hidden');

      // Обновим сетки св. режима, чтобы не было устаревших счетчиков
      renderFree();
    });
  });

  // =====================================================================
  //                          БИЗНЕС-ЛАНЧ
  // =====================================================================
  let bCount = 0; // количество бизнес-ланчей выбирается ПОЛЬЗОВАТЕЛЕМ
  const bSelected = {
    soup: new Map(),
    main: new Map(),
    drink: new Map(),
    salad: new Map(),
    dessert: new Map()
  };

  const steps    = $('#steps');
  const orderBox = $('#order-box');

  if (steps && orderBox) {
    steps.classList.add('hidden');
    orderBox.classList.add('hidden');
  }

  const updateVisibility = () => {
    const steps = document.querySelector('#steps');
    const orderBox = document.querySelector('#order-box');
    if (!steps || !orderBox) return; // защита от ошибки
    if (bCount > 0) {
      steps.classList.remove('hidden');
      orderBox.classList.remove('hidden');
    } else {
      steps.classList.add('hidden');
      orderBox.classList.add('hidden');
    }
  };

  $('[data-bplus]')?.addEventListener('click', () => {
    bCount = Math.min(10, bCount + 1);
    const el = $('[data-bcount]');
    if (el) el.textContent = String(bCount);
    updateVisibility();
    renderBusiness(); 
  });
  $('[data-bminus]')?.addEventListener('click', () => {
    bCount = Math.max(0, bCount - 1);
    const el = $('[data-bcount]');
    if (el) el.textContent = String(bCount);
    updateVisibility();
    renderBusiness();
  });

  const gridSoup    = $('#grid-soup');
  const gridMain    = $('#grid-main');
  const gridDrink   = $('#grid-drink');
  const gridSalad   = $('#grid-salad');
  const gridDessert = $('#grid-dessert');

  const totalCat = (cat) => [...bSelected[cat].values()].reduce((s, n) => s + n, 0);
  const canAdd   = (cat) => bCount > 0 && totalCat(cat) < bCount;
  const inc = (key, cat) => {
    if (!canAdd(cat)) return;
    bSelected[cat].set(key, (bSelected[cat].get(key) || 0) + 1);
  };
  const dec = (key, cat) => {
    const m = bSelected[cat], cur = m.get(key) || 0;
    if (cur <= 1) m.delete(key);
    else m.set(key, cur - 1);
  };

  const cardB = (d) => {
    const qty = bSelected[d.category].get(d.keyword) || 0;
    return `
      <div class="dish ${qty > 0 ? 'selected' : ''}" data-key="${d.keyword}" data-cat="${d.category}">
        <img src="${d.image}" alt="${d.name}">
        <p class="price">${d.price}₽</p>
        <p class="name">${d.name}</p>
        <p class="weight">${d.count}</p>
        <div class="actions">
          <button class="${qty > 0 ? 'btn-selected' : ''}" data-add ${!canAdd(d.category) && qty === 0 ? 'disabled' : ''}>
            ${qty > 0 ? 'Выбрано' : 'Выбрать'}
          </button>
          ${qty > 0 ? `
            <div class="qty">
              <button class="qbtn" data-act="dec">−</button>
              <span class="qval">${qty}</span>
              <button class="qbtn" data-act="inc">+</button>
            </div>` : ''}
        </div>
      </div>`;
  };

  function renderBusiness() {
    if (!gridSoup) return;

    // В бизнес-ланче НЕТ фильтров по kind — рендерим напрямую
    gridSoup.innerHTML    = soups.map(cardB).join('');
    gridMain.innerHTML    = mains.map(cardB).join('');
    gridDrink.innerHTML   = drinks.map(cardB).join('');
    gridSalad.innerHTML   = salads.map(cardB).join('');
    gridDessert.innerHTML = desserts.map(cardB).join('');

    [gridSoup, gridMain, gridDrink, gridSalad, gridDessert].forEach(g => {
      g.onclick = (e) => {
        const c = e.target.closest('.dish'); if (!c) return;
        const key = c.dataset.key, cat = c.dataset.cat;
        if (e.target.dataset.add !== undefined) { if (bCount === 0) return; inc(key, cat); renderBusiness(); updateBox(); }
        if (e.target.dataset.act === 'inc')     { inc(key, cat); renderBusiness(); updateBox(); }
        if (e.target.dataset.act === 'dec')     { dec(key, cat); renderBusiness(); updateBox(); }
      };
    });
    updateBox();
  }

  function updateBox() {
    let sum = 0;
    ['soup', 'main', 'drink', 'salad', 'dessert'].forEach(cat => {
      const ul = $(`[data-list="${cat}"]`); if (!ul) return;
      ul.innerHTML = '';
      if (!bSelected[cat].size) {
        const li = document.createElement('li');
        li.textContent = cat === 'drink' ? 'Напиток не выбран' : 'Не выбрано';
        li.style.color = '#a00';
        ul.appendChild(li);
      } else {
        for (const [key, qty] of bSelected[cat].entries()) {
          const dish = data.find(x => x.keyword === key);
          sum += dish.price * qty;
          const li = document.createElement('li');
          li.textContent = `${dish.name}${qty > 1 ? ' ×' + qty : ''}`;
          ul.appendChild(li);
        }
      }
    });
    const sumBox = $('[data-bsum]');
    if (sumBox) sumBox.textContent = `${sum}₽`;
  }

  // === КРАСИВОЕ УВЕДОМЛЕНИЕ ===
function showNotify(text) {
  const overlay = document.getElementById('notify');
  const msg = document.getElementById('notify-text');
  const btn = document.getElementById('notify-btn');
  if (!overlay || !msg || !btn) return;
  msg.textContent = text;
  overlay.classList.remove('hidden');
  btn.onclick = () => overlay.classList.add('hidden');
}

// === КРАСИВОЕ УВЕДОМЛЕНИЕ ===
function showNotify(text) {
  const overlay = document.getElementById('notify');
  const msg = document.getElementById('notify-text');
  const btn = document.getElementById('notify-btn');
  if (!overlay || !msg || !btn) return;
  msg.textContent = text;
  overlay.classList.remove('hidden');
  btn.onclick = () => overlay.classList.add('hidden');
}

// === ДОБАВЛЕНИЕ БИЗНЕС-ЛАНЧА ===
$('[data-badd]')?.addEventListener('click', () => {
  let sum = 0;
  const items = {
    soup: Array.from(bSelected.soup.entries()),
    main: Array.from(bSelected.main.entries()),
    drink: Array.from(bSelected.drink.entries()),
    salad: Array.from(bSelected.salad.entries()),
    dessert: Array.from(bSelected.dessert.entries())
  };

  const totalSelected = ['soup','main','drink','salad','dessert']
    .reduce((s, c) => s + items[c].length, 0);

  if (totalSelected === 0) {
    showNotify('Вы ничего не выбрали для бизнес-ланча.');
    return;
  }

  const hasSoup    = items.soup.length    > 0;
  const hasMain    = items.main.length    > 0;
  const hasDrink   = items.drink.length   > 0;
  const hasSalad   = items.salad.length   > 0;
  const hasDessert = items.dessert.length > 0;

  const validCombos = [
    [true,true,true,true,true],
    [true,true,true,true,false],
    [true,true,false,true,false],
    [false,true,true,true,true],
    [false,true,true,true,false]
  ];

  const current = [hasSoup, hasMain, hasSalad, hasDrink, hasDessert];
  const isValid = validCombos.some(c => c.every((v,i) => v === current[i]));

  if (!isValid) {
    const missing = [];
    if (!hasSoup && (hasMain || hasSalad || hasDrink)) missing.push('суп');
    if (!hasMain)  missing.push('главное блюдо');
    if (!hasDrink) missing.push('напиток');
    if (!hasSalad && (hasSoup || hasMain)) missing.push('салат');
    showNotify(
      missing.length
        ? `Чтобы добавить бизнес-ланч, выберите: ${missing.join(', ')}.`
        : 'Ваш набор не соответствует ни одному из вариантов бизнес-ланча.'
    );
    return;
  }

  // всё ок — считаем сумму и кладём в корзину
  ['soup','main','drink','salad','dessert'].forEach(cat => {
    for (const [key, qty] of bSelected[cat].entries()) {
      const dish = data.find(x => x.keyword === key);
      sum += dish.price * qty;
    }
  });

  addBusiness(items, sum);
  showNotify('Бизнес-ланч успешно добавлен в корзину!');

  // сброс
  bSelected.soup.clear();
  bSelected.main.clear();
  bSelected.drink.clear();
  bSelected.salad.clear();
  bSelected.dessert.clear();
  bCount = 0;
  const counter = $('[data-bcount]');
  if (counter) counter.textContent = '0';
  updateVisibility();
  renderBusiness();
});

  // =====================================================================
  //                          СВОБОДНЫЙ РЕЖИМ
  // =====================================================================
  const freeSoup    = $('#free-soup');
  const freeMain    = $('#free-main');
  const freeDrink   = $('#free-drink');
  const freeSalad   = $('#free-salad');
  const freeDessert = $('#free-dessert');
  const freeKids    = $('#free-kids');

  let freeTotal = 0;               // выбранные позиции (индикатор)
  const FREE_LIMIT = 10;           // подсказка пользователю
  const freeStage = new Map();     // временное количество для карточки
  const fCountEl  = $('[data-fcount]');

  const cardF = (d) => {
    const qty = freeStage.get(d.keyword) || 1;
    return `
      <div class="dish" data-key="${d.keyword}">
        <img src="${d.image}" alt="${d.name}">
        <p class="price">${d.price}₽</p>
        <p class="name">${d.name}</p>
        <p class="weight">${d.count}</p>
        <div class="free-actions">
          <div class="qty">
            <button class="qbtn" data-act="dec">−</button>
            <span class="qval">${qty}</span>
            <button class="qbtn" data-act="inc">+</button>
          </div>
          <button class="add-btn" data-add>В корзину</button>
        </div>
      </div>`;
  };

  // ===== Фильтры (ЛР5, только для свободного режима) =====
  const activeFilters = {
    soup: null,    // fish | meat | veg
    main: null,    // fish | meat | veg
    drink: null,   // cold | hot
    salad: null,   // fish | meat | veg
    dessert: null  // small | medium | large
  };

  function applyFilter(list, kind) {
    if (!kind) return list;
    return list.filter(d => d.kind === kind);
  }

  function renderCategory(list, container, cat) {
    if (!container) return;
    const filtered = applyFilter(list, activeFilters[cat]);
    container.innerHTML = filtered.map(cardF).join('');
  }

  function renderFree() {
    renderCategory(soups,    freeSoup,    'soup');
    renderCategory(mains,    freeMain,    'main');
    renderCategory(drinks,   freeDrink,   'drink');
    renderCategory(salads,   freeSalad,   'salad');
    renderCategory(desserts, freeDessert, 'dessert');

    if (freeKids) freeKids.innerHTML = kids.map(cardF).join('');

    // Делегирование кликов для сеток
    [freeSoup, freeMain, freeDrink, freeSalad, freeDessert, freeKids]
      .filter(Boolean)
      .forEach(g => {
        g.onclick = (e) => {
          const card = e.target.closest('.dish'); if (!card) return;
          const key  = card.dataset.key;
          const cur  = freeStage.get(key) || 1;

          if (e.target.dataset.act === 'inc') {
            let val = cur;
            if (val < FREE_LIMIT) {
              val++;
              freeStage.set(key, val);
              renderFree();
            }
            return;
          }
          if (e.target.dataset.act === 'dec') {
            freeStage.set(key, Math.max(1, cur - 1));
            renderFree();
            return;
          }
          if (e.target.dataset.add !== undefined) {
            // чисто визуальный лимит, чтобы был понятен счётчик
            const inCart = cartCount();
            let addQty = freeStage.get(key) || 1;
            if (inCart + addQty > FREE_LIMIT) {
              addQty = Math.max(0, FREE_LIMIT - inCart);
            }
            if (addQty > 0) {
              flyToCart(card);
              addSingle(key, addQty);
              freeTotal = inCart + addQty;
              if (fCountEl) fCountEl.textContent = String(Math.min(freeTotal, FREE_LIMIT));
            }
          }
        };
      });
  }

  // Обработчики кнопок фильтров свободного режима
  $$('.filters').forEach(panel => {
    panel.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-kind]');
      if (!btn) return;

      const section = btn.closest('section');
      const grid = section && section.querySelector('.dishes-grid');
      if (!grid || !grid.id.startsWith('free-')) return;

      const cat  = grid.id.replace('free-', ''); // soup | main | drink | salad | dessert
      const kind = btn.dataset.kind;             // fish/meat/veg/...

      if (activeFilters[cat] === kind) {
        activeFilters[cat] = null;
        btn.classList.remove('active');
      } else {
        activeFilters[cat] = kind;
        $$('.filters button', panel).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      renderFree();
    });
  });

  // Первичная отрисовка свободного режима (если секции есть на странице)
  renderFree();
  }
