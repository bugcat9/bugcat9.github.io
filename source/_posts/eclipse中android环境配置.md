---
 title: eclipse中android环境配置 
 date: 2021-05-20 23:13:23 
 tags: 
 - 软件安装
 categories:
 - android
---
# eclipse中android环境配置

## java环境配置

### java下载

去[Oracle官网](https://www.oracle.com/java/technologies/javase-downloads.html)下载自己需要的java版本

<!--more-->

![图片](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/企业微信截图_16104173834716.png)

我这里选择的是windows的jdk8

![图片](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/企业微信截图_16104172348073.png)

ps:下载需要登录自己Oracle账号，注册登录一下就行

下载之后的exe文件双击开，安装到你需要安装的位置即可，我这里安装位置是

`D:\Program Files\Java\jdk1.8.0_271`

### 环境配置

在系统变量里面加入了变量`JAVA_HOME`，值为安装的位置

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210113195035403.png)

然后在Path里面加入了`%JAVA_HOME%\bin`和`%JAVA_HOME%\jre\bin`(这个有待商量)

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210113195354124.png)

### 测试

在cmd当中输入`java -version`和`javac -version`查看输出，如果有如下的输出说明配置正确

`java -version`:

```
java version "1.8.0_271"
Java(TM) SE Runtime Environment (build 1.8.0_271-b09)
Java HotSpot(TM) 64-Bit Server VM (build 25.271-b09, mixed mode)
```

`javac -version`:

```
javac 1.8.0_271
```

## eclipse下载和配置

### eclipse下载

去[官网](https://www.eclipse.org/downloads/packages/)下载Eclipse IDE for Enterprise Java Developers

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/企业微信截图_16107116328073-1610711653956.png)

ps:下载的时候可能要你捐款什么的，跳过即可

解压完之后是这样的

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/企业微信截图_16111073888073.png)

点击eclipse.exe就能够运行

### 下载adt

adt是eclipse里面的Android插件，有这个才能在eclipse里面开发Android

点击`Help->Install New Software`,进入安装插件的界面

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/image-20210120095351409.png)

点击`Add`添加插件地址

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/企业微信截图_16111078194716.png)

插件我设置名字为`ADT`,地址为`http://dl-ssl.google.com/android/eclipse`

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/image-20210120095943961.png)

之后只需要按照安装正常插件的过程一样安装一下就行

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/image-20210120100225418.png)

ps：我已经安装了，所以显示都安装了

安装后可以在`About Eclipse IDE`上看到

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/image-20210120163100705.png)

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/image-20210120163135222.png)

## SDK以及工具下载

### 下载

我们需要先下载SDK Manager等工具下载sdk，工具下载地址：https://dl.google.com/android/android-sdk_r24.4.1-windows.zip?utm_source=androiddevtools&utm_medium=website。

下载解压之后是这样的

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/image-20210120164312559.png)

双击SDK Manager.exe，对sdk以及相对应的工具进行下载。

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/image-20210120164715178.png)

下载完成后我这边多了许多东西

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/image-20210120164747825.png)

ps：网络可能不好，需要换源

需要注意在SDK manager中下载的android SDK Build-tools工具，因为adt不再升级，所以android SDK Build-tools版本不能太高，推荐为24

### eclipse上配置

在Preferences->Android当中配置一下SDK的位置，浏览选择到我们解压zip的位置就行

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/eclipse/企业微信截图_16111325677086.png)

ps：SDK用Android Studio其实也可以进行下载，但是不知道为啥eclipse使用不了，可能是不太兼容吧，毕竟adt都不维护了

## 小结

使用eclipse来编写Android已经过时了，但是有时候我们需要维护以前用eclipse写的代码，所以迫于无奈还是得使用eclipse。所以记一下环境配置，方便后续的维护