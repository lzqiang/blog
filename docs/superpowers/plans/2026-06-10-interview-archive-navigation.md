# Interview Archive Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an automatically generated year/month archive panel and archive pages for the interview category.

**Architecture:** Extend the existing site model with interview-only archive groups derived from article dates. Pass those groups through the shared layout, generate year/month pages with the existing article-list template, and use small vanilla JavaScript and CSS additions for the accessible click-to-expand navigation.

**Tech Stack:** Node.js 20+, Node `node:test`, semantic HTML, CSS, vanilla JavaScript.

---

## File Structure

```text
src/model.js                  build sorted interview year/month groups
src/templates/layout.js       render the interview navigation panel
src/templates/home.js         forward archive data to the shared layout
src/templates/category.js     render year and month archive pages
src/templates/article.js      forward archive data to the shared layout
src/build.js                  write archive HTML files
static/blog.js                open and close the archive panel
static/styles.css             desktop and mobile archive navigation styles
tests/model.test.js           archive grouping tests
tests/templates.test.js       archive navigation and page template tests
tests/build.test.js           generated archive file and relative-link tests
tests/static.test.js          interaction script tests
tests/styles.test.js          responsive archive style tests
```

Generated output also updates `index.html`, `articles/`, `categories/`, and
`assets/` after the final build.

### Task 1: Interview Archive Model

**Files:**
- Modify: `tests/model.test.js`
- Modify: `src/model.js`

- [ ] **Step 1: Write the failing archive grouping tests**

Add these tests to `tests/model.test.js`:

```js
test("groups interview articles by year and month newest first", () => {
  const june = article("june", "2026-06-10", "interview");
  const january = article("january", "2026-01-05", "interview");
  const future = article("future", "2027-02-03", "interview");
  const java = article("java", "2027-03-01", "java");

  const model = buildSiteModel([january, java, june, future]);

  assert.deepEqual(
    model.interviewArchives.map(({ year, articles, months }) => ({
      year,
      articles: articles.map(({ title }) => title),
      months: months.map(({ month, articles: monthArticles }) => ({
        month,
        articles: monthArticles.map(({ title }) => title)
      }))
    })),
    [
      {
        year: "2027",
        articles: ["future"],
        months: [{ month: "02", articles: ["future"] }]
      },
      {
        year: "2026",
        articles: ["june", "january"],
        months: [
          { month: "06", articles: ["june"] },
          { month: "01", articles: ["january"] }
        ]
      }
    ]
  );
});

test("returns no interview archives when the category is empty", () => {
  const model = buildSiteModel([article("java", "2026-06-10")]);
  assert.deepEqual(model.interviewArchives, []);
});
```

- [ ] **Step 2: Run the model tests and verify RED**

Run:

```bash
npm test -- tests/model.test.js
```

Expected: FAIL because `model.interviewArchives` is undefined.

- [ ] **Step 3: Implement the minimal archive grouping**

Add this helper above `buildSiteModel` in `src/model.js`:

```js
function buildInterviewArchives(articles) {
  const years = new Map();

  for (const article of articles) {
    if (article.categoryKey !== "interview") {
      continue;
    }

    const year = article.dateText.slice(0, 4);
    const month = article.dateText.slice(5, 7);
    if (!years.has(year)) {
      years.set(year, new Map());
    }
    const months = years.get(year);
    if (!months.has(month)) {
      months.set(month, []);
    }
    months.get(month).push(article);
  }

  return [...years.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([year, months]) => {
      const monthGroups = [...months.entries()]
        .sort(([left], [right]) => right.localeCompare(left))
        .map(([month, monthArticles]) => ({
          month,
          articles: monthArticles
        }));
      return {
        year,
        months: monthGroups,
        articles: monthGroups.flatMap(({ articles: monthArticles }) =>
          monthArticles
        )
      };
    });
}
```

Add the archive data to the return value:

```js
return {
  articles,
  categories,
  navigation,
  interviewArchives: buildInterviewArchives(articles)
};
```

- [ ] **Step 4: Run the model tests and verify GREEN**

Run:

```bash
npm test -- tests/model.test.js
```

Expected: all model tests pass.

- [ ] **Step 5: Commit the model change**

```bash
git add src/model.js tests/model.test.js
git commit -m "feat(blog): group interview archives by date"
```

### Task 2: Archive Navigation and Page Templates

**Files:**
- Modify: `tests/templates.test.js`
- Modify: `src/templates/layout.js`
- Modify: `src/templates/home.js`
- Modify: `src/templates/category.js`
- Modify: `src/templates/article.js`

- [ ] **Step 1: Write failing navigation and archive page tests**

Update the template test imports:

```js
import {
  renderArchivePage,
  renderCategoryPage
} from "../src/templates/category.js";
```

Add a complete interview category and archive fixture:

```js
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
```

Add these tests:

```js
test("renders an accessible interview archive toggle and links", () => {
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

  assert.match(html, /class="archive-toggle"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="interview-archives"/);
  assert.match(html, /href="categories\/interview\/2026\.html"/);
  assert.match(html, /href="categories\/interview\/2026\/06\.html"/);
});

test("does not render an archive toggle without interview articles", () => {
  const html = renderHomePage({
    categories,
    articles: [],
    interviewArchives: [],
    pagePath: "index.html"
  });

  assert.doesNotMatch(html, /archive-toggle/);
});

test("renders an archive page with relative article links", () => {
  const html = renderArchivePage({
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

  assert.match(html, /2026 年 06 月面试题/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/articles\/interview\/june\.html"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/assets\/styles\.css"/);
});
```

- [ ] **Step 2: Run template tests and verify RED**

Run:

```bash
npm test -- tests/templates.test.js
```

Expected: FAIL because archive arguments are not forwarded, archive markup is
absent, and `renderArchivePage` is not exported.

- [ ] **Step 3: Forward archive data through page templates**

Add `interviewArchives = []` to `renderHomePage`, `renderCategoryPage`, and
`renderArticlePage` parameters and pass it to `renderLayout`:

```js
return renderLayout({
  title,
  description,
  categories,
  interviewArchives,
  pagePath,
  content
});
```

Use the existing concrete values for `title`, `description`, and `content` in
each template.

- [ ] **Step 4: Render the interview navigation in the layout**

In `src/templates/layout.js`, add:

```js
function archiveMenu(interviewArchives, pagePath) {
  if (interviewArchives.length === 0) {
    return "";
  }

  return `
    <button class="archive-toggle" type="button"
      aria-label="展开面试题归档"
      aria-expanded="false"
      aria-controls="interview-archives">⌄</button>
    <div class="archive-panel" id="interview-archives" hidden>
      ${interviewArchives.map(({ year, months }) => `
        <section class="archive-year">
          <a class="archive-year-link"
             href="${hrefFrom(pagePath, `categories/interview/${year}.html`)}">
            ${escapeHtml(year)} 年
          </a>
          <div class="archive-months">
            ${months.map(({ month }) => `
              <a href="${hrefFrom(
                pagePath,
                `categories/interview/${year}/${month}.html`
              )}">${escapeHtml(month)} 月</a>`).join("")}
          </div>
        </section>`).join("")}
    </div>`;
}
```

Replace menu rendering with an interview-specific wrapper:

```js
const menu = categories.map((category) => {
  const link = `
    <a href="${hrefFrom(pagePath, `categories/${category.key}.html`)}">
      ${escapeHtml(category.label)}
    </a>`;
  if (category.key !== "interview") {
    return link;
  }
  return `
    <div class="archive-nav">
      <span class="archive-nav-label">${link}${archiveMenu(
        interviewArchives,
        pagePath
      )}</span>
    </div>`;
}).join("");
```

Add `interviewArchives = []` to the `renderLayout` parameters.

- [ ] **Step 5: Add the reusable archive page renderer**

Add to `src/templates/category.js`:

```js
export function renderArchivePage({
  title,
  description,
  articles,
  categories,
  interviewArchives,
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
```

- [ ] **Step 6: Run template tests and verify GREEN**

Run:

```bash
npm test -- tests/templates.test.js
```

Expected: all template tests pass.

- [ ] **Step 7: Commit the template change**

```bash
git add src/templates tests/templates.test.js
git commit -m "feat(blog): render interview archive navigation"
```

### Task 3: Generate Year and Month Pages

**Files:**
- Modify: `tests/build.test.js`
- Modify: `src/build.js`

- [ ] **Step 1: Write the failing archive build test**

Add a helper to `tests/build.test.js`:

```js
async function writeArticle(root, relativePath, metadata) {
  const filename = path.join(root, "content", relativePath);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, `---
title: ${metadata.title}
date: ${metadata.date}
category: 面试题
summary: ${metadata.summary}
---
## 内容
正文
`, "utf8");
}
```

Add this test:

```js
test("builds interview year and month archive pages", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "blog-archive-build-"));
  const staticDirectory = path.join(root, "static");
  await mkdir(staticDirectory, { recursive: true });
  await writeFile(path.join(staticDirectory, "styles.css"), "body{}", "utf8");
  await writeFile(path.join(staticDirectory, "blog.js"), "", "utf8");
  await writeArticle(root, "interview/june.md", {
    title: "六月面试题",
    date: "2026-06-10",
    summary: "六月内容"
  });
  await writeArticle(root, "interview/january.md", {
    title: "一月面试题",
    date: "2026-01-05",
    summary: "一月内容"
  });

  await buildSite({
    rootDirectory: root,
    contentDirectory: path.join(root, "content"),
    staticDirectory
  });

  const home = await readFile(path.join(root, "index.html"), "utf8");
  const year = await readFile(
    path.join(root, "categories/interview/2026.html"),
    "utf8"
  );
  const month = await readFile(
    path.join(root, "categories/interview/2026/06.html"),
    "utf8"
  );

  assert.match(home, /categories\/interview\/2026\/06\.html/);
  assert.match(year, /六月面试题/);
  assert.match(year, /一月面试题/);
  assert.match(month, /六月面试题/);
  assert.doesNotMatch(month, /一月面试题/);
  await assert.rejects(
    access(path.join(root, "categories/interview/2026/02.html"))
  );
});
```

- [ ] **Step 2: Run the build tests and verify RED**

Run:

```bash
npm test -- tests/build.test.js
```

Expected: FAIL because archive files are not generated.

- [ ] **Step 3: Forward archives to all existing pages**

In `src/build.js`, add `interviewArchives: model.interviewArchives` to every
call to `renderHomePage`, `renderCategoryPage`, and `renderArticlePage`.

- [ ] **Step 4: Generate year and month archive pages**

Import the renderer:

```js
import {
  renderArchivePage,
  renderCategoryPage
} from "./templates/category.js";
```

Before writing article pages, add:

```js
for (const archive of model.interviewArchives) {
  const yearPath = `categories/interview/${archive.year}.html`;
  await writeOutput(
    rootDirectory,
    yearPath,
    renderArchivePage({
      title: `${archive.year} 年面试题`,
      description: `${archive.year} 年发布的面试题。`,
      articles: archive.articles,
      categories: model.categories,
      interviewArchives: model.interviewArchives,
      pagePath: yearPath
    })
  );

  for (const month of archive.months) {
    const monthPath =
      `categories/interview/${archive.year}/${month.month}.html`;
    await writeOutput(
      rootDirectory,
      monthPath,
      renderArchivePage({
        title: `${archive.year} 年 ${month.month} 月面试题`,
        description:
          `${archive.year} 年 ${month.month} 月发布的面试题。`,
        articles: month.articles,
        categories: model.categories,
        interviewArchives: model.interviewArchives,
        pagePath: monthPath
      })
    );
  }
}
```

- [ ] **Step 5: Run the build tests and verify GREEN**

Run:

```bash
npm test -- tests/build.test.js
```

Expected: all build tests pass and no empty month page exists.

- [ ] **Step 6: Commit the build change**

```bash
git add src/build.js tests/build.test.js
git commit -m "feat(blog): generate interview archive pages"
```

### Task 4: Interaction, Responsive Styles, and Final Build

**Files:**
- Modify: `tests/static.test.js`
- Modify: `tests/styles.test.js`
- Modify: `static/blog.js`
- Modify: `static/styles.css`
- Generate: `index.html`
- Generate: `articles/**/*.html`
- Generate: `categories/**/*.html`
- Generate: `assets/blog.js`
- Generate: `assets/styles.css`

- [ ] **Step 1: Write failing interaction tests**

Add to `tests/static.test.js`:

```js
test("controls the interview archive panel accessibly", async () => {
  const script = await readFile(
    new URL("../static/blog.js", import.meta.url),
    "utf8"
  );

  assert.match(script, /\.archive-toggle/);
  assert.match(script, /aria-expanded/);
  assert.match(script, /Escape/);
  assert.match(script, /document\.addEventListener\("click"/);
});
```

- [ ] **Step 2: Write failing responsive style tests**

Add to `tests/styles.test.js`:

```js
test("styles the interview archive panel for desktop and mobile", async () => {
  const css = await readFile(
    new URL("../static/styles.css", import.meta.url),
    "utf8"
  );

  assert.match(css, /\.archive-nav\s*\{[^}]*position:\s*relative;/s);
  assert.match(css, /\.archive-panel\s*\{[^}]*position:\s*absolute;/s);
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*\.archive-panel\s*\{[^}]*position:\s*static;/s
  );
});
```

- [ ] **Step 3: Run static asset tests and verify RED**

Run:

```bash
npm test -- tests/static.test.js tests/styles.test.js
```

Expected: FAIL because archive interaction and styles are absent.

- [ ] **Step 4: Implement archive panel interaction**

Append to `static/blog.js`:

```js
const archiveToggle = document.querySelector(".archive-toggle");
const archivePanel = document.querySelector(".archive-panel");

if (archiveToggle && archivePanel) {
  const closeArchive = () => {
    archiveToggle.setAttribute("aria-expanded", "false");
    archivePanel.hidden = true;
  };

  archiveToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const expanded = archiveToggle.getAttribute("aria-expanded") === "true";
    archiveToggle.setAttribute("aria-expanded", String(!expanded));
    archivePanel.hidden = expanded;
  });

  archivePanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", closeArchive);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeArchive();
      archiveToggle.focus();
    }
  });
}
```

- [ ] **Step 5: Add desktop and mobile archive styles**

Add before the existing media query in `static/styles.css`:

```css
.archive-nav {
  position: relative;
}

.archive-nav-label {
  display: inline-flex;
  align-items: center;
}

.archive-toggle {
  padding: 4px 5px;
  color: var(--muted);
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
}

.archive-toggle:hover,
.archive-toggle[aria-expanded="true"] {
  color: var(--accent);
}

.archive-panel {
  position: absolute;
  z-index: 10;
  top: calc(100% + 14px);
  right: 0;
  width: 300px;
  padding: 14px 18px;
  background: var(--paper);
  border: 1px solid var(--line);
  box-shadow: 0 10px 28px rgb(41 39 36 / 14%);
}

.archive-panel[hidden] {
  display: none;
}

.archive-year + .archive-year {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--line);
}

.archive-year-link {
  font-weight: 700;
}

.archive-months {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  padding: 4px 0 0 18px;
}
```

Add inside the existing `@media (max-width: 760px)` block:

```css
.archive-nav {
  flex-basis: 100%;
  width: 100%;
}

.archive-panel {
  position: static;
  width: 100%;
  margin-top: 8px;
  box-shadow: none;
}

.archive-months {
  flex-direction: column;
  gap: 4px;
}
```

- [ ] **Step 6: Run static asset tests and verify GREEN**

Run:

```bash
npm test -- tests/static.test.js tests/styles.test.js
```

Expected: all static asset tests pass.

- [ ] **Step 7: Run the full automated suite**

Run:

```bash
npm test
```

Expected: all tests pass with zero failures.

- [ ] **Step 8: Build the real site**

Run:

```bash
npm run build
```

Expected: exit code `0`; generated navigation contains `2026 年` and `06 月`;
`categories/interview/2026.html` and
`categories/interview/2026/06.html` exist.

- [ ] **Step 9: Verify generated paths and repository formatting**

Run:

```bash
test -f categories/interview/2026.html
test -f categories/interview/2026/06.html
rg -n 'archive-toggle|2026 年|06 月' index.html categories/interview.html
git diff --check
```

Expected: both files exist, generated pages contain archive markup, and
`git diff --check` prints nothing.

- [ ] **Step 10: Verify behavior in the in-app browser**

Open the generated `index.html` with the in-app browser and verify:

- Clicking “面试题” opens `categories/interview.html`.
- Clicking the arrow opens and closes the panel.
- Clicking outside or pressing Escape closes the panel.
- `2026 年` opens the year page.
- `06 月` opens the month page.
- At a mobile viewport, the panel is in document flow and has no horizontal
  overflow.

- [ ] **Step 11: Commit source and generated output**

```bash
git add src static tests index.html articles categories assets
git commit -m "feat(blog): add interview archive navigation"
```

### Task 5: Final Verification

**Files:**
- Verify all files changed by Tasks 1-4

- [ ] **Step 1: Run fresh verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: all tests pass, the build succeeds, and the whitespace check prints
nothing.

- [ ] **Step 2: Confirm the build is reproducible**

Run:

```bash
git status --short
npm run build
git status --short
```

Expected: the second build introduces no additional changes.

- [ ] **Step 3: Check every acceptance criterion**

Confirm:

- Archives contain only interview articles.
- Years and months are newest first.
- Empty years and months are absent.
- The main interview link still works without JavaScript.
- Year and month pages use file-safe relative links.
- The toggle exposes correct ARIA state.
- Click outside and Escape close the panel.
- Desktop and mobile layouts were checked in a browser.

- [ ] **Step 4: Resolve any finding with a failing regression test**

If verification finds a defect, return to its owning task, add a failing test,
run it to confirm RED, implement the minimal correction, and repeat the full
verification.
