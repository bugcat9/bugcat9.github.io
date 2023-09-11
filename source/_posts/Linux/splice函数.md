---
title: splice函数
date: 2022-08-19 15:22:42
tags:
- Linux
- Linux高性能服务器编程
categories:
- Linux
---

# splice函数

`splice`用于在两个文件描述符之间移动数据，是零拷贝操作。看了`man`手册，发现这个`splice`函数跟pipe管道关系不浅。

![image-20220816100155851](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220816100155851.png)

```c
#include <fcntl.h>

ssize_t splice(int fd_in, loff_t *off_in, int fd_out, loff_t *off_out, size_t len, unsigned int flags);
```

`fd_in`参数是待输人数据的文件描述符。如果`fd_in`是一个管道文件描述符，那么 `off_in`参数必须被设置为NULL。如果`fd_in`不是一个管道文件描述符（比如 socket)，那么`off_in`表示从输入数据流的何处开始读取数据。此时，若`off_in`被设置为NULL，则表示从输入数据流的当前偏移位置读入；若`off_in`不为NULL，则它将指出具体的偏移位置。

`fd_out/off_out`参数的含义与`fd_in/off_in`相同，不过用于输出数据流。

`len`参数指定移动数据的长度

`flags`参数则控制数据如何移动，它可以被设置为下表中的某些值的按位或。

![image-20220816100934412](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220816100934412.png)

<!--more-->

使用`splice`函数时，`fd_in`和`fd_out`必须至少有一个是管道文件描述符。

`splice`函数调用成功时返回移动字节的数量。它可能返回0，表示没有数据需要移动，这发生在从管道中读取数据（`fd_in`是管道文件描述符）而该管道没有被写入任何数据时。`splice`函数失败时返回-1并设置`errno`。常见的`errno`如下表所示。

![image-20220816101918940](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220816101918940.png)

下面用了一个书中的例子，实现一个零拷贝的回射服务器，它将客户端发送的信息通过`splice`从`pipefd[1]`写入管道，再使用`splice`从`pipefd[0]`向客户端写东西，从而实现零拷贝的回射服务器（整个过程没有使用`read`或者`write`操作）。

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <assert.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>
#include <fcntl.h>

int main(int argc, char *argv[])
{
    if (argc <= 2)
    {
        printf("usage: %s ip_address port_number\n", basename(argv[0]));
        return 1;
    }
    const char *ip = argv[1];
    int port = atoi(argv[2]);

    struct sockaddr_in address;
    bzero(&address, sizeof(address));
    address.sin_family = AF_INET;
    inet_pton(AF_INET, ip, &address.sin_addr);
    address.sin_port = htons(port);

    int sock = socket(PF_INET, SOCK_STREAM, 0);
    assert(sock >= 0);

    int ret = bind(sock, (struct sockaddr *)&address, sizeof(address));
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
        int pipefd[2];
        assert(ret != -1);
        ret = pipe(pipefd);
        ret = splice(connfd, NULL, pipefd[1], NULL, 32768, SPLICE_F_MORE | SPLICE_F_MOVE);
        assert(ret != -1);
        ret = splice(pipefd[0], NULL, connfd, NULL, 32768, SPLICE_F_MORE | SPLICE_F_MOVE);
        assert(ret != -1);
        close(connfd);
    }

    close(sock);
    return 0;
}
```

![image-20220816102919876](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220816102919876.png)

