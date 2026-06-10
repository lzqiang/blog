import assert from "node:assert/strict";
import test from "node:test";
import { hrefFrom } from "../src/paths.js";

test("creates relative links that work from generated file locations", () => {
  assert.equal(
    hrefFrom("index.html", "categories/java.html"),
    "categories/java.html"
  );
  assert.equal(
    hrefFrom("articles/java/concurrency.html", "index.html"),
    "../../index.html"
  );
  assert.equal(
    hrefFrom("categories/java.html", "assets/styles.css"),
    "../assets/styles.css"
  );
});
