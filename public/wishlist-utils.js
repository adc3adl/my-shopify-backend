(function () {
  window.ensureCartDrawerThenOpen = function ensureCartDrawerThenOpen() {
    console.log("🛒 ensureCartDrawerThenOpen вызван");

    // 1. Попробуем найти кнопку открытия корзины
    const trigger = document.querySelector('[data-cart-toggle], .cart-toggle, .header__icon--cart');

    if (trigger) {
      console.log("🧪 Клик по элементу, открывающему CartDrawer");
      trigger.click();
    } else {
      console.warn("❌ Кнопка открытия CartDrawer не найдена, редирект на /cart");
      window.location.href = "/cart";
    }
  };

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
})();