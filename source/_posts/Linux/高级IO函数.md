---

title: 高级I/O函数
date: 2022-08-15 09:50:54
tags:
- Linux
- Linux高性能服务器编程
categories:
- Linux
---

# 高级I/O函数

《Linux高性能服务器编程》在第六章讲解了很多Linux提供了很多高级I/O函数，在这里做个笔记。这一章主要内容包括：pipe函数、`dup`和`dup2`函数、readv函数和writev函数、sendfile函数、mmap函数和munmap函数、splice函数、tee函数和fcntl函数。

<!--more-->

## 管道

### pipe函数

`pipe`函数可用于创建一个管道（匿名），以实现进程之间的通讯（主要感觉是父子进程之间）。

```c
#include <unistd.h>
int pipe(int pipefd[2]);
```

`pipefd`是传出参数，它包含两个文件描述符。我们就是使用这两个文件描述符进行进程之间的通讯。

`pipe`函数调用成功返回0，如果失败返回-1，并且设置`errno`。

`pipe`函数创建的管道是单向通讯，其中`pipefd[0]`只能读，`pipefd[1]`只能写。并且默认情况下，这一对文件描述符都是阻塞的，但是也可以进行修改，变成非阻塞的。

`pipe`函数创建的管道内部传输的数据是字节流，管道本身有一个**容量限制**，最多能写下`65536`个字节，但是这个大小可以使用`fcntl`进行修改。

如果管道的写端文件描述符`pipefd[1]`的**引用计数**减少至0，即没有任何进程需要往管道中写人数据，则针对该管道的读端文件描述符 `pipefd[0]`的`read`操作将返回0，即读取到了文件结束标记（End Of File，EOF);反之，如果管道的读端文件描述符`pipefd[0]`的引用计数减少至0，即没有任何进程需要从管道读取数据，则针对该管道的写端文件描述符`pipefd[1]`的`write`操作将失败，并引发`SIGPIPE `信号。

```c
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <sys/wait.h>

void sys_err(const char *str)
{
    perror(str);
    exit(1);
}

int main(int argc, char const *argv[])
{

    pid_t pid;
    char buf[1024];
    int fd[2];
    char *p = "test for pipe\n";

    if (pipe(fd) == -1)
        sys_err("pipe");

    pid = fork();
    if (pid < 0)
    {
        sys_err("fork err");
    }
    else if (pid == 0)
    {
        // 子进程
        // 关闭写端
        close(fd[1]);
        // 从管道的文件描述符fd[0]中将信息读出
        int len = read(fd[0], buf, sizeof(buf));
        // 将读的信息写到STDOUT_FILENO上
        write(STDOUT_FILENO, buf, len);
        close(fd[0]);
    }
    else
    {
        // 父进程
        // 关闭读端
        close(fd[0]);
        // 向管道的文件描述符fd[1]中写入
        write(fd[1], p, strlen(p));
        // 回收子进程
        wait(NULL);
        close(fd[1]);
    }
    return 0;
}
```

![image-20220905111959054](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220905111959054.png)

### socketpair函数

`socketpair`函数能创建双向管道（一对套接字），并且似乎只能用于本地通讯。

```c
#include <sys/types.h>          /* See NOTES */
#include <sys/socket.h>

int socketpair(int domain, int type, int protocol, int sv[2]);
```

`socketpair`前三个参数和`socket`一样。

`domain`是协议族类型，但是因为是本地通讯所以只能是`AF_UNIX`

`type`参数指定服务类型。服务类型主要有`SOCK_STREAM`服务（流服务）和`SOCK_UGRAM`（数据报）服务。

`protocol`参数设置具体的协议。但是在前两个参数确定的情况下，这个参数的值基本上唯一的，所有几乎在所有情况下，我们都把这个值设置为0，表示使用默认协议。

`sv[2]`则是传出参数，和上面的`pipe`相同，里面包含着两个通讯用的文件描述符，只不过这两个文件描述符是既可以读又可以写的。

`socketpair`函数调用成功返回0，如果失败返回-1，并且设置`errno`。

`socketpair`用法比较简单，和上面`pipe`有一些类似

```c
#include <sys/types.h> /* See NOTES */
#include <sys/socket.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>
#include <string.h>

void sys_err(const char *str)
{
    perror(str);
    exit(1);
}

int main(int argc, char const *argv[])
{
    pid_t pid;
    int fd[2];
    char buf[1024];
    if (socketpair(AF_UNIX, SOCK_STREAM, 0, fd))
        sys_err("socketpair error");

    pid = fork();
    if (pid < 0)
    {
        sys_err("fork err");
    }
    else if (pid == 0)
    {
        // 子进程
        // 关闭写端
        // 从管道的文件描述符fd[0]中将信息读出
        int len = read(fd[0], buf, sizeof(buf));
        // 将读的信息写到STDOUT_FILENO上
        write(STDOUT_FILENO, buf, len);
        char *p = "child test for socketpair\n";
        write(fd[0], p, strlen(p));
    }
    else
    {
        // 父进程
        char *p = "parent test for socketpair\n";
        // 向管道的文件描述符fd[1]中写入
        write(fd[1], p, strlen(p));
        int len = read(fd[1], buf, sizeof(buf));
        // 将读的信息写到STDOUT_FILENO上
        write(STDOUT_FILENO, buf, len);
        // 回收子进程

        wait(NULL);
        close(fd[0]);
        close(fd[1]);
    }

    return 0;
}
```

![image-20220905204624841](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220905204624841.png)

### mkfifo函数

```c
#include <sys/types.h>
#include <sys/stat.h>

int mkfifo(const char *pathname, mode_t mode);
```

`mkfifo`会创建一个`fifo`类型的文件，然后两个进程可任意通过`open`的方式打开这个文件进行进程间的通讯。

`pathname`表示文件名，`mode`指定了文件的读写权限。

函数成功调用返回0失败返回-1，并且设置`errno`。

下面的代码就是创建一个名为mytestfifo的fifo文件

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <errno.h>
#include <pthread.h>

void sys_err(const char *str)
{
    perror(str);
    exit(1);
}

int main(int argc, char *argv[])
{
    int ret = mkfifo("mytestfifo", 0664);
    if (ret == -1)
        sys_err("mkfifo error");

    return 0;
}
```

可以看到这个文件类型前面有个`p`

![image-20220905211906735](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220905211906735.png)

管道文件读取或者写入和普通文件相同，我们都可以使用`open`对其进行操作但是需要的是注意两点：

1.程序**不能以O_RDWR模式打开FIFO文件进行读写操作**，而其行为也未明确定义，因为如一个管道以读/写方式打开，进程就会读回自己的输出，同时我们通常使用FIFO只是为了单向的数据传递。

2.打开FIFO文件通常有四种方式，

```c
open(const char *pathname, O_RDONLY); // 1
open(const char *pathname, O_RDONLY | O_NONBLOCK); // 2
open(const char *pathname, O_WRONLY); // 3
open(const char *pathname, O_WRONLY | O_NONBLOCK); // 4
```

`O_NONBLOCK`表示阻塞。所以

* `O_RDONLY`：open将会调用阻塞，除非有另外一个进程以写的方式打开同一个FIFO，否则一直等待。
* `O_WRONLY`：open将会调用阻塞，除非有另外一个进程以读的方式打开同一个FIFO，否则一直等待。
* `O_RDONLY|O_NONBLOCK`：如果此时没有其他进程以写的方式打开FIFO，此时open也会成功返回，此时FIFO被读打开，而不会返回错误。
* `O_WRONLY|O_NONBLOCK`：立即返回，如果此时没有其他进程以读的方式打开，open会失败打开，此时FIFO没有被打开，返回-1。

例子：

fifo_w.cpp：

```c
#include <stdio.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <fcntl.h>
#include <stdlib.h>
#include <cstring>

void sys_err(char const *str)
{
    perror(str);
    exit(-1);
}

int main(int argc, char *argv[])
{
    int fd;
    char buf[4096];

    if (argc < 2)
    {
        printf("Enter like this: ./a.out fifoname\n");
        return -1;
    }
    fd = open(argv[1], O_WRONLY); //打开管道文件

    if (fd < 0)
        sys_err("open fifo error\n");

    for (int i = 0; i < 5; i++)
    {
        sprintf(buf, "hello world %d\n", i);
        write(fd, buf, strlen(buf)); // 向管道写数据
    }

    close(fd);

    return 0;
}

```

fifo_r.cpp:

```c
#include <stdio.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <fcntl.h>
#include <stdlib.h>
#include <string.h>

void sys_err(char const *str)
{
    perror(str);
    exit(1);
}

int main(int argc, char *argv[])
{
    int fd, len;
    char buf[4096];

    if (argc < 2)
    {
        printf("./a.out fifoname\n");
        return -1;
    }
    // int fd = mkfifo("testfifo", 644);
    // open(fd, ...);
    fd = open(argv[1], O_RDONLY); // 打开管道文件
    if (fd < 0)
        sys_err("open");
    while (1)
    {
        len = read(fd, buf, sizeof(buf)); // 从管道的读端获取数据
        write(STDOUT_FILENO, buf, len);
    }
    close(fd);

    return 0;
}
```

![image-20220907093500990](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220907093500990.png)

`FIFO`文件会存在进程之间通讯的问题。比如多个进程对`FIFO`进行写，但是只有一个`FIFO`进行读取时写入的数据块会不会发生交错？

为了解决这个问题，**系统规定：**在一个以`O_WRONLY`（即阻塞方式）打开的`FIFO`中， 如果写入的数据长度小于等待`PIPE_BUF`，那么或者写入全部字节，或者一个字节都不写入。

所以所有的写请求都是发往一个阻塞的FIFO的，并且每个写记请求的数据长度小于等于`PIPE_BUF`字节，系统就可以确保数据决不会交错在一起。

其中`PIPE_BUF`是`FIFO`的长度，它在头文件`limits`.h中被定义。在linux或其他类UNIX系统中，它的值通常是4096字节。

**参考：**

* https://blog.csdn.net/xiajun07061225/article/details/8471777
* https://www.cnblogs.com/52php/p/5840229.html

## dup和dup2函数

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



## readv函数和writev函数

`readv`函数将数据从文件描述符读到分散的内存块中，即分散读; 

`writev`函数则将多块分散的内存数据一并写人文件描述符中，即集中写。它们的定义如下:

```c
#include <sys/uio.h>

ssize_t readv(int fd, const struct iovec *iov, int iovcnt);
ssize_t writev(int fd, const struct iovec *iov, int iovcnt);
```

`fd`被操作的目标文件描述符。

`iov`是`iovec`类型的数组，在`recvmsg`和`sendmsg`中接触过。

`iovcnt`是`iov`数组的长度。

`iovec`结构体封装了一块内存的起始位置和长度。

```c
struct iovec {                    /* Scatter/gather array items */
   void  *iov_base;              /* Starting address */
   size_t iov_len;               /* Number of bytes to transfer */
};
```

`readv`和 `writev`在成功时返回读出/写入`fd`的字节数，失败则返回-1并设置errno。

`readv`和`writev`是个非常有用的函数。比如：当Web服务器解析完一个HTTP请求之后，如果目标文档存在且客户具有读取该文档的权限，那么它就需要发送一个HTTP应答来传输该文档。这个HTTP应答包含1个状态行、多个头部字段、1个空行和文档的内容。其中，前3部分的内容可能被Web服务器放置在一块内存中，而文档的内容则通常被读入到另外一块单独的内存中（通过read函数或mmap函数)。我们并不需要把这两部分内容拼接到一起再发送，而是可以使用writev函数将它们同时写出。

举一个man手册上`writev`函数的例子

```c
#include <sys/uio.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char const *argv[])
{
    char *str0 = "hello ";
    char *str1 = "world\n";
    struct iovec iov[2];
    ssize_t nwritten;

    iov[0].iov_base = str0;
    iov[0].iov_len = strlen(str0);
    iov[1].iov_base = str1;
    iov[1].iov_len = strlen(str1);

    nwritten = writev(STDOUT_FILENO, iov, 2);
    return 0;
}
```

![image-20220815180645424](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220815180645424.png)

## sendfile函数

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

![image-20220815185556863](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220815185556863.png)

## mmap函数和munmap函数

`mmap`函数用于申请一段内存空间。可以将这段内存作为进程间通讯的共享内存，也可以将文件直接映射其中。`munmap`函数用于释放`mmap`创建的内存空间。

```c
#include <sys/mman.h>

void *mmap(void *addr, size_t length, int prot, int flags,int fd, off_t offset);
int munmap(void *addr, size_t length);
```

`addr`参数运行用户使用某个特定的地址作为这段内存的起始地址。如果它被设置为NULL，则系统会自动分配一个地址。

`length`参数指定内存段的长度

`prot`参数用来设置内存段的访问权限，可以下面几个值

* `PROT_EXEC`，内存段可执行

* `PROT_READ`，内存段可读

* `PROT_WRITE`，内存段可写

* `PROT_NONE `，内存段不能被访问

`flags`参数控制内存段内容被修改后程序的行为。它常用的取值如下：

![image-20220815203154208](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220815203154208.png)

`fd`参数是被映射文件对应的文件描述符。它一般通过open系统调用获得。

`offset`参数设置从文件的何处开始映射。

`mmap`函数成功时返回指向目标内存区域的指针，失败则返回`MAP_FAILED((void*)-1)`并设置`errno`。

`munmap`函数成功时返回0，失败则返回-1并设置`errno`。

## splice函数

`splice`用于在两个文件描述符之间移动数据，是零拷贝操作。看了`man`手册，发现这个`splice`函数跟pipe管道关系不浅。

![image-20220816100155851](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220816100155851.png)

```c
#include <fcntl.h>

ssize_t splice(int fd_in, loff_t *off_in, int fd_out, loff_t *off_out, size_t len, unsigned int flags);
```

`fd_in`参数是待输人数据的文件描述符。如果`fd_in`是一个管道文件描述符，那么 `off_in`参数必须被设置为NULL。如果`fd_in`不是一个管道文件描述符（比如 socket)，那么`off_in`表示从输入数据流的何处开始读取数据。此时，若`off_in`被设置为NULL，则表示从输入数据流的当前偏移位置读入；若`off_in`不为NULL，则它将指出具体的偏移位置。

`fd_out/off_out`参数的含义与`fd_in/off_in`相同，不过用于输出数据流。

`len`参数指定移动数据的长度

`flags`参数则控制数据如何移动，它可以被设置为下表中的某些值的按位或。

![image-20220816100934412](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220816100934412.png)

使用`splice`函数时，`fd_in`和`fd_out`必须至少有一个是管道文件描述符。

`splice`函数调用成功时返回移动字节的数量。它可能返回0，表示没有数据需要移动，这发生在从管道中读取数据（`fd_in`是管道文件描述符）而该管道没有被写入任何数据时。`splice`函数失败时返回-1并设置`errno`。常见的`errno`如下表所示。

![image-20220816101918940](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220816101918940.png)

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

![image-20220816102919876](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220816102919876.png)

## tee函数

`tee`函数在两个管道描述符之间复制数据，也是零拷贝操作。它不消耗数据，因此源文件描述符上的数据仍然可以用于后续操作。

```c
#include <fcntl.h>

ssize_t tee(int fd_in, int fd_out, size_t len, unsigned int flags);
```

`fd_in`和`fd_out`是文件描述符，但是必须是管道文件描述符

`len`参数指定移动数据的长度

`flags`参数则控制数据如何移动，它可以被设置为下表中的某些值的按位或，它的参数其实和`splice`函数相同。

![image-20220816100934412](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220816100934412.png)

`tee`函数成功时返回在两个文件描述符之间复制的数据数量（字节数)。返回0表示没有复制任何数据。`tee`失败时返回-1并设置`errno`。

书中代码利用`tee`函数和`splice`函数，实现了Linux 下`tee`程序（同时输出数据到终端和文件的程序，不要和`tee`函数混淆）的基本功能。

```c
#include <assert.h>
#include <stdio.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <fcntl.h>

int main(int argc, char *argv[])
{
	if (argc != 2)
	{
		printf("usage: %s <file>\n", argv[0]);
		return 1;
	}
	int filefd = open(argv[1], O_CREAT | O_WRONLY | O_TRUNC, 0666);
	assert(filefd > 0);

	int pipefd_stdout[2];
	int ret = pipe(pipefd_stdout);
	assert(ret != -1);

	int pipefd_file[2];
	ret = pipe(pipefd_file);
	assert(ret != -1);

	// close( STDIN_FILENO );
	//  dup2( pipefd_stdout[1], STDIN_FILENO );
	// write( pipefd_stdout[1], "abc\n", 4 );
	ret = splice(STDIN_FILENO, NULL, pipefd_stdout[1], NULL, 32768, SPLICE_F_MORE | SPLICE_F_MOVE);
	assert(ret != -1);
	ret = tee(pipefd_stdout[0], pipefd_file[1], 32768, SPLICE_F_NONBLOCK);
	assert(ret != -1);
	ret = splice(pipefd_file[0], NULL, filefd, NULL, 32768, SPLICE_F_MORE | SPLICE_F_MOVE);
	assert(ret != -1);
	ret = splice(pipefd_stdout[0], NULL, STDOUT_FILENO, NULL, 32768, SPLICE_F_MORE | SPLICE_F_MOVE);
	assert(ret != -1);

	close(filefd);
	close(pipefd_stdout[0]);
	close(pipefd_stdout[1]);
	close(pipefd_file[0]);
	close(pipefd_file[1]);
	return 0;
}
```

![image-20220816111052593](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220816111052593.png)

## fcntl函数

`fcntl`函数提供了对文件描述符的各种控制操作。

```c
#include <unistd.h>
#include <fcntl.h>

int fcntl(int fd, int cmd, ... /* arg */ );
```

`fd`参数是被操作的文件描述符，`cmd`参数指定执行何种类型的操作。根据操作类型的不同，该函数可能还需要第三个可选参数 `arg`。`fcntl`函数支持的常用操作及其参数如下表所示。

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