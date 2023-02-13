---
title: 使用muduo编写webserver
date: 2023-02-13 11:48:07
tags:
categories:
---

# 使用muduo编写webserver

因为学习了muduo库，想通过muduo库写一个webserver作为项目，在muduo和tinyWebserver的基础上改了一下，简单的把他们融合了一下。

<!--more-->

## httpserver

在muduo原本的httpserver的基础上进行了改造，加入简单的数据库操作的部分。针对http请求处理的逻辑部分封装在了`onHttpProcess`中。

HttpServer.h

```cpp
#ifndef _HTTPSERVER_H
#define _HTTPSERVER_H

#include "../../net/TcpServer.h"
#include "../../base/SqlConnectionPool.h"

namespace tinyMuduo
{
    namespace net
    {

        class HttpRequest;
        class HttpResponse;

        /// A simple embeddable HTTP server designed for report status of a program.
        /// It is not a fully HTTP 1.1 compliant server, but provides minimum features
        /// that can communicate with HttpClient and Web browser.
        /// It is synchronous, just like Java Servlet.
        class HttpServer : boost::noncopyable
        {
        public:
            typedef std::function<void(const HttpRequest &,
                                       HttpResponse *)>
                HttpCallback;
            HttpServer(EventLoop *loop,
                       const InetAddress &listenAddr,
                       const string &name,
                       const string &user,
                       const string &passwd,
                       const string &databaseName,
                       int sqlNum,
                       TcpServer::Option option = TcpServer::kNoReusePort);

            EventLoop *getLoop() const { return server_.getLoop(); }

            /// Not thread safe, callback be registered before calling start().
            void setHttpCallback(const HttpCallback &cb)
            {
                httpCallback_ = cb;
            }

            void setThreadNum(int numThreads)
            {
                server_.setThreadNum(numThreads);
            }

            void start();

        private:
            void onConnection(const TcpConnectionPtr &conn);
            void onMessage(const TcpConnectionPtr &conn,
                           Buffer *buf,
                           Timestamp receiveTime);
            void onRequest(const TcpConnectionPtr &, const HttpRequest &);
            void onWriteComplete(const TcpConnectionPtr &conn);
            void initmysql(ConnectionPool *connPool);

            void onHttpProcess(const HttpRequest &req, HttpResponse *resp);
            TcpServer server_;
            HttpCallback httpCallback_;

            ConnectionPool *connPool_; // 数据库相关
            string user_;              // 登陆数据库用户名
            string passwd_;            // 登陆数据库密码
            string databaseName_;      // 使用数据库名
            int sqlNum_;
            map<string, string> users;
        };

    } // namespace net
} // namespace tinyMuduo

#endif // _HTTPSERVER_H
```

HttpServer.cpp

```cpp

#include "../../net/http/HttpServer.h"

#include "../../base/Logging.h"
#include "../../net/http/HttpContext.h"
#include "../../net/http/HttpRequest.h"
#include "../../net/http/HttpResponse.h"
#include <sys/stat.h>

using namespace tinyMuduo;
using namespace tinyMuduo::net;

namespace tinyMuduo
{
    namespace net
    {
        namespace detail
        {

            void defaultHttpCallback(const HttpRequest &, HttpResponse *resp)
            {
                resp->setStatusCode(HttpResponse::k404NotFound);
                resp->setStatusMessage("Not Found");
                resp->setCloseConnection(true);
            }

        } // namespace detail
    }     // namespace net
} // namespace tinyMuduo

HttpServer::HttpServer(EventLoop *loop,
                       const InetAddress &listenAddr,
                       const string &name,
                       const string &user,
                       const string &passwd,
                       const string &databaseName,
                       int sqlNum,
                       TcpServer::Option option)
    : server_(loop, listenAddr, name, option), user_(user), passwd_(passwd), databaseName_(databaseName), sqlNum_(sqlNum)
{
    server_.setConnectionCallback(
        std::bind(&HttpServer::onConnection, this, _1));
    server_.setMessageCallback(
        std::bind(&HttpServer::onMessage, this, _1, _2, _3));
    server_.setWriteCompleteCallback(
        std::bind(&HttpServer::onWriteComplete, this, _1));

    this->setHttpCallback(std::bind(&HttpServer::onHttpProcess, this, _1, _2));
    // user_ = "root";
    // passwd_ = "123456";
    // databaseName_ = "yourdb";
    // sqlNum_ = 8;
}

/**
 * @brief 初始化数据库
 *
 * @param connPool
 */
void HttpServer::initmysql(ConnectionPool *connPool)
{
    // 先从连接池中取一个连接
    MYSQL *mysql = NULL;
    tinyMuduo::ConnectionRAII mysqlcon(&mysql, connPool);

    // 在user表中检索username，passwd数据，浏览器端输入
    if (mysql_query(mysql, "SELECT username,passwd FROM user"))
    {
        LOG_ERROR << "SELECT error: " << mysql_error(mysql);
    }

    // 从表中检索完整的结果集
    MYSQL_RES *result = mysql_store_result(mysql);

    // 返回结果集中的列数
    int num_fields = mysql_num_fields(result);

    // 返回所有字段结构的数组
    MYSQL_FIELD *fields = mysql_fetch_fields(result);

    // 从结果集中获取下一行，将对应的用户名和密码，存入map中
    while (MYSQL_ROW row = mysql_fetch_row(result))
    {
        string temp1(row[0]);
        string temp2(row[1]);
        users[temp1] = temp2;
    }
}

void HttpServer::start()
{
    LOG_WARN << "HttpServer[" << server_.name()
             << "] starts listening on " << server_.ipPort();
    server_.start();
    // 初始化数据库连接池
    connPool_ = ConnectionPool::getInstance();
    connPool_->init("127.0.0.1", user_, passwd_, databaseName_, 3306, sqlNum_);
    initmysql(connPool_);
}

void HttpServer::onConnection(const TcpConnectionPtr &conn)
{
    if (conn->connected())
    {
        conn->setContext(HttpContext());
    }
}

void HttpServer::onMessage(const TcpConnectionPtr &conn,
                           Buffer *buf,
                           Timestamp receiveTime)
{
    HttpContext *context = boost::any_cast<HttpContext>(conn->getMutableContext());
    // LOG_INFO << buf->toStringPiece();
    if (!context->parseRequest(buf, receiveTime))
    {
        conn->send("HTTP/1.1 400 Bad Request\r\n\r\n");
        conn->shutdown();
    }

    if (context->gotAll())
    {
        onRequest(conn, context->request());
        context->reset();
    }
}

void HttpServer::onRequest(const TcpConnectionPtr &conn, const HttpRequest &req)
{
    const string &connection = req.getHeader("Connection");
    bool close = connection == "close" ||
                 (req.getVersion() == HttpRequest::kHttp10 && connection != "Keep-Alive");
    HttpResponse response(close);
    httpCallback_(req, &response);
    Buffer buf;
    response.appendToBuffer(&buf);
    conn->send(&buf);
    const char *file = response.g_file.c_str();
    FILE *fp = ::fopen(file, "rb");
    if (fp)
    {
        TcpConnection::FilePtr ctx(fp, ::fclose);
        // conn->setContext(ctx);
        conn->filePtr_.swap(ctx);
        char buf[TcpConnection::kBufSize];
        size_t nread = ::fread(buf, 1, sizeof buf, fp);
        conn->send(buf, static_cast<int>(nread));
    }
    else
    {
        LOG_INFO << file << " no such file";
        conn->shutdown();
    }
}

void HttpServer::onWriteComplete(const TcpConnectionPtr &conn)
{

    char buf[TcpConnection::kBufSize];
    size_t nread = 0;
    if (conn->filePtr_)
        nread = ::fread(buf, 1, sizeof buf, get_pointer(conn->filePtr_));
    if (nread > 0)
    {
        conn->send(buf, static_cast<int>(nread));
    }
    else
    {
        conn->filePtr_.reset();
        LOG_INFO << "FileServer - done";
    }
}

/**
 * @brief 对http消息进行处理的函数
 *
 * @param req
 * @param resp
 */
void HttpServer::onHttpProcess(const HttpRequest &req, HttpResponse *resp)
{
    LOG_INFO << "Headers " << req.methodString() << " " << req.path();

    std::string file;
    if (!req.body().empty())
    {
        const char *bodyStr = req.body().c_str();
        // 将用户名和密码提取出来
        // user=123&passwd=123
        char name[100], password[100];
        int i;
        for (i = 5; bodyStr[i] != '&'; ++i)
            name[i - 5] = bodyStr[i];
        name[i - 5] = '\0';

        int j = 0;
        for (i = i + 10; bodyStr[i] != '\0'; ++i, ++j)
            password[j] = bodyStr[i];
        password[j] = '\0';

        if (req.path() == "/3CGISQL.cgi")
        {
            // 表示注册
            if (users.count(name))
            {
                file.append("resources/registerError.html");
            }
            else
            {
                // 如果是注册，先检测数据库中是否有重名的
                // 没有重名的，进行增加数据
                char *sql_insert = (char *)malloc(sizeof(char) * 200);
                strcpy(sql_insert, "INSERT INTO user(username, passwd) VALUES(");
                strcat(sql_insert, "'");
                strcat(sql_insert, name);
                strcat(sql_insert, "', '");
                strcat(sql_insert, password);
                strcat(sql_insert, "')");

                // 先从连接池中取一个连接
                MYSQL *mysql = NULL;
                ConnectionRAII mysqlcon(&mysql, connPool_);
                // 此处感觉需要锁一下
                int res = mysql_query(mysql, sql_insert);
                if (!res)
                {
                    users[name] = password;
                    file.append("resources/login.html");
                }
                else
                {
                    file.append("resources/registerError.html");
                }
            }
        }
        else if (req.path() == "/2CGISQL.cgi")
        {
            // 表示登录
            if (users.count(name) && users[name] == password)
            {

                file.append("resources/welcome.html");
            }
            else
            {
                file.append("resources/logError.html");
            }
        }
    }
    else if (req.path() == "/0")
    {
        file.append("resources/register.html");
    }
    else if (req.path() == "/1")
    {
        file.append("resources/login.html");
    }
    else if (req.path() == "/5")
    {
        file.append("resources/picture.html");
    }
    else if (req.path() == "/6")
    {
        file.append("resources/video.html");
    }
    else if (req.path() == "/7")
    {
        file.append("resources/fans.html");
    }
    else if (req.path() == "/404")
    {
        file.append("resources/404.html");
    }
    else
    {
        // strcpy(file, "resources");
        file.append("resources");
        // int len = strlen(file);
        const char *url_real = req.path().c_str();
        file.append(url_real);
    }

    // 读取文件状态
    struct stat fileStat;
    if (stat(file.c_str(), &fileStat) < 0)
    {
        LOG_INFO << file << " no such file";
        file.clear();
        file.append("resources/404.html");
        stat(file.c_str(), &fileStat);
    }

    // if (!(fileStat.st_mode & S_IROTH))
    //   return;

    // if (S_ISDIR(fileStat.st_mode))
    //   return;

    resp->setStatusCode(HttpResponse::k200Ok);
    resp->setStatusMessage("OK");
    resp->addHeader("Server", "tinyMuduo");
    resp->setContentLength(fileStat.st_size);
    resp->setFile(file);
}
```

重要的东西是`onHttpProcess`函数，这个函数是处理http请求的逻辑。其次我觉得重要的是`onRequest`中发送文件，因为图片、html页面等文件太大，所以一次发可能装不下，所以这里参考了muduo中ftp的实现，在`onRequest`中发送一次文件，如果没有发送完会在`onWriteComplete`中接着发送。

## SqlConnectionPool

因为涉及连接数据库，简单将tinyWEbserver里面的数据库池搬了过来。

SqlConnectionPool.h

```cpp
#ifndef _SQLCONNECTIONPOOL_H
#define _SQLCONNECTIONPOOL_H

#include <stdio.h>
#include <list>
#include <mysql/mysql.h>
#include <error.h>
#include <string.h>
#include <iostream>
#include <string>
#include "Logging.h"
#include <mutex>
#include <condition_variable>

using namespace std;

namespace tinyMuduo
{
    class ConnectionPool
    {
    public:
        MYSQL *getConnection();              // 获取数据库连接
        bool releaseConnection(MYSQL *conn); // 释放连接
        int getFreeConn();                   // 获取连接
        void destroyPool();                  // 销毁所有连接

        // 单例模式
        static ConnectionPool *getInstance();

        void init(string url, string User, string PassWord, string DataBaseName, int Port, int MaxConn);

    private:
        ConnectionPool();
        ~ConnectionPool();

        int maxConn_;          // 最大连接数
        int curConn_;          // 当前已使用的连接数
        int freeConn_;         // 当前空闲的连接数
        list<MYSQL *> connList; // 连接池
        std::mutex mutex_;
        std::condition_variable condition_;

    public:
        string url_;          // 主机地址
        string port_;         // 数据库端口号
        string user_;         // 登陆数据库用户名
        string passwd_;     // 登陆数据库密码
        string databaseName_; // 使用数据库名
    };

    class ConnectionRAII
    {

    public:
        ConnectionRAII(MYSQL **con, ConnectionPool *connPool);
        ~ConnectionRAII();

    private:
        MYSQL *conRAII_;
        ConnectionPool *poolRAII_;
    };
}

#endif // _SQLCONNECTIONPOOL_H
```

SqlConnectionPool.cpp

```cpp
#include <mysql/mysql.h>
#include <stdio.h>
#include <string>
#include <string.h>
#include <stdlib.h>
#include <list>
#include <pthread.h>
#include <iostream>
#include "SqlConnectionPool.h"

using namespace std;

namespace tinyMuduo
{
    ConnectionPool::ConnectionPool()
    {
        curConn_ = 0;
        freeConn_ = 0;
    }

    ConnectionPool *ConnectionPool::getInstance()
    {
        static ConnectionPool connPool;
        return &connPool;
    }

    // 构造初始化
    void ConnectionPool::init(string url, string User, string PassWord, string DBName, int Port, int MaxConn)
    {
        url_ = url;
        port_ = Port;
        user_ = User;
        passwd_ = PassWord;
        databaseName_ = DBName;

        for (int i = 0; i < MaxConn; i++)
        {
            MYSQL *con = NULL;
            con = mysql_init(con);

            if (con == NULL)
            {
                LOG_ERROR << "MySQL Error";
                exit(1);
            }
            con = mysql_real_connect(con, url.c_str(), User.c_str(), PassWord.c_str(), DBName.c_str(), Port, NULL, 0);

            if (con == NULL)
            {
                LOG_ERROR << "MySQL Error";
                exit(1);
            }
            connList.push_back(con);
            ++freeConn_;
        }

        maxConn_ = freeConn_;
    }

    // 当有请求时，从数据库连接池中返回一个可用连接，更新使用和空闲连接数
    MYSQL *ConnectionPool::getConnection()
    {
        MYSQL *con = NULL;

        if (0 == connList.size())
            return NULL;

        std::unique_lock<std::mutex> lk(mutex_);

        con = connList.front();
        connList.pop_front();

        --freeConn_;
        ++curConn_;
        while (freeConn_ <= 0)
        {
            /* code */
            condition_.wait(lk);
        }

        return con;
    }

    // 释放当前使用的连接
    bool ConnectionPool::releaseConnection(MYSQL *con)
    {
        if (NULL == con)
            return false;

        std::unique_lock<std::mutex> lk(mutex_);

        connList.push_back(con);
        ++freeConn_;
        --curConn_;

        // condition_.wait(lk);
        if (freeConn_ > 0)
        {
            condition_.notify_all();
        }
        return true;
    }

    // 销毁数据库连接池
    void ConnectionPool::destroyPool()
    {

        std::lock_guard<std::mutex> lock(mutex_);

        if (connList.size() > 0)
        {
            list<MYSQL *>::iterator it;
            for (it = connList.begin(); it != connList.end(); ++it)
            {
                MYSQL *con = *it;
                mysql_close(con);
            }
            curConn_ = 0;
            freeConn_ = 0;
            connList.clear();
        }
    }

    // 当前空闲的连接数
    int ConnectionPool::getFreeConn()
    {
        return this->freeConn_;
    }

    ConnectionPool::~ConnectionPool()
    {
        destroyPool();
    }

    ConnectionRAII::ConnectionRAII(MYSQL **SQL, ConnectionPool *connPool)
    {
        *SQL = connPool->getConnection();

        conRAII_ = *SQL;
        poolRAII_ = connPool;
    }

    ConnectionRAII::~ConnectionRAII()
    {
        poolRAII_->releaseConnection(conRAII_);
    }
} // namespace tinyMuduo
```

测试SqlConnectionPool_test.cpp

```cpp
#include "../../base/SqlConnectionPool.h"
#include <map>
#include <iostream>

// 需要修改的数据库信息,登录名,密码,库名
string user = "root";
string passwd = "123456";
string databasename = "yourdb";

map<string, string> users;

void initmysqlResult(tinyMuduo::ConnectionPool *connPool)
{
    // 先从连接池中取一个连接
    MYSQL *mysql = NULL;
    tinyMuduo::ConnectionRAII mysqlcon(&mysql, connPool);

    // 在user表中检索username，passwd数据，浏览器端输入
    if (mysql_query(mysql, "SELECT username,passwd FROM user"))
    {
        LOG_ERROR << "SELECT error: " << mysql_error(mysql);
    }

    // 从表中检索完整的结果集
    MYSQL_RES *result = mysql_store_result(mysql);

    // 返回结果集中的列数
    int num_fields = mysql_num_fields(result);

    // 返回所有字段结构的数组
    MYSQL_FIELD *fields = mysql_fetch_fields(result);

    // 从结果集中获取下一行，将对应的用户名和密码，存入map中
    while (MYSQL_ROW row = mysql_fetch_row(result))
    {
        string temp1(row[0]);
        string temp2(row[1]);
        users[temp1] = temp2;
    }
}

int main(int argc, char const *argv[])
{
    // 初始化数据库连接池
    tinyMuduo::ConnectionPool *connPool = tinyMuduo::ConnectionPool::getInstance();
    connPool->init("127.0.0.1", user, passwd, databasename, 3306, 8);

    // 初始化数据库读取表
    initmysqlResult(connPool);
    for (auto iter = users.begin(); iter != users.end(); iter++)
    {
        cout << "username: " << iter->first << " passwd: " << iter->second << std::endl;
    }
    return 0;
}
```

mysql是使用docker进行安装的，进入docker查看一下数据

![image-20230213144740181](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20230213144740181.png)

运行测试

![image-20230213144824101](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20230213144824101.png)

可以看到简单的连接是成功的

## main

main里面实现很简单，主要是需要写好数据库相关的信息

```cpp
#include "base/Logging.h"
#include "net/EventLoop.h"
#include "net/http/HttpServer.h"
#include "net/http/HttpRequest.h"
#include "net/http/HttpResponse.h"

using namespace tinyMuduo;
using namespace tinyMuduo::net;

int main(int argc, char const *argv[])
{

  // 需要修改的数据库信息,登录名,密码,库名
  string user = "root";
  string passwd = "123456";
  string databasename = "yourdb";
  int sqlNum = 8;
  int numThreads = 5;

  EventLoop loop;
  HttpServer server(&loop, InetAddress(8080), "webserver", user, passwd, databasename, sqlNum);
  server.setThreadNum(numThreads);
  server.start();
  loop.loop();
  
  return 0;
}
```

## 运行结果

登录界面

![image-20230213151254186](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20230213151254186.png)

选择界面

![image-20230213151319812](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20230213151319812.png)

关注界面

![image-20230213151339389](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/Linux/image-20230213151339389.png)

## 感谢

感谢muduo的仓库和tinyWebserver仓库

muduo：https://github.com/chenshuo/muduo

tinyWebServer:https://github.com/qinguoyi/TinyWebServer

## 总结

在muduo的基础上想写个webserver很简单，只需要在他http的基础上进行改进就可以。

最好代码仓库：https://github.com/bugcat9/tinyMuduo