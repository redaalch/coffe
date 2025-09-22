// Admin Data Service - handles admin-specific data operations
class AdminDataService {
  constructor() {
    this.initializeAdminData();
  }

  initializeAdminData() {
    // Initialize sample orders if none exist
    if (!localStorage.getItem("admin_orders")) {
      const sampleOrders = [
        {
          id: "1001",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          customerPhone: "+1 (555) 123-4567",
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          status: "completed",
          items: [
            { name: "Black Americano", quantity: 2, price: 1.5 },
            { name: "Croissant", quantity: 1, price: 2.25 },
          ],
          total: 5.25,
        },
        {
          id: "1002",
          customerName: "Jane Smith",
          customerEmail: "jane@example.com",
          customerPhone: "+1 (555) 987-6543",
          date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          status: "preparing",
          items: [
            { name: "Cappuccino", quantity: 1, price: 3.75 },
            { name: "Muffin", quantity: 2, price: 2.5 },
          ],
          total: 8.75,
        },
        {
          id: "1003",
          customerName: "Bob Johnson",
          customerEmail: "bob@example.com",
          customerPhone: "+1 (555) 456-7890",
          date: new Date().toISOString(), // Now
          status: "pending",
          items: [
            { name: "Flat White", quantity: 1, price: 4.25 },
            { name: "Black Tea", quantity: 1, price: 2.0 },
          ],
          total: 6.25,
        },
        {
          id: "1004",
          customerName: "Alice Brown",
          customerEmail: "alice@example.com",
          customerPhone: "+1 (555) 321-0987",
          date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          status: "ready",
          items: [{ name: "Macchiato", quantity: 1, price: 4.5 }],
          total: 4.5,
        },
        {
          id: "1005",
          customerName: "Charlie Wilson",
          customerEmail: "charlie@example.com",
          customerPhone: "+1 (555) 654-3210",
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          status: "completed",
          items: [
            { name: "Frappuccino", quantity: 2, price: 5.25 },
            { name: "Croissant", quantity: 2, price: 2.25 },
          ],
          total: 15.0,
        },
      ];
      localStorage.setItem("admin_orders", JSON.stringify(sampleOrders));
    }

    // Initialize sample users if none exist
    if (!localStorage.getItem("admin_users")) {
      const sampleUsers = [
        {
          id: "1",
          name: "Admin User",
          email: "admin@coffeemasters.com",
          active: true,
          registeredDate: new Date(Date.now() - 7776000000).toISOString(), // 90 days ago
          totalOrders: 15,
          totalSpent: 127.5,
        },
        {
          id: "2",
          name: "John Doe",
          email: "john@example.com",
          active: true,
          registeredDate: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
          totalOrders: 8,
          totalSpent: 65.75,
        },
        {
          id: "3",
          name: "Jane Smith",
          email: "jane@example.com",
          active: true,
          registeredDate: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
          totalOrders: 12,
          totalSpent: 89.25,
        },
        {
          id: "4",
          name: "Bob Johnson",
          email: "bob@example.com",
          active: false,
          registeredDate: new Date(Date.now() - 5184000000).toISOString(), // 60 days ago
          totalOrders: 3,
          totalSpent: 18.5,
        },
      ];
      localStorage.setItem("admin_users", JSON.stringify(sampleUsers));
    }

    // Initialize store settings if none exist
    if (!localStorage.getItem("admin_store_settings")) {
      const defaultSettings = {
        name: "Coffee Masters",
        email: "info@coffeemasters.com",
        phone: "+1 (555) 123-4567",
        hours: "Mon-Fri: 6:00 AM - 8:00 PM\nSat-Sun: 7:00 AM - 9:00 PM",
      };
      localStorage.setItem(
        "admin_store_settings",
        JSON.stringify(defaultSettings)
      );
    }

    // Initialize pricing settings if none exist
    if (!localStorage.getItem("admin_pricing_settings")) {
      const defaultPricing = {
        taxRate: 8.5,
        currency: "USD",
        defaultDiscount: 0,
      };
      localStorage.setItem(
        "admin_pricing_settings",
        JSON.stringify(defaultPricing)
      );
    }

    // Initialize notification settings if none exist
    if (!localStorage.getItem("admin_notification_settings")) {
      const defaultNotifications = {
        emailNotifications: true,
        lowStockAlerts: true,
        dailyReports: true,
      };
      localStorage.setItem(
        "admin_notification_settings",
        JSON.stringify(defaultNotifications)
      );
    }
  }

  // Order management
  getOrders() {
    return JSON.parse(localStorage.getItem("admin_orders") || "[]");
  }

  addOrder(order) {
    const orders = this.getOrders();
    const newOrder = {
      ...order,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    orders.push(newOrder);
    localStorage.setItem("admin_orders", JSON.stringify(orders));
    return newOrder;
  }

  updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex((order) => order.id === orderId);
    if (orderIndex > -1) {
      orders[orderIndex].status = newStatus;
      localStorage.setItem("admin_orders", JSON.stringify(orders));
      return orders[orderIndex];
    }
    return null;
  }

  // User management
  getUsers() {
    return JSON.parse(localStorage.getItem("admin_users") || "[]");
  }

  // Analytics
  getTodayRevenue() {
    const orders = this.getOrders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return orders
      .filter((order) => {
        const orderDate = new Date(order.date);
        orderDate.setHours(0, 0, 0, 0);
        return (
          orderDate.getTime() === today.getTime() &&
          order.status === "completed"
        );
      })
      .reduce((sum, order) => sum + order.total, 0);
  }

  getPopularItems() {
    const orders = this.getOrders();
    const itemCounts = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    return Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  getSalesData(startDate, endDate) {
    const orders = this.getOrders();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return orders.filter((order) => {
      const orderDate = new Date(order.date);
      return (
        orderDate >= start && orderDate <= end && order.status === "completed"
      );
    });
  }

  // Settings management
  getStoreSettings() {
    return JSON.parse(localStorage.getItem("admin_store_settings") || "{}");
  }

  saveStoreSettings(settings) {
    localStorage.setItem("admin_store_settings", JSON.stringify(settings));
  }

  getPricingSettings() {
    return JSON.parse(localStorage.getItem("admin_pricing_settings") || "{}");
  }

  savePricingSettings(settings) {
    localStorage.setItem("admin_pricing_settings", JSON.stringify(settings));
  }

  getNotificationSettings() {
    return JSON.parse(
      localStorage.getItem("admin_notification_settings") || "{}"
    );
  }

  saveNotificationSettings(settings) {
    localStorage.setItem(
      "admin_notification_settings",
      JSON.stringify(settings)
    );
  }
}

export default new AdminDataService();
