const Router = {
  init: () => {
    document.querySelectorAll("a.navlink").forEach((a) => {
      a.addEventListener("click", (event) => {
        event.preventDefault();
        const url = event.target.getAttribute("href");
        Router.go(url);
      });
    });
    Router.go(location.pathname);
  },
  go: (route, addToHistory = true) => {
    if(addToHistory) {
        history.pushState({route},'',route);
    }
    let pageElmenet=null
    switch (route) {
        case "/":
            pageElmenet = document.createElement("h1");
            pageElmenet.textContent ="Menu";
            break;
        case "/order":
            pageElmenet = document.createElement("h1");
            pageElmenet.textContent ="Your order";
            break;
    }
    document.querySelector("main").appendChild(pageElmenet);
  },
};
export default Router;
