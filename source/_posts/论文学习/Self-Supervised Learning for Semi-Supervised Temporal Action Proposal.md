---
title: Self-Supervised Learning for Semi-Supervised Temporal Action Proposal
date: 2021-10-24 21:23:40
tags:
- 时序动作定位
- 自监督
categories:
- 论文学习
---
# Self-Supervised Learning for Semi-Supervised Temporal Action Proposal

论文使用自监督的方法来改造半监督行为建议区域生成。

作者专门设计了一个Self-supervised Semi-supervised Temporal Action Proposal (SSTAP) 网络结构，后面简称SSTAP。SSTAP包含两个分支temporal-aware semi-supervised branch 和relation-aware self-supervised branch，简单理解就是一个半监督分支和一个自监督分支。半监督分支是加入特征偏移和特征翻转在the mean teacher frame-work上，自监督分支则是定义了两个任务masked feature reconstruction 和 clip-order prediction

<!--more-->

## 如何实现

![image-20210624205135966](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20210624205135966.png)

### 1.Problem Description

问题的定义是，给一段未裁剪$S=\{s_n\}^{ls}_{n=1}$，假设它的长度为$l_s$，论文的方法的目标是在视频示例片段$\varphi_p=\{\xi_n=[t_{s,n},t_{e,n}]\}^{M_n}_{n=1}$检测出动作，其中 $M_s$是动作实例的总数，$[t_{s,n},t_{e,n}]$ 分别表示动作实例$\xi_n$的起点和终点

### 2.Feature Encoding

特征提取部分。给一段未裁剪$S=\{s_n\}^{ls}_{n=1}$，假设它的长度为$l_s$，我们首先将其划分为不重叠的短片段，每个片段包含 $\sigma$帧，然后采用双流网络(RGB或者Flow)提取视觉特征序列$\phi=\{\phi_{t_n}\}^T_{n=1}\in\mathbb R^{T\times C}$，其中$C$是特征的维度,而$T=l_s/\sigma$。

其实就是一个监督的特征提取。

### 3.Temporal-aware Semi-Supervised Branch

![image-20210625120746578](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20210625120746578.png)

半监督分支当中主要有两个点，mean teacher framework和扰动，这部分是在BMN网络上进行修改





### 4.Relation-aware Self-Supervised Branch

![image-20210625121709195](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/paper/image-20210625121709195.png)

