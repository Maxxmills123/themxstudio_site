// START: NAV JS
// mobile-nav-toggle.js
// Fullscreen slide-in mobile menu for .primary-nav
// - Outside click and scrim click to close
// - Esc to close
// - Link click closes
// - Scroll-lock on open
// - Breakpoint-aware (matches CSS max-width: 900px)

(function () {
  const nav = document.querySelector(".primary-nav");
  if (!nav) return;

  const toggle = nav.querySelector(".nav-toggle");
  const menu = nav.querySelector("#primary-menu");
  const scrim = nav.querySelector(".nav-scrim");
  if (!toggle || !menu) return;

  // Match CSS animation time for panel + icon morph
  const TRANSITION_MS = 600;

  const links = Array.from(nav.querySelectorAll(".nav-list a"));

  // Match the CSS breakpoint exactly
  const MQ = window.matchMedia("(max-width: 900px)");
  const isMobile = () => MQ.matches;
  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  // State guards
  let lastIsMobile = isMobile();
  let suppressResizeUntil = 0;
  let ignoreOutsideClickOnce = false; // blocks the outside-click that follows toggle

  // Icons are animated via CSS with [aria-expanded]; no DOM hiding.
  function setIcons(_open) {
    // no-op — keep both SVGs in the DOM; CSS handles cross-fade/rotate
  }

  function applyState() {
    const open = isOpen();
    nav.classList.toggle("is-open", isMobile() && open);

    // For sliding panels, keep menu in DOM while animating, then hide
    if (!isMobile()) {
      menu.hidden = true;
      scrim && (scrim.hidden = true);
      return;
    }
    menu.hidden = !open;
    scrim && (scrim.hidden = !open);
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
    if (!isMobile()) return;

    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    setIcons(true);

    // 1) Unhide so styles can compute
    menu.hidden = false;
    if (scrim) scrim.hidden = false;

    // 2) Force the START state explicitly (matches closed CSS)
    // This guarantees the first frame is off-screen & hidden
    menu.style.transform = "translateX(100%)";
    menu.style.visibility = "hidden";

    // 3) Force a reflow so the browser commits the START state
    // eslint-disable-next-line no-unused-expressions
    menu.getBoundingClientRect();

    // 4) Next animation frame: switch to OPEN state so it animates
    requestAnimationFrame(() => {
      // remove the inline START so CSS can animate to the open state
      menu.style.removeProperty("transform");
      menu.style.removeProperty("visibility");

      nav.classList.add("is-open"); // CSS will animate translateX to 0

      lockScroll();

      // guard resize jitter after scroll-lock
      suppressResizeUntil = performance.now() + 500;

      // prevent immediate outside-click close from same tap
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

    // Remove open state to start slide-out
    nav.classList.remove("is-open");

    // Hide after the animation finishes so it doesn’t pop
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

  // Toggle button
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  // Scrim click closes
  scrim &&
    scrim.addEventListener("click", () => {
      if (isOpen() && isMobile()) closeMenu();
    });

  // Outside click — capture phase and path-aware so SVGs/slots don’t trick it
  document.addEventListener(
    "click",
    (e) => {
      if (!isOpen() || !isMobile()) return;
      if (ignoreOutsideClickOnce) return;

      const path = e.composedPath ? e.composedPath() : [];
      const clickedInside =
        path.includes(nav) ||
        (e.target instanceof Node && nav.contains(e.target));
      if (!clickedInside) closeMenu();
    },
    { capture: true }
  );

  // Esc close
  document.addEventListener("keydown", (e) => {
    if (!isOpen() || !isMobile()) return;
    if (e.key === "Escape") closeMenu();
  });

  // Link click closes
  links.forEach((a) =>
    a.addEventListener("click", () => isMobile() && closeMenu())
  );

  // Only react on actual breakpoint flips; ignore generic resizes
  function onMediaFlip() {
    const mobileNow = isMobile();
    if (mobileNow !== lastIsMobile) {
      if (!mobileNow) {
        closeMenu(); // force closed on desktop
      } else {
        applyState(); // reflect current aria on mobile
      }
      lastIsMobile = mobileNow;
    }
  }
  MQ.addEventListener?.("change", onMediaFlip);
  MQ.addListener?.(onMediaFlip); // legacy

  // Best-effort: ignore random resizes without breakpoint change
  window.addEventListener(
    "resize",
    () => {
      if (performance.now() < suppressResizeUntil) return;
      if (isMobile()) applyState();
    },
    { passive: true }
  );

  // Scroll border toggle
  function updateScrollState() {
    if (window.scrollY > 2) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  // Initial state
  setIcons(isOpen());
  applyState();
})();
// END: NAV JS
