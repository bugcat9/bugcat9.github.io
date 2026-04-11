---
title: optional
date: 2024-11-10 22:13:28
tags:
categories:
- C++
---
optional可以处理那些可能为空的情况，尤其是作为函数返回值时。比如：一个函数返回值是int时，有时候会将-1作为异常值返回，但是有时候-1可能也是有效值，就又需要想异常值，这个时候optional就起到作用了。
<!--more-->
```cpp
#include <iostream>
#include <optional>
#include <string>
 
// optional can be used as the return type of a factory that may fail
std::optional<std::string> create(bool b)
{
    if (b)
        return "Godzilla";
    return {};
}
 
// std::nullopt can be used to create any (empty) std::optional
auto create2(bool b)
{
    return b ? std::optional<std::string>{"Godzilla"} : std::nullopt;
}
 
int main()
{
    std::cout << "create(false) returned "
              << create(false).value_or("empty") << '\n';
 
    // optional-returning factory functions are usable as conditions of while and if
    if (auto str = create2(true))
        std::cout << "create2(true) returned " << *str << '\n';
}
```