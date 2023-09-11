---
title: matplotlib画图(一)基本操作
date: 2021-07-17 09:42:00
tags:
- python
- matlpotlib
categories:
- 数据分析
---

# matplotlib画图基本操作

matplotlib是最流行的Python底层绘图库，主要做数据可视化图表,名字取材于MATLAB，模仿MATLAB构建。最近做了很多关于数据分析的题目，对于画图感觉掌握的不熟练所以特地来学习一下。

👉官网地址：[https://matplotlib.org/](https://matplotlib.org/)

下面这张图是 Matplotlib 图形的组成部分。主要有title、tick、legend、label这类的东西，所以本次也主要从这些出发。

![anatomy.png](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/数据分析/anatomy.png)

<!--more-->

## 简单使用

```python
import matplotlib.pyplot as plt

# 坐标中x的列表
x = [0, 1, 2, 3]
# 坐标中y的列表
y = [1, 2, 3, 5]
plt.plot(x, y)
plt.ylabel('some numbers')
plt.show()
```

展示出的图

![image-20210719225539311](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/数据分析/image-20210719225539311.png)

matplotlib使用起来比较简单，传入x的列表和y的列表，直接传入就可以画。

## 设置图片大小

```python
import matplotlib.pyplot as plt

x = [0, 1, 2, 3]
y = [1, 2, 3, 5]
# 实例化figure
fig = plt.figure(figsize=(20, 8), dpi=80)
plt.plot(x, y)
plt.ylabel('some numbers')
plt.savefig("line.png")
plt.show()
# 存图片
```

![image-20210719230413323](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/数据分析/image-20210719230413323.png)

## 设置x轴和y轴上的刻度（tick）

x轴和y轴上面都有刻度如果我们不加，会默认帮我们加上去，但是有的时候我们想自己设计这个刻度也是可以的

比如下图我们可以设置刻度在线段外,当然发现图很丑，但是刻度确实是我们所设置的

```python
import matplotlib.pyplot as plt

x = [0, 1, 2, 3]
y = [1, 2, 3, 5]

plt.plot(x, y)
plt.ylabel('some numbers')
# 设置刻度在线外
xticks = [i for i in range(-5, -1)]
yticks = [i for i in range(-5, -1)]
plt.xticks(xticks)
plt.yticks(yticks)

plt.show()
```

![image-20210720102612547](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/数据分析/image-20210720102612547.png)

不过我们一般都是设置合适的刻度，毕竟画图需要美观，刻意设置不必要，上面只是为了举例

```python
import matplotlib.pyplot as plt

x = [0, 1, 2, 3]
y = [1, 2, 3, 5]

plt.plot(x, y)
plt.ylabel('some numbers')
# 正经设置
xticks = [i for i in range(0, 4)]
yticks = [i for i in range(1, 5)]
plt.xticks(xticks)
plt.yticks(yticks)

plt.show()
```

![image-20210720102944193](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/数据分析/image-20210720102944193.png)

然后有的时候刻度是时间类型或者其他的label之类的，比如：我想展示一天24h的时间变化，刻度需要显示1：00这种，又或者是显示几年内每个月的收入变化，刻度是1998-01-01这种类型该如何显示呢？

```python
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']  # 用来正常显示中文标签
plt.rcParams['axes.unicode_minus'] = False  # 用来正常显示负号
x = [0, 1, 2, 3]
y = [1, 2, 3, 5]

plt.plot(x, y)
plt.ylabel('some numbers')
xticks = [i for i in range(0, 4)]
# 设置标签
xlabel = ["{}点".format(i) for i in range(0, 4)]
plt.xticks(xticks, xlabel, rotation=30)

plt.show()
```

可以看到只需要在调用xticks的时候传入xlabel就可以实现我们想要的功能，也就是设置对应的刻度列表和刻度标签即可

## 给图像添加描述信息

图像的描述信息有xlabel、ylabel、title

```python
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']  # 用来正常显示中文标签
plt.rcParams['axes.unicode_minus'] = False  # 用来正常显示负号

# 坐标中x的列表
x = [0, 1, 2, 3]
# 坐标中y的列表
y = [1, 2, 3, 5]
plt.plot(x, y)
plt.ylabel('x 的标签')
plt.xlabel('y 的标签')
plt.title("标签描述")
plt.show()
```

![image-20210720110852460](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/数据分析/image-20210720110852460.png)

## 设置图像风格

画图我们可以设置线段的风格，可以决定是画线还是画点，然后线的粗细颜色之类的都可以设置

```
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']  # 用来正常显示中文标签
plt.rcParams['axes.unicode_minus'] = False  # 用来正常显示负号

# 坐标中x的列表
x = [0, 1, 2, 3]
# 坐标中y的列表
y = [1, 2, 3, 5]
plt.plot(x, y, color='green', marker='o', linestyle='dashed', linewidth=2, markersize=12)
plt.show()
```

![image-20210720112925627](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/数据分析/image-20210720112925627.png)

其中color是设置颜色，marker设置标记点，linestyle设置线条格式，linewidth设置线的宽度，markersize设置线的大小

**Colors**

| character | color   |
| --------- | ------- |
| `'b'`     | blue    |
| `'g'`     | green   |
| `'r'`     | red     |
| `'c'`     | cyan    |
| `'m'`     | magenta |
| `'y'`     | yellow  |
| `'k'`     | black   |
| `'w'`     | white   |

**Markers**

| character | description           |
| --------- | --------------------- |
| `'.'`     | point marker          |
| `','`     | pixel marker          |
| `'o'`     | circle marker         |
| `'v'`     | triangle_down marker  |
| `'^'`     | triangle_up marker    |
| `'<'`     | triangle_left marker  |
| `'>'`     | triangle_right marker |
| `'1'`     | tri_down marker       |
| `'2'`     | tri_up marker         |
| `'3'`     | tri_left marker       |
| `'4'`     | tri_right marker      |
| `'8'`     | octagon marker        |
| `'s'`     | square marker         |
| `'p'`     | pentagon marker       |
| `'P'`     | plus (filled) marker  |
| `'*'`     | star marker           |
| `'h'`     | hexagon1 marker       |
| `'H'`     | hexagon2 marker       |
| `'+'`     | plus marker           |
| `'x'`     | x marker              |
| `'X'`     | x (filled) marker     |
| `'D'`     | diamond marker        |
| `'d'`     | thin_diamond marker   |
| `'|'`     | vline marker          |
| `'_'`     | hline marker          |

**Line Styles**

| character | description         |
| --------- | ------------------- |
| `'-'`     | solid line style    |
| `'--'`    | dashed line style   |
| `'-.'`    | dash-dot line style |
| `':'`     | dotted line style   |

具体更多设置可以参考官方文档

## 设置图例

有的时候我们一张图有好几条线，为了说清楚我们每条线是什么，我们可以设置图例

```
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']  # 用来正常显示中文标签
plt.rcParams['axes.unicode_minus'] = False  # 用来正常显示负号

# 坐标中x的列表
x = [0, 1, 2, 3]
# 坐标中y的列表
y1 = [1, 2, 3, 5]
y2 = [1, 3, 5, 8]
plt.plot(x, y1, label="第一条线")
plt.plot(x, y2, label="第二条线")
plt.legend(loc='upper right')
plt.show()
```

![image-20210720114327323](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/数据分析/image-20210720114327323.png)

