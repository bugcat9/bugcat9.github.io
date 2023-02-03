---
title: 从0开始2
date: 2023-02-03 11:04:23
tags:
- Linux
- muduo
categories:
- Linux
---

# 从0开始构建muduo（三）

加入net模块相关代码，net模块相关代码是muduo库的精髓，后面看了一下其实也比较简洁，容易看懂。

首先是将之前main中大大的while循环进行封装，编程EventLoop

```c++
void EventLoop::loop()
{
    assert(!looping_);
    assertInLoopThread();
    looping_ = true;
    quit_ = false; // FIXME: what if someone calls quit() before loop() ?
    LOG_TRACE << "EventLoop " << this << " start looping";

    while (!quit_)
    {
        activeChannels_.clear();
        pollReturnTime_ = poller_->poll(kPollTimeMs, &activeChannels_);
        ++iteration_;
        if (Logger::logLevel() <= Logger::TRACE)
        {
            printActiveChannels();
        }
        // TODO sort channel by priority
        eventHandling_ = true;
        for (Channel *channel : activeChannels_)
        {
            currentActiveChannel_ = channel;
            currentActiveChannel_->handleEvent(pollReturnTime_);
        }
        currentActiveChannel_ = NULL;
        eventHandling_ = false;
        doPendingFunctors();
    }

    LOG_TRACE << "EventLoop " << this << " stop looping";
    looping_ = false;
}
```

然后将那些文件描述符封装成`Channel`类，整个结构就比较简单明了。

对于**Reactor**模型封装了EventLoopThread、EventLoopThreadPool 专门处理io线程，也就是那些连接以及读写相关的线程。

对于应用层的发送和接收封装了buffer类。

最后将这一切封装在TcpServer类中。

所以我们实现echo也比较简单，这里面直接使用muduo自带的内容

echo.h:

```c++
#ifndef _ECHO_H
#define _ECHO_H

#include "net/TcpServer.h"

// RFC 862
class EchoServer
{
public:
    EchoServer(tinyMuduo::net::EventLoop *loop,
               const tinyMuduo::net::InetAddress &listenAddr);

    void start(); // calls server_.start();

private:
    void onConnection(const tinyMuduo::net::TcpConnectionPtr &conn);

    void onMessage(const tinyMuduo::net::TcpConnectionPtr &conn,
                   tinyMuduo::net::Buffer *buf,
                   tinyMuduo::Timestamp time);

    tinyMuduo::net::TcpServer server_;
};

#endif // _ECHO_H
```

echo.cpp

```c++
#include "echo.h"

#include "base/Logging.h"
#include "net/EventLoop.h"

#include <unistd.h>

// using namespace tinyMuduo;
// using namespace tinyMuduo::net;

int main(int argc, char const *argv[])
{
  LOG_INFO << "pid = " << getpid();
  tinyMuduo::net::EventLoop loop;
  tinyMuduo::net::InetAddress listenAddr(2007);
  EchoServer server(&loop, listenAddr);
  server.start();
  loop.loop();
  return 0;
}
```

main.cpp

```c++
#include "echo.h"

#include "base/Logging.h"
#include "net/EventLoop.h"

#include <unistd.h>

// using namespace tinyMuduo;
// using namespace tinyMuduo::net;

int main(int argc, char const *argv[])
{
  LOG_INFO << "pid = " << getpid();
  tinyMuduo::net::EventLoop loop;
  tinyMuduo::net::InetAddress listenAddr(2007);
  EchoServer server(&loop, listenAddr);
  server.start();
  loop.loop();
  return 0;
}
```

整体差不多就是这样，感觉muduo书和视频讲的太好了，感觉也没什么好多说，没有让人写的欲望。后面可以加一下数据库和http服务，改成web服务器算了。