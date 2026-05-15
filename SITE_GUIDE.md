# Personal Site Guide

这个仓库使用 al-folio / Jekyll。你可以把它理解成一个“内容文件夹驱动的网站”：大部分内容不需要手写 HTML，只要把 Markdown 文件放在指定目录，Jekyll 会自动生成页面。

## 网站地图

- `_pages/about.md`：首页。你的个人介绍、头像、联系方式和主页正文都在这里。
- `_pages/*.md`：独立页面，例如 `/os-notes/`、`/blog/`、`/projects/`。
- `_posts/`：博客文章。文件名必须是 `YYYY-MM-DD-title.md`。
- `_projects/`：项目页。适合放研究项目、课程项目、工具项目。
- `_news/`：短公告。适合放“最近完成了什么”。
- `_books/`：书架 / 读书记录。
- `assets/html/os-notes/`：操作系统笔记的独立 HTML 页面。
- `assets/img/`：图片资源。
- 模板自带示例内容已经移除，当前仓库只保留你自己的内容入口。
- `_config.yml`：网站总配置，例如标题、语言、搜索、主题功能。

## 顶部导航怎么控制

每个 `_pages/*.md` 顶部都有 front matter。这里的 `nav` 控制是否出现在顶部导航栏。

```yaml
---
layout: page
title: OS Notes
permalink: /os-notes/
nav: true
nav_order: 2
---
```

- `nav: true`：显示在顶部导航。
- `nav: false`：页面仍然存在，但不显示在顶部导航。
- `nav_order`：导航排序，数字越小越靠前。
- 首页 `/` 默认一直会在导航里显示为 `about`。

如果你想恢复 Blog 或 Projects，只需要把对应页面的 `nav: false` 改成 `nav: true`。

## 添加博客文章

在 `_posts/` 新建文件：

```text
_posts/2026-05-15-my-note.md
```

模板：

```markdown
---
layout: post
title: 文章标题
date: 2026-05-15 20:00:00
description: 一句话摘要
tags: notes learning
categories: study
---

正文内容。
```

适合放：学习复盘、技术记录、论文阅读、阶段总结。

## 添加项目

在 `_projects/` 新建文件：

```text
_projects/os-notes.md
```

模板：

```markdown
---
layout: page
title: OS Notes
description: 操作系统课程笔记的网页化复习系统
importance: 1
category: study
---

项目介绍、功能、截图、链接。
```

适合放：课程项目、工具、研究 demo、网站功能。

## 添加公告

在 `_news/` 新建文件：

```text
_news/2026-05-15-os-notes.md
```

模板：

```markdown
---
layout: post
date: 2026-05-15 20:00:00
inline: true
related_posts: false
---

上线了操作系统课堂笔记网页版。
```

如果想让首页显示公告，把 `_pages/about.md` 里的：

```yaml
announcements:
  enabled: false
```

改成：

```yaml
announcements:
  enabled: true
```

## 添加课程笔记页面

当前 OS Notes 是独立 HTML，不走 Jekyll 的文章系统：

```text
assets/html/os-notes/
```

入口页是：

```text
_pages/os-notes.md
```

如果你继续生成新的课程 HTML，建议放成：

```text
assets/html/course-name/
```

然后再新建一个 `_pages/course-name.md` 作为入口。

## 首页怎么改

首页文件：

```text
_pages/about.md
```

常改的字段：

```yaml
subtitle: 深圳大学本科（2023–2027），Lumina Group，研究方向：具身智能

profile:
  image: Shanks.jpg
  more_info: >
    <p>Email: ...</p>
```

首页正文就在第二个 `---` 下面。你可以直接写 Markdown。

首页自动模块：

```yaml
selected_papers: false

announcements:
  enabled: false

latest_posts:
  enabled: false
```

这些打开后会自动显示论文、公告和最新文章。

## 当前清理策略

模板自带的示例 posts、projects、news 和 books 已经从正式内容目录移除。

如果以后想参考 al-folio 的写法，可以去官方仓库看 examples；你自己的仓库里尽量只留真实内容，维护起来会轻很多。
