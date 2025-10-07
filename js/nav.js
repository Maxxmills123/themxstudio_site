// mobile-nav-toggle.js
// Stable mobile dropdown for .primary-nav
// - Outside click (capture, path-aware)
// - Esc close
// - Link click close
// - Only reacts on real breakpoint flips (matchMedia change)
// - Cooldown after scroll-lock to ignore phantom resizes

(function () {
  const nav = document.querySelector(".primary-nav");
  if (!nav) return;

  const toggle = nav.querySelector(".nav-toggle");
  const menu = nav.querySelector("#primary-menu");
  if (!toggle || !menu) return;

  const links = Array.from(nav.querySelectorAll(".nav-list a"));
  const iconMenu = toggle.querySelector(".icon-menu");
  const iconClose = toggle.querySelector(".icon-close");

  // Match the CSS breakpoint exactly
  const MQ = window.matchMedia("(max-width: 900px)");
  const isMobile = () => MQ.matches;
  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  // State guards
  let lastIsMobile = isMobile();
  let suppressResizeUntil = 0;
  let ignoreOutsideClickOnce = false; // blocks the outside-click that follows toggle

  function setIcons(open) {
    if (iconMenu) iconMenu.hidden = !!open;
    if (iconClose) iconClose.hidden = !open;
  }

  function applyState() {
    const open = isOpen();
    nav.classList.toggle("is-open", isMobile() && open);
    menu.hidden = !isMobile() ? true : !open;
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

    nav.classList.add("is-open");
    menu.hidden = false;
    lockScroll();

    // Ignore immediate jitter resizes after scroll-lock
    suppressResizeUntil = performance.now() + 500;

    // Prevent the very next outside-click from closing us (same user tap)
    ignoreOutsideClickOnce = true;
    setTimeout(() => {
      ignoreOutsideClickOnce = false;
    }, 0);

    const first = menu.querySelector(
      "a, button, [tabindex]:not([tabindex='-1'])"
    );
    first?.focus({ preventScroll: true });
  }

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    setIcons(false);

    nav.classList.remove("is-open");
    menu.hidden = true;
    unlockScroll();
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
    if (e.key === "Escape") {
      closeMenu();
      toggle.focus({ preventScroll: true });
    }
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
        closeMenu(); // desktop: force closed
      } else {
        applyState(); // mobile: reflect current aria
      }
      lastIsMobile = mobileNow;
    }
  }
  MQ.addEventListener?.("change", onMediaFlip);
  MQ.addListener?.(onMediaFlip); // legacy

  // Best-effort ignore random resizes without breakpoint change
  window.addEventListener(
    "resize",
    () => {
      if (performance.now() < suppressResizeUntil) return;
      // If we’re still mobile, just ensure DOM matches aria. No closing.
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
