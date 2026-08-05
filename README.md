# kikacaty.github.io

Personal Jekyll site for Yulong Cao.

## Local preview

```sh
bundle install --path vendor/bundle
bundle exec jekyll serve --livereload
```

## Content

- Edit `publications.md` to maintain publications independently from the biography.
- Add dated Markdown files to `_news/` to publish announcements. Use `summary` in front matter for the list view.
- Add posts to `_posts/`. Set `layout: distill` for the research-oriented long-form layout.
- Edit `_data/navigation.yml` to reorder or rename navigation items.

Example Distill post front matter:

```yaml
---
layout: distill
title: Post title
description: One-sentence summary.
date: 2026-07-28
authors:
  - name: Yulong Cao
toc:
  - name: Introduction
  - name: Results
---
```

Inside a Distill post, use `class="wide"` for full-width figures and
`class="margin-note"` for side notes. Both collapse into the normal text column
on smaller screens.
