const API = {
  // url: "https://firtman.github.io/coffeemasters/api/menu.json",
  getUrl: () => {
    // Use the global path helper if available, otherwise fallback
    if (typeof window !== "undefined" && window.getPath) {
      return window.getPath("data/menu.json");
    }
    // Fallback for environments where window.getPath isn't available yet
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";
    const basePath = hostname.includes("github.io") ? "/coffe" : "";
    return basePath + "/data/menu.json";
  },
  fetchMenu: async () => {
    const url = API.getUrl();
    console.log("Fetching menu from:", url); // Debug log
    const result = await fetch(url);
    return await result.json();
  },
};

export default API;
