---
title: socket选项
date: 2022-08-14 19:53:02
tags:
- 计算机网络
- Linux
- Linux网络编程
- Linux高性能服务器编程
categories:
- Linux网络编程
---

# socket选项

读取和设置socket文件描述的方法如下

```c
#include <sys/types.h>          /* See NOTES */
#include <sys/socket.h>

int getsockopt(int sockfd, int level, int optname, void *optval, socklen_t *optlen);
int setsockopt(int sockfd, int level, int optname, const void *optval, socklen_t optlen);
```

`sockfd`参数指定被操纵的目标socket，`level`参数指定要操作的协议选项，`optname`参数则指定选项的名字，`optval`和`optlen`参数分别是操作选项的值和长度。截图了一下书中的表格。

<!--more-->

![socket选项](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/socket选项.png)

`getsockopt `和`setsockopt`这两个函数成功时返回0，失败时返回-1并设置`errno`。

需要注意的是，在服务器端`setsockopt`最好在`listen`之前进行调用（因为连接socket只能由accept调用返回，而accept 从 listen 监听队列中接受的连接至少已经完成了TCP三次握手的前两个步骤）。同理，对客户端而言，这些socket选项则应该在调用connect 函数之前设置，因为connect调用成功返回之后，TC三次握手已完成。

### SO_REUSEADDR

设置服务器可以立即重启，不需要等待`TIME_WAIT`状态过去，可以使用`SO_REUSEADDR`

```c
    int sock = socket( PF_INET, SOCK_STREAM, 0 );
    assert( sock >= 0 );
    int reuse = 1;
    setsockopt( sock, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof( reuse ) );
```

经过setsockopt的设置之后，即使sock处于TIME_WAIT状态，与之绑定的socket地址也可以立即被重用。

### SO_RCVBUF和SO_SNDBUF

`SO_RCVBUF`和`SO_SNDBUF`分别设置TCP接收缓冲区和发送缓冲区的大小。但是，当我们使用`setsockopt`设置TCP缓冲区大小时，系统都会将其值进行加倍，并且不会小于某个值。TCP接收缓冲区最小值是256字节，发送缓冲区最小是2048字节。小值是2048字节(不过，不同的系统可能有不同的默认最小值)。系统这样做的目的，主要是确保一个TCP连接拥有足够的空闲缓冲区来处理拥塞（比如快速重传算法就期望TCP接收缓冲区能至少容纳4个大小为SMSS的TCP报文段)。

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

#define BUFFER_SIZE 1024

int main(int argc, char *argv[])
{
    if (argc <= 4)
    {
        printf("usage: %s ip_address port_number receive_buffer_size\n", basename(argv[0]));
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
    int recvbuf = atoi(argv[3]);
    int len = sizeof(recvbuf);
    setsockopt(sock, SOL_SOCKET, SO_RCVBUF, &recvbuf, sizeof(recvbuf));
    getsockopt(sock, SOL_SOCKET, SO_RCVBUF, &recvbuf, (socklen_t *)&len);
    printf("the receive buffer size after settting is %d\n", recvbuf);

    int sendbuf = atoi(argv[4]);
    len = sizeof(sendbuf);
    setsockopt(sock, SOL_SOCKET, SO_SNDBUF, &sendbuf, sizeof(sendbuf));
    getsockopt(sock, SOL_SOCKET, SO_SNDBUF, &sendbuf, (socklen_t *)&len);
    printf("the tcp send buffer size after setting is %d\n", sendbuf);

    close(sock);
    return 0;
}
```

![image-20220813180440008](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220813180440008.png)

emmm不知道为啥大小是这样，后续再看看。