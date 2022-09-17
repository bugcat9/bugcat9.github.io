---
 title: Next主题美化
 date: 2021-05-22 22:02:23 
 tags: 
 - hexo
 - next
 categories:
 - 其他 
---
# Next主题美化

最近使用hexo的next主题在github上搭建了一个博客，但是发现这个next主题并不完全是自己想要的，所以还需要美(zhe)化（ten）一下。主要折腾了三个方面：

* 鼠标点击特效
* 个性化回到顶部
* 打字特效
* 上传文件中带有READ.md

<!--more-->

## 鼠标点击特效

添加鼠标点击礼花特效🎉，效果如下

![鼠标点击礼花特效](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/others/鼠标点击礼花特效.gif)

在`themes\next\source\js\cursor\`目录下 创建**fireworks.js**，具体**fireworks.js**的内容可以点击👉[fireworks.js](https://github.com/bugcat9/hexo-theme-next/blob/master/source/js/cursor/fireworks.js)进行查看(不展示因为实在是太长了)

然后在主题自定义布局文件`themes\next\layout\_custom\custom.swig`中添加以下代码：

```javascript
{# 鼠标点击特效 #}
{% if theme.cursor_effect == "fireworks" %}
  <script async src="/js/cursor/fireworks.js"></script>
{% endif %}
```

如果 **custom.swig** 文件不存在，需要手动在`themes\next\layout\_custom`下创建并在`themes\next\layout\_layout.swig`布局页面中 **body** 末尾引入：

```html
 ...
 {%- if theme.pjax %}
    <div id="pjax">
  {%- endif %}
  {% include '_third-party/math/index.swig' %}
  {% include '_third-party/quicklink.swig' %}

  {{- next_inject('bodyEnd') }}
  {%- if theme.pjax %}
    </div>
  {%- endif %}
  {% include '_custom/custom.swig' %}
</body>
</html>
```

记住是在**layout**文件夹下创建对应的**custom.swig** 文件，别创建错了。

最后在主题配置文件`themes\next\_config.yml`中添加以下代码：

```yaml
# mouse click effect: fireworks | explosion | love | text
cursor_effect: fireworks
```

当然点击特效还有其他的，可以参考：http://yearito.cn/posts/hexo-theme-beautify.html

## 个性化回到顶部

个性化回到顶端是我自己比较喜欢的，也是从上面那个参考那里借鉴的（读书人的事，怎么能咳咳，扯远了），是一个小猫然后点击可以回到顶端，效果如下：

![个性化back2top](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/others/个性化back2top.gif)

首先，下载该图片，点击👉[小猫图片](https://github.com/bugcat9/hexo-theme-next/blob/master/source/images/scroll.png)

然后在`themes\next\source\css\_common\components\back-to-top.styl`里面**添加**(不是覆盖)

```css
//自定义回到顶部样式
@media screen and (min-width: 900px) {
.back-to-top {
  right: 60px;
  width: 70px;  //图片素材宽度
  height: 900px;  //图片素材高度
  top: -900px;
  bottom: unset;
  transition: all .5s ease-in-out;
  background: url("/images/scroll.png");
  position: fixed
  //隐藏箭头图标
  > i {
    display: none;
  }

  &.back-to-top-on {
    bottom: unset;
    top: 100vh < (900px + 200px) ? calc( 100vh - 900px - 200px ) : 0px;
  }
}}
```

在主题配置文件`themes\next\_config.yml`中打开**back2top**

```yaml
back2top:
  enable: true
  # Back to top in sidebar.
  sidebar: false
  # Scroll percent label in b2t button.
  scrollpercent: true
```

## 打字特效

如果你开评论的话，可以考虑加入这个特效，感觉还挺炫酷。

![打字特效](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/others/打字特效.gif)

首先，点击[activate-power-mode.min.js](https://github.com/bugcat9/hexo-theme-next/blob/master/source/js/activate-power-mode.min.js)下载相应的脚本，并置于 `themes\next\source\js\` 目录下。

在主题自定义布局文件`themes\next\layout\_custom\custom.swig`中添加以下代码：

```html
{# 打字特效 #}
{% if theme.typing_effect %}
  <script src="/js/activate-power-mode.min.js"></script>
  <script>
    POWERMODE.colorful = {{ theme.typing_effect.colorful }};
    POWERMODE.shake = {{ theme.typing_effect.shake }};
    document.body.addEventListener('input', POWERMODE);
  </script>
{% endif %}
```

如果 custom.swig 文件不存在，需要手动新建并在布局页面中 body 末尾引入,这个上面说过了，就不多说了。

在主题配置文件`themes\next\_config.yml`中添加以下代码：

```yaml
# typing effect
typing_effect:
  colorful: true  # 礼花特效
  shake: false  # 震动特效
```

## 上传文件中带有README.md

我们知道hexo上传的文件当中只有css、js、html等文件，如果我们在根目录的source文件夹下添加README.md，又会变成html。这对于我这样的强迫症太难受。

解决方法是在根目录下(注意是根目录下，不是主题next目录下)的**_config.yml**的`skip_render`前面加上`README.md`，如下:

```yaml
skip_render: README.md
```

然后再使用

```
hexo g
hexo d
```

最终可以看到

![展示](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/others/image-20210522214004389.png)



## 结束语

next主题的优化就告辞段落，目前我的需求基本满足了，如果有大佬想了解更多更深度的，可以参考：http://yearito.cn/posts/hexo-theme-beautify.html

不过他的这个有点中有一个问题，就是custom.styl不存在了，这个可以参考这个issue：

https://github.com/theme-next/hexo-theme-next/issues/982



目前感觉自己折腾了一年的博客，从hexo到直接存在github上再到jekyll，最后又回到hexo，真实生命不息折腾不止，博客选择就到此结束吧。

**参考：**

* http://yearito.cn/posts/hexo-theme-beautify.html
* https://github.com/theme-next/hexo-theme-next/issues/982
* https://www.zhihu.com/question/23934523

