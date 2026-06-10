import { CATEGORIES } from "./config.js";

function buildInterviewArchives(articles) {
  const archivesByYear = new Map();

  for (const article of articles) {
    if (article.categoryKey !== "interview") {
      continue;
    }

    const [year, month] = article.dateText.match(/^(\d{4})-(\d{2})/).slice(1);
    if (!archivesByYear.has(year)) {
      archivesByYear.set(year, new Map());
    }

    const months = archivesByYear.get(year);
    if (!months.has(month)) {
      months.set(month, []);
    }
    months.get(month).push(article);
  }

  return [...archivesByYear.entries()]
    .sort(([leftYear], [rightYear]) => rightYear.localeCompare(leftYear))
    .map(([year, articlesByMonth]) => {
      const months = [...articlesByMonth.entries()]
        .sort(([leftMonth], [rightMonth]) =>
          rightMonth.localeCompare(leftMonth)
        )
        .map(([month, monthArticles]) => ({
          month,
          articles: monthArticles
        }));

      return {
        year,
        months,
        articles: months.flatMap(({ articles: monthArticles }) => monthArticles)
      };
    });
}

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
    interviewArchives: buildInterviewArchives(articles)
  };
}
