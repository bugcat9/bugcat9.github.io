---
title: tcpdump进行ARP抓包
date: 2022-08-05 14:35:03
tags:
- 计算机网络
- Linux
categories:
- Linux
---
# tcpdump进行ARP抓包

在学习《Linux高性能服务器编程》中，看到作者对ARP使用`tcpdump`进行抓包，所以本着实践出真知、多看多练的道理，也进行抓包，顺带记录一下。

ARP协议的功能是实现网络层地址到任意物理地址的转换，简单理解ARP能够实现从**IP地址**转化为**MAC地址**的转化。

<!--more-->

## arp命令

Linux当中ARP 模块维护一个硬件地址到协议地址映射的缓存，可以通过`arp`命令或者`/proc/net/arp`文件查看。

使用`arp -a`查看

![image-20220805152235326](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux//image-20220805152235326.png)

使用`/proc/net/arp`查看

![image-20220805152319586](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux//image-20220805152319586.png)

我们也可以使用`arp`命令对缓存进行操作。

将`10.0.4.6`这个ip对应的MAC地址进行删除

```sh
arp -d 10.0.4.6
```

![image-20220805152619382](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220805152619382.png)

## tcpdump进行ARP抓包

上面arp命令是在云服务器上使用的，在使用tcpdump进行抓包时总是出现一些问题，感觉比不上物理机，所以专门找了个装Ubuntu的物理机进行了抓包测试。其中本机的ip：172.27.27.202，抓包抓的是ping 172.27.27.205的包。

实验过程：

一个窗口输入`tcpdump`命令--->另一个窗口输入ping命令--->`tcpdump`命令窗口获得数据包

输入抓包的`tcpdump`命令

```sh
sudo tcpdump -ent -c 2 arp
```

命令的参数介绍

```
-e 在每列倾倒资料上显示连接层级的文件头；
-n 不把主机的网络地址转换成名字；
-t 在每列倾倒资料上不显示时间戳记；
-c 抓包的数目
arp 表示只抓arp协议的包
```

最终抓到的包的结果如下图

![image-20220805154805611](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220805154805611.png)

总共抓到2个包，一个请求包一个应答包。

第一个数据包中，ARP通讯的源端的物理地址为`d4:5d:64:d0:4c:5d`（本机）,目的端的物理地址是`ff:ff:ff:ff:ff:ff`，这是以太网的**广播**地址，说明ARP开始是通过广播来询问的。数值`0x86`是以太网帧头部的类型字段的值，它表示是数据是ARP协议。`length 42`表示该**以太网帧**的长度是42字节（实际上是46字节，tcpdump没有统计以太网帧的末尾4字节的CRC字段）。`length 28`表示以太网帧的**数据部分长度**为28字节。`Request`表示这是ARP请求，`who-has 172.27.27.205 tell 172.27.27.202`就是很直白的”谁有`172.27.27.205`的MAC地址，请告诉`172.27.27.202`

第二个数据包中，ARP通讯的源端的物理地址为`d2:07:ca:1b:75:58`,目的端的物理地址是`d4:5d:64:d0:4c:5d`。`length 60`表示该**以太网帧**的长度是60字节（实际上是64字节，tcpdump没有统计以太网帧的末尾4字节的CRC字段）。`length 46`表示以太网帧的**数据部分长度**为46字节（说明ARP应答被填充字节了）。`Reply`表示这是ARP应答。

## 疑问

书上说ARP请求的报文为**28**字节，它属于以太网帧的数据部分，以太网帧的以太网头部+CRC校验的尾部一共**18**字节，所以一个携带ARP报文的以太网帧至少为**46**字节，但是由于实现要求**以太网帧数据部分**的长度至少要**46**字节，ARP报文此时会填充一些字节，也就是说一个携带ARP报文的以太网帧至少为**60**字节。这里以太网帧的大小和第二个数据包，也就是ARP应答数据相吻合。

但是第一个数据包ARP请求数据包则不符合设定，它只写了自己ARP请求的报文大小，并未进行字节填充，这里有一些不太理解。

![image-20220805165516292](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220805165516292.png)

