# java中Selenium配置环境

## 介绍

Selenium是一个用于Web应用程序测试的工具，在上软件测试的时候需要使用到这个工具，这个工具有python版和java版，python版的配置方法网上有许多，但是java版感觉写的比较少，所以记录一下。

## 讲解

### 一、下载Chrome谷歌浏览器驱动

我使用的是Chrome浏览器，所以需要下载Chrome谷歌浏览器驱动，驱动和浏览器有对应关系，如果驱动版本下载错误是使用不了的，所以需要先看一下浏览器版本。

找到设置当中的“关于Chrome”中可以看到浏览器的版本，我的版本是81.0.4044.129

![java中Selenium配置环境01](https://gitee.com/zhou-ning/BlogImage/raw/master/java/java中Selenium配置环境01.png)

驱动下载可以到[http://chromedriver.storage.googleapis.com/index.html](http://chromedriver.storage.googleapis.com/index.html)进行下载

![java中Selenium配置环境02](https://gitee.com/zhou-ning/BlogImage/raw/master/java/java中Selenium配置环境02.png)

![java中Selenium配置环境03](https://gitee.com/zhou-ning/BlogImage/raw/master/java/java中Selenium配置环境03.png)

因为我是windows系统所以下载chromedriver_win32.zip，下载后解压可以得到一个chromedriver.exe。如果下载太慢也可以到淘宝镜像[https://npm.taobao.org/mirrors/chromedriver/](https://npm.taobao.org/mirrors/chromedriver/)进行下载

### 二、创建java的Maven项目

将chromedriver.exe放在resources文件夹下

![java中Selenium配置环境04](https://gitee.com/zhou-ning/BlogImage/raw/master/java/java中Selenium配置环境04.png)

在pom.xml下写下下面的内容

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.zhouning</groupId>
    <artifactId>FunctionTest</artifactId>
    <version>1.0-SNAPSHOT</version>

    <dependencies>
        <!-- https://mvnrepository.com/artifact/org.seleniumhq.selenium/selenium-java -->
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>3.141.59</version>
        </dependency>
    </dependencies>
</project>
```

下载jar包的版本可以参考maven的仓库，我选择的是3.141.59版本，仓库地址：[点这里](https://mvnrepository.com/artifact/org.seleniumhq.selenium/selenium-java?__cf_chl_jschl_tk__=8cf2ed0cbf67974adb3f4d41b0c19dca430235c9-1588422116-0-ATzOuJO1jm78w9mjPQ9DCozEgF2ngWhN7QZLE4E0Jkox6MgtZ2oSSCNpkzOI4cZAZ1AEWnVVl3Evrs7DotRmDdpVVYp63ubqOUYn8UHMVrAC1v3a-aqiA_Oktwz8F1MDOCnI8Sgl__GWXntUOJnnNDFzVhuR5yUtCj0iPc7WtWLuB8DMqbg9PsBnAmB2MQsDdZm6D1YKLerWu9lCi8A8hJt99oO4SaFD1FTY8-YjO8ZxNvuA-qG8NUJYznyMQBRCRLfh7bAngNQkiw7P3m8zbapf8sJId8nI2JQQFQPNzR56_Oo6R-2gLMTjTx8lFnBuI7jgZzBstFAEaTHP4-ODdabW4MoeXonj9D35ufW6adoatbBBxb-raQ4a-O8WMMV_p5_7oeIMtLb3YFvNcWBC648)

![java中Selenium配置环境05](https://gitee.com/zhou-ning/BlogImage/raw/master/java/java中Selenium配置环境05.png)

最后创建一个Test类，看看是否配置成功

```java
public class Test {
    public static void main(String[] args) {
        System.setProperty("webdriver.chrome.driver", "src/main/resources/chromedriver.exe");// chromedriver服务地址
        WebDriver driver = new ChromeDriver(); // 新建一个WebDriver 的对象，但是new 的是谷歌的驱动
        String url = "http://www.baidu.com";
        driver.get(url); // 打开指定的网站
        driver.navigate().to(url); // 打开指定的网站
    }
}
```

结果展示：

![java中Selenium配置环境06](https://gitee.com/zhou-ning/BlogImage/raw/master/java/java中Selenium配置环境06.png)

## 总结

因为在学习软件测试，所以Selenium深入的使用，目前并不知道，后续有再写一些。