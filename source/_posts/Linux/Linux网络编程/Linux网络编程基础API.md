---
title: Linux网络编程基础API
date: 2022-08-09 17:10:19
tags:
- 计算机网络
- Linux
- Linux网络编程
- Linux高性能服务器编程
categories:
- Linux网络编程
---

# Linux网络编程基础API

学习《Linux高性能服务器编程》第五章Linux网络编程基础API，为了印象深刻一些，多动手多实践，所以记下这个笔记。

<!--more-->

## socket地址API

### 主机字节序和网络字节序

计算机硬件有两种储存数据的方式：**大端字节序（big endian）**和**小端字节序（little endian）**。

- **大端字节序**：高位字节在前，低位字节在后，符合人类读写数值的方法。
- **小端字节序**：低位字节在前，高位字节在后

想要判别机器的字节序可以使用如下的代码

```c
#include <stdio.h>

void byteorder()
{
	union
	{
		short value;
		char union_bytes[sizeof(short)];
	} test;
	test.value = 0x0102;
	if ((test.union_bytes[0] == 1) && (test.union_bytes[1] == 2))
	{
		printf("big endian\n");
	}
	else if ((test.union_bytes[0] == 2) && (test.union_bytes[1] == 1))
	{
		printf("little endian\n");
	}
	else
	{
		printf("unknown...\n");
	}
}

int main()
{

	byteorder();
	return 0;
}

```

运行结果：

![image-20220809181538872](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220809181538872.png)

这段代码使用的原理是**union变量所占用的内存长度等于最长的成员的内存长度。**

所以`test`中`value`和`union_bytes`是共用一段内存的。因为在c中`short`是16位也就是2字节，`char`是8位也就是1字节，所以`union_bytes`数组的大小是2。

我们给`value`赋值为`0x0102`。如果是机器是高位存储，那么`union_bytes`数组第一个元素存储`0x01`，第二个元素存储`0x02`，如果是机器是高位存储，那么`union_bytes`数组第一个元素存储`0x02`，第二个元素存储`0x01`

![image-20220809185922374](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220809185922374.png)

扩展到32位，四字节来说以`0x12345678`为例，那么

**大端字节序**：0x12345678

**小端字节序**：0x78563412

总结来说就是大端字节序和小端字节序的区别就是以**字节**为单位的存储方式不同。

在网络中两台使用不同字节序的主机之间直接传递时，接收端必然会造成错误。书中说解决的方法是发送端总是把要发送的数据转化成大端字节序数据再发送，接受端知道传送过来的数据总是采用大端字节序，所以接收端根据自身采用的字节序再对数据进行一定的处理（小端进行转换，大端就不转换）。

Linux提供了4个函数来完成主机字节序和网络字节序之间的转换:

![image-20220810153657086](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220810153657086.png)

```c
#include <netinet/in.h>
uint32_t ntohl (uint32_t __netlong);
uint16_t ntohs (uint16_t __netshort);
uint32_t htonl (uint32_t __hostlong);
uint16_t htons (uint16_t __hostshort);
```

它们的含义是就是首字母缩写（这谁看的出来），比如"htonl"表示“host to network long”，即将长整型（32bit）的主机字节序数据转化为网络字节序数据。这四个函数中，长整型`uint32_t`函数通常用来转换IP地址，短整型`uint16_t`函数用来转化端口号。

简单示例展示：

```c
#include <netinet/in.h>
#include <cstdio>

int main(int argc, char const *argv[])
{

    uint16_t port = 258;
    uint16_t p = htons(port);
    port = ntohs(p);
    printf("htons :%u \n", p);
    printf("ntohs :%u \n", port);

    return 0;
}
```

运行结果：

![image-20220810181643405](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220810181643405.png)

`513`二进制：`0000 0010 0000 0001`

`258`二进制：`0000 0001 0000 0010`

可以看出两者字节序是不同的

### socket地址

#### 通用socket地址

##### sockaddr

socket网络接口中表示socket地址的是结构体`sockaddr`，他的定义在头` <bits/socket.h>`中，我看在我的电脑上看到的是如下的定义（各个版本不同，可能实现不同，我这里和书上就不大相同）：

![image-20220810185029006](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220810185029006.png)

```c
#include <bits/socket.h>
/* Structure describing a generic socket address.  */
struct sockaddr
  {
    __SOCKADDR_COMMON (sa_);	/* Common data: address family and length.  */
    char sa_data[14];		/* Address data.  */
  };
```

其中`__SOCKADDR_COMMON`定义在`<bits/sockaddr.h>`中

![image-20220810185204703](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220810185204703.png)

```c
#include <bits/sockaddr.h>
/* POSIX.1g specifies this type name for the `sa_family' member.  */
typedef unsigned short int sa_family_t;

/* This macro is used to declare the initial common members
   of the data types used for socket addresses, `struct sockaddr',
   `struct sockaddr_in', `struct sockaddr_un', etc.  */

#define	__SOCKADDR_COMMON(sa_prefix) sa_family_t sa_prefix##family
```

`__SOCKADDR_COMMON`是定义的一个函数，它返回一个`sa_family_t`类型的数据，数据的名字是`sa_prefixfamily`，其中`sa_prefix`是你传进去的值。比如：`__SOCKADDR_COMMON (sa_)`其实就是返回`sa_family_t sa_family`。

所以`sockaddr`其实就是两个成员，一个是`sa_family_t`（地址族）类型的变量`sa_family`，一个`char`数组类型的变量`sa_data`

`sa_family_t`常见的协议族（protocol family，也称domain）和对应的地址族如下表所示

|  协议族  |  地址族  |      描述      |
| :------: | :------: | :------------: |
| PF_UNIX  | AF_UNIX  | UNIX本地协议族 |
| PF_INET  | AF_INET  |   IPv4协议族   |
| PF_INET6 | AF_INET6 |   IPv6协议族   |

宏PF\_\*和AF\_\*都定义在`<bits/socket.h>`当中，两者的值相同，所以两者可以混用

![image-20220811094342093](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811094342093.png)

![image-20220811094510529](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811094510529.png)

`sa_data`成员用于存放socket地址值。不同的协议族的地址值有不同的含义和长度。

|  协议族  |                       地址值含义和长度                       |
| :------: | :----------------------------------------------------------: |
| PF_UNIX  |                文件的路径名，长度可达108字节                 |
| PF_INET  |             16bit端口号和32bit IPv4地址，共6字节             |
| PF_INET6 | 16bit端口号，32bit流标识，128bit IPv6地址，32bit范围ID，共26字节 |

##### sockaddr_storage

可以看出14字节的`sa_data`根本无法容纳多数协议族的地址值。所以，Linux中定义了新的通用socket地址结构体（其实就是把存放地址的数组加大了）：

```c
#include <bits/socket.h>
/* Structure large enough to hold any socket address (with the historical
   exception of AF_UNIX).  */
#define __ss_aligntype	unsigned long int
#define _SS_PADSIZE \
  (_SS_SIZE - __SOCKADDR_COMMON_SIZE - sizeof (__ss_aligntype))

struct sockaddr_storage
  {
    __SOCKADDR_COMMON (ss_);	/* Address family, etc.  */
    char __ss_padding[_SS_PADSIZE];
    __ss_aligntype __ss_align;	/* Force desired alignment.  */
  };
```

其中`_SS_SIZE`、`__SOCKADDR_COMMON_SIZE`在`<bits/sockaddr.h>`当中

```c
#include <bits/sockaddr.h>
#define __SOCKADDR_COMMON_SIZE	(sizeof (unsigned short int))

/* Size of struct sockaddr_storage.  */
#define _SS_SIZE 128
```

![image-20220811135111456](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811135111456.png)

![image-20220811135134566](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811135134566.png)

这个结构体提供了足够大的空间用于存放地址值，并且是内存对齐的。

`ss_`（其实是`ss_family`）是`sa_family_t`类型（介绍`sockaddr`有提到），即`unsigned short int`类型，2字节。

`__ss_align`是`__ss_aligntype`类型，即`unsigned long int`类型，4字节

`__ss_padding`是`char`类型数组，大小为`_SS_PADSIZE`，而`_SS_PADSIZE=_SS_SIZE - __SOCKADDR_COMMON_SIZE - sizeof (__ss_aligntype)=128-2-4=122`字节，完全足够保存地址值。

综上`sockaddr_storage`是128字节大小，保证了内存对齐。

#### 专用socket地址

上面两种通用的socket地址使用起来显然不够方便，因为将IP地址和端口等信息直接放在同一个`char`数组中，那要得到IP地址和端口信息都得费好大劲进行操作。因此，Linux为各个协议族提供了专门的socket地址结构体。

UNIX本地协议族使用`sockaddr_un`，数据结构很简单，只有一个保存地址族类型的`sun_`（其实是`sun_family`）和保存文件位置的`sun_path`。

```c
#include <sys/un.h>
/* Structure describing the address of an AF_LOCAL (aka AF_UNIX) socket.  */
struct sockaddr_un
  {
    __SOCKADDR_COMMON (sun_);
    char sun_path[108];		/* Path name.  */
  };
```

IPv4协议族使用`sockaddr_in`

```c
#include <netinet/in.h>
/* Structure describing an Internet socket address.  */
struct sockaddr_in
  {
    __SOCKADDR_COMMON (sin_);
    in_port_t sin_port;			/* Port number.  */
    struct in_addr sin_addr;		/* Internet address.  */

    /* Pad to size of `struct sockaddr'.  */
    unsigned char sin_zero[sizeof (struct sockaddr)
			   - __SOCKADDR_COMMON_SIZE
			   - sizeof (in_port_t)
			   - sizeof (struct in_addr)];
  };
```

其中`in_port_t`定义、`in_addr_t`结构如下

```c
#include <netinet/in.h>
/* Type to represent a port.  */
typedef uint16_t in_port_t;

/* Internet address.  */
typedef uint32_t in_addr_t;
struct in_addr
  {
    in_addr_t s_addr;
  };
```

![image-20220811143542024](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811143542024.png)

![image-20220811143600470](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811143600470.png)

![image-20220811143622907](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811143622907.png)

可以看的出来`sin_`（其实是`sin_family`）存放地址族类型，`sin_port`存放端口，`sin_addr`存放地址。`sin_zero`为了让`sockaddr_in`大小和`sockaddr	`相同，为什么有这个成员，个人感觉这是因为所以**专用socket**在实际使用中都需要转化为**通用socket地址类型**`socketaddr`，因为socket编程接口使用的是参数类型是`socketaddr`。

IPv6协议族使用`sockaddr_in6`

```c
#include <netinet/in.h>
/* Ditto, for IPv6.  */
struct sockaddr_in6
  {
    __SOCKADDR_COMMON (sin6_);
    in_port_t sin6_port;	/* Transport layer port # */
    uint32_t sin6_flowinfo;	/* IPv6 flow information */
    struct in6_addr sin6_addr;	/* IPv6 address */
    uint32_t sin6_scope_id;	/* IPv6 scope-id */
  };
```

其中`in6_addr`如下，因为IPv6不是学习重点，这里就不过多展开介绍。

```c
/* IPv6 address */
struct in6_addr
  {
    union
      {
	uint8_t	__u6_addr8[16];
	uint16_t __u6_addr16[8];
	uint32_t __u6_addr32[4];
      } __in6_u;
#define s6_addr			__in6_u.__u6_addr8
#ifdef __USE_MISC
# define s6_addr16		__in6_u.__u6_addr16
# define s6_addr32		__in6_u.__u6_addr32
#endif
  };
```

除此之外需要注意：所有**专用socket地址**（以及`sockaddr_storage`）类型的变量在实际使用时都需要转化为**通用socket地址**类型`sockaddr`（强制转换即可)，因为所有socket编程接口使用的地址参数的类型都是sockaddr。

### IP地址转化函数

通常来说，人们更喜欢用点分十进制的字符串来表示IPv4地址，但是在编程的过程中，我们需要把这个字符串转化为整数才能使用，但是输出的时候我们又需要把整数转化成点分十进制的字符串，这样方便观察。所以系统提供了3个函数用于点分十进制的字符串IPv4地址和整数的IPv4地址之间的转化。

```c
#include <arpa/inet.h>

/* Convert Internet host address from numbers-and-dots notation in CP
   into binary data in network byte order.  */
extern in_addr_t inet_addr (const char *__cp) __THROW;

/* Convert Internet host address from numbers-and-dots notation in CP
   into binary data and store the result in the structure INP.  */
extern int inet_aton (const char *__cp, struct in_addr *__inp) __THROW;

/* Convert Internet number in IN to ASCII representation.  The return value
   is a pointer to an internal array containing the string.  */
extern char *inet_ntoa (struct in_addr __in) __THROW;

```

`inet_addr`函数将用点分十进制字符串表示的IPv4地址转化为用网络字节序整数表示的IPv4地址。它失败时返回 `INADDR_NONE`。

```c++
#include <arpa/inet.h>
#include <cstdio>

int main(int argc, char const *argv[])
{

    in_addr_t ip = inet_addr("192.168.167.14");
    if (ip == INADDR_NONE)
        printf("ip error\n");
    else
        printf("ip convert by inet_addr %u \n", ip);
    return 0;
}
```

![image-20220811170759741](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811170759741.png)

`inet_aton`功能和`inet_addr`相同，但是将结果存在在`in_addr_t`指向的地址结构当中，函数成功返回1，失败返回0。

```c++
#include <arpa/inet.h>
#include <cstdio>

int main(int argc, char const *argv[])
{
    struct in_addr ip;
    int ret = inet_aton("192.168.167.14", &ip);
    if (0 == ret)
        printf("ip error\n");
    else
        printf("ip convert by inet_aton %u \n", ip.s_addr);
    return 0;
}
```

![image-20220811171444397](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811171444397.png)

`inet_ntoa`函数将整数的IPv4地址转化为点分十进制字符串的IPv4。成功时返回转换的字符串地址值，失败时返回-1。

```c++
#include <arpa/inet.h>
#include <cstdio>

int main(int argc, char const *argv[])
{
    struct in_addr ip;
    
    int ret = inet_aton("192.168.167.14", &ip);
    if (0 == ret)
        printf("ip error\n");
    else
        printf("ip convert by inet_aton %u \n", ip.s_addr);

    char *ip_str = inet_ntoa(ip);
    printf("address :%s \n", ip_str);
    return 0;
}
```

![image-20220811173503409](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811173503409.png)

需要注意的是`inet_ntoa`函数内部使用一个静态变量存储转化的结果，函数的返回值指向该静态内存，因此`inet_ntoa`是不可重入的，这一点需要多注意。

```c++
#include <arpa/inet.h>
#include <cstdio>

int main(int argc, char const *argv[])
{
    struct in_addr ip;
    
    inet_aton("192.168.167.14", &ip);
    char *ip_str1 = inet_ntoa(ip);

    inet_aton("192.168.167.15", &ip);
    char *ip_str2 = inet_ntoa(ip);
    
    printf("address :%s \n", ip_str1);
    printf("address :%s \n", ip_str2);
    return 0;
}
```

![image-20220811180430697](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811180430697.png)

除此之外，下面两个函数也能完成前三个函数的功能

```c++
#include <arpa/inet.h>
/* Convert from presentation format of an Internet number in buffer
   starting at CP to the binary network format and store result for
   interface type AF in buffer starting at BUF.  */
extern int inet_pton (int __af, const char *__restrict __cp,
		      void *__restrict __buf) __THROW;

/* Convert a Internet address in binary network format for interface
   type AF in buffer starting at CP to presentation form and place
   result in buffer of length LEN astarting at BUF.  */
extern const char *inet_ntop (int __af, const void *__restrict __cp,
			      char *__restrict __buf, socklen_t __len)
     __THROW;
```

`inet_pton`函数将用字符串表示的P地址`__cp`（用点分十进制字符串表示的IPv4地址或用十六进制字符串表示的IPv6地址）转换成用网络字节序整数表示的IP地址，并把转换结果存储于`__buf`指向的内存中。其中，`__af`参数指定地址族，可以是`AF_INET`或者`AF_INET6`。`inet_pton`成功时返回1，失败则返回0并设置`errno`。

`__restrict`emmm目前找不到定义，但是看了下`restrict`关键字，是指告诉编译器传入的两个指针不指向同一数据，方便进行优化用来提升性能。

```c++
#include <arpa/inet.h>
#include <cstdio>
#include <errno.h>

int main(int argc, char const *argv[])
{
    char ip_str[] = "192.168.167.42";
    in_addr_t ip;
    int ret = inet_pton(AF_INET, ip_str, &ip);
    if (0 == ret)
        perror("ip error\n");
    else
        printf("ip convert by inet_pton %u \n", ip);

    struct in_addr in_ip;
    ret = inet_pton(AF_INET, ip_str, &in_ip);
    if (0 == ret)
        perror("ip error\n");
    else
        printf("ip convert by inet_pton %u \n", in_ip.s_addr);

    return 0;
}
```

![image-20220811183002035](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811183002035.png)

`inet_ntop`函数进行相反的转换，前三个参数的含义与`inet_pton`的参数相同，最后一个参数 `__len`指定目标存储单元的大小。下面的两个宏能帮助我们指定这个大小(分别用于IPv4和IPv6):

```c
#include <netinet/in.h>	
#define INET_ADDRSTRLEN 16
#define INET6_ADDRSTRLEN 46
```

`inet_ntop`成功时返回目标存储单元的地址，失败则返回NULL并设置errno。

```c++
#include <arpa/inet.h>
#include <cstdio>
#include <errno.h>

int main(int argc, char const *argv[])
{
    char ip_str[] = "192.168.167.42";

    struct in_addr in_ip;
    int ret = inet_pton(AF_INET, ip_str, &in_ip);
    if (0 == ret)
        perror("ip error\n");
    else
        printf("ip convert by inet_pton %u \n", in_ip.s_addr);

    char ip_str2[1024];

    const char *ip_str3 = inet_ntop(AF_INET, &in_ip, ip_str2, sizeof(ip_str2));

    if (ip_str3 == NULL)
        perror("ip error \n");
    else
    {
        printf("address :%s \n", ip_str2);
        printf("address :%s \n", ip_str3);
    }

    return 0;
}
```

![image-20220811220718920](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811220718920.png)

值得注意的是`ip_str2`和`ip_str3`的地址相同，也就是说传入参数和返回值相同，虽然不知道为啥这样设计。

![image-20220811221357471](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220811221357471.png)

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

## 数据读写

### TCP数据读写

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

![image-20220812171929139](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220812171929139.png)

### UDP数据读写

```c
#include <sys/types.h>
#include <sys/socket.h>

ssize_t recvfrom(int sockfd, void *buf, size_t len, int flags, struct sockaddr *src_addr, socklen_t *addrlen);
ssize_t sendto(int sockfd, const void *buf, size_t len, int flags, const struct sockaddr *dest_addr, socklen_t addrlen);
```

针对UDP系统提供的是读写函数是`recvfrom`和`sendto`，其中函数`recvfrom`和`sendto`前4个参数和`recv`、`send`意义相同，最后两个是发送端/接收端的地址。因为UDP是没有连接的概念，所以调用这两个函数的时候都要指定地址。`recvfrom`和`sendto`的返回值和`recv`、`send`也相同，所以不用过多介绍。

除此之外，`recvfrom`和`sendto`也可以用于TCP使用，只需要把最后两个参数设置为NULL即可。

### 通用数据读写函数

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

![image-20220813123219330](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220813123219330.png)

需要注意的是`recvmsg`只有在前面的buffer使用完之后，才会使用后面的buffer。这也是为啥把`buffer1`的大小设置为6。

## 地址信息函数

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

## socket选项

读取和设置socket文件描述的方法如下

```c
#include <sys/types.h>          /* See NOTES */
#include <sys/socket.h>

int getsockopt(int sockfd, int level, int optname, void *optval, socklen_t *optlen);
int setsockopt(int sockfd, int level, int optname, const void *optval, socklen_t optlen);
```

`sockfd`参数指定被操纵的目标socket，`level`参数指定要操作的协议选项，`optname`参数则指定选项的名字，`optval`和`optlen`参数分别是操作选项的值和长度。截图了一下书中的表格。

![socket选项](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/socket选项.png)

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

![image-20220813180440008](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220813180440008.png)

emmm不知道为啥大小是这样，后续再看看。

## 网络信息API

socket当中两要素：IP和端口号，都是用数值表示的。但是有时候我们可以使用主机名代替IP，使用服务名代替端口号。

```sh
telnet 127.0.0.1 80
telnet localhost www
```

这个功能就是使用网络信息API实现的。

### gethostbyname和gethostbyaddr

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

![img](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/Center.png)

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

![image-20220814105118617](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220814105118617.png)

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

![image-20220814105222471](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220814105222471.png)

### getservbyname和getservbyport

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

![image-20220814141312451](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220814141312451.png)

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

![image-20220814142922859](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220814142922859.png)

需要指出的是，上面讨论的4个函数都是不可重入的，即非线程安全的。不过`netdb.h`头文件给出了它们的可重入版本。正如Linux下所有其他函数的可重入版本的命名规则那样，这些函数的函数名是在原函数名尾部加上_`r (re-entrant)`。

### getaddrinfo

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

![image-20220814160248251](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220814160248251.png)

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

![image-20220814165923059](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220814165923059.png)

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

![image-20220814170106763](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220814170106763.png)

不过不知道为啥别名为null

### getnameinfo

`getnameinfo`函数能通过socket地址同时获得以字符串表示的**主机名**（内部使用的是`gethostbyaddr`函数）和**服务名**（内部使用的是`getservbyport`函数)。它是否可重入取决于其内部调用的gethostbyaddr和 getservbyport函数是否是它们的可重入版本。该函数的定义如下:

```c
#include <sys/socket.h>
#include <netdb.h>

int getnameinfo(const struct sockaddr *addr, socklen_t addrlen,char *host, socklen_t hostlen,
                char *serv, socklen_t servlen, int flags);
```

`getnameinfo`将返回的主机名存储在host参数指向的缓存中，将服务名存储在serv参数指向的缓存中，`hostlen`和 `servlen`参数分别指定这两块缓存的长度。flags参数控制`getnameinfo`的行为，它可以接收下表中的选项。

![image-20220814171842523](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220814171842523.png)

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

![image-20220814181037933](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220814181037933.png)