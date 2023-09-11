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

![image-20220805144714394](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220805144714394.png)

从里面我们可以看到很多**应用层协议**使用的是什么**传输层协议**以及常用的端口。比如`ssh`使用2号端口，并且使用tcp协议进行通讯。

## 2.通过`/etc/resolv.conf`查看存放DNS服务器的IP地址

![image-20220805171434655](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux//image-20220805171434655.png)

## 3.通过`/proc/sys/net/ipv4/tcp_tw_reuse `来设置

我们也可以通过修改内核参数`/proc/sys/net/ipv4/tcp_tw_reuse `来快速回收被关闭的socket，从而使得TCP连接根本就不进入TIME_WAIT状态，进而允许应用程序立即重用本地的socket地址。

![image-20220813173711574](新建文件夹/image-20220813173711574.png)

