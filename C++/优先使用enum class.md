---
title: 优先使用enum class
date: 2024-10-03 21:06:40
tags:
categories:
- C++
---
C++中存在`enum`和`enum class`两种，现代C++更加建议使用`enum class`这种。理由主要有三点：

1. `enum class`作用域更小，可以减少命名空间污染。`enum`定义后，其中的枚举类作用域是整个`enum`所在空间，可能对其他部分产生影响。比如
<!--more-->
```cpp
enum Color { black, white, red };   //black, white, red在
                                    //Color所在的作用域
auto white = false;                 //错误! white早已在这个作用
                                    //域中声明
```

2. `enum`会发隐式转换，但是`enum class`不会发生

```cpp
enum Color { black, white, red };       //未限域enum

std::vector<std::size_t>                //func返回x的质因子
  primeFactors(std::size_t x);

Color c = red;
…

if (c < 14.5) {                         // Color与double比较 (!)
    auto factors =                      // 计算一个Color的质因子(!)
      primeFactors(c);
    …
}
```

```cpp
enum class Color { black, white, red }; //Color现在是限域enum

Color c = Color::red;                   //和之前一样，只是
...                                     //多了一个域修饰符

if (c < 14.5) {                         //错误！不能比较
                                        //Color和double
    auto factors =                      //错误！不能向参数为std::size_t
      primeFactors(c);                  //的函数传递Color参数
    …
}
```

3. `enum class`<font style="color:rgb(0, 0, 0);">可以被前置声明。前置声明某些情况下可以减少编译依赖。</font>

```cpp
enum Color;         //错误！
enum class Color;   //没问题
```

## `enum class`使用
1. 第一项进行赋值。建议对枚举第一项赋值0，这样可以帮助明确各个枚举项值。

```cpp
enum class Color
{
    black=0,
    white,
    red
};
```

2. 整加count。这个是方便类似`vector<int> a(1,Color::count)`情况

```cpp
enum class Color
{
    black=0,
    white,
    red,
    count
};
```