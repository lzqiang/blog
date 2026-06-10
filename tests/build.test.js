import assert from "node:assert/strict";
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";
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
