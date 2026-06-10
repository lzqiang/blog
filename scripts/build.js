import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite } from "../src/build.js";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

try {
  const model = await buildSite({ rootDirectory });
  console.log(
    `Built ${model.articles.length} article(s) in ${model.categories.length} categories to dist/.`
  );
} catch (error) {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
}
