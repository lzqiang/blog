import assert from "node:assert/strict";
import test from "node:test";
import { renderArticlePage } from "../src/templates/article.js";
import { renderHomePage } from "../src/templates/home.js";

const categories = [
  {
    key: "java",
    label: "Java",
    description: "Java notes",
    articles: []
  }
];

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
