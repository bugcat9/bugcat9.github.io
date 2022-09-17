---
title: 隐式intent
date: 2021-08-25 21:32:27
tags:
- Android
- Andorid编程权威指南
categories:
- Android
---

# 隐式intent

Intent 分为两种类型：

- **显式 Intent**：通过提供目标应用的软件包名称或完全限定的组件类名来指定可处理 Intent 的应用。通常，您会在自己的应用中使用显式 Intent 来启动组件，这是因为您知道要启动的 Activity 或服务的类名。例如，您可能会启动您应用内的新 Activity 以响应用户操作，或者启动服务以在后台下载文件。
- **隐式 Intent** ：不会指定特定的组件，而是声明要执行的常规操作，从而允许其他应用中的组件来处理。例如，如需在地图上向用户显示位置，则可以使用隐式 Intent，请求另一具有此功能的应用在地图上显示指定的位置。

启动`Activity`时使用`Intent`，当使用显示`Intent`时，`Intent`对象是显式命名的某个具体的`Activity `组件时，系统立即启动该组件。

当使用隐式`Intent`时，Android 系统通过将 Intent 的内容与在设备上其他应用`AndroidManifest`中申明的`Intent filter`进行比较，从而找到要启动的相应组件。如果 Intent 与 Intent 过滤器匹配，则系统将启动该组件，并向其传递`Intent`对象。如果多个 Intent 过滤器兼容，则系统会显示一个对话框，支持用户选取要使用的应用。

具体过程如图所示：

![img](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/intent-filters_2x.png)

1. *Activity A* 创建包含操作描述的 `Intent`，并将其传递给 `startActivity()`
2. Android 系统搜索所有应用中与 Intent 匹配的 Intent 过滤器。寻找到匹配项
3. 该系统通过调用匹配 Activity (*Activity B*) 的 `onCreate()` 方法并将其传递给 `Intent`，以此启动匹配 Activity。

简单理解显示和隐式的区别就类似于租房子，显示`Intent`就是自己知道自己需要什么样的房子，并且已经确认自己想租的房子在那个小区那个单元那个房间（具体类名），而隐式`Intent`是只知道自己想租房，然后条件是什么，比如：房间大小、是否是独卫、是否能养宠物，然后把这些条件交给中介（Android系统），最终由中介挑选出一些合适的房间，由自己挑选是否租房。

<!--more-->

## 显示Intent

显示`Intent`调用比较简单，只需要指定完整的组件类名即可。

比如：

```java
// 显式Intent调用——构造方法传入Component
Intent intent = new Intent(this, TestActivity.class);
startActivity(intent);
```

当然还有一些其他方法，大致都是差不多都需要指定类名。

目前我有一个疑问就是**显示intent是否能够跨应用启动`Activity`？**

后面根据自己的实验得来显示`Intent`是可以跨应用启动`Activity`，就是说A应用可以启动B应用的`Activity`

比如我创建一个应用，然后在里面加入一个按钮，在`onCreate()`中写下下面的代码

```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Button mButton = findViewById(R.id.button);
        mButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // 启动其他应用的Activity，目标Activity不做任何配置，会报SecurityException错误
                Intent intent = new Intent();
                //String, String
                intent.setClassName("com.example.testactivity", "com.example.testactivity.MainActivity");
                startActivity(intent);

            }
        });
    }
```

然后我们创建对应的以`TestActivity`为应用名的应用，他的包名为`com.example.testactivity`,其中`MainActivity`的类名是`com.example.testactivity.MainActivity`。

然后我们在`TestActivity`应用的`AndroidManifest.xml`中，对应的目标Activity中加入`android:exported="true"`属性如下：

```xml
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />

                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
```

然后运行第一个应用按下按钮就会发现跳转到了第二个应用之中。

举上面的例子说明其他应用的组件我们是可以通过显示的`Intent`进行调用，但是好像官方是不推荐使用显示`Intent`启动其他的`Activity`，因为我们写的包名和具体类名都是硬编码，一旦目标Activity修改了类名、修改了包名或者移动了位置，那么我们之前写的启动代码都会失败，这明显不符合我们的代码规范。

所以说，启动其他应用的组件时，应该使用隐式Intent，具体来说就是使用Intent-Filter进行匹配。

## 隐式Intent

隐式Intent不会指定特定的组件，而是声明要执行的常规操作，系统会根据Intent的内容去匹配对应的Activity并启动。

隐式`Intent`指定一些操作后会把这个`Intent`传给Android系统，然后由Android系统进行匹配，挑选出出合适的`Activity`出来然后进行启动。而`Intent`挑选的规则是是通过`Intent filter`

举个简单的例子：

我们将`TestActivity`应用中的`AndroidManifest.xml`的内容进行更改

```xml
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <action android:name="Test" />
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
```

其中`action`元素告诉操作系统，activity能够胜的任指定任务，我们设置了一个自定义的`action`为`Test`，

然后`category`设置谁可以访问，`DEFAULT`类别告诉操作系统（问谁可以做时），activity愿意处理某项任务。DEFAULT 类别实际隐含于所有隐式intent中

然后我们设置第一个应用当中的代码

```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Button mButton = findViewById(R.id.button);
        mButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                //隐式启动
                Intent intent = new Intent();
                intent.setAction("Test");
                startActivity(intent);

            }
        });
    }
```

同样的我们启动该应用点击按钮就能启动`TestActivity`应用

### 匹配规则

具体来说隐式`Intent`有其固定的匹配规则，匹配时会对`Activity`的过滤列表进行对比，对比过滤列表当中的`action、category、data`信息，

**action**

action是一个字符串，该字符串区分大小写。系统预定义了一些action，同时我们也可以在应用中定义自己的action。

一个中可以有多个action，此时Intent中的action能够和中的任何一个action相同即可匹配成功。

**category**

category也是一个字符串，也区分大小写。系统预定义了一些category，同时我们也可以在应用中定义自己的category。

一般来说`Intent`的category有默认值，是由于系统在调用startActivity或者startActivityForResult的时候会默认为Intent加上“android.intent.category.DEFAULT”这个category。

因此，我们的配置中必须添加对应的配置，不然会匹配失败。

```xml
<intent-filter>
    ...
    <category android:name="android.intent.category.DEFAULT"/>
</intent-filter>
```

Intent中我们可以不设置category，因为系统默认给我们添加了“android.intent.category.DEFAULT”。如果我们要添加category的话，这个category就必须跟的任意一个匹配，否则会匹配失败。

**data**

data设置接收数据类型，主要由两部分组成mimeType和URI。

mimeType指媒体类型，比如`image/jpeg`、`audio/mpeg4-generic`和`video/*`等，可以表示图片、文本、视频等不同的媒体格式。

URI包含的数据比较多，结构如下所示：

```
<scheme>://<host>:<port>[<path>|<pathPrefix>|<pathPattern>]
```

比如：

```
content://com.example.project:200/folder/subfolder/etc
http://www.baidu.com:80/search/info
```

data的匹配规则

data是非必须的，可以不设置。但是如果在定义了data，那么Intent中也必须设置可匹配的data。URI有默认值file和content，如果设置了URI，则默认值就失效，mimeType没用默认值，并且可以不设置。data的匹配意味着mimeType和URI同时匹配。

## 总结

`Intent`有显示和隐式两种，显示的内容不多，显示主要用于应用内，而隐式`Intent`比较灵活，内容也比较多

对于隐式Intent而言，必不可少的是action，因为默认的category会添加。

如果定义了data，不管mimeType是否设置，Intent中都必须设置uri，因为uri有默认值。

**参考：**

* https://blog.csdn.net/qq_26287435/article/details/98620772
* https://blog.csdn.net/xiao__gui/article/details/11392987
* https://developer.android.com/guide/components/intents-filters?hl=zh-cn

