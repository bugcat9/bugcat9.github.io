---
title: move
date: 2024-10-20 19:22:54
tags:
categories:
- C++
---
`std::move`执行到右值的无条件的转换，但就自身而言，它不移动任何东西

内部的实现类似这样：

```cpp
template<typename T>
typename remove_reference<T>::type&& move(T&& param)
{
    using ReturnType = typename remove_reference<T>::type&&;
    return static_cast<ReturnType>(param);
}
```
<!--more-->
1. `remove_reference<T>::type`对`T`去除引用
2. `using ReturnType = typename remove_reference<T>::type&&`，使得`ReturnType`是一个右值引用
3. `static_cast<ReturnType>(param)` 将param转化为右值引用

类似使用C++14版本更简单：

```cpp
template<typename T>
decltype(auto) move(T&& param)          //C++14，仍然在std命名空间
{
    using ReturnType = remove_referece_t<T>&&;
    return static_cast<ReturnType>(param);
}
```

