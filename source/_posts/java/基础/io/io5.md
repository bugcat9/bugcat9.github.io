---
title: java中IO（五）：系统输入输出讲解
date: 2020-04-02 18:19:26
tags:
- java
categories:
- java
toc: true
---
<!-- # java中IO（五）：系统输入输出讲解 -->

## 介绍

> 在io（四）当中，我们发现`PrintStream`、`PrintWriter`中的各种方法和`System`中的许多方法相同，比如：`print()、println()`,所以本次就讲讲java系统的输入输出。
<!--more-->
## 讲解

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io12.png" alt="io12" style="zoom:80%;" />

我们观察System中字段信息，发现有三个字段信息，包括`err、in、out`,我们较常用就是`in和out`，下面进行讲解。

### 一、out和err

* out:

  `PrintStream` 类型，“标准”输出流。该流已经打开并且准备接受输出数据。通常，此流对应于显示输出或主机环境或用户指定的另一个输出目标。 对于简单的独立Java应用程序，写一行输出数据的典型方法是：`System.out.println(data)`，请参见类PrintStream中的println方法。

  

* err:

  `PrintStream`类型，“标准”错误输出流。该流已经打开并且准备接受输出数据。 通常，此流对应于显示输出或主机环境或用户指定的另一个输出目标。按照约定，即使主要输出流（变量out的值）已重定向到文件或其他目标位置，该输出流也用于显示错误消息或其他信息，这些信息应引起用户的立即注意。通常不会持续监控。

  

  例子代码：

```java
public static void main(String[] args) {
        
    try {
        System.err.println("hello world");
        Integer.parseInt("abc");
    } catch (Exception e) {
        //TODO: handle exception
        System.err.println(e);
        System.out.println(e);
    }
}
```

结果：

```java
hello world
java.lang.NumberFormatException: For input string: "abc"
java.lang.NumberFormatException: For input string: "abc"
```

发现结果一样。其实在现在`System.err`和`System.out`没有什么区别，但是人们更习惯于使用`System.out`，并且`System.out`作为打印流的实例，本质上也是`OutputStream`，也可以使用`write(`进行输出，不过输出在屏幕上而已。

### 二、in

 		标准”输入流，`InputStream`类型。该流已经打开，可以提供输入数据了。通常，此流对应于键盘输入或主机环境或用户指定的另一个输入源。

​		看他是`InputStream`类型，是否可以通过java的io模式进行输入呢？

​		是肯定可以的，但是会有一些问题，比如我们利用一个字节数组，然后利用System.in的read函数进行读入，就可以完成。如下：

```java
 public static void main(String[] args) {
       InputStream iStream = System.in;
       byte[] data = new byte[1024];
       try {
            System.out.print("请输入：");
           int temp = iStream.read(data);//读取数据
           System.out.println("刚才输入的是:"+new String(data));
            
       } catch (IOException e) {
           // TODO Auto-generated catch block
           e.printStackTrace();
       }
       
    }
```

结果：

```java
请输入：hello world
刚才输入的是:hello world
```

这样似乎完成了键盘的输入，但是我们发现开辟的字节数组是定长，如果万一输入的长度超过了字节数组的长度，就会造成数据读取不完整，只能接收部分。当然我们可以使用`StringBuilder`或者内存流配合着使用,达到我们随意输入的目的，但是太过麻烦，java为此出现了`Scanner`,解决了`System.in`的输入问题（关于`Scanner`的内容我选择放到下节再总结）。

## 总结

java中系统输入输出也是java中的io问题，本次简单的总结了一下输入输出流的问题。

