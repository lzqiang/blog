import { hrefFrom } from "../paths.js";
import { escapeHtml } from "./escape.js";

function archiveMenu(interviewArchives, pagePath) {
  if (interviewArchives.length === 0) {
    return "";
  }

  return `
    <button class="archive-toggle" type="button"
      aria-label="展开面试题归档"
      aria-expanded="false"
      aria-controls="interview-archives">⌄</button>
    <div class="archive-panel" id="interview-archives" hidden>
      ${interviewArchives.map(({ year, months }) => `
        <section class="archive-year">
          <a class="archive-year-link"
             href="${hrefFrom(pagePath, `categories/interview/${year}.html`)}">
            ${escapeHtml(year)} 年
          </a>
          <div class="archive-months">
            ${months.map(({ month }) => `
              <a href="${hrefFrom(
                pagePath,
                `categories/interview/${year}/${month}.html`
              )}">${escapeHtml(month)} 月</a>`).join("")}
          </div>
        </section>`).join("")}
    </div>`;
}

export function renderLayout({
  title,
  description,
  categories,
  interviewArchives = [],
  pagePath,
  content
}) {
  const homeHref = hrefFrom(pagePath, "index.html");
  const menu = categories.map((category) => {
    const link = `
      <a href="${hrefFrom(pagePath, `categories/${category.key}.html`)}">
        ${escapeHtml(category.label)}
      </a>`;
    if (category.key !== "interview") {
      return link;
    }
    return `
      <div class="archive-nav">
        <div class="archive-nav-label">
          ${link}
          ${archiveMenu(interviewArchives, pagePath)}
        </div>
      </div>`;
  }).join("");
  const sidebar = categories.map((category) => `
    <li>
      <a href="${hrefFrom(pagePath, `categories/${category.key}.html`)}">
        <span>${escapeHtml(category.label)}</span>
        <span>${category.articles.length}</span>
      </a>
    </li>`).join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)} · 远山手记</title>
  <link rel="stylesheet" href="${hrefFrom(pagePath, "assets/styles.css")}">
</head>
<body id="top">
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="${homeHref}">远山手记</a>
      <nav aria-label="主要导航">${menu}</nav>
    </div>
  </header>
  <div class="shell page-grid">
    <main>${content}</main>
    <aside>
      <section class="aside-card">
        <p class="eyebrow">ABOUT</p>
        <h2>关于这里</h2>
        <p>记录技术学习、人工智能、文学创作与生活随想。</p>
      </section>
      <section class="aside-card">
        <p class="eyebrow">CATEGORIES</p>
        <ul class="category-list">${sidebar}</ul>
      </section>
    </aside>
  </div>
  <footer class="site-footer">
    <div class="shell">以 Markdown 写作，以网页阅读。</div>
  </footer>
  <script src="${hrefFrom(pagePath, "assets/blog.js")}"></script>
</body>
</html>`;
}
