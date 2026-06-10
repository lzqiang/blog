const topLink = document.querySelector(".back-to-top");

if (topLink) {
  const updateVisibility = () => {
    topLink.classList.toggle("is-visible", window.scrollY > 480);
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
