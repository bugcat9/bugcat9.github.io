[toc]

## 介绍

> 在IO（一）当中介绍了四个父类，但是四个类都是抽象类，无法直接使用，所以本次讲解一下可以直接使用FileInputstream、FileOutstream、FileReader、FileWriter等，还会讲解一下InputStreamReader和OutputStreamWriter


## 讲解

### 一、FileInputstream

该流用于从文件读取数据，它的对象可以用关键字 new 来创建。有多种构造方法可用来创建对象。可以使用字符串类型的文件名来创建一个输入流对象来读取文件,也可以使用一个文件对象来创建一个输入流对象来读取文件。

代码：

```java
public static void main(String[] args) {
        File f = new File("hello.txt");
        try {
            //通过字符串
            //InputStream in = new FileInputStream("hello.txt");
            
            //通过File文件对象
            InputStream in = new FileInputStream(f);
            byte [] b = new byte[20];
            int temp = in.read(b);
			//只展示此函数的功能，其他的相关函数请查找文档
            System.out.println("读取的字节数:"+temp);
            //字节数组需要转化为字符串再进行输出
            System.out.println("读取的内容:"+new String(b));
			in.close();
        } catch (IOException e) {
            //TODO: handle exception
            System.out.println(e);
        }
}
```

其中"hello.txt"中的内容为`hello world`,总共**11**个字节

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io1.png" alt="io1" style="zoom:80%;" />

输出：

```java
读取的字节数:11
读取的内容:hello world
```

可以体会到相对应的功能。在实际写代码当中`int read(byte[] b) throws IOException{}`这个方法使用的频率最高，也可以看出该函数的功能是从输入流读取b.length长度的字节,并且返回读取的字节数（可能小于b.length），如果是文件结尾则返回-1。

### 二、FileOutputStream

该类用来创建一个文件并向文件中写数据。如果该流在打开文件进行输出前，目标文件不存在，那么该流会创建该文件。有两个构造方法可以用来创建 FileOutputStream 对象。使用字符串类型的文件名来创建一个输出流对象，也可以使用一个文件对象来创建一个输入流对象来读取文件。

代码：

```java
public static void main(String[] args) {
        File f = new File("test.txt");
        try {
            OutputStream out = new FileOutputStream(f);
            String s = "test FileOutputStream";
            byte [] b = s.getBytes();
            out.write(b);
            out.close();

        } catch (IOException e) {
            //TODO: handle exception
            System.out.println(e);
        }
}
```

最终test.txt的上的结果为：

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io2.png" alt="io2" style="zoom:80%;" />



上面只是简单的讲解了一下用法，如果想要深入了解其他方法可以自行查找文档。

### 三、InputStreamReader和OutputStreamWriter

为什么需要先讲InputStreamReader和OutputStreamWriter呢？

InputStreamReader是直接继承自Reader的一个类，而OutputStreamWriter是直接继承Writer，想要弄清楚FileReader、FileWriter就必须先了解InputStreamReader、OutputStreamWriter，因为其实FileReader、FileWriter分别是继承自InputStreamReader、OutputStreamWriter的。因为实际总线中流动的只有字节流，所以字节流的InputStream和OutputStream是一切的基础，Java中负责从字节流向字符流解码的桥梁是**InputStreamReader**、**OutputStreamWriter**

#### 1.InputStreamReader

```java
public class InputStreamReader
extends Reader
```

构造函数：

```java
InputStreamReader(InputStream in)
//Creates an InputStreamReader that uses the default charset.
    
InputStreamReader(InputStream in, Charset cs)
//Creates an InputStreamReader that uses the given charset.
    
InputStreamReader(InputStream in, CharsetDecoder dec)
//Creates an InputStreamReader that uses the given charset decoder.
    
InputStreamReader(InputStream in, String charsetName)
//Creates an InputStreamReader that uses the named charset.
```

通过构造函数可以看到InputStreamReader通过接收一个InputStream，也证明了InputStreamReader是从字节流到字符流的桥梁：它读取字节，并使用指定的字符集将它们解码为字符。它使用的字符集可以按名称指定，也可以明确指定，也可以接受平台的默认字符集。 InputStreamReader的read（）方法之一的每次调用都可能导致从基础字节输入流中读取一个或多个字节。为了实现字节到字符的有效转换，与满足当前读取操作所需的字节相比，可以从基础流中提前读取更多的字节。



#### 2.OutputStreamWriter

```java
public class OutputStreamWriter
extends Writer
```

构造函数：

```java
OutputStreamWriter(OutputStream out)
//Creates an OutputStreamWriter that uses the default character encoding.
    
OutputStreamWriter(OutputStream out, Charset cs)
//Creates an OutputStreamWriter that uses the given charset.
    
OutputStreamWriter(OutputStream out, CharsetEncoder enc)
//Creates an OutputStreamWriter that uses the given charset encoder.
    
OutputStreamWriter(OutputStream out, String charsetName)
//Creates an OutputStreamWriter that uses the named charset.
```

通过构造函数可以看到OutputStreamWriter通过接收一个OutputStream。也证明了OutputStreamWriter是从字符流到字节流的桥梁：使用指定的字符集将写入其中的字符编码为字节。它使用的字符集可以按名称指定，也可以明确指定，也可以接受平台的默认字符集。 每次调用write（）方法都会导致在给定字符上调用编码转换器。生成的字节在写入底层输出流之前先在缓冲区中累积。可以指定此缓冲区的大小，但是默认情况下，它对于大多数用途来说足够大。请注意，传递给write（）方法的字符不会被缓冲。



### 四、FileReader

FileReader是直接继承自InputStreamReader的，FileReader的构造方法和FileInputstream差不多，在这里就不展开细讲。

```java
public static void main(String[] args) {
        File f = new File("hello.txt");
        try {
            Reader reader = new FileReader(f);
            char[] cbuf = new char[20];
            int temp = reader.read(cbuf);
            //只展示此函数的功能，其他的相关函数请查找文档
            System.out.println("读取的字符数:"+temp);
            //字节数组需要转化为字符串再进行输出
            System.out.println("读取的内容:"+new String(cbuf));
			reader.close();

        } catch (IOException e) {
            //TODO: handle exception
            System.out.println(e);
        }
}
```

hello.txt中内容和上面相同

最终结果：

```java
读取的字符数:11
读取的内容:hello world
```



### 五、FileWriter

FileWriter直接继承自OutputStreamWriter，FileWriter的构造方法和FileOutputStream差不多，在这里就不展开细讲。

```java
public static void main(String[] args) {
        File f = new File("test.txt");
        try {
            Writer writer = new FileWriter(f);
            String s = "test FileWriter";
            writer.write(s);
            writer.close();

        } catch (IOException e) {
            //TODO: handle exception
            System.out.println(e);
        }
}
```

最终test.txt的上的结果为：

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/io3.png" alt="io3" style="zoom:80%;" />





## 总结

总结了一下java对于文件io的简单操作，除了文件io还有内存流处理，输入类输出类等还需要进行总结。