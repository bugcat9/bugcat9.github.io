---
title: Weakly-supervised Temporal Action Localization by Uncertainty Modeling
date: 2021-12-02 11:09:14
tags:
- 时间动作定位
- 时序动作定位
- 弱监督
categories:
- 论文学习
---

# Weakly-supervised Temporal Action Localization by Uncertainty Modeling

## 提出问题

现有的Weakly-supervised Temporal Action Localization处理背景的方法存在很多问题，要不将静态帧合并合成伪背景视频，但忽略了动态背景帧，要不将背景框架划分为一个单独的类别。然而，强制所有的背景帧属于一个特定的类（背景类别其实也是不同的，因为它们不共享任何共同的语义）。

![image-20211202113108293](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202113108293.png)

如图a中背景其实是非常动态的（理解为摄像机在动，其中的人也是在动的），图b中展现出来的一个视频中的背景是不相同的。

<!--more-->

## 解决方法

论文的作者接受背景帧不一致的观察。一般来说，动作帧的特征比背景帧的特征有更大的幅度，如图a所示。这是因为动作帧需要为基本事实的动作类生成高对数。虽然特征量显示了背景和动作帧之间的识别相关性，但由于动作和背景的分布比较接近，直接使用特征量进行识别是不够的。因此，为了进一步鼓励特征幅度上的差异，作者建议通过增大动作特征的幅度和减小接近于零的背景特征的幅度来分离分布(图b)。

![image-20211202113647997](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202113647997.png)

基于上面提出的思想提出了一个不确定性建模的方法。

## 具体实现

![image-20211202113830606](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202113830606.png)

### Main pipeline

#### Feature extraction

将视频分割成多个段，$v_n=\lbrace s_{n,l}\rbrace^{L_n}_{l=1}$，然后进行采样使得$v_n=\lbrace \tilde{s}_{n,t} \rbrace^T_{t=1}$。然后提取RGB特征$x^{RGB}_{n,t}\in \mathbb R^D$和flow光流特征$x^{flow}_{n,t}\in \mathbb R^D$,再拼接在一起$X_n=[x_{n,1},...,x_{n,T}]\in \mathbb R^{2d\times T}$

特征提取这一步很简单和大多数的WTAL的方法相同

![image-20211202151403440](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202151403440.png)





#### Feature embedding

为了将提取的特征嵌入到特定于任务的空间中，作者使用一个一维卷积层，然后使用一个ReLU函数。
$$
F_n=g_{embed}(X_n;\phi_{embed})
$$
最终得到的$F_n=[f_{n,1},...,f_{n,T}]\in\mathbb R^{2D\times T}$

![image-20211202151949445](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202151949445.png)

#### Segment-level classification

这一步需要得到类激活序列，使用一个分类器
$$
A_n=g_{cls}(F_n;\phi_{cls})
$$
其中$g_{cls}$表示线性分类器，最终得到的$A_n\in\mathbb R^{C\times T}$

#### Action score aggregation

遵循之前的方法，采取topk均值的方法，从而获得该类别的分数

![image-20211202152829191](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202152829191.png)

再使用softmax，可以得到对应动作c的概率

![image-20211202153204454](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202153204454.png)

这个和之前的工作类似

### Uncertainty modeling

上面部分，是基本的WTAL步骤，里面并没有考虑背景。考虑到背景帧的不约束和不一致性，我们将背景作为WTAL的out-
of-distribution和uncertainty

考虑到视频片段$\tilde{s}_{n,t}$属于第c个动作的概率，可以用链式法则（条件概率公式）将其分解为两部分

![image-20211202155527868](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202155527868.png)

回想起条件概率公式支配的恐惧了
$$
P(A|B)=P(A,B)/P(B)
$$
所以有
$$
P(A,B)=P(A|B)P(B)
$$
当然再推下去就是贝叶斯了，这个就不细说。

#### Uncertainty formulation

公式当中$P(y_{n,t}=c|d=1, \tilde{s}_{n,t})$，与一般分类任务一样，采用softmax函数进行估计。此外，有必要建模一个片段属于任何动作类的概率，也就是$P(d=1| \tilde{s}_{n,t})$的概率。

为了解决背景辨别问题。观察到动作帧的特征通常比背景帧的特征有更大的幅度(图2)，我们通过使用特征向量的幅度来表达不确定性。具体来说，背景特征的幅度较小，接近于0，而动作特征的幅度较大。

然后在n个视频$( \tilde{s}_{n,t})$中的t-th段是一个动作段的概率由:

![image-20211202161510271](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202161510271.png)

其中$f_{n,t}$表示视频$\tilde{s}_{n,t}$的特征，而$\lVert \cdot \rVert$是一个范数函数(这里我们使用L-2范数)，m是预定义的一个特征值，从公式我们可以得到

![image-20211202161833408](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202161833408.png)

#### Uncertainty learning via multiple instance learning

为了只通过视频级别的标签来学习不确定性，我们借用了多实例学习的概念(Maron和LozanoPérez1998)，即使用一个包(视频)而不是实例(片段)来训练模型。在这个设置中，考虑到每个未修剪的视频都包含动作帧和背景帧，我们选择伪动作/背景段来表示视频。简单来说就是选择$k^{act}$个特征幅度最大的k个片段作为伪动作片段$\lbrace \tilde{s}_{n,t} |i\in S^{act} \rbrace$，选择$k^{bkg}$个片段作为伪背景片段$\lbrace \tilde{s}_{n,t} |j\in S^{bkg} \rbrace$。

### Training objectives

训练的损失总共有三个

![image-20211202163725110](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202163725110.png)

#### Video-level classification loss

对于多标签动作分类，我们使用二叉熵损失与标准化视频级标签

![image-20211202163806830](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202163806830.png)

很简单的一个损失比较常见

#### Uncertainty modeling loss

为了学习不确定性，我们训练模型生成大特征量的伪动作片段，而生成小特征量的伪背景片段，如图3(a)所示。形式上，不确定性建模损失的形式为:

![image-20211202164237878](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202164237878.png)

![image-20211202164312359](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202164312359.png)

![image-20211202164646695](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202164646695.png)

这个损失的含义是将动作特征拉的更远背景特征拉的更近，可以看这个m为特征距离，蓝色部分向m之外移动，红色部分向m之内移动。

#### Background entropy loss

虽然不确定性建模损失鼓励背景部分为所有动作生成低对数，但由于softmax功能的相对性，某些动作类的softmax得分可能较高。为了防止背景片段对任何动作类都有较高的softmax得分，我们定义了一个损失函数，使背景片段的动作概率熵最大化，即，背景段对动作类强制具有均匀概率分布，如图3(b)所示。损失计算方法如下:

![image-20211202164356143](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202164356143.png)

![image-20211202164432247](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202164432247.png)

![image-20211202164712103](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20211202164712103.png)

这个损失是为了防止背景在某个动作类上的softmax得分可能较高，为了将背景分数拉平而设计的一个函数。

## 总结

这篇文章在前人提出背景的基础上再次加深了一步研究，思想性很强不亏是微软亚洲研究院出品的，我只能称之为神仙。