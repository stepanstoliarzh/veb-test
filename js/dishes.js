// dishes.js
async function loadDishes() {
  const API_URL = "https://github.com/stepanstoliarzh/veb/blob/main/dishes.json";
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Ошибка загрузки данных: " + response.status);
    const data = await response.json();
    window.DISHES = data;
    console.log("✅ Блюда успешно загружены:", data.length);
  } catch (error) {
    console.error("⚠️ Не удалось загрузить блюда, используется резервный список.", error);
    // резервные данные, если API недоступно
    window.DISHES = [
      { keyword: 'Lapsha', name: 'Лапша домашняя с курицей', price: 440, category: 'soup', count: '250 мл', image: 'lunch/soup/soup1.jpg', kind: 'meat' },
      { keyword: 'Bolongeze', name: 'Спагетти болоньезе', price: 370, category: 'main', count: '300 г', image: 'lunch/main/main1.jpg', kind: 'meat' },
      { keyword: 'tea', name: 'Чай черный', price: 100, category: 'drink', count: '200 мл', image: 'lunch/drink/drink3.jpg', kind: 'hot' },
      { keyword: 'salad5', name: 'Салат цезарь с курицей', price: 620, category: 'salad', count: '250 г', image: 'lunch/salad/salad5.jpg', kind: 'meat' },
      { keyword: 'dessert2', name: 'Шоколадный фондан', price: 470, category: 'dessert', count: '120 г', image: 'lunch/desert/desert2.jpg', kind: 'medium' }
    ];
  }
  // запускаем приложение только после загрузки блюд
  if (typeof initLunchApp === "function") initLunchApp();
}
loadDishes();
