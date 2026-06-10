import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("shows back-to-top on moderately long articles", async () => {
  const script = await readFile(
    new URL("../static/blog.js", import.meta.url),
    "utf8"
  );

  assert.match(script, /window\.scrollY > 240/);
});
