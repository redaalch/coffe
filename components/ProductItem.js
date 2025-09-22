import { addToCart } from "../services/Order.js";

export default class ProductItem extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const template = document.getElementById("product-item-template");
    const content = template.content.cloneNode(true);

    this.appendChild(content);

    const product = JSON.parse(this.dataset.product);
    this.querySelector("h4").textContent = product.name;
    this.querySelector("p.price").textContent = `$${product.price.toFixed(2)}`;
    this.querySelector("img").src = `data/images/${product.image}`;

    // Create a wrapper for title and favorite button
    const titleWrapper = document.createElement("div");
    const h4 = this.querySelector("h4");
    const priceP = this.querySelector("p.price");

    // Move h4 and price to wrapper
    titleWrapper.appendChild(h4);
    titleWrapper.appendChild(priceP);

    // Add favorite button
    const favoriteBtn = document.createElement("button");
    favoriteBtn.className = "favorite-btn";
    favoriteBtn.innerHTML = "♡";
    favoriteBtn.title = "Add to favorites";

    titleWrapper.appendChild(favoriteBtn);

    // Insert wrapper at the beginning of the div
    const mainDiv = this.querySelector("section div");
    mainDiv.insertBefore(titleWrapper, mainDiv.firstChild);

    this.updateFavoriteButton(product.id);

    this.querySelector("a").addEventListener("click", (event) => {
      console.log(event.target.tagName);
      if (event.target.tagName.toLowerCase() == "button") {
        if (event.target.classList.contains("favorite-btn")) {
          this.toggleFavorite(product.id);
        } else {
          addToCart(product.id);
        }
      } else {
        app.router.go(`/product-${product.id}`);
      }
      event.preventDefault();
    });

    // Listen for auth changes to update favorite button
    window.addEventListener("authchange", () => {
      this.updateFavoriteButton(product.id);
    });
  }

  toggleFavorite(productId) {
    if (!app.auth.isAuthenticated()) {
      alert("Please log in to add favorites");
      return;
    }

    if (app.auth.isFavorite(productId)) {
      app.auth.removeFromFavorites(productId);
    } else {
      app.auth.addToFavorites(productId);
    }

    this.updateFavoriteButton(productId);
  }

  updateFavoriteButton(productId) {
    const favoriteBtn = this.querySelector(".favorite-btn");
    if (!favoriteBtn) return;

    if (app.auth.isAuthenticated() && app.auth.isFavorite(productId)) {
      favoriteBtn.innerHTML = "♥";
      favoriteBtn.style.color = "#dc3545";
      favoriteBtn.title = "Remove from favorites";
    } else {
      favoriteBtn.innerHTML = "♡";
      favoriteBtn.style.color = "#666";
      favoriteBtn.title = "Add to favorites";
    }
  }
}

customElements.define("product-item", ProductItem);
