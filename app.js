window.addEventListener("DOMContentLoaded", () => {
  let nav = document.querySelector("nav");
  nav.innerHTML;
});
const $ = function(args){ return document.querySelector(args);}
const $$ = function(args){ return document.querySelectorAll(args);}

HTMLElement.prototype.on = function(a, b, c){ return this.addEventListener(a, b, c); }
HTMLElement.prototype.off = function(a, b){ return this.removeEventListener(a, b); }
HTMLElement.prototype.$ = function(s){ return this.querySelector(s); }
HTMLElement.prototype.$$ = function(s){ return this.querySelectorAll(s); }