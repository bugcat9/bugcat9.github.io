# spring中bean的作用域

## 简介

spring中的bean有作用域的限制，平时我们可能不经常使用，但是作为学习我们还是需要学习一下

## 讲解

平时我们创建spring的时候可能如下：

```xml
<bean id="user" class="com.zhouning.spring.beans.User" scope="singleton">
    <constructor-arg index="0"  value="张三"></constructor-arg>
</bean>
```

其中`scope`代表的就是作用域，作用域比较常见的有：singleton、prototype等

* singleton

  单例，整个容器当中只有一个对象的实例，默认情况下bean的作用域就是单例

* prototype

  原型，每次获取bean都会产生一个新的对象

* request

  每次请求时都会创建一个新的对象

* session

  在会话范围内时一个对象

* global session

  只在portlet下有用

* application

  在应用范围中一个对象