#  springboot日志使用

## 简介

SpringBoot能自动适配所有的日志，但是底层默认使用slf4j+logback的方式记录日志，一般来说遵从默认的日记就可以了。springboot日志的官方文档在这里[传送门](https://docs.spring.io/spring-boot/docs/current-SNAPSHOT/reference/htmlsingle/#boot-features-logging)

## 讲解

### 1.代码使用方法

在测试类中写下日下代码：

```java
@SpringBootTest
class SpringBoot03LoggingApplicationTests {

    Logger logger = (Logger) LoggerFactory.getLogger(getClass());
    @Test
    void contextLoads() {
        //日志级别由低到高
        logger.trace("这是trace日志");
        logger.debug("这是debug日志");
        //默认是info级别
        logger.info("这是info日志");
        logger.warn("这是warn日志");
        logger.error("这是error日志");
    }

}
```

可以在控制台看到输出

```
2020-05-07 12:10:49.845  INFO 20044 --- [           main] c.z.SpringBoot03LoggingApplicationTests  : 这是info日志
2020-05-07 12:10:49.846  WARN 20044 --- [           main] c.z.SpringBoot03LoggingApplicationTests  : 这是warn日志
2020-05-07 12:10:49.846 ERROR 20044 --- [           main] c.z.SpringBoot03LoggingApplicationTests  : 这是error日志
```

可以知道默认的级别是info级别，要是想调整日志级别可以在application.properties中进行设置，如：

```properties
logging.level.com.zhouning=trace
```

将com.zhouning这个包下的级别调整成trace

### 2.logging.file 和logging.path

logging.file和logging.path都g是g设置日志文件生成路径

* logging.file

  我们在application.properties写下：

  ```properties
  logging.file.name=springboot.log
  ```

  运行后发现当前项目下生成了一个springboot.log文件，里面写着日志的内容

  ![springboot日志01](https://gitee.com/zhou-ning/BlogImage/raw/master/java/springboot日志01.png)

  当然logging.file也可以指定具体的位置如:

  ```properties
  logging.file=E:/springboot.log
  ```

* loggin.path

  loggin.path是指定日志目录，如我们将当前磁盘的根路径下spring文件夹中的log文件夹作为存放日志文件的地方

  ```properties
  # 在当前磁盘的根路径下创建spring文件夹和里面的log文件夹；使用 spring.log 作为默认文件
  logging.path=/spring/log		
  ```

当两者都指定时，会以logging.file为主，但是一般情况下我们使用logging.path就足够了

### 3.logging.pattern.console和logging.pattern.file

* logging.pattern.console设置在控制台的日志格式

  ```properties
  logging.pattern.console = %d{yyyy‐MM‐dd} [%thread]  %logger{50} ‐ %msg %n
  ```

  输出结果：

  ![springboot日志02](https://gitee.com/zhou-ning/BlogImage/raw/master/java/springboot日志02.png)

* logging.pattern.file设置文件中日志输出格式

  ```properties
  logging.pattern.file = %d{yyyy‐MM‐dd} === [%thread] === %logger{50} ==== %msg %n
  ```

  输出结果：

  ![springboot日志03](https://gitee.com/zhou-ning/BlogImage/raw/master/java/springboot日志03.png)

简单解释：

```
日志输出格式：
			%d表示日期时间，
			%thread表示线程名，
			%-5level：级别从左显示5个字符宽度
			%logger{50} 表示logger名字最长50个字符，否则按照句点分割。 
			%msg：日志消息，
			%n是换行符
```

### 4.指定日志配置

日志的配置也可以写成一个配置文件，然后让springboot进行识别在配置，官方文档上配置上配置文件是这样描述的：

| Logging System          | Customization                                                |
| :---------------------- | :----------------------------------------------------------- |
| Logback                 | `logback-spring.xml`, `logback-spring.groovy`, `logback.xml`, or `logback.groovy` |
| Log4j2                  | `log4j2-spring.xml` or `log4j2.xml`                          |
| JDK (Java Util Logging) | `logging.properties`                                         |

简单的说我们使用logback作为日志框架，我们编写logback.xml、logback-spring.xml等就可以对Logback进行配置。

但是，一般来说建议使用logback-spring.xml作为配置文件，因为logback-spring.xml可以使用spring boot的的高级Profile功能，就是说在对应的profile环境下不同的日志配置被激活，profile的简单讲解可以看[这个](https://blog.csdn.net/qq_41474648/article/details/105883867)。

使用的方法可以这样

```xml
<springProfile name="dev">
<pattern>%d{yyyy‐MM‐dd HH:mm:ss.SSS} ‐‐‐‐> [%thread] ‐‐‐> %‐5level
%logger{50} ‐ %msg%n</pattern>
</springProfile>
<springProfile name="!dev">
<pattern>%d{yyyy‐MM‐dd HH:mm:ss.SSS} ==== [%thread] ==== %‐5level
%logger{50} ‐ %msg%n</pattern>
</springProfile>

```

在dev环境下一种输出方式，不在dev环境下另外一种输出方式



## 总结

写了一下springboot日志相关的内容，其实日志还有许多东西，比如切换日志框架等，但是我觉得目前这个不是很重要所有还是写一下比较实用的东西。