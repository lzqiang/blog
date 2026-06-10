import { hrefFrom } from "../paths.js";
import { escapeHtml } from "./escape.js";
import { renderLayout } from "./layout.js";

export function articleList(articles, pagePath) {
  if (articles.length === 0) {
    return "<p class=\"empty-state\">暂无文章</p>";
  }

  return `<ol class="article-list">${articles.map((article, index) => `
    <li class="article-item">
      <span class="article-number">${String(index + 1).padStart(2, "0")}</span>
      <div class="article-main">
        <span class="article-meta">${escapeHtml(article.categoryLabel)}</span>
        <a href="${hrefFrom(pagePath, article.outputPath)}">
          <h2>${escapeHtml(article.title)}</h2>
        </a>
        <p>${escapeHtml(article.summary)}</p>
      </div>
      <time class="article-date" datetime="${article.dateText}">
        ${article.dateText.replaceAll("-", ".")}
      </time>
    </li>`).join("")}
  </ol>`;
}

export function renderHomePage({
  categories,
  articles,
  interviewTags = [],
  pagePath
}) {
  return renderLayout({
    title: "首页",
    description: "技术、人工智能、文学创作与个人随笔。",
    categories,
    interviewTags,
    pagePath,
    content: `
      <section class="hero editorial-hero">
        <div class="hero-copy">
          <p class="eyebrow">EDITOR'S NOTE · 主编手记</p>
          <h1>
            <span>在技术与文字之间，</span>
            <span>留下<strong>长期思考</strong>。</span>
          </h1>
          <p>记录 Java 与后端工程中的关键问题，也记录人工智能、文学创作和日常生活。不是追逐即时答案，而是建立一份可以反复修订的个人档案。</p>
          <a class="hero-link" href="#latest">阅读最新文章</a>
        </div>
        <aside class="issue-note">
          <span>壹</span>
          <h2>答案会过期，思考过程值得保存。</h2>
          <p>本期从 Java 集合、并发工具与 Optional 开始，也谈人与智能工具如何共同工作。</p>
        </aside>
      </section>
      <section id="latest">
        <div class="section-heading">
          <div><p class="eyebrow">LATEST WRITING</p><h2>最新文章</h2></div>
          <span>共 ${articles.length} 篇</span>
        </div>
        ${articleList(articles, pagePath)}
      </section>`
  });
}
