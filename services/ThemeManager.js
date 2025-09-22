class ThemeManager {
  constructor() {
    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
    this.setupEventListeners();

    // Ensure theme toggles are updated after DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => this.updateThemeToggle(), 100);
    });
  }

  loadTheme() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("coffee_theme");
    if (savedTheme) {
      return savedTheme;
    }

    // Check for system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  }

  saveTheme(theme) {
    localStorage.setItem("coffee_theme", theme);
    this.currentTheme = theme;
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.updateThemeToggle();
    window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }

  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.saveTheme(newTheme);
    this.applyTheme(newTheme);

    // Force immediate update
    setTimeout(() => {
      this.updateThemeToggle();
    }, 50);
  }

  setupEventListeners() {
    // Listen for system theme changes
    if (window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          if (!localStorage.getItem("coffee_theme")) {
            // Only auto-switch if user hasn't set a preference
            const newTheme = e.matches ? "dark" : "light";
            this.currentTheme = newTheme;
            this.applyTheme(newTheme);
          }
        });
    }
  }

  updateThemeToggle() {
    // Update desktop theme toggle
    const themeToggle = document.getElementById("theme-toggle");

    if (themeToggle) {
      // Check if it has the material-symbols-outlined class directly
      if (themeToggle.classList.contains("material-symbols-outlined")) {
        const newIcon =
          this.currentTheme === "light" ? "dark_mode" : "light_mode";
        themeToggle.textContent = newIcon;
      } else {
        // Look for nested icon element
        const icon = themeToggle.querySelector(".material-symbols-outlined");

        if (icon) {
          const newIcon =
            this.currentTheme === "light" ? "dark_mode" : "light_mode";
          icon.textContent = newIcon;
        }
      }
    }

    // Update mobile theme toggle
    const mobileThemeToggle = document.getElementById("mobile-theme-toggle");
    if (mobileThemeToggle) {
      const icon = mobileThemeToggle.querySelector(
        ".material-symbols-outlined"
      );
      const text = mobileThemeToggle.querySelector(".nav-text");

      if (icon && text) {
        if (this.currentTheme === "light") {
          // Currently in light mode, show dark mode option
          icon.textContent = "dark_mode";
          text.textContent = "Dark Mode";
        } else {
          // Currently in dark mode, show light mode option
          icon.textContent = "wb_sunny";
          text.textContent = "Light Mode";
        }
      }
    }
  }

  isDarkMode() {
    return this.currentTheme === "dark";
  }
}

export default new ThemeManager();
