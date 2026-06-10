import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import {
  CATEGORY_BY_LABEL,
  INTERVIEW_TAG_BY_LABEL
} from "./config.js";

const REQUIRED_FIELDS = ["title", "date", "category", "summary"];

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return markdownFiles(filename);
    }
    return entry.isFile() && entry.name.endsWith(".md") ? [filename] : [];
  }));
  return files.flat().sort();
}

function parseDate(value, sourcePath) {
  const text = value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${sourcePath}: invalid date "${text}"`);
  }

  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== text) {
    throw new Error(`${sourcePath}: invalid date "${text}"`);
  }
  return { date, dateText: text };
}

export async function loadArticles(contentDirectory) {
  const files = await markdownFiles(contentDirectory);
  const outputPaths = new Set();
  const articles = [];

  for (const filename of files) {
    const source = await readFile(filename, "utf8");
    const parsed = matter(source, {
      engines: {
        yaml: (frontMatter) => yaml.load(frontMatter, {
          schema: yaml.FAILSAFE_SCHEMA
        })
      }
    });
    const sourcePath = path.relative(contentDirectory, filename);

    for (const field of REQUIRED_FIELDS) {
      if (parsed.data[field] === undefined || parsed.data[field] === "") {
        throw new Error(`${sourcePath}: missing required field "${field}"`);
      }
    }

    const category = CATEGORY_BY_LABEL.get(String(parsed.data.category));
    if (!category) {
      throw new Error(`${sourcePath}: unknown category "${parsed.data.category}"`);
    }

    const { date, dateText } = parseDate(parsed.data.date, sourcePath);
    const tagLabels = Array.isArray(parsed.data.tags)
      ? parsed.data.tags.map(String)
      : [];
    if (category.key === "interview" && tagLabels.length === 0) {
      throw new Error(`${sourcePath}: interview article requires "tags"`);
    }
    const tags = tagLabels.map((label) => {
      const tag = INTERVIEW_TAG_BY_LABEL.get(label);
      if (!tag) {
        throw new Error(`${sourcePath}: unknown interview tag "${label}"`);
      }
      return tag;
    });
    const slug = path.basename(filename, ".md");
    const outputPath = path.posix.join(
      "articles",
      category.key,
      `${slug}.html`
    );
    if (outputPaths.has(outputPath)) {
      throw new Error(`${sourcePath}: duplicate output path "${outputPath}"`);
    }
    outputPaths.add(outputPath);

    articles.push({
      title: String(parsed.data.title),
      summary: String(parsed.data.summary),
      categoryKey: category.key,
      categoryLabel: category.label,
      date,
      dateText,
      tags,
      slug,
      sourcePath,
      outputPath,
      body: parsed.content
    });
  }

  return articles;
}
