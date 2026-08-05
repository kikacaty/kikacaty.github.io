(function () {
  var archive = document.querySelector(".publication-archive");

  if (!archive) {
    return;
  }

  var links = Array.prototype.slice.call(
    archive.querySelectorAll("[data-publication-year]")
  );
  var sections = Array.prototype.slice.call(
    archive.querySelectorAll("[data-publication-year-section]")
  );
  var ticking = false;

  function setActiveYear(year) {
    links.forEach(function (link) {
      var isActive = link.getAttribute("data-publication-year") === year;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateTimeline() {
    ticking = false;

    if (!archive.open || sections.length === 0) {
      return;
    }

    var activeSection = sections[0];

    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= 180) {
        activeSection = section;
      }
    });

    setActiveYear(activeSection.getAttribute("data-publication-year-section"));
  }

  function requestTimelineUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateTimeline);
      ticking = true;
    }
  }

  archive.addEventListener("toggle", function () {
    if (archive.open) {
      requestTimelineUpdate();
    }
  });

  window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
  window.addEventListener("resize", requestTimelineUpdate);
})();
