export const CATEGORIES = Object.freeze([
  {
    key: "java",
    label: "Java",
    description: "Java、Spring 与后端工程实践。"
  },
  {
    key: "ai",
    label: "人工智能",
    description: "关于模型、工具与智能时代的学习记录。"
  },
  {
    key: "literature",
    label: "文学创作",
    description: "小说、散文与其他文学练习。"
  },
  {
    key: "essays",
    label: "个人随笔",
    description: "生活观察、阅读感受与个人思考。"
  }
]);

export const CATEGORY_BY_KEY = new Map(
  CATEGORIES.map((category) => [category.key, category])
);

export const CATEGORY_BY_LABEL = new Map(
  CATEGORIES.map((category) => [category.label, category])
);
