# spring中ioc创建对象的方法

## 介绍

最近在学习spring，学了又忘，忘了又学，还是需要做做总结，动动手知识才能变成自己的。

## 创建对象的方法

我们的需求是创建一个User的对象，其中User只有一个属性name

### 1.无参构造方法

User代码：

```java
package com.zhouning.spring.beans;

public class User {

    private String name;

    public User() {
        System.out.println("调用了无参构造方法");
    }

    public void setName(String name) {
        this.name = name;
    }

    public void show(){
        System.out.println("你好："+name);
    }
}

```

bean.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="user" class="com.zhouning.spring.beans.User">
<!--        通过无参的方法创建对象-->
        <property name="name" value="张三"></property>
    </bean>
</beans>
```

调用：

```java
public static void main(String[] args) {
        ApplicationContext applicationContext = new ClassPathXmlApplicationContext("bean.xml");
        User user = (User) applicationContext.getBean("user");
        user.show();

 }
```

输出：

```shell
调用了无参构造方法
你好：张三
```

**需要注意的点：**

* 调用无参的方法，则类里面需要有`set`方法才能对属性进行设置
* 构造的属性设置` <property name="name" value="张三"></property>`中，`name="name"`,这个引号中的`name`是对应的`set`方法去掉`set`后第一个字母小写（当然大写也可以），如：我这里面的`set`方法是`setNmae`,所以对应`name="name"`;如果`set`方法是`setNName`,则对应的写法是`name="NName"`
* 方法名尽量符合规范，这样在配置的时候也好写一些

### 2.有参的构造方法

User代码：

```java
package com.zhouning.spring.beans;

public class User {

    private String name;

    public User(String name) {
        System.out.println("调用了有参构造方法");
        this.name = name;
    }

    public void show(){
        System.out.println("你好："+name);
    }
}

```

* 根据参数下标来设置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="user" class="com.zhouning.spring.beans.User">
    <!--    根据参数下标-->
       <constructor-arg index="0" value="李四"></constructor-arg>
    </bean>
</beans>
```

* 根据参数类型

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="user" class="com.zhouning.spring.beans.User">
    <!--    根据参数类型-->
       <constructor-arg type="java.lang.String" value="李四"></constructor-arg>
    </bean>
</beans>
```

* 根据参数名字

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="user" class="com.zhouning.spring.beans.User">
    <!--    根据参数名字-->
       <constructor-arg name="name" value="李四"></constructor-arg>
    </bean>
</beans>
```

这三种方法最后的输出都是：

```shell
调用了有参构造方法
你好：李四
```

* 需要注意的是这三种方法可以合在一起使用，如`<constructor-arg name="name" value="李四" type="java.lang.String"></constructor-arg>`,这样可以应对有点时候类型不确定等情况。

### 3.通过工厂方法

* 静态工厂

  创建静态工厂类UserFactory：

  ```java
  /**
   * 静态工厂
   */
  public class UserFactory {
      public static User newInstance(String name){
          return new User(name);
      }
  }
  ```

  bean.xml:

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <beans xmlns="http://www.springframework.org/schema/beans"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
      <bean id="user" class="com.zhouning.spring.factory.UserFactory" factory-method="newInstance">
  <!--        通过工厂类创建对象-->
          <constructor-arg name="name" value="王五"></constructor-arg>
      </bean>
  </beans>
  ```

* 动态工厂

  创建动态工厂类UserDynamicFactory：

  ```java
  public class UserDynamicFactory {
      public  User newInstance(String name){
          return new User(name);
      }
  }
  ```

  bean.xml:

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <beans xmlns="http://www.springframework.org/schema/beans"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
      <bean id="userFactory" class="com.zhouning.spring.factory.UserDynamicFactory"></bean>
      <bean id="user" factory-bean="userFactory" factory-method="newInstance">
  <!--        通过工厂类创建对象-->
          <constructor-arg name="name" value="王五"></constructor-arg>
      </bean>
  </beans>
  ```

  

需要注意的地方：

* 动态跟静态工厂的方法类似，区别在于动态工厂需要先创建工厂后再使用
* 两者使用的都不多

## 总结

spring中ioc创建对象的方法总共是三类6种，总结一下。千里之行始于足下，加油！