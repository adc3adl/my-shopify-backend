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
    `;
    document.head.appendChild(style);
  }

  function openModal(modal) {
    modal.classList.remove("hidden");
    setTimeout(() => {
      modal.classList.add("show");
    }, 10);
  }

  function closeModal(modal) {
    modal.classList.remove("fade-in");
    modal.classList.add("fade-out");
    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("fade-out");
    }, 300);
  }

  function main() {
                    function updateCartCount(count) {
                  const selectors = [
                    ".cart-count-bubble",
                    ".cart-count",
                    "#cart-count",
                    "[data-cart-count]",
                  ];

                  selectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => {
                      el.textContent = count;
                      el.classList.add("visible");
                    });
                  });
                }
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

              // ✅ Синхронизация глобального кэша
              window.cachedWishlistIds = window.cachedWishlistIds.filter(id => String(id) !== variantId);

              setTimeout(() => {
                item.remove();
                const remainingItems = modal.querySelectorAll(".wishlist-item").length;
                if (remainingItems === 0) {
                  productContainer.innerHTML = "Your wishlist is empty.";
                }
              }, 2000);

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

                        // Логируем на backend
                        try {
                          await fetch(`${API_URL}/api/add-to-cart`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "ngrok-skip-browser-warning": "true"
                            },
                            body: JSON.stringify({
                              customerId: window.customerId,
                              productId: variantId,
                              quantity: quantity,
                              source: "wishlist-modal",
                              title, 
                              url   
                            })
                          });
                        } catch (err) {
                          console.warn("⚠️ Не удалось записать add-to-cart событие:", err);
                        }

                        e.target.textContent = "Added!";
            setTimeout(() => {
              e.target.textContent = "Add to cart";
              e.target.disabled = false;
            }, 1500);

            if (document.querySelector("#cart-count")) {
              fetch("/cart.js")
                .then(r => r.json())
                .then(cart => {
                  updateCartCount(cart.item_count);
                });

            }
          } catch (err) {
            alert("Ошибка при добавлении в корзину");
            e.target.textContent = "Add to cart";
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