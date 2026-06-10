# 远山手记

这是一个个人静态博客。文章用 Markdown 编写，运行构建命令后生成可直接打开的网页文件。

当前博客包含四个分类：

- Java
- 人工智能
- 文学创作
- 个人随笔

生成后的入口是根目录的 `index.html`。可以直接双击打开，也可以部署到 GitHub Pages 这类静态托管服务。

## 快速开始

安装依赖：

```bash
npm install
```

生成博客：

```bash
npm run build
```

本地查看：

```bash
open index.html
```

也可以直接在文件管理器中双击 `index.html`。

## 写一篇文章

在 `content/` 下选择对应分类目录，新建 Markdown 文件：

```text
content/
├── java/
├── ai/
├── literature/
└── essays/
```

文章需要带上头部信息：

```markdown
---
title: Java 并发编程笔记
date: 2026-06-10
category: Java
summary: 梳理线程、锁和并发工具的核心概念。
---

## 正文标题

这里开始写文章内容。
```

必填字段：

- `title`：文章标题
- `date`：发布日期，格式必须是 `YYYY-MM-DD`
- `category`：只能是 `Java`、`人工智能`、`文学创作`、`个人随笔`
- `summary`：首页和分类页显示的摘要

写完后运行：

```bash
npm run build
```

构建会更新：

- `index.html`
- `articles/`
- `categories/`
- `assets/`

## 项目结构

```text
.
├── index.html              # 生成后的博客首页
├── articles/               # 生成后的文章页
├── categories/             # 生成后的分类页
├── assets/                 # 生成后的静态资源
├── content/                # Markdown 原文
├── static/                 # 样式和前端脚本源文件
├── src/                    # 静态站点生成器源码
├── scripts/build.js        # 构建入口
└── tests/                  # 自动化测试
```

## 构建规则

构建器会做这些事：

1. 扫描 `content/` 下的 Markdown 文件。
2. 校验文章标题、日期、分类和摘要。
3. 将 Markdown 渲染成 HTML。
4. 为文章标题生成目录锚点。
5. 生成首页、分类页和文章页。
6. 为同一分类内的文章生成上一篇和下一篇导航。
7. 复制本地静态资源，确保生成结果不依赖远程 CDN。

如果文章元数据不合法，构建会失败并指出具体文件。

## 测试

运行全部测试：

```bash
npm test
```

测试覆盖内容解析、日期校验、分类校验、Markdown 渲染、相对链接、页面模板和完整构建流程。

## 部署到 GitHub Pages

这个仓库会提交生成后的静态文件。推送到 GitHub 后，可以在仓库设置里启用 GitHub Pages：

1. 打开 GitHub 仓库设置。
2. 进入 `Pages`。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `master`，目录选择 `/root`。
5. 保存后等待 GitHub Pages 构建完成。

之后每次更新文章：

```bash
npm run build
git add content index.html articles categories assets
git commit -m "docs: update blog posts"
git push
```

## 常见问题

### 为什么要运行 `npm run build`？

浏览器直接打开本地 `index.html` 时，通常不能自由读取磁盘上的 Markdown 文件。这个项目会提前把 Markdown 编译成 HTML，所以生成结果可以直接打开，也更适合静态部署。

### 能不能只提交 Markdown？

不建议。GitHub Pages 需要最终的 HTML 文件才能直接展示这个博客。推荐同时提交 Markdown 原文和生成后的 HTML。

### 如何新增分类？

修改 `src/config.js` 中的 `CATEGORIES`，然后在 `content/` 下新增对应目录，并运行：

```bash
npm test
npm run build
```
