const topLink = document.querySelector(".back-to-top");

if (topLink) {
  const updateVisibility = () => {
    topLink.classList.toggle("is-visible", window.scrollY > 240);
  };
  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });
}

for (const link of document.querySelectorAll(".article-toc a")) {
  link.addEventListener("click", () => {
    document.querySelector(".article-toc a[aria-current]")?.removeAttribute(
      "aria-current"
    );
    link.setAttribute("aria-current", "location");
  });
}

const archiveToggle = document.querySelector(".archive-toggle");
const archivePanel = document.querySelector(".archive-panel");

if (archiveToggle && archivePanel) {
  const closeArchive = ({ restoreFocus = false } = {}) => {
    const wasExpanded =
      archiveToggle.getAttribute("aria-expanded") === "true";
    archiveToggle.setAttribute("aria-expanded", "false");
    archivePanel.hidden = true;
    if (restoreFocus && wasExpanded) {
      archiveToggle.focus();
    }
  };

  archiveToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const expanded =
      archiveToggle.getAttribute("aria-expanded") === "true";
    archiveToggle.setAttribute("aria-expanded", String(!expanded));
    archivePanel.hidden = expanded;
  });

  archivePanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    closeArchive();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeArchive({ restoreFocus: true });
    }
  });
}
