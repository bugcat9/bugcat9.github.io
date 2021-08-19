---
title: Android的设备配置和备选资源
date: 2021-08-19 16:18:13
tags:
- Android
- Andorid编程权威指南
categories:
- Android
---

# Android的设备配置和配置修饰符

## 介绍

**设备配置**是一系列特征组合，用来描述设备当前状态。这些特征有：屏幕方向、屏幕像素密度、屏幕尺寸、键盘类型、底座模式以及语言等。 通常，为匹配不同的设备配置，应用会提供不同的备选资源。比如：为适应不同分辨率的屏幕，向项目添加多套标就是这样一个使用案例。 可以说这些各种各样的配置只是为了兼容各种各种乱七八糟的设备

## 旋转屏幕

设备的屏幕像素密度是个固定的设备配置，无法在运行时发生改变。然而，屏幕方向等特征可以在应用运行时改变。 在运行时配置变更（runtime configuration change）发生时，可能会有更合适的资源来匹配新 的设备配置。于是，Android回销毁当前activity，为新配置寻找最佳资源，然后创建新实例使用这些资源。

创建一个`Activitycompatible`的项目，`MainActivity`保持默认

在`activity_main.xml`中写入下列代码

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="这是竖屏展示!"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

接着我们创建建水平模式布局，在项目工具窗口中，右键单击res目录后选择New → Android resource directory菜单项。创建资源目录界面列出了资源类型及其对应的资源特征，如图所示。

![image-20210819173327553](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210819173327553.png)

从资源类型（Resource type） 列表中选择layout，保持Source set的main选项不变。

接下来选中待选资源特征列表中的Orientation，然后单击`>>`按钮将其移动至已选资源特征 （Chosen qualifiers）区域。 最后，确认选中Screen orientation下拉列表中的Landscape选项，并确保目录名（Directory  name）显示为layout-land，如图所示。

这个窗口看起来有模有样，但实际用途仅限于设置目录名。点击OK按钮让Android Studio创建res/layout-land。 这里的-land后缀名是配置修饰符的一个使用例子。Android依靠res子目录的配置修饰符定位最佳资源以匹配当前设备配置。

![image-20210819180013963](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210819180013963.png)

![image-20210819180056828](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210819180056828.png)

我们将`layout-land`中的`activity_main.xml`写入以下内容

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <TextView
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:text="这是横屏展示!"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />
</androidx.constraintlayout.widget.ConstraintLayout>
```

运行程序，竖屏时结果如下（这个截图是使用Android studio截图的，有点长）

<img src="https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210819212529509.png" alt="image-20210819212529509" style="zoom:50%;" />

我们再进行横屏，结果如下(吐槽一下，这个黑屏部分时刘海屏)

![image-20210819212627488](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210819212627488.png)

可以看到这两个界面使用的`layput`文件是不相同的，通过不同目录名或者叫修饰符由系统进行选择

