---
title: Activity之间通讯
date: 2021-08-20 16:47:24
tags:
- Android
- Andorid编程权威指南
categories:
- Android
---

# Activity之间通讯

`Activity`之间经常需要传输数据，我们常用的方法就是使用`Intent`

<!--more-->

## 实例一单方面传输

创建项目`TwoActivity`，然后在项目中除`MainActivity`之外，再添加一个`SecondActivity`

在`activity_main.xml`写下以下内容

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <EditText
        android:id="@+id/editText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:ems="10"
        android:hint="please input something"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintHorizontal_bias="0.497"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

    <Button
        android:id="@+id/button"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="send to secondActivity"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/editText" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

在`MainActivity`中写下以下内容

```java
package com.example.twoactivity;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

public class MainActivity extends AppCompatActivity {
    private EditText mEditText;

    private Button mButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mEditText = findViewById(R.id.editText);
        mButton = findViewById(R.id.button);
        mButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String str = mEditText.getText().toString();
                //启动另一个Activity
                Intent intent = new Intent(MainActivity.this, SecondAcrivity.class);
                intent.putExtra("information", str);
                startActivity(intent);
            }
        });
    }
}
```

在`activity_second.xml`写入以下内容

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <EditText
        android:id="@+id/editText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:ems="10"
        android:hint="please input something"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintHorizontal_bias="0.497"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

    <Button
        android:id="@+id/button"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="send to secondActivity"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/editText" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

在`SecondActivity`写下以下内容

```java
package com.example.twoactivity;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

public class SecondAcrivity extends AppCompatActivity {
    private TextView mTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_second);
        mTextView = findViewById(R.id.textView);
        Intent intent = getIntent();
        String information = intent.getStringExtra("information");
        mTextView.setText(information);
    }
}
```

运行程序，再输入框输入`test`，然后按下按钮

![image-20210820175350586](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210820175350586.png)

可以看到在的`SecondActivity`上展示了我们输入的内容

<img src="https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210820175557003.png" alt="image-20210820175557003" style="zoom:50%;" />

可以看到需要传输的内容从`MainActivity`传输到了`SecondActivity`

## 实例二双方互相传输

有的时候我们需要把信息从`MainActivity`传输到`SecondActivity`，这种类似于父子`Activity`之间的传输，原本是使用`startActivityForResult`进行处理，但是由于`startActivityForResult`存在的问题，现在官方推荐的是使用`registerForActivityResult()`等`Activity Results API `相关的方法

👉官方文档：https://developer.android.com/training/basics/intents/result

更改`MainActivity`中代码

```java
package com.example.twoactivity;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContract;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

public class MainActivity extends AppCompatActivity {
    private EditText mEditText;

    private Button mButton;
	//制定协议
    private ActivityResultContract<String, String> mStringStringActivityResultContract = new ActivityResultContract<String, String>() {
        @NonNull
        @Override
        public Intent createIntent(@NonNull Context context, String input) {
            Intent intent = new Intent(MainActivity.this, SecondAcrivity.class);
            intent.putExtra("information", input);
            return intent;
        }

        @Override
        public String parseResult(int resultCode, @Nullable Intent intent) {
            if (resultCode != Activity.RESULT_OK || intent == null) {
                return null;
            }
            return intent.getStringExtra("second information");
        }
    };
//制定启动器
    private ActivityResultLauncher mActivityResultLauncher = registerForActivityResult(mStringStringActivityResultContract,
            new ActivityResultCallback<String>() {
                @Override
                public void onActivityResult(String result) {
                    Toast.makeText(MainActivity.this, result, Toast.LENGTH_LONG).show();
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mEditText = findViewById(R.id.editText);
        mButton = findViewById(R.id.button);

        mButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String str = mEditText.getText().toString();
                mActivityResultLauncher.launch(str);
            }
        });
    }
}
```

`ActivityResultContract`和`ActivityResultLauncher`是`Activity Results API `中两个重要的组件

- `ActivityResultContract`: 协议，它定义了如何传递数据和如何处理返回的数据。`ActivityResultContract`是一个抽象类，你需要继承它来创建自己的协议，每个 `ActivityResultContract` 都需要定义输入和输出类，如果您不需要任何输入，可使用 Void（在 Kotlin 中，使用 Void? 或 Unit）作为输入类型。
- `ActivityResultLauncher`: 启动器，调用`ActivityResultLauncher`的`launch`方法来启动页面跳转，作用相当于原来的`startActivity()`

`SecondAcrivity`写入以下内容

```java
package com.example.twoactivity;

import androidx.appcompat.app.AppCompatActivity;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

public class SecondAcrivity extends AppCompatActivity {
    private TextView mTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_second);
        mTextView = findViewById(R.id.textView);
        Intent intent = getIntent();
        String information = intent.getStringExtra("information");
        mTextView.setText(information);
        Intent data = new Intent();
        data.putExtra("second information", "返回了secondActivity的信息");
        //设置返回结果
        setResult(Activity.RESULT_OK, data);
    }
}
```

实现子`activity`发送返回信息给父`activity`，有以下两种方法可用：

 `public final void setResult(int resultCode)`

  `public final void setResult(int resultCode, Intent data)  `

一般来说，参数`resultCode`可以是以下任意一个预定义常量。

* `Activity.RESULT_OK`
* `Activity.RESULT_CANCELED`

当然如需自己定义结果代码，还可使用另一个常量：`RESULT_FIRST_USER`。

在父`activity`需要依据子`activity`的完成结果采取不同操作时，设置结果代码就非常有用。 例如，假设子`activity`有一个`OK`按钮和一个`Cancel`按钮，并且每个按钮的单击动作分别设置 有不同的结果代码。那么，根据不同的结果代码，父`activity`就能采取不同的操作。  子`activity`可以不调用`setResult(...)`方法。如果不需要区分附加在intent上的结果或其他信 息，可让操作系统发送默认的结果代码。如果子`activity`是以调用`startActivityForResult(...) `或者`ActivityResultLauncher`方法启动的，结果代码则总是会返回给父`activity`。在没有调用`setResult(...)`方法的情况下， 如果用户按了后退按钮，父`activity`则会收到`Activity.RESULT_CANCELED`的结果代码。

最终结果展示，发送信息之后按返回键，会出结果展示

![image-20210820215024582](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/android/image-20210820215024582.png)

## 总结

写了两个有关`Android`之间`Activity`的信息相互传输

**参考：**

* https://segmentfault.com/a/1190000037601888
* https://developer.android.com/training/basics/intents/result
* 《Android编程权威指南中文第3版》

