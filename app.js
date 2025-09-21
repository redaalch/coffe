import Store from "./services/Store.js";
import API from "./services/Api.js";

window.app = {};
app.store = Store;

window.addEventListener("DOMContentLoaded", async() => {
  const menu = await API.fetchMenu();
});
