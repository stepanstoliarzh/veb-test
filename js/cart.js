// js/cart.js
document.addEventListener("DOMContentLoaded", () => {

  // ======== УТИЛИТЫ ========
  window.loadCart = function() {
    try {
      const data = JSON.parse(localStorage.getItem("cart"));
      return (data && typeof data === "object") ? data : {};
    } catch {
      return {};
    }
  };

  window.saveCart = function(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    window.updateCartBadge(); 
  };

  window.updateCartBadge = function() {
    const cart = window.loadCart();
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
  };

  window.clearCart = function() {
    localStorage.removeItem("cart");
    window.updateCartBadge();
  };

  // ======== ОТОБРАЖЕНИЕ КОРЗИНЫ ========
  function renderCart() {
    const wrap = document.getElementById("cart-items");
    const totalBox = document.getElementById("cart-total");
    if (!wrap || !totalBox) return;

    const cart = window.loadCart(); 
    const entries = Object.entries(cart);

    const orderInfo = document.querySelector(".order-info");
    const cartBox = document.querySelector(".cart-box");
    const emptyBox = document.querySelector(".cart-empty-box");

    if (!entries.length) {
      orderInfo?.classList.add("hidden");
      cartBox?.classList.add("hidden");
      if (emptyBox) {
        emptyBox.classList.remove("hidden");
        emptyBox.innerHTML = `
          <h2>Товары в корзине</h2>
          <div class="cart-empty">
            <img src="images/empty-cart.svg" alt="Пустая корзина" class="cart-empty-img">
            <p class="cart-empty-text">Ваша корзина пуста</p>
            <a href="lunch.html" class="cart-empty-btn">Перейти в каталог</a>
          </div>
        `;
      }
      totalBox.textContent = "Итого: 0 руб.";
      return;
    }

    orderInfo?.classList.remove("hidden");
    cartBox?.classList.remove("hidden");
    emptyBox?.classList.add("hidden");

    // ======== РЕНДЕР ТОВАРОВ ========
    let sum = 0;
    wrap.innerHTML = "";

    for (const [id, item] of entries) {
      if (!item || typeof item !== "object") continue;

      // --- Свободный режим ---
      if (item.type === "free") {
        const qty = Number(item.qty) || 1;
        sum += item.price * qty;

        wrap.innerHTML += `
          <div class="cart-item">
            <img src="${item.img}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
              <h4>${item.name}</h4>
              <p>${item.desc || ""}</p>
              <div class="cart-item-controls">
                <button class="qbtn" data-dec="${id}">−</button>
                <span class="qval">${qty}</span>
                <button class="qbtn" data-inc="${id}">+</button>
              </div>
              <div class="cart-item-price">${item.price * qty} руб.</div>
            </div>
            <button class="remove-btn" data-remove="${id}">×</button>
          </div>`;
      }

      // --- Бизнес-ланч ---
      if (item.type === "business") {
        let listHtml = '<ul class="blist">';
        ["soup","main","drink","salad","dessert"].forEach(cat => {
          if (Array.isArray(item.items?.[cat])) {
            item.items[cat].forEach(([key, qty]) => {
              const dish = window.DISHES?.find(d => d.keyword === key);
              if (dish) listHtml += `<li>${dish.name}${qty>1?" ×"+qty:""}</li>`;
            });
          }
        });
        listHtml += "</ul>";

        sum += item.price;

        wrap.innerHTML += `
          <div class="cart-item">
            <img src="lunch/business.jpg" alt="Бизнес ланч" class="cart-item-img">
            <div class="cart-item-info">
              <h4>Бизнес-ланч</h4>
              ${listHtml}
              <div class="cart-item-price">${item.price} руб.</div>
            </div>
            <button class="remove-btn" data-remove="${id}">×</button>
          </div>`;
      }

      // --- Комбо-набор ---
      if (item.type === "combo") {
        const qty = Number(item.qty) || 1;
        sum += item.price * qty;

        wrap.innerHTML += `
          <div class="cart-item">
            <img src="${item.img}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
              <h4>${item.name}</h4>
              <p>Комбо-набор FreshLunch</p>
              <div class="cart-item-controls">
                <button class="qbtn" data-dec="${id}">−</button>
                <span class="qval">${qty}</span>
                <button class="qbtn" data-inc="${id}">+</button>
              </div>
              <div class="cart-item-price">${item.price * qty} руб.</div>
            </div>
            <button class="remove-btn" data-remove="${id}">×</button>
          </div>`;
      }
    }

    totalBox.textContent = "Итого: " + sum + " руб.";
  } // ← закрываем renderCart()

  // ======== ИЗМЕНЕНИЕ КОЛИЧЕСТВА / УДАЛЕНИЕ ========
  const wrap = document.getElementById("cart-items");
  wrap?.addEventListener("click", (e) => {
    const cart = loadCart();
    if (e.target.dataset.inc) {
      const id = e.target.dataset.inc;
      if (cart[id]) cart[id].qty = (cart[id].qty || 1) + 1;
    }
    if (e.target.dataset.dec) {
      const id = e.target.dataset.dec;
      if (cart[id]) {
        cart[id].qty = (cart[id].qty || 1) - 1;
        if (cart[id].qty <= 0) delete cart[id];
      }
    }
    if (e.target.dataset.remove) {
      delete cart[e.target.dataset.remove];
    }
    saveCart(cart);
    renderCart();
  });

  // ======== ЛОГИКА ФОРМЫ ЗАКАЗА ========
  const delivery = document.getElementById("delivery");
  const pickupAddress = document.getElementById("pickup-address");
  const deliveryAddress = document.getElementById("delivery-address");
  const payment = document.getElementById("payment");
  const changeRow = document.getElementById("change-row");
  const timeRadios = document.querySelectorAll("input[name='time']");
  const timeSelect = document.getElementById("time-select");

  delivery?.addEventListener("change", () => {
    if (delivery.value === "pickup") {
      pickupAddress.classList.remove("hidden");
      deliveryAddress.classList.add("hidden");
    } else {
      pickupAddress.classList.add("hidden");
      deliveryAddress.classList.remove("hidden");
    }
  });

  payment?.addEventListener("change", () => {
    if (payment.value === "cash") {
      changeRow.classList.remove("hidden");
    } else {
      changeRow.classList.add("hidden");
    }
  });

  timeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "custom" && radio.checked) {
        timeSelect.classList.remove("hidden");
      } else {
        timeSelect.classList.add("hidden");
      }
    });
  });

  // ======== ИНИЦИАЛИЗАЦИЯ ========
  updateCartBadge();
  renderCart();
});
