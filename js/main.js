// ===================================================
// Smooth Accordion + Hero Foreground Shrink/Dim
// - Outside Click Close
// - Scroll-to-top Close
// - Mobile: center active row on open
// ===================================================
(function () {
  const rows = Array.from(document.querySelectorAll(".expand-row"));
  if (!rows.length) return;

  const heroContent = document.querySelector(".hero-content");

  // Motion preferences
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const OPEN_DURATION = prefersReduced ? 0 : 600;
  const CLOSE_DURATION = prefersReduced ? 0 : 420;
  const OPEN_EASING = "cubic-bezier(0.25, 0.9, 0.25, 1)";
  const CLOSE_EASING = "cubic-bezier(0.3, 0.6, 0.15, 1)";

  // --------------------------------
  // Helpers
  // --------------------------------
  function centerActiveRow(row) {
    // Only center on small screens
    if (!window.matchMedia("(max-width: 640px)").matches) return;

    // Wait a tick for layout after animation triggers
    requestAnimationFrame(() => {
      const header = document.querySelector("header");
      const headerH = header ? header.offsetHeight : 0;

      const rect = row.getBoundingClientRect();
      const offset =
        rect.top +
        window.scrollY -
        Math.max(0, headerH) -
        (window.innerHeight / 2 - rect.height / 2);

      window.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    });
  }

  function expand(row) {
    const panel = row.querySelector(".row-more");
    if (!panel) return;

    panel.style.display = "block";
    panel.style.overflow = "clip";
    panel.style.setProperty("overflow-anchor", "none");
    if (panel._anim) panel._anim.cancel();

    const start = panel.offsetHeight;
    const target = panel.scrollHeight;

    if (OPEN_DURATION === 0) {
      panel.style.height = "auto";
      panel.style.opacity = "1";
      // Ensure we center even in reduced motion
      centerActiveRow(row);
      return;
    }

    panel._anim = panel.animate(
      [
        { height: `${start}px`, opacity: getComputedStyle(panel).opacity || 0 },
        { height: `${target}px`, opacity: 1 },
      ],
      { duration: OPEN_DURATION, easing: OPEN_EASING }
    );

    panel._anim.onfinish = () => {
      panel.style.height = "auto";
      panel.style.opacity = "1";
      panel._anim = null;
      centerActiveRow(row);
    };
  }

  function collapse(row) {
    const panel = row.querySelector(".row-more");
    if (!panel) return;

    if (panel._anim) panel._anim.cancel();
    const current = panel.offsetHeight;

    if (CLOSE_DURATION === 0) {
      panel.style.height = "0px";
      panel.style.opacity = "0";
      return;
    }

    panel._anim = panel.animate(
      [
        {
          height: `${current}px`,
          opacity: getComputedStyle(panel).opacity || 1,
        },
        { height: "0px", opacity: 0 },
      ],
      { duration: CLOSE_DURATION, easing: CLOSE_EASING }
    );

    panel._anim.onfinish = () => {
      panel.style.height = "0px";
      panel.style.opacity = "0";
      panel._anim = null;
    };
  }

  function closeAll(except = null) {
    rows.forEach((row) => {
      if (row !== except && row.getAttribute("aria-expanded") === "true") {
        row.classList.remove("is-active");
        row.setAttribute("aria-expanded", "false");
        collapse(row);
      }
    });
    if (!except && heroContent) heroContent.classList.remove("dimmed");
  }

  function updateHeroDim() {
    if (!heroContent) return;
    const anyOpen = rows.some(
      (r) => r.getAttribute("aria-expanded") === "true"
    );
    heroContent.classList.toggle("dimmed", anyOpen);
  }

  function toggleRow(row) {
    const isOpen = row.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      row.classList.remove("is-active");
      row.setAttribute("aria-expanded", "false");
      collapse(row);
    } else {
      closeAll(row);
      row.classList.add("is-active");
      row.setAttribute("aria-expanded", "true");
      expand(row);
    }
    updateHeroDim();
  }

  // --------------------------------
  // Initialize rows
  // --------------------------------
  rows.forEach((row) => {
    const panel = row.querySelector(".row-more");
    if (panel) {
      panel.style.height = "0px";
      panel.style.opacity = "0";
      panel.style.overflow = "clip";
      panel.style.setProperty("overflow-anchor", "none");
    }

    // Whole row clickable, but ignore interactive elements
    row.style.cursor = "pointer";
    row.setAttribute("tabindex", "0");
    row.setAttribute("role", "button");

    row.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input, textarea, select")) return;
      toggleRow(row);
    });

    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleRow(row);
      }
    });
  });

  // --------------------------------
  // Close all when scrolling to the very top
  // --------------------------------
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY <= 2) {
            closeAll();
          }
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  // --------------------------------
  // Close when clicking outside any row
  // --------------------------------
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".expand-row")) {
      closeAll();
    }
  });
})();
