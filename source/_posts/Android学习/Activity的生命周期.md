---
title: Activity的生命周期简单的例子
date: 2021-08-18 11:41:10
tags:
- Android
- Andorid编程权威指南
categories:
- Android
---

# Activity的生命周期简单的例子

## 介绍

`Activity`是android当中重要的内容，每个`Activity`实例都有其生命周期。在其生命周期内，`Activity`在运行、暂停、停止和不存在这四种状态间转换，每次状态转换时，都有相应的Activity方法发消息通知activity。Activity 类提供六个核心回调：`onCreate()、onStart()、onResume()、onPause()、onStop()、onDestory()`，官方给出的状态变化以及函数调用如下图所展示

![img](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/activity_lifecycle.png)



但是我感觉比较好理解的是《Android编程权威指南》中的图解

![image-20210818155656276](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210818155656276.png)

可以根据内存中有没有`activity`的实例，用户是否看得到，是否活跃在前台（等待或接受用户输入中）等这些作为判断，调用了那些函数。完整总结如下表所示。

|  状态  | 有内存实例 |  用户可见  | 处于前台 |
| :----: | :--------: | :--------: | :------: |
| 不存在 |     否     |     否     |    否    |
|  停止  |     是     |     否     |    否    |
|  暂停  |     是     | 是或者部分 |    否    |
|  运行  |     是     |     是     |    是    |

## 实例展示

### 实例一

在`Android Studio`中创建项目`ActivityLifecycle`，然后在`MainActivity`中写入下面代码

```java
package com.example.activitylifecycle;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Log;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Log.d(TAG, "onCreate() called");
    }

    @Override
    public void onStart() {
        super.onStart();
        Log.d(TAG, "onStart() called");
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "onResume() called");
    }

    @Override
    public void onPause() {
        super.onPause();
        Log.d(TAG, "onPause() called");
    }

    @Override
    public void onStop() {
        super.onStop();
        Log.d(TAG, "onStop() called");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy() called");
    }
}
```

然后运行程序，安装到Android手机上，再查看LogCat

![image-20210818172208317](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210818172208317.png)

可以看到`onCreate()、onStart()、onResume()`按照顺序被调用，这也符合`Activity`的状态从`不存在→停止→暂停→运行`的转变。

接着在手机上我们可以单击后退键，再查看LogCat。可以看到，日志显示 `MainActivity `的 `onPause()、 onStop() 、onDestroy() `方法被依次调用了

![image-20210818173551090](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210818173551090.png)

单击设备的后退键，相当于告诉Android系统：“activity已用完，现在不需要它了。”随即， 系统就销毁了该activity的视图及其内存里的相关信息。这实际是Android系统节约使用设备有限资源的一种方式。对应着`Activity`中状态从`运行→暂停→停止→不存在`，这也对应的图中的对应变化。

### 实例二

我们再次点击应用从而启动应用，启动应用之后我们点击主屏幕键或者说是home键，退到主屏幕

![image-20210818181407786](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210818181407786.png)

日志上显示，Android先创建了全新的`MainActivity`实例， 然后调用`onCreate()、onStart()和onResume()`方法。`MainActivity`从不存在变为运行状态。然后我们点击主屏幕键后，系统调用了`MainActivity`的``onPause()和onStop()`方法，但并没有调用`onDestroy()`方法，说明点击主屏幕键只会使得Activity处于停止状态（在内存中， 但不可见，不会活动在前台）。

然后再次点击应用，启动应用

![image-20210818181510264](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210818181510264.png)

LogCat日志显示，系统没有调用onCreate()方法（因为Activity实例还在内存里，自然不用重建了），而是调用了onStart()和onResume()方法。用户按了主屏幕键后，MainActivity 最后进入停止状态，再次调出应用时，MainActivity 只需要重新启动（进入暂停状态，用户可 见），然后继续运行（进入运行状态，活动在前台）。

需要注意的是，停止的activity能够存在多久，谁也无法保证。系统需要回收内存时，它将首先销毁那些停止的activity

### 实例三

我们新增加一个`OtherActivity`,然后更改`MainActivity`中的代码和`activity_main.xml`中代码

`MainActivity`中代码

```java
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";

    private Button mButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Log.d(TAG, "onCreate() called");
        mButton = findViewById(R.id.button);
        mButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(MainActivity.this, OtherActivity.class);
                startActivity(intent);
            }
        });
    }
    .......
}
```

`activity_main.xml`中代码

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <Button
        android:id="@+id/button"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="to other activity"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

然后我们运行代码点击其中的按钮

![image-20210818222756707](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210818222756707.png)

该实例其实是和实例二相同，跳转其他`OtherActivity`之后,`MainActivity`就停止了。

### 实例四

我们点击应用，再旋转屏幕我们可以截图可以发现旋转之后`Activity`是毁灭之后再次重建，简单理解是设备旋转时，系统会销毁当前`Activity`实例，然后创建一个新的`Activity`实例

![image-20210819101657554](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210819101657554.png)

## 总结

`Activity`的状态变化可以以内存中有没有`activity`的实例，用户是否看得到，是否活跃在前台（等待或接受用户输入中）等这些作为判断，掌握状态的这几个点就比较好区分，目前也举出了几个例子方便我们理解`Activity`状态改变，但是遗憾的是没有遇到只是暂停的这种简单例子

**参考：**

* 《Andorid编程权威指南》