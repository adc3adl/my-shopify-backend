(function () {
  // 🔁 Глобально доступная функция для открытия Cart Drawer
  window.ensureCartDrawerThenOpen = function ensureCartDrawerThenOpen() {
    console.log("🛒 ensureCartDrawerThenOpen вызван");

    
setTimeout(() => {
  const cartToggle = document.querySelector('[data-cart-toggle], .cart-toggle, .header__icon--cart');
  if (cartToggle) {
    console.log("🧪 Клик по иконке корзины для обновления Drawer");
    cartToggle.click();
  } else {
    console.warn("❌ Кнопка открытия CartDrawer не найдена, редирект на /cart");
    window.location.href = "/cart";
  }
}, 300);

    // Ищем кнопку, которая открывает корзину (Cart Drawer)
    const trigger = document.querySelector('[data-cart-toggle], .cart-toggle, .header__icon--cart');
    if (trigger) {
      console.log("🧪 Клик по иконке корзины");
      trigger.click();
    } else {
      console.warn("❌ Кнопка открытия CartDrawer не найдена — редирект на /cart");
      window.location.href = "/cart";
    }
  };

  // 🔢 Обновление счётчика товаров
  window.updateCartCount = function updateCartCount(count) {
    const selectors = [
      ".cart-count-bubble",
      ".cart-count",
      "#cart-count",
      "[data-cart-count]"
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        const ariaSpan = el.querySelector('span[aria-hidden="true"]');
        if (ariaSpan) ariaSpan.textContent = count;

        const hiddenSpan = el.querySelector('span.visually-hidden');
        if (hiddenSpan) hiddenSpan.textContent = `${count} item${count !== 1 ? 's' : ''}`;

        if (el.hasAttribute("data-cart-count")) {
          el.setAttribute("data-cart-count", count);
        }

        if (el.id === "cart-count") {
          el.textContent = count;
        }

        el.classList.add("visible");
      });
    });
  };

  // 💖 Синхронизация состояния иконок wishlist
  window.syncWishlistButtons = function syncWishlistButtons() {
    const buttons = document.querySelectorAll(".wishlist-button");
    if (!window.cachedWishlistIds || !buttons.length) return;

    buttons.forEach((btn) => {
      const id = btn.getAttribute("data-product-id");
      if (window.cachedWishlistIds.includes(id)) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  };
})();