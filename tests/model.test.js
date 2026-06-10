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
  assert.equal(model.categories.length, 5);
  assert.equal(model.categories[1].key, "interview");
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

test("groups only interview archives by descending year and month", () => {
  const interview202702Older = article(
    "interview-2027-02-older",
    "2027-02-01",
    "interview"
  );
  const interview202606 = article(
    "interview-2026-06",
    "2026-06-15",
    "interview"
  );
  const interview202601 = article(
    "interview-2026-01",
    "2026-01-20",
    "interview"
  );
  const interview202702Newer = article(
    "interview-2027-02-newer",
    "2027-02-20",
    "interview"
  );
  const java202703 = article("java-2027-03", "2027-03-01");

  const model = buildSiteModel([
    interview202601,
    interview202702Older,
    java202703,
    interview202606,
    interview202702Newer
  ]);

  assert.deepEqual(
    model.interviewArchives.map(({ year, months, articles }) => ({
      year,
      months: months.map(({ month, articles: monthArticles }) => ({
        month,
        articles: monthArticles.map(({ title }) => title)
      })),
      articles: articles.map(({ title }) => title)
    })),
    [
      {
        year: "2027",
        months: [
          {
            month: "02",
            articles: [
              "interview-2027-02-newer",
              "interview-2027-02-older"
            ]
          }
        ],
        articles: [
          "interview-2027-02-newer",
          "interview-2027-02-older"
        ]
      },
      {
        year: "2026",
        months: [
          {
            month: "06",
            articles: ["interview-2026-06"]
          },
          {
            month: "01",
            articles: ["interview-2026-01"]
          }
        ],
        articles: ["interview-2026-06", "interview-2026-01"]
      }
    ]
  );
});

test("returns empty interview archives when there are no interview articles", () => {
  const model = buildSiteModel([article("java", "2027-03-01")]);

  assert.deepEqual(model.interviewArchives, []);
});
