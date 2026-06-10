import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadArticles } from "./content.js";
import { renderMarkdown } from "./markdown.js";
import { buildSiteModel } from "./model.js";
import { renderArticlePage } from "./templates/article.js";
import { renderCategoryPage } from "./templates/category.js";
import { renderHomePage } from "./templates/home.js";

async function writeOutput(rootDirectory, outputPath, contents) {
  const filename = path.join(rootDirectory, ...outputPath.split("/"));
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, contents, "utf8");
}

export async function buildSite({
  rootDirectory,
  contentDirectory = path.join(rootDirectory, "content"),
  staticDirectory = path.join(rootDirectory, "static")
}) {
  const loaded = await loadArticles(contentDirectory);
  const rendered = loaded.map((article) => ({
    ...article,
    ...renderMarkdown(article.body)
  }));
  const model = buildSiteModel(rendered);

  await Promise.all([
    rm(path.join(rootDirectory, "articles"), { recursive: true, force: true }),
    rm(path.join(rootDirectory, "categories"), { recursive: true, force: true }),
    rm(path.join(rootDirectory, "assets"), { recursive: true, force: true })
  ]);

  await writeOutput(
    rootDirectory,
    "index.html",
    renderHomePage({
      categories: model.categories,
      articles: model.articles,
      pagePath: "index.html"
    })
  );

  for (const category of model.categories) {
    const pagePath = `categories/${category.key}.html`;
    await writeOutput(
      rootDirectory,
      pagePath,
      renderCategoryPage({
        category,
        categories: model.categories,
        pagePath
      })
    );
  }

  for (const article of model.articles) {
    await writeOutput(
      rootDirectory,
      article.outputPath,
      renderArticlePage({
        article,
        categories: model.categories,
        adjacent: model.navigation.get(article),
        pagePath: article.outputPath
      })
    );
  }

  await cp(staticDirectory, path.join(rootDirectory, "assets"), {
    recursive: true
  });
  return model;
}
