import { hrefFrom } from "../paths.js";
import { escapeHtml } from "./escape.js";
import { renderLayout } from "./layout.js";

function adjacentLink(label, target, pagePath) {
  if (!target) {
    return `<span class="adjacent-empty">${label}</span>`;
  }
  return `<a href="${hrefFrom(pagePath, target.outputPath)}">
    <span>${label}</span><strong>${escapeHtml(target.title)}</strong>
  </a>`;
}

export function renderArticlePage({
  article,
  categories,
  adjacent,
  interviewTags = [],
  pagePath
}) {
  const tags = article.tags.length === 0 ? "" : `
    <div class="article-tags" aria-label="文章标签">
      ${article.tags.map((tag) => `
        <a href="${hrefFrom(
          pagePath,
          `categories/interview/tags/${tag.key}.html`
        )}"># ${escapeHtml(tag.label)}</a>`).join("")}
    </div>`;
  const toc = article.toc.length === 0 ? "" : `
    <nav class="article-toc" aria-label="文章目录">
      <p class="eyebrow">CONTENTS</p>
      <ol>${article.toc.map((item) => `
        <li class="toc-level-${item.level}">
          <a href="#${encodeURIComponent(item.id)}">${escapeHtml(item.text)}</a>
        </li>`).join("")}
      </ol>
    </nav>`;

  return renderLayout({
    title: article.title,
    description: article.summary,
    categories,
    interviewTags,
    pagePath,
    content: `
      <article>
        <header class="article-header">
          <a class="article-category"
             href="${hrefFrom(pagePath, `categories/${article.categoryKey}.html`)}">
            ${escapeHtml(article.categoryLabel)}
          </a>
          <h1>${escapeHtml(article.title)}</h1>
          <p>${escapeHtml(article.summary)}</p>
          <time datetime="${article.dateText}">${article.dateText}</time>
          ${tags}
        </header>
        ${toc}
        <div class="prose">${article.html}</div>
        <nav class="adjacent-nav" aria-label="相邻文章">
          ${adjacentLink("上一篇", adjacent.previous, pagePath)}
          ${adjacentLink("下一篇", adjacent.next, pagePath)}
        </nav>
      </article>
      <a class="back-to-top" href="#top">返回顶部</a>`
  });
}
