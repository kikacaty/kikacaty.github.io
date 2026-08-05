(function () {
  var button = document.querySelector(".navbar-toggler");
  var menu = document.querySelector(".site-nav-links");

  if (!button || !menu) {
    return;
  }

  function setOpen(open) {
    menu.classList.toggle("is-open", open);
    button.classList.toggle("is-active", open);
    button.setAttribute("aria-expanded", String(open));
  }

  button.addEventListener("click", function () {
    setOpen(!menu.classList.contains("is-open"));
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      setOpen(false);
      button.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 672) {
      setOpen(false);
    }
  });
})();
