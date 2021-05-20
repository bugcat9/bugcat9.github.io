

# Spring配置文件

## 介绍

对自己学习的spring的简单配置做一下小总结，后面有可以继续加

## 一、设置别名

bean.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
<!--    有了id-->
    <bean id="user" name="u2 u3,u4;u5" class="com.zhouning.spring.beans.User">
        <constructor-arg index="0"  value="张三"></constructor-arg>
    </bean>
<!--    设置别名-->
    <alias name="user" alias="u1"></alias>
</beans>
```

* `id`是`bean`的标识符，如果设置需要唯一(就是说不能同时设置两个`id`一样的`bean`)。
* 如果没有设置`id`，但是设置了`name`，那么`name`是`bean`的默认标识符（充当`id`的作用）。
* 如果又设置了`id`，又设置了`name`那么`name`就是别名，这时可以设置多个别名，使用分隔符空格、逗号、分号隔开。
* `alias`也是设置别名用的，用法如上。
* 如果不配置`id`也不配置`name`，那么可以根据`applicationContext.getBean(class)`获取对象。

### 二、通过import导入别人的配置文件

```xml
 <import resource="applicationContext.xml"></import>
```

这个是在团队协作的时候使用的



## 总结

目前就只写了，两个以后需要注意的时候再慢慢加。

