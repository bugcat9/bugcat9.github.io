---
title: socket地址信息函数
date: 2022-08-14 19:49:19
tags:
- 计算机网络
- Linux
- Linux网络编程
- Linux高性能服务器编程
categories:
- Linux网络编程
---

# socket地址信息函数

学习《Linux高性能服务器编程》第五章Linux网络编程基础API，为了印象深刻一些，多动手多实践，所以记下这个笔记。这一篇主要记录Linux中socket地址信息函数。

<!--more-->

如果我们要查询一个连接socket的本端socket地址，以及远端的socket地址，可以使用下面两个函数。

```c
#include <sys/socket.h>

int getsockname(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
int getpeername(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
```

`getsockname`获得`sockfd`对应的本端地址（本地自己的地址），`getpeername`获得`sockfd`对应的远端地址（远端连接的地址）。两个函数都把地址存储在`addr`参数指定的内存中，将该地址的长度存放在`addrlen`当中。

如果实际socket地址的长度大于`addr`所指内存区的大小，那么该socket地址将被截断。两个函数成功时返回0，失败返回-1并设置`errno`。

我写了代码测试了一下，使用telnet进行连接

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

        // 获得本端地址
        struct sockaddr_in addr;
        socklen_t addrlen = sizeof(addr);
        ret = getsockname(connfd, (sockaddr *)&addr, &addrlen);
        assert(ret == 0);
        printf("getsockname info ip: %s and port: %d , addrlen is %d \n",
               inet_ntop(AF_INET, &addr.sin_addr, remote, INET_ADDRSTRLEN), ntohs(addr.sin_port), addrlen);

        // 获得远端地址
        struct sockaddr_in addr2;
        socklen_t addrlen2 = sizeof(addr2);
        ret = getpeername(connfd, (sockaddr *)&addr2, &addrlen2);
        assert(ret == 0);
        printf("getpeername info ip: %s and port: %d , addrlen is %d \n",
               inet_ntop(AF_INET, &addr2.sin_addr, remote, INET_ADDRSTRLEN), ntohs(addr2.sin_port), addrlen2);

        close(connfd);
    }

    close(sock);
    return 0;
}
```

![image-20220813163338463](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220813163338463.png)

