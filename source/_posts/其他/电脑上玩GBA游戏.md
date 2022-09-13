---
title: 电脑上玩GBA游戏
date: 2022-08-26 19:10:18
tags:
- 其他
categories:
- GBA游戏
---

# 电脑上玩GBA游戏（GBA模拟器）

最近重温了神奇宝贝系列的动画，想到小时候在GBA上玩的口袋妖怪系列游戏，想在电脑上重新玩一下，所以记录一下几个开源的GBA游戏模拟器。

## visualboyadvance-m

### 下载

仓库地址：https://github.com/visualboyadvance-m/visualboyadvance-m

直接去release里面下载

![image-20220831230708171](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220831230708171.png)

visualboyadvance-m-Win-64bit.zip是打包好的模拟器。

translations.zip是翻译文件，因为原版是英文的，我们想用中文就得下载这个

<!--more-->

### 配置中文

将visualboyadvance-m-Win-64bit.zip和translations.zip都解压一下到各自的文件夹。解压之后`visualboyadvance-m-Win-64bit`文件夹下只有一个exe文件，直接运行是以英文的环境打开。

![image-20220901224146745](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220901224146745.png)

所以需要配置一下中文，方便我们进行使用。我们从解压的`translations`文件夹中找到`zh_CN`文件夹

![image-20220901224620622](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220901224620622.png)

将`zh_CN`复制到`visualboyadvance-m.exe`的同级目录，然后打开就是中文的。

![image-20220901224945457](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220901224945457.png)

### 打开游戏

选择“文件”->“open”

![image-20220901231117574](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220901231117574.png)

然后找到自己下载游戏资源的文件夹打开对应的文件

![image-20220901231641236](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220901231641236.png)

就可以快乐的玩耍了

![image-20220903222532385](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220903222532385.png)

vba可以通过`ctrl+G`快捷键实现调整滤镜，让之前像素级别的游戏画质清晰一些。

### 联机

vba有个令我没有想到的功能那就是联机，对你没看错这玩意还可以实现联机，也就是小时gba通过数据线连接，然后进行联机的那种功能。

不过这个功能似乎只能在局域网下实现，在这里我们在一台电脑上来展示这个功能。

首先需要把“非激活状态时暂停”这个勾选去掉，防止鼠标移出去就暂停。

![image-20220913183841775](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220913183841775.png)

然后我们打开两个vba模拟器

![image-20220913184458847](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220913184458847.png)

我们打开每个模拟器的“选项”->"连接"->“开始网络连接”

![image-20220913184959007](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220913184959007.png)

会弹出如下的两个框框，我们选择一个做服务器一个做客户端，玩家选择2因为我们是两个玩家一起玩，最多4个玩家一起玩。

客户端中填写的服务器:127.0.0.1代表本地的地址，如果你们是局域网内可以填写服务器所在电脑的地址。

然后我们点击连接就可以开始联机玩耍了，尤其是星之卡比联机玩才最好玩。

![image-20220913185058478](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220913185058478.png)

## mgba

### 下载

仓库地址：https://github.com/mgba-emu/mgba

直接去release里面下载

![image-20220913190538794](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220913190538794.png)

### 运行

直接双击mGBA.exe即可。打开游戏的方式和上面的vba相同。

![image-20220913190838019](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220913190838019.png)

### 调整滤镜

由于画质问题有时候需要调整滤镜，但是mGBA中我目前没有找到快捷键，只能通过打开设置，然后载如新的着色器进行实现。

![image-20220913191205304](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220913191205304.png)

![image-20220913191400752](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220913191400752.png)