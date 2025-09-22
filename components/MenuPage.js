export class MenuPage extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.searchTerm = "";
    this.selectedCategory = "all";

    const styles = document.createElement("style");
    this.root.appendChild(styles);
    async function loadCSS() {
      const request = await fetch("/coffe/components/MenuPage.css");
      const css = await request.text();
      styles.textContent = css;
    }
    loadCSS();
  }

  connectedCallback() {
    const template = document.getElementById("menu-page-template");
    const content = template.content.cloneNode(true);
    this.root.appendChild(content);

    // Wait for the next tick to ensure DOM is ready
    setTimeout(() => {
      this.setupSearchAndFilters();
    }, 0);

    window.addEventListener("appmenuchange", () => {
      this.render();
    });
    this.render();
  }

  setupSearchAndFilters() {
    // Add search and filter controls
    const searchAndFilters = document.createElement("div");
    searchAndFilters.className = "search-filters";
    searchAndFilters.innerHTML = `
      <div class="search-container">
        <input type="text" id="search-input" placeholder="Search coffee, tea, snacks..." />
        <span class="search-icon material-symbols-outlined">search</span>
      </div>
      <div class="filter-container">
        <select id="category-filter">
          <option value="all">All Categories</option>
          <option value="HOT COFFEE">Hot Coffee</option>
          <option value="ICED COFFEE">Iced Coffee</option>
          <option value="TEA">Tea</option>
          <option value="SNACKS">Snacks</option>
        </select>
      </div>
    `;

    // Find the section and menu elements
    const section = this.root.querySelector("section");
    const menuElement = this.root.querySelector("#menu");

    if (section && menuElement) {
      section.insertBefore(searchAndFilters, menuElement);
    } else {
      console.error("Could not find section or menu element");
      return;
    }

    // Setup event listeners
    const searchInput = this.root.getElementById("search-input");
    const categoryFilter = this.root.getElementById("category-filter");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.render();
      });
    }

    if (categoryFilter) {
      categoryFilter.addEventListener("change", (e) => {
        this.selectedCategory = e.target.value;
        this.render();
      });
    }
  }

  filterProducts(products, categoryName) {
    let filtered = products;

    // Filter by search term
    if (this.searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(this.searchTerm) ||
          product.description.toLowerCase().includes(this.searchTerm)
      );
    }

    return filtered;
  }

  shouldShowCategory(categoryName) {
    return (
      this.selectedCategory === "all" || this.selectedCategory === categoryName
    );
  }

  render() {
    if (app.store.menu) {
      this.root.querySelector("#menu").innerHTML = "";

      let hasResults = false;

      for (let category of app.store.menu) {
        if (!this.shouldShowCategory(category.name)) {
          continue;
        }

        const filteredProducts = this.filterProducts(
          category.products,
          category.name
        );

        if (filteredProducts.length === 0) {
          continue;
        }

        hasResults = true;

        const liCategory = document.createElement("li");
        liCategory.innerHTML = `
        <h3>${category.name}</h3>
        <ul class='category'>

        </ul>`;
        liCategory.style.animation = "fadeIn 0.5s ease-out";
        this.root.querySelector("#menu").appendChild(liCategory);

        filteredProducts.forEach((product, index) => {
          const item = document.createElement("product-item");
          item.dataset.product = JSON.stringify(product);
          item.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s both`;
          liCategory.querySelector("ul").appendChild(item);
        });
      }

      if (!hasResults) {
        this.root.querySelector("#menu").innerHTML = `
          <div class="no-results">
            <p>No products found matching your search.</p>
            <p>Try a different search term or category.</p>
          </div>
        `;
      }
    } else {
      this.root.querySelector("#menu").innerHTML = `
        <div class="loading-container">
          <div class="loading"></div>
          <p>Loading delicious menu items...</p>
        </div>
      `;
    }
  }
}
customElements.define("menu-page", MenuPage);
