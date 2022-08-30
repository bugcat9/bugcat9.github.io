---
title: Linux定时器
date: 2022-08-29 18:59:46
tags:
- Linux
- Linux高性能服务器编程
categories:
- Linux
---

# Linux定时器

学习《Linux高性能服务器编程》第十一章定时器，里面介绍了各种网络程序中的定时事件，为了印象深刻一些，多动手多实践，所以记下这个笔记。这一篇主要记录Linux中SIGALRM信号触发的定时器。

<!--more-->

## SIGALRM信号

由于`alarm`和`setitimer`函数设置的实时闹钟一旦超时，将触发`SIGALRM`信号。因此，我们可以利用该信号的信号处理函数来处理定时任务。但是，如果要处理多个定时任务，我们就需要不断地触发`SIGALRM`信号，并在其信号处理函数中执行到期的任务。

一般而言，`SIGALRM`信号按照固定的频率生成，即由`alarm`或`setitimer`函数设置的定时周期`T`保持不变。如果某个定时任务的超时时间不是`T`的整数倍，那么它实际被执行的时间和预期的时间将略有偏差。因此定时周期`T`反映了定时的精度。

### alarm函数

```c
#include <unistd.h>

unsigned int alarm(unsigned int seconds);
```

`alarm`定时发送 `SIGALRM `给当前进程（需要注意的是`alarm`调用只会引起一次调用）。

`seconds`参数表示经过`seconds`秒数后发送`SIGALRM `给目前的进程

`alarm`返回上次定时剩余时间。

如果设置`alarm(0)`则表示取消闹钟

我们举个小例子，结合前面的信号一起写下

```c
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>

void sig_alarm(int a)
{
    printf("hello world\n");
}

int main(int argc, char *argv[])
{
    int i;
    alarm(3);                   // 3秒后发送信号
    signal(SIGALRM, sig_alarm); //设置信号对应的处理函数
    while (true)
    {
        printf("------------------\n");
        sleep(1);
    }

    return 0;
}
```

![image-20220829204127701](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220829204127701.png)

### setitimer函数

`setitimer`相比`alarm`，提供了更为精细的参数选择

```c
#include <sys/time.h>

int getitimer(int which, struct itimerval *curr_value);
int setitimer(int which, const struct itimerval *new_value, struct itimerval *old_value);
```

`which`指计时器采用那种类型的计时方法

| 类型             | 介绍                                                         |
| ---------------- | ------------------------------------------------------------ |
| `ITIMER_REAL`    | 以系统真实的时间来计算，它送出`SIGALRM`信号。                |
| `ITIMER_VIRTUAL` | 以该进程用户空间下花费的时间来计算，它送出`SIGVTALRM`信号。  |
| `ITIMER_PROF`    | 以该进程在用户空间下和内核下所费的时间来计算，它送出`SIGPROF`信号。 |

`new_value`和`old_value`都是`itimerval`类型的结构体

```c
struct itimerval {
   struct timeval it_interval; /* Interval for periodic timer */
   struct timeval it_value;    /* Time until next expiration */
};

struct timeval {
   time_t      tv_sec;         /* seconds */
   suseconds_t tv_usec;        /* microseconds */
};
```

`timeval`结构体中成员很简单，`tv_sec`设置秒，`tv_usec`设置微妙。

`itimerval`结构体中成员`it_interval`为计时间隔，`it_value`为延时时长。比如：我想3s后，以每次5s的时间间隔打印hello world，那么就需要设置`it_value`为3s，设置`it_interval`为5s（3s后第一次打印，此后每次以5s为间隔打印）。

其中的`new_value`参数用来对计时器进行设置。

`old_value`参数，通常用不上，设置为NULL，它是用来存储上一次`setitimer`调用时设置的new_value值。

函数调用成功返回0，失败返回-1，并且设置`errno`。

**假如it_value为0是不会触发信号的，所以要能触发信号，it_value得大于0；如果it_interval为0，只会延时，不会定时（也就是说只会触发一次信号)。**

下面就写一个延时3s后，以5s为间隔打印hello world

```c
#include <stdio.h>
#include <sys/time.h>
#include <signal.h>
#include <unistd.h>

void sig_alarm(int signo)
{
    printf("hello world\n");
}

int main(int argc, char *argv[])
{
    struct itimerval it, oldit;

    signal(SIGALRM, sig_alarm); //注册SIGALRM信号的捕捉处理函数。

    it.it_value.tv_sec = 3; //设置延时3s
    it.it_value.tv_usec = 0;

    it.it_interval.tv_sec = 5; //设置时间间隔5s
    it.it_interval.tv_usec = 0;

    if (setitimer(ITIMER_REAL, &it, &oldit) == -1)
    {
        perror("setitimer error");
        return -1;
    }

    while (1)
    {
        printf("------------------\n");
        sleep(1);
    };

    return 0;
}
```

![image-20220829212215274](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220829212215274.png)

## socket选项SO_RCVTIMEO和SO_SNDTIMEO

`socket`选项`SO_RCVTIMEO`和`SO_SNDTIMEO`，它们分别用来设置`socket `接收数据超时时间和发送数据超时时间。因此，这两个选项仅对与数据接收和发送相关的`socket`专用系统调用( socket专用的系统调用指的是5.2～5.11节介绍的那些socketAPI)有效，这些系统调用包括`send`、`sendmsg`、`recv`、`recvmsg`、`accept`和 `connect`。将选项SO_RCVTIMEO和SO_SNDTIMEO对这些系统调用的影响总结于表中（来源Linux高性能服务器编程）。

![image-20220830110132529](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220830110132529.png)

这里举书上的代码例子，比较简单 明了

```c
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdlib.h>
#include <assert.h>
#include <stdio.h>
#include <errno.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

int timeout_connect(const char *ip, int port, int time)
{
    int ret = 0;
    struct sockaddr_in address;
    bzero(&address, sizeof(address));
    address.sin_family = AF_INET;
    inet_pton(AF_INET, ip, &address.sin_addr);
    address.sin_port = htons(port);

    int sockfd = socket(PF_INET, SOCK_STREAM, 0);
    assert(sockfd >= 0);

    struct timeval timeout;
    timeout.tv_sec = time;
    timeout.tv_usec = 0;
    socklen_t len = sizeof(timeout);
    ret = setsockopt(sockfd, SOL_SOCKET, SO_SNDTIMEO, &timeout, len);
    assert(ret != -1);

    ret = connect(sockfd, (struct sockaddr *)&address, sizeof(address));
    if (ret == -1)
    {
        if (errno == EINPROGRESS)
        {
            printf("connecting timeout\n");
            return -1;
        }
        printf("error occur when connecting to server\n");
        return -1;
    }

    return sockfd;
}

int main(int argc, char *argv[])
{
    if (argc <= 2)
    {
        printf("usage: %s ip_address port_number\n", basename(argv[0]));
        return 1;
    }
    const char *ip = argv[1];
    int port = atoi(argv[2]);

    int sockfd = timeout_connect(ip, port, 10);
    if (sockfd < 0)
    {
        return 1;
    }
    return 0;
}
```

