document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("resumeModal");
    const openLink = document.querySelector(".js-open-resume"); // ONLY this link
    const closeBtn = document.getElementById("closeResume");

    if (!modal || !openLink || !closeBtn) return; // fail silently if markup isn't there

    function openModal(e) {
        if (e) e.preventDefault(); // stop following the PDF link
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    openLink.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });
});

// js/responsive-navbar.js
(function () {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.getElementById("primary-menu");
    const list = nav?.querySelector(".menu");

    if (!toggle || !nav || !list) return;

    function setExpanded(isOpen) {
        toggle.setAttribute("aria-expanded", String(isOpen));
        list.classList.toggle("active", isOpen);
        toggle.setAttribute(
            "aria-label",
            isOpen ? "Close main menu" : "Open main menu"
        );
    }

    // Toggle on click
    toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        setExpanded(!isOpen);
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setExpanded(false);
    });

    // Close when clicking a menu link
    list.addEventListener("click", (e) => {
        const target = e.target;
        if (target instanceof Element && target.closest("a")) {
            setExpanded(false);
        }
    });

    // Close if you click outside
    document.addEventListener("click", (e) => {
        const t = e.target;
        const clickedInside =
            t instanceof Element &&
            (t.closest("#primary-menu") || t.closest(".menu-toggle"));
        if (!clickedInside) setExpanded(false);
    });
})();
