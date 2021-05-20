# springboot中@PropertySource、@ImportResource、@Bean

## 介绍

在上一篇中学习了`@ConfigurationProperties`,演示的时候是直接在application.yml中进行相对应的配置，但是如果映射对的话，都写在这里面也不太合适，springboot当中也就为我们提供了一些方法解决这个问题

## 讲解

### 1.@PropertySource

`@PropertySource`的作用是加载指定的配置文件

我们可以将person的内容抽出来写在person.properties当中，就是resources文件夹下建立一个person.properties文件，写上如下内容

```properties
person.last-name=张三
person.age=18
person.birth=2020/5/1
person.boss=false
person.maps.k1=v1
person.maps.k2=v2
person.lists=lisi,zhaoliu
person.dog.name=小狗
person.dog.age=2
```

然后在person类的开头加上`@PropertySource(value = {"classpath:person.properties"})`

```java
@PropertySource(value = {"classpath:person.properties"})
@Component
@ConfigurationProperties(prefix = "person")
public class Person {
    ...
}
```

发现可以从person.properties当中读取对对应的配置，然后进行注入（同理yml也可以）

结论：

`@PropertySource`的作用是加载指定的配置文件，properties、yml文件都可以进行读取，而`@ConfigurationProperties`默认是从全局配置文件中获取值。

### 2.@ImportResource

上面的内容是导入springboot相关的配置文件，如果是导入spring的配置文件将如何处理呢？

Spring Boot里面没有Spring的配置文件，我们自己编写的配置文件，也不能自动识别； 想让Spring的配置文件生效，加载进来，可以使用`@ImportResource`标注在一个配置类上，导入Spring的配置文件，让配置文件里面的内容生效。

建立一个service：

```java
public class HelloService {
}
```

在resources目录下建立一个beans.xml配置文件,并且对helloservice进行配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="helloService" class="com.zhouning.springboot02config.service.HelloService"></bean>
</beans>
```

最后在主类上加上`@ImportResource`

```java

@ImportResource(locations = {"classpath:beans.xml"})
@SpringBootApplication
public class SpringBoot02ConfigApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringBoot02ConfigApplication.class, args);
    }

}
```

测试一下:

```java
@SpringBootTest
class SpringBoot02ConfigApplicationTests {

    @Autowired
    ApplicationContext applicationContext;

    @Test
    void contextLoads() {
        //判断ioc容器中是否有helloService
    System.out.println(applicationContext.containsBean("helloService"));
    }
}

```

输出：true

### 3.@Bean

上面那种创建bean的方式并不是spirngboot推荐的方法，springboot推荐的方法为使用全注解的方式，使用`@Configuration`和`@Bean`的方式进行配置

我们建立一个MyConfig类：

```java
@Configuration
public class MyConfig {
    /***
     * 将方法的返回值添加到容器中，容器中这个组件默认的id就是方法名
     * @return
     */
    @Bean
    public HelloService helloService(){
        return new HelloService();
    }
}
```

然后将主类上面的`@ImportResource`注释之后，再运行测试发现输出也是true

结论：

`@Configuration`指明当前类是一个配置类；就是来替代之前的Spring配置文件

`@Bean`给容器中添加组件,可以使用在方法上，当使用在方法上时，作用是将方法的返回值添加到容器中，容器中这个组件默认的id就是方法名，类似于上面默认的id就是helloService



## 总结

学习了一下@PropertySource、@ImportResource、@Bean这三个注解的用法