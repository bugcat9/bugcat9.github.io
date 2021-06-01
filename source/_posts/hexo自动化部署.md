---
title: hexo使用github action实现自动化部署
date: 2021-05-30 20:07:27
tags:
- hexo
- next
- github action
categories:
- 其他
---

# hexo使用github action实现自动化部署

最近将hexo博客进行了美化，为了更“折腾”一点，决定实现一下hexo对应的自动化部署，毕竟网上的资料对应的也有不少，学习一下。

我自己的需求是

* 将hexo、hexo生成的静态文件、博客源码都放在一起（个人感觉方便管理，免得创建许多仓库），然后hexo主要就在hexo分支上
* 在hexo分支上进行自动化，实现上传文件后自动部署。

查看博客点击👉[https://zhou-ning.github.io/](https://zhou-ning.github.io/)

查看博客仓库点击👉[https://github.com/zhou-ning/zhou-ning.github.io](https://github.com/zhou-ning/zhou-ning.github.io)

<!--more-->

在这里先说明一下我的项目的分支结构，我是将项目放到了**[zhou-ning.github.io](https://github.com/zhou-ning/zhou-ning.github.io)**下，下面有master、gh-pages、source、hexo四个分支

- master，啥也不干起说明作用
- gh-pages，放hexo生成的静态文件
- source，存放源文件
- hexo，存放hexo文件，并部署了自动化

## 上传hexo项目文件

🤗**如果会将hexo项目安全上传到github上的可以直接跳过这步了。**感觉这步写的有点啰嗦

一般来说一个hexo项目如下图所示

![image-20210530203146315](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210530203146315.png)

本人上传的之前是先直接删除了下面几样东西：

* `.github`文件夹，包括根目录和`themes`里面的
* 因为`themes`里面的主题有的是`git clone`来的,所以我也给删除了`.git`文件夹

然后将剩下的文件，上传到新的仓库或者某个仓库的某个分支，我是给上传到了**[zhou-ning.github.io](https://github.com/zhou-ning/zhou-ning.github.io)**下的hexo分支

## 生成密钥

因为需要将hexo项目生成的静态文件上传到github上（跟本地上传类似），所以需要生成密钥进行上传。

生成命令

```shell
ssh-keygen -t rsa -b 4096 -C "Hexo Deploy Key" -f github-deploy-key -N ""
```

在windows下可以通过`git bash`生成，相信在配置git的时候应该了解过

`ssh-keygen`命令讲解可以看的➡[https://www.linuxcool.com/ssh-keygen](https://www.linuxcool.com/ssh-keygen)

这会在当前目录生成两个文件：

- github-deploy-key —— 私钥
- github-deploy-key.pub —— 公钥

## 配置私钥

把**私钥**放在hexo项目的代码仓库当中的Secrets中，这是为了配置action的时候使用，在我这里就是**[zhou-ning.github.io](https://github.com/zhou-ning/zhou-ning.github.io)**项目(hexo分支)

![image-20210530211649771](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210530211649771.png)

依次点击`Setting`、`Secrets`、`New repository secret`

![image-20210530211935519](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210530211935519.png)

输入名字HEXO_DEPLOY_KEY，以及对应的内容，然后就可以生成Repository secrets了

![image-20210530212045237](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210530212045237.png)

## 配置公钥

把公钥放在需要上传静态文件的项目中，在我这里也是**[zhou-ning.github.io](https://github.com/zhou-ning/zhou-ning.github.io)**项目(gh-pages分支)

![image-20210530212318098](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210530212318098.png)



依次点击`Setting`、`Deploy keys`、`add deploy key`

![image-20210530212539068](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210530212539068.png)

输入名字HEXO_DEPLOY_PUB ，以及对应的内容，然后记得勾选`Allow write access`,然后点击`Add key`

![image-20210530212652197](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210530212652197.png)

## 配置其他内容

在我这里面要配置`gitalk`的CLIENT_ID和CLIENT_SECRET的值，配置方法和配置私钥是一样的

CLIENT_ID：

![image-20210531230828953](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210531230828953.png)

CLIENT_SECRET：

![image-20210531230912586](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210531230912586.png)

最终

![image-20210531231008588](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210531231008588.png)

## 创建 Workflow

在 Hexo 的仓库或者hexo中创建一个新文件：`.github/workflows/deploy.yml`，文件名可以自己取，但是一定要放在 `.github/workflows` 目录中，文件的内容如下：

```yaml
name: Hexo Deploy
# 要触发的分支
on:
  push:
    branches:
      - hexo

jobs:
  build:
    runs-on: ubuntu-latest
    if: github.event.repository.owner.id == github.event.sender.id

    steps:
      - name: Checkout source
        uses: actions/checkout@v2
        with:
        # 设置对应的分支，本文这里是hexo分支
          ref: hexo

      - name: Setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: '12'

      - name: Setup Hexo
        env:
          ACTION_DEPLOY_KEY: ${{ secrets.HEXO_DEPLOY_KEY }}
        run: |
          mkdir -p ~/.ssh/
          echo "$ACTION_DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 700 ~/.ssh
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan github.com >> ~/.ssh/known_hosts
          ## 设置自己邮箱和github用户名
          git config --global user.email "1767508581@qq.com"
          git config --global user.name "zhou-ning"
          npm install hexo-cli -g
          npm install
      ### 设置gitalk,不需要可以删除掉
      - name: Set gitalk
        env:
          CLIENT_ID: ${{ secrets.CLIENT_ID }}
          CLIENT_SECRET: ${{ secrets.CLIENT_SECRET}}
        run: |
          sed -i '639s/123/$CLIENT_ID/' ./themes/next/_config.yml
          sed -i '640s/123/$CLIENT_SECRET/' ./themes/next/_config.yml

      - name: Deploy
        run: |
          hexo clean
          hexo deploy
```

 简单来说，就是上传文件到hexo的时候，他会触发这个Workflow，然后构建ubuntu最新的环境，接着构建nodejs环境、git环境、hexo环境，再设置gitalk，最后再运行`hexo clean`、`hexo deploy`进行上传

但是这里存在一个问题如果我们hexo分支不在default分支，默认是触发不了的Workflow的，需要将hexo切换成default分支才能触发。切换的方法是

![image-20210601104734139](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20210601104734139.png)

然后就可以通过上传进行触发了。

后续的话，将master切换回default也是可以触发的。

## 结束语

配置自动化部署其实不是很难，就是刚刚接触github action啥都不懂耽误了很久，在这小结一下，方便自己日后换电脑的时候使用。

**参考：**https://zhuanlan.zhihu.com/p/170563000