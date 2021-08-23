# Android studio 下载安装

## java环境配置

### java下载

去[Oracle官网](https://www.oracle.com/java/technologies/javase-downloads.html)下载自己需要的java版本

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

## Android studio下载和安装

### android studio下载

直接去[官网](https://developer.android.com/studio?hl=zh-cn),下载`installer.exe`或者zip都可以，我这里是下载的zip。

然后找个合适的位置解压，解压完之后是这个样子

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210114095707274.png)

我们进入bin文件点击`studio64.exe`就可以运行

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210114095925560.png)

### 第一次运行

第一次运行可能会下载一些sdk等东西，这里的话只需要记得更改sdk下载位置，别下载到c盘就行。

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/企业微信截图_16105903698073.png)

ps:网络可能会导致很难下载下来，这个可以通过设置镜像等方法解决

## Android环境配置

Android 环境配置主要配置sdk的环境变量，跟上面java环境配置类似，在系统变量中加入`ANDROID_HOME`对应着sdk安装位置

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/企业微信截图_16106158683453.png)

然后在path当中加入`%ANDROID_HOME%\platform-tools`和`%ANDROID_HOME%\tools`

![](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210114172309012.png)

### 测试

在cmd当中输入adb，然后输出类似如下信息

```
Android Debug Bridge version 1.0.41
Version 30.0.5-6877874
Installed as D:\Users\ningzzhou\AppData\Local\Android\SDK\platform-tools\adb.exe

global options:
 -a         listen on all network interfaces, not just localhost
 -d         use USB device (error if multiple devices connected)
```

更多环境变量配置可以参考官网：https://developer.android.com/studio/command-line/variables?hl=zh-cn

## 小结

Android studio因为经常需要安装,所以记录一下