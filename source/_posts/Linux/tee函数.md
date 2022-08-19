---
title: tee函数
date: 2022-08-19 15:24:30
tags:
- Linux
- Linux高性能服务器编程
categories:
- Linux
---

# tee函数

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

<!--more-->

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