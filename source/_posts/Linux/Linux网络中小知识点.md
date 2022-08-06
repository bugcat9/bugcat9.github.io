---
title: Linux网络中小知识点
date: 2022-08-05 14:32:29
tags:
- 计算机网络
- Linux
categories:
- Linux
---

# Linux网络中小知识点

记录一下Linux网络当中一些零碎的小知识点。

<!--more-->

## 1.通过`/etc/services`查看应用层网络协议

```sh
vim /etc/services
```

可以看到

![image-20220805144714394](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220805144714394.png)

从里面我们可以看到很多**应用层协议**使用的是什么**传输层协议**以及常用的端口。比如`ssh`使用2号端口，并且使用tcp协议进行通讯。

## 2.通过`/etc/resolv.conf`查看存放DNS服务器的IP地址

![image-20220805171434655](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux//image-20220805171434655.png)

