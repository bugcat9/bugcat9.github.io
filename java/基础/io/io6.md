---
title: java中IO(六)：BufferedReader、Scanner简单讲解
date: 2020-04-02 18:19:26
tags:
- java
categories:
- java
toc: true
---
<!-- # java中IO(六)：BufferedReader、Scanner简单讲解 -->

## 介绍：

> 在io（五）中讲到使用光使用`System.io`进行输入会比较麻烦，所以我们本次介绍`BufferedReader`和`Scanner`来对上面的问题进行解决。
<!--more-->
## 讲解

### 一、BufferedReader类

类的定义：

```java
public class BufferedReader
extends Reader
```

构造方法：

```java
BufferedReader(Reader in)
//Creates a buffering character-input stream that uses a default-sized input buffer.
BufferedReader(Reader in, int sz)
//Creates a buffering character-input stream that uses an input buffer of the specified size.
```

其他方法：

```java
String	readLine()
//Reads a line of text.
```

​		通过类的继承关系和构造函数，大致弄懂了`BufferedReade`r使用的应该是装饰设计模式，增强了`Reader`的功能，在这里为什么要写一下`readLine`这个函数呢，因为这个函数比较好用我们平时使用也比较多。

​		想使用`BufferedReader`解决一下`System.in`的输入问题，那问题来了`System.in`是`InputStream`类型，但是`BufferedReader`接收的是`Reader`类型，按给怎么处理呢？

​		其实也很简单，前面我们介绍转换流`InputStreamReade`r起到了作用。

代码：

```java
public static void main(String[] args) {
      BufferedReader bReader = new BufferedReader(new InputStreamReader(System.in));
      System.out.println("请输入：");
      try {
          String str = bReader.readLine();//默认以回车换行
          System.out.println("刚刚输入的是："+str);
      } catch (IOException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
      }
}
```

结果：

```java
请输入：
hello world
刚刚输入的是：hello world
```

​		这样就能够实现系统的输入了，并且还比较好使用，除此之外BufferedReader可以处理File，也比较方便。

​		但是其实`BufferedReader`也有一个问题：**默认必须是回车换行才算结束**！

​		因为仅仅是回车结束，其实有时候问题也会有些复杂，比如想提取文本中的单词，仅仅使用`BufferedReader`读取每一行之后还需要对每一行进行处理，使用起来也比较麻烦。所以这就显示出了`Scanner`的作用了，`Scanner`对象把回车,空格,tab键都看作输入结束，这样就极大的方便了我们提取信息。

### 二、Scanner类

`Scanner`是java.util包中的东西，并不在java.io包当中，但是用它处理输入流，尤其是系统输入时比较方便的

构造方法：

```java
Scanner(InputStream source)
//Constructs a new Scanner that produces values scanned from the specified input stream.
    
Scanner(InputStream source, String charsetName)
//Constructs a new Scanner that produces values scanned from the specified input stream.
```

可以看到构造方法可以接收输入流。

其他方法：

```java
boolean	hasNext()
//Returns true if this scanner has another token in its input.
    
boolean	hasNextFloat()
//Returns true if the next token in this scanner's input can be interpreted as a float value using the nextFloat() method.
    
boolean	hasNextInt()
//Returns true if the next token in this scanner's input can be interpreted as an int value in the default radix using the nextInt() method.
    
String	next()
//Finds and returns the next complete token from this scanner.
    
float	nextFloat()   
//Scans the next token of the input as a float.
    
int	nextInt()
//Scans the next token of the input as an int.
```

方法只是列出部分，但是光是看这些方法都感觉很顶，所以这也是为什么Scanner取代`BufferedReade`r进行输入流的读取。

代码：

```java
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("请输入：");
        if (scanner.hasNext() ){
            System.out.println("刚刚输入的信息为："+scanner.nextLine());
        }
       
    }
```

结果：

```java
请输入：
hello world
刚刚输入的信息为：hello world
```

可以看到也能实现很简单的系统输入，但是除此之外，`Scanner`还提供了判断是否有int型等功能，使用起来肯定是比`BufferedReader`顺手的。并且`Scanner`也可以处理File输入，所以在很多方面的功能上`BufferedReader`都被`Scanner`取代了。



## 总结

总结了一下`BufferedReade`r和`Scanner`，两者在输入上都有作用，但是一般来说现在使用`Scanner`进行读取更多一些，因为比较方便，但是`BufferedReader`好像在IO读取上效率更高，这个暂时没有研究，如果后面有时间，会再进行研究一下。