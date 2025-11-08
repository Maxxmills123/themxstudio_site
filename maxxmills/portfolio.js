// Accessible right-side drawer with focus return, ESC, and click-outside
(function () {
  const body = document.body;
  const toggle = document.querySelector(".hamburger");
  const drawer = document.getElementById("site-drawer");
  const scrim = document.querySelector("[data-scrim]");
  const closeX = drawer ? drawer.querySelector(".drawer-x") : null;
  const closeBtn = drawer ? drawer.querySelector(".drawer-close") : null; // now optional

  // required bits: toggle, drawer, scrim, and the X
  if (!toggle || !drawer || !scrim || !closeX) return;

  let lastFocused = null;

  const focusableSelectors =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function isOpen() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  function openDrawer() {
    lastFocused = document.activeElement;

    toggle.setAttribute("aria-expanded", "true");
    drawer.setAttribute("aria-hidden", "false");

    scrim.hidden = false;
    requestAnimationFrame(() => scrim.setAttribute("data-show", ""));

    body.classList.add("no-scroll");

    // focus first focusable in drawer
    const firstFocusable =
      drawer.querySelector(focusableSelectors) || closeX || toggle;
    firstFocusable.focus();
  }

  function closeDrawer() {
    toggle.setAttribute("aria-expanded", "false");
    drawer.setAttribute("aria-hidden", "true");

    scrim.removeAttribute("data-show");
    body.classList.remove("no-scroll");

    setTimeout(() => {
      scrim.hidden = true;
    }, 250);

    // return focus to hamburger
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    } else {
      toggle.focus();
    }
  }

  // Toggle menu
  toggle.addEventListener("click", () => {
    isOpen() ? closeDrawer() : openDrawer();
  });

  // Close with X (required)
  closeX.addEventListener("click", closeDrawer);

  // Optional bottom close button (only wire if present)
  if (closeBtn) {
    closeBtn.addEventListener("click", closeDrawer);
  }

  // Click scrim to close
  scrim.addEventListener("click", closeDrawer);

  // Keyboard controls
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      e.preventDefault();
      closeDrawer();
    }

    if (e.key === "Tab" && isOpen()) {
      const nodes = drawer.querySelectorAll(focusableSelectors);
      if (!nodes.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
})();
