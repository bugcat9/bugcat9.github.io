# Profile多环境支持

## 介绍

Profile是Spring对不同环境提供不同配置功能的支持，可以通过激活、 指定参数等方式快速切换环境，比如有的时候我们希望spring开发时在一个环境、测试时又在一个环境，生产的时候又一个环境，这个都可以通过Profile实现

## 讲解

### 1.多Profile文件实现

我们在主配置文件编写的时候，文件名可以是是 application-{profile}.properties或者是 application-{profile}.yml，然后实现不同环境的配置，默认使用用application.properties配置。

例如我们在resources文件夹下再创建一个application-dev.properties和一个application-prod.properties表示开发环境和生产环境，而自身的application.properties就当作普通环境

![Profile多环境支持01](https://gitee.com/zhou-ning/BlogImage/raw/master/java/Profile多环境支持01.png)

application.properties：

```properties
server.port=8081
```

application-dev.properties:

```properties
server.port=8082
```

application-prod.properties:

```properties
server.port=8083
```

这时我们运行程序你，默认的就是8081端口，如果我们想改变环境只需要在application.properties中加一句话激活一个环境，配置就改变了

```properties
server.port=8081
spring.profiles.active=dev
```

### 2.yml多文档块方式

上面那种有时候觉得文件太多有的不方便，那么可以使用**一个**yml文件，使用多文档块的方式进行环境编写

例如我们在application.yml中编写如下内容

```yml
server:
  port: 8081
spring:
  profiles:
    active: prod
---
server:
  port: 8082
spring:
  profiles: dev
---
server:
  port: 8083
spring:
  profiles: prod
```

我们这样就激活了prod环境，启动后端口为8083

### 3.激活指定的profile

上面的展示了profile的一些写法，下面写一些proflie的激活方法

* 在配置文件中指定 spring.profiles.active=dev

* 命令行激活：java -jar xxxx.jar --spring.profiles.active=dev

  这个命令行方法可以在打包之后进行环境激活

## 总结

学习了一下springboot中多环境激活的内容