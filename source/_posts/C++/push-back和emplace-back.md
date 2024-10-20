---
title: push_back和emplace_back
date: 2024-10-20 19:29:25
tags:
categories:
- C++
---
modern C++中提到使用考虑使用置入代替插入，个人理解就是使用考虑使用`emplace_back`代替`push_back`操作，那么这两者之间究竟有什么区别，想探究一下

首先这两个函数的定义是不一样的

## 函数定义
`push_back`是有两个函数的（重载），一个接受左值一个接受右值，并且接受右值后进行了`move`

```cpp
    _CONSTEXPR20 void push_back(const _Ty& _Val) { // insert element at end, provide strong guarantee
        _Emplace_one_at_back(_Val);
    }

    _CONSTEXPR20 void push_back(_Ty&& _Val) {
        // insert by moving into element at end, provide strong guarantee
        _Emplace_one_at_back(_STD move(_Val));
    }
```

而`emplace_back`是只有一个函数，是一个模板函数，参数是一个通用引用并且是变长参数，然后进行了完美转发`forward`

```cpp
    template <class... _Valty>
    _CONSTEXPR20 decltype(auto) emplace_back(_Valty&&... _Val) {
        // insert by perfectly forwarding into element at end, provide strong guarantee
       // 完美转发直接将参数传入内部
        _Ty& _Result = _Emplace_one_at_back(_STD forward<_Valty>(_Val)...);
#if _HAS_CXX17
        return _Result;
#else // ^^^ _HAS_CXX17 / !_HAS_CXX17 vvv
        (void) _Result;
#endif // _HAS_CXX17
    }
```

此外，`push_back`和`emplace_back`都使用了_Emplace_one_at_back进行插入

## 差异
### 性能上
先说结论：

**理论上来说，`emplace_back`比`push_back`效率更高。emplace_back能够在`vector`内部构建元素，从而减少拷贝或者移动操作**

这句话怎么理解呢，举个例子

```cpp
std::vector<std::string> vs;        //std::string的容器
vs.push_back("xyzzy");              //添加字符串字面量
```

通过上面的源码我们可以看到`push_back`接受的参数是一个`T`的元素，但是这里传入的是字面量，所以在这里会通过字面量创建出一个临时变量（隐式转换），等价于下面的代码

```cpp
vs.push_back(std::string("xyzzy")); //创建临时std::string，把它传给push_back
```

综上vs的`push_back`总共有三个操作

1. 一个`std::string`的临时对象从字面量“`xyzzy`”被创建。这个对象没有名字，我们可以称为`temp`。`temp`的构造是第一次`std::string`构造。因为是临时变量，所以`temp`是右值。
2. `temp`被传递给`push_back`的右值重载函数，绑定到右值引用形参`_Val`。在`std::vector`的内存中一个`_Val`的副本被创建。这次构造——也是第二次构造——在`std::vector`内部真正创建一个对象。
3. 在`push_back`返回之后，`temp`立刻被销毁，调用了一次`std::string`的析构函数。

当我们使用`emplace_back`时，

```cpp
vs.emplace_back("xyzzy");           //直接用“xyzzy”在vs内构造std::string
```

`emplace_back`使用完美转发将"xyzzy"传入了vector内部（就是前面` _Ty& _Result = _Emplace_one_at_back(_STD forward<_Valty>(_Val)...);`），直接在内部的数组的末尾**构建**元素插入，减少了临时变量的产生，提高了效率。

### 接受参数上
`emplace_back`使用完美转发，因此只要你没有遇到完美转发的限制（完美转发也会失败，在这里不多讲解），就可以传递任何实参以及组合到`emplace_back`。

比如

```cpp
vs.emplace_back(50, 'x');           //插入由50个“x”组成的一个std::string
vs.push_back(50, 'x');				// error
vs.push_back(std::string(50, 'x'))  // fine
```

再比如下面这种情况，临时变量都不给你转化，只能用emplace_back传入

```cpp
class A
{
public:
	explicit A(int a) :m_a(a) {

	}
private:
	int m_a;
};

std::vector<A> aVec;
aVec.push_back(1);		// error  
aVec.emplace_back(1);	// fine
```

所以写起来`emplace_back`肯定是更加舒服的，少写好多字母（理论上减少出错）。

## 代码实验
### 实验一（emplace_back高效性）
使用push_back

```cpp
class BaseClass
{
public:
	BaseClass(const std::string name) : name_(name)
	{
		std::cout << name_ << " constructor called" << std::endl;
	}
	BaseClass(const BaseClass& b) :name_(b.name_)
	{
		std::cout << name_ << " copy constructor called" << std::endl;
	}

	BaseClass(BaseClass&& b)
	{
		// 此处只是演示，并未进行真正移动
		name_ = b.name_;
		b.name_ = b.name_ + " have move";
		std::cout << name_ << " move constructor called" << std::endl;
	}
	virtual ~BaseClass()
	{
		std::cout << name_ << " destructor called" << std::endl;
	}
private:
	std::string name_;
};

int main(int argc, char** argv)
{
	std::vector<BaseClass> bcVec;
	std::cout << "--------------------------------push_back :" << std::endl;
	bcVec.push_back(BaseClass("push_back_obj"));
  // push_back：
  //    (1) 调用 有参构造函数 BaseClass (const std::string name) 创建临时对象；
  //    (2）调用 移动构造函数 BaseClass(BaseClass&& b) 到vector中；
  //    (3) 调用     析构函数               销毁临时对象；
	std::cout << "--------------------------------destruct:" << std::endl;
    //   (4) vector进行析构，调用析构函数 
}
```

运行结果符合预期

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/cpp/push_back_obj.png)

使用emplace_back

```cpp
int main(int argc, char** argv)
{
	std::vector<BaseClass> bcVec;
	std::cout << "--------------------------------emplace_back :" << std::endl;
	bcVec.emplace_back("emplace_back_obj");
    // (1) 在vector中直接调用构造函数创建元素
	std::cout << "--------------------------------destruct:" << std::endl;
    // (2) vector进行析构，调用析构函数 
}

```

运行结果

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/cpp/emplace_back_obj.png)

可以看得出来emplace_back少临时变量的**构造、移动、销毁**操作，效率要高一些

### 实验二（两者都传入右值）
如果传入右值，push_back 和 emplace_back效率相同，都会有临时变量产生的**构造、移动、销毁**操作。

push_back传入右值：

```cpp
std::cout << "--------------------------------push_back rvalue:" << std::endl;
bcVec.push_back(BaseClass("push_back_rvalue"));
  // push_back：
  //    (1) 调用 有参构造函数 BaseClass (const std::string name) 创建临时对象；
  //    (2）调用 移动构造函数 BaseClass(BaseClass&& b) 到vector中；
  //    (3) 调用     析构函数               销毁临时对象；
std::cout << "--------------------------------destruct:" << std::endl;
  //   (4) vector进行析构，调用析构函数 
```

上面已经展示过了，这里就不多解释了。

emplace_back传入右值：

```cpp
int main(int argc, char** argv)
{
	std::vector<BaseClass> bcVec;

	std::cout << "--------------------------------emplace_back rvalue:" << std::endl;
	bcVec.emplace_back(BaseClass("emplace_back_rvalue"));
  //    (1) 调用 有参构造函数 BaseClass (const std::string name) 创建临时对象；
  //    (2）调用 移动构造函数 BaseClass(BaseClass&& b) 到vector中；
  //    (3) 调用     析构函数               销毁临时对象；
	std::cout << "--------------------------------destruct:" << std::endl;
  //   (4) vector进行析构，调用析构函数 
    
}
```

运行结果，可以看出效率没有提高

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/cpp/emplace_back_rvalue.png)

### 实验三（两者都传入左值）
如果传入右值，push_back 和 emplace_back效率相同，两者都会调用拷贝构造函数

push_back传入左值：

```cpp
int main(int argc, char** argv)
{
	std::vector<BaseClass> bcVec;
	std::cout << "--------------------------------push_back lvalue:" << std::endl;
//  (1) 调用 有参构造函数 BaseClass (const std::string name) 创建obj对象；
	BaseClass obj("obj");
//  (2) 调用 拷贝构造函数；
	bcVec.push_back(obj);
	std::cout << "--------------------------------destruct:" << std::endl;
//  (3) obj被析构，调用BaseClass的析构函数
//  (4) vector被析构，其中的元素调用BaseClass的析构函数
    
}
```

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/cpp/push_back_lvalue.png)

emplace_back传入左值：

```cpp
int main(int argc, char** argv)
{
	std::vector<BaseClass> bcVec;
	std::cout << "--------------------------------emplace_back lvalue:" << std::endl;
//  (1) 调用 有参构造函数 BaseClass (const std::string name) 创建obj对象；
	BaseClass obj("obj");
//  (2) 调用 拷贝构造函数；
	bcVec.emplace_back(obj);
	std::cout << "--------------------------------destruct:" << std::endl;
//  (3) obj被析构，调用BaseClass的析构函数
//  (4) vector被析构，其中的元素调用BaseClass的析构函数
}
```

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/cpp/emplace_back_lvalue.png)

参考：
* [C++姿势点: push_back和emplace_back](https://zhuanlan.zhihu.com/p/183861524)