import API from "./Api.js";
export async function loadData() {
    API.fetchMenu();
    app.store.menu=await API.fetchMenu();
}