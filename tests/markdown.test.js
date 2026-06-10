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
  assert.doesNotMatch(rendered.html, /https?:\/\//);
});
