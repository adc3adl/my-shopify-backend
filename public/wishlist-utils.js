(function () {
  // ✅ Обновление Cart Drawer и ререндер
  window.ensureCartDrawerThenOpen = function ensureCartDrawerThenOpen() {
    console.log("🛒 ensureCartDrawerThenOpen вызван");

    const trigger = document.querySelector('[data-cart-toggle], .cart-toggle, .header__icon--cart');
    const drawer = document.querySelector('cart-drawer');

    if (drawer && typeof drawer.renderContents === 'function') {
      console.log("🔄 renderContents вызывается");
      fetch('/cart.js')
        .then(r => r.json())
        .then(cart => {
          drawer.renderContents(cart);
          if (trigger) {
            console.log("🧪 Клик по триггеру после renderContents");
            trigger.click();
          } else {
            console.warn("❌ Триггер не найден, редирект на /cart");
            window.location.href = "/cart";
          }
        });
    } else {
      console.warn("⚠️ Drawer не найден или не поддерживает renderContents");
      if (trigger) {
        trigger.click();
      } else {
        window.location.href = "/cart";
      }
    }
  };

  // 🔢 Обновление счётчика корзины в хедере
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

  // ❤️ Синхронизация состояния кнопок Wishlist
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