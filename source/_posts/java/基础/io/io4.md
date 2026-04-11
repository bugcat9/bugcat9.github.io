---
title: java中IO（四）：打印流简单讲解
date: 2020-04-02 18:19:26
tags:
- java
categories:
- java
toc: true
---
<!-- # java中IO（四）：打印流简单讲解 -->

## 介绍

> 打印流主要解决的就是`OutputStream`的一些问题，属于`OutputStream`功能的加强版。
>
> 比如：我们只是通过程序向终端输出一些信息，如果使用`OutputStream`就会产生一些问题,所以数据必须转变为字节数组再输出，输出int、double等类型就不是很方便。这时候我们使用打印流就方便很多。打印流主要是两个类：`PrintStream`和`PrintWriter`
<!--more-->
## 讲解：

### 一、PrintStream

* 类的继承关系：

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io4.png" alt="io4" style="zoom:80%;" />

可以看到`PrintStream`是继承`FilterOutputStream`的，而`FilterOutputStream`是继承`OutputStream`的，所以可以将`PrintStream`看作`OutputStream`的子类



* 类的构造函数如下：

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io5.png" alt="io5" style="zoom:80%;" />

可以看到`PrintStream`接收一个`OutputStream`类或者其子类作为参数。

* 其他方法：

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io6.png" alt="io6" style="zoom:80%;" />

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io7.png" alt="io7" style="zoom:80%;" />

截取部分方法展示一下，就是为了说明`PrintStream`可以将一些常见类型作为输入，不仅仅是字节数组。

* 小结

  结合文档内容，`PrintStream`将功能添加到另一个输出流，即可以方便地打印各种数据值的表示形式的功能，还提供了其他两个功能。与其他输出流不同，`PrintStream`永远不会抛出`IOException`。相反，在特殊情况下，只需设置一个内部标志即可通过`checkError`方法进行测试，可以创建`PrintStream`以便自动刷新。这意味着在写入字节数组，调用`println`方法之一或写入换行符或字节`（'\ n'）`之后，将自动调用`flush`方法。 由`PrintStream`打印的所有字符都使用平台的默认字符编码转换为字节。

代码演示：

```java
public static void main(String[] args) {
        
        try {
            PrintStream pStream = new PrintStream(new FileOutputStream(new File("test.txt")));
            //支持多种类型
            pStream.println("hellow world");
            pStream.println(11);
            pStream.printf("姓名：%s,年龄： %d,存款： %f", "zn",20,10.5);//支持字符串格式化
            pStream.close();

        } catch (FileNotFoundException e) {
            //TODO: handle exception
            System.out.println(e);
        }
      
    }
```

最终结果：

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io8.png" alt="io8" style="zoom:80%;" />

### 二、PrintWriter

* 类的继承关系

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io9.png" alt="io9" style="zoom:80%;" />

​	可以看到`PrintWriter`是直接继承自`Writer`。

* 类的构造函数

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io10.png" alt="io10" style="zoom:80%;" />

​	可以看到`PrintWriter`接收一个`OutputStream`类（或者其子类）、`Writer`类（或者其子类）作为参数。

* 其他方法

  跟上面的`PrintStream`差不多，在这里不多介绍了。



代码演示：

```java
 public static void main(String[] args) {
        try {
            PrintWriter pWriter = new PrintWriter(new FileOutputStream(new File("test.txt")));
            pWriter.println("hellow world");
            pWriter.println(456);
            pWriter.printf("姓名：%s,年龄： %d,存款： %f", "zn",22,1555.5465);//支持字符串格式化
            pWriter.close();

        } catch (FileNotFoundException e) {
            //TODO: handle exception
            System.out.println(e);
        }
}
```

结果：

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io11.png" alt="io11" style="zoom:80%;" />

## 总结

打印流使用起来比较简单，其实就是对`OutputStream`的一种封装，扩充了它的功能，其实在底层都是使用`ValueOf`将其转化成String然后再做处理。如果有机会后面会写一下这个类的设计模式，希望会填这个坑。

