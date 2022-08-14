---
title: socket数据读写
date: 2022-08-14 19:40:38
tags:
- 计算机网络
- Linux
- Linux网络编程
- Linux高性能服务器编程
categories:
- Linux网络编程
---

# socket数据读写

学习《Linux高性能服务器编程》第五章Linux网络编程基础API，为了印象深刻一些，多动手多实践，所以记下这个笔记。这一篇主要记录Linux中socket数据读写的部分，包括TCP数据读写、UDP数据读写和通用数据读写。

<!--more-->

## TCP数据读写

对文件的读写操作`read`和`write`同样适用于socket。但是socket编程接口提供了几个专门用于socket数据读写的系统调用，它们增加了对数据的读写的控制。在TCP中流数据读写的系统调用是：

```c
#include <sys/types.h>
#include <sys/socket.h>

ssize_t recv(int sockfd, void *buf, size_t len, int flags);
ssize_t send(int sockfd, const void *buf, size_t len, int flags);
```

`recv`读取`sockfd`上的数据，`buf`和`len`参数分别指定读缓冲区的位置和大小。

`recv`成功读取时返回实际读取到的数据长度，它可能小于我们期望的长度`len`。因此需要多次调用`recv`才能读取到完整的数据。`recv`返回0，意味着对方已经关闭连接。`recv`出错时返回-1并设置`errno`。

`send`发送`sockfd`上的数据。`buf`和`len`参数分别指定写缓冲区的位置和大小。

`send`成功读取时返回实际读取到的数据长度，出错时返回-1并设置`errno`。

`flags`用于控制数据的接收和发送，一般来说设置为0，也可以进行设置，从而进行控制。

控制参数可以通过man手册进行查看，这里直接截取书上的表格

![image-20220812171929139](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220812171929139.png)

## UDP数据读写

```c
#include <sys/types.h>
#include <sys/socket.h>

ssize_t recvfrom(int sockfd, void *buf, size_t len, int flags, struct sockaddr *src_addr, socklen_t *addrlen);
ssize_t sendto(int sockfd, const void *buf, size_t len, int flags, const struct sockaddr *dest_addr, socklen_t addrlen);
```

针对UDP系统提供的是读写函数是`recvfrom`和`sendto`，其中函数`recvfrom`和`sendto`前4个参数和`recv`、`send`意义相同，最后两个是发送端/接收端的地址。因为UDP是没有连接的概念，所以调用这两个函数的时候都要指定地址。`recvfrom`和`sendto`的返回值和`recv`、`send`也相同，所以不用过多介绍。

除此之外，`recvfrom`和`sendto`也可以用于TCP使用，只需要把最后两个参数设置为NULL即可。

## 通用数据读写函数

```c
#include <sys/types.h>
#include <sys/socket.h>

ssize_t recvmsg(int sockfd, struct msghdr *msg, int flags);
ssize_t sendmsg(int sockfd, const struct msghdr *msg, int flags);
```

`recvmsg`和`sendmsg`的参数中`sockfd`和`flags`比较简单，复杂一些的参数就是`msg`。`msg`的结构如下：

```c
#include <sys/socket.h>:

struct iovec {                    /* Scatter/gather array items */
   void  *iov_base;              /* Starting address */
   size_t iov_len;               /* Number of bytes to transfer */
};

struct msghdr {
   void         *msg_name;       /* Optional address */
   socklen_t     msg_namelen;    /* Size of address */
   struct iovec *msg_iov;        /* Scatter/gather array */
   size_t        msg_iovlen;     /* # elements in msg_iov */
   void         *msg_control;    /* Ancillary data, see below */
   size_t        msg_controllen; /* Ancillary data buffer len */
   int           msg_flags;      /* Flags on received message */
};
```

`msg_name`指向socket地址，对于TCP协议无意义，所以在TCP协议中设置为NULL，而对于UDP等其他协议就说明了发送或者接收的地址。`msg_namelen`指定socket地址的长度。

`msg_iov`是`iovec`类型的指针，根据注释来判断应该是个数组。`iovec`结构体封装了一块内存的起始位置和长度。`msg_iovlen`指定这样的`iovec`结构对象有多少个。

对于`recvmsg`而言，数据将被读取并存放在`msg_iovlen`块分散的内存中，这些内存的位置和长度则由`msg_iov`指向的数组指定，这称为分散读( scatter read);对于`sendmsg`而言，`msg_iovlen`块分散内存中的数据将被一并发送，这称为集中写( gather write)。

为什么要有分散读和集中写呢，这其实是一个非常方便的使用，方便传输结构不同的数据。比如：发送http应答时，我们可以把前面的**请求头**和**请求的文件**分为两个buffer，但是最终一起进行写入，减少了拼接带来的麻烦。同理我接收的时候也是想**请求头**和**请求的文件**分开，所以使用分散读。

`msg_flags`成员无须设定，它会复制`recvmsg/sendmsg `的`flags`参数的内容以影响数据读写过程。`recvmsg`还会在调用结束前，将某些更新后的标志设置到`msg_flags`中。

`recvmsg/sendmsg `的 `flags`参数以及返回值的含义均与`sendrecv`的 `flags`参数及返回值相同。

`msg_control `和 `msg_controllen`成员用于辅助数据的传送。目前书中并未进行讲解，后续再补充。

`recvmsg`和`sendmsg`的例子：

```c
#include <arpa/inet.h>
#include <cstdio>
#include <string.h>
#include <cstdlib>
#include <assert.h>
#include <errno.h>
#include <unistd.h>

#define BUFFER_SIZE 256
int main(int argc, char const *argv[])
{
    if (argc <= 2)
    {
        printf("usage: %s ip_address port_number\n", basename(argv[0]));
        return 1;
    }
    const char *ip = argv[1];
    int port = atoi(argv[2]);

    sockaddr_in address;
    bzero(&address, sizeof(address));
    address.sin_family = AF_INET;
    inet_pton(AF_INET, ip, &address.sin_addr);
    address.sin_port = htons(port);

    int sock = socket(AF_INET, SOCK_STREAM, 0);
    assert(sock >= 0);

    int ret = bind(sock, (sockaddr *)&address, sizeof(address));
    assert(ret != -1);

    ret = listen(sock, 5);
    assert(ret != -1);

    struct sockaddr_in client;
    socklen_t client_addrlength = sizeof(client);
    int connfd = accept(sock, (struct sockaddr *)&client, &client_addrlength);

    if (connfd < 0)
    {
        printf("errno is: %d\n", errno);
    }
    else
    {
        char remote[INET_ADDRSTRLEN];
        printf("connected with ip: %s and port: %d\n",
               inet_ntop(AF_INET, &client.sin_addr, remote, INET_ADDRSTRLEN), ntohs(client.sin_port));
		
        char buffer1[6];
        char buffer2[BUFFER_SIZE];
        struct msghdr msg;
        bzero(&msg, sizeof(msg));
        //设置集中写
        struct iovec iovec_arry[2];
        iovec_arry[0].iov_base = (void *)buffer1;
        iovec_arry[0].iov_len = sizeof(buffer1);
        iovec_arry[1].iov_base = (void *)buffer2;
        iovec_arry[1].iov_len = sizeof(buffer2);

        msg.msg_iov = iovec_arry;
        msg.msg_iovlen = 2;

        int n = recvmsg(connfd, &msg, 0);
        assert(n != -1);
        printf(" have recv %d byte msg1 %s and msg2 %s \n", n, buffer1, buffer2);
        close(connfd);
    }
    close(sock);
    return 0;
}
```

`sendmsg`:

```c
#include <arpa/inet.h>
#include <cstdio>
#include <string.h>
#include <cstdlib>
#include <assert.h>
#include <errno.h>
#include <unistd.h>

int main(int argc, char const *argv[])
{
    if (argc <= 2)
    {
        printf("usage: %s ip_address port_number\n", basename(argv[0]));
        return 1;
    }
    const char *ip = argv[1];
    int port = atoi(argv[2]);

    sockaddr_in address;
    bzero(&address, sizeof(address));
    address.sin_family = AF_INET;
    inet_pton(AF_INET, ip, &address.sin_addr);
    address.sin_port = htons(port);

    int sock = socket(AF_INET, SOCK_STREAM, 0);
    assert(sock >= 0);

    int ret = connect(sock, (struct sockaddr *)&address, sizeof(address));
    assert(ret == 0);

    char buffer1[] = "hello";
    char buffer2[] = "world";

    struct msghdr msg;
    bzero(&msg, sizeof(msg));
    // 因为是针对TCP，所以msg_name无意义
    msg.msg_name = NULL;
    msg.msg_namelen = 0;

    //设置集中写
    struct iovec iovec_arry[2];
    iovec_arry[0].iov_base = (void *)buffer1;
    iovec_arry[0].iov_len = sizeof(buffer1);
    iovec_arry[1].iov_base = (void *)buffer2;
    iovec_arry[1].iov_len = sizeof(buffer2);

    msg.msg_iov = iovec_arry;
    msg.msg_iovlen = 2;

    int n = sendmsg(sock, &msg, 0);
    assert(n != -1);
    printf(" have send %d byte msg1 %s and msg2 %s \n", n, buffer1, buffer2);
    close(sock);
    return 0;
}
```

运行结果：

![image-20220813123219330](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220813123219330.png)

需要注意的是`recvmsg`只有在前面的buffer使用完之后，才会使用后面的buffer。这也是为啥把`buffer1`的大小设置为6