import { escapeHtml } from "./escape.js";
import { articleList } from "./home.js";
import { renderLayout } from "./layout.js";

export function renderCategoryPage({
  category,
  categories,
  interviewArchives = [],
  pagePath
}) {
  return renderLayout({
    title: category.label,
    description: category.description,
    categories,
    interviewArchives,
    pagePath,
    content: `
      <header class="page-heading">
        <p class="eyebrow">CATEGORY</p>
        <h1>${escapeHtml(category.label)}</h1>
        <p>${escapeHtml(category.description)}</p>
      </header>
      ${articleList(category.articles, pagePath)}`
  });
}

export function renderArchivePage({
  title,
  description,
  articles,
  categories,
  interviewArchives = [],
  pagePath
}) {
  return renderLayout({
    title,
    description,
    categories,
    interviewArchives,
    pagePath,
    content: `
      <header class="page-heading">
        <p class="eyebrow">INTERVIEW ARCHIVE</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </header>
      ${articleList(articles, pagePath)}`
  });
}
