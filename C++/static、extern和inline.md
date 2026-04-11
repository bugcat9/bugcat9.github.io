---
title: static、extern和inline
date: 2023-08-05 20:40:11
tags:
categories:
- C++
---
# static、extern和inline
在实习写C++的时候遇到static、extern和inline相关的概念和使用，记录一下
<!--more-->
## static
`static`关键字作用很多，这里主要说明`static`变量。`static`变量生命周期是整个程序，可见性是文件可见(这些都是很基础的知识)
但是需要注意的是假如我们在头文件中定义了一个`static`变量（这里假设为`staticVar`），那么包含这个头文件的文件都会有这样一个变量`staticVar`不会发生冲突。这个特性有时候有用，**但是绝大多数情况还是没有用的，而且会浪费空间，不建议使用**。
```c++
// 头文件A.h 
static int staticVar = 0;

// 源文件B.cpp
#include "A.h" // B.cpp中包含一个 staticVar

// 源文件C.cpp
#include "A.h" // C.cpp中包含一个 staticVar

```
## extern
`extern`关键字在C++中用来声明全局变量，它用来告诉编译器，这个变量在其他文件中定义的，以避免重复定义。
```c++
// 源文件 A.cpp
int globalVariable = 10; // 定义全局变量

// 源文件 B.cpp
extern int globalVariable; // 声明全局变量

int main() {
  // 使用全局变量
  globalVariable = 20;
  return 0;
}
```
有的时候我们可以在头文件中使用`extern`来**声明**一个变量，在某个源文件中进行定义，然后其他包含这个头文件的源文件就都有这个变量的声明，它们共享一份内容。

## inline

`inline`关键字修饰函数，用于向编译器提供函数内联的建议，但是我没有想到`inline`关键字可以解决跨模块（动态库）的使用函数的问题。
比如我有一个动态库A（A.dll）和一个动态库B（B.dll）,动态库B使用了A里面的函数，但是B在链接的时候A还没有编译，这个时候可以将A里面的函数加上`inline`进行修饰，就不会报符号找不到的问题。
底层来看是因为`inline`关键字修饰的函数，在调用的时候会进行展开，这样就不会查找这个符号，但是这个特性确实有时候可以解决这样类似的编译问题。

