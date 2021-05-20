# Linux进程相关命令

在学习linux的时候学习了不少和Linux进程相关的命令，尤其是自己使用的时候杀死进程的时候，总是忘记命令是什么，所以记录一下方便下次查找。



## 查看端口占用情况

经常我们会遇到端口被占用问题，所以需要查端口占用的相关情况

### lsof

lsof(list open files)是一个列出当前系统打开文件的工具。

lsof 查看端口占用语法格式：

```shell
lsof -i:端口号
```

实例

查看服务器 22端口的占用情况：

```
# lsof -i:22
COMMAND   PID USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
sshd     1111 root    3u  IPv4    16523      0t0  TCP *:ssh (LISTEN)
sshd    12066 root    3u  IPv4 24092869      0t0  TCP iZ8vbioeatvps0cfkljfgwZ:ssh->171.41.72.35:58305 (ESTABLISHED)

```

可以看到22端口被ssh占用，并且能看到进程号

更多 lsof 的命令如下：

```
lsof -i:8080：查看8080端口占用
lsof abc.txt：显示开启文件abc.txt的进程
lsof -c abc：显示abc进程现在打开的文件
lsof -c -p 1234：列出进程号为1234的进程所打开的文件
lsof -g gid：显示归属gid的进程情况
lsof +d /usr/local/：显示目录下被进程开启的文件
lsof +D /usr/local/：同上，但是会搜索目录下的目录，时间较长
lsof -d 4：显示使用fd为4的进程
lsof -i -U：显示所有打开的端口和UNIX domain文件
```

### netstat

netstat -tunlp 用于显示 tcp，udp 的端口和进程等相关情况。

netstat 查看端口占用语法格式：

```
netstat -tunlp | grep 端口号
```

- -t (tcp) 仅显示tcp相关选项
- -u (udp)仅显示udp相关选项
- -n 拒绝显示别名，能显示数字的全部转化为数字
- -l 仅列出在Listen(监听)的服务状态
- -p 显示建立相关链接的程序名

例如查看 8000 端口的情况，使用以下命令：

```
#netstat -tunlp | grep 22
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      1111/sshd
```

更多命令：

```
netstat -ntlp   //查看当前所有tcp端口
netstat -ntulp | grep 80   //查看所有80端口使用情况
netstat -ntulp | grep 3306   //查看所有3306端口使用情况
```

### kill

在查到端口占用的进程后，如果你要杀掉对应的进程可以使用 kill 命令：

```
kill -9 PID
```

如上实例，我们看到 8000 端口对应的 PID 为 26993，使用以下命令杀死进程：

```
kill -9 26993
```

## 查看进程相关信息

### ps

查看进行使用的指令是  ps ,一般来说使用的参数是 `ps -aux`

ps显示信息选项

| 字段 | 说明              |
| ---- | ----------------- |
| PID  | 进程号            |
| TTY  | 终端机号          |
| Time | 此进程占用cpu时间 |

ps -a: 显示当前终端所有进程信息

ps -u:以用户的格式显示进程信息

ps -x:显示后台进程运行的参数

`ps -aux|grep xxx`得到进程相关信息

```
ps -aux|grep sshd
root      1111  0.0  0.0 112864  2728 ?        Ss   May10   0:00 /usr/sbin/sshd -D
root     12066  0.0  0.1 157276  5920 ?        Ss   17:54   0:00 sshd: root@pts/0
root     14675  0.0  0.0 112816   968 pts/0    S+   18:42   0:00 grep --color=auto sshd
```

`ps -ef` 是以全格式显示当前所有的进程

-e 显示所有进程 -f 全格式

```
 ps -ef|grep sshd
root      1111     1  0 May10 ?        00:00:00 /usr/sbin/sshd -D
root     12066  1111  0 17:54 ?        00:00:00 sshd: root@pts/0
root     15094 12068  0 18:50 pts/0    00:00:00 grep --color=auto sshd

```

### lsof

```
lsof -i | grep pid #根据进程pid查端口
```

 ### netstat

```
netstat -nap | grep pid
```

