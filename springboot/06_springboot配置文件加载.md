# springboot配置文件加载

## 介绍

springboot当中配置文件又很多，有一定的访问顺序，做个记载记录一下访问顺序

## 讲解

### 一、形成jar包之前的访问顺序

springboot 启动会扫描以下位置的application.properties或者application.yml文件作为Spring boot的默认配置文件，他们的访问顺序的优先级由高到低如下所示：

1. file:/config/(项目目录下的config文件夹下)
2. file:/(项目目录下的）
3. classpath:/config/（类路径的config文件夹下）
4. classpath:/（类路径下）

![配置文件加载01](https://gitee.com/zhou-ning/BlogImage/raw/master/java/配置文件加载01.png)

​		这里优先级的体现是当在file:/config/下创建一个application.properties文件时，里面写上`server.port=8084`而在classpath:/下的application.properties文件里面写下`server.port=8081`，项目会以端口为8084启动，就是说优先级的内容会覆盖优先级低的内容。

​		但是这并不代表低优先级的配置文件不起作用，低优先级的的内容也起作用，比如说要是低优先级里面有个`server.context-path=/abc`内容而高优先级没有，那么这个context的内容将起作用，这样可以高优先级和低优先级的配置文件一起使用形成互补配置。

​		然而当项目打包成jar包之后，file:/config/(项目目录下的config文件夹下)和file:/(项目目录下的）并不会被打包进去，所以也不会起到配置作用，有时候感觉有些鸡肋

### 二、形成jar包之后的加载顺序

SpringBoot也可以从以下位置加载配置， 优先级从高到低，高优先级的配置覆盖低优先级的配置，所有的配置会 形成互补配置

1. 命令行参数

   所有的配置都可以在命令行上进行指定 java -jar spring-boot-02-config-02-0.0.1-SNAPSHOT.jar --server.port=8087 --server.context-path=/abc

   但是这样如果配置多了有些麻烦。改改端口什么的还可以

2. jar包外部的application-{profile}.properties或application.yml(带spring.profile)配置文件

3. jar包内部的application-{profile}.properties或application.yml(带spring.profile)配置文件

4. .jar包外部的application.properties或application.yml(不带spring.profile)配置文件

5. jar包内部的application.properties或application.yml(不带spring.profile)配置文件

   上面的2，3，4，5的理解是如果jar外有相对应的配置文件会先读jar包外的配置文件，然后再加载已经打包进jar包的配置文件

![配置文件加载02](https://gitee.com/zhou-ning/BlogImage/raw/master/java/配置文件加载02.png)

​		这个就会先加载jar包外部的application.properties文件的配置再加载jar里面打包的配置，形成互补配置，这也就解决了打包后更改配置的问题，方便了springboot在打包后再进行配置。

## 总结

配置的访问顺序还是比较简单的内容，其实还有更多的配置的讲解可以参考官方文档：[传送门](https://docs.spring.io/spring-boot/docs/current-SNAPSHOT/reference/htmlsingle/#boot-features-external-config)