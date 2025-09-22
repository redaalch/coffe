import AdminData from "../services/AdminData.js";

export class AdminPage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Check if user is admin
    if (!app.auth.isAdmin()) {
      this.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--color1);">
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
          <p>Please contact an administrator or <a href="/auth">login</a> with an admin account.</p>
          <p><em>Hint: Try registering with admin@coffeemasters.com</em></p>
        </div>
      `;
      return;
    }

    this.loadCSS();
    this.render();
    this.setupEventListeners();
    this.loadAdminData();
  }

  loadCSS() {
    if (!document.querySelector('link[href*="AdminPage.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = window.getPath
        ? window.getPath("components/AdminPage.css")
        : "components/AdminPage.css";
      document.head.appendChild(link);
    }
  }

  render() {
    this.innerHTML = `
      <div class="admin-container">
        <header class="admin-header">
          <h1>Admin Panel</h1>
          <div class="admin-nav">
            <button class="nav-btn active" data-section="dashboard">Dashboard</button>
            <button class="nav-btn" data-section="menu">Menu Management</button>
            <button class="nav-btn" data-section="orders">Orders</button>
            <button class="nav-btn" data-section="analytics">Analytics</button>
            <button class="nav-btn" data-section="settings">Settings</button>
          </div>
        </header>

        <main class="admin-content">
          <!-- Dashboard Section -->
          <section id="dashboard" class="admin-section active">
            <div class="dashboard-grid">
              <div class="stat-card">
                <h3>Total Orders</h3>
                <div class="stat-number" id="total-orders">0</div>
              </div>
              <div class="stat-card">
                <h3>Revenue Today</h3>
                <div class="stat-number" id="revenue-today">$0.00</div>
              </div>
              <div class="stat-card">
                <h3>Menu Items</h3>
                <div class="stat-number" id="menu-items">0</div>
              </div>
              <div class="stat-card">
                <h3>Active Users</h3>
                <div class="stat-number" id="active-users">0</div>
              </div>
            </div>
            
            <div class="recent-orders">
              <h3>Recent Orders</h3>
              <div id="recent-orders-list"></div>
            </div>
          </section>

          <!-- Menu Management Section -->
          <section id="menu" class="admin-section">
            <div class="section-header">
              <h2>Menu Management</h2>
              <button class="btn-primary" id="add-item-btn">Add New Item</button>
            </div>
            
            <div class="menu-filters">
              <select id="category-filter">
                <option value="">All Categories</option>
                <option value="Hot Coffee">Hot Coffee</option>
                <option value="Cold Coffee">Cold Coffee</option>
                <option value="Tea">Tea</option>
                <option value="Pastries">Pastries</option>
              </select>
              <input type="text" id="search-items" placeholder="Search menu items...">
            </div>

            <div id="menu-items-grid" class="menu-items-grid"></div>
          </section>

          <!-- Orders Section -->
          <section id="orders" class="admin-section">
            <div class="section-header">
              <h2>Order Management</h2>
              <div class="order-filters">
                <select id="order-status-filter">
                  <option value="">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input type="date" id="order-date-filter">
              </div>
            </div>
            
            <div id="orders-list" class="orders-list"></div>
          </section>

          <!-- Analytics Section -->
          <section id="analytics" class="admin-section">
            <div class="section-header">
              <h2>Analytics & Reports</h2>
              <div class="date-range">
                <input type="date" id="analytics-start-date">
                <span>to</span>
                <input type="date" id="analytics-end-date">
                <button id="update-analytics">Update</button>
              </div>
            </div>
            
            <div class="analytics-grid">
              <div class="chart-container">
                <h3>Sales Over Time</h3>
                <div id="sales-chart" class="chart-placeholder">Chart will be displayed here</div>
              </div>
              <div class="chart-container">
                <h3>Popular Items</h3>
                <div id="popular-items-chart" class="chart-placeholder">Chart will be displayed here</div>
              </div>
            </div>
            
            <div class="analytics-table">
              <h3>Detailed Sales Report</h3>
              <div id="sales-report-table"></div>
            </div>
          </section>

          <!-- Settings Section -->
          <section id="settings" class="admin-section">
            <div class="section-header">
              <h2>Settings</h2>
            </div>
            
            <div class="settings-grid">
              <div class="setting-group">
                <h3>Store Information</h3>
                <form id="store-settings">
                  <label>Store Name:
                    <input type="text" id="store-name" value="Coffee Masters">
                  </label>
                  <label>Contact Email:
                    <input type="email" id="store-email" value="info@coffeemasters.com">
                  </label>
                  <label>Phone Number:
                    <input type="tel" id="store-phone" value="+1 (555) 123-4567">
                  </label>
                  <label>Store Hours:
                    <textarea id="store-hours" rows="3">Mon-Fri: 6:00 AM - 8:00 PM
Sat-Sun: 7:00 AM - 9:00 PM</textarea>
                  </label>
                  <button type="submit">Save Store Settings</button>
                </form>
              </div>
              
              <div class="setting-group">
                <h3>Tax & Pricing</h3>
                <form id="pricing-settings">
                  <label>Tax Rate (%):
                    <input type="number" id="tax-rate" value="8.5" step="0.1" min="0" max="30">
                  </label>
                  <label>Currency:
                    <select id="currency">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </label>
                  <label>Default Discount (%):
                    <input type="number" id="default-discount" value="0" step="1" min="0" max="100">
                  </label>
                  <button type="submit">Save Pricing Settings</button>
                </form>
              </div>
              
              <div class="setting-group">
                <h3>Notifications</h3>
                <form id="notification-settings">
                  <label>
                    <input type="checkbox" id="email-notifications" checked>
                    Email notifications for new orders
                  </label>
                  <label>
                    <input type="checkbox" id="low-stock-alerts" checked>
                    Low stock alerts
                  </label>
                  <label>
                    <input type="checkbox" id="daily-reports" checked>
                    Daily sales reports
                  </label>
                  <button type="submit">Save Notification Settings</button>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>

      <!-- Add/Edit Item Modal -->
      <div id="item-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modal-title">Add New Item</h3>
            <button class="close-modal">&times;</button>
          </div>
          <form id="item-form">
            <div class="form-group">
              <label>Item Name:
                <input type="text" id="item-name" required>
              </label>
            </div>
            <div class="form-group">
              <label>Category:
                <select id="item-category" required>
                  <option value="">Select Category</option>
                  <option value="Hot Coffee">Hot Coffee</option>
                  <option value="Cold Coffee">Cold Coffee</option>
                  <option value="Tea">Tea</option>
                  <option value="Pastries">Pastries</option>
                </select>
              </label>
            </div>
            <div class="form-group">
              <label>Price ($):
                <input type="number" id="item-price" step="0.01" min="0" required>
              </label>
            </div>
            <div class="form-group">
              <label>Description:
                <textarea id="item-description" rows="3"></textarea>
              </label>
            </div>
            <div class="form-group">
              <label>Image URL:
                <input type="url" id="item-image">
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="item-available" checked>
                Available for sale
              </label>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" id="cancel-item">Cancel</button>
              <button type="submit" class="btn-primary">Save Item</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Navigation between sections
    this.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const section = e.target.dataset.section;
        this.switchSection(section);
      });
    });

    // Add new item
    this.querySelector("#add-item-btn").addEventListener("click", () => {
      this.openItemModal();
    });

    // Modal controls
    this.querySelector(".close-modal").addEventListener("click", () => {
      this.closeItemModal();
    });

    this.querySelector("#cancel-item").addEventListener("click", () => {
      this.closeItemModal();
    });

    // Form submissions
    this.querySelector("#item-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveMenuItem();
    });

    this.querySelector("#store-settings").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveStoreSettings();
    });

    this.querySelector("#pricing-settings").addEventListener("submit", (e) => {
      e.preventDefault();
      this.savePricingSettings();
    });

    this.querySelector("#notification-settings").addEventListener(
      "submit",
      (e) => {
        e.preventDefault();
        this.saveNotificationSettings();
      }
    );

    // Filters
    this.querySelector("#category-filter").addEventListener("change", () => {
      this.filterMenuItems();
    });

    this.querySelector("#search-items").addEventListener("input", () => {
      this.filterMenuItems();
    });

    this.querySelector("#order-status-filter").addEventListener(
      "change",
      () => {
        this.filterOrders();
      }
    );

    this.querySelector("#order-date-filter").addEventListener("change", () => {
      this.filterOrders();
    });

    // Analytics
    this.querySelector("#update-analytics").addEventListener("click", () => {
      this.updateAnalytics();
    });
  }

  switchSection(sectionName) {
    // Update navigation
    this.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    this.querySelector(`[data-section="${sectionName}"]`).classList.add(
      "active"
    );

    // Update content
    this.querySelectorAll(".admin-section").forEach((section) => {
      section.classList.remove("active");
    });
    this.querySelector(`#${sectionName}`).classList.add("active");

    // Load section-specific data
    switch (sectionName) {
      case "dashboard":
        this.loadDashboardData();
        break;
      case "menu":
        this.loadMenuItems();
        break;
      case "orders":
        this.loadOrders();
        break;
      case "analytics":
        this.loadAnalytics();
        break;
    }
  }

  loadAdminData() {
    this.loadDashboardData();
    this.loadMenuItems();
    this.loadOrders();
  }

  loadDashboardData() {
    // Get data from AdminData service
    const orders = AdminData.getOrders();
    const users = AdminData.getUsers();
    const menuItems = app.store.menu || [];

    // Update stats
    this.querySelector("#total-orders").textContent = orders.length;

    const todayRevenue = AdminData.getTodayRevenue();
    this.querySelector("#revenue-today").textContent = `$${todayRevenue.toFixed(
      2
    )}`;

    const totalMenuItems = menuItems.reduce(
      (sum, category) => sum + category.products.length,
      0
    );
    this.querySelector("#menu-items").textContent = totalMenuItems;

    this.querySelector("#active-users").textContent = users.filter(
      (user) => user.active
    ).length;

    // Load recent orders
    const recentOrders = orders.slice(-5).reverse();
    this.displayRecentOrders(recentOrders);
  }

  displayRecentOrders(orders) {
    const container = this.querySelector("#recent-orders-list");

    if (orders.length === 0) {
      container.innerHTML = '<p class="no-data">No recent orders</p>';
      return;
    }

    container.innerHTML = orders
      .map(
        (order) => `
      <div class="order-summary">
        <div class="order-info">
          <strong>Order #${order.id}</strong>
          <span class="order-customer">${order.customerName}</span>
        </div>
        <div class="order-details">
          <span class="order-total">$${order.total.toFixed(2)}</span>
          <span class="order-status status-${order.status}">${
          order.status
        }</span>
        </div>
        <div class="order-time">${this.formatDate(order.date)}</div>
      </div>
    `
      )
      .join("");
  }

  loadMenuItems() {
    const container = this.querySelector("#menu-items-grid");
    const menuItems = this.getAllMenuItems();

    container.innerHTML = menuItems
      .map(
        (item) => `
      <div class="admin-menu-item" data-id="${item.id}">
        <img src="${
          window.getPath ? window.getPath(item.image) : item.image
        }" alt="${item.name}" class="item-image">
        <div class="item-details">
          <h4>${item.name}</h4>
          <p class="item-category">${item.category}</p>
          <p class="item-price">$${item.price.toFixed(2)}</p>
          <p class="item-description">${
            item.description || "No description"
          }</p>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="adminPage.editMenuItem('${
            item.id
          }')">Edit</button>
          <button class="btn-delete" onclick="adminPage.deleteMenuItem('${
            item.id
          }')">Delete</button>
          <label class="item-toggle">
            <input type="checkbox" ${item.available !== false ? "checked" : ""} 
                   onchange="adminPage.toggleItemAvailability('${
                     item.id
                   }', this.checked)">
            Available
          </label>
        </div>
      </div>
    `
      )
      .join("");
  }

  getAllMenuItems() {
    const menuItems = [];
    if (app.store.menu) {
      app.store.menu.forEach((category) => {
        category.products.forEach((product) => {
          menuItems.push({
            ...product,
            category: category.name,
          });
        });
      });
    }
    return menuItems;
  }

  openItemModal(item = null) {
    const modal = this.querySelector("#item-modal");
    const title = this.querySelector("#modal-title");

    if (item) {
      title.textContent = "Edit Item";
      this.populateItemForm(item);
    } else {
      title.textContent = "Add New Item";
      this.clearItemForm();
    }

    modal.classList.add("active");
    window.adminPage = this; // Make this accessible globally for inline handlers
  }

  closeItemModal() {
    this.querySelector("#item-modal").classList.remove("active");
  }

  populateItemForm(item) {
    this.querySelector("#item-name").value = item.name;
    this.querySelector("#item-category").value = item.category;
    this.querySelector("#item-price").value = item.price;
    this.querySelector("#item-description").value = item.description || "";
    this.querySelector("#item-image").value = item.image || "";
    this.querySelector("#item-available").checked = item.available !== false;
  }

  clearItemForm() {
    this.querySelector("#item-form").reset();
    this.querySelector("#item-available").checked = true;
  }

  saveMenuItem() {
    const formData = {
      name: this.querySelector("#item-name").value,
      category: this.querySelector("#item-category").value,
      price: parseFloat(this.querySelector("#item-price").value),
      description: this.querySelector("#item-description").value,
      image: this.querySelector("#item-image").value,
      available: this.querySelector("#item-available").checked,
      id: Date.now().toString(), // Simple ID generation
    };

    // In a real app, this would be an API call
    console.log("Saving menu item:", formData);

    // For demo purposes, show success message
    alert("Menu item saved successfully!");
    this.closeItemModal();
    this.loadMenuItems();
  }

  editMenuItem(id) {
    const item = this.getAllMenuItems().find((item) => item.id === id);
    if (item) {
      this.openItemModal(item);
    }
  }

  deleteMenuItem(id) {
    if (confirm("Are you sure you want to delete this item?")) {
      // In a real app, this would be an API call
      console.log("Deleting item:", id);
      alert("Item deleted successfully!");
      this.loadMenuItems();
    }
  }

  toggleItemAvailability(id, available) {
    // In a real app, this would be an API call
    console.log("Toggling availability for item:", id, "Available:", available);
  }

  loadOrders() {
    const orders = AdminData.getOrders();
    this.displayOrders(orders);
  }

  displayOrders(orders) {
    const container = this.querySelector("#orders-list");

    if (orders.length === 0) {
      container.innerHTML = '<p class="no-data">No orders found</p>';
      return;
    }

    container.innerHTML = orders
      .map(
        (order) => `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">Order #${order.id}</span>
          <span class="order-date">${this.formatDate(order.date)}</span>
          <select class="order-status-select" onchange="adminPage.updateOrderStatus('${
            order.id
          }', this.value)">
            <option value="pending" ${
              order.status === "pending" ? "selected" : ""
            }>Pending</option>
            <option value="preparing" ${
              order.status === "preparing" ? "selected" : ""
            }>Preparing</option>
            <option value="ready" ${
              order.status === "ready" ? "selected" : ""
            }>Ready</option>
            <option value="completed" ${
              order.status === "completed" ? "selected" : ""
            }>Completed</option>
            <option value="cancelled" ${
              order.status === "cancelled" ? "selected" : ""
            }>Cancelled</option>
          </select>
        </div>
        <div class="order-customer">
          <strong>${order.customerName}</strong>
          <span>${order.customerEmail}</span>
          <span>${order.customerPhone}</span>
        </div>
        <div class="order-items">
          ${order.items
            .map(
              (item) => `
            <div class="order-item">
              <span>${item.name} x${item.quantity}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="order-total">
          <strong>Total: $${order.total.toFixed(2)}</strong>
        </div>
      </div>
    `
      )
      .join("");
  }

  updateOrderStatus(orderId, newStatus) {
    const updatedOrder = AdminData.updateOrderStatus(orderId, newStatus);
    if (updatedOrder) {
      alert(`Order #${orderId} status updated to ${newStatus}`);
      // Refresh the orders display
      this.loadOrders();
    }
  }

  filterMenuItems() {
    const category = this.querySelector("#category-filter").value;
    const search = this.querySelector("#search-items").value.toLowerCase();

    const items = this.querySelectorAll(".admin-menu-item");
    items.forEach((item) => {
      const itemCategory = item.querySelector(".item-category").textContent;
      const itemName = item.querySelector("h4").textContent.toLowerCase();

      const categoryMatch = !category || itemCategory === category;
      const searchMatch = !search || itemName.includes(search);

      item.style.display = categoryMatch && searchMatch ? "block" : "none";
    });
  }

  filterOrders() {
    const status = this.querySelector("#order-status-filter").value;
    const date = this.querySelector("#order-date-filter").value;

    // In a real app, this would filter the orders and reload the display
    console.log("Filtering orders by status:", status, "and date:", date);
  }

  loadAnalytics() {
    // Mock analytics data
    console.log("Loading analytics data...");

    // In a real app, this would load charts and analytics data
    const salesChart = this.querySelector("#sales-chart");
    const popularChart = this.querySelector("#popular-items-chart");

    salesChart.innerHTML = "<p>📈 Sales trending up 15% this week</p>";
    popularChart.innerHTML =
      "<p>☕ Black Americano is the most popular item</p>";
  }

  updateAnalytics() {
    const startDate = this.querySelector("#analytics-start-date").value;
    const endDate = this.querySelector("#analytics-end-date").value;

    console.log("Updating analytics for date range:", startDate, "to", endDate);
    alert("Analytics updated for the selected date range");
  }

  saveStoreSettings() {
    const settings = {
      name: this.querySelector("#store-name").value,
      email: this.querySelector("#store-email").value,
      phone: this.querySelector("#store-phone").value,
      hours: this.querySelector("#store-hours").value,
    };

    localStorage.setItem("admin_store_settings", JSON.stringify(settings));
    alert("Store settings saved successfully!");
  }

  savePricingSettings() {
    const settings = {
      taxRate: parseFloat(this.querySelector("#tax-rate").value),
      currency: this.querySelector("#currency").value,
      defaultDiscount: parseFloat(
        this.querySelector("#default-discount").value
      ),
    };

    localStorage.setItem("admin_pricing_settings", JSON.stringify(settings));
    alert("Pricing settings saved successfully!");
  }

  saveNotificationSettings() {
    const settings = {
      emailNotifications: this.querySelector("#email-notifications").checked,
      lowStockAlerts: this.querySelector("#low-stock-alerts").checked,
      dailyReports: this.querySelector("#daily-reports").checked,
    };

    localStorage.setItem(
      "admin_notification_settings",
      JSON.stringify(settings)
    );
    alert("Notification settings saved successfully!");
  }

  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }
}

customElements.define("admin-page", AdminPage);
