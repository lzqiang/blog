# 远山手记

这是一个个人静态博客。文章用 Markdown 编写，Node.js 构建器会把内容生成到 `dist/`。

仓库主要保留源码、Markdown 原文和静态资源源文件；`dist/` 是部署产物。

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
open dist/index.html
```

## 项目结构

```text
.
├── content/                # Markdown 原文
├── static/                 # CSS 和浏览器脚本源文件
├── src/                    # 静态站点生成器源码
├── scripts/build.js        # 构建入口
├── dist/                   # 构建生成的完整静态站点，不提交
├── package.json
└── package-lock.json
```

构建后 `dist/` 中会包含：

```text
dist/
├── index.html
├── articles/
├── categories/
└── assets/
```

`assets/` 只包含 CSS 和 JS，不是完整站点。部署时应部署整个 `dist/`。

## 写一篇文章

在 `content/` 下选择对应分类目录，新建 Markdown 文件：

```text
content/
├── java/
├── interview/
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
- `category`：只能是 `Java`、`面试题`、`人工智能`、`文学创作`、`个人随笔`
- `summary`：首页和列表页显示的摘要

面试题文章还需要 `tags`：

```markdown
tags:
  - Java
  - 数据库
```

可用标签：`Java`、`Vue`、`AI`、`队列`、`数据库`、`并发`。

## 构建规则

执行 `npm run build` 时：

1. 扫描 `content/` 下的 Markdown 文件。
2. 校验文章标题、日期、分类、摘要和面试题标签。
3. 将 Markdown 渲染成 HTML。
4. 生成首页、分类页、面试题标签页和文章页。
5. 为同一分类内的文章生成上一篇和下一篇导航。
6. 复制 `static/` 到 `dist/assets/`。

首页“最新文章”只显示最新 10 篇；分类页和标签页显示完整列表。

## 部署到 Nginx

Nginx 的 `root` 应指向 `dist/`：

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/blog/dist;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

服务器上一键部署：

```bash
cd /opt/blog
npm run deploy
```

这个脚本会依次执行：

```bash
git pull --ff-only
npm ci
npm run build
rsync -av --delete dist/ /var/www/blog/dist/
nginx -t
systemctl reload nginx
```

手动部署示例：

```bash
npm run build
rsync -av --delete dist/ /var/www/blog/dist/
```

CI/CD 示例：

```bash
npm ci
npm run build
# 上传 dist/
```

## 提交代码

推荐提交源码和内容，不提交构建产物：

```bash
git add content static src scripts package.json package-lock.json README.md
git commit -m "docs: update blog"
```

## 常见问题

### 是 `nvm run build` 吗？

通常不是。`nvm` 用来选择 Node.js 版本，构建命令是：

```bash
npm run build
```

如果你想指定 Node 版本，可以先执行：

```bash
nvm use 20
npm run build
```

### 能不能只把 assets 放进 Nginx？

不能。`assets/` 只有样式和脚本。完整站点还需要 `index.html`、`articles/` 和 `categories/`，所以要部署整个 `dist/`。
