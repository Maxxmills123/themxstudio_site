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
    setVar("--toggle-height", h + "px");

    const cs = getComputedStyle(toggle);
    let offset = parseFloat(cs.bottom);
    if (!Number.isFinite(offset)) offset = 16;
    setVar("--toggle-offset", Math.round(offset) + "px");

    if (panel && isOpen()) {
      const panelRect = panel.getBoundingClientRect();
      setVar("--panel-width", Math.round(panelRect.width) + "px");
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
    const vh = window.innerHeight;
    const cs = getComputedStyle(document.documentElement);
    const safeTop =
      parseFloat(cs.getPropertyValue("--safe-area-inset-top")) || 0;
    const safeBottom =
      parseFloat(cs.getPropertyValue("--safe-area-inset-bottom")) || 0;

    const toggleOffset =
      parseFloat(cs.getPropertyValue("--toggle-offset")) || 16;
    const toggleHeight =
      parseFloat(cs.getPropertyValue("--toggle-height")) || 44;

    const available = Math.max(
      120,
      Math.floor(vh - (toggleOffset + toggleHeight + safeBottom + 8))
    );

    panel.style.maxHeight = available + "px";
    panel.style.height = "auto";
  }

  function openPanel() {
    if (isOpen()) return;

    lastFocused = document.activeElement;

    syncMetrics();
    fitPanel();

    root.classList.remove("nav-closed");
    root.setAttribute("data-open", "");
    root.removeAttribute("data-closing");
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
      const panelRect = panel.getBoundingClientRect();
      setVar("--panel-width", Math.round(panelRect.width) + "px");
    });

    setTimeout(() => {
      fitPanel();
      const panelRect = panel.getBoundingClientRect();
      setVar("--panel-width", Math.round(panelRect.width) + "px");
    }, 180);

    setTimeout(() => {
      fitPanel();
      const panelRect = panel.getBoundingClientRect();
      setVar("--panel-width", Math.round(panelRect.width) + "px");
    }, 360);
  }

  function closePanel() {
    if (!isOpen()) return;

    root.removeAttribute("data-open");
    root.setAttribute("data-closing", "");
    toggle.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
    setVar("--panel-width", "auto");

    function onDone() {
      root.removeAttribute("data-closing");
      root.classList.add("nav-closed");
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("keydown", trapFocus);
      document.removeEventListener("click", onDocClick, true);
      unlockScroll();
      if (lastFocused && document.contains(lastFocused)) {
        lastFocused.focus({ preventScroll: true });
      } else {
        toggle.focus({ preventScroll: true });
      }
    }

    function onPanelEnd(e) {
      if (e.target !== panel || e.propertyName !== "transform") return;
      panel.removeEventListener("transitionend", onPanelEnd);
      onDone();
    }

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
    toggle.blur();
    syncMetrics();
    togglePanel();
  });

  window.addEventListener("resize", keepNoGap);
  window.addEventListener("orientationchange", keepNoGap);

  new ResizeObserver(keepNoGap).observe(toggle);

  new ResizeObserver(() => {
    if (isOpen()) {
      fitPanel();
      const panelRect = panel.getBoundingClientRect();
      setVar("--panel-width", Math.round(panelRect.width) + "px");
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

  const aboutLink =
    panel.querySelector('a[href*="#about"]') ||
    root.querySelector('a[href*="#about"]');

  if (aboutLink) {
    aboutLink.addEventListener("click", () => {
      if (isOpen()) {
        closePanel();
      }
    });
  }

  root.classList.add("nav-closed");
  keepNoGap();
})();

document.addEventListener("DOMContentLoaded", () => {
  const accordion = document.querySelector("#skills-accordion");
  if (!accordion) return;

  const items = accordion.querySelectorAll(".about-accordion-item");

  items.forEach((item) => {
    const header = item.querySelector(".about-accordion-header");
    const panel = item.querySelector(".about-accordion-panel");
    if (!header || !panel) return;

    header.addEventListener("click", () => {
      const isExpanded = header.getAttribute("aria-expanded") === "true";
      const newState = !isExpanded;

      header.setAttribute("aria-expanded", String(newState));
      item.classList.toggle("is-open", newState);
      panel.hidden = !newState;
    });
  });
});
