/* ===================================================
   HERO BAND METRICS (retired)
   We keep a stub so other code calling __setHeroBand() won't explode.
=================================================== */
(function () {
  window.__setHeroBand = function noop() {};
})();

/* ===================================================
   Accordion + Hero skim/dim (instant reactions)
   - Starts CLOSED (including #how-it-works)
   - Close on outside click and near-top scroll
   - Center active row on small screens (only when toggling)
   - DOES NOT auto-scroll on page load
=================================================== */
(function () {
  const rows = Array.from(document.querySelectorAll(".expand-row"));
  if (!rows.length) return;

  const heroContent = document.querySelector(".hero-content");
  const root = document.documentElement;
  const ALWAYS_OPEN_ID = "how-it-works";

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const OPEN_DURATION = prefersReduced ? 0 : 600;
  const CLOSE_DURATION = prefersReduced ? 0 : 420;
  const OPEN_EASING = "cubic-bezier(0.25, 0.9, 0.25, 1)";
  const CLOSE_EASING = "cubic-bezier(0.3, 0.6, 0.15, 1)";

  // Prevent the browser from restoring scroll to a previously open accordion
  try {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  } catch {}

  // No-op stub is present; call it to keep existing hooks consistent
  const triggerBand = () => {
    if (typeof window.__setHeroBand === "function") window.__setHeroBand();
  };

  const anyOpenNonSticky = () =>
    rows.some(
      (r) =>
        r.id !== ALWAYS_OPEN_ID && r.getAttribute("aria-expanded") === "true"
    );

  function setDimPauseState(openAny) {
    if (heroContent) heroContent.classList.toggle("dimmed", openAny);
    root.classList.toggle("mx-accordion-open", openAny);
  }

  function centerActiveRow(row) {
    if (!window.matchMedia("(max-width: 640px)").matches) return;
    requestAnimationFrame(() => {
      const header =
        document.querySelector(".primary-nav") ||
        document.querySelector("header");
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
      panel._anim = null;
      centerActiveRow(row);
      triggerBand();
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
      triggerBand();
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
      panel._anim = null;
      triggerBand();
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
      triggerBand();
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
    if (!except) setDimPauseState(false);
  }

  function toggleRow(row) {
    const wasOpen = row.getAttribute("aria-expanded") === "true";

    if (row.id === ALWAYS_OPEN_ID) {
      closeAll(null);
      setDimPauseState(false);
      triggerBand();
      return;
    }

    if (wasOpen) {
      row.classList.remove("is-active");
      row.setAttribute("aria-expanded", "false");
      collapse(row);
      setDimPauseState(anyOpenNonSticky());
      triggerBand();
    } else {
      closeAll(row);
      row.classList.add("is-active");
      row.setAttribute("aria-expanded", "true");
      setDimPauseState(true);
      expand(row);
      triggerBand();
    }
  }

  rows.forEach((row) => {
    const panel = row.querySelector(".row-more");
    row.style.cursor = "pointer";
    row.setAttribute("tabindex", "0");
    row.setAttribute("role", "button");

    row.classList.remove("is-active");
    row.setAttribute("aria-expanded", "false");
    if (panel) {
      panel.style.display = "block";
      panel.style.height = "0px";
      panel.style.opacity = "0";
      panel.style.overflow = "clip";
      panel.style.setProperty("overflow-anchor", "none");
    }

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

  // Ensure nothing autoscrolls on first paint
  window.addEventListener("pageshow", () => {}, { once: true });

  setDimPauseState(false);
  triggerBand();

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY <= 2) {
            closeAll();
            triggerBand();
          }
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".expand-row")) {
      closeAll();
      triggerBand();
    }
  });

  // ---------- Mobile wobble visibility ----------
  (function setupWobbleVisibility() {
    const mobileMQ = window.matchMedia("(max-width: 768px)");
    const reducedMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const heads = Array.from(
      document.querySelectorAll(".expand-row:not(#how-it-works) .row-head")
    );
    if (!heads.length) return;

    function setVisible(el, yes) {
      if (yes) {
        el.classList.remove("is-visible");
        el.offsetWidth; // restart CSS animation
        el.classList.add("is-visible");
      } else {
        el.classList.remove("is-visible");
      }
    }
    function clearAll() {
      heads.forEach((h) => setVisible(h, false));
    }

    let ioInstance = null,
      teardown = null;

    function ioSetup() {
      if (!("IntersectionObserver" in window)) return null;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const visible =
              entry.isIntersecting && entry.intersectionRatio > 0.2;
            setVisible(entry.target, visible);
          });
        },
        { root: null, threshold: [0, 0.2, 0.5, 1] }
      );
      heads.forEach((h) => observer.observe(h));
      return observer;
    }

    function manualSetup() {
      let rafId = null;
      function check() {
        rafId = null;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        heads.forEach((h) => {
          const r = h.getBoundingClientRect();
          const visible = r.top < vh && r.bottom > 0 && r.height > 0;
          setVisible(h, visible);
        });
      }
      function onScroll() {
        if (rafId) return;
        rafId = requestAnimationFrame(check);
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      check();
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }

    function setup() {
      if (ioInstance) {
        ioInstance.disconnect();
        ioInstance = null;
      }
      if (teardown) {
        teardown();
        teardown = null;
      }
      clearAll();

      if (!mobileMQ.matches || reducedMQ.matches) return;
      ioInstance = ioSetup();
      if (!ioInstance) teardown = manualSetup();
    }

    setup();
    if (mobileMQ.addEventListener) mobileMQ.addEventListener("change", setup);
    else mobileMQ.addListener(setup);
    if (reducedMQ.addEventListener) reducedMQ.addEventListener("change", setup);
    else reducedMQ.addListener(setup);
  })();
})();

/* ===================================================
   Scroll indicator: ALWAYS visible (no auto-hide)
=================================================== */
(function () {
  const el = document.querySelector(".scroll-indicator");
  if (!el) return;
  el.style.opacity = "1";
  el.style.pointerEvents = "auto";
})();
