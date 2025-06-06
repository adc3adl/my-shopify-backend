(function () {
  // 🔁 Глобально доступная функция для открытия Cart Drawer
  window.ensureCartDrawerThenOpen = function ensureCartDrawerThenOpen() {
    console.log("🛒 ensureCartDrawerThenOpen вызван");

    function updateCartDrawer() {
      fetch(window.Shopify.routes.root + '?sections=cart-drawer')
        .then(res => res.json())
        .then(data => {
          const oldDrawer = document.querySelector('cart-drawer');
          if (oldDrawer && data['cart-drawer']) {
            const tempWrapper = document.createElement('div');
            tempWrapper.innerHTML = data['cart-drawer'];

            const newDrawer = tempWrapper.querySelector('cart-drawer');
            if (newDrawer) {
              oldDrawer.replaceWith(newDrawer);
              console.log("✅ Drawer заменён полностью через replaceWith");

              // 🧼 Убираем затемнение, если осталось
              document.body.classList.remove('overflow-hidden');
              document.querySelector('.overlay')?.remove();
            } else {
              console.warn("❌ Новый Drawer не найден в ответе");
            }
          } else {
            console.warn("❌ Не удалось заменить Drawer");
          }
        })
        .catch(err => {
          console.error("❌ Ошибка при обновлении Drawer:", err);
        });
    }

    updateCartDrawer();

    // ⏳ Через 300мс кликаем по иконке корзины
    setTimeout(() => {
      const cartToggle = document.querySelector('[data-cart-toggle], .cart-toggle, .header__icon--cart');
      if (cartToggle) {
        console.log("🧪 Клик по иконке корзины");
        cartToggle.click();
      } else {
        console.warn("❌ Кнопка открытия CartDrawer не найдена — редирект на /cart");
        window.location.href = "/cart";
      }
    }, 300);
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