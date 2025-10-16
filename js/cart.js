// js/cart.js
document.addEventListener("DOMContentLoaded", () => {

  // ======== API КОНСТАНТЫ ========
  const API_KEY = 'd81cdbfb-4744-4d11-aafb-1417de1e1937';
  const API_BASE_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api';

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

  // ======== API ФУНКЦИИ ========
  async function loadDishesFromAPI() {
    try {
      const response = await fetch(`${API_BASE_URL}/dishes?api_key=${API_KEY}`);
      if (!response.ok) throw new Error('Ошибка загрузки блюд');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  }

  // Функция для проверки наличия напитков в корзине
  function checkDrinksInCart(cart, allDishes) {
    let hasDrink = false;
    const drinkKeywords = [];

    Object.values(cart).forEach(item => {
      if (!item || typeof item !== 'object') return;

      if (item.type === 'free') {
        const dish = allDishes.find(d => d.keyword === item.keyword);
        if (dish && dish.category === 'drink') {
          hasDrink = true;
          drinkKeywords.push(item.keyword);
        }
      }
      else if (item.type === 'business' && item.items) {
        const drinkItems = item.items['drink'];
        if (Array.isArray(drinkItems) && drinkItems.length > 0) {
          drinkItems.forEach(([keyword, qty]) => {
            const dish = allDishes.find(d => d.keyword === keyword);
            if (dish && dish.category === 'drink') {
              hasDrink = true;
              drinkKeywords.push(keyword);
            }
          });
        }
      }
      else if (item.type === 'combo') {
        const dish = allDishes.find(d => d.keyword === item.keyword);
        if (dish && ['drink', 'drinks', 'Напитки', 'напитки'].includes(dish.category)) {
          hasDrink = true;
          drinkKeywords.push(item.keyword);
        }
      }
    });

    console.log('Найдены напитки в корзине:', drinkKeywords, hasDrink);
    return hasDrink;
  }

  const fieldMap = {
  'soup': 'soup_id',
  'main': 'main_course_id', 
  'salad': 'salad_id',
  'drink': 'drink_id',
  'drinks': 'drink_id',
  'dessert': 'dessert_id'
};

    console.log('Все блюда с API:', allDishes);
    console.log('Корзина для преобразования:', cart);

    // Собираем все keyword из корзины
    const allKeywords = new Set();
    
    Object.values(cart).forEach(item => {
      if (!item || typeof item !== 'object') return;

      if (item.type === 'free') {
        console.log('Свободное блюдо:', item.keyword);
        allKeywords.add(item.keyword);
      }
      else if (item.type === 'business' && item.items) {
        console.log('Бизнес-ланч:', item.items);
        ['soup', 'main', 'salad', 'drink', 'dessert'].forEach(cat => {
          const items = item.items[cat];
          if (Array.isArray(items)) {
            items.forEach(([keyword, qty]) => {
              console.log(`Бизнес-ланч ${cat}:`, keyword);
              allKeywords.add(keyword);
            });
          }
        });
      }
      else if (item.type === 'combo') {
        console.log('Комбо:', item.keyword);
        if (item.keyword) allKeywords.add(item.keyword);
      }
    });

    console.log('Все keywords из корзины:', Array.from(allKeywords));

    // Преобразуем keyword в ID
    allKeywords.forEach(keyword => {
      const dish = allDishes.find(d => d.keyword === keyword);
      console.log(`Поиск блюда по keyword "${keyword}":`, dish);
      
      if (dish) {
        const fieldMap = {
          'soup': 'soup_id',
          'main': 'main_course_id',
          'salad': 'salad_id',
          'drink': 'drink_id',
          'dessert': 'dessert_id'
        };
        const field = fieldMap[dish.category];
        console.log(`Категория "${dish.category}" -> поле "${field}"`);
        
        if (field) {
          // Если поле уже занято, выбираем первое найденное
          if (!result[field]) {
            result[field] = dish.id;
            console.log(`Установлен ${field} = ${dish.id}`);
          }
        }
      } else {
        console.warn(`Блюдо с keyword "${keyword}" не найдено в данных API`);
      }
    });

    console.log('Результат преобразования:', result);
    return result;
  }

  async function submitOrderToAPI(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders?api_key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return await response.json();
    } catch (error) {
      console.error('Order API Error:', error);
      throw error;
    }
  }

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
            <img src="images/business.jpg" alt="Бизнес ланч" class="cart-item-img">
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
  }

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
  const orderForm = document.querySelector(".order-form");

  // Обработчики видимости полей
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

  // ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ НА API
  if (orderForm) {
    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const submitBtn = orderForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      // Блокируем кнопку
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';

      try {
        // Получаем данные формы
        const formData = new FormData(orderForm);
        
        // Загружаем текущую корзину
        const cart = window.loadCart();
        
        // Проверяем, что корзина не пуста
        if (Object.keys(cart).length === 0) {
          alert('Корзина пуста! Добавьте товары перед оформлением заказа.');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        // Загружаем данные блюд с API
        const allDishes = await loadDishesFromAPI();
        if (allDishes.length === 0) {
          throw new Error('Не удалось загрузить данные меню');
        }

        // Проверяем наличие напитков в корзине
        const hasDrink = checkDrinksInCart(cart, allDishes);
        if (!hasDrink) {
          alert('Ошибка: необходимо выбрать хотя бы один напиток');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        // Преобразуем корзину в формат API
        const dishData = convertCartToAPIFormat(cart, allDishes);

        // Дополнительная проверка drink_id
        if (!dishData.drink_id) {
          console.warn('Напитки есть в корзине, но не найдены в данных API');
          // Пробуем найти любой напиток в данных API
          const anyDrink = allDishes.find(d => d.category === 'drink');
          if (anyDrink) {
            dishData.drink_id = anyDrink.id;
            console.log('Использован напиток по умолчанию:', anyDrink);
          } else {
            alert('Ошибка: не удалось определить напиток для заказа');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
          }
        }

        // Определяем адрес доставки
        let deliveryAddressValue = '';
        if (formData.get('delivery') === 'delivery') {
          deliveryAddressValue = formData.get('address') || '';
        } else {
          deliveryAddressValue = 'Самовывоз: ' + (formData.get('pickup') || 'Москва, ул. Здоровая, 15');
        }

        // Определяем тип доставки и время
        const deliveryType = formData.get('time') === 'soon' ? 'now' : 'by_time';
        const deliveryTime = formData.get('time') === 'custom' ? formData.get('time-input') : null;

        // Проверяем время доставки для типа by_time
        if (deliveryType === 'by_time' && !deliveryTime) {
          alert('Пожалуйста, укажите время доставки');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        // Собираем полные данные заказа
        const orderData = {
          full_name: formData.get('name') || '',
          email: formData.get('email') || '',
          phone: formData.get('phone') || '',
          delivery_address: deliveryAddressValue,
          delivery_type: deliveryType,
          delivery_time: deliveryTime,
          subscribe: formData.has('promo') ? 1 : 0,
          comment: formData.get('comment') || '',
          ...dishData
        };

        // Проверяем обязательные поля
        if (!orderData.full_name || !orderData.email || !orderData.phone || !orderData.delivery_address) {
          alert('Пожалуйста, заполните все обязательные поля');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        console.log('Отправка заказа:', orderData);

        // Отправляем заказ на API
        const result = await submitOrderToAPI(orderData);
        
        // Успешное оформление
        alert('✅ Заказ успешно оформлен! Номер заказа: ' + (result.id || 'получен'));
        
        // Очищаем корзину
        window.clearCart();
        
        // Обновляем отображение
        renderCart();
        
        // Сбрасываем форму
        orderForm.reset();
        
        // Перенаправляем на главную через 2 секунды
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
        
      } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        alert('❌ Ошибка при оформлении заказа:\n' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // ======== ИНИЦИАЛИЗАЦИЯ ========
  updateCartBadge();
  renderCart();
});
