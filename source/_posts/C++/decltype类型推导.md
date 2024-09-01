---
title: decltype类型推导
date: 2024-09-01 22:18:21
tags:
categories:
C++
---
# decltype类型推导
`decltype`可以推导出变量或者表达式的类型，比如
```cpp
#include <iostream>

int main() {
    int x = 5;
    const int& y = x;

    // 使用decltype获取变量的类型
    decltype(x) a = 10; // a的类型为int
    decltype(y) b = x; // b的类型为const int&

    // 使用decltype获取表达式的类型
    decltype(x + a) c = x + a; // c的类型为int

    std::cout << "a: " << a << std::endl;
    std::cout << "b: " << b << std::endl;
    std::cout << "c: " << c << std::endl;

    return 0;
}
```
平时自己使用`decltype`最多的时候是和lambda进行配合，推导lambda的类型
```cpp
#include <iostream>
#include <set>

int main() {
    // 使用lambda表达式定义比较器，按元素的绝对值从小到大排序
    auto cmp = [](int a, int b) {
        return std::abs(a) < std::abs(b);
    };

    // 在std::set中使用自定义的比较器
    std::set<int, decltype(cmp)> mySet(cmp);

    // 插入一些元素
    mySet.insert(-5);
    mySet.insert(3);
    mySet.insert(-2);
    mySet.insert(8);

    // 输出排序后的元素
    for (const auto& elem : mySet) {
        std::cout << elem << " ";
    }
    std::cout << std::endl;

    return 0;
}
```
## 主要作用
学习之后发现`decltype`主要作用是和`auto`一起对**函数模板返回值类型**进行推导
```cpp
// 函数模板，返回两个参数的和（C++14）
template <typename T, typename U>
 decltype(auto) add(T a, U b) {
    return a + b;
}
```
### auto和decltype的区别
这里只说auto和decltype推导函数模板返回值类型的区别

- auto推导返回值类型，走的是模板类型推导的一套规则，推导过程中引用性会被忽略
- decltype推导可以保留引用特性

（书中例子）比如：现在需要一个函数，一个形参为容器，一个形参为索引值，这个函数支持使用方括号的方式（也就是使用“`[]`”）访问容器中指定索引值的数据，然后在返回索引操作的结果前执行认证用户操作。
使用auto
```cpp
template<typename Container, typename Index>    //C++14版本，
auto authAndAccess(Container& c, Index i)
{
    authenticateUser();
    return c[i];                                //从c[i]中推导返回类型
}
```
使用auto进行推导的话，编译器使用的是模板类型推导的规则，容器`[]`返回类型为`T&`，`T&`进行推导时引用性被忽略，最终返回值类型被推导为`T`。
这样的话，下面这种类型代码就编译不过，有点和容器`[]`使用相悖
```cpp
std::deque<int> d;
…
authAndAccess(d, 5) = 10;               //认证用户，返回d[5]，
                                        //然后把10赋值给它
                                        //无法通过编译器！
```
但是如果使用decltype进行推导，可以保留初始化表达式的所有属性，所以返回值类型被推导为`T&`
```cpp
template<typename Container, typename Index>    //C++14版本，
decltype(auto) authAndAccess(Container& c, Index i)
{
    authenticateUser();
    return c[i];
}

```
当然目前authAndAccess 还不是最完美的，因为authAndAccess目前没有办法接受右值，下面的调用方式明显就不能使用
```cpp
std::deque<std::string> makeStringDeque();      //工厂函数

//从makeStringDeque中获得第五个元素的拷贝并返回
auto s = authAndAccess(makeStringDeque(), 5);
```
所以最完美的authAndAccess编写方式
```cpp
template<typename Container, typename Index>    //最终的C++14版本
decltype(auto) authAndAccess(Container&& c, Index i)
{
    authenticateUser();
    return std::forward<Container>(c)[i];
}
```
## 需要注意的点
decltype会将表达式推导为引用，所以对于表达式`(x)`，就会出现下面的奇葩情形
```cpp
int x = 0;
decltype(x) 	//int 类型
decltype((x))	//int&类型
```
从而出现这种情况
```cpp
decltype(auto) f1()
{
    int x = 0;
    …
    return x;                            //decltype(x）是int，所以f1返回int
}

decltype(auto) f2()
{
    int x = 0;
    return (x);                          //decltype((x))是int&，所以f2返回int&
}

```
这种情况需要注意
