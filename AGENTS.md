# Repository Guidelines

## Project Structure & Module Organization
This repository is a Hexo blog. Write posts and pages in `source/`, especially `source/_posts/` for articles and `source/about/` or other folders for standalone pages. Use `scaffolds/` for post/page templates, and update site-wide settings in [`_config.yml`](./_config.yml). The active theme is vendored in `themes/next/`; keep theme edits small and localized because upstream files are extensive. Generated output lives in `public/` and deployment metadata in `.deploy*/`; both are ignored and should not be committed.

## Build, Test, and Development Commands
- `npm install`: install Hexo and plugin dependencies from `package.json`.
- `npm run server`: start the local preview server for content and theme checks.
- `npm run build`: generate the static site into `public/`.
- `npm run clean`: remove generated artifacts before a fresh build.
- `npm run deploy`: publish with Hexo deploy; in this repo it targets the `gh-pages` branch.

## Coding Style & Naming Conventions
Use standard Hexo front matter with YAML keys such as:

```md
---
title: Example Post
date: 2026-04-11 10:00:00
tags:
categories:
---
```

Prefer Markdown for content, 2-space indentation in YAML, and concise headings. Name post files with the final slug or title followed by `.md`, matching the scaffold pattern in `scaffolds/post.md`. Keep config keys lowercase with underscores as already used in `_config.yml`. There is no configured formatter or linter, so match existing file style exactly.

## Testing Guidelines
There is no automated test suite in the root project. Treat `npm run build` as the required validation step for every content, config, or theme change. For UI changes, also run `npm run server` and verify the affected page renders correctly in the browser.

## Commit & Pull Request Guidelines
Recent history uses short, imperative commits, often with prefixes like `feat:` and `fix:` plus a brief Chinese or English summary. Follow that pattern, for example `feat: add C++ post` or `fix: correct Next theme config`. PRs should include a short description, the affected paths, linked issues when applicable, and screenshots for visible theme or layout changes.

## Deployment & Configuration Notes
GitHub Actions in `.github/workflows/deploy.yml` deploys from the `hexo` branch. Secrets such as deploy keys and Gitalk credentials are injected in CI; do not hardcode credentials in `_config.yml` or `themes/next/_config.yml`.
