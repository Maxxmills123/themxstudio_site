const dropdowns = Array.from(document.querySelectorAll(".nav__item--dropdown"));

(() => {
  const normalizePath = (value) => {
    if (!value) return "/";
    const path = value
      .split("#")[0]
      .split("?")[0]
      .replace(/index\.html$/i, "");
    if (!path || path === "") return "/";
    return path.endsWith("/") ? path : `${path}/`;
  };

  const currentPath = normalizePath(window.location.pathname || "/");
  const links = document.querySelectorAll(".site-header__nav .nav__link[href]");

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    if (link.classList.contains("nav__trigger")) return;

    const linkPath = normalizePath(
      new URL(href, window.location.origin).pathname,
    );
    if (linkPath.startsWith("/services/")) return;

    if (linkPath === currentPath) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
})();

if (dropdowns.length) {
  const closeDelayMs = 200;

  const closeDropdown = (dropdown, { blur = false } = {}) => {
    const trigger = dropdown.querySelector(".nav__trigger");
    const closeTimer = dropdown._closeTimer;
    if (closeTimer) clearTimeout(closeTimer);
    dropdown.classList.remove("is-open");
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      if (blur) trigger.blur();
    }
    dropdown._closeTimer = null;
  };

  const closeOthers = (activeDropdown) => {
    dropdowns.forEach((dropdown) => {
      if (dropdown !== activeDropdown) closeDropdown(dropdown);
    });
  };

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector(".nav__trigger");
    if (!trigger) return;

    const open = () => {
      const closeTimer = dropdown._closeTimer;
      if (closeTimer) clearTimeout(closeTimer);
      closeOthers(dropdown);
      dropdown.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      dropdown._closeTimer = null;
    };

    const scheduleClose = () => {
      const closeTimer = dropdown._closeTimer;
      if (closeTimer) clearTimeout(closeTimer);
      dropdown._closeTimer = setTimeout(() => {
        closeDropdown(dropdown);
      }, closeDelayMs);
    };

    dropdown.addEventListener("mouseenter", open);
    dropdown.addEventListener("mouseleave", scheduleClose);
    dropdown.addEventListener("focusin", open);
    dropdown.addEventListener("focusout", scheduleClose);

    trigger.addEventListener("click", () => {
      const isOpen = dropdown.classList.contains("is-open");
      if (isOpen) closeDropdown(dropdown);
      else open();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdowns.forEach((dropdown) => closeDropdown(dropdown, { blur: true }));
    }
  });
}

const burger = document.querySelector(".site-header__burger");
const mobilePanel = document.querySelector(".mobile-panel");
const mobileMenuHeader = burger?.closest(".site-header") || null;

let scrollY = 0;
let menuCloseTimer = null;
const menuTransitionMs = 140;
const mobileUiAfterMenuClose = {
  active: false,
  anchorY: 0,
};

const armMobileUiAfterMenuClose = (
  y = window.scrollY || window.pageYOffset || 0,
) => {
  mobileUiAfterMenuClose.active = true;
  mobileUiAfterMenuClose.anchorY = y;
};

const shouldHoldMobileUiAfterMenuClose = (releaseThreshold = 4) => {
  if (!mobileUiAfterMenuClose.active) return false;
  const y = window.scrollY || window.pageYOffset || 0;
  if (y > mobileUiAfterMenuClose.anchorY + releaseThreshold) {
    mobileUiAfterMenuClose.active = false;
    return false;
  }
  return true;
};

const lockScroll = () => {
  scrollY = window.scrollY || window.pageYOffset || 0;
};

const syncMobilePanelHeight = () => {
  if (!burger || !mobilePanel) return;

  const headerWrap = burger.closest(".site-header__wrap");
  const anchorRect = headerWrap
    ? headerWrap.getBoundingClientRect()
    : burger.getBoundingClientRect();
  const viewportHeight =
    window.visualViewport?.height ||
    window.innerHeight ||
    document.documentElement.clientHeight ||
    0;
  const availableHeight = Math.max(
    160,
    Math.floor(viewportHeight - anchorRect.bottom),
  );

  mobilePanel.style.maxHeight = `${availableHeight}px`;
};

const unlockScroll = (afterUnlock) => {
  requestAnimationFrame(() => {
    afterUnlock?.();
  });
};

const openMenu = () => {
  if (!burger || !mobilePanel) return;
  if (menuCloseTimer) clearTimeout(menuCloseTimer);
  menuCloseTimer = null;
  mobileUiAfterMenuClose.active = false;

  mobileMenuHeader?.classList.remove("is-gone", "is-hidden", "is-hidden-footer");
  syncMobilePanelHeight();
  mobilePanel.scrollTop = 0;
  mobilePanel.hidden = false;
  mobilePanel.classList.add("is-open");
  burger.setAttribute("aria-expanded", "true");
  lockScroll();
};

const closeMenu = () => {
  if (!burger || !mobilePanel) return;
  if (menuCloseTimer) clearTimeout(menuCloseTimer);

  mobilePanel.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");

  menuCloseTimer = setTimeout(() => {
    menuCloseTimer = null;
    mobilePanel.hidden = true;
    mobilePanel.style.maxHeight = "";
    armMobileUiAfterMenuClose(scrollY);
    unlockScroll(() => {
      window.dispatchEvent(new CustomEvent("mobilepanelclosed"));
    });
  }, menuTransitionMs);
};

if (burger && mobilePanel) {
  burger.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = burger.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });

  document.addEventListener("click", (e) => {
    if (
      mobilePanel.classList.contains("is-open") &&
      !mobilePanel.contains(e.target) &&
      !burger.contains(e.target)
    ) {
      closeMenu();
    }
  });

  const preventOutsidePanelScroll = (event) => {
    if (burger.getAttribute("aria-expanded") !== "true") return;
    if (mobilePanel.contains(event.target)) return;
    event.preventDefault();
  };

  document.addEventListener("touchmove", preventOutsidePanelScroll, {
    passive: false,
  });
  document.addEventListener("wheel", preventOutsidePanelScroll, {
    passive: false,
  });

  window.addEventListener("resize", () => {
    if (burger.getAttribute("aria-expanded") !== "true") return;
    syncMobilePanelHeight();
  });

  window.visualViewport?.addEventListener("resize", () => {
    if (burger.getAttribute("aria-expanded") !== "true") return;
    syncMobilePanelHeight();
  });
}

document.querySelectorAll(".mobile-acc__trigger").forEach((btn) => {
  const panelId = btn.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;

  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!isOpen));
    panel.hidden = isOpen;
    panel.classList.toggle("is-open", !isOpen);

    if (isOpen) {
      panel
        .querySelectorAll(".mobile-acc__trigger[aria-expanded='true']")
        .forEach((t) => t.setAttribute("aria-expanded", "false"));
      panel.querySelectorAll(".mobile-acc__panel.is-open").forEach((p) => {
        p.classList.remove("is-open");
        p.hidden = true;
      });
    }
  });
});

(() => {
  const initCopyAccordion = ({
    itemSelector,
    triggerSelector,
    panelSelector,
  }) => {
    const items = Array.from(document.querySelectorAll(itemSelector));
    if (!items.length) return;

    const setItemOpen = (item, open) => {
      const trigger = item.querySelector(triggerSelector);
      const panel = item.querySelector(panelSelector);
      if (!trigger || !panel) return;
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      panel.hidden = !open;
    };

    const closeOthers = (activeItem) => {
      items.forEach((item) => {
        if (item !== activeItem) setItemOpen(item, false);
      });
    };

    items.forEach((item) => {
      const trigger = item.querySelector(triggerSelector);
      if (!trigger) return;

      trigger.addEventListener("click", () => {
        const isOpen = trigger.getAttribute("aria-expanded") === "true";
        closeOthers(item);
        setItemOpen(item, !isOpen);
      });
    });

    closeOthers(items[0]);
    setItemOpen(items[0], true);
  };

  initCopyAccordion({
    itemSelector: ".intro-copy__item",
    triggerSelector: ".intro-copy__trigger",
    panelSelector: ".intro-copy__panel",
  });

  initCopyAccordion({
    itemSelector: ".offer-copy__item",
    triggerSelector: ".offer-copy__trigger",
    panelSelector: ".offer-copy__panel",
  });
})();

(() => {
  const lists = Array.from(document.querySelectorAll(".faq__list"));
  if (!lists.length) return;

  lists.forEach((list) => {
    const items = Array.from(list.querySelectorAll(".faq__item"));
    if (!items.length) return;

    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  });
})();

(() => {
  const items = Array.from(document.querySelectorAll(".service-card"));
  if (!items.length) return;
  const groups = Array.from(document.querySelectorAll(".services-group"));

  const mobileMq = window.matchMedia("(max-width: 1366px)");
  let heightSyncFrame = null;

  const setItemOpen = (item, open) => {
    const trigger = item.querySelector(".service-card__trigger");
    const panel = item.querySelector(".service-card__panel");
    if (!trigger || !panel) return;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
  };

  const syncHeights = () => {
    heightSyncFrame = null;

    groups.forEach((group) => {
      const cards = Array.from(group.querySelectorAll(".service-card"));
      if (!cards.length) return;

      cards.forEach((card) => {
        card.style.minHeight = "";
      });

      if (mobileMq.matches || cards.length < 2) return;

      const columns = new Set(
        cards.map((card) => Math.round(card.getBoundingClientRect().left)),
      );
      if (columns.size < 2) return;

      const maxHeight = Math.max(...cards.map((card) => card.offsetHeight));
      cards.forEach((card) => {
        card.style.minHeight = `${maxHeight}px`;
      });
    });
  };

  const queueHeightSync = () => {
    if (heightSyncFrame) cancelAnimationFrame(heightSyncFrame);
    heightSyncFrame = requestAnimationFrame(syncHeights);
  };

  const syncState = () => {
    if (mobileMq.matches) {
      items.forEach((item) => setItemOpen(item, false));
    } else {
      items.forEach((item) => setItemOpen(item, true));
    }

    queueHeightSync();
  };

  syncState();

  items.forEach((item) => {
    const trigger = item.querySelector(".service-card__trigger");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      if (!mobileMq.matches) return;
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      items.forEach((other) => setItemOpen(other, false));
      if (!isOpen) setItemOpen(item, true);
      queueHeightSync();
    });
  });

  const handleChange = () => syncState();
  if (typeof mobileMq.addEventListener === "function") {
    mobileMq.addEventListener("change", handleChange);
  } else if (typeof mobileMq.addListener === "function") {
    mobileMq.addListener(handleChange);
  }

  window.addEventListener("resize", queueHeightSync);
  window.addEventListener("load", queueHeightSync);
  document.fonts?.ready?.then(queueHeightSync);
})();

(() => {
  const sections = Array.from(document.querySelectorAll(".reviews"));
  if (!sections.length) return;

  sections.forEach((section) => {
    const track = section.querySelector(".reviews__track");
    const viewport = section.querySelector(".reviews__viewport");
    const originalItems = Array.from(
      track?.querySelectorAll(".reviews__item") || [],
    );
    const prev = section.querySelector(
      '.reviews__arrow[data-direction="prev"]',
    );
    const next = section.querySelector(
      '.reviews__arrow[data-direction="next"]',
    );
    if (!track || originalItems.length < 2 || !prev || !next) return;

    const singleColReviewsMq = window.matchMedia("(max-width: 1366px)");
    const transitionMs = 320;
    const swipeThreshold = 36;

    let startIndex = 0;
    let isAnimating = false;
    let transitionHandler = null;
    let transitionFallback = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchTracking = false;

    const getVisibleCount = () => (singleColReviewsMq.matches ? 1 : 3);

    const applyBasis = () => {
      const visibleCount = getVisibleCount();
      Array.from(track.children).forEach((item) => {
        item.style.flexBasis = `${100 / visibleCount}%`;
      });
    };

    const resetTrackPosition = () => {
      track.style.transition = "none";
      track.style.transform = "translate3d(0, 0, 0)";
    };

    const clearTransitionState = () => {
      if (transitionHandler) {
        track.removeEventListener("transitionend", transitionHandler);
        transitionHandler = null;
      }
      if (transitionFallback) {
        clearTimeout(transitionFallback);
        transitionFallback = null;
      }
    };

    const render = () => {
      const ordered = originalItems.map((_, offset) => {
        const idx = (startIndex + offset) % originalItems.length;
        return originalItems[idx];
      });

      track.innerHTML = "";
      ordered.forEach((item) => track.appendChild(item.cloneNode(true)));
      resetTrackPosition();
      applyBasis();
    };

    const finalizeMove = (direction) => {
      clearTransitionState();
      startIndex =
        (startIndex + direction + originalItems.length) % originalItems.length;
      isAnimating = false;
      render();
    };

    const armTransitionFinish = (direction) => {
      const finish = () => finalizeMove(direction);

      transitionHandler = (event) => {
        if (event.target !== track || event.propertyName !== "transform")
          return;
        finish();
      };

      track.addEventListener("transitionend", transitionHandler);
      transitionFallback = window.setTimeout(finish, transitionMs + 120);
    };

    const move = (direction) => {
      if (isAnimating) return;

      const firstChild = track.firstElementChild;
      const step = firstChild?.getBoundingClientRect().width || 0;
      if (!step) return;

      isAnimating = true;
      clearTransitionState();

      if (direction < 0) {
        const last = track.lastElementChild;
        if (last) track.insertBefore(last, track.firstChild);
        applyBasis();
        resetTrackPosition();
        track.style.transform = `translate3d(-${step}px, 0, 0)`;

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            track.style.transition = `transform ${transitionMs}ms ease`;
            track.style.transform = "translate3d(0, 0, 0)";
          });
        });
      } else {
        resetTrackPosition();
        requestAnimationFrame(() => {
          track.style.transition = `transform ${transitionMs}ms ease`;
          track.style.transform = `translate3d(-${step}px, 0, 0)`;
        });
      }

      armTransitionFinish(direction);
    };

    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));

    if (viewport) {
      viewport.addEventListener(
        "touchstart",
        (event) => {
          if (isAnimating || getVisibleCount() !== 1) return;
          const touch = event.changedTouches?.[0];
          if (!touch) return;
          isTouchTracking = true;
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        },
        { passive: true },
      );

      viewport.addEventListener(
        "touchend",
        (event) => {
          if (!isTouchTracking) return;
          isTouchTracking = false;
          if (isAnimating || getVisibleCount() !== 1) return;

          const touch = event.changedTouches?.[0];
          if (!touch) return;

          const dx = touch.clientX - touchStartX;
          const dy = touch.clientY - touchStartY;

          if (Math.abs(dx) < swipeThreshold) return;
          if (Math.abs(dx) <= Math.abs(dy) * 1.15) return;

          move(dx < 0 ? 1 : -1);
        },
        { passive: true },
      );

      viewport.addEventListener(
        "touchcancel",
        () => {
          isTouchTracking = false;
        },
        { passive: true },
      );
    }

    const rerender = () => {
      isAnimating = false;
      clearTransitionState();
      render();
    };

    if (typeof singleColReviewsMq.addEventListener === "function") {
      singleColReviewsMq.addEventListener("change", rerender);
    } else if (typeof singleColReviewsMq.addListener === "function") {
      singleColReviewsMq.addListener(rerender);
    }

    window.addEventListener("resize", rerender);
    render();
  });
})();

const yearEl = document.getElementById("footer-year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const header = document.querySelector(".site-header");
const burgerBtn = document.querySelector(".site-header__burger");

if (header) {
  let lastY = window.scrollY || 0;
  let stopTimer = null;
  let isHidden = false;
  const mobileHeaderMq = window.matchMedia("(max-width: 1366px)");

  const threshold = 4;
  const stopDelay = 240;

  const show = () => {
    if (!isHidden) return;
    isHidden = false;
    header.classList.remove("is-gone");
    header.classList.remove("is-hidden");
    header.classList.remove("is-hidden-footer");
  };

  const hide = () => {
    if (isHidden) return;
    isHidden = true;
    header.classList.remove("is-gone");
    header.classList.remove("is-hidden-footer");
    header.classList.add("is-hidden");
  };

  const isMenuOpen = () =>
    burgerBtn && burgerBtn.getAttribute("aria-expanded") === "true";

  const onScroll = () => {
    const y = window.scrollY || 0;
    const dy = y - lastY;

    if (!mobileHeaderMq.matches) {
      if (stopTimer) clearTimeout(stopTimer);
      show();
      lastY = y;
      return;
    }

    if (y <= 2) {
      show();
      lastY = y;
      return;
    }

    if (isMenuOpen()) {
      show();
      lastY = y;
      return;
    }

    if (shouldHoldMobileUiAfterMenuClose(threshold)) {
      if (stopTimer) clearTimeout(stopTimer);
      show();
      lastY = y;
      return;
    }

    if (dy > threshold) {
      hide();
    } else if (dy < -threshold) {
      show();
    }

    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
      if (isMenuOpen()) return;
      if ((window.scrollY || 0) <= 2) return;
      show();
    }, stopDelay);

    lastY = y;
  };

  header.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "transform") return;
    if (header.classList.contains("is-hidden")) header.classList.add("is-gone");
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("mobilepanelclosed", () => {
    if (stopTimer) clearTimeout(stopTimer);
    show();
    lastY = window.scrollY || 0;
  });
  onScroll();
}

(() => {
  const fixedHeroes = Array.from(
    document.querySelectorAll(".page-hero .page-hero__content"),
  ).filter((el) => window.getComputedStyle(el).position === "fixed");
  if (!fixedHeroes.length) return;

  const sync = () => {
    const y = window.scrollY || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    fixedHeroes.forEach((el) => {
      const hero = el.closest(".page-hero");
      const rect = hero ? hero.getBoundingClientRect() : null;
      const bottomInset = rect
        ? Math.min(vh, Math.max(0, vh - rect.bottom))
        : 0;

      el.style.setProperty("--hero-scroll-offset", `${y}px`);
      el.style.clipPath = `inset(0 0 ${bottomInset}px 0)`;
      el.style.webkitClipPath = `inset(0 0 ${bottomInset}px 0)`;
    });
  };

  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync, { passive: true });
  sync();
})();

(() => {
  const els = document.querySelectorAll(".hero .type__text");
  if (!els.length) return;

  const title = document.querySelector(".hero .hero__title");
  if (!title) return;

  const phrases = [
    "that work harder",
    "that look better",
    "that load faster",
    "that rank higher",
    "that get you calls",
  ];
  const typeSpeed = 35;
  const deleteSpeed = 35;
  const holdAfterType = 2000;
  const holdAfterDelete = 150;

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let reserveFrame = 0;

  const reserveHeroTitleHeight = () => {
    const titleWidth = Math.ceil(title.getBoundingClientRect().width);
    if (!titleWidth) return;

    const measure = title.cloneNode(true);
    const measureText = measure.querySelector(".type__text");
    if (!measureText) return;

    const measureCaret = measure.querySelector(".type__caret");
    if (measureCaret) measureCaret.remove();

    measure.setAttribute("aria-hidden", "true");
    Object.assign(measure.style, {
      position: "absolute",
      left: "0",
      top: "0",
      visibility: "hidden",
      pointerEvents: "none",
      width: `${titleWidth}px`,
      maxWidth: `${titleWidth}px`,
      minHeight: "0",
      height: "auto",
      zIndex: "-1",
    });

    document.body.appendChild(measure);

    let maxHeight = Math.ceil(title.getBoundingClientRect().height);
    phrases.forEach((phrase) => {
      measureText.textContent = phrase;
      maxHeight = Math.max(maxHeight, Math.ceil(measure.getBoundingClientRect().height));
    });

    measure.remove();
    title.style.setProperty("--hero-title-reserve", `${maxHeight}px`);
  };

  const queueHeroTitleReserve = () => {
    cancelAnimationFrame(reserveFrame);
    reserveFrame = requestAnimationFrame(reserveHeroTitleHeight);
  };

  const setText = (t) => {
    els.forEach((node) => {
      node.textContent = t;
    });
  };

  queueHeroTitleReserve();
  window.addEventListener("resize", queueHeroTitleReserve, { passive: true });
  window.addEventListener("load", queueHeroTitleReserve, { once: true });
  if (document.fonts?.ready) document.fonts.ready.then(queueHeroTitleReserve);

  const tick = () => {
    const phrase = phrases[phraseIndex];

    if (!deleting) {
      charIndex += 1;
      setText(phrase.slice(0, charIndex));

      if (charIndex >= phrase.length) {
        setTimeout(() => {
          deleting = true;
          tick();
        }, holdAfterType);
        return;
      }

      setTimeout(tick, typeSpeed);
      return;
    }

    charIndex -= 1;
    setText(phrase.slice(0, Math.max(0, charIndex)));

    if (charIndex <= 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(tick, holdAfterDelete);
      return;
    }

    setTimeout(tick, deleteSpeed);
  };

  tick();
})();

(() => {
  const typeWrap = document.querySelector(".page-hero .pricing-type");
  if (!typeWrap) return;

  const textEl = typeWrap.querySelector(".pricing-type__text");
  if (!textEl) return;
  const titleEl = typeWrap.closest(".page-hero__title");

  const fullText = (
    typeWrap.dataset.typeText ||
    textEl.textContent ||
    ""
  ).trim();
  if (!fullText) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const mobileMq = window.matchMedia("(max-width: 1366px)");

  const syncWrapBox = ({ allowShrink = false } = {}) => {
    const currentText = textEl.textContent;
    typeWrap.style.width = "";
    typeWrap.style.height = "";
    if (mobileMq.matches) typeWrap.style.width = "100%";
    textEl.textContent = fullText;
    const rect = typeWrap.getBoundingClientRect();
    const measuredWidth = Math.ceil(rect.width);
    const measuredHeight = Math.ceil(rect.height);
    if (mobileMq.matches) {
      typeWrap.style.width = "100%";
    } else if (measuredWidth > 0) {
      typeWrap.style.width = `${measuredWidth}px`;
    }
    if (measuredHeight > 0) typeWrap.style.height = `${measuredHeight}px`;
    if (measuredHeight > 0 && titleEl) {
      const currentReserve =
        Number.parseFloat(
          getComputedStyle(titleEl).getPropertyValue(
            "--page-hero-title-reserve",
          ),
        ) || 0;
      const nextReserve = allowShrink
        ? measuredHeight
        : Math.max(currentReserve, measuredHeight);

      titleEl.style.setProperty("--page-hero-title-reserve", `${nextReserve}px`);
    }
    textEl.textContent = currentText;
  };

  syncWrapBox();
  window.addEventListener(
    "resize",
    () => {
      syncWrapBox({ allowShrink: true });
    },
    { passive: true },
  );
  document.fonts?.ready
    ?.then(() => {
      syncWrapBox();
    })
    .catch(() => {});

  if (reducedMotion) {
    textEl.textContent = fullText;
    typeWrap.classList.remove("is-pop");
    return;
  }

  let charIndex = 0;
  const typeSpeed = 38;

  const tick = () => {
    charIndex += 1;
    textEl.textContent = fullText.slice(0, charIndex);

    if (charIndex < fullText.length) {
      setTimeout(tick, typeSpeed);
      return;
    }

    typeWrap.classList.remove("is-pop");
    void typeWrap.offsetWidth;
    typeWrap.classList.add("is-pop");
    setTimeout(() => {
      typeWrap.classList.remove("is-pop");
    }, 260);
  };

  requestAnimationFrame(() => {
    textEl.textContent = "";
    setTimeout(tick, 160);
  });
})();

(() => {
  const statsWrap = document.querySelector(".hero-stats");
  const statItems = Array.from(document.querySelectorAll(".hero-stats__item"));
  const statEls = Array.from(document.querySelectorAll(".hero-stats__figure"));
  if (!statsWrap || !statEls.length) return;
  const statsSection = statsWrap.closest(".hero-stats-section") || statsWrap;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const parseCountToken = (raw) => {
    const text = String(raw || "").trim();
    const match = text.match(/^([^0-9-]*)(-?\d+)([^0-9]*)$/);
    if (!match) return null;
    return {
      prefix: match[1],
      target: Number.parseInt(match[2], 10),
      suffix: match[3],
    };
  };

  const animateCount = (el, token, sharedDuration) => {
    const target = token.target;
    const start = performance.now();

    const render = (value) => {
      el.textContent = `${token.prefix}${value}${token.suffix}`;
    };

    const step = (now) => {
      const progress = Math.min(1, (now - start) / sharedDuration);
      const eased = 1 - (1 - progress) * (1 - progress);
      const value = Math.round(target * eased);

      render(value);

      if (progress < 1) {
        requestAnimationFrame(step);
        return;
      }

      render(target);
    };

    render(0);
    requestAnimationFrame(step);
  };

  const lockCountWidth = (el, token) => {
    const probe = document.createElement("span");
    const styles = window.getComputedStyle(el);

    probe.textContent = `${token.prefix}${token.target}${token.suffix}`;
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.whiteSpace = "nowrap";
    probe.style.fontFamily = styles.fontFamily;
    probe.style.fontSize = styles.fontSize;
    probe.style.fontWeight = styles.fontWeight;
    probe.style.fontStyle = styles.fontStyle;
    probe.style.letterSpacing = styles.letterSpacing;
    probe.style.lineHeight = styles.lineHeight;
    probe.style.fontVariantNumeric = styles.fontVariantNumeric;

    document.body.append(probe);
    const width = Math.ceil(probe.getBoundingClientRect().width);
    probe.remove();

    el.style.display = "inline-block";
    el.style.width = `${width}px`;
    el.style.whiteSpace = "nowrap";
  };

  const parsed = statEls
    .map((el) => ({ el, token: parseCountToken(el.textContent) }))
    .filter((item) => item.token);
  if (!parsed.length) return;

  let hasStarted = false;

  const start = () => {
    if (hasStarted) return;
    hasStarted = true;

    const run = () => {
      const maxTarget = Math.max(
        ...parsed.map((item) => Math.abs(item.token.target)),
        1,
      );
      const sharedDuration = Math.min(2400, Math.max(900, maxTarget * 30));

      parsed.forEach(({ el, token }) => {
        lockCountWidth(el, token);
        if (reducedMotion) {
          el.textContent = `${token.prefix}${token.target}${token.suffix}`;
          return;
        }
        animateCount(el, token, sharedDuration);
      });
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(run, run);
      return;
    }

    run();
  };

  if (!("IntersectionObserver" in window)) {
    start();
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          start();
          observer.disconnect();
        });
      },
      {
        threshold: reducedMotion ? 0.2 : 0.45,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(statsSection);
  }

  if (reducedMotion || !statItems.length) return;

  let lastY = window.scrollY || window.pageYOffset || 0;
  let rotation = 0;

  const setTilt = (value) => {
    statItems.forEach((item, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      item.style.setProperty(
        "--hero-stat-tilt",
        `${(value * direction).toFixed(2)}deg`,
      );
    });
  };

  const onScroll = () => {
    const nextY = window.scrollY || window.pageYOffset || 0;
    const deltaY = nextY - lastY;
    lastY = nextY;

    if (Math.abs(deltaY) < 0.5) return;

    rotation += deltaY * 0.35;
    setTilt(rotation);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
})();

(() => {
  const section = document.querySelector(".photo-grid");
  const photo = document.querySelector(".photo-grid__image-wrap");
  if (!section || !photo) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let rafId = null;
  let currentX = 0;
  let targetX = 0;
  let animating = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smootherstep = (p) => p * p * p * (p * (p * 6 - 15) + 10);

  const computeTargets = () => {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!vh) return { x: 0 };

    // 0..1 while section passes through viewport.
    const travel = vh + rect.height;
    const t = clamp((vh - rect.top) / Math.max(1, travel), 0, 1);
    const smooth = smootherstep(t);
    const isNarrow = window.matchMedia("(max-width: 1366px)").matches;
    const radius = isNarrow
      ? clamp(section.clientWidth * 0.042, 18, 36)
      : clamp(section.clientWidth * 0.045, 30, 64);
    const wave = Math.sin(Math.PI * smooth); // 0 -> 1 -> 0 across section
    const x = radius * wave;

    return { x };
  };

  const apply = () => {
    photo.style.setProperty("--photo-scroll-x", `${currentX.toFixed(2)}px`);
  };

  const animate = () => {
    const dx = targetX - currentX;
    const lerp = 0.16;
    currentX += dx * lerp;

    if (Math.abs(dx) < 0.05) {
      currentX = targetX;
    }

    apply();

    if (Math.abs(targetX - currentX) >= 0.05) {
      rafId = requestAnimationFrame(animate);
      return;
    }

    animating = false;
    rafId = null;
  };

  const onScrollOrResize = () => {
    const target = computeTargets();
    targetX = target.x;
    if (animating) return;
    animating = true;
    rafId = requestAnimationFrame(animate);
  };

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
  onScrollOrResize();
})();

(() => {
  const btn = document.getElementById("audit-toggle");
  const footer = document.querySelector(".site-footer");
  if (!btn) return;

  let scrollTimer = null;
  let footerVisible = false;
  const idleDelayMs = 2000;
  const isInTopZone = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    return y <= Math.max(16, vh * 0.15);
  };
  const showAfterScrollStops = () => {
    if (footerVisible) return;
    btn.classList.remove("is-hidden-by-scroll");
  };
  const queueShowAfterIdle = () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      showAfterScrollStops();
    }, idleDelayMs);
  };

  const update = () => {
    if (footerVisible) {
      btn.classList.add("is-hidden-by-scroll");
      return;
    }

    if (shouldHoldMobileUiAfterMenuClose()) {
      btn.classList.remove("is-hidden-by-scroll");
      return;
    }

    if (isInTopZone()) {
      btn.classList.remove("is-hidden-by-scroll");
    }
  };

  // hide while scrolling, show when stopped
  window.addEventListener(
    "scroll",
    () => {
      if (footerVisible) return;

      if (shouldHoldMobileUiAfterMenuClose()) {
        clearTimeout(scrollTimer);
        btn.classList.remove("is-hidden-by-scroll");
        return;
      }

      if (isInTopZone()) {
        clearTimeout(scrollTimer);
        btn.classList.remove("is-hidden-by-scroll");
        return;
      }

      btn.classList.add("is-hidden-by-scroll");
      queueShowAfterIdle();
    },
    { passive: true },
  );

  if ("onscrollend" in window) {
    window.addEventListener("scrollend", () => {
      if (footerVisible) return;
      if (shouldHoldMobileUiAfterMenuClose()) {
        clearTimeout(scrollTimer);
        btn.classList.remove("is-hidden-by-scroll");
        return;
      }
      if (isInTopZone()) {
        clearTimeout(scrollTimer);
        btn.classList.remove("is-hidden-by-scroll");
        return;
      }
      queueShowAfterIdle();
    });
  }

  // hide when footer is visible
  if (footer) {
    new IntersectionObserver(
      (entries) => {
        footerVisible = entries[0].isIntersecting;
        update();
      },
      { threshold: 0 },
    ).observe(footer);
  }

  window.addEventListener("mobilepanelclosed", () => {
    clearTimeout(scrollTimer);
    btn.classList.remove("is-hidden-by-scroll");
  });

  update();
})();

(() => {
  const syncModalScrollLock = () => {
    document.documentElement.style.overflow = document.querySelector(
      ".form-modal.is-open",
    )
      ? "hidden"
      : "";
  };

  const initFormModal = ({
    triggerSelector,
    modalId,
    closeId,
    formId,
    thanksId,
  }) => {
    const triggers = Array.from(document.querySelectorAll(triggerSelector));
    const modal = document.getElementById(modalId);
    const close = document.getElementById(closeId);
    const form = document.getElementById(formId);
    const thanks = document.getElementById(thanksId);
    const heading = modal?.querySelector(".form-modal__heading");
    const successUrl = form?.dataset.successUrl?.trim();
    if (!triggers.length || !modal) return;

    const open = () => {
      modal.classList.add("is-open");
      syncModalScrollLock();
    };

    const resetState = () => {
      if (!form || !thanks) return;
      form.hidden = false;
      if (heading) heading.hidden = false;
      thanks.hidden = true;
      form.reset();
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      syncModalScrollLock();
      resetState();
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        open();
      });
    });

    close?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const body = new URLSearchParams(data).toString();

      try {
        const response = await fetch("/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });

        if (!response.ok) throw new Error(`Form submission failed: ${response.status}`);

        if (successUrl) {
          window.location.assign(successUrl);
          return;
        }

        form.hidden = true;
        if (heading) heading.hidden = true;
        if (thanks) thanks.hidden = false;
      } catch (error) {
        console.error(error);
      }
    });
  };

  initFormModal({
    triggerSelector: "[data-open-audit]",
    modalId: "audit-modal",
    closeId: "audit-modal-close",
    formId: "audit-form",
    thanksId: "audit-thanks",
  });

  initFormModal({
    triggerSelector: "[data-open-discovery]",
    modalId: "discovery-modal",
    closeId: "discovery-modal-close",
    formId: "discovery-form",
    thanksId: "discovery-thanks",
  });
})();
