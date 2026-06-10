import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadArticles } from "./content.js";
import { renderMarkdown } from "./markdown.js";
import { buildSiteModel } from "./model.js";
import { renderArticlePage } from "./templates/article.js";
import {
  renderArchivePage,
  renderCategoryPage
} from "./templates/category.js";
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
      interviewArchives: model.interviewArchives,
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
        interviewArchives: model.interviewArchives,
        pagePath
      })
    );
  }

  for (const archive of model.interviewArchives) {
    const yearPath = `categories/interview/${archive.year}.html`;
    await writeOutput(
      rootDirectory,
      yearPath,
      renderArchivePage({
        title: `${archive.year} 年面试题`,
        description: `${archive.year} 年发布的面试题。`,
        articles: archive.articles,
        categories: model.categories,
        interviewArchives: model.interviewArchives,
        pagePath: yearPath
      })
    );

    for (const month of archive.months) {
      const monthPath =
        `categories/interview/${archive.year}/${month.month}.html`;
      await writeOutput(
        rootDirectory,
        monthPath,
        renderArchivePage({
          title: `${archive.year} 年 ${month.month} 月面试题`,
          description: `${archive.year} 年 ${month.month} 月发布的面试题。`,
          articles: month.articles,
          categories: model.categories,
          interviewArchives: model.interviewArchives,
          pagePath: monthPath
        })
      );
    }
  }

  for (const article of model.articles) {
    await writeOutput(
      rootDirectory,
      article.outputPath,
      renderArticlePage({
        article,
        categories: model.categories,
        adjacent: model.navigation.get(article),
        interviewArchives: model.interviewArchives,
        pagePath: article.outputPath
      })
    );
  }

  await cp(staticDirectory, path.join(rootDirectory, "assets"), {
    recursive: true
  });
  return model;
}
