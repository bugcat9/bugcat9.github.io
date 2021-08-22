---
title: ConstraintLayout学习
date: 2021-08-21 11:12:50
tags:
- Android
- Andorid编程权威指南
categories:
- Android
---

# ConstraintLayout学习

## 介绍

ConstraintLayout似乎是现在Android官方目前推荐的一个layout，性能也不错，但是我目前还不是很会使用这个东西，所以看网上的资料学习了一下爱，顺便记录一下。

<!--more-->

## 使用ConstraintLayout

### 1.Constraint（约束）

Constraint即约束，对一个View的Left（Start），Top，Right（End），Bottom四个方向添加Constraint条件后，此View的位置也就确定下来了，Constraint也是ConstraintLayout最基本的操作。

ConstraintLayout包含这些属性

```
app:layout_constraintBottom_toBottomOf//举一反三app:layout_constraintBottom_toTopOf
app:layout_constraintEnd_toEndOf//举一反三app:layout_constraintEnd_toStartOf
app:layout_constraintStart_toStartOf//举一反三app:layout_constraintStart_toEndOf
app:layout_constraintTop_toTopOf//举一反三app:layout_constraintTop_toBottomOf
```

这些属性比较简单，简单来说就是到某个view到某个方向的约束，比如top约束包含：

约束在某个View的top(意思是和当前View的top这个View的top对齐)或者某个View的bottom(意思是和当前View的top这个View的bottom对齐)，因此四个方向的约束条件相加总共是有8个约束条件。

创建`Constraint`如图所示

![动画](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/动画.gif)

`Constraint`的属性如下图所示

![image-20210821174332342](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210821174332342.png)

`view`水平方向和竖直方向的尺寸是分别由宽度设置和高度设置决定的。能设置的值有以下三种

![image-20210821174936423](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210821174936423.png)



| 设置类型                   | 设置值       | 介绍                                                       |
| -------------------------- | ------------ | ---------------------------------------------------------- |
| 固定大小（Fixed）          | Xdp          | 以dp为单位，为视图指定固定值                               |
| 包裹内容（wrap_content）   | wrap_content | 设置视图想要的尺寸（随内容走），也就是说，大到足够容纳内容 |
| 动态适应(match Constraint) | 0dp          | 允许视图缩放以满足指定约束                                 |

对于前两类理解起来可能比较简单，对于动态适应的话我理解的是就是之前的`match parent`,设置为动态适应之后就回充满整个Constraint

![image-20210821180855391](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210821180855391.png)

### 2.Bias

`Bias`是偏置,主要用来设置位置偏移比例，取值范围从0到1，默认是0.5也就是居中。这个偏置对应着图中红色框框部分,可以通过移动这一部分进行`view`移动，当然也可以在蓝色框框部分进行填写

![image-20210821220201491](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210821220201491.png)

我们可以通过修改`Bias`的值来移动位置，比如修改成0.2，然后展示结果如下

![image-20210821220900560](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210821220900560.png)

### 3.Guideline

`Guideline`比较简单，可以理解成一个不可见的`View`放在`ConstraintLayout`某个位置，然后子`View`就可以以他作为`Constraint`目标来定位。

比如说我们加一个`horizontal guideline` 

![image-20210821230855642](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210821230855642.png)

### 4.Barrier

`Barrier`意为屏障，和`Guideline`相似，也是一个不可见的`View`，但`Barrier`可以保证一直位于某几个`View`的`Top/Bottom/Left/Right`下面，有些场景下可能很有用。

比如，我们需要一个`ImageView`一直在一排按钮之下`100dp`的位置，就可以使用这个`Barrier`，可以看到动图上`ImageView`是一直在这三个按钮之下`100dp`的位置。

![动画2](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/动画2.gif)

具体做法是先添加一个`Barrier`

![image-20210822110903058](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210822110903058.png)

然后完成`View`的绑定，在`ComponentTree`窗口里，直接拖动对应的子`View`到`Barrier`里就完成绑定了，如下：

![image-20210822111508491](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210822111508491.png)

然后在属性中设置`Barrier`的方向

![image-20210822111630034](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210822111630034.png)

最后`View`添加约束到`Barrier`

我在可视化编辑器上添加添加不了这个约束，我采取的是手动添加

![image-20210822112652686](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210822112652686.png)

最终达到的效果如上面动图一样

### 5.Chain

链是一组视图，这些视图通过双向位置约束条件相互链接到一起，ConstraintLayout借助此功能，可以实现LinearLayout大部分效果。

这是官方给定的一组图

![img](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/constraint-chain-styles_2x.png)

1. **Spread**：视图是均匀分布的（在考虑外边距之后）。这是默认值。
2. **Spread inside**：第一个和最后一个视图固定在链两端的约束边界上，其余视图均匀分布。
3. **Weighted**：当链设置为 **spread** 或 **spread inside** 时，您可以通过将一个或多个视图设置为“match constraints”(`0dp`) 来填充剩余空间。默认情况下，设置为“match constraints”的每个视图之间的空间均匀分布，但您可以使用 `layout_constraintHorizontal_weight` 和 `layout_constraintVertical_weight` 属性为每个视图分配重要性权重。如果您熟悉[线性布局](https://developer.android.com/guide/topics/ui/layout/linear?hl=zh-cn)中的 `layout_weight` 的话，就会知道该样式与它的原理是相同的。因此，权重值最高的视图获得的空间最大；相同权重的视图获得同样大小的空间。
4. **Packed**：视图打包在一起（在考虑外边距之后）。 然后，您可以通过更改链的头视图偏差调整整条链的偏差（左/右或上/下）。

如需创建链，请选择要包含在链中的所有视图，右键点击其中一个视图，选择 **Chains**，然后选择 **Center Horizontally** 或 **Center Vertically**，如下动图中所示：

![动画3](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/动画3.gif)

需要注意的是创建`Chain`的时候这些子`View`不要带`Constraint`，有的话要清除掉`Constraint`，因为已有的`Constraint`会影响后续的操作

## 总结

目前`ConstraintLayout`就总结到这里，还有一些点的话如果需要添加到时候再添加。`ConstraintLayout`是目前推荐的布局，性能也高一些，后面可以尽量都使用这个

**参考：**

* https://developer.android.com/training/constraint-layout
* https://cloud.tencent.com/developer/article/1684271
* 《Android权威编程指南》

