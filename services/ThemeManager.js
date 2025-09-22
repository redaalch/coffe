class ThemeManager {
  constructor() {
    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
    this.setupEventListeners();
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
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      const icon = themeToggle.querySelector(".material-symbols-outlined");
      if (icon) {
        icon.textContent =
          this.currentTheme === "light" ? "dark_mode" : "light_mode";
      }
    }
  }

  isDarkMode() {
    return this.currentTheme === "dark";
  }
}

export default new ThemeManager();
