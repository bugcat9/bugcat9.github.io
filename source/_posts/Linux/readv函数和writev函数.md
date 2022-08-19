---
title: readv函数和writev函数
date: 2022-08-19 15:19:27
tags:
- Linux
- Linux高性能服务器编程
categories:
- Linux
---

# readv函数和writev函数

`readv`函数将数据从文件描述符读到分散的内存块中，即分散读; 

`writev`函数则将多块分散的内存数据一并写人文件描述符中，即集中写。它们的定义如下:

```c
#include <sys/uio.h>

ssize_t readv(int fd, const struct iovec *iov, int iovcnt);
ssize_t writev(int fd, const struct iovec *iov, int iovcnt);
```

`fd`被操作的目标文件描述符。

`iov`是`iovec`类型的数组，在`recvmsg`和`sendmsg`中接触过。

`iovcnt`是`iov`数组的长度。

<!--more-->

`iovec`结构体封装了一块内存的起始位置和长度。

```c
struct iovec {                    /* Scatter/gather array items */
   void  *iov_base;              /* Starting address */
   size_t iov_len;               /* Number of bytes to transfer */
};
```

`readv`和 `writev`在成功时返回读出/写入`fd`的字节数，失败则返回-1并设置errno。

`readv`和`writev`是个非常有用的函数。比如：当Web服务器解析完一个HTTP请求之后，如果目标文档存在且客户具有读取该文档的权限，那么它就需要发送一个HTTP应答来传输该文档。这个HTTP应答包含1个状态行、多个头部字段、1个空行和文档的内容。其中，前3部分的内容可能被Web服务器放置在一块内存中，而文档的内容则通常被读入到另外一块单独的内存中（通过read函数或mmap函数)。我们并不需要把这两部分内容拼接到一起再发送，而是可以使用writev函数将它们同时写出。

举一个man手册上`writev`函数的例子

```c
#include <sys/uio.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char const *argv[])
{
    char *str0 = "hello ";
    char *str1 = "world\n";
    struct iovec iov[2];
    ssize_t nwritten;

    iov[0].iov_base = str0;
    iov[0].iov_len = strlen(str0);
    iov[1].iov_base = str1;
    iov[1].iov_len = strlen(str1);

    nwritten = writev(STDOUT_FILENO, iov, 2);
    return 0;
}
```

![image-20220815180645424](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220815180645424.png)

