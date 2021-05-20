[toc]

## 介绍

> java的io是一个比较复杂的内容，其中的各种各样的类也是错中复杂，但是最主要的类还是可以分为4个类别：Inputstream、Outstream、Reader、Writer，其中Inputstream、Outstream属于字节流，Reader、Writer属于字符流。

## 讲解

### 一、Inputstream

从java文档当中找到`java.io.InputStream`，可以发现`InputStream`相关的定义：

```java
public abstract class InputStream
extends Object
implements Closeable
```

相关函数：

```java
abstract int read()
//Reads the next byte of data from the input stream.

int	read(byte[] b)
//Reads some number of bytes from the input stream and stores them into the buffer array b.

int	read(byte[] b, int off, int len)
//Reads up to len bytes of data from the input stream into an array of bytes.
    
void	close()
//Closes this input stream and releases any system resources associated with the stream.
```

可以发现该类是一个抽象类，并且实现了接口`Closeable`。进而结合文档描述可以明白此抽象类是表示字节输入流的所有类的超类（父类），想要在程序中使用该类，就需要定义InputStream的子类，并且子类需要实现抽象函数`int read()`。



### 二、OutputStream

从java文档当中找到`java.io.OutputStream` 可以发现`OutputStream`相关的定义：

```java
public abstract class OutputStream
extends Object
implements Closeable, Flushable
```

相关函数：

```java
void	close()
//Closes this output stream and releases any system resources associated with this stream.
    
void	flush()
//Flushes this output stream and forces any buffered output bytes to be written out.
    
void	write(byte[] b)
//Writes b.length bytes from the specified byte array to this output stream.
    
void	write(byte[] b, int off, int len)
//Writes len bytes from the specified byte array starting at offset off to this output stream.
    
abstract void	write(int b)
//Writes the specified byte to this output stream.
```

跟`Inputstream`一样，该类也是一个抽象类，实现了接口`Closeable`和`Flushable`。进而结合文档描述可以知道该抽象类是表示字节输出流的所有类的超类(父类)。输出流接受输出字节并将其发送到某个接收器。在程序中使用该类 需要定义OutputStream子类，并且该类需要实现抽象方法`void write(int b)`。



### 三、Reader

从java文档当中找到`java.io.Reader`，可以发现`Reader`相关的定义：

```java
public abstract class Reader
extends Object
implements Readable, Closeable
```

相关函数：

```java
int	read()
//Reads a single character.
    
int	read(char[] cbuf)
//Reads characters into an array.
    
abstract int	read(char[] cbuf, int off, int len)
//Reads characters into a portion of an array.
    
abstract void	close()
//Closes the stream and releases any system resources associated with it.
```

和上面两个类一比发现其实差不太多，也是一个抽象类，实现了接口`Readable`和`Closeable`。进而结合文档描述可以知道该类是读取字符流的抽象类。子类必须实现的抽象方法是read（char []，int，int）和close（）。但是，大多数子类将覆盖此处定义的某些方法，以提供更高的效率和/或附加功能。



### 四、Writer

从java文档当中找到`java.io.Writer`，可以发现`Writer`相关的定义：

```java
public abstract class Writer
extends Object
implements Appendable, Closeable, Flushable
```

相关函数：

```java
abstract void	close()
//Closes the stream, flushing it first.
    
abstract void	flush()
//Flushes the stream.
    
void	write(char[] cbuf)
//Writes an array of characters.
    
abstract void	write(char[] cbuf, int off, int len)
//Writes a portion of an array of characters.
    
void	write(int c)
//Writes a single character.
    
void	write(String str)
//Writes a string.
    
void	write(String str, int off, int len)
//Writes a portion of a string.
```

从上向下看来，也就明白了`Writer`肯定也是一个抽象类，实现了`Appendable、Closeable、Flushable`这三个接口，然后再结合文档可知该类是用于写入字符流的抽象类。子类必须实现的抽象方法是write（char []，int，int），flush（）和close（）。但是，大多数子类将覆盖此处定义的某些方法，以提供更高的效率或附加功能。



## 总结

java中的io类大多都是从这四个类派生而来，所以先介绍下这四个类其实有利于理清很多东西。其中Inputstream、Outstream是一类，操作的主要是字节数组byte[]；而Reader、Writer是一类，操作的主要是字符数组char[]。