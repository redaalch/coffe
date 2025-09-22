export class AuthPage extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    const styles = document.createElement("style");
    this.root.appendChild(styles);
    const section = document.createElement("section");
    this.root.appendChild(section);

    async function loadCSS() {
      const request = await fetch("/coffe/components/AuthPage.css");
      styles.textContent = await request.text();
    }
    loadCSS();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const section = this.root.querySelector("section");
    section.innerHTML = `
      <div class="auth-container">
        <div class="auth-tabs">
          <button class="tab-button active" data-tab="login">Login</button>
          <button class="tab-button" data-tab="register">Register</button>
        </div>
        
        <div class="tab-content active" id="login-tab">
          <h2>Welcome Back</h2>
          <form id="login-form">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" name="email" required>
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" name="password" required>
            </div>
            <button type="submit" class="auth-button">Login</button>
          </form>
        </div>
        
        <div class="tab-content" id="register-tab">
          <h2>Create Account</h2>
          <form id="register-form">
            <div class="form-group">
              <label for="register-name">Full Name</label>
              <input type="text" id="register-name" name="name" required>
            </div>
            <div class="form-group">
              <label for="register-email">Email</label>
              <input type="email" id="register-email" name="email" required>
            </div>
            <div class="form-group">
              <label for="register-password">Password</label>
              <input type="password" id="register-password" name="password" required minlength="6">
            </div>
            <div class="form-group">
              <label for="register-confirm">Confirm Password</label>
              <input type="password" id="register-confirm" name="confirmPassword" required minlength="6">
            </div>
            <button type="submit" class="auth-button">Create Account</button>
          </form>
        </div>
        
        <div class="error-message" id="error-message"></div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab switching
    this.root.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Login form
    this.root
      .getElementById("login-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get("email");
        const password = formData.get("password");

        try {
          await app.auth.login(email, password);
          app.router.go("/");
        } catch (error) {
          this.showError(error.message);
        }
      });

    // Register form
    this.root
      .getElementById("register-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get("name");
        const email = formData.get("email");
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");

        if (password !== confirmPassword) {
          this.showError("Passwords do not match");
          return;
        }

        try {
          await app.auth.register(email, password, name);
          app.router.go("/");
        } catch (error) {
          this.showError(error.message);
        }
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

    this.clearError();
  }

  showError(message) {
    const errorElement = this.root.getElementById("error-message");
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }

  clearError() {
    const errorElement = this.root.getElementById("error-message");
    errorElement.style.display = "none";
  }
}

customElements.define("auth-page", AuthPage);
