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
