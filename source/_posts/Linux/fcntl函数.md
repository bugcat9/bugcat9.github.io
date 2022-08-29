---
title: fcntl函数
date: 2022-08-19 15:26:23
tags:
- Linux
- Linux高性能服务器编程
categories:
- Linux
---

#  fcntl函数

`fcntl`函数提供了对文件描述符的各种控制操作。

```c
#include <unistd.h>
#include <fcntl.h>

int fcntl(int fd, int cmd, ... /* arg */ );
```

`fd`参数是被操作的文件描述符，`cmd`参数指定执行何种类型的操作。根据操作类型的不同，该函数可能还需要第三个可选参数 `arg`。`fcntl`函数支持的常用操作及其参数如下表所示。

<!--more-->

![image-20220816114524640](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220816114524640.png)

`fcntl`函数成功时的返回值如表中最后一列所示，失败则返回-1并设置`errno`。

在网络编程中，`fcntl`函数通常用来将一个文件描述符设置为非阻塞的。

比如：终端文件默认是阻塞读的，这里用 fcntl 将其更改为非阻塞读

```c
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MSG_TRY "try again\n"

int main(void)
{
    char buf[10];
    int flags, n;

    flags = fcntl(STDIN_FILENO, F_GETFL); //获取stdin属性信息
    if (flags == -1)
    {
        perror("fcntl error");
        exit(1);
    }
    flags |= O_NONBLOCK;
    int ret = fcntl(STDIN_FILENO, F_SETFL, flags);
    if (ret == -1)
    {
        perror("fcntl error");
        exit(1);
    }

    while (true)
    {
        n = read(STDIN_FILENO, buf, 10);
        if (n < 0)
        {
            if (errno != EAGAIN)
            {
                perror("read /dev/tty");
                exit(1);
            }
            sleep(3);
            write(STDOUT_FILENO, MSG_TRY, strlen(MSG_TRY));
            continue;
        }
        write(STDOUT_FILENO, buf, n);
    }

    return 0;
}
```

![image-20220816115555375](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220816115555375.png)