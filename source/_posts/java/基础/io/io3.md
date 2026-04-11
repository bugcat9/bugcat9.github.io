---
title: java中IO（三）：内存流简单讲解
date: 2020-04-02 18:19:26
tags:
- java
categories:
- java
toc: true
---
<!-- # java中IO（三）：内存流简单讲解 -->

## 介绍

> 在io(二)当中介绍的都是关于文件进行简单的IO处理，除了文件了IO处理之外，其实还有一种内存的IO操作，对于内存的操作流我们称为内存操作类。内存操作流主要有：ByteArrayInputStream、ByteArrayOutputStream、CharArrayReader、CharArrayWriter这四个类
<!--more-->
## 讲解

### 一、ByteArrayInputStream

类的定义：

```java
public class ByteArrayInputStream
extends InputStream
```

构造函数：

```java
ByteArrayInputStream(byte[] buf)
//Creates a ByteArrayInputStream so that it uses buf as its buffer array.
    
ByteArrayInputStream(byte[] buf, int offset, int length)
//Creates ByteArrayInputStream that uses buf as its buffer array
```

可以看得出来`ByteArrayInputStream`继承自`InputStream`,并且他接收一个字节数组`byte[]`进行初始化。文档上描述是`ByteArrayInputStream`包含一个内部缓冲区，该缓冲区包含可以从流中读取的字节。内部计数器跟踪由read方法提供的下一个字节。

代码：

```java
 public static void main(String[] args) {
        
        try {
            String str = "hellow world";
            //实例化时，将你需要的数据保存到内存当中
            InputStream inputStream = new ByteArrayInputStream(str.getBytes());
            byte[] b = new byte[20];

            int temp = inputStream.read(b);
            System.out.println("读取的字节数:"+temp);
            System.out.println("读取的内容:"+new String(b));
			inputStream.close();
        } catch (IOException e) {
            //TODO: handle exception
            System.out.println(e);
        }
}
```

结果：

```java
读取的字节数:12
读取的内容:hellow world
```

发现用法其实和前面讲的文件类io操作差不多，而且功能似乎也挺鸡肋。

### 二、ByteArrayOutputStream

类的定义：

```java
public class ByteArrayOutputStream
extends OutputStream
```

构造函数：

```java
ByteArrayOutputStream()
//Creates a new byte array output stream.

ByteArrayOutputStream(int size)
//Creates a new byte array output stream, with a buffer capacity of the specified size, in bytes.
```

可以看得出来`ByteArrayOutputStream`是继承自`OutputStream`,用法和前面的讲解的`FileOutputStream`类似，**个人觉得**区别是`FileOutputStream`是将字节数组写到文件当中，而`ByteArrayOutputStream`将字节数组写到内存缓冲区当中，因为功能比较鸡肋，对应的代码也不展示了。文档上的描述为此类实现输出流，在该流中，数据被写入字节数组。缓冲区随着数据写入自动增长。可以使用toByteArray（）和toString（）检索数据。

### 三、CharArrayReader

类的定义：

```java
public class CharArrayReader
extends Reader
```

构造函数：

```java
CharArrayReader(char[] buf)
//Creates a CharArrayReader from the specified array of chars.
CharArrayReader(char[] buf, int offset, int length)
//Creates a CharArrayReader from the specified array of chars.
```

文档上描述为此类实现了可用作字符输入流的字符缓冲区。其实和上面的`ByteArrayInputStream`类型。



### 四、CharArrayWriter

类的定义：

```jaav
public class CharArrayWriter
extends Writer
```

构造函数：

```java
CharArrayWriter()
//Creates a new CharArrayWriter.
    
CharArrayWriter(int initialSize)
//Creates a new CharArrayWriter with the specified initial size.
```

文档上的描述：此类实现了可用作Writer的字符缓冲区。将数据写入流时，缓冲区会自动增长。可以使用toCharArray（）和toString（）检索数据。有些类似于上面的`ByteArrayOutputStream`



## 总结

这四个内存流的操作都比较简单，使用也不是很多，所以写的也比较水了解一下即可。在以前好像是使用文件流和内存流一起来读取文件，但是随着java不断地更新出现了许多更好地方法，所以内存流使用地也少了起来，个人觉得了解一下即可。

