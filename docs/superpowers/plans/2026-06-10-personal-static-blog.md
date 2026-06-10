# Personal Static Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Markdown-authored personal blog that generates fully styled, offline HTML pages which can be opened directly from `index.html`.

**Architecture:** A small Node.js static-site generator reads and validates Markdown, renders article HTML, builds sorted category/navigation models, and writes relative-link HTML pages. Page templates remain separate from content parsing, while local CSS and JavaScript are copied into the generated `assets/` directory so the result works without a server or network.

**Tech Stack:** Node.js 20+, npm, `gray-matter`, `markdown-it`, `highlight.js`, Node's built-in `node:test`, semantic HTML, CSS, vanilla JavaScript.

---

## File Structure

```text
package.json                         npm scripts and dependencies
package-lock.json                    locked dependency versions
src/config.js                        categories and path configuration
src/content.js                       Markdown discovery and metadata validation
src/markdown.js                      Markdown rendering, headings, TOC, highlighting
src/model.js                         sorting, grouping, and adjacent-article navigation
src/paths.js                         relative URL calculation for file:// browsing
src/templates/layout.js              shared HTML shell, header, sidebar, footer
src/templates/home.js                home page content
src/templates/category.js            category page content
src/templates/article.js             article page content
src/build.js                         build orchestration and filesystem output
scripts/build.js                     command-line entry point
static/styles.css                    offline visual design
static/blog.js                       TOC state and back-to-top behavior
content/*/*.md                       author-maintained Markdown articles
tests/content.test.js                parsing and validation tests
tests/markdown.test.js               Markdown, heading, and TOC tests
tests/model.test.js                  ordering and navigation tests
tests/paths.test.js                  file://-safe relative path tests
tests/build.test.js                  complete build integration test
```

Generated files are `index.html`, `articles/`, `categories/`, and `assets/`.

### Task 1: Project Scaffold and Configuration

**Files:**
- Create: `package.json`
- Create: `src/config.js`
- Create: `tests/config.test.js`

- [ ] **Step 1: Create the package manifest**

```json
{
  "name": "personal-static-blog",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "node scripts/build.js",
    "test": "node --test"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "highlight.js": "^11.11.1",
    "markdown-it": "^14.1.0"
  }
}
```

- [ ] **Step 2: Install and lock dependencies**

Run: `npm install`

Expected: exit code `0`, `package-lock.json` created, and no unresolved dependency errors.

- [ ] **Step 3: Write the failing category configuration test**

```js
// tests/config.test.js
import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORIES, CATEGORY_BY_KEY } from "../src/config.js";

test("defines the four blog categories in menu order", () => {
  assert.deepEqual(
    CATEGORIES.map(({ key, label }) => ({ key, label })),
    [
      { key: "java", label: "Java" },
      { key: "ai", label: "人工智能" },
      { key: "literature", label: "文学创作" },
      { key: "essays", label: "个人随笔" }
    ]
  );
  assert.equal(CATEGORY_BY_KEY.get("ai").label, "人工智能");
});
```

- [ ] **Step 4: Run the test and verify it fails**

Run: `npm test -- tests/config.test.js`

Expected: FAIL because `src/config.js` does not exist.

- [ ] **Step 5: Implement category configuration**

```js
// src/config.js
export const CATEGORIES = Object.freeze([
  {
    key: "java",
    label: "Java",
    description: "Java、Spring 与后端工程实践。"
  },
  {
    key: "ai",
    label: "人工智能",
    description: "关于模型、工具与智能时代的学习记录。"
  },
  {
    key: "literature",
    label: "文学创作",
    description: "小说、散文与其他文学练习。"
  },
  {
    key: "essays",
    label: "个人随笔",
    description: "生活观察、阅读感受与个人思考。"
  }
]);

export const CATEGORY_BY_KEY = new Map(
  CATEGORIES.map((category) => [category.key, category])
);

export const CATEGORY_BY_LABEL = new Map(
  CATEGORIES.map((category) => [category.label, category])
);
```

- [ ] **Step 6: Run the test and verify it passes**

Run: `npm test -- tests/config.test.js`

Expected: one passing test.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/config.js tests/config.test.js
git commit -m "chore: scaffold static blog generator"
```

### Task 2: Markdown Discovery and Metadata Validation

**Files:**
- Create: `src/content.js`
- Create: `tests/content.test.js`

- [ ] **Step 1: Write failing parser and validation tests**

```js
// tests/content.test.js
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadArticles } from "../src/content.js";

async function fixture(markdown, relativePath = "java/concurrency.md") {
  const root = await mkdtemp(path.join(os.tmpdir(), "blog-content-"));
  const filename = path.join(root, relativePath);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, markdown, "utf8");
  return root;
}

test("loads valid metadata and derives stable article paths", async () => {
  const root = await fixture(`---
title: Java 并发编程笔记
date: 2026-06-10
category: Java
summary: 梳理并发编程核心概念
---
# 正文
`);

  const [article] = await loadArticles(root);
  assert.equal(article.slug, "concurrency");
  assert.equal(article.categoryKey, "java");
  assert.equal(article.outputPath, "articles/java/concurrency.html");
  assert.equal(article.dateText, "2026-06-10");
  assert.match(article.body, /# 正文/);
});

test("reports the source path when required metadata is missing", async () => {
  const root = await fixture(`---
title: 缺少摘要
date: 2026-06-10
category: Java
---
正文
`, "java/broken.md");

  await assert.rejects(
    () => loadArticles(root),
    /java[/\\]broken\.md: missing required field "summary"/
  );
});

test("rejects invalid dates and unknown categories", async () => {
  const badDate = await fixture(`---
title: 日期错误
date: 2026-02-30
category: Java
summary: test
---
正文
`);
  await assert.rejects(() => loadArticles(badDate), /invalid date/);

  const badCategory = await fixture(`---
title: 分类错误
date: 2026-06-10
category: 数据库
summary: test
---
正文
`);
  await assert.rejects(() => loadArticles(badCategory), /unknown category/);
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm test -- tests/content.test.js`

Expected: FAIL because `loadArticles` is not implemented.

- [ ] **Step 3: Implement recursive discovery and validation**

```js
// src/content.js
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { CATEGORY_BY_LABEL } from "./config.js";

const REQUIRED_FIELDS = ["title", "date", "category", "summary"];

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(filename);
    return entry.isFile() && entry.name.endsWith(".md") ? [filename] : [];
  }));
  return files.flat().sort();
}

function parseDate(value, sourcePath) {
  const text = value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${sourcePath}: invalid date "${text}"`);
  }
  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== text) {
    throw new Error(`${sourcePath}: invalid date "${text}"`);
  }
  return { date, dateText: text };
}

export async function loadArticles(contentDirectory) {
  const files = await markdownFiles(contentDirectory);
  const outputPaths = new Set();

  return Promise.all(files.map(async (filename) => {
    const source = await readFile(filename, "utf8");
    const parsed = matter(source);
    const sourcePath = path.relative(contentDirectory, filename);

    for (const field of REQUIRED_FIELDS) {
      if (parsed.data[field] === undefined || parsed.data[field] === "") {
        throw new Error(`${sourcePath}: missing required field "${field}"`);
      }
    }

    const category = CATEGORY_BY_LABEL.get(String(parsed.data.category));
    if (!category) {
      throw new Error(`${sourcePath}: unknown category "${parsed.data.category}"`);
    }

    const { date, dateText } = parseDate(parsed.data.date, sourcePath);
    const slug = path.basename(filename, ".md");
    const outputPath = path.posix.join(
      "articles",
      category.key,
      `${slug}.html`
    );
    if (outputPaths.has(outputPath)) {
      throw new Error(`${sourcePath}: duplicate output path "${outputPath}"`);
    }
    outputPaths.add(outputPath);

    return {
      title: String(parsed.data.title),
      summary: String(parsed.data.summary),
      categoryKey: category.key,
      categoryLabel: category.label,
      date,
      dateText,
      slug,
      sourcePath,
      outputPath,
      body: parsed.content
    };
  }));
}
```

- [ ] **Step 4: Run parser tests**

Run: `npm test -- tests/content.test.js`

Expected: all parser and validation tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/content.js tests/content.test.js
git commit -m "feat: parse and validate markdown articles"
```

### Task 3: Markdown Rendering, Heading Anchors, and TOC

**Files:**
- Create: `src/markdown.js`
- Create: `tests/markdown.test.js`

- [ ] **Step 1: Write failing rendering tests**

```js
// tests/markdown.test.js
import assert from "node:assert/strict";
import test from "node:test";
import { renderMarkdown } from "../src/markdown.js";

test("renders headings with unique anchors and builds a table of contents", () => {
  const rendered = renderMarkdown(`
## 基础概念
正文
### 锁
内容
## 基础概念
结尾
`);

  assert.match(rendered.html, /id="基础概念"/);
  assert.match(rendered.html, /id="基础概念-2"/);
  assert.deepEqual(rendered.toc, [
    { level: 2, id: "基础概念", text: "基础概念" },
    { level: 3, id: "锁", text: "锁" },
    { level: 2, id: "基础概念-2", text: "基础概念" }
  ]);
});

test("highlights fenced code without loading a CDN", () => {
  const rendered = renderMarkdown("```java\nclass Demo {}\n```");
  assert.match(rendered.html, /hljs/);
  assert.match(rendered.html, /language-java/);
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm test -- tests/markdown.test.js`

Expected: FAIL because `renderMarkdown` does not exist.

- [ ] **Step 3: Implement Markdown rendering**

```js
// src/markdown.js
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";

function plainText(tokens, index) {
  const inline = tokens[index + 1];
  return inline?.type === "inline" ? inline.content : "";
}

function slugify(text) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return slug || "section";
}

export function renderMarkdown(source) {
  const toc = [];
  const slugCounts = new Map();
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight(code, language) {
      const known = language && hljs.getLanguage(language);
      const highlighted = known
        ? hljs.highlight(code, { language }).value
        : hljs.highlightAuto(code).value;
      const className = known ? ` language-${language}` : "";
      return `<pre><code class="hljs${className}">${highlighted}</code></pre>`;
    }
  });

  markdown.core.ruler.push("collect_headings", (state) => {
    state.tokens.forEach((token, index) => {
      if (token.type !== "heading_open") return;
      const level = Number(token.tag.slice(1));
      if (level < 2 || level > 3) return;
      const text = plainText(state.tokens, index);
      const base = slugify(text);
      const count = (slugCounts.get(base) ?? 0) + 1;
      slugCounts.set(base, count);
      const id = count === 1 ? base : `${base}-${count}`;
      token.attrSet("id", id);
      toc.push({ level, id, text });
    });
  });

  return { html: markdown.render(source), toc };
}
```

- [ ] **Step 4: Run rendering tests**

Run: `npm test -- tests/markdown.test.js`

Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/markdown.js tests/markdown.test.js
git commit -m "feat: render markdown articles with toc"
```

### Task 4: Site Model and File-Safe Relative Paths

**Files:**
- Create: `src/model.js`
- Create: `src/paths.js`
- Create: `tests/model.test.js`
- Create: `tests/paths.test.js`

- [ ] **Step 1: Write failing model tests**

```js
// tests/model.test.js
import assert from "node:assert/strict";
import test from "node:test";
import { buildSiteModel } from "../src/model.js";

const article = (title, dateText, categoryKey = "java") => ({
  title,
  dateText,
  date: new Date(`${dateText}T00:00:00Z`),
  categoryKey,
  outputPath: `articles/${categoryKey}/${title}.html`
});

test("sorts newest first and creates navigation within each category", () => {
  const newest = article("newest", "2026-06-10");
  const middle = article("middle", "2026-06-05");
  const oldest = article("oldest", "2026-05-01");
  const model = buildSiteModel([oldest, newest, middle]);

  assert.deepEqual(model.articles.map(({ title }) => title), [
    "newest", "middle", "oldest"
  ]);
  assert.equal(model.navigation.get(middle).previous.title, "newest");
  assert.equal(model.navigation.get(middle).next.title, "oldest");
  assert.equal(model.navigation.get(newest).previous, null);
  assert.equal(model.navigation.get(oldest).next, null);
});

test("retains empty configured categories", () => {
  const model = buildSiteModel([]);
  assert.equal(model.categories.length, 4);
  assert.equal(model.categories[0].articles.length, 0);
});
```

- [ ] **Step 2: Write failing relative-path tests**

```js
// tests/paths.test.js
import assert from "node:assert/strict";
import test from "node:test";
import { hrefFrom } from "../src/paths.js";

test("creates relative links that work from generated file locations", () => {
  assert.equal(hrefFrom("index.html", "categories/java.html"), "categories/java.html");
  assert.equal(
    hrefFrom("articles/java/concurrency.html", "index.html"),
    "../../index.html"
  );
  assert.equal(
    hrefFrom("categories/java.html", "assets/styles.css"),
    "../assets/styles.css"
  );
});
```

- [ ] **Step 3: Run tests and verify they fail**

Run: `npm test -- tests/model.test.js tests/paths.test.js`

Expected: FAIL because the model and path modules do not exist.

- [ ] **Step 4: Implement the site model**

```js
// src/model.js
import { CATEGORIES } from "./config.js";

export function buildSiteModel(inputArticles) {
  const articles = [...inputArticles].sort(
    (left, right) =>
      right.date - left.date || left.title.localeCompare(right.title, "zh-CN")
  );
  const categories = CATEGORIES.map((category) => ({
    ...category,
    articles: articles.filter((article) => article.categoryKey === category.key)
  }));
  const navigation = new Map();

  for (const category of categories) {
    category.articles.forEach((article, index) => {
      navigation.set(article, {
        previous: category.articles[index - 1] ?? null,
        next: category.articles[index + 1] ?? null
      });
    });
  }

  return { articles, categories, navigation };
}
```

- [ ] **Step 5: Implement relative URL calculation**

```js
// src/paths.js
import path from "node:path";

export function hrefFrom(fromOutputPath, toOutputPath) {
  const fromDirectory = path.posix.dirname(fromOutputPath);
  const relative = path.posix.relative(fromDirectory, toOutputPath);
  return relative || path.posix.basename(toOutputPath);
}
```

- [ ] **Step 6: Run model and path tests**

Run: `npm test -- tests/model.test.js tests/paths.test.js`

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/model.js src/paths.js tests/model.test.js tests/paths.test.js
git commit -m "feat: build article indexes and navigation"
```

### Task 5: HTML Templates

**Files:**
- Create: `src/templates/escape.js`
- Create: `src/templates/layout.js`
- Create: `src/templates/home.js`
- Create: `src/templates/category.js`
- Create: `src/templates/article.js`
- Create: `tests/templates.test.js`

- [ ] **Step 1: Write failing template tests**

```js
// tests/templates.test.js
import assert from "node:assert/strict";
import test from "node:test";
import { renderHomePage } from "../src/templates/home.js";
import { renderArticlePage } from "../src/templates/article.js";

const categories = [
  { key: "java", label: "Java", description: "Java notes", articles: [] }
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
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `npm test -- tests/templates.test.js`

Expected: FAIL because template modules do not exist.

- [ ] **Step 3: Implement HTML escaping**

```js
// src/templates/escape.js
export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
```

- [ ] **Step 4: Implement the shared layout**

```js
// src/templates/layout.js
import { hrefFrom } from "../paths.js";
import { escapeHtml } from "./escape.js";

export function renderLayout({ title, description, categories, pagePath, content }) {
  const homeHref = hrefFrom(pagePath, "index.html");
  const menu = categories.map((category) => `
    <a href="${hrefFrom(pagePath, `categories/${category.key}.html`)}">
      ${escapeHtml(category.label)}
    </a>`).join("");
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
```

- [ ] **Step 5: Implement home, category, and article templates**

```js
// src/templates/home.js
import { hrefFrom } from "../paths.js";
import { escapeHtml } from "./escape.js";
import { renderLayout } from "./layout.js";

function articleList(articles, pagePath) {
  if (articles.length === 0) return "<p class=\"empty-state\">暂无文章</p>";
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

export { articleList };
```

```js
// src/templates/category.js
import { escapeHtml } from "./escape.js";
import { renderLayout } from "./layout.js";
import { articleList } from "./home.js";

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
```

```js
// src/templates/article.js
import { hrefFrom } from "../paths.js";
import { escapeHtml } from "./escape.js";
import { renderLayout } from "./layout.js";

function adjacentLink(label, target, pagePath) {
  if (!target) return `<span class="adjacent-empty">${label}</span>`;
  return `<a href="${hrefFrom(pagePath, target.outputPath)}">
    <span>${label}</span><strong>${escapeHtml(target.title)}</strong>
  </a>`;
}

export function renderArticlePage({
  article,
  categories,
  adjacent,
  pagePath
}) {
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
```

- [ ] **Step 6: Run template tests**

Run: `npm test -- tests/templates.test.js`

Expected: all template tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/templates tests/templates.test.js
git commit -m "feat: add offline blog page templates"
```

### Task 6: Build Pipeline and Offline Assets

**Files:**
- Create: `src/build.js`
- Create: `scripts/build.js`
- Create: `static/styles.css`
- Create: `static/blog.js`
- Create: `tests/build.test.js`

- [ ] **Step 1: Write the failing integration test**

```js
// tests/build.test.js
import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildSite } from "../src/build.js";

test("builds an entirely local browsable site", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "blog-build-"));
  const content = path.join(root, "content", "java");
  const staticDirectory = path.join(root, "static");
  await mkdir(content, { recursive: true });
  await mkdir(staticDirectory, { recursive: true });
  await writeFile(path.join(staticDirectory, "styles.css"), "body{}", "utf8");
  await writeFile(path.join(staticDirectory, "blog.js"), "", "utf8");
  await writeFile(path.join(content, "demo.md"), `---
title: 示例文章
date: 2026-06-10
category: Java
summary: 用于完整构建测试
---
## 第一节
正文
`, "utf8");

  await buildSite({
    rootDirectory: root,
    contentDirectory: path.join(root, "content"),
    staticDirectory
  });

  const home = await readFile(path.join(root, "index.html"), "utf8");
  const article = await readFile(
    path.join(root, "articles/java/demo.html"),
    "utf8"
  );
  assert.match(home, /articles\/java\/demo\.html/);
  assert.match(article, /第一节/);
  assert.doesNotMatch(home + article, /https?:\/\//);
  await access(path.join(root, "categories/ai.html"));
  await access(path.join(root, "assets/styles.css"));
  await access(path.join(root, "assets/blog.js"));
});
```

- [ ] **Step 2: Run the integration test and verify it fails**

Run: `npm test -- tests/build.test.js`

Expected: FAIL because `buildSite` does not exist.

- [ ] **Step 3: Implement build orchestration**

```js
// src/build.js
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadArticles } from "./content.js";
import { renderMarkdown } from "./markdown.js";
import { buildSiteModel } from "./model.js";
import { renderArticlePage } from "./templates/article.js";
import { renderCategoryPage } from "./templates/category.js";
import { renderHomePage } from "./templates/home.js";

async function writeOutput(rootDirectory, outputPath, contents) {
  const filename = path.join(rootDirectory, ...outputPath.split("/"));
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, contents, "utf8");
}

export async function buildSite({
  rootDirectory,
  contentDirectory = path.join(rootDirectory, "content"),
  staticDirectory = path.join(rootDirectory, "static")
}) {
  const loaded = await loadArticles(contentDirectory);
  const rendered = loaded.map((article) => ({
    ...article,
    ...renderMarkdown(article.body)
  }));
  const model = buildSiteModel(rendered);

  await Promise.all([
    rm(path.join(rootDirectory, "articles"), { recursive: true, force: true }),
    rm(path.join(rootDirectory, "categories"), { recursive: true, force: true }),
    rm(path.join(rootDirectory, "assets"), { recursive: true, force: true })
  ]);

  await writeOutput(
    rootDirectory,
    "index.html",
    renderHomePage({
      categories: model.categories,
      articles: model.articles,
      pagePath: "index.html"
    })
  );

  for (const category of model.categories) {
    const pagePath = `categories/${category.key}.html`;
    await writeOutput(
      rootDirectory,
      pagePath,
      renderCategoryPage({
        category,
        categories: model.categories,
        pagePath
      })
    );
  }

  for (const article of model.articles) {
    await writeOutput(
      rootDirectory,
      article.outputPath,
      renderArticlePage({
        article,
        categories: model.categories,
        adjacent: model.navigation.get(article),
        pagePath: article.outputPath
      })
    );
  }

  await cp(staticDirectory, path.join(rootDirectory, "assets"), {
    recursive: true
  });
  return model;
}
```

```js
// scripts/build.js
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite } from "../src/build.js";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

try {
  const model = await buildSite({ rootDirectory });
  console.log(
    `Built ${model.articles.length} article(s) in ${model.categories.length} categories.`
  );
} catch (error) {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
}
```

- [ ] **Step 4: Add offline interaction JavaScript**

```js
// static/blog.js
const topLink = document.querySelector(".back-to-top");

if (topLink) {
  const updateVisibility = () => {
    topLink.classList.toggle("is-visible", window.scrollY > 480);
  };
  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });
}

for (const link of document.querySelectorAll(".article-toc a")) {
  link.addEventListener("click", () => {
    document.querySelector(".article-toc a[aria-current]")?.removeAttribute(
      "aria-current"
    );
    link.setAttribute("aria-current", "location");
  });
}
```

- [ ] **Step 5: Add the complete responsive stylesheet**

Create `static/styles.css` with these required style groups:

```css
:root {
  --paper: #f5f0e8;
  --paper-deep: #ebe2d5;
  --ink: #292724;
  --muted: #756e65;
  --line: #d6cbbd;
  --accent: #7a4c3b;
  --content: 1120px;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--ink);
  background: var(--paper);
  font-family: "Noto Serif SC", "Songti SC", Georgia, serif;
  line-height: 1.75;
}
a { color: inherit; }
img { max-width: 100%; height: auto; }
.shell { width: min(calc(100% - 40px), var(--content)); margin-inline: auto; }
.site-header { border-bottom: 1px solid var(--line); }
.header-inner {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.brand { font-size: 1.35rem; font-weight: 700; text-decoration: none; }
.site-header nav { display: flex; flex-wrap: wrap; gap: 22px; }
.site-header nav a { color: var(--muted); text-decoration: none; }
.site-header nav a:hover { color: var(--accent); }
.page-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 64px;
  padding-block: 64px;
}
.hero, .page-heading, .article-header {
  padding-bottom: 34px;
  margin-bottom: 38px;
  border-bottom: 1px solid var(--line);
}
.hero h1, .page-heading h1, .article-header h1 {
  max-width: 760px;
  margin: 8px 0 16px;
  font-size: clamp(2rem, 5vw, 3.8rem);
  line-height: 1.18;
}
.eyebrow, .article-meta, .article-category, time {
  color: var(--accent);
  font-family: system-ui, sans-serif;
  font-size: .76rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.article-list { margin: 0; padding: 0; list-style: none; }
.article-list li { border-bottom: 1px solid var(--line); }
.article-list a { display: block; padding: 28px 0; text-decoration: none; }
.article-list a:hover h2 { color: var(--accent); }
.article-list h2 { margin: 6px 0; font-size: 1.55rem; }
.article-list p { margin: 0; color: var(--muted); }
.aside-card { margin-bottom: 34px; padding: 22px; background: var(--paper-deep); }
.aside-card h2 { margin-top: 4px; }
.category-list { margin: 0; padding: 0; list-style: none; }
.category-list a {
  display: flex;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
  text-decoration: none;
}
.article-toc {
  margin: 0 0 36px;
  padding: 22px 26px;
  border-left: 3px solid var(--accent);
  background: var(--paper-deep);
}
.article-toc ol { margin: 8px 0 0; padding-left: 20px; }
.article-toc .toc-level-3 { margin-left: 18px; }
.article-toc a[aria-current] { color: var(--accent); font-weight: 700; }
.prose { font-size: 1.08rem; }
.prose h2, .prose h3 { scroll-margin-top: 20px; line-height: 1.35; }
.prose h2 { margin-top: 2.4em; }
.prose h3 { margin-top: 1.8em; }
.prose blockquote {
  margin-inline: 0;
  padding-left: 20px;
  color: var(--muted);
  border-left: 3px solid var(--line);
}
.prose pre {
  overflow-x: auto;
  padding: 20px;
  border-radius: 4px;
  background: #24211f;
}
.prose code { font-family: "SFMono-Regular", Consolas, monospace; }
.hljs { color: #eee4d7; background: transparent; }
.hljs-keyword, .hljs-selector-tag { color: #e4a98f; }
.hljs-string, .hljs-attr { color: #b9cf9d; }
.hljs-number, .hljs-literal { color: #d4b77e; }
.adjacent-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 56px;
}
.adjacent-nav a, .adjacent-empty {
  min-height: 96px;
  padding: 18px;
  border: 1px solid var(--line);
  text-decoration: none;
}
.adjacent-nav span, .adjacent-nav strong { display: block; }
.adjacent-nav span { color: var(--muted); font-size: .8rem; }
.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  padding: 9px 13px;
  opacity: 0;
  pointer-events: none;
  color: var(--paper);
  background: var(--ink);
  text-decoration: none;
  transition: opacity .2s;
}
.back-to-top.is-visible { opacity: 1; pointer-events: auto; }
.site-footer { padding: 28px 0; color: var(--muted); border-top: 1px solid var(--line); }
.empty-state { padding: 48px 0; color: var(--muted); }

@media (max-width: 760px) {
  .shell { width: min(calc(100% - 28px), var(--content)); }
  .header-inner { align-items: flex-start; flex-direction: column; padding-block: 18px; }
  .site-header nav { gap: 12px 18px; }
  .page-grid { grid-template-columns: 1fr; gap: 40px; padding-block: 40px; }
  .page-grid aside { order: 2; }
  .adjacent-nav { grid-template-columns: 1fr; }
  .back-to-top { right: 14px; bottom: 14px; }
}
```

- [ ] **Step 6: Run the integration test**

Run: `npm test -- tests/build.test.js`

Expected: the complete build test passes and finds no remote URLs.

- [ ] **Step 7: Commit**

```bash
git add src/build.js scripts/build.js static tests/build.test.js
git commit -m "feat: generate complete offline blog"
```

### Task 7: Seed Content and End-to-End Verification

**Files:**
- Create: `content/java/welcome-to-java.md`
- Create: `content/ai/thinking-with-ai.md`
- Create: `content/literature/a-summer-night.md`
- Create: `content/essays/why-i-write.md`
- Generate: `index.html`
- Generate: `articles/**/*.html`
- Generate: `categories/*.html`
- Generate: `assets/*`

- [ ] **Step 1: Add one representative Markdown article per category**

Create each file with the exact content below so ordering and category counts
are deterministic:

`content/java/welcome-to-java.md`:

````markdown
---
title: 从这里开始记录 Java
date: 2026-06-10
category: Java
summary: 整理 Java 与后端工程学习中的关键问题。
---

## 为什么重新整理

知识需要经过表达，才能从模糊印象变成可以复用的理解。

## 示例代码

```java
public class HelloBlog {
    public static void main(String[] args) {
        System.out.println("Hello, blog.");
    }
}
```
````

`content/ai/thinking-with-ai.md`:

```markdown
---
title: 与人工智能一起思考
date: 2026-06-08
category: 人工智能
summary: 记录使用智能工具时的方法、边界与判断。
---

## 工具不是结论

人工智能可以帮助整理材料和提出候选答案，但判断仍然属于使用者。

## 保留验证习惯

面对事实、代码和重要决定，需要回到可靠来源与实际运行结果。
```

`content/literature/a-summer-night.md`:

```markdown
---
title: 夏夜短篇
date: 2026-06-05
category: 文学创作
summary: 一篇关于夜色、旧街与归途的短篇练习。
---

## 旧街

路灯把树影投在旧墙上，晚风从没有关严的窗边穿过。

## 归途

他沿着熟悉的石阶向前，终于听见远处传来的钟声。
```

`content/essays/why-i-write.md`:

```markdown
---
title: 为什么开始写博客
date: 2026-06-01
category: 个人随笔
summary: 为零散思考寻找一个可以长期沉淀的地方。
---

## 留下过程

结论会变化，思考的过程却能说明当时看见了什么、忽略了什么。

## 长期整理

博客不是即时消息流，而是一份可以持续修订和重新阅读的个人档案。
```

- [ ] **Step 2: Run the full automated test suite**

Run: `npm test`

Expected: all configuration, content, Markdown, model, path, template, and build tests pass.

- [ ] **Step 3: Generate the real site**

Run: `npm run build`

Expected output:

```text
Built 4 article(s) in 4 categories.
```

- [ ] **Step 4: Check generated files and links**

Run:

```bash
test -f index.html
test -f categories/java.html
test -f categories/ai.html
test -f categories/literature.html
test -f categories/essays.html
test -f articles/java/welcome-to-java.html
rg -n 'https?://' index.html articles categories assets
```

Expected: all `test` commands exit `0`; `rg` returns no matches and exit code `1`.

- [ ] **Step 5: Open `index.html` directly in the in-app browser**

Navigate to the absolute `file:///.../index.html` URL. Verify:

- The warm-paper classic two-column layout renders.
- All four menu links open their generated category pages.
- Every category contains one article.
- The newest article is the Java article dated `2026-06-10`.
- Opening an article shows rendered prose, not Markdown source.
- The article TOC jumps to headings.
- Code is highlighted without a remote request.
- Previous/next links stay within the same category.
- Back-to-top appears after scrolling.

- [ ] **Step 6: Verify narrow-screen behavior**

Set the browser viewport to `390x844`, reload the home and an article page, and verify:

- Header navigation wraps without horizontal scrolling.
- Main content and sidebar become one column.
- Code blocks scroll internally.
- Adjacent navigation becomes one column.

Reset the browser viewport after verification.

- [ ] **Step 7: Check repository state and commit**

Run: `git status --short`

Confirm only intended source, content, tests, and generated site files are present.

```bash
git add content index.html articles categories assets
git commit -m "feat: publish initial personal blog"
```

### Task 8: Final Verification

**Files:**
- Verify all files changed by Tasks 1-7

- [ ] **Step 1: Run a clean rebuild**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: all tests pass, four articles are built, and `git diff --check` prints nothing.

- [ ] **Step 2: Confirm generated output is reproducible**

Run:

```bash
git status --short
npm run build
git status --short
```

Expected: the second build introduces no new changes.

- [ ] **Step 3: Review acceptance criteria**

Confirm each design requirement has direct evidence:

- Markdown is the only article authoring format.
- `index.html` opens without a server.
- Four category pages exist even when categories are empty.
- Homepage shows categories and newest-first articles.
- Article pages include TOC, code highlighting, adjacent navigation, and back-to-top.
- No generated page requires network access.
- Invalid metadata fails with a file-specific error.
- Desktop and mobile layouts were checked in a browser.

- [ ] **Step 4: Resolve verification findings in their owning task**

If verification finds a defect, return to the task that owns the affected file,
add or strengthen its failing test, implement the correction, rerun that task's
test command, and repeat Tasks 8.1-8.3. Do not create an empty commit when no
correction is needed.
