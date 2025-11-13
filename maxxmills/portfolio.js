// portfolio.js
(function () {
  const root = document.querySelector(".nav-panel");
  if (!root) return;

  const html = document.documentElement;
  const toggle = root.querySelector(".menu-toggle");
  const panel = root.querySelector(".panel");
  const word = root.querySelector(".menu-word");
  if (!toggle || !panel || !word) return;

  const FOCUSABLE =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let lastFocused = null;

  function isOpen() {
    return root.hasAttribute("data-open");
  }

  function setVar(name, value) {
    html.style.setProperty(name, value);
  }

  function syncMetrics() {
    const tg = toggle.getBoundingClientRect();
    const h = Math.max(44, Math.round(tg.height));
    setVar("--toggle-height", `${h}px`);

    const cs = getComputedStyle(toggle);
    let offset = parseFloat(cs.bottom);
    if (!Number.isFinite(offset)) offset = 16;
    setVar("--toggle-offset", `${Math.round(offset)}px`);

    // Calculate panel width when it's visible
    if (panel && isOpen()) {
      const panelRect = panel.getBoundingClientRect();
      setVar("--panel-width", `${Math.round(panelRect.width)}px`);
    }
  }

  function lockScroll() {
    html.classList.add("no-scroll");
  }

  function unlockScroll() {
    html.classList.remove("no-scroll");
  }

  function trapFocus(e) {
    if (e.key !== "Tab") return;
    const nodes = panel.querySelectorAll(FOCUSABLE);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const a = document.activeElement;

    if (e.shiftKey && a === first) {
      e.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!e.shiftKey && a === last) {
      e.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  function fitPanel() {
    const vw = window.innerHeight;
    const cs = getComputedStyle(document.documentElement);
    const safeTop =
      parseFloat(cs.getPropertyValue("--safe-area-inset-top")) || 0;
    const safeBottom =
      parseFloat(cs.getPropertyValue("--safe-area-inset-bottom")) || 0;

    const toggleOffset =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--toggle-offset"
        )
      ) || 16;
    const toggleHeight =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--toggle-height"
        )
      ) || 44;

    const available = Math.max(
      120,
      Math.floor(vw - (toggleOffset + toggleHeight + safeBottom + 8))
    );

    panel.style.maxHeight = available + "px";
    panel.style.height = "auto";
  }

  function openPanel() {
    lastFocused = document.activeElement;

    syncMetrics();
    fitPanel();

    root.setAttribute("data-open", "");
    toggle.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
    lockScroll();

    document.addEventListener("keydown", onKeydown, { passive: true });
    document.addEventListener("keydown", trapFocus);
    document.addEventListener("click", onDocClick, true);

    queueMicrotask(() => {
      const first = panel.querySelector(FOCUSABLE);
      if (first) first.focus({ preventScroll: true });
    });

    requestAnimationFrame(() => {
      fitPanel();
      // Set panel width after animation frame to ensure panel is rendered
      const panelRect = panel.getBoundingClientRect();
      setVar("--panel-width", `${Math.round(panelRect.width)}px`);
    });

    setTimeout(() => {
      fitPanel();
      // Update panel width after animation
      const panelRect = panel.getBoundingClientRect();
      setVar("--panel-width", `${Math.round(panelRect.width)}px`);
    }, 180);

    setTimeout(() => {
      fitPanel();
      // Final panel width sync
      const panelRect = panel.getBoundingClientRect();
      setVar("--panel-width", `${Math.round(panelRect.width)}px`);
    }, 360);
  }

  function closePanel() {
    if (!isOpen()) return;

    root.removeAttribute("data-open");
    root.setAttribute("data-closing", "");
    toggle.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");

    // Reset panel width
    setVar("--panel-width", "auto");

    const onDone = () => {
      root.removeAttribute("data-closing");
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("keydown", trapFocus);
      document.removeEventListener("click", onDocClick, true);
      unlockScroll();
      if (lastFocused && document.contains(lastFocused)) {
        lastFocused.focus({ preventScroll: true });
      } else {
        toggle.focus({ preventScroll: true });
      }
    };

    const onPanelEnd = (e) => {
      if (e.target !== panel || e.propertyName !== "transform") return;
      panel.removeEventListener("transitionend", onPanelEnd);
      onDone();
    };
    panel.addEventListener("transitionend", onPanelEnd);
  }

  function onKeydown(e) {
    if (e.key === "Escape") closePanel();
  }

  function onDocClick(e) {
    if (!isOpen()) return;
    if (panel.contains(e.target) || toggle.contains(e.target)) return;
    closePanel();
  }

  function togglePanel() {
    if (isOpen()) closePanel();
    else openPanel();
  }

  function keepNoGap() {
    syncMetrics();
    fitPanel();
  }

  toggle.addEventListener("click", () => {
    syncMetrics();
    togglePanel();
  });

  window.addEventListener("resize", keepNoGap);
  window.addEventListener("orientationchange", keepNoGap);

  new ResizeObserver(keepNoGap).observe(toggle);
  new ResizeObserver(() => {
    if (isOpen()) {
      fitPanel();
      // Update panel width when panel resizes
      const panelRect = panel.getBoundingClientRect();
      setVar("--panel-width", `${Math.round(panelRect.width)}px`);
    }
  }).observe(panel);

  const contentTarget =
    panel.querySelector(".comments") ||
    panel.querySelector(".panel-content") ||
    panel;

  new ResizeObserver(() => {
    if (isOpen()) fitPanel();
  }).observe(contentTarget);

  const mo = new MutationObserver(() => {
    if (isOpen()) fitPanel();
  });
  mo.observe(contentTarget, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  keepNoGap();
})();
