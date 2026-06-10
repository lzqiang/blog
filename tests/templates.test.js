import assert from "node:assert/strict";
import test from "node:test";
import { renderArticlePage } from "../src/templates/article.js";
import * as categoryTemplates from "../src/templates/category.js";
import { renderHomePage } from "../src/templates/home.js";

const categories = [
  {
    key: "java",
    label: "Java",
    description: "Java notes",
    articles: []
  }
];

const interviewArticle = {
  title: "六月面试题",
  summary: "六月内容",
  dateText: "2026-06-10",
  categoryKey: "interview",
  categoryLabel: "面试题",
  outputPath: "articles/interview/june.html"
};

const interviewArchives = [{
  year: "2026",
  articles: [interviewArticle],
  months: [{
    month: "06",
    articles: [interviewArticle]
  }]
}];

test("home page uses relative local assets and category links", () => {
  const html = renderHomePage({
    categories,
    articles: [],
    pagePath: "index.html"
  });

  assert.match(html, /href="assets\/styles\.css"/);
  assert.match(html, /href="categories\/java\.html"/);
  assert.match(html, /暂无文章/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test("article page includes toc, adjacent navigation, and escaped metadata", () => {
  const article = {
    title: "<Java>",
    summary: "summary",
    dateText: "2026-06-10",
    categoryKey: "java",
    categoryLabel: "Java",
    outputPath: "articles/java/demo.html",
    html: "<h2 id=\"intro\">Intro</h2>",
    toc: [{ level: 2, id: "intro", text: "Intro" }]
  };
  const html = renderArticlePage({
    article,
    categories,
    adjacent: { previous: null, next: null },
    pagePath: article.outputPath
  });

  assert.match(html, /&lt;Java&gt;/);
  assert.match(html, /href="#intro"/);
  assert.match(html, /href="\.\.\/\.\.\/assets\/styles\.css"/);
  assert.match(html, /返回顶部/);
  assert.match(html, /上一篇/);
  assert.match(html, /下一篇/);
});

test("home page renders accessible interview archive navigation", () => {
  const html = renderHomePage({
    categories: [
      ...categories,
      {
        key: "interview",
        label: "面试题",
        description: "Interview notes",
        articles: [interviewArticle]
      }
    ],
    articles: [interviewArticle],
    interviewArchives,
    pagePath: "index.html"
  });

  assert.match(html, /href="categories\/interview\.html"[^>]*>\s*面试题/);
  assert.match(html, /class="archive-toggle"/);
  assert.match(html, /aria-label="[^"]+"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="interview-archives"/);
  assert.match(
    html,
    /class="archive-panel" id="interview-archives" hidden/
  );
  assert.match(html, /href="categories\/interview\/2026\.html"/);
  assert.match(html, /href="categories\/interview\/2026\/06\.html"/);
});

test("home page omits interview archive controls without archives", () => {
  const html = renderHomePage({
    categories,
    articles: [],
    interviewArchives: [],
    pagePath: "index.html"
  });

  assert.doesNotMatch(html, /archive-toggle/);
  assert.doesNotMatch(html, /archive-panel/);
});

test("deep month archive page renders articles and relative assets", () => {
  assert.equal(typeof categoryTemplates.renderArchivePage, "function");

  const html = categoryTemplates.renderArchivePage({
    title: "2026 年 06 月面试题",
    description: "2026 年 06 月发布的面试题。",
    articles: [interviewArticle],
    categories: [{
      key: "interview",
      label: "面试题",
      description: "Interview notes",
      articles: [interviewArticle]
    }],
    interviewArchives,
    pagePath: "categories/interview/2026/06.html"
  });

  assert.match(html, /INTERVIEW ARCHIVE/);
  assert.match(html, /2026 年 06 月面试题/);
  assert.match(
    html,
    /href="\.\.\/\.\.\/\.\.\/articles\/interview\/june\.html"/
  );
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/assets\/styles\.css"/);
});
