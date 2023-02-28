---
title: 从0开始构建muduo（一）
date: 2023-01-03 17:41:58
tags:
- Linux
- muduo
categories:
- Linux
---

# 从0开始构建muduo（一）

学习了陈硕老师的《Linux 多线程服务端编程：使用 muduo C++ 网络库》，想自己动手写一个玩具，模仿陈硕老师的muduo库。muduo库大概10000行，本人自己写的肯定简略很多（毕竟只是玩具），只是为了自己熟悉这个网络库的实现。

<!--more-->

## 使用epoll

使用epoll构建第一个版本，是个echo服务器。

代码只有一个`main.cpp`，大概有100多行

```c++
#include <unistd.h>
#include <sys/types.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <signal.h>
#include <fcntl.h>
#include <sys/wait.h>
#include <sys/epoll.h>
#include <string.h>

#include <vector>
#include <algorithm>
#include <iostream>

// 重定义epoll_event 数组
typedef std::vector<epoll_event> EventList;
#define ERR_EXIT(m)     \
  do                    \
  {                     \
    perror(m);          \
    exit(EXIT_FAILURE); \
  } while (0)

#define PORT 8080

int main()
{

  /***
   * 屏蔽 SIGPIPE SIGCHLD 信号
   */
  signal(SIGPIPE, SIG_IGN);
  signal(SIGCHLD, SIG_IGN);

  /***
   * 打开一个文件描述符，解决EMFILE错误
   */
  int idlefd = open("/dev/null", O_RDONLY | O_CLOEXEC);

  int listenfd;
  if ((listenfd = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK | SOCK_CLOEXEC, IPPROTO_TCP)) < 0)
    ERR_EXIT("socket");

  struct sockaddr_in servaddr;
  memset(&servaddr, 0, sizeof(servaddr));
  servaddr.sin_family = AF_INET;
  servaddr.sin_port = htons(PORT);
  servaddr.sin_addr.s_addr = htonl(INADDR_ANY);

  /***
   * 设置端口重用，无需 TIME_WAIT
   */
  int on = 1;
  if (setsockopt(listenfd, SOL_SOCKET, SO_REUSEADDR, &on, sizeof(on)) < 0)
    ERR_EXIT("setsockopt");

  if (bind(listenfd, (struct sockaddr *)&servaddr, sizeof(servaddr)) < 0)
    ERR_EXIT("bind");
  if (listen(listenfd, SOMAXCONN) < 0)
    ERR_EXIT("listen");

  std::vector<int> clients;
  int epollfd;
  epollfd = epoll_create1(EPOLL_CLOEXEC);

  struct epoll_event event;
  event.data.fd = listenfd;
  event.events = EPOLLIN /* | EPOLLET*/;
  epoll_ctl(epollfd, EPOLL_CTL_ADD, listenfd, &event);

  EventList events(16);
  struct sockaddr_in peeraddr;
  socklen_t peerlen;
  int connfd;

  int nready;
  while (1)
  {
    nready = epoll_wait(epollfd, &*events.begin(), static_cast<int>(events.size()), -1);
    if (nready == -1)
    {
      if (errno == EINTR)
        continue;

      ERR_EXIT("epoll_wait");
    }
    if (nready == 0) // 什么都没有发生
      continue;

    /***
     * 当nready达到events的大小，说明可能有更多的事件触发
     */
    if ((size_t)nready == events.size())
      events.resize(events.size() * 2);

    for (int i = 0; i < nready; ++i)
    {
      if (events[i].data.fd == listenfd)
      {
        peerlen = sizeof(peeraddr);
        connfd = accept4(listenfd, (struct sockaddr *)&peeraddr,
                         &peerlen, SOCK_NONBLOCK | SOCK_CLOEXEC);

        if (connfd == -1)
        {
          if (errno == EMFILE)
          {
            /***
             * 发生EMFILE时的处理方法
             */

            close(idlefd);
            idlefd = accept(listenfd, NULL, NULL);
            close(idlefd);
            idlefd = open("/dev/null", O_RDONLY | O_CLOEXEC);
            continue;
          }
          else
            ERR_EXIT("accept4");
        }

        std::cout << "ip=" << inet_ntoa(peeraddr.sin_addr) << " port=" << ntohs(peeraddr.sin_port) << std::endl;

        clients.push_back(connfd);

        event.data.fd = connfd;
        event.events = EPOLLIN /* | EPOLLET*/;
        epoll_ctl(epollfd, EPOLL_CTL_ADD, connfd, &event);
      }
      else if (events[i].events & EPOLLIN)
      {
        connfd = events[i].data.fd;
        if (connfd < 0)
          continue;

        char buf[1024] = {0};
        int ret = read(connfd, buf, 1024);
        if (ret == -1)
          ERR_EXIT("read");
        if (ret == 0)
        {
          /***
           * 说明对方断开了连接
          */
          std::cout << "client close" << std::endl;
          close(connfd);
          event = events[i];
          epoll_ctl(epollfd, EPOLL_CTL_DEL, connfd, &event);
          clients.erase(std::remove(clients.begin(), clients.end(), connfd), clients.end());
          continue;
        }

        std::cout << buf;
        /***
         * 写回对应的 内容，成为echo服务器
        */
        write(connfd, buf, strlen(buf));
      }
    }
  }

  return 0;
}
```

`CMakeLists.txt`里面的配置

```cmake
cmake_minimum_required(VERSION 3.10)

project(tinyMuduo)

set(CXX_FLAGS -g -Wall)
set(CMAKE_CXX_COMPILER "g++")
string(REPLACE ";" " " CMAKE_CXX_FLAGS "${CXX_FLAGS}")

set(EXECUTABLE_OUTPUT_PATH ${PROJECT_BINARY_DIR}/bin)

add_executable(main main.cpp) 

```

`build.sh`

```sh
#!/bin/sh

set -x

SOURCE_DIR=`pwd`
BUILD_DIR=${BUILD_DIR:-build}

mkdir -p $BUILD_DIR \
  && cd $BUILD_DIR \
  && cmake $SOURCE_DIR \
  && make $*


```

代码运行结果：

![image-20230103221627821](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20230103221627821.png)

## 程序需要注意的点

### 屏蔽信息

```c++
  /***
   * 屏蔽 SIGPIPE SIGCHLD 信号
   */
  signal(SIGPIPE, SIG_IGN);
  signal(SIGCHLD, SIG_IGN);
```

屏蔽了`SIGPIPE`和`SIGCHLD`这两个信号。`SIGPIPE`信号是往读端被关闭的管道或者 socket 连接中写数据，默认是会终止进程，所以为了防止这种事情出现我们需要屏蔽这个信息。

### 解决EMFILE错误

EMFILE错误是进程描述符用完的错误，在陈硕老师的视频中有专门讲解这个问题。目前的解决方法：

```
1.调高进程文件描述符数目
2.死等
3.退出程序
4.关闭监听套接字。那什么时候重新打开呢？
5.如果是epoll模型，可以改用edge trigger。问题是如果漏掉了一次accept(2)，程序再也不会收到新连接。
6.准备一个空闲的文件描述符。遇到这种情况，先关闭这个空闲文件，获得一个文件描述符名额;再accept(2)拿到socket连接的文件描述符；随后立刻close(2)，这样就优雅地断开了与客户端的连接；最后重新打开空闲文件，把“坑”填上，以备再次出现这种情况时使用。
```

很显然推荐的方法是6，代码中使用的也是这种方法

```c++
          if (errno == EMFILE)
          {
            /***
             * 发生EMFILE时的处理方法
             */

            close(idlefd);
            idlefd = accept(listenfd, NULL, NULL);
            close(idlefd);
            idlefd = open("/dev/null", O_RDONLY | O_CLOEXEC);
            continue;
          }
          else
            ERR_EXIT("accept4");
```

### 采取LT模式

epoll需要采取LT模型，并且以**非阻塞**状态进行。为什么不采取ET模式呢，ET模式下EMFILE错误处理要复杂一些，为了简化代码，所以我们采取这种LT模式。

模式的过程如下图所示：

![image-20230103221058350](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20230103221058350.png)

需要注意的是对于EPOLLOUT事件我们这里并没有处理，只是简单的直接写回，理论上应该加一层应用层缓冲区，这是后续需要改进的地方。

代码仓库：https://github.com/bugcat9/tinyMuduo/tree/v0.01