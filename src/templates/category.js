import { escapeHtml } from "./escape.js";
import { articleList } from "./home.js";
import { renderLayout } from "./layout.js";

export function renderCategoryPage({
  category,
  categories,
  interviewTags = [],
  pagePath
}) {
  return renderLayout({
    title: category.label,
    description: category.description,
    categories,
    interviewTags,
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

export function renderInterviewTagPage({
  tag,
  categories,
  interviewTags,
  pagePath
}) {
  return renderLayout({
    title: `面试题 · ${tag.label}`,
    description: `${tag.label} 相关面试题。`,
    categories,
    interviewTags,
    pagePath,
    content: `
      <header class="page-heading">
        <p class="eyebrow">INTERVIEW TAG</p>
        <h1>面试题 · ${escapeHtml(tag.label)}</h1>
        <p>${escapeHtml(tag.label)} 相关面试题，共 ${tag.articles.length} 篇。</p>
      </header>
      ${articleList(tag.articles, pagePath)}`
  });
}
