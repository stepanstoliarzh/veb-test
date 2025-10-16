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

  // ===== Корзина (ИСПОЛЬЗУЕМ ГЛОБАЛЬНЫЕ ФУНКЦИИ) =====
  const loadCart = () => {
    if (typeof window.loadCart === 'function') {
      return window.loadCart();
    }
    // Фолбэк на случай если глобальные функции не загружены
    try { return JSON.parse(localStorage.getItem("cart")) || {}; }
    catch { return {}; }
  };

  const saveCart = (obj) => {
    if (typeof window.saveCart === 'function') {
      window.saveCart(obj);
    } else {
      localStorage.setItem("cart", JSON.stringify(obj));
      updateCartBadge();
    }
  };

  const updateCartBadge = () => {
    if (typeof window.updateCartBadge === 'function') {
      window.updateCartBadge();
    } else {
      const cart = loadCart();
      let count = 0;
      for (const id in cart) {
        const item = cart[id];
        if (item && typeof item === 'object') {
          count += Number(item.qty) || 0;
        }
      }
      document.querySelectorAll(".cart-count").forEach(el => {
        el.textContent = count;
      });
    }
  };

  // Удалите старую функцию cartCount() и используйте эту:
  const cartCount = () => {
    const cart = loadCart();
    return Object.values(cart).reduce((s, it) => s + (Number(it.qty) || 0), 0);
  };

  // ===== Добавление позиций =====
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

  const addBusiness = (items, price) => {
  const cart = loadCart();
  const id = 'blanch_' + Date.now();
  
  // Создаем корректную структуру для отображения в корзине
  cart[id] = { 
    type: 'business', 
    id, 
    items, 
    qty: 1, 
    price,
    // ДОБАВЛЯЕМ ПОЛЯ ДЛЯ ОТОБРАЖЕНИЯ:
    name: 'Бизнес-ланч',
    img: 'images/business.jpg', 
  };
  
  saveCart(cart);
};

  // ===== Анимация добавления =====
  function flyToCart(startEl) {
    const cartLink = $('.cart-link') || $('#cart-count') || document.body;
    if (!startEl || !cartLink) return;
    const rectS = startEl.getBoundingClientRect();
    const rectC = cartLink.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.style.cssText = `
      position:fixed; left:${rectS.left + rectS.width / 2}px; top:${rectS.top + rectS.height / 2}px;
      width:18px; height:18px; border-radius:50%; background:#2a7d2e; z-index:9999;
    `;
    document.body.appendChild(dot);
    const dx = rectC.left - rectS.left;
    const dy = rectC.top  - rectS.top;
    dot.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.1 }
      ],
      { duration: 600, easing: 'ease-in-out' }
    ).onfinish = () => dot.remove();
  }

  // ===== Небольшие уведомления =====
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

  // ===== Комбо =====
  function renderCombos() {
    const grid = document.querySelector('.combo-grid');
    if (!grid || !window.COMBOS) return;
    grid.innerHTML = window.COMBOS.map(c => `
      <article class="combo-card" data-key="${c.keyword}">
        <div class="combo-imgwrap">
          <img src="${c.image}" alt="${c.name}">
          <button class="combo-add" type="button">Добавить</button>
        </div>
        <div class="combo-info">
          <h3>${c.name}</h3>
          <p>${c.composition}</p>
          <div class="combo-foot"><span>${c.price}₽</span></div>
        </div>
      </article>
    `).join('');

    grid.onclick = (e) => {
      const addBtn = e.target.closest('.combo-add');
      if (!addBtn) return;
      const card = addBtn.closest('.combo-card');
      const key  = card?.dataset.key;
      const combo = window.COMBOS.find(x => x.keyword === key);
      if (!combo) return;
      const cart = loadCart();
      if (!cart[key]) {
        cart[key] = { type: 'combo', name: combo.name, price: combo.price, img: combo.image, qty: 0 };
      }
      cart[key].qty += 1;
      saveCart(cart);
      flyToCart(card);
      toast(`✓ ${combo.name} добавлен`);
    };
  }

  updateCartBadge();

  // ===== Режимы страницы =====
  const modeSelect = $('#mode-select');
  const business   = $('#business');
  const free       = $('#free');
  const combo      = $('#combo');

  if (!modeSelect && !business && !free && !combo) return;

  if (modeSelect) {
    modeSelect.addEventListener('click', (e) => {
      const btn = e.target.closest('.mode-btn');
      if (!btn) return;
      const mode = btn.dataset.mode;
      modeSelect.classList.add('hidden');
      if (mode === 'business') {
        business.classList.remove('hidden');
        updateVisibility();
      } else if (mode === 'combo') {
        combo.classList.remove('hidden');
        renderCombos();
      } else {
        free.classList.remove('hidden');
        renderFree();
      }
    });
  }

  $$('.back-btn[data-back]').forEach(b => {
    b.addEventListener('click', () => {
      [business, free, combo].forEach(sec => sec?.classList.add('hidden'));
      modeSelect?.classList.remove('hidden');
    });
  });

  // ===== Бизнес-ланч =====
  let bCount = 0;
  const bSelected = {
    soup: new Map(), main: new Map(), drink: new Map(),
    salad: new Map(), dessert: new Map()
  };
  const steps = $('#steps');
  const orderBox = $('#order-box');

  const updateVisibility = () => {
    if (!steps || !orderBox) return;
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
    $('[data-bcount]').textContent = String(bCount);
    updateVisibility();
    renderBusiness();
  });
  $('[data-bminus]')?.addEventListener('click', () => {
    bCount = Math.max(0, bCount - 1);
    $('[data-bcount]').textContent = String(bCount);
    updateVisibility();
    renderBusiness();
  });

  const gridSoup = $('#grid-soup');
  const gridMain = $('#grid-main');
  const gridDrink = $('#grid-drink');
  const gridSalad = $('#grid-salad');
  const gridDessert = $('#grid-dessert');

  const totalCat = (cat) => [...bSelected[cat].values()].reduce((s, n) => s + n, 0);
  const canAdd   = (cat) => bCount > 0 && totalCat(cat) < bCount;
  const inc = (key, cat) => { if (!canAdd(cat)) return; bSelected[cat].set(key, (bSelected[cat].get(key) || 0) + 1); };
  const dec = (key, cat) => { const m = bSelected[cat], cur = m.get(key) || 0; if (cur <= 1) m.delete(key); else m.set(key, cur - 1); };

  const cardB = (d) => {
    const qty = bSelected[d.category].get(d.keyword) || 0;
    return `
      <div class="dish ${qty > 0 ? 'selected' : ''}" data-key="${d.keyword}" data-cat="${d.category}">
        <img src="${d.image}" alt="${d.name}">
        <p class="price">${d.price}₽</p>
        <p class="name">${d.name}</p>
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
    gridSoup.innerHTML = soups.map(cardB).join('');
    gridMain.innerHTML = mains.map(cardB).join('');
    gridDrink.innerHTML = drinks.map(cardB).join('');
    gridSalad.innerHTML = salads.map(cardB).join('');
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
    $('[data-bsum]').textContent = `${sum}₽`;
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
    if (totalSelected === 0) { toast('Вы ничего не выбрали'); return; }

   // Без проверки комбо — можно добавить любой состав бизнес-ланча
['soup','main','drink','salad','dessert'].forEach(cat => {
  for (const [key, qty] of bSelected[cat].entries()) {
    const dish = data.find(x => x.keyword === key);
    sum += dish.price * qty;
  }
});

    addBusiness(items, sum);
    toast('Бизнес-ланч добавлен!');
    ['soup','main','drink','salad','dessert'].forEach(cat => bSelected[cat].clear());
    bCount = 0;
    $('[data-bcount]').textContent = '0';
    updateVisibility();
    renderBusiness();
  });

  // ===== Свободный режим =====
  const freeSoup = $('#free-soup');
  const freeMain = $('#free-main');
  const freeDrink = $('#free-drink');
  const freeSalad = $('#free-salad');
  const freeDessert = $('#free-dessert');
  const freeKids = $('#free-kids');
  const freeStage = new Map();
  const fCountEl = $('[data-fcount]');
  let freeTotal = 0;
  const FREE_LIMIT = 10;

  const cardF = (d) => {
    const qty = freeStage.get(d.keyword) || 1;
    return `
      <div class="dish" data-key="${d.keyword}">
        <img src="${d.image}" alt="${d.name}">
        <p class="price">${d.price}₽</p>
        <p class="name">${d.name}</p>
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

  function renderCategory(list, container) {
    if (!container) return;
    container.innerHTML = list.map(cardF).join('');
  }

  function renderFree() {
    renderCategory(soups, freeSoup);
    renderCategory(mains, freeMain);
    renderCategory(drinks, freeDrink);
    renderCategory(salads, freeSalad);
    renderCategory(desserts, freeDessert);
    if (freeKids) freeKids.innerHTML = kids.map(cardF).join('');
    [freeSoup, freeMain, freeDrink, freeSalad, freeDessert, freeKids].filter(Boolean).forEach(g => {
      g.onclick = (e) => {
        const c = e.target.closest('.dish'); if (!c) return;
        const key = c.dataset.key;
        const cur = freeStage.get(key) || 1;
        if (e.target.dataset.act === 'inc') { freeStage.set(key, cur + 1); renderFree(); return; }
        if (e.target.dataset.act === 'dec') { freeStage.set(key, Math.max(1, cur - 1)); renderFree(); return; }
        if (e.target.dataset.add !== undefined) {
          flyToCart(c);
          addSingle(key, cur);
          freeTotal += cur;
          if (fCountEl) fCountEl.textContent = String(Math.min(freeTotal, FREE_LIMIT));
        }
      };
    });
  }

  renderFree();
}
