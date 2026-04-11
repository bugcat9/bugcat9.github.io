---
title: SFINAE学习
date: 2024-11-28 23:23:56
tags:
categories:
- C++
---
SFINAE 全称是substitution failure is not an error（“替换失败不是错误”），是C++模板当中的一项技术，感觉主要用途是在模板替换参数失败时，继续编译而不是报错并停止编译。

以下内容翻译自：[https://www.cppstories.com/2016/02/notes-on-c-sfinae/](https://www.cppstories.com/2016/02/notes-on-c-sfinae/)
<!--more-->
# 引言
```cpp
struct Bar {
    typedef double internalType;  
};

template <typename T> 
typename T::internalType foo(const T& t) { 
    cout << "foo<T>\n"; 
    return 0; 
}

int main() {
    foo(Bar());
    foo(0); // << error!
}
```

有一个函数模板返回T::internalType，我们用Bar和int参数类型调用它。

在vs2022上编译报错

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/cpp/SFINAE学习1.png)

当实现一个简单的、合适的返回int的函数时。如下：

```cpp
int foo(int i) { cout << "foo(int)\n"; return 0; }
```

当为int类型添加重载函数时，编译器可以找到合适的匹配并调用代码。但是在编译过程中，编译器也会“查看”模板化的函数头文件。这个函数对于int类型无效，那么为什么甚至没有报告警告（就像没有提供第二个函数时那样）？要理解这一点，我们需要看一下为函数调用构建重载解析集的过程。

# C++重载解析过程
当编译器试图编译一个函数调用时（简化）：

1. 执行按函数名称查找
2. 对于函数模板，模板实参值是从传递给函数的实际实参的类型推导出来的。
    1. 所有出现的模板形参（在返回类型和形参类型中）都用这些推导出来的类型替换。
    2. **当此过程导致无效类型（如int::internalType）时，将从重载解析集中删除特定的函数**。(SFINAE)
3. 最后，我们有一个可用于特定调用的可行函数列表。
    1. 如果此集合为空，则编译失败。
    2. 如果选择了多个函数，就会产生歧义。
    3. 一般来说，其形参与实参最匹配的候选函数是被调用的函数。

![画板](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/cpp/SFINAE学习2.png)

在我们的例子中：typename T::internalType foo（const T& T）不是int的好匹配，它被重载解析集拒绝了。但是最后，int foo（int i）是集合中唯一的选项，所以编译器没有报告任何问题。

# SFINAE作用
每当我们想要为特定类型选择合适的函数/专门化时，可以使用SFINAE技术

+ 当T有一个给定的方法时调用一个函数（比如如果T有toString方法调用toString()）
+ 禁止从包装器类型进行窄化或错误转换。例如，这用于防止std::variant推断出错误的类型。参考: [c++ 17类型转换中有关std::variant的所有信息](https://www.cppstories.com/2018/06/variant/#type-conversions) 
+ 为所有类型的trait特化一个函数（is_integral, is_array, is_class, is_pointer，等等）



## `std::enable_if`使用
enable_if是一组工具，从c++ 11开始在标准库中可用，它们在内部使用了SFINAE。它们允许从可能的函数模板或类模板的**特化**重载中进行 包含/排除。

比如：

```cpp
// C++11:
template <class T>
typename std::enable_if<std::is_arithmetic<T>::value, T>::type  
foo(T t) {
  std::cout << "foo<arithmetic T>\n";
  return t;
}
```

foo函数适用于所有算术类型（int, long, float…）。如果传递其他类型（例如MyClass），foo将无法实例化。换句话说，重载解析集中拒绝非算术类型的模板实例化。这种类似的结构可以用作**模板形参、函数形参或函数返回类型**。

enable_if可能的实现

```cpp
template<bool B, class T = void>
struct enable_if {};
 
template<class T>
struct enable_if<true, T> { typedef T type; };
```

`enable_if<condition,T>::type`，如果条件为真，则`enable_if<condition,T>::type`将生成T，如果条件为假，`enable_if<>::type`则生成无效替换。

enable_if可以与 [type traits](http://en.cppreference.com/w/cpp/types) 一起使用，以提供基于trait的最佳函数版本。

从c++ 14和c++ 17开始，引入了_v和_t变量模板和模板别名。不需要为`enable_if`或traits使用`::type`或`::value`，引入了`_v`和`_t`变量模板和模板别名。

之前的代码可以变成：

```cpp
// C++17:
template <class T>
typename std::enable_if_t<std::is_arithmetic_v<T>, T> // << shorter!
foo(T t) {
  std::cout << "foo<arithmetic T>\n";
  return t;
}
```

完整的例子

```cpp
#include <iostream>
#include <type_traits>

template <class T>
typename std::enable_if_t<std::is_arithmetic_v<T>, T> // << shorter!
foo(T t) {
  std::cout << "foo<arithmetic T>\n";
  return t;
}

template <class T>
typename std::enable_if_t<!std::is_arithmetic_v<T>, void>
foo(T t) {
  std::cout << "foo fallback\n";
}

int main() {
    foo(0);
    foo(std::string{});
}
```

# SFINAE的缺点
SFINAE和enable_if是比厉害的功能，但也很难正确使用。简单的例子可能行得通，但在现实生活中，可能会遇到各种各样的问题：

+ 模板错误：你喜欢阅读由编译器生成的模板错误吗？特别是当您使用STL类型时？
+ 可读性
+ 嵌套模板通常在enable_if语句中不起作用

我们能做得更好吗？

# SFINAE的替代方案
我们至少有三点：

+ tag 调度
+ 编译期if
+ Concepts

## Tag 调度
这是选择调用函数的哪个版本的一个可读性更强的版本。首先，我们定义一个核心函数，然后根据一些编译时条件调用版本A或B。

```cpp
template <typename T>
int get_int_value_impl(T t, std::true_type) {
    return static_cast<int>(t+0.5f);
}

template <typename T>
int get_int_value_impl(T t, std::false_type) {
    return static_cast<int>(t);
}

template <typename T>
int get_int_value(T t) {
    return get_int_value_impl(t, std::is_floating_point<T>{});
}
```

当调用get_int_value时，编译器将检查std::is_floating_point的值，然后调用匹配的_impl函数。

## 编译期if（C++17）
从c++ 17开始，我们有了一个新的工具，可以在编译时检查条件，而不需要编写复杂的模板代码！

可以用一个简短的形式来表达：

```cpp
template <typename T>
int get_int_value(T t) {
     if constexpr (std::is_floating_point<T>) {
         return static_cast<int>(t+0.5f);
     }
     else {
         return static_cast<int>(t);
     }
}
```

## Concepts （C++20）
在c++ 20中，我们将获得一个期待已久的特性，使用Concepts，您将能够在模板参数上添加约束，并获得更好的编译器警告。

一个基本的例子：

```cpp
// define a concept:
template <class T>
concept SignedIntegral = std::is_integral_v<T> && std::is_signed_v<T>;

// use:
template <SignedIntegral T>
void signedIntsOnly(T val) { }
```

在上面的代码中，我们首先创建了一个描述有符号和整型类型的Concept。请注意，我们可以使用现有的类型特征。稍后，我们将使用它来定义一个函数模板，该模板只支持与该概念匹配的类型。这里我们不使用typename T，但我们可以引用Concepts的名称。

现在让我们试着用一个例子来概括我们的知识。

# 一个完整例子
为了总结，最好通过一些工作示例来了解如何使用SFINAE：

测试的class：

```cpp
template <typename T>
class HasToString {
private:
    typedef char YesType[1];
    typedef char NoType[2];

    template <typename C> static YesType& test(decltype(&C::ToString));
    template <typename C> static NoType& test(...);

public:
    enum { value = sizeof(test<T>(0)) == sizeof(YesType) };
};
```

上面的模板类将用于测试某个给定类型T是否有ToString（）方法。我们这里有什么。SFINAE的概念在哪里使用？你能看到吗？

当我们想要执行测试时，我们需要这样写：

```cpp
HasToString<T>::value
```

如果我们在那里传递int会发生什么？它将类似于本文开头的第一个示例。编译器将尝试执行模板替换，它将在以下情况下失败：

```cpp
template <typename C> static YesType& test( decltype(&C::ToString) ) ;
```

显然，没有int::ToString方法，因此第一个重载方法将被排除在解析集之外。但是，第二个方法将通过（NoType& test（…）），因为它可以在所有其他类型上调用。所以这里我们得到SFINAE！删除了一个方法，只有第二个方法对该类型有效。  
 最后枚举的最终值，计算如下：

```cpp
enum { value = sizeof(test<T>(0)) == sizeof(YesType) };
```

返回NoType，由于sizeof（NoType）与sizeof（YesType）不同，因此最终值将为0。

如果我们提供并测试下面的类，会发生什么？

```cpp
class ClassWithToString {
public:
    string ToString() { return "ClassWithToString object"; }
};
```

现在，模板替换将生成两个候选方法：两个测试方法都是有效的，但是第一个更好，并且将被“使用”。我们将得到YesType，最后HasToString<ClassWithToString>::value返回1作为结果。

如何使用这样的检查器类？

理想情况下，写一些if语句会很方便：

```cpp
if (HasToString<decltype(obj)>::value)
    return obj.ToString();
else
    return "undefined";
```

我们可以使用if constexpr来编写这段代码

```cpp
template <typename T>
string CallToString(T t) {
     if constexpr (HasToString<decltype(obj)>::value) {
          return obj.ToString();
     }
     else {
         return "undefined";
     }
}
```

但出于本例的目的，我们将重点放在c++ 11/14解决方案上。

为此，可以使用enable_if并创建两个函数：一个接受带有ToString的类，另一个接受所有其他情况。

```cpp
template<typename T> 
typename enable_if<HasToString<T>::value, string>::type
CallToString(T * t) {
    return t->ToString();
}

string CallToString(...) {
    return "undefined...";
}
```

同样，在上面的代码中有SFINAE。当您传递生成HasToString<T>::value = false的类型时，enable_if将无法实例化。

上述技术相当复杂，也有局限性。例如，它不限制函数的返回类型。

让我们看看现代c++如何提供帮助。

# 现代c++的救星
+ `decltype`
+ `declval`
+ `constexpr`
+ `std::void_t`
+ detection idiom

## decltype
Decltype是一个功能强大的工具，可以返回给定表达式的类型。我们已经用它来：

```cpp
template <typename C> 
static YesType& test( decltype(&C::ToString) ) ;
```

它返回C::ToString成员方法的类型（如果此类方法存在于该类的上下文中）。

### `declval` 
declval是一个实用程序，它允许您在**不创建实际对象**的情况下调用T上的方法。在本例中，可以使用它来检查方法的返回类型：

```plain
decltype(declval<T>().toString())
```

### `constexpr`   
Constexpr建议编译器在编译时计算表达式（如果可能的话）。否则，我们的检查器方法可能只在运行时求值。新风格建议为大多数方法添加constexpr。

## `void_t`   
+ [SO question: Usingvoid_tto check if a class has a method with a specific signature](http://stackoverflow.com/questions/26366205/using-void-t-to-check-if-a-class-has-a-method-with-a-specific-signature)
+ [SO question: How doesvoid_twork](http://stackoverflow.com/questions/27687389/how-does-void-t-work)

Full video for the lecture:

[CppCon 2014: Walter E. Brown “Modern Template Metaprogramming: A Compendium, Part II” - YouTube](https://www.youtube.com/watch?v=a0FliKwcwXE&feature=emb_logo)

Starting at around 29 minute, and especially around 39 minutes.

This is an amazing meta-programming pattern! I don’t want to spoil anything, so just watch the video, and you should understand the idea! :)

## **detection idiom**
+ [WG21 N4436, PDF](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2015/n4436.pdf) - -提出对c++检测习惯用法的标准库支持，由Walter E. Brown编写
+ [std::is_detected](http://en.cppreference.com/w/cpp/experimental/is_detected)
+ [wikibooks: C++ Member Detector](https://en.wikibooks.org/wiki/More_C%2B%2B_Idioms/Member_Detector) 成员检测器

Walter E. Brown提出了一个完整的实用程序类，可用于检查给定类的接口和其他属性。当然，其中大部分是基于void_t技术。

## 改进代码
如果我是正确的，假设你在编译器/库中有void_t，这是代码的新版本：

```cpp
// default template:
template< class , class = void >
struct has_toString : false_type { };

// specialized as has_member< T , void > or sfinae
template< class T>
struct has_toString<T , void_t<decltype(&T::toString)>> : std::is_same<std::string, decltype(declval<T>().toString())>
{ };
```

它使用基于void_t的显式检测习语。基本上，当类中没有T::toString（）时，就会发生SFINAE，最终得到通用的默认模板（因此使用了false_type）。但是当类中有这样的方法时，将选择模板的专门化版本。如果我们不关心方法的返回类型，这可能就是结束。但是在这个版本中，我们通过继承std::is_same来检查这一点。代码检查方法的返回类型是否为std::string。这样就可以得到true_type或false_type。

## Concepts 进行拯救
我们可以在c++ 20中做得更好。有了这个特性，我们可以声明一个新concept 来指定类的接口：

比如：

```cpp
template <typename T>
concept HasToString = requires(T v)
{
    {v.toString()} -> std::convertible_to<std::string>;
};
```

就这些！所有这些都是用一个很好的和易于阅读的语法编写的。

我们可以用一些测试代码来尝试：

```cpp
#include <iostream>
#include <string>
#include <type_traits>

template <typename T>
concept HasToString = requires(const T v)
{
    {v.toString()} -> std::convertible_to<std::string>;
};

struct Number {
    int _num { 0 };
    std::string toString() const { return std::to_string(_num); };
};

void PrintType(HasToString auto& t) {
    std::cout << t.toString() << '\n';
}

int main() {
    Number x { 42 };
    PrintType(x);
}
```

如果你的类型不支持toString，那么你可能会得到编译错误

# 总结
在这篇文章中，我们介绍了SFINAE的理论和例子，SFINAE是一种模板编程技术，它允许你拒绝来自重载解析集的代码。在原始形式下，这可能有点复杂，但由于现代c++，我们有许多工具可以提供帮助：例如enable_if， std::declval和其他一些工具。更重要的是，如果您有幸使用最新的c++标准，您可以利用c++ 17中的constexpr和c++ 20中的Concepts。



后者——concepts ——可以彻底改变我们的模板代码，使其易于阅读和使用！

