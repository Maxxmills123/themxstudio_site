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

// pager.js — firm panel pager with internal scroll, anchor support, and pixel-precise page height
(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  function init() {
    // In case your drawer code left these hanging
    document.documentElement.classList.remove("nav-lock");
    document.body.classList.remove("nav-lock", "no-scroll");

    const pager = document.getElementById("pager");
    if (!pager) return;

    const track = pager.querySelector(".track");
    const panels = Array.from(pager.querySelectorAll(".panel"));
    if (!track || panels.length === 0) return;

    // Map id → index for anchors like #about
    const idToIndex = new Map();
    panels.forEach((p, idx) => {
      if (p.id) idToIndex.set(p.id, idx);
    });

    // ---- Timing / thresholds ----
    const TRANSITION_MS = 650;
    const WHEEL_THRESHOLD = 60;
    const WHEEL_QUIET_MS = 180;
    const SWIPE_THRESHOLD = 60;
    const EDGE_EPS = 2;

    // ---- State ----
    let index = 0; // active panel
    let animLocked = false; // while track animates, ignore inputs
    let PAGE_PX = 0; // pixel-precise viewport height

    // Wheel gesture gate
    let wheelAccum = 0;
    let wheelFired = false;
    let wheelTimer = null;

    // Touch gesture gate
    let startY = null;
    let touchFired = false;
    let touchPanel = null;

    // ---- Utilities ----
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    const atTop = (panel) => panel.scrollTop <= EDGE_EPS;

    const atBottom = (panel) =>
      Math.ceil(panel.scrollTop + panel.clientHeight) >=
      Math.floor(panel.scrollHeight) - EDGE_EPS;

    // Can panel scroll in the direction of deltaY?
    function panelCanScroll(panel, deltaY) {
      if (!panel) return false;
      const fits = panel.scrollHeight <= panel.clientHeight + EDGE_EPS;
      if (fits) return false; // treat short panels as non-scrollable pages
      if (deltaY > 0) return !atBottom(panel); // scrolling down
      if (deltaY < 0) return !atTop(panel); // scrolling up
      return false;
    }

    // Ensure any panel shorter than the viewport is promoted to full viewport height
    function enforceMinHeights() {
      panels.forEach((p) => {
        // If author CSS already makes it taller than viewport, leave it alone
        const current = Math.max(p.clientHeight, p.scrollHeight);
        if (current + 0.5 < PAGE_PX) {
          p.style.minHeight = PAGE_PX + "px";
        } else {
          // don’t force down taller panels; clear any prior inline min-height
          if (p.style.minHeight) p.style.minHeight = "";
        }
      });
    }

    // Height sync
    function updatePageHeight() {
      PAGE_PX = window.innerHeight; // true viewport pixels
      document.documentElement.style.setProperty("--page-h", PAGE_PX + "px");

      // Make short panels behave like full pages
      enforceMinHeights();

      // snap current transform exactly to the new height
      setTransformFor(index, { instant: true });
    }

    // Transform helper now uses pixel math
    function setTransformFor(i, { instant = false } = {}) {
      if (instant) {
        const prev = track.style.transition;
        track.style.transition = "none";
        track.style.transform = `translateY(${i * -PAGE_PX}px)`;
        // force reflow
        // eslint-disable-next-line no-unused-expressions
        track.offsetHeight;
        track.style.transition = prev || "";
      } else {
        track.style.transform = `translateY(${i * -PAGE_PX}px)`;
      }
    }

    function goto(next, { instant = false } = {}) {
      next = clamp(next, 0, panels.length - 1);
      if (next === index && !instant) return;

      animLocked = !instant;
      index = next;
      setTransformFor(index, { instant });

      if (!instant) {
        setTimeout(() => {
          animLocked = false;
        }, TRANSITION_MS);
      }
      resetWheelGate();
      resetTouchGate();

      // Focus for a11y
      const target = panels[index];
      if (target && typeof target.focus === "function") {
        setTimeout(
          () => target.focus({ preventScroll: true }),
          instant ? 0 : 350
        );
      }
    }

    function resetWheelGate() {
      wheelAccum = 0;
      wheelFired = false;
      clearTimeout(wheelTimer);
      wheelTimer = null;
    }

    function resetTouchGate() {
      startY = null;
      touchFired = false;
      touchPanel = null;
    }

    // Initial height + position (respect hash if it targets a panel)
    updatePageHeight();
    const initialIndex = indexFromHash(location.hash, idToIndex) ?? 0;
    goto(initialIndex, { instant: true });

    // Keep height synced on resize and mobile UI changes
    let resizeRAF = null;
    window.addEventListener("resize", () => {
      if (resizeRAF) cancelAnimationFrame(resizeRAF);
      resizeRAF = requestAnimationFrame(updatePageHeight);
    });

    // Late layout shifts (fonts/images): re-enforce once after load
    window.addEventListener(
      "load",
      () => {
        updatePageHeight();
        // some images lazy-load; recheck shortly after
        setTimeout(updatePageHeight, 250);
      },
      { once: true }
    );

    // hash navigation
    window.addEventListener("hashchange", () => {
      const idx = indexFromHash(location.hash, idToIndex);
      if (idx != null) goto(idx);
    });

    // Intercept anchor clicks to panel IDs
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = decodeURIComponent(a.getAttribute("href").slice(1));
      if (!id) return;
      const idx = idToIndex.get(id);
      if (idx == null) return; // not a panel, let it be

      e.preventDefault();
      if (location.hash !== `#${id}`) {
        history.pushState(null, "", `#${id}`);
      }
      goto(idx);
    });

    // Wheel / trackpad: one move per gesture; allow internal scroll first
    window.addEventListener(
      "wheel",
      (e) => {
        const currentPanel = panels[index];
        const dy = e.deltaY || 0;

        // If panel can scroll in this direction, let it scroll natively.
        if (!animLocked && panelCanScroll(currentPanel, dy)) {
          resetWheelGate(); // don’t snap immediately when leaving the edge
          return;
        }

        // Otherwise, we own it: prevent native scroll and snap once per gesture
        e.preventDefault();
        e.stopPropagation();
        if (animLocked) return;

        wheelAccum += dy;
        if (!wheelFired && Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
          wheelFired = true;
          if (wheelAccum > 0) goto(index + 1);
          else goto(index - 1);
        }

        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(resetWheelGate, WHEEL_QUIET_MS);
      },
      { passive: false }
    );

    // Keyboard
    window.addEventListener("keydown", (e) => {
      if (animLocked) return;

      const currentPanel = panels[index];
      const k = e.key;

      if (k === "ArrowDown" || k === "PageDown" || k === " ") {
        if (panelCanScroll(currentPanel, 1)) return;
        e.preventDefault();
        goto(index + 1);
      } else if (k === "ArrowUp" || k === "PageUp") {
        if (panelCanScroll(currentPanel, -1)) return;
        e.preventDefault();
        goto(index - 1);
      } else if (k === "Home") {
        e.preventDefault();
        goto(0);
      } else if (k === "End") {
        e.preventDefault();
        goto(panels.length - 1);
      }
    });

    // Touch: allow internal scroll; snap at edges
    window.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) return;
        startY = e.touches[0].clientY;
        touchPanel = e.target.closest(".panel") || panels[index];
        touchFired = false;
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (startY == null) return;
        const dy = e.touches[0].clientY - startY;

        // If panel can still scroll in this direction, let it
        const intendedDeltaY = -dy; // swipe up → go down
        if (!animLocked && panelCanScroll(touchPanel, intendedDeltaY)) {
          return; // native panel scroll
        }

        // At an edge: one snap per swipe
        if (!touchFired && Math.abs(dy) >= SWIPE_THRESHOLD) {
          e.preventDefault();
          touchFired = true;
          if (dy < 0) goto(index + 1);
          else goto(index - 1);
          resetTouchGate();
        }
      },
      { passive: false }
    );

    window.addEventListener("touchend", resetTouchGate);
  }

  function indexFromHash(hash, map) {
    if (!hash || hash.length < 2) return null;
    const id = decodeURIComponent(hash.slice(1));
    return map.get(id) ?? null;
  }
})();
