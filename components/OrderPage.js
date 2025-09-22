export class OrderPage extends HTMLElement {
  #user = {
    name: "",
    phone: "",
    email: "",
  };

  constructor() {
    super();

    this.root = this.attachShadow({ mode: "open" });
    const styles = document.createElement("style");
    this.root.appendChild(styles);
    const section = document.createElement("section");
    this.root.appendChild(section);

    async function loadCSS() {
      const request = await fetch("/components/OrderPage.css");
      styles.textContent = await request.text();
    }
    loadCSS();
  }

  connectedCallback() {
    window.addEventListener("appcartchange", () => {
      this.render();
    });
    this.render();
  }

  render() {
    let section = this.root.querySelector("section");
    if (app.store.cart.length == 0) {
      section.innerHTML = `
          <p class="empty">Your order is empty</p>
      `;
    } else {
      let html = `
          <h2>Your Order</h2>
          <ul>
          </ul>
      `;
      section.innerHTML = html;

      const template = document.getElementById("order-form-template");
      const content = template.content.cloneNode(true);
      section.appendChild(content);

      let total = 0;
      for (let prodInCart of app.store.cart) {
        const item = document.createElement("cart-item");
        item.dataset.item = JSON.stringify(prodInCart);
        this.root.querySelector("ul").appendChild(item);

        total += prodInCart.quantity * prodInCart.product.price;
      }
      this.root.querySelector("ul").innerHTML += `
            <li>
                <p class='total'>Total</p>
                <p class='price-total'>$${total.toFixed(2)}</p>
            </li>                
        `;
    }
    this.setFormBindings(this.root.querySelector("form"));
  }
  setFormBindings(form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      // Calculate total
      let total = 0;
      for (let prodInCart of app.store.cart) {
        total += prodInCart.quantity * prodInCart.product.price;
      }

      // Create order object
      const order = {
        items: [...app.store.cart],
        total: total,
        customerInfo: { ...this.#user },
      };

      // Save order if user is authenticated
      if (app.auth.isAuthenticated()) {
        app.auth.addOrder(order);
      }

      alert(
        "Thanks for your order " +
          this.#user.name +
          "! Total: $" +
          total.toFixed(2)
      );

      // Clear cart and form
      app.store.cart = [];
      this.#user.name = "";
      this.#user.email = "";
      this.#user.phone = "";
      form.reset();
    });

    this.#user = new Proxy(this.#user, {
      set(target, property, value) {
        target[property] = value;
        if (form.elements[property]) {
          form.elements[property].value = value;
        }
        return true;
      },
    });

    Array.from(form.elements).forEach((element) => {
      element.addEventListener("change", (event) => {
        this.#user[element.name] = element.value;
      });
    });

    // Pre-fill form if user is authenticated
    if (app.auth.isAuthenticated()) {
      const user = app.auth.currentUser;
      this.#user.name = user.name;
      this.#user.email = user.email;
    }
  }
}
customElements.define("order-page", OrderPage);
