# spring中bean的自动装配

## 简介

为了解决bean每次都配置的那么麻烦，spring提供了一个自动装配的功能，个人感觉功能页有一些鸡肋

## 讲解

假设我们有一个User类，然后里面有两个属性分别是名字和地址

User:

```java
package com.zhouning.spring.beans;

public class User {

    private String name;
    private Address address;

    public void setName(String name) {
        this.name = name;
    }
    public User() {}
    public User(Address address) {
        this.address = address;
    }
    
    public void setAddress(Address address) {
        this.address = address;
    }

    @Override
    public String toString() {
        return "User{" +
                "name='" + name + '\'' +
                ", address=" + address +
                '}';
    }
}

```

Address:

```java
package com.zhouning.spring.beans;

public class Address {
    String addr;

    @Override
    public String toString() {
        return "Address{" +
                "addr='" + addr + '\'' +
                '}';
    }

    public void setAddr(String addr) {
        this.addr = addr;
    }

    public Address() {
    }

    public Address(String addr) {
        this.addr = addr;
    }
}

```

三种方法：

* byName

  根据名称(set方法)去查找对应的bean，如果有则装配

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <beans xmlns="http://www.springframework.org/schema/beans"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
  
      <bean id="address" class="com.zhouning.spring.beans.Address" >
          <property name="addr" value="武汉"></property>
      </bean>
  
      <bean id="user" class="com.zhouning.spring.beans.User" autowire="byName">
          <property name="name" value="张三"></property>
      </bean>
  </beans>
  ```

  对应着User里面的` public void setAddr(String addr) `

* byType

  更加类型进行自动装配，不需要管bean的id，但是一种类型的bean只能有一个,不然会报错。

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <beans xmlns="http://www.springframework.org/schema/beans"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
  
      <bean id="address" class="com.zhouning.spring.beans.Address" >
          <property name="addr" value="武汉"></property>
      </bean>
  
      <bean id="user" class="com.zhouning.spring.beans.User" autowire="byType">
          <property name="name" value="张三"></property>
      </bean>
  </beans>
  ```

  对应着User里面的` public void setAddr(String addr) `

* constructor

  当构造器实例化时，进行自动装配,需要有对应的构造函数

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <beans xmlns="http://www.springframework.org/schema/beans"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
  
      <bean id="address" class="com.zhouning.spring.beans.Address" >
          <property name="addr" value="武汉"></property>
      </bean>
  
      <bean id="user" class="com.zhouning.spring.beans.User" autowire="constructor">
          <property name="name" value="张三"></property>
      </bean>
  </beans>
  ```

  对应着User里面的` public User(Address address)` 

## 总结

bean在xml中的自动注入都是通过这种方法，但是感觉不是很常用。