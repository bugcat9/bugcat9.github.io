---
title: Linux系统日志rsyslogd
date: 2022-08-21 21:05:08
tags:
- Linux
- Linux高性能服务器编程
categories:
- Linux
---

# Linux系统日志rsyslogd

### Linux系统日志

Linux上使用`rsyslogd`守护进程接收**用户进程**输出的日志和接收**内核**日志。

用户进程是通过`syslogd`函数生成系统日志。该函数将日志输出到一个UNIX本地域socket类型(AF_UNIX）的文件`/dev/log`中，`rsyslogd`则监听该文件以获取用户进程的输出。

内核日志是如何进行管理的，在这里我们不进行关系。

`rsyslogd`守护进程在接收到**用户进程**或**内核输入**的日志后，会把它们输出至某些特定的日志文件。默认情况下，调试信息会保存至`/var/log/debug`文件，普通信息保存至`/var/log/messages`文件，内核消息则保存至`/var/log/kern.log`文件。

不过，日志信息具体如何分发，可以在`rsyslogd`的配置文件中设置。`rsyslogd `的主配置文件是`/etc/rsyslog.conf`，其中主要可以设置的项包括:内核日志输入路径，是否接收UDP日志及其监听端口（默认是514，见`/etc/services`文件)，是否接收TCP日志及其监听端口，日志文件的权限，包含哪些子配置文件(比如 `/etc/rsyslog.d/*.conf`)。`rsyslogd`的子配置文件则指定各类日志的目标存储文件。

![image-20220818105707879](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220818105707879.png)

`rsyslogd`系统日志功能比较复杂，有facility、priority、action等概念。还有Input模块、Filetr模块、Output模块等模块内容，目前还未弄清楚相关的知识。

查看了一下`/etc/rsyslog.conf`的配置文件

```shell
# /etc/rsyslog.conf configuration file for rsyslog
#
# For more information install rsyslog-doc and see
# /usr/share/doc/rsyslog-doc/html/configuration/index.html
#
# Default logging rules can be found in /etc/rsyslog.d/50-default.conf


#################
#### MODULES ####
#################

module(load="imuxsock") # provides support for local system logging
# module(load="immark")  # provides --MARK-- message capability

# provides UDP syslog reception
# module(load="imudp")
# input(type="imudp" port="514")

# provides TCP syslog reception
# module(load="imtcp")
# input(type="imtcp" port="514")

# provides kernel logging support and enable non-kernel klog messages
module(load="imklog" permitnonkernelfacility="on")


###########################
#### GLOBAL DIRECTIVES ####
###########################

#
# Use traditional timestamp format.
# To enable high precision timestamps, comment out the following line.
#
$ActionFileDefaultTemplate RSYSLOG_TraditionalFileFormat

# Filter duplicated messages
$RepeatedMsgReduction on

#
# Set the default permissions for all log files.
#
$FileOwner syslog
$FileGroup adm
$FileCreateMode 0640
$DirCreateMode 0755
$Umask 0022
$PrivDropToUser syslog
$PrivDropToGroup syslog

#
# Where to place spool and state files
#
$WorkDirectory /var/spool/rsyslog

#
# Include all config files in /etc/rsyslog.d/
#
$IncludeConfig /etc/rsyslog.d/*.conf
```

我们可以看到模块`module(load="imuxsock")`，这是一个输入模块

然后看到默认规则在`/etc/rsyslog.d/50-default.conf`，查看一下

```shell
#  Default rules for rsyslog.
#
#                       For more information see rsyslog.conf(5) and /etc/rsyslog.conf

#
# First some standard log files.  Log by facility.
#
auth,authpriv.*                 /var/log/auth.log
*.*;auth,authpriv.none          -/var/log/syslog
#cron.*                         /var/log/cron.log
#daemon.*                       -/var/log/daemon.log
kern.*                          -/var/log/kern.log
#lpr.*                          -/var/log/lpr.log
mail.*                          -/var/log/mail.log
#user.*                         -/var/log/user.log

#
# Logging for the mail system.  Split it up so that
# it is easy to write scripts to parse these files.
#
#mail.info                      -/var/log/mail.info
#mail.warn                      -/var/log/mail.warn
mail.err                        /var/log/mail.err

#
# Some "catch-all" log files.
#
#
#*.=debug;\
#       auth,authpriv.none;\
#       news.none;mail.none     -/var/log/debug
#*.=info;*.=notice;*.=warn;\
#       auth,authpriv.none;\
#       cron,daemon.none;\
#       mail,news.none          -/var/log/messages

#
# Emergencies are sent to everybody logged in.
#
*.emerg                         :omusrmsg:*

#
# I like to have messages displayed on the console, but only on a virtual
# console I usually leave idle.
#
#daemon,mail.*;\
#       news.=crit;news.=err;news.=notice;\
#       *.=debug;*.=info;\
#       *.=notice;*.=warn       /dev/tty8
```

其中`auth`这种就是facility（设施），`mail.err`这种就是priority（等级），而这种设置日志记录的位置就是action

```
*.*;auth,authpriv.none          -/var/log/syslog
```

从上面这一个action可以看出普通的日志（`"."`），设置日志记录位置是`/var/log/syslog`，前面`-`表示异步写入

我们使用`logger`命令测试一下

```sh
logger -i -t "my_test" "test_log"
```

使用vim查看`/var/log/syslog`可以看到我们的`logger`的结果

![image-20220818172612033](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220818172612033.png)

`rsyslogd`的内容比较多，后续再补。

### syslog函数

应用程序使用`syslog`函数和`rsyslogd`守护进程进行通讯。

```c
#include <syslog.h>

void openlog(const char *ident, int option, int facility);
void syslog(int priority, const char *format, ...);
void closelog(void);
```

`openlog`用于改变`syslog`默认的输出方式，进行日志结构化

`ident`参数指定的字符串将被添加到日志消息的日期和时间之后，它通常被设置为程序的名字。

`option`参数对后续`syslog`调用的行为进行配置，它可取下列的值

```c
#define	LOG_PID		0x01	/* log the pid with each message */
#define	LOG_CONS	0x02	/* log on the console if errors in sending */
#define	LOG_ODELAY	0x04	/* delay open until first syslog() (default) */
#define	LOG_NDELAY	0x08	/* don't delay open */
#define	LOG_NOWAIT	0x10	/* don't wait for console forks: DEPRECATED */
#define	LOG_PERROR	0x20	/* log to stderr as well */
```

`facility`参数可以修改`syslog`函数中的默认设施值

```c
/* facility codes */
#define	LOG_KERN	(0<<3)	/* kernel messages */
#define	LOG_USER	(1<<3)	/* random user-level messages */
#define	LOG_MAIL	(2<<3)	/* mail system */
#define	LOG_DAEMON	(3<<3)	/* system daemons */
#define	LOG_AUTH	(4<<3)	/* security/authorization messages */
#define	LOG_SYSLOG	(5<<3)	/* messages generated internally by syslogd */
#define	LOG_LPR		(6<<3)	/* line printer subsystem */
#define	LOG_NEWS	(7<<3)	/* network news subsystem */
#define	LOG_UUCP	(8<<3)	/* UUCP subsystem */
#define	LOG_CRON	(9<<3)	/* clock daemon */
#define	LOG_AUTHPRIV	(10<<3)	/* security/authorization messages (private) */
#define	LOG_FTP		(11<<3)	/* ftp daemon */

	/* other codes through 15 reserved for system use */
#define	LOG_LOCAL0	(16<<3)	/* reserved for local use */
#define	LOG_LOCAL1	(17<<3)	/* reserved for local use */
#define	LOG_LOCAL2	(18<<3)	/* reserved for local use */
#define	LOG_LOCAL3	(19<<3)	/* reserved for local use */
#define	LOG_LOCAL4	(20<<3)	/* reserved for local use */
#define	LOG_LOCAL5	(21<<3)	/* reserved for local use */
#define	LOG_LOCAL6	(22<<3)	/* reserved for local use */
#define	LOG_LOCAL7	(23<<3)	/* reserved for local use */
```

`syslog`用于输出日志。

`priority`参数是**设施值和日志级别**的按位与，默认是`LOG_USER`。日志级别有下面几个

```c
#define	LOG_EMERG	0	/* system is unusable */
#define	LOG_ALERT	1	/* action must be taken immediately */
#define	LOG_CRIT	2	/* critical conditions */
#define	LOG_ERR		3	/* error conditions */
#define	LOG_WARNING	4	/* warning conditions */
#define	LOG_NOTICE	5	/* normal but significant condition */
#define	LOG_INFO	6	/* informational */
#define	LOG_DEBUG	7	/* debug-level messages */
```

第二个参数`message`和第三个参数`...`来结构化输出。

`closelog`用于关闭日志

小例子：

```c
#include <syslog.h>
int main(int argc, char **argv)
{
    openlog(argv[0], LOG_CONS | LOG_PID, LOG_USER);
    syslog(LOG_DEBUG, "This is a syslog test message generated by program '%s'\n", argv[0]);
    closelog();
    return 0;
}
```

结果

![image-20220818183131617](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220818183131617.png)

