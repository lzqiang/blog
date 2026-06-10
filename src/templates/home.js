import { hrefFrom } from "../paths.js";
import { escapeHtml } from "./escape.js";
import { renderLayout } from "./layout.js";

export function articleList(articles, pagePath) {
  if (articles.length === 0) {
    return "<p class=\"empty-state\">暂无文章</p>";
  }

  return `<ol class="article-list">${articles.map((article) => `
    <li>
      <a href="${hrefFrom(pagePath, article.outputPath)}">
        <span class="article-meta">${escapeHtml(article.categoryLabel)} · ${article.dateText}</span>
        <h2>${escapeHtml(article.title)}</h2>
        <p>${escapeHtml(article.summary)}</p>
      </a>
    </li>`).join("")}
  </ol>`;
}

export function renderHomePage({ categories, articles, pagePath }) {
  return renderLayout({
    title: "首页",
    description: "技术、人工智能、文学创作与个人随笔。",
    categories,
    pagePath,
    content: `
      <section class="hero">
        <p class="eyebrow">PERSONAL BLOG</p>
        <h1>在技术与文字之间，留下长期思考。</h1>
        <p>这里收录 Java、人工智能、文学创作和个人随笔。</p>
      </section>
      <section>
        <div class="section-heading"><h2>最新文章</h2></div>
        ${articleList(articles, pagePath)}
      </section>`
  });
}
