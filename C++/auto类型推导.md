---
title: auto类型推导
date: 2024-08-26 23:09:44
tags:
categories:
- C++
---
# auto类型推导
## 推导规则
auto类型推导和模板类型大致相同，分为三种类型
<!--more-->
- 类型说明符是一个指针或引用但不是通用引用
```cpp
int x = 27;                
auto & rx=x;             //rx是非通用引用，rx推导为int &
```

- 情景二：类型说明符一个通用引用
```cpp
int x = 27;
auto&& uref1 = x;  //x是int左值，
                    //所以uref1类型为int&
auto&& uref2 = 27;	//27是int右值，
                    //所以uref3类型为int&&
```

- 情景三：类型说明符既不是指针也不是引用
```cpp
auto y = 27;    //y 推导为int 
```
vs2022代码运行
```cpp
#include <boost/type_index.hpp>
#include <iostream>
#include <utility>
using namespace std;
using boost::typeindex::type_id_with_cvr;

int main() {
	int x = 27;
	auto& rx = x;             //rx是非通用引用，rx推导为int &
	cout << "rx = "
		<< type_id_with_cvr<decltype(rx)>().pretty_name()
		<< '\n';
	auto&& uref1 = x;         //x是int左值，所以uref1类型为int&
	cout << "uref1 = "
		<< type_id_with_cvr<decltype(uref1)>().pretty_name()
		<< '\n';
	auto&& uref2 = 27;	    //27是int右值，所以uref3类型为int&&
	cout << "uref2 = "
		<< type_id_with_cvr<decltype(uref2)>().pretty_name()
		<< '\n';
	auto y = 27;            //y 推导为int 
	cout << "y = "
		<< type_id_with_cvr<decltype(y)>().pretty_name()
		<< '\n';
	return 0;
}
```
![1723387016585.png](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/cpp/auto类型推导.png)
这部分内容可以去查看 [模板类型推导的总结](https://bugcat.top/2024/08/10/C++/%E6%A8%A1%E6%9D%BF%E7%B1%BB%E5%9E%8B%E6%8E%A8%E5%AF%BC/)
## 需要注意的地方
`auto`和 模板推导不同的地方的地方是： auto类型推导假定花括号表示`std::initializer_list`，而模板类型推导不会这样
```cpp
auto x = { 11, 23, 9 };         //x的类型是std::initializer_list<int>

template<typename T>            //带有与x的声明等价的
void f(T param);                //形参声明的模板

f({ 11, 23, 9 });               //错误！不能推导出T
```
 此外，C++14还允许auto 推导函数返回值，lambda函数也允许在形参声明中使用`auto`，不过虽然用了auto关键字，但是底层还是**模板类型推导**的那一套规则在工作，所以也不能推导出 “花括号表示`std::initializer_list`”
```cpp
auto createInitList()
{
    return { 1, 2, 3 };         //错误！不能推导{ 1, 2, 3 }的类型
}


std::vector<int> v;
auto resetV = 
    [&v](const auto& newValue){ v = newValue; };        //C++14
resetV({ 1, 2, 3 });            //错误！不能推导{ 1, 2, 3 }的类型

```
