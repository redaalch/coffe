const Router = {
  init: () => {
    document.querySelectorAll("a.navlink").forEach((a) => {
      a.addEventListener("click", (event) => {
        event.preventDefault();
        const url = event.target.getAttribute("href");
        Router.go(url);
      });
      window.addEventListener("popstate",event=>{
        Router.go(event.state.route,false);
      })
    });
    Router.go(location.pathname);
  },
  go: (route, addToHistory = true) => {
    if (addToHistory) {
      history.pushState({ route }, "", route);
    }
    let pageElmenet = null;
    switch (route) {
      case "/":
        pageElmenet = document.createElement("menu-page");
        pageElmenet.textContent = "Menu";
        break;
      case "/order":
        pageElmenet = document.createElement("order-page");
        pageElmenet.textContent = "Your order";
        break;
      default:
        if (route.startsWith("/product-")) {
          pageElmenet = document.createElement("details-page");
          pageElmenet.textContent = "Details";
          const paramId = route.substring(route.lastIndexOf("-")+1);
          pageElmenet.dataset.id = paramId;
        }
    }
    if (pageElmenet) {
      const cache = document.querySelector("main");
      cache.innerHTML = "";
      cache.appendChild(pageElmenet);
      window.scrollX = 0;
      window.scrollY = 0;
    }
  },
};
export default Router;
