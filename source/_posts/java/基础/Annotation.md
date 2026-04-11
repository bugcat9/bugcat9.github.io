---
title:  jdk内置 Annotation（注解）
date: 2020-03-25 15:19:26
tags:
- java
categories:
- java
toc: true
---

<!-- #  jdk内置 Annotation（注解） -->

## 介绍

> Annotation（注解）是为了解决项目中配置文件太多而导致开发复杂而产生的，jdk内置的注解有三个：@Override、@Deprecated、@SuppressWarnings
<!--more-->
## 讲解

### 一、重写注解：@Override

重写注解平时见的比较多，在这里不过多讲解。

### 二、过期注解：@Deprecated

在版本更新的时候，我们可能提供新的方法用于替代之前的方法， 这时候我们最好把老的方法标注为过期， 不推荐使用， 否则时间久了自己也会忘记哪个方法是新的。java的jdk当中就有许多过期注解，提示我们此方法不推荐使用了，建议使用新的方法。

如：Sting的一个构造函数

```java
@Deprecated
public String(byte[] ascii,int hibyte)
//Deprecated. This method does not properly convert bytes into characters. As of JDK 1.1, the preferred way to do this is via the String constructors that take a Charset, charset name, or that use the platform's default charset.
```

使用时会出现一个~~删除线~~：

<img src="https://gitee.com/ning_zhou/BlogImage/raw/master/java/Annotation.png" alt="image-20200325194432573" style="zoom:80%;" />



例子：

```java
class Person{
    @Deprecated
    void fun(){
        //举例，无实际意义
        //旧方法，不推荐使用
    }

    void fun1(){
         //举例，无实际意义
         //新方法推荐使用
    }
}
```

### 三、压制警告注解@SuppressWarnings

压制警告注解是为了去掉java使用时出现的警告，个人感觉是给强迫症用户使用的，具体使用为`@SuppressWarnings("参数")`，参数可以参考[这篇文章](https://blog.csdn.net/mingxu_W/article/details/89388031)。

例子：

<img src="https://gitee.com/ning_zhou/BlogImage/raw/master/java/Annotation2.png" alt="image-20200325195922701" style="zoom:80%;" />



## 总结

jdk内置 Annotation比较重的有这三个，其中重写注解使用比较多，后面两个了解一下即可。