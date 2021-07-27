---
title: matplotlib画图(二)各种类型图
date: 2021-07-23 21:05:00
tags:
- python
- matlpotlib
categories:
- 数据分析
---

# matplotlib画图（二）

matplotlib是最流行的Python底层绘图库，主要做数据可视化图表,名字取材于MATLAB，模仿MATLAB进行构建。

👉官网地址：[https://matplotlib.org/](https://matplotlib.org/)

matplotlib能画的图有折线图、散点图、柱状图、直方图、饼状图等，所以本次主要讲解这几张图，注意本次代码主要使用官方文档上的**面向对象**风格，当然使用pyplot风格也是同样可以实现的

## 折线图

折线图是默认的图像，直接使用plot就可以画出

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2, 100)

# Note that even in the OO-style, we use `.pyplot.figure` to create the figure.
fig, ax = plt.subplots()  # Create a figure and an axes.
ax.plot(x, x, label='linear')  # Plot some data on the axes.
ax.plot(x, x**2, label='quadratic')  # Plot more data on the axes...
ax.plot(x, x**3, label='cubic')  # ... and some more.
ax.set_xlabel('x label')  # Add an x-label to the axes.
ax.set_ylabel('y label')  # Add a y-label to the axes.
ax.set_title("Simple Plot")  # Add a title to the axes.
ax.legend()  # Add a legend.

plt.show()
```

![image-20210724091951456](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/数据分析/image-20210724091951456.png)

## 散点图

散点图主要使用函数Scatter，然后输入点的x坐标列表和y坐标列表即可

```python
import numpy as np
import matplotlib.pyplot as plt

np.random.seed(19680801)
fig, ax = plt.subplots()
for color in ['tab:blue', 'tab:orange', 'tab:green']:
    n = 750
    x, y = np.random.rand(2, n)
    scale = 200.0 * np.random.rand(n)
    ax.scatter(x, y, c=color, s=scale, label=color,
               alpha=0.3, edgecolors='none')

ax.legend()
ax.grid(True)

plt.show()
```

![image-20210723213104165](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/数据分析/image-20210723213104165.png)

## 柱状图

条形图也就是我们所说的柱状图，有横着和竖着的这两种，一般使用的函数是`bar`和`barh`

先展示竖着的条形图，这种条形图使用较多，展示效果不错

```python
import matplotlib.pyplot as plt
import numpy as np


labels = ['G1', 'G2', 'G3', 'G4', 'G5']
men_means = [20, 34, 30, 35, 27]
women_means = [25, 32, 34, 20, 25]

x = np.arange(len(labels))  # the label locations
width = 0.35  # the width of the bars

fig, ax = plt.subplots()
rects1 = ax.bar(x - width/2, men_means, width, label='Men')
rects2 = ax.bar(x + width/2, women_means, width, label='Women')

# Add some text for labels, title and custom x-axis tick labels, etc.
ax.set_ylabel('Scores')
ax.set_title('Scores by group and gender')
ax.set_xticks(x)
ax.set_xticklabels(labels)
ax.legend()

ax.bar_label(rects1, padding=3)
ax.bar_label(rects2, padding=3)

fig.tight_layout()

plt.show()
```

![image-20210724090632449](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/数据分析/image-20210724090632449.png)

使用横着展示的条形图，直接使用barh就可以实现

```python
import matplotlib.pyplot as plt
import numpy as np

# Fixing random state for reproducibility
np.random.seed(19680801)

plt.rcdefaults()
fig, ax = plt.subplots()

# Example data
people = ('Tom', 'Dick', 'Harry', 'Slim', 'Jim')
y_pos = np.arange(len(people))
performance = 3 + 10 * np.random.rand(len(people))
error = np.random.rand(len(people))

rects1 = ax.barh(y_pos, performance, align='center')
ax.set_yticks(y_pos)
ax.set_yticklabels(people)
ax.invert_yaxis()  # labels read top-to-bottom
ax.set_xlabel('Performance')
ax.set_title('How fast do you want to go today?')
ax.bar_label(rects1, padding=3)
plt.show()
```

![image-20210724092623279](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/数据分析/image-20210724092623279.png)

## 直方图

直方图跟柱状图有点类似，看起来很像柱状图链接的很紧密，不过感觉这个说法不严谨，我更趋向于是直方图展示连续但是分段的数据

```python
import matplotlib.pyplot as plt
import numpy as np

# Fixing random state for reproducibility
np.random.seed(19680801)

N_points = 100000
n_bins = 20

# Generate a normal distribution, center at x=0 and y=5
x = np.random.randn(N_points)

fig, axs = plt.subplots(sharey=True, tight_layout=True)

# We can set the number of bins with the `bins` kwarg
axs.hist(x, bins=n_bins)
plt.show()

```

![image-20210724094320817](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/数据分析/image-20210724094320817.png)

`hist`参数中`bins`是指条形的个数像这个图里面就是20个条形

## 饼状图

饼状图可以看清一个分布，也就是一堆数据当中各种类别的分布。画饼状图主要使用pie函数

```python
import matplotlib.pyplot as plt

# Pie chart, where the slices will be ordered and plotted counter-clockwise:
labels = 'Frogs', 'Hogs', 'Dogs', 'Logs'
sizes = [15, 30, 45, 10]
explode = (0, 0.1, 0, 0)  # only "explode" the 2nd slice (i.e. 'Hogs')

fig1, ax1 = plt.subplots()
ax1.pie(sizes, explode=explode, labels=labels, autopct='%1.1f%%',
        shadow=True, startangle=90)
ax1.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.

plt.show()
```

![image-20210724095404058](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/数据分析/image-20210724095404058.png)

需要注意的是`pie`函数中的`autopct`是用来显示百分比的，`shadow`用来控制阴影，`startangle`用来控制选择角度，而这个突出显示则是使用`explode`进行

