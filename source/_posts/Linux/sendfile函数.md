---
title: sendfile函数
date: 2022-08-19 15:21:30
tags:
- Linux
- Linux高性能服务器编程
categories:
- Linux
---

# sendfile函数

`sendfile`函数在两个文件描述符之间直接传递数据（完全在内核中操作)，从而避免了内核缓冲区和用户缓冲区之间的数据拷贝，效率很高，这被称为零拷贝。`sendfile`函数的定义如下:

```c
#include <sys/sendfile.h>
ssize_t sendfile(int out_fd, int in_fd, off_t *offset, size_t count);
```

`out_fd`参数是待写入内容的文件描述符

`in_fd`参数是待读取内容的文件描述符

`offset`参数是指从读入文件流的哪个位置开始读，如果为空，则使用读入文件流默认的起始位置

`count`参数指定在文件描述符`in_fd`和`out_fd`之间传输的字节数

`sendfile`成功时返回传输的字节数，失败则返回-1并设置`errno`。

该函数的man手册明确指出，`in_fd`必须是一个支持类似`mmap`函数的文件描述符，即它必须指向真实的文件，不能是socket和管道。而`out_fd`则必须是一个socket。由此可见，`sendfile`几乎是专门为在网络上传输文件而设计的。

<!--more-->

用了一个书上的例子

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
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <sys/sendfile.h>

int main(int argc, char *argv[])
{
    if (argc <= 3)
    {
        printf("usage: %s ip_address port_number filename\n", basename(argv[0]));
        return 1;
    }
    const char *ip = argv[1];
    int port = atoi(argv[2]);
    const char *file_name = argv[3];

    int filefd = open(file_name, O_RDONLY);
    assert(filefd > 0);
    struct stat stat_buf;
    fstat(filefd, &stat_buf);

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
        sendfile(connfd, filefd, NULL, stat_buf.st_size);
        close(connfd);
    }

    close(sock);
    return 0;
}
```

![image-20220815185556863](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220815185556863.png)