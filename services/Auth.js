class Auth {
  constructor() {
    this.currentUser = this.loadUser();
    this.listeners = [];
  }

  loadUser() {
    const userData = localStorage.getItem("coffee_user");
    return userData ? JSON.parse(userData) : null;
  }

  saveUser(user) {
    localStorage.setItem("coffee_user", JSON.stringify(user));
    this.currentUser = user;
    this.notifyListeners();
  }

  clearUser() {
    localStorage.removeItem("coffee_user");
    this.currentUser = null;
    this.notifyListeners();
  }

  register(email, password, name) {
    return new Promise((resolve, reject) => {
      // Check if user already exists
      const existingUsers = this.getAllUsers();
      if (existingUsers.some((user) => user.email === email)) {
        reject(new Error("User already exists"));
        return;
      }

      // Create new user
      const user = {
        id: Date.now().toString(),
        email,
        name,
        password: this.hashPassword(password), // In production, use proper hashing
        createdAt: new Date().toISOString(),
        orders: [],
        favorites: [],
        isAdmin: email === "admin@coffeemasters.com", // Make admin@coffeemasters.com an admin
      };

      // Save to users list
      existingUsers.push(user);
      localStorage.setItem("coffee_users", JSON.stringify(existingUsers));

      // Set as current user (without password)
      const userProfile = { ...user };
      delete userProfile.password;
      this.saveUser(userProfile);

      resolve(userProfile);
    });
  }

  login(email, password) {
    return new Promise((resolve, reject) => {
      const users = this.getAllUsers();
      const user = users.find((u) => u.email === email);

      if (!user) {
        reject(new Error("User not found"));
        return;
      }

      if (user.password !== this.hashPassword(password)) {
        reject(new Error("Invalid password"));
        return;
      }

      const userProfile = { ...user };
      delete userProfile.password;
      this.saveUser(userProfile);
      resolve(userProfile);
    });
  }

  logout() {
    this.clearUser();
    window.dispatchEvent(new Event("authchange"));
  }

  getAllUsers() {
    const users = localStorage.getItem("coffee_users");
    return users ? JSON.parse(users) : [];
  }

  // Simple hash function (use bcrypt in production)
  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.isAdmin === true;
  }

  addToFavorites(productId) {
    if (!this.currentUser) return;

    if (!this.currentUser.favorites.includes(productId)) {
      this.currentUser.favorites.push(productId);
      this.saveUser(this.currentUser);
      this.updateUserInStorage();
    }
  }

  removeFromFavorites(productId) {
    if (!this.currentUser) return;

    const index = this.currentUser.favorites.indexOf(productId);
    if (index > -1) {
      this.currentUser.favorites.splice(index, 1);
      this.saveUser(this.currentUser);
      this.updateUserInStorage();
    }
  }

  isFavorite(productId) {
    return this.currentUser && this.currentUser.favorites.includes(productId);
  }

  addOrder(order) {
    if (!this.currentUser) return;

    const orderWithId = {
      ...order,
      id: Date.now().toString(),
      userId: this.currentUser.id,
      timestamp: new Date().toISOString(),
    };

    this.currentUser.orders.push(orderWithId);
    this.saveUser(this.currentUser);
    this.updateUserInStorage();

    return orderWithId;
  }

  getOrders() {
    return this.currentUser ? this.currentUser.orders : [];
  }

  updateUserInStorage() {
    const users = this.getAllUsers();
    const userIndex = users.findIndex((u) => u.id === this.currentUser.id);
    if (userIndex > -1) {
      users[userIndex] = {
        ...this.currentUser,
        password: users[userIndex].password,
      };
      localStorage.setItem("coffee_users", JSON.stringify(users));
    }
  }

  onAuthChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.currentUser));
    window.dispatchEvent(new Event("authchange"));
  }
}

export default new Auth();
