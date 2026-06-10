import { CATEGORIES, INTERVIEW_TAGS } from "./config.js";

export function buildSiteModel(inputArticles) {
  const articles = [...inputArticles].sort(
    (left, right) =>
      right.date - left.date || left.title.localeCompare(right.title, "zh-CN")
  );
  const categories = CATEGORIES.map((category) => ({
    ...category,
    articles: articles.filter((article) => article.categoryKey === category.key)
  }));
  const navigation = new Map();
  const interviewTags = INTERVIEW_TAGS.map((tag) => ({
    ...tag,
    articles: articles.filter((article) =>
      article.categoryKey === "interview"
      && article.tags.some(({ key }) => key === tag.key)
    )
  }));

  for (const category of categories) {
    category.articles.forEach((currentArticle, index) => {
      navigation.set(currentArticle, {
        previous: category.articles[index - 1] ?? null,
        next: category.articles[index + 1] ?? null
      });
    });
  }

  return {
    articles,
    categories,
    navigation,
    interviewTags
  };
}
