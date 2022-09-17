---
title: socket相关命令
date: 2022-08-14 18:27:33
tags:
- 计算机网络
- Linux
- Linux网络编程
- Linux高性能服务器编程
categories:
- Linux网络编程
---

# socket相关命令

学习《Linux高性能服务器编程》第五章Linux网络编程基础API，为了印象深刻一些，多动手多实践，所以记下这个笔记。这一篇主要记录Linux中socket相关的命令，包括创建socket、命名socket、监听socket、接受连接、发起连接和关闭连接。

<!--more-->

## 创建socket

socket使用系统调用可以创建一个socket

```c
#include <sys/types.h>          /* See NOTES */
#include <sys/socket.h>

int socket(int domain, int type, int protocol);
```

` domain`参数是告诉系统使用的是那个底层协议族，一般都是使用IPv4，所以使用`AF_INET`即可。关于`socket`系统调用支持的所有协议族，可以查看man手册（虽然参数名不一样，但是并无大碍）。

![image-20220812095854483](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812095854483.png)

`type`参数指定服务类型。服务类型主要有`SOCK_STREAM`服务（流服务）和`SOCK_UGRAM`（数据报）服务。对TCP/IP协议族而言，其值取`SOCK_STREAM`表示传输层使用TCP协议，取`SOCK_DGRAM`表示传输层使用UDP协议。

![image-20220812101617247](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812101617247.png)

并且从Linux内核2.6.17起，增加了`SOCK_NONBLOCK`和`SOCK_CLOEXEC`这两个标志值，表示将新创建的socket设为非阻塞，以及fork调用创建子进程时在子进程中关闭该socket。在Linux内核2.6.17前，需要调用`fcntl`进行设置。

`protocol`参数设置具体的协议。但是在前两个参数确定的情况下，这个参数的值基本上唯一的，所有几乎在所有情况下，我们都把这个值设置为0，表示使用默认协议。

socket系统调用成功时返回一个socket文件描述符，失败则返回-1并设置errno。

```c
#include <sys/socket.h>

int main(int argc, char const *argv[])
{
    int lfd = 0;
    lfd = socket(AF_INET, SOCK_STREAM, 0); //创建一个 socket
    close(lfd);
    return 0;
}
```

## 命名socket

创建socket时，我们指定了地址族，但是并没有给定具体的地址，这样作为服务器别人是访问不到我们的。将一个socket 与socket地址绑定称为给socket命名。命名socket的系统调用是bind。

```c
#include <sys/types.h>          /* See NOTES */
#include <sys/socket.h>

int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
```

`bind`将`addr`所指的socket地址分配给未命名的`sockfd`文件描述符，`addrlen`参数指出该socket地址的长度。

![image-20220812104757237](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812104757237.png)

`bind`成功时返回0，失败则返回-1并设置`errno`。其中两种常见的`errno`是`EACCES`和`EADDRINUSE`，它们的含义分别是:

* `EACCES`，被绑定的地址是受保护的地址，仅超级用户能够访问。比如普通用户将socket绑定到知名服务端口（端口号为0~1023）上时，`bind`将返回`EACCES`错误。
* `EADDRINUSE`，被绑定的地址正在使用中。比如将socket绑定到一个处于`TIME_WAIT`状态的socket地址。

![image-20220812105430276](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812105430276.png)

```c++
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <errno.h>
#include <stdio.h>


#define SERV_PORT 8080

int main(int argc, char const *argv[])
{
    int lfd = 0, cfd = 0;
    int ret, i;

    struct sockaddr_in serv_addr, clit_addr; // 定义服务器地址结构 和 客户端地址结构
    socklen_t clit_addr_len;                 // 客户端地址结构大小

    serv_addr.sin_family = AF_INET;                // IPv4
    serv_addr.sin_port = htons(SERV_PORT);         // 转为网络字节序的 端口号
    serv_addr.sin_addr.s_addr = htonl(INADDR_ANY); // 获取本机任意有效IP

    lfd = socket(AF_INET, SOCK_STREAM, 0); //创建一个 socket
    if (lfd == -1)
    {
        perror("socket error");
    }

    bind(lfd, (struct sockaddr *)&serv_addr, sizeof(serv_addr)); //给服务器socket绑定地址结构（IP+port)
    close(lfd);
    return 0;
}
```

## 监听socket

socket被命名后，还需要调用`listen`创建一个监听队列来存放处理的客户连接。

```c
#include <sys/types.h>          /* See NOTES */
#include <sys/socket.h>

int listen(int sockfd, int backlog);
```

![image-20220812112118847](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812112118847.png)

`sockfd`参数指定被监听的socket。`backlog`参数提示内核监听队列的最大长度。监听队列的长度如果超过`backlog`，服务器将不受理新的客户连接，客户端也将收到`ECONNREFUSED`错误信息。

在内核版本2.2之前的Linux中，`backlog`参数是指所有处于半连接状态（`SYN_RCVD`）和完全连接状态（`ESTABLISHED`)的socket 的上限。但自内核版本2.2之后，它只表示处于完全连接状态的socket的上限，处于半连接状态的socket的上限则由`/proc/sys/net/ipv4/tcp_max_syn_backlog `内核参数定义。`backlog `参数的典型值是5。

![image-20220812113608890](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812113608890.png)

`listen`成功时返回0，失败则返回-1并设置`erron`。

本来想测试`backlog`这个参数的效果，但是怎么也成功不了，不知道原因，以后有机会再进行尝试吧。

## 接受连接

接受连接通过`accept`进行

```c
#include <sys/types.h>          /* See NOTES */
#include <sys/socket.h>

int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
```

![image-20220812143816774](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812143816774.png)

`sockfd`指执行过`listen`的监听套接字的文件描述符。

`addr`是传出参数，用来获取接受连接的远端socket地址，地址的长度由`addrlen`参数指出。

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
        close(connfd);
    }

    close(sock);
    return 0;
}
```

![image-20220812151534158](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812151534158.png)

并且**书上面的实验**说明了`accept`直接从监听队列中取出连接，而不论连接处于何种状态，更不关心任何网络状况的变化。比如：客户端在服务器`accept`之前就断网了，`accept`还是可以正常进行，它并不会返回错误。

## 发起连接

发动连接一般是客户端进行的，通过系统调用`connect`与服务器进行连接。

```c
#include <sys/types.h>          /* See NOTES */
#include <sys/socket.h>

int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
```

![image-20220812154447716](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812154447716.png)

`sockfd`参数由socket系统调用返回一个`socket`。`addr`参数是服务器监听的`socket`地址。`addrlen`参数指这个地址长度。

`connect`成功时返回0。一旦成功建立连接，`sockfd`就唯一地标识了这个连接，客户端就可以通过读写sockfd来与服务器通信。`connect `失败则返回-1并设置`errno`。其中两种常见的`errno`是`ECONNREFUSED`和`ETIMEDOUT`，它们的含义如下:

* `ECONNREFUSED`表示目标端口不存在，连接被拒绝。
* `ETIMEDOUT`表示连接超时。

## 关闭连接

关闭连接一般来说使用

```c
#include <unistd.h>
int close(int fd);
```

`fd`参数是待关闭的socket。不过，`close`并不会立即关闭这个连接，而是将`fd`的引用数量减1，直到`fd`引用数量为0，才真正关闭连接。在多进程程序中，一次`fork`系统调用默认将父进程中`socket`的引用计算加1，因此必须在子进程和父进程都对该`socket`进行`close`调用才能将连接关闭。

如果想立刻终止连接，直接调用`shutdown`。

```c
#include <sys/socket.h>
int shutdown(int sockfd, int how);
```

![image-20220812160846669](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812160846669.png)

`sockfd`参数是待关闭的socket，`howto`参数决定了`shutdown`的行为。

|  可选值   | 含义                                                         |
| :-------: | :----------------------------------------------------------- |
|  SHUT_RD  | 关闭sockfd上读的这一半。应用程序不能再针对socket文件描述符执行读操作，并且该sockct接收缓冲区中的数据都被丢弃。 |
|  SHUT_WR  | 关闭sockfd上写的这一半。sockfd 的发送缓冲区中的数据会在真正关闭连接之前全部发送出去，应用程序不可再对该socket文件描述符执行写操作。这种情况下，连接处于半关闭状态。 |
| SHUT_RDWR | 同时关闭sockfd上的读和写。                                   |

可以看出`shutdown`可以灵活的关闭socket上的读或写。而`close`在关闭连接时只能将`socket`上的读和写同时关闭。

`shutdown`成功时返回0，失败则返回-1并设置`errno`。

