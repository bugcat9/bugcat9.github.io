---
title: Linux中socket地址API
date: 2022-08-11 22:27:33
tags:
- 计算机网络
- Linux
- Linux网络编程
- Linux高性能服务器编程
categories:
- Linux网络编程
---

# Linux中socket地址API

学习《Linux高性能服务器编程》第五章Linux网络编程基础API，为了印象深刻一些，多动手多实践，所以记下这个笔记。这一篇主要记录Linux中socket地址的基础，包括主机字节序和网络字节序、socket地址和IP地址转化函数。

<!--more-->

## 主机字节序和网络字节序

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

![image-20220809181538872](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220809181538872.png)

这段代码使用的原理是**union变量所占用的内存长度等于最长的成员的内存长度。**

所以`test`中`value`和`union_bytes`是共用一段内存的。因为在c中`short`是16位也就是2字节，`char`是8位也就是1字节，所以`union_bytes`数组的大小是2。

我们给`value`赋值为`0x0102`。如果是机器是大端存储，那么`union_bytes`数组第一个元素存储`0x01`，第二个元素存储`0x02`，如果是机器是小端存储，那么`union_bytes`数组第一个元素存储`0x02`，第二个元素存储`0x01`

![image-20220809185922374](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220809185922374.png)

扩展到32位，四字节来说以`0x12345678`为例，那么

**大端字节序**：0x12345678

**小端字节序**：0x78563412

总结来说就是大端字节序和小端字节序的区别就是以**字节**为单位的存储方式不同。

在网络中两台使用不同字节序的主机之间直接传递时，接收端必然会造成错误。书中说解决的方法是发送端总是把要发送的数据转化成大端字节序数据再发送，接受端知道传送过来的数据总是采用大端字节序，所以接收端根据自身采用的字节序再对数据进行一定的处理（小端进行转换，大端就不转换）。

Linux提供了4个函数来完成主机字节序和网络字节序之间的转换:

![image-20220810153657086](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220810153657086.png)

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

![image-20220810181643405](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220810181643405.png)

`513`二进制：`0000 0010 0000 0001`

`258`二进制：`0000 0001 0000 0010`

可以看出两者字节序是不同的

## socket地址

### 通用socket地址

#### sockaddr

socket网络接口中表示socket地址的是结构体`sockaddr`，他的定义在头` <bits/socket.h>`中，我看在我的电脑上看到的是如下的定义（各个版本不同，可能实现不同，我这里和书上就不大相同）：

![image-20220810185029006](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220810185029006.png)

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

![image-20220810185204703](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220810185204703.png)

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

![image-20220811094342093](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811094342093.png)

![image-20220811094510529](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811094510529.png)

`sa_data`成员用于存放socket地址值。不同的协议族的地址值有不同的含义和长度。

|  协议族  |                       地址值含义和长度                       |
| :------: | :----------------------------------------------------------: |
| PF_UNIX  |                文件的路径名，长度可达108字节                 |
| PF_INET  |             16bit端口号和32bit IPv4地址，共6字节             |
| PF_INET6 | 16bit端口号，32bit流标识，128bit IPv6地址，32bit范围ID，共26字节 |

#### sockaddr_storage

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

![image-20220811135111456](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811135111456.png)

![image-20220811135134566](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811135134566.png)

这个结构体提供了足够大的空间用于存放地址值，并且是内存对齐的。

`ss_`（其实是`ss_family`）是`sa_family_t`类型（介绍`sockaddr`有提到），即`unsigned short int`类型，2字节。

`__ss_align`是`__ss_aligntype`类型，即`unsigned long int`类型，4字节

`__ss_padding`是`char`类型数组，大小为`_SS_PADSIZE`，而`_SS_PADSIZE=_SS_SIZE - __SOCKADDR_COMMON_SIZE - sizeof (__ss_aligntype)=128-2-4=122`字节，完全足够保存地址值。

综上`sockaddr_storage`是128字节大小，保证了内存对齐。

### 专用socket地址

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

![image-20220811143542024](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811143542024.png)

![image-20220811143600470](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811143600470.png)

![image-20220811143622907](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811143622907.png)

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

## IP地址转化函数

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

![image-20220811170759741](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811170759741.png)

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

![image-20220811171444397](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811171444397.png)

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

![image-20220811173503409](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811173503409.png)

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

![image-20220811180430697](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811180430697.png)

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

![image-20220811183002035](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811183002035.png)

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

![image-20220811220718920](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811220718920.png)

值得注意的是`ip_str2`和`ip_str3`的地址相同，也就是说传入参数和返回值相同，虽然不知道为啥这样设计。

![image-20220811221357471](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220811221357471.png)