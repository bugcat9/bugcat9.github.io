---
title: socket网络信息查询API
date: 2022-08-14 19:57:14
tags:
categories:
---

# socket网络信息查询API

学习《Linux高性能服务器编程》第五章Linux网络编程基础API，为了印象深刻一些，多动手多实践，所以记下这个笔记。这一篇主要记录Linux中socket网络信息查询API，包括gethostbyname和gethostbyaddr、getservbyname和getservbyport、getaddrinfo、getnameinfo。

socket当中两要素：IP和端口号，都是用数值表示的。但是有时候我们可以使用主机名代替IP，使用服务名代替端口号。

```sh
telnet 127.0.0.1 80
telnet localhost www
```

这个功能就是使用网络信息API实现的。

<!--more-->

## gethostbyname和gethostbyaddr

`gethostbyname`函数根据主机名称获取主机的完整信息，`gethostbyaddr`函数根据IP地址获取主机的完整信息。`gethostbyname`函数通常先在本地的`/etc/hosts`配置文件中查找主机，如果没有找到，再去访问DNS服务器。这两个函数的定义如下:

```c
#include <netdb.h>
extern int h_errno;

struct hostent *gethostbyname(const char *name);

#include <sys/socket.h>       /* for AF_INET */
struct hostent *gethostbyaddr(const void *addr, socklen_t len, int type);
```

`name`参数表示目标主机的主机名。

`addr`参数指定目标主机的IP地址，`len`参数指定`addr`的所指定IP的长度

`type`参数指定IP地址的类型，比如`AF_INET`等

其中`hostent`定义如下：

```c
#include <netdb.h>

struct hostent {
   char  *h_name;            /* official name of host */
   char **h_aliases;         /* alias list */
   int    h_addrtype;        /* host address type */
   int    h_length;          /* length of address */
   char **h_addr_list;       /* list of addresses */
}
```

参数介绍

`h_name `:主机名
`h_aliases`:主机别名列表，可能有多个
`h_addrtype`:地址类型（地址族）
`h_length`:地址长度
`h_addr_list`:按网络字节序列出的主机IP地址列表

从网上找了个图显示了一下

![img](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/Center.png)

`gethostbyname`举例

```c
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <stdio.h>

int main(int argc, char **argv)
{
    if (argc != 2)
    {
        printf("Use example: %s www.baidu.com\n", *argv);
        return -1;
    }

    char *name = argv[1];
    struct hostent *hptr;

    hptr = gethostbyname(name);
    if (hptr == NULL)
    {
        printf("gethostbyname error for host: %s: %s\n", name, hstrerror(h_errno));
        return -1;
    }
    //输出主机名
    printf("\tofficial: %s\n", hptr->h_name);

    //输出主机的别名
    char **pptr;
    char str[INET_ADDRSTRLEN];
    for (pptr = hptr->h_aliases; *pptr != NULL; pptr++)
    {
        printf("\talias: %s\n", *pptr);
    }

    //输出ip地址
    switch (hptr->h_addrtype)
    {
    case AF_INET:
        pptr = hptr->h_addr_list;
        for (; *pptr != NULL; pptr++)
        {
            printf("\taddress: %s\n",
                   inet_ntop(hptr->h_addrtype, *pptr, str, sizeof(str)));
        }
        break;
    default:
        printf("unknown address type\n");
        break;
    }

    return 0;
}
```

![image-20220814105118617](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220814105118617.png)

`gethostbyaddr`举例

```c
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <stdio.h>

int main(int argc, char **argv)
{
    if (argc != 2)
    {
        printf("Use example: %s 127.0.0.1\n", *argv);
        return -1;
    }

    char *ip = argv[1];
    struct in_addr addr;

    inet_pton(AF_INET, ip, &addr);
    struct hostent *hptr;

    hptr = gethostbyaddr(&addr, sizeof(addr), AF_INET);
    if (hptr == NULL)
    {
        printf("gethostbyaddr error for host: %s: %s\n", ip, hstrerror(h_errno));
        return -1;
    }
    //输出主机名
    printf("\tofficial: %s\n", hptr->h_name);

    //输出主机的别名
    char **pptr;
    char str[INET_ADDRSTRLEN];
    for (pptr = hptr->h_aliases; *pptr != NULL; pptr++)
    {
        printf("\talias: %s\n", *pptr);
    }

    //输出ip地址
    switch (hptr->h_addrtype)
    {
    case AF_INET:
        pptr = hptr->h_addr_list;
        for (; *pptr != NULL; pptr++)
        {
            printf("\taddress: %s\n",
                   inet_ntop(hptr->h_addrtype, *pptr, str, sizeof(str)));
        }
        break;
    default:
        printf("unknown address type\n");
        break;
    }

    return 0;
}

```

![image-20220814105222471](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220814105222471.png)

## getservbyname和getservbyport

`getservbyname`函数根据名称获取某个服务的完整信息，`getservbyport`函数根据端口号获取某个服务的完整信息。它们实际上都是通过读取`/etc/services`文件来获取服务的信息的。这两个函数的定义如下:

```c
#include <netdb.h>

struct servent *getservbyname(const char *name, const char *proto);
struct servent *getservbyport(int port, const char *proto);
```

`name`参数指定目标服务的名字。

`port`参数指定目标服务对应的端口号。

`proto`参数指定服务类型，给它传递“tcp”表示获取流服务，给它传递“udp”表示获取数据报服务，给它传递NULL则表示获取所有类型的服务。

函数返回的`servent`的定义如下：

```c
#include <netdb.h>
struct servent {
   char  *s_name;       /* official service name */
   char **s_aliases;    /* alias list */
   int    s_port;       /* port number */
   char  *s_proto;      /* protocol to use */
}
```

`s_name`：服务名称

`s_aliases`：服务别名列表，可能有多个

`s_port`：端口号

`s_proto`：服务类型，通常是tcp或者udp

`getservbyname`举例

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <stdio.h>
#include <unistd.h>
#include <assert.h>

int main(int argc, char const *argv[])
{

    struct servent *servinfo = getservbyname("ssh", "tcp");
    assert(servinfo);
    printf("name is %s\n", servinfo->s_name);

    char **pptr;
    for (pptr = servinfo->s_aliases; *pptr != NULL; pptr++)
    {
        printf("alias: %s\n", *pptr);
    }
    printf("port is %d\n", ntohs(servinfo->s_port));
    printf("protocol is %s\n", servinfo->s_proto);
    return 0;
}
```

![image-20220814141312451](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220814141312451.png)

`getservbyport`举例

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <stdio.h>
#include <unistd.h>
#include <assert.h>

int main(int argc, char const *argv[])
{

    int port = 80;
    struct servent *servinfo = getservbyport(htons(port), "tcp");
    assert(servinfo);
    printf("name is %s\n", servinfo->s_name);

    char **pptr;
    for (pptr = servinfo->s_aliases; *pptr != NULL; pptr++)
    {
        printf("alias: %s\n", *pptr);
    }
    printf("port is %d\n", ntohs(servinfo->s_port));
    printf("protocol is %s\n", servinfo->s_proto);
    return 0;
}
```

![image-20220814142922859](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220814142922859.png)

需要指出的是，上面讨论的4个函数都是不可重入的，即非线程安全的。不过`netdb.h`头文件给出了它们的可重入版本。正如Linux下所有其他函数的可重入版本的命名规则那样，这些函数的函数名是在原函数名尾部加上_`r (re-entrant)`。

## getaddrinfo

`getaddrinfo`函数既能通过主机名获得IP地址（内部使用的是`gethostbyname`函数),也能通过服务名获得端口号（内部使用的是`getservbyname`函数)。它是否可重人取决于其内部调用的`gethostbyname`和`getservbyname`函数是否是它们的可重入版本。该函数的定义如下:

```c
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>

int getaddrinfo(const char *node, const char *service, const struct addrinfo *hints, struct addrinfo **res);
```

`node`参数可以接收主机名，也可以接收字符串表示的IP地址，用点分十分制。

`service`参数可以接收服务名，也可以接收字符串表示的十进制端口。

`hints`参数是给`getaddrinfo`的一个提示，以对`getaddrinfo`的输出进行更精确的控制。`hints`参数可以设置为NULL，表示允许`getaddrinfo`反馈任何可用的结果。

`res`参数返回一个链表，这个链表用于存储`getaddrinfo`反馈的结果。

除此之外，在我们调用完`getaddrinfo`之后，需要使用`freeaddrinfo`对res进行内存释放。

```c
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
void freeaddrinfo(struct addrinfo *res);
```

`addrinfo`的定义如下

```c
struct addrinfo {
   int              ai_flags;
   int              ai_family;
   int              ai_socktype;
   int              ai_protocol;
   socklen_t        ai_addrlen;
   struct sockaddr *ai_addr;
   char            *ai_canonname;
   struct addrinfo *ai_next;
};
```

`ai_family`：地址族，比如：`AF_INET`

`ai_socktype`：服务类型，比如：`SOCK_STREAM`

`ai_protocol`：指具体的网络协议

`ai_addrlen`：地址`ai_addr`的长度

`ai_addr`：指向socket的地址

`ai_canonname`：主机的别名

`ai_next`：链表的下一个对象

`ai_flags`可以取下表中标志

![image-20220814160248251](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220814160248251.png)

当我们使用hints参数的时候，可以设置其`ai_flags`，`ai_family`，`ai_socktype`和` ai_protocol`四个字段，其他字段则必须被设置为NULL。

**根据主机名获取IP地址：**

```c
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <arpa/inet.h>
#include <assert.h>

int main(int argc, char **argv)
{
    if (argc != 2)
    {
        printf("Use example: %s www.baidu.com\n", *argv);
        return -1;
    }

    char *name = argv[1];
    struct addrinfo hints;
    struct addrinfo *res, *cur;
    int ret;
    struct sockaddr_in *addr;
    char ipbuf[16];

    memset(&hints, 0, sizeof(struct addrinfo));
    hints.ai_family = AF_INET;   /* Allow IPv4 */
    hints.ai_flags = AI_PASSIVE; /* For wildcard IP address */
    hints.ai_protocol = 0;       /* Any protocol */
    hints.ai_socktype = SOCK_STREAM;

    ret = getaddrinfo(name, NULL, &hints, &res);
    assert(ret >= 0);

    for (cur = res; cur != NULL; cur = cur->ai_next)
    {
        addr = (struct sockaddr_in *)cur->ai_addr;
        printf("ip: %s\n", inet_ntop(AF_INET, &addr->sin_addr, ipbuf, cur->ai_addrlen));
        printf("alias: %s\n", cur->ai_canonname);
    }
    freeaddrinfo(res);
    return 0;
}
```

![image-20220814165923059](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220814165923059.png)

不过不知道为啥别名为null

**根据主机名和端口号获取地址信息：**

```c
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <arpa/inet.h>
#include <assert.h>

int main(int argc, char **argv)
{
    if (argc != 2)
    {
        printf("Use example: %s 80\n", *argv);
        return -1;
    }

    char *port = argv[1];
    char *hostname = "localhost";
    struct addrinfo hints;
    struct addrinfo *res, *cur;
    int ret;
    struct sockaddr_in *addr;
    char ipbuf[16];

    memset(&hints, 0, sizeof(struct addrinfo));
    hints.ai_family = AF_UNSPEC; /* Allow IPv4 */
    hints.ai_flags = AI_PASSIVE; /* For wildcard IP address */
    hints.ai_protocol = 0;       /* Any protocol */
    hints.ai_socktype = 0;

    ret = getaddrinfo(hostname, port, &hints, &res);

    assert(ret >= 0);

    for (cur = res; cur != NULL; cur = cur->ai_next)
    {
        addr = (struct sockaddr_in *)cur->ai_addr;
        printf("ip: %s\n", inet_ntop(AF_INET, &addr->sin_addr, ipbuf, cur->ai_addrlen));
        printf("port: %d\n", ntohs(addr->sin_port));
        printf("alias: %s\n", cur->ai_canonname);
    }
    freeaddrinfo(res);
    return 0;
}

```

![image-20220814170106763](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220814170106763.png)

不过不知道为啥别名为null

## getnameinfo

`getnameinfo`函数能通过socket地址同时获得以字符串表示的**主机名**（内部使用的是`gethostbyaddr`函数）和**服务名**（内部使用的是`getservbyport`函数)。它是否可重入取决于其内部调用的gethostbyaddr和 getservbyport函数是否是它们的可重入版本。该函数的定义如下:

```c
#include <sys/socket.h>
#include <netdb.h>

int getnameinfo(const struct sockaddr *addr, socklen_t addrlen,char *host, socklen_t hostlen,
                char *serv, socklen_t servlen, int flags);
```

`getnameinfo`将返回的主机名存储在host参数指向的缓存中，将服务名存储在serv参数指向的缓存中，`hostlen`和 `servlen`参数分别指定这两块缓存的长度。flags参数控制`getnameinfo`的行为，它可以接收下表中的选项。

![image-20220814171842523](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220814171842523.png)

`getaddrinfo`和 `getnameinfo`函数成功时返回0，失败则返回错误码。

```c
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <arpa/inet.h>
#include <assert.h>

int main(int argc, char **argv)
{
    if (argc != 3)
    {
        printf("Use example: %s 127.0.0.1 80\n", *argv);
        return -1;
    }

    char *ip = argv[1];
    int port = atoi(argv[2]);
    char hostname[128] = {0};
    char servername[128] = {0};
    struct sockaddr_in addr_dst;
    memset(&addr_dst, 0, sizeof(addr_dst));
    addr_dst.sin_family = AF_INET;
    addr_dst.sin_addr.s_addr = inet_addr(ip);
    addr_dst.sin_port = htons(port);

    int ret = getnameinfo((struct sockaddr *)&addr_dst, sizeof(addr_dst), hostname, sizeof(hostname), servername, sizeof(servername), 0);
    assert(ret == 0);
    printf("hostname IP: %s \n", hostname);
    printf("servername : %s \n", servername);
    return 0;
}
```

![image-20220814181037933](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220814181037933.png)