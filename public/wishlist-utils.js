(function () {
  // ✅ Гарантированное открытие Cart Drawer
  window.ensureCartDrawerThenOpen = function ensureCartDrawerThenOpen() {
    console.log("🛒 ensureCartDrawerThenOpen вызван");

    // Если CartDrawer уже доступен — открыть сразу
    if (typeof window.CartDrawer?.open === "function") {
      console.log("✅ CartDrawer найден — открываем немедленно");
      window.CartDrawer.open();
      document.dispatchEvent(new CustomEvent("cart:refresh"));
      return;
    }

    // Иначе — ждём загрузку cart-drawer.js
    const cartDrawerScript = [...document.scripts].find(s =>
      s.src.includes("cart-drawer.js")
    );

    if (cartDrawerScript) {
      cartDrawerScript.addEventListener("load", () => {
        console.log("📦 cart-drawer.js загружен — пытаемся открыть Drawer");
        window.waitForCartDrawer();
      });
    } else {
      console.warn("⚠️ cart-drawer.js не найден, пробуем с повторами");
      window.waitForCartDrawer();
    }
  };

  // 🔁 Повторные попытки открыть Drawer, если он ещё не готов
  window.waitForCartDrawer = function waitForCartDrawer(retries = 10) {
    console.log("⌛ waitForCartDrawer попытка:", retries);

    if (typeof window.CartDrawer?.open === "function") {
      console.log("✅ CartDrawer найден — открываем");
      window.CartDrawer.open();
      document.dispatchEvent(new CustomEvent("cart:refresh"));
    } else if (retries > 0) {
      setTimeout(() => window.waitForCartDrawer(retries - 1), 200);
    } else {
      console.warn("⚠️ CartDrawer не найден, редирект на /cart");
      window.location.href = "/cart";
    }
  };

  // 🔢 Обновление счётчика корзины во всех местах
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