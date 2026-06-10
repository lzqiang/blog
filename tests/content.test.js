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

test("rejects duplicate generated paths", async () => {
  const root = await fixture(`---
title: 第一篇
date: 2026-06-10
category: Java
summary: test
---
正文
`);
  await mkdir(path.join(root, "other"), { recursive: true });
  await writeFile(path.join(root, "other", "concurrency.md"), `---
title: 第二篇
date: 2026-06-09
category: Java
summary: test
---
正文
`, "utf8");

  await assert.rejects(() => loadArticles(root), /duplicate output path/);
});
