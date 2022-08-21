---
title: UID、EUID、GID和EGID
date: 2022-08-21 21:06:30
tags:
- Linux
- Linux高性能服务器编程
categories:
- Linux
---

# UID、EUID、GID和EGID

Linux中id真是太多了进程有pid，然后用户还有UID这种，真是有点绕。

在Linux当中一个进程（程序）拥有四个ID:真实用户`UID`、有效用户`EUID`、真实组`GID`和有效组`EGID`。

这里以真实用户`UID`和有效用户`EUID`为例，真实组`GID`和有效组`EGID`道理是相同的。

`EUID`存在的目的是**方便资源访问**:它使得运行程序的用户拥有该程序的有效用户的权限（太过官方这种说法感觉）。`EUID`确定进程对某些资源和文件的访问权限。在大多数情况下，进程的`UID`和`EUID`是一样的，但是对于一些程序如`su`、`passwd`这种`set-user-id`程序，它们有可能是不相同的。对于`set-user-id`程序而言，程序的`EUID`会变成**程序的所有者**的`UID`，也就是说程序执行时，是以**程序的所有者身份**进行运行的。

以`passwd`为例。`passwd`允许用户修改自己的登录密码，这个**程序的所有者**是`root`，`passwd`权限中有`s`，表明这是一个`set-user-id`程序。`passwd`命令需要修改`/etc/shadow`文件，对于`/etc/shadow`文件，普通用户是不可写（只有读权限）的，那么用户怎么能够通过`passwd`修改自己的密码呢，`set-user-id`程序的标志`s`就起到了作用，它在程序运行时将`EUID`会变成**程序的所有者**的`UID`，那么程序有效的用户就会变成**程序的所有者**，在这里是`root`用户，理所当然的可以进行`/etc/shadow`文件的修改。

![image-20220819104851240](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220819104851240.png)



再比如`su`程序允许任何用户都可以使用它来修改自己的账户信息，但修改账户时程序不得不访问文件`/etc/passwd`文件，而访问该文件是需要`root`权限的。那么以**普通用户身份**启动的`su`程序如何能访问`/etc/passwd`文件呢？

![image-20220819130924743](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220819130924743.png)

`su`程序的所有者是`root`，并且它被设置了`set-user-id`标志。和上面`passwd`一样，`set-user-id`标志表示任何普通用户运行`su`程序时，其有效用户就是该程序的**所有者**`root`。

获取和设置真实用户`UID`、有效用户`EUID`、真实组`GID`和有效组`EGID`的函数如下

```c
#include <unistd.h>
#include <sys/types.h>

uid_t getuid(void);
uid_t geteuid(void);
gid_t getgid(void);
gid_t getegid(void);
int setuid(uid_t uid);
int seteuid(uid_t euid);
int setgid(gid_t gid);
int setegid(gid_t egid);
```

为了测试上面所说，我们先创建一个普通用户`bugcat`，目前已经有普通用户`ubuntu`。

可以看到`bugcat`的uid是`1002`

![image-20220819140826977](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220819140826977.png)

我们写下读取程序`uid`和`euid`的代码如下：

```c
#include <unistd.h>
#include <stdio.h>

int main()
{
    uid_t uid = getuid();
    uid_t euid = geteuid();
    printf( "userid is %d, effective userid is: %d\n", uid, euid );
    return 0;
}
```

将其编译一下，然后查看查看文件属性，再运行程序，可以看到`uid`和`euid`输出相同，表示**真实用户**和**有效用户**都是`ubuntu`

![image-20220819141010532](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220819141010532.png)

接着再将程序的所有者改为`root`，再加上`s`权限，再运行程序，可以看到`uid`和`euid`输出不相同，表示**真实用户**是`ubuntu`，**有效用户**是`root`（符合`set-user-id`程序特点）

![image-20220819141209028](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220819141209028.png)

然后将程序的所有者改为`bugcat`（s权限不知道为啥自动取消了），再加上`s`权限，再运行程序，可以看到`uid`和`euid`输出不相同，表示**真实用户**是`ubuntu`，**有效用户**是`bugcat`

![image-20220819141405860](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220819141405860.png)

最后我们去掉`s`权限，运行程序，可以看到`uid`和`euid`输出相同，表示**真实用户**和**有效用户**都是`ubuntu`，也从反面说明`s`权限的作用。

![image-20220819142209993](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/Linux/image-20220819142209993.png)

