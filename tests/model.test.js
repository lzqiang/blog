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
    "newest",
    "middle",
    "oldest"
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

test("does not link adjacent articles across categories", () => {
  const java = article("java", "2026-06-10");
  const ai = article("ai", "2026-06-09", "ai");
  const model = buildSiteModel([java, ai]);

  assert.deepEqual(model.navigation.get(java), {
    previous: null,
    next: null
  });
  assert.deepEqual(model.navigation.get(ai), {
    previous: null,
    next: null
  });
});
