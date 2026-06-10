import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORIES, CATEGORY_BY_KEY } from "../src/config.js";

test("defines the five blog categories in menu order", () => {
  assert.deepEqual(
    CATEGORIES.map(({ key, label }) => ({ key, label })),
    [
      { key: "java", label: "Java" },
      { key: "interview", label: "面试题" },
      { key: "ai", label: "人工智能" },
      { key: "literature", label: "文学创作" },
      { key: "essays", label: "个人随笔" }
    ]
  );
  assert.equal(CATEGORY_BY_KEY.get("interview").label, "面试题");
  assert.equal(CATEGORY_BY_KEY.get("ai").label, "人工智能");
});
