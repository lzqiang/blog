import { hrefFrom } from "../paths.js";
import { escapeHtml } from "./escape.js";

function interviewMenu(interviewTags, pagePath) {
  const interviewHref = hrefFrom(pagePath, "categories/interview.html");
  return `
    <div class="topic-nav">
      <a class="topic-trigger" href="${interviewHref}">面试题</a>
      <div class="topic-panel" aria-label="面试题分类">
        ${interviewTags.map((tag) => `
          <a href="${hrefFrom(
            pagePath,
            `categories/interview/tags/${tag.key}.html`
          )}">${escapeHtml(tag.label)}</a>`).join("")}
      </div>
    </div>`;
}

export function renderLayout({
  title,
  description,
  categories,
  interviewTags = [],
  pagePath,
  content
}) {
  const homeHref = hrefFrom(pagePath, "index.html");
  const menu = categories.map((category) => {
    if (category.key === "interview") {
      return interviewMenu(interviewTags, pagePath);
    }
    return `<a href="${hrefFrom(
      pagePath,
      `categories/${category.key}.html`
    )}">${escapeHtml(category.label)}</a>`;
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
    <div class="shell masthead-meta">
      <span>二〇二六年六月 · 第一期</span>
      <span>技术与文字的个人刊物</span>
      <span>以 Markdown 写作，以网页阅读</span>
    </div>
    <div class="shell brand-row">
      <p>远山不语<br>文字自有回声</p>
      <a class="brand" href="${homeHref}">
        远山手记
        <small>Notes from distant mountains</small>
      </a>
      <p>Java · AI<br>文学 · 随笔</p>
    </div>
    <nav class="primary-nav" aria-label="主要导航">
      <div class="shell nav-inner">${menu}</div>
    </nav>
  </header>
  <div class="shell page-grid">
    <main>${content}</main>
    <aside>
      <section class="aside-card">
        <p class="eyebrow">ABOUT</p>
        <h2>关于这里</h2>
        <p>一份慢慢生长的个人刊物。写技术，也写那些无法被代码完全表达的事情。</p>
      </section>
      <section class="aside-card">
        <p class="eyebrow">INDEX</p>
        <h2>分类索引</h2>
        <ul class="category-list">${sidebar}</ul>
      </section>
      <blockquote class="aside-quote">
        <p>知识需要经过表达，才能从模糊印象变成可以复用的理解。</p>
        <cite>远山手记 · 写作原则</cite>
      </blockquote>
    </aside>
  </div>
  <footer class="site-footer">
    <div class="shell footer-inner">
      <span>© 2026 远山手记</span>
      <span>愿每一次记录，都让理解更清楚一点。</span>
    </div>
  </footer>
  <script src="${hrefFrom(pagePath, "assets/blog.js")}"></script>
</body>
</html>`;
}
