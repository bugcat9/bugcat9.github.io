---
title: span
date: 2024-11-10 22:24:28
tags:
categories:
- C++
---
`span`用于表示一段连续内存的范围。它提供了对底层数据的非拥有式引用，并支持类似数组的操作。

最大的作用是可以用于代替数组作为函数参数，把数组作参数时(非引用）会退化为指针，如果把数组当参数时，还得传递数组的长度， 这样就必须得两个参数了，比较麻烦。传递span就只需要一个参数，它代码更简单，更安全，不会越界。
<!--more-->


```cpp
int main(int argc, char** argv)
{
	int arr[] = { 1, 2, 3, 4, 5 };
	std::span<int> numbers(arr, 3); // 使用数组arr的前3个元素创建span

	for (auto num : numbers)
	{
		std::cout << num << std::endl;
	}
} 
```

需要注意的是，`std::span`仅仅是引用连续内存范围的一种方式，它并不拥有这块内存。因此，在使用`std::span`时需要确保被引用的内存块的生命周期大于或等于`std::span`对象的生命周期，以避免悬空引用。

