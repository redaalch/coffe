import API from "./API.js";

export async function loadData() {
  console.log("Starting to load menu data...");
  try {
    app.store.menu = await API.fetchMenu();
    console.log("Menu data loaded successfully:", app.store.menu);
  } catch (error) {
    console.error("Failed to load menu data:", error);
  }
}
export async function getProductById(id) {
  if (app.store.menu == null) {
    await loadData();
  }
  for (let c of app.store.menu) {
    for (let p of c.products) {
      if (p.id == id) {
        return p;
      }
    }
  }
  return null;
}
