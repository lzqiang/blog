import { escapeHtml } from "./escape.js";
import { articleList } from "./home.js";
import { renderLayout } from "./layout.js";

export function renderCategoryPage({ category, categories, pagePath }) {
  return renderLayout({
    title: category.label,
    description: category.description,
    categories,
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
