---
title: tcpdump进行DNS抓包
date: 2022-08-05 17:47:50
tags:
categories:
---

# tcpdump进行DNS抓包

在学习《Linux高性能服务器编程》中，看到作者对DNS使用`tcpdump`进行抓包，所以本着实践出真知、多看多练的道理，也进行抓包，顺带记录一下。

我们先用`host`命令查询一下百度域名的IP地址

```sh
host -t A www.baidu.com
```

其中`-t A`是指 查询你A类型的地址，不过我也没有弄清楚这个`A`是什么类型

查询结果如下

![image-20220805191657175](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220805191657175.png)

www.baidu.com是www.a.shifen.com的别名。www.a.shifen.com有两个地址112.80.248.75和112.80.248.76

使用tcpdump进行抓包

```sh
sudo tcpdump -i eth0 -nt -c 10  port domain
```

其中

```
-i 指定抓包的网卡
-n 不把主机的网络地址转换成名字
-t 在每列倾倒资料上不显示时间戳记
-c 指定抓包的数量
port domain表示只抓取使用domain（域名）服务的数据包
```

最终抓取的有用结果截图如下：

![image-20220805191641245](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220805191641245.png)

总共手动两个数据包

第一个数据包中（DNS查询报文），从ip：10.0.4.5（本机）端口39454发向ip：183.60.83.19（DNS服务器）的53端口（DNS服务的端口），47814是DNS查询报文的标识值，因此该值也出现在DNS应答报文中。“+”表示启用递归查询标志。“A？”表示使用A类型的查询方式。“www.baidu.com”则是DNS查询问题中的查询名。“(31)”表示 DNS查询报文的长度为32字节

第二个数据包中（DNS应答报文），“3/0/0”表示该报文中包含3个应答资源记录、0个授权资源记录和0个额外信息记录。“CNAME www.a.shifen.com., A 112.80.248.76, A 112.80.248.75”则表示3个应答资源记录的内容。其中CNAME表示紧随其后的记录是机器的别名，A表示紧随其后的记录是ip地址。该应答报文的长度为90字节。