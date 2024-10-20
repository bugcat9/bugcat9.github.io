---
title: forward
date: 2024-10-20 19:25:56
tags:
categories:
- C++
---
 C++中的`std::forward`函数是一个非常有用的工具，主要用于在泛型编程中完美转发（perfect forwarding）参数。在C++中，完美转发是指将函数模板中接收到的参数以**原始形式（左值或右值）转发给另一个函数**，保持参数的值类别（左值或右值）不变。  
<!--more-->
```cpp
template<typename T>                        //C++14；仍然在std命名空间
T&& forward(remove_reference_t<T>& param)
{
  return static_cast<T&&>(param);
}
```

假设有一个函数f：

```cpp
template<typename T>
void f(T&& fParam)
{
    …                                   //做些工作
    someFunc(std::forward<T>(fParam));  //转发fParam到someFunc
}
```

## 假设传入是左值
传入到`f`的实参是`Widget`的左值类型。`T`被推导为`Widget&`，然后调用`std::forward`将实例化为`std::forward<Widget&>`。`Widget&`带入到上面的`std::forward`的实现中：

```cpp
Widget& && forward(remove_reference_t<Widget&>& param)
{ 
    return static_cast<Widget& &&>(param); 
}
```

最终forward转化为返回一个左值引用

```cpp
Widget& forward(Widget& param)
{ 
    return static_cast<Widget&>(param);
}
```

当左值实参被传入到函数模板`f`时，`std::forward`被实例化为接受和返回左值引用。内部的转换不做任何事，因为`param`的类型已经是`Widget&`，所以转换没有影响。左值实参传入`std::forward`会返回左值引用。通过定义，左值引用就是左值，因此将左值传递给`std::forward`会返回左值，就像期待的那样

## 假设传入是右值
传递给`f`的实参是一个`Widget`的右值。在这个例子中，`f`的类型参数`T`的推导类型就是`Widget`。`f`内部的`std::forward`调用因此为`std::forward<Widget>`，`std::forward`实现中把`T`换为`Widget`得到：

```cpp
Widget&& forward(remove_reference_t<Widget>& param)
{ 
    return static_cast<Widget&&>(param); 
}
```

最终转化为：

```cpp
Widget&& forward(Widget& param)
{ 
    return static_cast<Widget&&>(param); 
}
```

**从函数返回的右值引用可以被定义为右值**，最终结果是，传递给`f`的右值参数将作为右值转发给`someFunc`，正是想要的结果。

**从函数返回的右值引用可以被定义为右值的理解**：

如果不加forward，传入右值，fParam推导类型是Widget&&，最终直接传入someFunc，它是有名字（fParam）的，所以是一个左值。

```cpp
template<typename T>
void f(T&& fParam)
{
    …                                   //做些工作
    someFunc(fParam);  //转发fParam到someFunc
}
```

加了forward后，forward返回一个Widget&&类型，返回是有个匿名变量，它是一个右值

```cpp
template<typename T>
void f(T&& fParam)
{
    …                                   //做些工作
    someFunc(std::forward<T>(fParam));  //转发fParam到someFunc
}
```
