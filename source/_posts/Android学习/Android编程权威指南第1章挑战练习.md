---
title: Android编程权威指南第1章挑战练习
date: 2021-08-19 22:04:31
tags:
- Android
- Andorid编程权威指南
categories:
- Android
---

# Android编程权威指南第1章挑战练习

## 定制 toast 消息

这个练习需要你定制toast消息，改在屏幕顶部而不是底部显示弹出消息。这需要使用Toast 类的setGravity方法，并使用Gravity.TOP重力值。具体如何使用，请参考Android开发者文档。 

## 答案

参考官方给定的`Toast`例子结合对`setGravity`函数的讲解

我们只需要在`QuizActivity`中的函数中填入下属代码即可

```java
        mTrueButton = (Button) findViewById(R.id.true_button);
        mTrueButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast toast = Toast.makeText(QuizActivity.this, R.string.correct_toast, Toast.LENGTH_SHORT);
//                第一章挑战练习:设置toast在上方显示
                toast.setGravity(Gravity.TOP, 0, 0);
                toast.show();
            }
        });
```

**参考：**

* https://developer.android.com/reference/android/widget/Toast?hl=en#setGravity(int,%20int,%20int)
* https://developer.android.com/guide/topics/ui/notifiers/toasts