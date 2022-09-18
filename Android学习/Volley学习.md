---

title: Volley学习
date: 2021-08-29 19:41:21
tags:
- Android
- Andorid编程权威指南
categories:
- Android
---

# Volley学习

`Volley `是一个可让 `Android `应用更轻松、（最重要的是）更快捷地联网的 HTTP 库，是谷歌官方使用异步http网络请求库，所以为了连接网络还是需要学习一下这个玩意。总所周知Android主线程是不能访问网络的，但是Volley是可以直接在主线程上使用，因为他底层帮我们实现了开线程这些事情。

目前查看了一下`Volley`和相关的资料，发现其实介绍的都挺好的，这里的话就介绍一下简单的使用吧，如果想了解更多一些可以查看官方教程和郭霖的教程：

https://developer.android.com/training/volley

https://blog.csdn.net/guolin_blog/article/details/17482095

首先需要访问网络所以我们需要在`AndroidManifest`中加入权限

```xml
    <uses-permission android:name="android.permission.INTERNET" />
```

<!--more-->

## StringRequest、JsonObjectRequest、ImageRequest使用

### 设置界面

创建一个简单项目在主界面的`xml`里面放一个`TextView`和一个`ImageView`,`TextView`用来接收收到的文字，`imageview`用来接收图片。

布局使用`ConstraintLayout`，简单布局一下

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:id="@+id/text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello World!"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

    <ImageView
        android:id="@+id/imageView"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/text"
        tools:srcCompat="@tools:sample/avatars" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

 ### StringRequest介绍

`StringRequest`是发送一个`http`请求后将收到的内容，全都转化为String进行显示

`StringRequest`的构造函数如下

```java
    public StringRequest(
            int method,//请求方法，如get、post
            String url,//请求的地址
            Listener<String> listener,//请求成功的监听器
            @Nullable ErrorListener errorListener//请求失败的监听器
    )
```

我们编写一个代码向百度进行请求，然后将内容显示出来

```java
    private StringRequest getStringRequest() {
        String url = "https://www.baidu.com";

        // Request a string response from the provided URL.
        StringRequest stringRequest = new StringRequest(Request.Method.GET, url,
                new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {
                        // Display the first 500 characters of the response string.
                        Log.d(TAG, response);
                        // 对应界面上的TextView
                        mTextView.setText("Response is: " + response.substring(0, 500));
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.e(TAG, error.getMessage(), error);
                  // 对应界面上的TextView
                mTextView.setText("That didn't work!");
            }
        });
        return stringRequest;
    }
```

可以看的出`StringRequest`使用起来比较简单，设置两个监听器，分别是监听请求成功和请求失败，再对其中的内容进行具体的操作就行。

我们在`MainActivity`中写下代码

```java
 @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mTextView = findViewById(R.id.text);
        mImageView = findViewById(R.id.imageView);

        // Instantiate the RequestQueue.
        RequestQueue queue = Volley.newRequestQueue(this);
        StringRequest request = getStringRequest();
        // Add the request to the RequestQueue.
        queue.add(request);
    }
```

运行之后，等待一会，结果如图所示，可以看到我们得到了百度返回的请求，并且把请求显示在了TextView之上。

![image-20210906202925419](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210906202925419.png)

### JsonObjectRequest介绍

网络当中使用json传输数据是很普遍的事情，Volley当中也有接收json回复的叫做`JsonObjectRequest`,使用起来和`StringRequest`一样比较简单。

`JsonObjectRequest`的主要构造函数是，其他的构造函数都和这个类似

```java
    public JsonObjectRequest(
            int method,// 请求的方法，是个可选参数有许多重载的构造函数
            String url,//请求的网址
            @Nullable JSONObject jsonRequest,//post请求时带的json对象，如果为null代表没有
            Listener<JSONObject> listener,//成功的监听器
            @Nullable ErrorListener errorListener//失败的监听器
    )
```

需要注意的是我们在这里调用的是上面讲解的构造函数的其中一个重载的构造函数。

```java
private JsonObjectRequest getJsonObjectRequest() {
        String url = "http://www.weather.com.cn/data/sk/101010100.html";
        JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(url, null,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        Log.d("TAG", response.toString());
                        mTextView.setText("Response is: " + response.toString());
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.e("TAG", error.getMessage(), error);
                mTextView.setText("That didn't work!");
            }
        });
        return jsonObjectRequest;
    }
```

在这里我们采取同样的方法，生成一个`JsonObjectRequest`对象然后进行返回。

这里我们的请求是请求了天气数据，具体的可以参考这篇文章：https://www.cnblogs.com/Jimc/p/10250861.html

这里的天气数据是个http请求，因为http请求被视为不安全，所以在高版本的`Android`当中我们调用`http`请求需要在`AndroidManifest`中的`application`标签下面加入

```
 android:usesCleartextTraffic="true"
```

然后我们在`MainActivity`代码中

```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mTextView = findViewById(R.id.text);
        mImageView = findViewById(R.id.imageView);

        // Instantiate the RequestQueue.
        RequestQueue queue = Volley.newRequestQueue(this);
        JsonObjectRequest request = getJsonObjectRequest();
        // Add the request to the RequestQueue.
        queue.add(request);
    }
```

运行结果，可以看到把天气数据进行了显示

![image-20210907203713536](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210907203713536.png)

### ImageRequest介绍

`ImageRequest`是请求一张图片，他比前面两个稍微复杂一些，但是使用起来实际还是比较简便的

`ImageRequest`的构造函数如下，它会创建一个新的`ImageRequest`，解码到最大指定的宽度和高度。如果宽度和高度都为零，图像将被解码为其自然大小。如果其中一个非零，则该尺寸将被固定，而另一个将被设置为保持图像的长宽比。如果宽度和高度都非零，图像将被解码为适合宽度x高度的矩形，同时保持其高宽比。

```java
    public ImageRequest(
            String url,
            Response.Listener<Bitmap> listener,
            int maxWidth,
            int maxHeight,
            ScaleType scaleType,//ImageViews ScaleType用于计算所需的图像大小
            Config decodeConfig,//解码位图的格式
            @Nullable Response.ErrorListener errorListener)
```

我们仿照前面的两个`Request`写下下面的代码

```java
    private ImageRequest getImageRequest() {
        String url = "https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/avatar/zhouning.jpg";
        ImageRequest imageRequest = new ImageRequest(
                url,
                new Response.Listener<Bitmap>() {
                    @Override
                    public void onResponse(Bitmap response) {
                        mImageView.setImageBitmap(response);
                    }
                }, 0, 0, ImageView.ScaleType.CENTER_INSIDE, Bitmap.Config.RGB_565,
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        mTextView.setText("That didn't work!");
                    }
                });
        return imageRequest;
    }
```

然后在`MainActivity`中进行调用

```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mTextView = findViewById(R.id.text);
        mImageView = findViewById(R.id.imageView);

        // Instantiate the RequestQueue.
        RequestQueue queue = Volley.newRequestQueue(this);
        ImageRequest request = getImageRequest();
        // Add the request to the RequestQueue.
        queue.add(request);
    }
```

然后可以得到，下面图片的显示，其中的图片是我自己博客的头像，显示在上面

![image-20210908200246145](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210908200246145.png)

## 自定义Request

学习了上面三个简单的`Request`使用之后，我们发现其实他们的构造方法都有些类似，并且他们的实现部分其实也是类似的都是继承自`Request`类

![image-20210908202151443](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210908202151443.png)

![image-20210908202210668](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210908202210668.png)

![image-20210908202225771](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210908202225771.png)

所以基于这三种类的学习其实我们也可以实现自定义类别。根据官网的教程，如果我们需要实现自定义请求，我们需要实现下面两点操作：

- 扩展 `Request<T>` 类，其中 `<T>` 表示请求期望的已解析响应的类型。因此，例如，如果已解析的响应是字符串，请通过扩展 `Request<String>` 创建自定义请求。
- 实现抽象方法 `parseNetworkResponse()` 和 `deliverResponse()`，详细说明如下所示。

###  `parseNetworkResponse()` 

```java
    protected abstract Response<T> parseNetworkResponse(NetworkResponse response);
```

`parseNetworkResponse`对服务器响应的数据进行解析，然后返回一个对应类型的`Response`对象，`parseNetworkResponse`将`NetworkResponse`作为参数，在该参数当中包含了响应负载作为字节 []、HTTP 状态代码以及响应标头。除此之外我们实现返回的Response\<T>，其中包含您输入的响应对象和缓存元数据或错误，例如解析失败时出现的错误。

我们可以学习一下`StringRequest`中的例子，对应着上面的讲解可以很清楚的看懂

```java
    @Override
    @SuppressWarnings("DefaultCharset")
    protected Response<String> parseNetworkResponse(NetworkResponse response) {
        String parsed;
        try {
            parsed = new String(response.data, HttpHeaderParser.parseCharset(response.headers));
        } catch (UnsupportedEncodingException e) {
            // Since minSdkVersion = 8, we can't call
            // new String(response.data, Charset.defaultCharset())
            // So suppress the warning instead.
            parsed = new String(response.data);
        }
        return Response.success(parsed, HttpHeaderParser.parseCacheHeaders(response));
    }
```

### `deliverResponse()`

Volley在`deliverResponse`中返回的对象在主线程上进行回调。简单理解就是在这个方法当中处理解析出来返回的对象，一般来说在这里面，直接调用回调接口，也就是调用监听器就行。

```java
    protected abstract void deliverResponse(T response);
```

例如`StringRequest`中：

```java
    @Override
    protected void deliverResponse(String response) {
        Response.Listener<String> listener;
        synchronized (mLock) {
            listener = mListener;
        }
        if (listener != null) {
            listener.onResponse(response);
        }
    }
```

### 自定义XMLRequest 

这部分内容借鉴博客：https://blog.csdn.net/guolin_blog/article/details/17612763

`xml`也是网上传输比较多的格式之一，所以先定义一个`XMLRequest `练练手

```java
package com.example.volleylearn;

import com.android.volley.*;
import com.android.volley.toolbox.HttpHeaderParser;

import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;
import org.xmlpull.v1.XmlPullParserFactory;

import java.io.StringReader;
import java.io.UnsupportedEncodingException;

public class XMLRequest extends Request<XmlPullParser> {
    private final Response.Listener<XmlPullParser> mListener;

    public XMLRequest(int method, String url, Response.Listener<XmlPullParser> listener,
                      Response.ErrorListener errorListener) {
        super(method, url, errorListener);
        mListener = listener;
    }

    public XMLRequest(String url, Response.Listener<XmlPullParser> listener, Response.ErrorListener errorListener) {
        this(Method.GET, url, listener, errorListener);
    }

    @Override
    protected Response<XmlPullParser> parseNetworkResponse(NetworkResponse response) {
        try {
            String xmlString = new String(response.data,
                    HttpHeaderParser.parseCharset(response.headers));
            XmlPullParserFactory factory = XmlPullParserFactory.newInstance();
            XmlPullParser xmlPullParser = factory.newPullParser();
            xmlPullParser.setInput(new StringReader(xmlString));
            return Response.success(xmlPullParser, HttpHeaderParser.parseCacheHeaders(response));
        } catch (UnsupportedEncodingException e) {
            return Response.error(new ParseError(e));
        } catch (XmlPullParserException e) {
            return Response.error(new ParseError(e));
        }
    }

    @Override
    protected void deliverResponse(XmlPullParser response) {
        mListener.onResponse(response);
    }

}
```

可以看到代码比较简单，实现了`parseNetworkResponse`和`deliverResponse`方法，然后最终返回的是一个`XmlPullParser`对象

然后我们可以仿照前面的例子，写下

```java
    private XMLRequest getXmlRequest() {
        String url = "http://flash.weather.com.cn/wmaps/xml/china.xml";
        XMLRequest xmlRequest = new XMLRequest(url, new Response.Listener<XmlPullParser>() {
            @Override
            public void onResponse(XmlPullParser response) {
                try {
                    int eventType = response.getEventType();
                    while (eventType != XmlPullParser.END_DOCUMENT) {
                        switch (eventType) {
                            case XmlPullParser.START_TAG:
                                String nodeName = response.getName();
                                if ("city".equals(nodeName)) {
                                    String pName = response.getAttributeValue(0);
                                    Log.d(TAG, "pName is " + pName);
                                }
                                break;
                        }
                        eventType = response.next();
                    }
                } catch (XmlPullParserException e) {
                    e.printStackTrace();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.e(TAG, error.getMessage(), error);
            }
        });
        return xmlRequest;
    }
```

其中 "http://flash.weather.com.cn/wmaps/xml/china.xml"是一些天气数据，可以自己访问之后查看一下

接着我们可以进行调用

```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mTextView = findViewById(R.id.text);
        mImageView = findViewById(R.id.imageView);

        // Instantiate the RequestQueue.
        RequestQueue queue = Volley.newRequestQueue(this);
        XMLRequest request = getXmlRequest();
        // Add the request to the RequestQueue.
        queue.add(request);
    }
```

可以看到结果，其中乱码部分其实是省份（中文），但是不知道什么原因乱码了，自己也采取了一些方法但是都没有用，日后解决了再写个文章。

![image-20210909203722103](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210909203722103.png)

### 自定义GsonRequest

Gson是Android当中常用的一个用来解析json的库，Volley中默认并不支持使用自家的GSON来解析数据，所以我们自定义一个GsonRequest

我们访问的网址是http://www.weather.com.cn/data/sk/101010100.html这个接口，他可以得到一段JSON格式的天气数据，如下所示：

```json
{"weatherinfo":{"city":"北京","cityid":"101010100","temp":"19","WD":"南风","WS":"2级","SD":"43%","WSE":"2","time":"19:45","isRadar":"1","Radar":"JC_RADAR_AZ9010_JB"}}
```

接下来我们使用对象的方式将这段JSON字符串表示出来。新建一个Weather类，代码如下所示：

```java
public class Weather {
 
	private WeatherInfo weatherinfo;
 
	public WeatherInfo getWeatherinfo() {
		return weatherinfo;
	}
 
	public void setWeatherinfo(WeatherInfo weatherinfo) {
		this.weatherinfo = weatherinfo;
	}
}
```

Weather类中只是引用了WeatherInfo这个类。接着新建WeatherInfo类，代码如下所示：

```java
public class WeatherInfo {
    private String city;

    private String temp;

    private String time;

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getTemp() {
        return temp;
    }

    public void setTemp(String temp) {
        this.temp = temp;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }
}
```

WeatherInfo类中含有city、temp、time这几个字段。

接着我们依照惯例写下代码

```java
    public GsonRequest<Weather> getGsonRequest() {
        String url = "http://www.weather.com.cn/data/sk/101010100.html";
        GsonRequest<Weather> gsonRequest = new GsonRequest<Weather>(
                url, Weather.class,
                new Response.Listener<Weather>() {
                    @Override
                    public void onResponse(Weather weather) {
                        WeatherInfo weatherInfo = weather.getWeatherinfo();
                        Log.d(TAG, "city is " + weatherInfo.getCity());
                        Log.d(TAG, "temp is " + weatherInfo.getTemp());
                        Log.d(TAG, "time is " + weatherInfo.getTime());
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.e("TAG", error.getMessage(), error);
            }
        });
        return gsonRequest;
    }
```

进行调用

```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mTextView = findViewById(R.id.text);
        mImageView = findViewById(R.id.imageView);

        // Instantiate the RequestQueue.
        RequestQueue queue = Volley.newRequestQueue(this);
        GsonRequest<Weather> request = getGsonRequest();
        // Add the request to the RequestQueue.
        queue.add(request);
    }
```

运行结果

![image-20210911204452119](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210911204452119.png)

## 总结

编写Volley，使用了很久时间，这期间经历了回学校等众多事情，最终算是写完了，也学习到Volley使用的很多知识，加油！生活会更好的。