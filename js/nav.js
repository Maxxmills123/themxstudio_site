// nav drawer
(function () {
  const nav = document.querySelector(".primary-nav");
  if (!nav) return;

  const toggle = nav.querySelector(".nav-toggle");
  const menu = nav.querySelector("#primary-menu");
  const scrim = nav.querySelector(".nav-scrim");
  if (!toggle || !menu) return;

  const TRANSITION_MS = 600;
  const links = Array.from(nav.querySelectorAll(".nav-list a"));
  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  let suppressResizeUntil = 0;
  let ignoreOutsideClickOnce = false;

  function setIcons(_open) {}

  function applyState() {
    const open = isOpen();
    nav.classList.toggle("is-open", open);
    menu.hidden = !open;
    if (scrim) scrim.hidden = !open;
  }

  function lockScroll() {
    document.documentElement.classList.add("nav-lock");
    document.body.classList.add("nav-lock");
  }
  function unlockScroll() {
    document.documentElement.classList.remove("nav-lock");
    document.body.classList.remove("nav-lock");
  }

  function openMenu() {
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    setIcons(true);
dd
    menu.hidden = false;
    if (scrim) scrim.hidden = false;


    menu.style.transform = "translateX(100%)";
    menu.style.visibility = "hidden";
    menu.getBoundingClientRect();

    requestAnimationFrame(() => {
      menu.style.removeProperty("transform");
      menu.style.removeProperty("visibility");

      nav.classList.add("is-open");
      lockScroll();

      suppressResizeUntil = performance.now() + 500;

      ignoreOutsideClickOnce = true;
      setTimeout(() => {
        ignoreOutsideClickOnce = false;
      }, 0);

      const first = menu.querySelector(
        "a, button, [tabindex]:not([tabindex='-1'])"
      );
      first?.focus({ preventScroll: true });
    });
  }

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    setIcons(false);

    nav.classList.remove("is-open");

    setTimeout(() => {
      menu.hidden = true;
      if (scrim) scrim.hidden = true;
    }, TRANSITION_MS);

    unlockScroll();
    toggle.focus({ preventScroll: true });
  }

  function toggleMenu() {
    isOpen() ? closeMenu() : openMenu();
  }

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  scrim &&
    scrim.addEventListener("click", () => {
      if (isOpen()) closeMenu();
    });

  document.addEventListener(
    "click",
    (e) => {
      if (!isOpen()) return;
      if (ignoreOutsideClickOnce) return;

      const path = e.composedPath ? e.composedPath() : [];
      const clickedInside =
        path.includes(nav) ||
        (e.target instanceof Node && nav.contains(e.target));
      if (!clickedInside) closeMenu();
    },
    { capture: true }
  );

  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") closeMenu();
  });

  links.forEach((a) => a.addEventListener("click", () => closeMenu()));

  // keep transitions happy during resize; state is width-agnostic now
  window.addEventListener(
    "resize",
    () => {
      if (performance.now() < suppressResizeUntil) return;
      applyState();
    },
    { passive: true }
  );

  function updateScrollState() {
    if (window.scrollY > 2) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  setIcons(isOpen());
  applyState();
})();

// mobile drawer accordions
(function () {
  const root = document;
  const nav = root.querySelector(".primary-nav");
  const navMenu = root.querySelector(".nav-menu");
  if (!navMenu) return;

  function setOpenState(acc, open) {
    if (!acc) return;
    acc.classList.toggle("open", open);
    const btn = acc.querySelector(".nav-accordion-toggle");
    if (btn) btn.setAttribute("aria-expanded", String(open));
  }

  function closeAllAccordions(except) {
    navMenu.querySelectorAll(".nav-accordion.open").forEach((acc) => {
      if (acc !== except) setOpenState(acc, false);
    });
  }

  navMenu.addEventListener("click", (e) => {
    const toggle = e.target.closest(".nav-accordion-toggle");
    if (!toggle) return;

    const acc = toggle.closest(".nav-accordion");
    const open = toggle.getAttribute("aria-expanded") === "true";
    closeAllAccordions(acc);
    setOpenState(acc, !open);
  });

  navMenu.addEventListener("keydown", (e) => {
    const toggle = e.target.closest(".nav-accordion-toggle");
    if (!toggle) {
      if (e.key === "Escape") {
        closeAllAccordions();
        const navToggle = root.querySelector(
          '.nav-toggle[aria-expanded="true"]'
        );
        if (nav && nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          if (navToggle) navToggle.setAttribute("aria-expanded", "false");
        }
      }
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle.click();
    }
  });

  root.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target)) {
      closeAllAccordions();
    }
  });

  navMenu.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-accordion-menu a");
    if (!link) return;

    const acc = e.target.closest(".nav-accordion");
    setOpenState(acc, false);

    const navToggle = root.querySelector('.nav-toggle[aria-expanded="true"]');
    if (nav && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    }
  });
})();

// desktop dropdown (hover + focus)
document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.querySelector(".nav-drop");
  if (!dropdown) return;
  const trigger = dropdown.querySelector(".nav-drop-trigger");

  let hoverTimer;

  function open() {
    dropdown.classList.add("open");
  }

  function close() {
    dropdown.classList.remove("open");
  }

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    dropdown.classList.toggle("open");
  });

  dropdown.addEventListener("mouseenter", () => {
    clearTimeout(hoverTimer);
    open();
  });

  dropdown.addEventListener("mouseleave", () => {
    hoverTimer = setTimeout(close, 150);
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) close();
  });
});

// desktop dropdown (chevron swap + keyboard focus mgmt)
document.addEventListener("DOMContentLoaded", () => {
  const drop = document.querySelector(".nav-drop");
  if (!drop) return;

  const trigger = drop.querySelector(".nav-drop-trigger");
  const menu = drop.querySelector(".nav-drop-menu");
  const chev = trigger.querySelector(".chev");

  function open() {
    drop.classList.add("open");
    if (chev) chev.textContent = "▴";
  }

  function close() {
    drop.classList.remove("open");
    if (chev) chev.textContent = "▾";
  }

  drop.addEventListener("mouseenter", open);
  drop.addEventListener("mouseleave", close);

  trigger.addEventListener("click", (e) => e.preventDefault());

  document.addEventListener("click", (e) => {
    if (!drop.contains(e.target)) close();
  });

  drop.addEventListener("focusin", open);
  drop.addEventListener("focusout", (e) => {
    if (!drop.contains(e.relatedTarget)) close();
  });

  close();
});
