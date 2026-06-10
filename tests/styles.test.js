import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("allows grid content to shrink around long code lines", async () => {
  const css = await readFile(
    new URL("../static/styles.css", import.meta.url),
    "utf8"
  );

  assert.match(css, /\.page-grid > main\s*\{[^}]*min-width:\s*0;/s);
});
