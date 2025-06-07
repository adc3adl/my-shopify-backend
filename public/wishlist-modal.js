(function () {
  const API_URL = "https://my-shopify-backend.onrender.com";
  window.cachedWishlistIds = window.cachedWishlistIds || [];

  if (!document.getElementById("wishlist-modal-styles")) {
    const style = document.createElement("style");
    style.id = "wishlist-modal-styles";
    style.innerHTML = `
      .qty-control {
        border: 1.5px solid #d1d5db;
        border-radius: 8px;
        background: #fff;
        gap: 0;
        display: flex;
        align-items: center;
        height: 44px;
        justify-content: center;
      }
      .qty-btn {
        color: #222;
        font-size: 26px;
        font-weight: 700;
        background: none;
        border: none;
        width: 44px;
        height: 44px;
        line-height: 1;
        cursor: pointer;
        transition: color 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .qty-btn:hover {
        color: #e53e3e;
      }
      .wishlist-qty::-webkit-inner-spin-button,
      .wishlist-qty::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .wishlist-qty {
        -moz-appearance: textfield;
        appearance: textfield;
        text-align: center;
        font-size: 20px;
        font-weight: 500;
        outline: none;
        width: 44px;
        height: 44px;
        margin: 0;
        box-shadow: none;
        border: none;
        background: transparent;
        display: block;
      }
.cart-count-bubble {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #e63946;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  line-height: 18px;        /* 👈 центровка цифры по высоте */
  text-align: center;       /* 👈 по горизонтали */
  vertical-align: middle;
  z-index: 10;
  box-shadow: 0 0 0 2px white;
  transition: opacity 0.3s ease;
  transform: none !important;
  
}
.header__icon--cart,
.site-header__cart,
a[href="/cart"] {
  position: relative !important;
}

.header__icon--cart::after,
.site-header__cart::after,
a[href="/cart"]::after {
  content: '';
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  visibility: hidden;
}
  .header__icon .svg-wrapper {
  min-height: 44px !important; /* 👈 не даём схлопнуться */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: visible !important;
}
  .header__icon .icon svg,
.svg-wrapper > svg {
  height: 100% !important;
  width: auto !important;
  display: block !important;
  overflow: visible !important;
}ы
  
    `;
    document.head.appendChild(style);
  }

function openModal(modal) {
  modal.classList.remove("hiding", "hidden");
  requestAnimationFrame(() => {
    modal.classList.add("show");
    console.log("[Wishlist Modal] Открытие с анимацией. Классы:", modal.className);
  });
}

function closeModal(modal) {
  modal.classList.remove("show");
  modal.classList.add("hiding");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("hiding");
    console.log("[Wishlist Modal] Закрытие завершено. Классы:", modal.className);
  }, 400);
}

function updateCartCount(count) {
  const ensureElement = (selector) => {
    let el = document.querySelector(selector);
    if (!el && selector === ".cart-count-bubble") {
      // 🆕 Создаём вручную, если не существует
      el = document.createElement("div");
      el.className = "cart-count-bubble";
      el.setAttribute("aria-hidden", "true");
      const cartIcon = document.querySelector(".header__icon--cart, .site-header__cart");
      if (cartIcon) {
        cartIcon.appendChild(el);
      } else {
        document.body.appendChild(el);
      }
    }
    return el;
  };

  const selectors = [
    ".cart-count-bubble",
    ".cart-count",
    "#cart-count",
    "[data-cart-count]",
  ];

  selectors.forEach((selector) => {
    const el = ensureElement(selector);
    if (!el) return;

    if (count > 0) {
      el.textContent = count;
      el.style.display = "inline-block";
      el.setAttribute("aria-hidden", "false");
      el.classList.add("visible");
    } else {
      el.textContent = "";
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
      el.classList.remove("visible");
    }
  });
}

function openCartDrawerSafely() {
  ensureCartDrawerThenOpen(); // ⬅️ просто вызываем уже глобальную функцию
}

function main() {
  if (window.__wishlistInitialized) return;
  window.__wishlistInitialized = true;
document.querySelectorAll(".cart-count-bubble").forEach((el) => {
  el.style.setProperty("background-color", "#e63946", "important");
  el.style.setProperty("color", "#fff", "important");
  el.style.setProperty("font-size", "11px", "important");
  el.style.setProperty("font-weight", "600", "important");
  el.style.setProperty("width", "18px", "important");
  el.style.setProperty("height", "18px", "important");
  el.style.setProperty("border-radius", "50%", "important");
  el.style.setProperty("line-height", "18px", "important");
  el.style.setProperty("text-align", "center", "important");
  el.style.setProperty("box-shadow", "0 0 0 2px white", "important");
  el.style.setProperty("top", "-6px", "important");
  el.style.setProperty("right", "-6px", "important");
  el.style.setProperty("position", "absolute", "important");
  el.style.setProperty("transform", "none", "important");
  el.style.setProperty("display", "inline-block", "important");
  el.style.setProperty("z-index", "10", "important");
});
    // 🧹 Удаляем дефолтные пустые cart-count-bubble от Shopify
const prehideStyle = document.getElementById("cart-bubble-prehide");
if (prehideStyle) prehideStyle.remove();
  document.querySelectorAll('.cart-count-bubble').forEach(el => {
    const count = parseInt(el.textContent.trim(), 10);
    if (!count) {
      el.remove();
    }
  });

    const toggleBtn = document.getElementById("wishlist-toggle");
    const modal = document.getElementById("wishlist-modal");
    const closeBtn = document.getElementById("wishlist-close");
    const productContainer = document.getElementById("wishlist-products");

    async function fetchWishlist() {
      if (!window.customerId) {
        productContainer.innerHTML = 'Please <a href="/account/login">log in</a> to use your wishlist ❤️';
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/wishlist-get?customerId=${window.customerId}`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        const contentType = res.headers.get("content-type") || "";
        const raw = await res.text();
        if (!res.ok || !contentType.includes("application/json")) {
          throw new Error("Expected JSON but got something else");
        }
        const data = JSON.parse(raw);

        window.cachedWishlistIds = data.products?.map(p => String(p.id)) || [];
        syncWishlistButtons();
  
        if (data?.products?.length) {
          productContainer.innerHTML = data.products.map(p => `
<div class="wishlist-item"
     data-variant-id="${p.id}"
     data-title="${encodeURIComponent(p.title)}"
     data-url="${encodeURIComponent(p.url)}">

  <img class="wishlist-product-image"
       src="${p.image || 'https://placehold.co/80x80?text=No+Image'}"
       alt="${p.title}" />

  <div style="flex: 1;">
    <div class="wishlist-title">${p.title}</div>
    <div class="wishlist-price">${p.price} ${p.currency || 'UAH'}</div>
  </div>

  <div class="qty-control">
    <button type="button" class="qty-btn qty-minus">−</button>
    <input type="number" class="wishlist-qty" min="1" value="${p.quantity || 1}" />
    <button type="button" class="qty-btn qty-plus">+</button>
  </div>

  <button type="button" class="wishlist-add-to-cart">
    🛒 Add to cart
  </button>

  <button type="button" class="wishlist-remove">
    ✕
  </button>
</div>
          `).join("");
        } else {
          productContainer.innerHTML = "Your wishlist is empty.";
        }
      } catch (err) {
        productContainer.innerHTML = "Loading error.";
        console.error("❌ Error loading wishlist:", err);
      }
    }

    if (toggleBtn && modal && productContainer) {
      toggleBtn.addEventListener("click", async () => {
        openModal(modal);
        await fetchWishlist();
      });
    }

    if (modal) {
      modal.addEventListener("mousedown", (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        closeModal(modal);
      });
    }

    if (productContainer) {
      productContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("qty-btn")) {
          const isMinus = e.target.classList.contains("qty-minus");
          const qtyInput = e.target.closest(".qty-control").querySelector(".wishlist-qty");
          let current = parseInt(qtyInput.value) || 1;
          if (isMinus && current > 1) current--;
          if (!isMinus) current++;
          qtyInput.value = current;
          qtyInput.dispatchEvent(new Event("change", { bubbles: true }));
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (e.target.classList.contains("wishlist-remove")) {
          e.preventDefault();
          e.stopPropagation();
          const item = e.target.closest(".wishlist-item");
          const variantId = item?.getAttribute("data-variant-id");
          if (!variantId || !window.customerId) return;
          try {
            const res = await fetch(`${API_URL}/api/wishlist`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
              },
              body: JSON.stringify({
                customerId: window.customerId,
                productId: variantId,
                action: "remove"
              })
            });
            const result = await res.json();
            if (result?.status === "ok") {
              item.classList.add("fading-out");

              window.cachedWishlistIds = window.cachedWishlistIds.filter(id => String(id) !== variantId);

              syncWishlistButtons();

              setTimeout(() => {
                item.remove();
                const remainingItems = modal.querySelectorAll(".wishlist-item").length;
                if (remainingItems === 0) {
                  productContainer.innerHTML = "Your wishlist is empty.";
                }
              }, 1000);

              const heartBtn = document.querySelector(`.wishlist-button[data-product-id="${variantId}"]`);
              if (heartBtn) {
                heartBtn.classList.remove("added");
                const svg = heartBtn.querySelector("svg");
                if (svg) {
                  svg.setAttribute("fill", "none");
                  svg.setAttribute("stroke", "#e63946");
                }
              }
            }
          } catch (err) {
            console.error("❌ Error removing product:", err);
          }
        }

if (e.target.classList.contains("wishlist-add-to-cart")) {
  e.preventDefault();
  e.stopPropagation();

  const item = e.target.closest(".wishlist-item");
  const variantId = item?.getAttribute("data-variant-id");
  const qtyInput = item.querySelector(".wishlist-qty");
  const quantity = Number(qtyInput.value) || 1;

  if (!variantId || !quantity) return;

  const title = decodeURIComponent(item.getAttribute("data-title") || "");
  const url = decodeURIComponent(item.getAttribute("data-url") || "");

  try {
    e.target.disabled = true;
    e.target.textContent = "Adding...";

    await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: variantId, quantity })
    });

    await fetch(`${API_URL}/api/add-to-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({
        customerId: window.customerId,
        productId: variantId,
        quantity,
        source: "wishlist-modal",
        title,
        url
      })
    });

    e.target.textContent = "Added!";

    setTimeout(() => {
      e.target.textContent = "🛒 Add to cart";
      e.target.disabled = false;
    }, 1200);
// ✅ Обновляем счётчик корзины
fetch("/cart.js")
  .then((r) => r.json())
  .then((cart) => {
    const count = cart.item_count;

    // 🆕 Убедимся, что элемент существует и видим
    let bubble = document.querySelector(".cart-count-bubble");

    if (!bubble) {
      bubble = document.createElement("div");
      bubble.className = "cart-count-bubble";
      bubble.setAttribute("aria-hidden", "false");

      const cartIcon = document.querySelector(".header__icon--cart, .site-header__cart, a[href$='/cart']");
      if (cartIcon) {
        cartIcon.appendChild(bubble);
      } else {
        document.body.appendChild(bubble);
      }
    }

    if (count > 0) {
      bubble.textContent = count;

    } else {
      bubble.style.display = "none";
      bubble.setAttribute("aria-hidden", "true");
    }

    // ✅ Открываем CartDrawer
    ensureCartDrawerThenOpen();

    // 🟢 Для совместимости с темами Shopify
    document.dispatchEvent(new CustomEvent("cart:refresh"));
  });

  } catch (err) {
    alert("Ошибка при добавлении в корзину");
    e.target.textContent = "🛒 Add to cart";
    e.target.disabled = false;
    console.error("❌ Error adding to cart:", err);
  }
}

      });

      productContainer.addEventListener("change", async (e) => {
        if (e.target.classList.contains("wishlist-qty")) {
          const item = e.target.closest(".wishlist-item");
          const variantId = item?.getAttribute("data-variant-id");
          const quantity = Number(e.target.value) || 1;
          if (!variantId || !window.customerId) return;

          try {
            await fetch(`${API_URL}/api/wishlist`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
              },
              body: JSON.stringify({
                customerId: window.customerId,
                productId: variantId,
                quantity,
                action: "update"
              })
            });
          } catch (err) {
            console.error("❌ Error updating quantity:", err);
          }
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
