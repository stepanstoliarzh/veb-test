// js/cart.js
document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://edu.std-900.ist.mospolytech.ru";
  const API_KEY = "d81cdbfb-4744-4d11-aafb-1417de1e1937";

  // ======== ГЛОБАЛЬНЫЕ ФУНКЦИИ КОРЗИНЫ ========
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

    let sum = 0;
    wrap.innerHTML = "";

    for (const [id, item] of entries) {
      if (!item || typeof item !== "object") continue;
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

    totalBox.textContent = "Итого: " + sum + " руб.";
  }

  // ======== ИЗМЕНЕНИЕ КОЛИЧЕСТВА / УДАЛЕНИЕ ========
  const wrap = document.getElementById("cart-items");
  wrap?.addEventListener("click", (e) => {
    const cart = window.loadCart(); 
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
    window.saveCart(cart); 
    renderCart();
  });

  // ======== ЛОГИКА ФОРМЫ ЗАКАЗА ========
  const form = document.querySelector(".order-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cart = loadCart();
    const entries = Object.entries(cart);
    if (!entries.length) {
      alert("Корзина пуста. Добавьте блюда для оформления заказа.");
      return;
    }

    // Определяем delivery_type и delivery_time
    const timeRadio = document.querySelector('input[name="time"]:checked');
    const deliveryType = timeRadio?.value === "soon" ? "now" : "by_time";
    
    let deliveryTime = null;
    if (deliveryType === "by_time") {
      deliveryTime = document.getElementById("time-input")?.value || null;
    }

    // Подготовка данных согласно API
    const data = {
      full_name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      delivery_address: getDeliveryAddress(), 
      delivery_type: deliveryType,
      delivery_time: deliveryTime,
      comment: document.getElementById("comment")?.value || "",
      drink_id: 1, 
      student_id: 241353,
    };

    // Валидация
    if (!data.full_name || !data.email || !data.phone || !data.delivery_address) {
      alert("Пожалуйста, заполните все обязательные поля.");
      return;
    }

    if (data.delivery_type === "by_time" && !data.delivery_time) {
      alert("Пожалуйста, укажите время доставки.");
      return;
    }

      try {
  console.log("Отправляемые данные:", data);
  const response = await fetch(`${API_URL}/labs/api/orders?api_key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
       
      console.log("Статус ответа:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка сервера:", errorText);
        throw new Error(`Ошибка ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Ответ сервера:", result);
      alert("✅ Заказ успешно оформлен!");
      clearCart();
      renderCart();
    } catch (err) {
      console.error("Ошибка:", err);
      alert("❌ Не удалось оформить заказ: " + err.message);
    }
  });
}

// Функция для получения адреса доставки
function getDeliveryAddress() {
  const deliveryType = document.getElementById("delivery").value;
  
  if (deliveryType === "pickup") {
    const pickupSelect = document.getElementById("pickup");
    return pickupSelect ? pickupSelect.options[pickupSelect.selectedIndex].text : "Самовывоз";
  } else {
    const address = document.getElementById("address")?.value || "";
    const entrance = document.getElementById("entrance")?.value || "";
    const floor = document.getElementById("floor")?.value || "";
    const flat = document.getElementById("flat")?.value || "";
    
    return [address, entrance, floor, flat]
      .filter(part => part.trim() !== "")
      .join(", ");
  }
}

  // ======== ПРОЧЕЕ ========
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
  window.updateCartBadge(); 
  renderCart();
});
