import { removeFromCart, addToCart } from "../services/Order.js";

export default class CartItem extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const item = JSON.parse(this.dataset.item);
    this.innerHTML = ""; // Clear the element

    const template = document.getElementById("cart-item-template");
    const content = template.content.cloneNode(true);

    this.appendChild(content);

    // Set product image
    const img = this.querySelector(".cart-item-image");
    img.src = `data/images/${item.product.image}`;
    img.alt = item.product.name;

    // Set product name
    this.querySelector(".name").textContent = item.product.name;

    // Set quantity controls as a cohesive unit
    this.querySelector(".qty").innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 12px; color: #b08968; margin: 0; font-weight: 500;">Qty:</span>
        <div style="display: flex; align-items: center; gap: 0; background: white; border: 1px solid #ddd; border-radius: 20px; padding: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <button class="qty-btn minus" style="width: 28px; height: 28px; border: none; background: transparent; color: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; font-size: 16px;" data-action="decrease">−</button>
          <span style="min-width: 30px; text-align: center; font-weight: 500; color: #333; padding: 0 8px; line-height: 28px;">${item.quantity}</span>
          <button class="qty-btn plus" style="width: 28px; height: 28px; border: none; background: transparent; color: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; font-size: 16px;" data-action="increase">+</button>
        </div>
      </div>
    `;

    // Set price
    this.querySelector(".price").textContent = `$${(
      item.product.price * item.quantity
    ).toFixed(2)}`;

    // Update delete button
    this.querySelector("a.delete-button").addEventListener("click", (event) => {
      event.preventDefault();
      removeFromCart(item.product.id);
    });

    // Add quantity control event listeners
    const minusBtn = this.querySelector(".minus");
    const plusBtn = this.querySelector(".plus");

    // Add hover effects
    [minusBtn, plusBtn].forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        btn.style.background = "#7f5539";
        btn.style.color = "white";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.background = "transparent";
        btn.style.color = "#333";
      });
    });

    minusBtn.addEventListener("click", (event) => {
      event.preventDefault();
      if (item.quantity > 1) {
        this.updateQuantity(item.product.id, -1);
      } else {
        removeFromCart(item.product.id);
      }
    });

    plusBtn.addEventListener("click", (event) => {
      event.preventDefault();
      this.updateQuantity(item.product.id, 1);
    });
  }

  updateQuantity(productId, change) {
    const cartItem = app.store.cart.find(
      (item) => item.product.id === productId
    );
    if (cartItem) {
      cartItem.quantity += change;
      if (cartItem.quantity <= 0) {
        removeFromCart(productId);
      } else {
        // Trigger cart update
        app.store.cart = [...app.store.cart];
      }
    }
  }
}

customElements.define("cart-item", CartItem);
