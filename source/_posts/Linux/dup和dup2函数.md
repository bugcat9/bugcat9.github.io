---
title: dup和dup2函数
date: 2022-08-19 15:11:39
tags:
- Linux
- Linux高性能服务器编程
categories:
- Linux
---

# dup和dup2函数

`dup`和`dup2`用于复制文件描述符，通常用于重定向。

```c
#include <unistd.h>

int dup(int oldfd);
int dup2(int oldfd, int newfd);
```

`dup`函数创建一个新的文件描述符，该新文件描述符和原有文件描述符`oldfd`指向相同的文件、管道或者网络连接。并且dup返回的文件描述符总是取系统当前可用的最小整数值。

`dup2`和`dup`类似，不过它将返回第一个不小于`newfd`的整数值的文件描述符，并且`newfd`这个文件描述符也将会指向`oldfd`指向的文件，原来的`newfd`指向的文件将会被关闭（除非`newfd`和`oldfd`相同）。

`dup`和`dup2`系统调用失败时返回-1并设置`errno`，成功就返回新的文件描述符。

**注意：**通过dup和dup2创建的文件描述符并**不继承原文件描述符的属性**，比如close-on-exec和non-blocking 等

<!--more-->

`dup`简单，输入`oldfd`直接返回复制的文件描述符

```c
#include <unistd.h>
#include <stdio.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <assert.h>
int main(int argc, char const *argv[])
{
    int fd = open("text.txt", O_RDWR | O_CREAT, 0666);
    assert(fd != -1);
    printf("fd = %d\n", fd);

    int fd2 = dup(fd);
    printf("fd2 = %d\n", fd2);

    char str[] = "hello ";
    write(fd, str, sizeof(str));
    char str2[] = "world\n";
    write(fd2, str2, sizeof(str2));

    close(fd);
    close(fd2);
    return 0;
}
```

![image-20220815171158327](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220815171158327.png)

`dup2`感觉复杂一些，其实`dup2`忽略第二个参数，功能是和`dup`一样的，除此之外`dup2`加了一个将返回第一个不小于`newfd`的整数值的文件描述符的功能，并且`newfd`也将指向`oldfd`指向的文件。

下面的代码调用`dup2`，文件描述符fd2原来指向"text2.txt"文件的，调用`dup2`后，fd2改为指向"text.txt"。

![image-20220815173243219](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220815173243219.png)

```c
#include <unistd.h>
#include <stdio.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <assert.h>
int main(int argc, char const *argv[])
{
    int fd1 = open("text.txt", O_RDWR | O_CREAT, 0666);
    int fd2 = open("text2.txt", O_RDWR | O_CREAT, 0666);

    assert(fd1 != -1);
    assert(fd2 != -1);
    printf("fd1 = %d, fd2 = %d\n", fd1, fd2);

    int fd3 = dup2(fd1, fd2);
    printf("fd1 = %d,fd2 = %d,fd3 = %d\n", fd1, fd2, fd3);

    char str[] = "hello ";
    write(fd1, str, sizeof(str));
    char str2[] = "world\n";
    write(fd2, str2, sizeof(str2));
    char str2[] = " hello world\n";
    write(fd3, str2, sizeof(str2));

    close(fd1);
    close(fd2);
    close(fd3);

    return 0;
}
```

![image-20220815173321291](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220815173321291.png)

