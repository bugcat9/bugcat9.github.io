# Hexo

这个仓库用于维护博客的 Hexo 源码、主题配置和自动化部署。

## 分支说明

- `hexo`：日常写作和改配置的主分支，Hexo 工程都在这里。
- `source`：文章源文件镜像分支，由 `hexo` 单向同步过去。
- `gh-pages`：Hexo 生成后的静态站点分支。
- `master`：保留分支，不参与当前发布主链路。

## 常用命令

安装依赖：

```bash
npm install
```

本地预览：

```bash
npm run server
```

生成静态文件：

```bash
npm run build
```

## 日常写作流程

1. 在 `hexo` 分支编辑文章，位置在 `source/_posts/`
2. 本地预览：

```bash
npm run server
```

3. 构建检查：

```bash
npm run build
```

4. 提交并推送 `hexo` 分支：

```bash
git add .
git commit -m "feat: add new post"
git push origin hexo
```

## 同步到 source 分支

先看同步结果，不实际写入：

```bash
npm run sync:source -- --dry-run
```

正式同步并推送到远端 `source`：

```bash
npm run sync:source -- --push
```

如果只想同步到本地 `source` 分支，不推远端：

```bash
npm run sync:source
```

## 自动化

- `.github/workflows/deploy.yml`：`hexo` 分支推送后自动部署到 `gh-pages`
- `.github/workflows/sync-source.yml`：`hexo` 分支文章变化后自动同步到 `source`

## 参考

- https://zhuanlan.zhihu.com/p/170563000
