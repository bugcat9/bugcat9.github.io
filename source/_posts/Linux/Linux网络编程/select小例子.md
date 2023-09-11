---
title: select小例子
date: 2022-07-14 20:53:03
tags:
- Linux网络编程
- select
categories:
- Linux网络编程
---

# select小例子

编写了一个客户端发字母过来，然后服务器把字母转成大写发送回去的例子，其中使用了select。

<!--more-->

## 客户端代码

客户端代码比较简单，就是连接服务器，然后发送到服务器。

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <arpa/inet.h>
#include <ctype.h>
#include <unistd.h>
#include <errno.h>
#include <sys/socket.h>

#define BUF_SIZE 1024

void error_handling(char *message);

int main(int argc, char *argv[])
{
    if (argc != 2)
    {
        printf("Invalid port,please check out port");
        exit(1);
    }

    int client_sockfd;
    int len,n;    
    char buf[BUF_SIZE];
    struct sockaddr_in address; //服务器端网络地址结构体
    int result;
    client_sockfd = socket(AF_INET, SOCK_STREAM, 0); //建立客户端socket
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = inet_addr("127.0.0.1");
    address.sin_port = htons(atoi(argv[1]));
    len = sizeof(address);
    //进行链接
    result = connect(client_sockfd, (struct sockaddr *)&address, len);
    if (result == -1)
    {
        error_handling("connect error");
    }
    printf("------------connect ok----------------\n");
    //从屏幕（标准输入）得到输入字母
    while (fgets(buf, BUF_SIZE, stdin) != NULL) {
        write(client_sockfd, buf, strlen(buf));
        n = read(client_sockfd, buf, BUF_SIZE);
        if (n == 0) {
            printf("the other side has been closed.\n");
            break;
        }
        else
            write(STDOUT_FILENO, buf, n);
    }
    close(client_sockfd);
}

void error_handling(char *message)
{
    fputs(message, stderr);
    fputc('\n', stderr);
    exit(1);
}
```

## 服务器代码

服务器端代码略微复杂一些，但是只要弄清select函数的参数以及相关的参数还是比较简单的

```c
#include <sys/select.h>
#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>
int select(int maxfdp, fd_set *readset, fd_set *writeset, fd_set *exceptset,struct timeval *timeout);

```

参数说明：

maxfdp：被监听的文件描述符的总数，它比所有文件描述符集合中的文件描述符的最大值大1，因为文件描述符是从0开始计数的。

readfds、writefds、exceptset：分别指向可读、可写和异常等事件对应的描述符集合，这三个参数都是传入传出参数，都会作为结果传出。

timeout:用于设置select函数的超时时间，即告诉内核select等待多长时间之后就放弃等待。timeout == NULL 表示等待无限长的时间，也就是阻塞。

timeval结构体定义如下：

```c
struct timeval
{      
    long tv_sec;   /*秒 */
    long tv_usec;  /*微秒 */   
};
```

返回值：超时返回0;失败返回-1；成功返回大于0的整数，这个整数表示就绪描述符的数目。

以下介绍与select函数相关的常见的几个宏：

```c
#include <sys/select.h>   
int FD_ZERO(int fd, fd_set *fdset);   //一个 fd_set类型变量的所有位都设为 0
int FD_CLR(int fd, fd_set *fdset);  //清除某个位时可以使用
int FD_SET(int fd, fd_set *fd_set);   //设置变量的某个位置位
int FD_ISSET(int fd, fd_set *fdset); //测试某个位是否被置位

```

服务器代码

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <arpa/inet.h>
#include <ctype.h>
#include <unistd.h>
#include <errno.h>
#include <sys/socket.h>

#define BUF_SIZE 1024

void error_handling(char *message);

int main(int argc, char *argv[])
{
    if (argc != 2)
    {
        printf("Invalid port,please check out port");
        exit(1);
    }

    int server_sockfd, client_sockfd;
    int server_len, client_len;
    int fd_max, n;
    char buf[BUF_SIZE], str[INET_ADDRSTRLEN];
    // c中结构体使用，必须加struct
    struct sockaddr_in server_address;
    struct sockaddr_in client_address;
    int result;
    fd_set readfds, tempfds;
    //创建 服务器端 socket
    server_sockfd = socket(AF_INET, SOCK_STREAM, 0);
    //准备地址
    memset(&server_address, 0, sizeof(server_address));
    server_address.sin_family = AF_INET;
    server_address.sin_addr.s_addr = htonl(INADDR_ANY);
    server_address.sin_port = htons(atoi(argv[1]));
    server_len = sizeof(server_address);
    //设置绑定和监听
    if (bind(server_sockfd, (struct sockaddr *)&server_address, server_len) == -1)
    {
        error_handling("bind error");
    }

    if (listen(server_sockfd, 128) == -1)
    {
        error_handling("listen error");
    }

    printf("server waiting\n");
    FD_ZERO(&readfds);
    FD_SET(server_sockfd, &readfds); //将服务器端socket 监听描述符加入到集合中
    fd_max = server_sockfd;

    struct timeval timeout;
    while (1)
    {
        //将需要监听的描述符复制给 tempfds
        tempfds = readfds;
        // select第二个参数是传入传出参数，所以开始才需要复制
        
        // 情况1.设置timeout的等待时间
        timeout.tv_sec = 3;
        timeout.tv_usec = 0;
        // (fd_set)*0 和 NULL 用法相同
        // result = select(fd_max + 1, &tempfds, NULL, NULL, &timeout);
        // result = select(fd_max + 1, &tempfds, (fd_set *)0, (fd_set *)0, &timeout);
        
        //情况2.设置select 阻塞的情况
        result = select(fd_max + 1, &tempfds, (fd_set *)0, (fd_set *)0, (struct timeval *)0);
        printf("-------next--------\n");
        
        if (result < 0)
        {
            error_handling("select error");
            break;
        }

        for (size_t fd = 0; fd < fd_max + 1; fd++)
        {
            //寻找到相关文件描述符
            if (FD_ISSET(fd, &tempfds))
            {
                //判断是否是监听文件描述符
                if (fd == server_sockfd)
                {
                    client_len = sizeof(client_address);
                    client_sockfd = accept(server_sockfd, (struct sockaddr *)&client_address, &client_len);
                    printf("received from %s at PORT %d on fd %d\n", inet_ntop(AF_INET, &client_address.sin_addr, str, sizeof(str)),
                           ntohs(client_address.sin_port), client_sockfd);
                    //新的文件描述符加入读中
                    FD_SET(client_sockfd, &readfds);
                    if (fd_max < client_sockfd)
                        fd_max = client_sockfd;
                }
                else
                {
                    //说明是读描述数
                    if ((n = read(fd, buf, sizeof(buf))) == 0)
                    { /* 当client关闭链接时,服务器端也关闭对应链接 */
                        close(fd);
                        FD_CLR(fd, &readfds); /* 解除select对此文件描述符的监控 */
                    }
                    else if (n > 0)
                    {

                        for (size_t j = 0; j < n; j++)
                            buf[j] = toupper(buf[j]);
                        write(fd, buf, n);
                        write(STDOUT_FILENO, buf, n);
                    }
                }
            }
        }
    }
    close(server_sockfd);
    printf("--------------------server finish!");
}

void error_handling(char *message)
{
    fputs(message, stderr);
    fputc('\n', stderr);
    exit(1);
}
```

## 运行结果

### 情况1

我们先运行情况1，设置等待时间为3秒。

```c
        // 情况1.设置timeout的等待时间
        timeout.tv_sec = 3;
        timeout.tv_usec = 0;
        // (fd_set)*0 和 NULL 用法相同
        result = select(fd_max + 1, &tempfds, NULL, NULL, &timeout);
```

可以看到他等待3秒后就向下继续运行了。

![select情况1](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/select情况1.gif)

运行结果显示每3秒进行一次。

![image-20220715110925008](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220715110925008.png)

### 情况2

我们设置阻塞等待。

```c
result = select(fd_max + 1, &tempfds, (fd_set *)0, (fd_set *)0, (struct timeval *)0);
```

运行结果显示，每次都是阻塞在那里，知道有写描述符集的使用。

![image-20220715111515047](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20220715111515047.png)



## 总结

select的使用的小例子比较简单，但是深入原理目前我还未了解，先写个小例子记录一下。

**参考：**

* [https://blog.csdn.net/hyman_c/article/details/52801947](https://blog.csdn.net/hyman_c/article/details/52801947)
* [https://blog.csdn.net/hyman_c/article/details/53991111](https://blog.csdn.net/hyman_c/article/details/53991111)
* [https://docs.microsoft.com/zh-cn/windows/win32/api/winsock2/nf-winsock2-select](https://docs.microsoft.com/zh-cn/windows/win32/api/winsock2/nf-winsock2-select)
* [https://www.cnblogs.com/alantu2018/p/8612722.html](https://www.cnblogs.com/alantu2018/p/8612722.html)
* [https://www.cnblogs.com/skyfsm/p/7079458.html](https://www.cnblogs.com/skyfsm/p/7079458.html)

