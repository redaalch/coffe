import API from "./API.js";

const Store = {
  menu: null,
  cart: [],

  // Load cart from localStorage
  loadCart() {
    const savedCart = localStorage.getItem("coffee_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  },

  // Save cart to localStorage
  saveCart(cart) {
    localStorage.setItem("coffee_cart", JSON.stringify(cart));
  },
};

// Initialize cart from localStorage
Store.cart = Store.loadCart();

const proxiedStore = new Proxy(Store, {
  set(target, property, value) {
    target[property] = value;
    if (property == "menu") {
      window.dispatchEvent(new Event("appmenuchange"));
    }
    if (property == "cart") {
      target.saveCart(value);
      window.dispatchEvent(new Event("appcartchange"));
    }
    return true;
  },
});

export default proxiedStore;
