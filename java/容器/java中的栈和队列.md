# java中的栈和队列使用

在java中有写实现好的栈和队列提供我们使用，但是有关这些的数据结构的时候我经常性会弄错，所以写下来总结一下。

## Stack

在java8中，Stack的官方文档介绍如下：

```
public class Stack<E>
extends Vector<E>
The Stack class represents a last-in-first-out (LIFO) stack of objects.It extends class Vector with five operations that allow a vector to be treated as a stack. 
The usual push and pop operations are provided, as well as a method to peek at the top item on the stack, a method to test for whether the stack is empty, and a method to search the stack for an item and discover how far it is from the top.
When a stack is first created, it contains no items.

A more complete and consistent set of LIFO stack operations is provided by the Deque interface and its implementations, which should be used in preference to this class. For example:

   
   Deque<Integer> stack = new ArrayDeque<Integer>();
```

大致意思为：`Stack`类表示对象的后进先出（LIFO）栈。它使用五个操作扩展了`Vector`类，这些操作允许将矢量视为栈。提供了通常的推入(`push`)和弹出(`pop`)操作，以及一种查看栈顶部的方法(`peek`)，一种用于测试堆栈是否为空的方法（`empty`）以及一种用于在栈中搜索元素并发现其和顶部top距离的方法(`search`)。从顶部开始。 首次创建堆栈时，它不包含任何项目。 

除此之外Deque接口及其实现提供了一组更完整和一致的LIFO堆栈操作，应优先使用此类。例如：

```java
Deque<Integer> stack = new ArrayDeque<Integer>();
```

从上面的信息我们可以得出`Stack`有5个常用的方法

| Modifier and Type | Method and Description                                       |
| ----------------- | ------------------------------------------------------------ |
| `boolean`         | `empty()` <br />测试栈是否为空                               |
| `E`               | `peek()`<br />在不将其从栈中移除的情况下，查看该栈顶部的对象。在栈为空的时候会报`EmptyStackException` |
| `E`               | `pop()`<br />删除此栈顶部的对象，并将该对象作为此函数的值返回。在栈为空的时候会报`EmptyStackException` |
| `E`               | `push(E item)`<br />将一个项目推送到此堆栈的顶部。           |
| `int`             | `search(Object o)`<br />返回对象在此栈上的从1开始的位置。对象不存在则会返回-1 |
|                   |                                                              |

我们可以可以看到Satck的功能基本上已经满足我们的要求了，可是在文档上依然推荐我们使用`Deque`双端队列的实现类来完成Satck的功能，为什么是这也呢？

查了一些资料加上自己的理解是这样认为的，java中Satck类设计的有一些问题，因为我们可以看到`Satck`是继承自 `Vector`,但是依照程序设计的一个原则多组合少继承来看，这个设计是不合理的，应该是`Vector`组成`Satck`比较好，然后java的官方也发现了这个问题，但是后面想更改的时候时间就比较晚了，所以才在文档里面建议我们使用双端队列来模拟栈比较好



## Queue

在java中Queue是一个接口。在文档当中有对其的描述如下：

Queue除了基本的“收集”操作外，队列还提供其他插入，提取和检查操作。这些方法中的每一种都以两种形式存在：一种在操作失败时引发异常，另一种返回一个特殊值（根据操作而为null或false）。插入操作的后一种形式是专为与容量受限的Queue实现一起使用而设计的；在大多数实现中，插入操作不会失败。

下面这个表格就对应着一个发生异常，一个返回特殊值

|             | *Throws exception*                                           | *Returns special value*                                      |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **Insert**  | [`add(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#add-E-) | [`offer(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#offer-E-) |
| **Remove**  | [`remove()`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#remove--) | [`poll()`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#poll--) |
| **Examine** | [`element()`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#element--) | [`peek()`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#peek--) |

对应的方法介绍

| Modifier and Type | Method and Description                                       |
| ----------------- | ------------------------------------------------------------ |
| `boolean`         | `add(E e)`<br />如果可以立即将指定的元素插入此队列，而不会违反容量限制，则在成功时返回true，如果当前没有可用空间，则抛出IllegalStateException。 |
| `E`               | `element()`<br />检索但不删除此队列的头。                    |
| `boolean`         | `offer(E e)`<br />如果可以在不违反容量限制的情况下立即将指定的元素插入此队列。 |
| `E`               | `peek()`<br />检索但不删除此队列的头部，如果此队列为空，则返回null。 |
| `E`               | `poll()`<br />检索并删除此队列的头部，如果此队列为空，则返回null。 |
| `E`               | `remove()`<br />检索并删除此队列的头。                       |

## Deque

Deque是双端队列的接口，也是我们使用最多的队列，既可以当作栈也可以当作队列使用

`Deque`是支持在两端插入和删除元素的线性集合。名称双端队列是“双端队列”（double ended queue）的缩写。大多数Deque实施对它们可能包含的元素数量没有固定的限制，但是此接口支持容量受限的双端队列以及没有固定大小限制的双端队列。 此接口定义访问双端队列两端的元素的方法。提供了用于插入，删除和检查元素的方法。这些方法中的每一种都以两种形式存在：一种在操作失败时引发异常，另一种返回一个特殊值（根据操作而为null或false）。插入操作的后一种形式是专为容量受限的Deque实现而设计的。在大多数实现中，插入操作不会失败。

类似于队列，他也有一个表格

**First Element (Head)**：

|             | *Throws exception*                                           | *Returns special value*                                      |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **Insert**  | [`addFirst(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#addFirst-E-) | [`offerFirst(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#offerFirst-E-) |
| **Remove**  | [`removeFirst()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#removeFirst--) | [`pollFirst()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#pollFirst--) |
| **Examine** | [`getFirst()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#getFirst--) | [`peekFirst()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#peekFirst--) |

**Last Element (Tail)**

|             | *Throws exception*                                           | *Returns special value*                                      |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **Insert**  | [`addLast(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#addLast-E-) | [`offerLast(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#offerLast-E-) |
| **Remove**  | [`removeLast()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#removeLast--) | [`pollLast()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#pollLast--) |
| **Examine** | [`getLast()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#getLast--) | [`peekLast()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#peekLast--) |

因为该接口扩展了Queue接口。当双端队列用作队列时，将导致FIFO（先进先出）行为。元素在双端队列的末尾添加，并从开头删除。从Queue接口继承的方法与Deque方法完全等效，如下表所示：

| **`Queue` Method**                                           | **Equivalent `Deque` Method**                                |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`add(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#add-E-) | [`addLast(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#addLast-E-) |
| [`offer(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#offer-E-) | [`offerLast(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#offerLast-E-) |
| [`remove()`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#remove--) | [`removeFirst()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#removeFirst--) |
| [`poll()`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#poll--) | [`pollFirst()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#pollFirst--) |
| [`element()`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#element--) | [`getFirst()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#getFirst--) |
| [`peek()`](https://docs.oracle.com/javase/8/docs/api/java/util/Queue.html#peek--) | [`peekFirst()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#peek--) |

双端队列也可以用作LIFO（后进先出）堆栈。此接口应优先于旧版Stack类使用。当双端队列用作堆栈时，元素从双端队列的开头被压入并弹出。堆栈方法与Deque方法完全等效，如下表所示：

| **Stack Method**                                             | **Equivalent `Deque` Method**                                |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`push(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#push-E-) | [`addFirst(e)`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#addFirst-E-) |
| [`pop()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#pop--) | [`removeFirst()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#removeFirst--) |
| [`peek()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#peek--) | [`peekFirst()`](https://docs.oracle.com/javase/8/docs/api/java/util/Deque.html#peekFirst--) |

总结来说就是使用Deque作为队列时主要使用队列中的表对应提供的方法，而使用Deque作为栈时主要使用栈对应的表提供的方法。

因为Deque时继承自Queue，所以Queue的方法本身在Deque中是起作用的，但是除此之外Deque中对应栈的方法如：push、pop也是有的，并且功能也是刚好对应

```java
    public void push(E e) {
        addFirst(e);
    }
```

```java
    public E pop() {
        return removeFirst();
    }
```

所以，总结来说想使用栈的话用Deque实现是完全没有问题的。

另外需要说明Deque的实现类有许多，但是我们平时用不考虑多线程，使用ArrayDeque、LinkedList就足够了

## PriorityQueue

`PriorityQueue`是基于优先级堆的无界优先级队列。优先级队列的元素根据其自然顺序或在队列构造时提供的`Comparator`进行排序，具体取决于所使用的构造函数。优先级队列不允许空元素。依赖自然顺序的优先级队列也不允许插入不可比较的对象（这样做可能会导致`ClassCastException`）。

简单来说`PriorityQueue`就是一个优先级队列，在我们需要堆的时候可以使用`PriorityQueue`当作堆进行使用，因为`PriorityQueue`继承自`AbstractQueue`，而`AbstractQueue`实现`Queue`，所以`PriorityQueue`的方法和Queue差不多，使用起来也比较方便



## 总结

在不考虑多线程的情况下，使用栈就是使用Deque的实现类，使用队列就使用Deque的实现类，使用堆就使用PriorityQueue