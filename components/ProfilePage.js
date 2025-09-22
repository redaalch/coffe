export class ProfilePage extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    const styles = document.createElement("style");
    this.root.appendChild(styles);
    const section = document.createElement("section");
    this.root.appendChild(section);

    async function loadCSS() {
      const request = await fetch("./components/ProfilePage.css");
      styles.textContent = await request.text();
    }
    loadCSS();
  }

  connectedCallback() {
    window.addEventListener("authchange", () => {
      this.render();
    });
    this.render();
  }

  render() {
    const section = this.root.querySelector("section");

    if (!app.auth.isAuthenticated()) {
      section.innerHTML = `
        <div class="profile-container">
          <p>Please log in to view your profile.</p>
          <button class="auth-button" onclick="app.router.go('/auth')">Login</button>
        </div>
      `;
      return;
    }

    const user = app.auth.currentUser;
    const orders = app.auth.getOrders();

    section.innerHTML = `
      <div class="profile-container">
        <div class="profile-header">
          <div class="profile-info">
            <h2>Welcome, ${user.name}!</h2>
            <p class="email">${user.email}</p>
            <p class="member-since">Member since ${new Date(
              user.createdAt
            ).toLocaleDateString()}</p>
          </div>
          <button class="logout-button" id="logout-btn">Logout</button>
        </div>

        <div class="profile-stats">
          <div class="stat-card">
            <h3>${orders.length}</h3>
            <p>Total Orders</p>
          </div>
          <div class="stat-card">
            <h3>${user.favorites?.length || 0}</h3>
            <p>Favorite Items</p>
          </div>
          <div class="stat-card">
            <h3>$${this.calculateTotalSpent(orders)}</h3>
            <p>Total Spent</p>
          </div>
        </div>

        <div class="profile-sections">
          <div class="section-tabs">
            <button class="tab-button active" data-tab="orders">Order History</button>
            <button class="tab-button" data-tab="favorites">Favorites</button>
          </div>

          <div class="tab-content active" id="orders-tab">
            <h3>Recent Orders</h3>
            <div class="orders-list">
              ${this.renderOrders(orders)}
            </div>
          </div>

          <div class="tab-content" id="favorites-tab">
            <h3>Your Favorite Items</h3>
            <div class="favorites-list">
              ${this.renderFavorites(user.favorites)}
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  calculateTotalSpent(orders) {
    return orders
      .reduce((total, order) => {
        return total + (order.total || 0);
      }, 0)
      .toFixed(2);
  }

  renderOrders(orders) {
    if (!orders.length) {
      return '<p class="empty-state">No orders yet. Start shopping!</p>';
    }

    return orders
      .slice(-5)
      .reverse()
      .map(
        (order) => `
      <div class="order-item">
        <div class="order-header">
          <span class="order-date">${new Date(
            order.timestamp
          ).toLocaleDateString()}</span>
          <span class="order-total">$${order.total?.toFixed(2) || "0.00"}</span>
        </div>
        <div class="order-items">
          ${
            order.items
              ?.map(
                (item) => `
            <span class="order-product">${item.quantity}x ${item.product.name}</span>
          `
              )
              .join(", ") || "No items"
          }
        </div>
      </div>
    `
      )
      .join("");
  }

  renderFavorites(favorites) {
    if (!favorites || !favorites.length) {
      return '<p class="empty-state">No favorites yet. Heart some items to see them here!</p>';
    }

    const favoriteProducts = favorites
      .map((id) => {
        // Find product in menu
        for (let category of app.store.menu || []) {
          const product = category.products.find((p) => p.id === id);
          if (product) return product;
        }
        return null;
      })
      .filter(Boolean);

    return favoriteProducts
      .map(
        (product) => `
      <div class="favorite-item">
        <img src="/data/images/${product.image}" alt="${
          product.name
        }" loading="lazy">
        <div class="favorite-info">
          <h4>${product.name}</h4>
          <p class="price">$${product.price.toFixed(2)}</p>
        </div>
        <button class="remove-favorite" data-id="${product.id}">Remove</button>
      </div>
    `
      )
      .join("");
  }

  setupEventListeners() {
    // Logout button
    const logoutBtn = this.root.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        app.auth.logout();
        app.router.go("/");
      });
    }

    // Tab switching
    this.root.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Remove favorites
    this.root.querySelectorAll(".remove-favorite").forEach((button) => {
      button.addEventListener("click", (e) => {
        const productId = parseInt(e.target.dataset.id);
        app.auth.removeFromFavorites(productId);
        this.render();
      });
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    this.root.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === tabName);
    });

    // Update tab content
    this.root.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.toggle("active", content.id === `${tabName}-tab`);
    });
  }
}

customElements.define("profile-page", ProfilePage);
