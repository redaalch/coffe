const Router = {
  init: () => {
    document.querySelectorAll("a.navlink").forEach((a) => {
      a.addEventListener("click", (event) => {
        event.preventDefault();
        const url = event.target.getAttribute("href");
        Router.go(url);
      });
    });
    window.addEventListener("popstate", (event) => {
      Router.go(event.state?.route || location.pathname, false);
    });
    // Handle initial load - get the current path and route to it
    Router.go(location.pathname);
  },
  go: (route, addToHistory = true) => {
    if (addToHistory) {
      history.pushState({ route }, "", route);
    }
    let pageElement = null;
    switch (route) {
      case "/":
        pageElement = document.createElement("menu-page");
        break;
      case "/order":
        pageElement = document.createElement("order-page");
        break;
      case "/auth":
        pageElement = document.createElement("auth-page");
        break;
      case "/profile":
        pageElement = document.createElement("profile-page");
        break;
      default:
        if (route.startsWith("/product-")) {
          pageElement = document.createElement("details-page");
          pageElement.textContent = "Details";
          const paramId = route.substring(route.lastIndexOf("-") + 1);
          pageElement.dataset.id = paramId;
        } else {
          // For unknown routes, redirect to home
          console.log(`Unknown route: ${route}, redirecting to home`);
          Router.go("/", true);
          return;
        }
    }
    if (pageElement) {
      const cache = document.querySelector("main");
      cache.innerHTML = "";
      cache.appendChild(pageElement);
      window.scrollX = 0;
      window.scrollY = 0;
    }
  },
};
export default Router;
