/* ==========================================================================
   Bot One — Vanilla JS
   Smooth scroll, mobile nav, scroll animations, nav background effect.
   No dependencies.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Elements ---------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("nav-toggle");
  var navMenu = document.getElementById("nav-menu");
  var animateElements = document.querySelectorAll(".animate");
  var navLinks = document.querySelectorAll(".nav-link, .nav-cta");

  /* ---------- Smooth Scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = this.getAttribute("href");

      // Ignore plain "#" links
      if (!href || href === "#") return;

      var target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      // Close mobile nav if open
      if (navMenu) navMenu.classList.remove("open");
      if (navToggle) {
        navToggle.classList.remove("active");
        navToggle.setAttribute("aria-expanded", "false");
      }

      document.body.style.overflow = "";

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  /* ---------- Mobile Nav Toggle ---------- */
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMenu.classList.toggle("open");
      navToggle.classList.toggle("active", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    // Close menu when clicking nav links
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        navMenu.classList.remove("open");
        navToggle.classList.remove("active");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        navMenu.classList.remove("open");
        navToggle.classList.remove("active");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        closeCommands();
      }
    });
  }

  /* ---------- Commands Slide-over ---------- */
  var commandsToggle = document.getElementById("commands-toggle");
  var commandsPanel  = document.getElementById("commands-panel");
  var commandsOverlay = document.getElementById("commands-overlay");
  var commandsClose  = document.getElementById("commands-close");

  function openCommands() {
    commandsPanel.classList.add("active");
    commandsOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeCommands() {
    commandsPanel.classList.remove("active");
    commandsOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (commandsToggle) {
    commandsToggle.addEventListener("click", function (e) {
      e.preventDefault();
      // Close mobile nav if open
      if (navMenu) navMenu.classList.remove("open");
      if (navToggle) {
        navToggle.classList.remove("active");
        navToggle.setAttribute("aria-expanded", "false");
      }
      openCommands();
    });
  }

  if (commandsClose) {
    commandsClose.addEventListener("click", closeCommands);
  }

  if (commandsOverlay) {
    commandsOverlay.addEventListener("click", closeCommands);
  }

  /* ---------- Nav Scroll Effect ---------- */
  function onScroll() {
    if (!nav) return;

    if (window.scrollY > 40) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll Animations ---------- */
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    animateElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    animateElements.forEach(function (el) {
      el.classList.add("visible");
    });
  }
})();
