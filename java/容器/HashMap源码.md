[toc]

# HashMap源码

## HashMap 简介

HashMap 主要用来存放键值对，它基于哈希表的Map接口实现，是常用的Java集合之一。

JDK1.8 之前 HashMap 由 数组+链表 组成的，数组是 HashMap 的主体，链表则是主要为了解决哈希冲突而存在的（“拉链法”解决冲突）.JDK1.8 以后在解决哈希冲突时有了较大的变化，当链表长度大于阈值（默认为 8）时，将链表转化为红黑树（将链表转换成红黑树前会判断，如果当前数组的长度小于 64，那么会选择先进行数组扩容，而不是转换为红黑树），以减少搜索时间，具体可以参考 `treeifyBin`方法。

## 底层数据结构分析

### JDK1.8之前

JDK1.8 之前 HashMap 底层是 **数组和链表** 结合在一起使用也就是 **链表散列**。**HashMap 通过 key 的 hashCode 经过扰动函数处理过后得到 hash 值，然后通过 `(n - 1) & hash` 判断当前元素存放的位置（这里的 n 指的是数组的长度），如果当前位置存在元素的话，就判断该元素与要存入的元素的 hash 值以及 key 是否相同，如果相同的话，直接覆盖，不相同就通过拉链法解决冲突。**

**所谓扰动函数指的就是 HashMap 的 hash 方法。使用 hash 方法也就是扰动函数是为了防止一些实现比较差的 hashCode() 方法 换句话说使用扰动函数之后可以减少碰撞。**

**JDK 1.8 HashMap 的 hash 方法源码:**

JDK 1.8 的 hash方法 相比于 JDK 1.7 hash 方法更加简化，但是原理不变。

```java
static final int hash(Object key) {
      int h;
      // key.hashCode()：返回散列值也就是hashcode
      // ^ ：按位异或
      // >>>:无符号右移，忽略符号位，空位都以0补齐
      return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
  }
```

对比一下 JDK1.7的 HashMap 的 hash 方法源码.

```java
static int hash(int h) {
    // This function ensures that hashCodes that differ only by
    // constant multiples at each bit position have a bounded
    // number of collisions (approximately 8 at default load factor).

    h ^= (h >>> 20) ^ (h >>> 12);
    return h ^ (h >>> 7) ^ (h >>> 4);
}
```

相比于 JDK1.8 的 hash 方法 ，JDK 1.7 的 hash 方法的性能会稍差一点点，因为毕竟扰动了 4 次。

所谓 **“拉链法”** 就是：将链表和数组相结合。也就是说创建一个链表数组，数组中每一格就是一个链表。若遇到哈希冲突，则将冲突的值加到链表中即可。

![jdk1.8之前的内部结构](https://gitee.com/zhou-ning/BlogImage/raw/master/java/jdk1.8之前的内部结构.png)

### JDK1.8之后

相比于之前的版本，jdk1.8在解决哈希冲突时有了较大的变化，当链表长度大于阈值（默认为8）时，将链表转化为红黑树，以减少搜索时间。

![JDK1.8之后的HashMap底层数据结构](https://my-blog-to-use.oss-cn-beijing.aliyuncs.com/2019-6/JDK1.8之后的HashMap底层数据结构.jpg)

**类的属性：**

```java
public class HashMap<K,V> extends AbstractMap<K,V> implements Map<K,V>, Cloneable, Serializable {
    // 序列号
    private static final long serialVersionUID = 362498820763181265L;    
    // 默认的初始容量是16
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;   
    // 最大容量
    static final int MAXIMUM_CAPACITY = 1 << 30; 
    // 默认的填充因子
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    // 当桶(bucket)上的结点数大于这个值时会转成红黑树
    static final int TREEIFY_THRESHOLD = 8; 
    // 当桶(bucket)上的结点数小于这个值时树转链表
    static final int UNTREEIFY_THRESHOLD = 6;
    // 桶中结构转化为红黑树对应的table的最小大小
    static final int MIN_TREEIFY_CAPACITY = 64;
    // 存储元素的数组，总是2的幂次倍
    transient Node<k,v>[] table; 
    // 存放具体元素的集
    transient Set<map.entry<k,v>> entrySet;
    // 存放元素的个数，注意这个不等于数组的长度。
    transient int size;
    // 每次扩容和更改map结构的计数器
    transient int modCount;   
    // 临界值 当实际大小(容量*填充因子)超过临界值时，会进行扩容
    int threshold;
    // 加载因子
    final float loadFactor;
}
```

- **loadFactor加载因子**

  loadFactor加载因子是控制数组存放数据的疏密程度，loadFactor越趋近于1，那么 数组中存放的数据(entry)也就越多，也就越密，也就是会让链表的长度增加，loadFactor越小，也就是趋近于0，数组中存放的数据(entry)也就越少，也就越稀疏。

  **loadFactor太大导致查找元素效率低，太小导致数组的利用率低，存放的数据会很分散。loadFactor的默认值为0.75f是官方给出的一个比较好的临界值**。

  给定的默认容量为 16，负载因子为 0.75。Map 在使用过程中不断的往里面存放数据，当数量达到了 16 * 0.75 = 12 就需要将当前 16 的容量进行扩容，而扩容这个过程涉及到 rehash、复制数据等操作，所以非常消耗性能。

- **threshold**

  **threshold = capacity \* loadFactor**，**当Size>=threshold**的时候，那么就要考虑对数组的扩增了，也就是说，这个的意思就是 **衡量数组是否需要扩增的一个标准**。

**Node节点类源码:**

```java
// 继承自 Map.Entry<K,V>
static class Node<K,V> implements Map.Entry<K,V> {
       final int hash;// 哈希值，存放元素到hashmap中时用来与其他元素hash值比较
       final K key;//键
       V value;//值
       // 指向下一个节点
       Node<K,V> next;
       Node(int hash, K key, V value, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }
        public final K getKey()        { return key; }
        public final V getValue()      { return value; }
        public final String toString() { return key + "=" + value; }
        // 重写hashCode()方法
        public final int hashCode() {
            return Objects.hashCode(key) ^ Objects.hashCode(value);
        }

        public final V setValue(V newValue) {
            V oldValue = value;
            value = newValue;
            return oldValue;
        }
        // 重写 equals() 方法
        public final boolean equals(Object o) {
            if (o == this)
                return true;
            if (o instanceof Map.Entry) {
                Map.Entry<?,?> e = (Map.Entry<?,?>)o;
                if (Objects.equals(key, e.getKey()) &&
                    Objects.equals(value, e.getValue()))
                    return true;
            }
            return false;
        }
}
```

**树节点类源码:**

```java
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
        TreeNode<K,V> parent;  // 父
        TreeNode<K,V> left;    // 左
        TreeNode<K,V> right;   // 右
        TreeNode<K,V> prev;    // needed to unlink next upon deletion
        boolean red;           // 判断颜色
        TreeNode(int hash, K key, V val, Node<K,V> next) {
            super(hash, key, val, next);
        }
        // 返回根节点
        final TreeNode<K,V> root() {
            for (TreeNode<K,V> r = this, p;;) {
                if ((p = r.parent) == null)
                    return r;
                r = p;
       }
```

这里有一点奇怪，HashMap 的内部类 TreeNode 不继承它的了一个内部类 Node，却继承自 Node 的子类 LinkedHashMap 内部类 Entry,有点让人费解，这个问题的解答我们可以参考：https://www.imooc.com/article/22931

## HashMap源码分析

### 构造方法

HashMap 中有四个构造方法，它们分别如下：

```java
  // 默认构造函数。
    public HashMap() {
        this.loadFactor = DEFAULT_LOAD_FACTOR; // all   other fields defaulted
     }
     
     // 包含另一个“Map”的构造函数
     public HashMap(Map<? extends K, ? extends V> m) {
         this.loadFactor = DEFAULT_LOAD_FACTOR;
         putMapEntries(m, false);//下面会分析到这个方法
     }
     
     // 指定“容量大小”的构造函数
     public HashMap(int initialCapacity) {
         this(initialCapacity, DEFAULT_LOAD_FACTOR);
     }
     
     // 指定“容量大小”和“加载因子”的构造函数
     public HashMap(int initialCapacity, float loadFactor) {
         if (initialCapacity < 0)
             throw new IllegalArgumentException("Illegal initial capacity: " + initialCapacity);
         if (initialCapacity > MAXIMUM_CAPACITY)
             initialCapacity = MAXIMUM_CAPACITY;
         if (loadFactor <= 0 || Float.isNaN(loadFactor))
             throw new IllegalArgumentException("Illegal load factor: " + loadFactor);
         this.loadFactor = loadFactor;
         //tableSizeFor是使HashMap的容量为2的倍数的关键
         this.threshold = tableSizeFor(initialCapacity);
     }

```

```java
 /**
     * Returns a power of two size for the given target capacity.
     */
    static final int tableSizeFor(int cap) {
        int n = cap - 1;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
    }
```

tableSizeFor函数的讲解可以看[https://www.cnblogs.com/loading4/p/6239441.html](https://www.cnblogs.com/loading4/p/6239441.html)

**putMapEntries方法：**

```java
final void putMapEntries(Map<? extends K, ? extends V> m, boolean evict) {
    int s = m.size();
    if (s > 0) {
        // 判断table是否已经初始化
        if (table == null) { // pre-size
            // 未初始化，s为m的实际元素个数
            float ft = ((float)s / loadFactor) + 1.0F;
            int t = ((ft < (float)MAXIMUM_CAPACITY) ?
                    (int)ft : MAXIMUM_CAPACITY);
            // 计算得到的t大于阈值，则初始化阈值
            if (t > threshold)
                threshold = tableSizeFor(t);
        }
        // 已初始化，并且m元素个数大于阈值，进行扩容处理
        else if (s > threshold)
            resize();
        // 将m中的所有元素添加至HashMap中
        for (Map.Entry<? extends K, ? extends V> e : m.entrySet()) {
            K key = e.getKey();
            V value = e.getValue();
            putVal(hash(key), key, value, false, evict);
        }
    }
}
```

### put方法

HashMap只提供了put用于添加元素，putVal方法只是给put方法调用的一个方法，并没有提供给用户使用。

**对putVal方法添加元素的分析如下：**

- ①如果定位到的数组位置没有元素 就直接插入。
- ②如果定位到的数组位置有元素就和要插入的key比较，如果key相同就直接覆盖，如果key不相同，就判断p是否是一个树节点，如果是就调用`e = ((TreeNode)p).putTreeVal(this, tab, hash, key, value)`将元素添加进入。如果不是就遍历链表插入(插入的是链表尾部)。

直接覆盖之后应该就会 return，不会有后续操作。参考 JDK8 HashMap.java 658 行。

![put方法](https://my-blog-to-use.oss-cn-beijing.aliyuncs.com/2019-7/put方法.png)

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
    Node<K,V>[] tab; Node<K,V> p; int n, i;
    // table未初始化或者长度为0，进行扩容
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;
    // (n - 1) & hash 确定元素存放在哪个桶中，桶为空，新生成结点放入桶中(此时，这个结点是放在数组中)
    //第一步其实非常巧妙，利用了容量长度是2的幂，后面会有所讲
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    // 桶中已经存在元素
    else {
        Node<K,V> e; K k;
        // 比较桶中第一个元素(数组中的结点)的hash值相等，key相等
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
                // 将第一个元素赋值给e，用e来记录
                e = p;
        // hash值不相等，即key不相等；为红黑树结点
        else if (p instanceof TreeNode)
            // 放入树中
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
        // 为链表结点
        else {
            // 在链表最末插入结点
            for (int binCount = 0; ; ++binCount) {
                // 到达链表的尾部
                if ((e = p.next) == null) {
                    // 在尾部插入新结点
                    p.next = newNode(hash, key, value, null);
                    // 结点数量达到阈值，转化为红黑树
                    if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                        treeifyBin(tab, hash);
                    // 跳出循环
                    break;
                }
                // 判断链表中结点的key值与插入的元素的key值是否相等
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    // 相等，跳出循环
                    break;
                // 用于遍历桶中的链表，与前面的e = p.next组合，可以遍历链表
                p = e;
            }
        }
        // 表示在桶中找到key值、hash值与插入元素相等的结点
        if (e != null) { 
            // 记录e的value
            V oldValue = e.value;
            // onlyIfAbsent为false或者旧值为null
            if (!onlyIfAbsent || oldValue == null)
                //用新值替换旧值
                e.value = value;
            // 访问后回调
            afterNodeAccess(e);
            // 返回旧值
            return oldValue;
        }
    }
    // 结构性修改
    ++modCount;
    // 实际大小大于阈值则扩容
    if (++size > threshold)
        resize();
    // 插入后回调
    afterNodeInsertion(evict);
    return null;
} 
```

**我们再来对比一下 JDK1.7 put方法的代码**

**对于put方法的分析如下：**

- ①如果定位到的数组位置没有元素 就直接插入。
- ②如果定位到的数组位置有元素，遍历以这个元素为头结点的链表，依次和插入的key比较，如果key相同就直接覆盖，不同就采用头插法插入元素。

```java
public V put(K key, V value)
    if (table == EMPTY_TABLE) { 
    inflateTable(threshold); 
	}  
    if (key == null)
        return putForNullKey(value);
    int hash = hash(key);
    int i = indexFor(hash, table.length);
    for (Entry<K,V> e = table[i]; e != null; e = e.next) { // 先遍历
        Object k;
        if (e.hash == hash && ((k = e.key) == key || key.equals(k))) {
            V oldValue = e.value;
            e.value = value;
            e.recordAccess(this);
            return oldValue; 
        }
    }

    modCount++;
    addEntry(hash, key, value, i);  // 再插入
    return null;
}
```

### get方法

```java
public V get(Object key) {
    Node<K,V> e;
    return (e = getNode(hash(key), key)) == null ? null : e.value;
}

final Node<K,V> getNode(int hash, Object key) {
    Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (first = tab[(n - 1) & hash]) != null) {
        // 数组元素相等
        if (first.hash == hash && // always check first node
            ((k = first.key) == key || (key != null && key.equals(k))))
            return first;
        // 桶中不止一个节点
        if ((e = first.next) != null) {
            // 在树中get
            if (first instanceof TreeNode)
                return ((TreeNode<K,V>)first).getTreeNode(hash, key);
            // 在链表中get
            do {
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    return e;
            } while ((e = e.next) != null);
        }
    }
    return null;
}
```

### resize方法

进行扩容，会伴随着一次重新hash分配，并且会遍历hash表中所有的元素，是非常耗时的。在编写程序中，要尽量避免resize。

```java
final Node<K,V>[] resize() {
        //oldTab 为当前表的哈希桶
        Node<K,V>[] oldTab = table;
        //当前哈希桶的容量 length
        int oldCap = (oldTab == null) ? 0 : oldTab.length;
        //当前的阈值
        int oldThr = threshold;
        //初始化新的容量和阈值为0
        int newCap, newThr = 0;
        //如果当前容量大于0
        if (oldCap > 0) {
            //如果当前容量已经到达上限
            if (oldCap >= MAXIMUM_CAPACITY) {
                //则设置阈值是2的31次方-1
                threshold = Integer.MAX_VALUE;
                //同时返回当前的哈希桶，不再扩容
                return oldTab;
            }//否则新的容量为旧的容量的两倍。 
            else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                     oldCap >= DEFAULT_INITIAL_CAPACITY)//如果旧的容量大于等于默认初始容量16
                //那么新的阈值也等于旧的阈值的两倍
                newThr = oldThr << 1; // double threshold
        }//如果当前表是空的，但是有阈值。代表是初始化时指定了容量、阈值的情况
        else if (oldThr > 0) // initial capacity was placed in threshold
            newCap = oldThr;//那么新表的容量就等于旧的阈值
        else {
      //如果当前表是空的，而且也没有阈值。代表是初始化时没有任何容量/阈值参数的情况               
      // zero initial threshold signifies using defaults
            newCap = DEFAULT_INITIAL_CAPACITY;//此时新表的容量为默认的容量 16
            newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);//新的阈值为默认容量16 * 默认加载因子0.75f = 12
        }
        if (newThr == 0) {//如果新的阈值是0，对应的是  当前表是空的，但是有阈值的情况
            float ft = (float)newCap * loadFactor;//根据新表容量 和 加载因子 求出新的阈值
            //进行越界修复
            newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                      (int)ft : Integer.MAX_VALUE);
        }
        //更新阈值 
        threshold = newThr;
        @SuppressWarnings({"rawtypes","unchecked"})
        //根据新的容量 构建新的哈希桶
        Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
        //更新哈希桶引用
        table = newTab;
        //如果以前的哈希桶中有元素
        //下面开始将当前哈希桶中的所有节点转移到新的哈希桶中
        if (oldTab != null) {
            //遍历老的哈希桶
            for (int j = 0; j < oldCap; ++j) {
                //取出当前的节点 e
                Node<K,V> e;
                //如果当前桶中有元素,则将链表赋值给e
                if ((e = oldTab[j]) != null) {
                    //将原哈希桶置空以便GC
                    oldTab[j] = null;
                    //如果当前链表中就一个元素，（没有发生哈希碰撞）
                    if (e.next == null)
                        //直接将这个元素放置在新的哈希桶里。
                        //注意这里取下标 是用 哈希值 与 桶的长度-1 。 由于桶的长度是2的n次方，这么做其实是等于 一个模运算。但是效率更高
                        newTab[e.hash & (newCap - 1)] = e;
                        //如果发生过哈希碰撞 ,而且是节点数超过8个，转化成了红黑树（暂且不谈 避免过于复杂， 后续专门研究一下红黑树）
                    else if (e instanceof TreeNode)
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    //如果发生过哈希碰撞，节点数小于8个。则要根据链表上每个节点的哈希值，依次放入新哈希桶对应下标位置。
                    else { // preserve order
                        //因为扩容是容量翻倍，所以原链表上的每个节点，现在可能存放在原来的下标，即low位， 或者扩容后的下标，即high位。 high位=  low位+原哈希桶容量
                        //低位链表的头结点、尾节点
                        Node<K,V> loHead = null, loTail = null;
                        //高位链表的头节点、尾节点
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;//临时节点 存放e的下一个节点
                        do {
                            next = e.next;
                            //这里又是一个利用位运算 代替常规运算的高效点： 利用哈希值 与 旧的容量，可以得到哈希值去模后，是大于等于oldCap还是小于oldCap，等于0代表小于oldCap，应该存放在低位，否则存放在高位
                            if ((e.hash & oldCap) == 0) {
                                //给头尾节点指针赋值
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }//高位也是相同的逻辑
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }//循环直到链表结束
                        } while ((e = next) != null);
                        //将低位链表存放在原index处，
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        //将高位链表存放在新index处
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
        }
        return newTab;
    }
```

扩容一般是把新容量变为原来的两倍，在旧数组中同一条Entry链上的元素，通过重新计算索引位置后，有可能被放到了新数组的不同位置上。

下面以1.7版本为例，举个例子说明下扩容过程。假设了我们的hash算法就是简单的用key mod 一下表的大小（也就是数组的长度）。其中的哈希桶数组table的size=2， 所以key = 3、7、5，put顺序依次为 5、7、3。在mod 2以后都冲突在table[1]这里了。这里假设负载因子 loadFactor=1，即当键值对的实际大小size 大于 table的实际大小时进行扩容。接下来的三个步骤是哈希桶数组 resize成4，然后所有的Node重新rehash的过程。

![](https://gitee.com/zhou-ning/BlogImage/raw/master/java/HashMap源码2.png)

在1.8中我们使用的是2次幂的扩展(指长度扩为原来2倍)，所以，元素的位置要么是在原位置，要么是在原位置再移动2次幂的位置。看下图可以明白这句话的意思，n为table的长度，图（a）表示扩容前的key1和key2两种key确定索引位置的示例，图（b）表示扩容后key1和key2两种key确定索引位置的示例，其中hash1是key1对应的哈希与高位运算结果。

![img](https://gitee.com/zhou-ning/BlogImage/raw/master/java/HashMap源码3.png)

元素在重新计算hash之后，因为n变为2倍，那么n-1的mask范围在高位多1bit(红色)，因此新的index就会发生这样的变化：

![img](https://gitee.com/zhou-ning/BlogImage/raw/master/java/HashMap源码4.png)

因此，我们在扩充HashMap的时候，不需要像JDK1.7的实现那样重新计算hash，只需要看看原来的hash值新增的那个bit是1还是0就好了，是0的话索引没变，是1的话索引变成“原索引+oldCap”，可以看看下图为16扩充为32的resize示意图：

![img](https://gitee.com/zhou-ning/BlogImage/raw/master/java/HashMap源码5.png)

这个设计确实非常的巧妙，既省去了重新计算hash值的时间，而且同时，由于新增的1bit是0还是1可以认为是随机的，因此resize的过程，均匀的把之前的冲突的节点分散到新的bucket了。这一块就是JDK1.8新增的优化点。

### 位运算讲解：

前面有讲1.8的hash是这样`(h = key.hashCode()) ^ (h >>> 16)`,而通过`h & (table.length -1)`来得到该对象的保存位,这个方法非常巧妙。因为HashMap底层数组的长度总是2的n次方，length-1之后2进制前几位就都是1，`h& (length-1)`运算等价于对length取模，也就是h%length，但是&比%具有更高的效率(看下图可以明白)。

![HashMap源码1](https://gitee.com/zhou-ning/BlogImage/raw/master/java/HashMap源码1.png)

除此之外在扩容的时候，我们使用了`(e.hash & oldCap) == 0`进行判断是否为高位，为什么是这样呢？可以的时候我们是使用`h& (length-1)`得到保存的位置，而在扩容的时候我们需要知道高位是0还是1，如果是0的话就在原位置，是1的话就到高位，而oldCap刚好是2的幂，可以取出这一高位进行判断，也和开始的取得保存位相呼应。

### remove方法

```java
public V remove(Object key) {
        Node<K,V> e;
        return (e = removeNode(hash(key), key, null, false, true)) == null ?
            null : e.value;
    }
    
final Node<K,V> removeNode(int hash, Object key, Object value,
                               boolean matchValue, boolean movable) {
        // p 是待删除节点的前置节点
        Node<K,V>[] tab; Node<K,V> p; int n, index;
        //如果哈希表不为空，则根据hash值算出的index下 有节点的话。
        if ((tab = table) != null && (n = tab.length) > 0 &&
            (p = tab[index = (n - 1) & hash]) != null) {
            //node是待删除节点
            Node<K,V> node = null, e; K k; V v;
            //如果链表头的就是需要删除的节点
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                node = p;//将待删除节点引用赋给node
            else if ((e = p.next) != null) {//否则循环遍历 找到待删除节点，赋值给node
                if (p instanceof TreeNode)
                    node = ((TreeNode<K,V>)p).getTreeNode(hash, key);
                else {
                    do {
                        if (e.hash == hash &&
                            ((k = e.key) == key ||
                             (key != null && key.equals(k)))) {
                            node = e;
                            break;
                        }
                        p = e;
                    } while ((e = e.next) != null);
                }
            }
            //如果有待删除节点node，  且 matchValue为false，或者值也相等
            if (node != null && (!matchValue || (v = node.value) == value ||
                                 (value != null && value.equals(v)))) {
                if (node instanceof TreeNode)
                    ((TreeNode<K,V>)node).removeTreeNode(this, tab, movable);
                else if (node == p)//如果node ==  p，说明是链表头是待删除节点
                    tab[index] = node.next;
                else//否则待删除节点在表中间
                    p.next = node.next;
                ++modCount;//修改modCount
                --size;//修改size
                afterNodeRemoval(node);//LinkedHashMap回调函数
                return node;
            }
        }
        return null;
    }
```

### treeifyBin()方法

TreeNode里面有一个prev用于建树，以及删除的时候使用

```java
final void treeifyBin(Node<K,V>[] tab, int hash) {
     int n, index; Node<K,V> e;
     if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY)
         resize();//开始扩容
     else if ((e = tab[index = (n - 1) & hash]) != null) {//转红黑树结构
         TreeNode<K,V> hd = null, tl = null;
         do {//【标记1】把链表节点都改成红黑树节点
             TreeNode<K,V> p = replacementTreeNode(e, null);
             if (tl == null)
                 hd = p;
             else {
                 p.prev = tl;
                 tl.next = p;
             }
             tl = p;
         } while ((e = e.next) != null);
			//这时还是一条链表，不过节点都变成了树节点
         if ((tab[index] = hd) != null)
             hd.treeify(tab);//【标记2】开始构建树
     }
 }

TreeNode<K,V> replacementTreeNode(Node<K,V> p, Node<K,V> next) {
       return new TreeNode<>(p.hash, p.key, p.value, next);
   }

```

可能有人对Node怎么转化为TreeNode有问题，但是你点进去会发现其实TreeNode是继承自Node，所以能够实现

接下来是构建树treeify()方法

```java
final void treeify(Node<K,V>[] tab) {
     TreeNode<K,V> root = null;//红黑树根节点
     for (TreeNode<K,V> x = this, next; x != null; x = next) {
         next = (TreeNode<K,V>)x.next;
         x.left = x.right = null;
         if (root == null) {//一开始为null
             x.parent = null;
             x.red = false;//红黑树根节点必须是黑色
             root = x;//直接赋值给根节点
         }
         else {//这里说明根节点已存在，就要按二叉排序树方式插入
             K k = x.key;
             int h = x.hash;
             Class<?> kc = null;
             for (TreeNode<K,V> p = root;;) {//从根节点开始找合适插入位置
                 int dir, ph;
                 K pk = p.key;
                 if ((ph = p.hash) > h)
                     dir = -1;//往左子树走
                 else if (ph < h)
                     dir = 1;//往右子树走
				//hash值相等，就进一步处理
                 else if ((kc == null &&
                           (kc = comparableClassFor(k)) == null) ||
                          (dir = compareComparables(kc, k, pk)) == 0)
                     dir = tieBreakOrder(k, pk);
			//上面一系列都为了确定往左还是往右子树走
                 TreeNode<K,V> xp = p;
                 if ((p = (dir <= 0) ? p.left : p.right) == null) {//找到了插入的位置
                     x.parent = xp;//设置插入的节点父节点
                     if (dir <= 0)//说明插在左边
                         xp.left = x;
                     else//否则插在右边
                         xp.right = x;
				//【标记3】进行插入后的红黑树调整
                     root = balanceInsertion(root, x);
                     break;
                 }
             }
         }
     }
//【标记4】把根节点移动到数组一次(n-1)&hash就找到的下标下
     moveRootToFront(tab, root);
 }



```

将二叉树平衡等都是属于红黑树的内容，所以在这里不进行讲解。

接着moveRootToFront函数

```java
static <K,V> void moveRootToFront(Node<K,V>[] tab, TreeNode<K,V> root) {
     int n;
     if (root != null && tab != null && (n = tab.length) > 0) {
         int index = (n - 1) & root.hash;
         TreeNode<K,V> first = (TreeNode<K,V>)tab[index];
         if (root != first) {//root节点不是第一个节点
             Node<K,V> rn;
             tab[index] = root;
             TreeNode<K,V> rp = root.prev;//前节点
             if ((rn = root.next) != null)//
                 ((TreeNode<K,V>)rn).prev = rp;
             if (rp != null)
                 rp.next = rn;
			//上面就是删除链表节点操作
			//下面就是把节点插到链表头操作
             if (first != null)
                 first.prev = root;
             root.next = first;
             root.prev = null;
         }
		//检查状态是否正确
         assert checkInvariants(root);
     }
 }

```

### split()方法

```java
//红黑树转回链表的阈值
static final int UNTREEIFY_THRESHOLD = 6;

 /** 这个方法在HashMap进行扩容时会调用到:  ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
  * @param map 代表要扩容的HashMap
  * @param tab 代表新创建的数组，用来存放旧数组迁移的数据
  * @param index 代表旧数组的索引
  * @param bit 代表旧数组的长度，需要配合使用来做按位与运算
  */
  final void split(HashMap<K,V> map, Node<K,V>[] tab, int index, int bit) {
            //做个赋值，因为这里是((TreeNode<K,V>)e)这个对象调用split()方法，所以this就是指(TreeNode<K,V>)e对象，所以才能类型对应赋值
            TreeNode<K,V> b = this;
            //设置低位首节点和低位尾节点
            TreeNode<K,V> loHead = null, loTail = null;
            //设置高位首节点和高位尾节点
            TreeNode<K,V> hiHead = null, hiTail = null;
            //定义两个变量lc和hc，初始值为0，后面比较要用，他们的大小决定了红黑树是否要转回链表
            int lc = 0, hc = 0;
            //这个for循环就是对从e节点开始对整个红黑树做遍历，如果对这循环赋值略有不懂，可以参考这篇模仿的博客@1
            for (TreeNode<K,V> e = b, next; e != null; e = next) {
                //取e的下一节点赋值给next遍历
                next = (TreeNode<K,V>)e.next;
                //取好e的下一节点后，把它赋值为空，方便GC回收
                e.next = null;
                //以下的操作就是做个按位与运算，按照结果拉出两条链表，具体的操作可以参考这篇博客@2
                if ((e.hash & bit) == 0) {
                    if ((e.prev = loTail) == null)
                        loHead = e;
                    else
                        loTail.next = e;
                    loTail = e;
                    //做个计数，看下拉出低位链表下会有几个元素
                    ++lc;
                }
                else {
                    if ((e.prev = hiTail) == null)
                        hiHead = e;
                    else
                        hiTail.next = e;
                    hiTail = e;
                    //做个计数，看下拉出高位链表下会有几个元素
                    ++hc;
                }
            }
            
            //如果低位链表首节点不为null，说明有这个链表存在
            if (loHead != null) {
                //如果链表下的元素小于等于6
                if (lc <= UNTREEIFY_THRESHOLD)
                    //那就从红黑树转链表了，低位链表，迁移到新数组中下标不变，还是等于原数组到下标
                    tab[index] = loHead.untreeify(map);
                else {
                    //低位链表，迁移到新数组中下标不变，还是等于原数组到下标，把低位链表整个拉到这个下标下，做个赋值
                    tab[index] = loHead;
                    //如果高位首节点不为空，说明原来的红黑树已经被拆分成两个链表了
                    if (hiHead != null)
                        //那么就需要构建新的红黑树了
                        loHead.treeify(tab);
                }
            }
            //如果高位链表首节点不为null，说明有这个链表存在
            if (hiHead != null) {
                 //如果链表下的元素小于等于6
                if (hc <= UNTREEIFY_THRESHOLD)
                    //那就从红黑树转链表了，高位链表，迁移到新数组中的下标=【旧数组+旧数组长度】
                    tab[index + bit] = hiHead.untreeify(map);
                else {
                    //高位链表，迁移到新数组中的下标=【旧数组+旧数组长度】，把高位链表整个拉到这个新下标下，做赋值
                    tab[index + bit] = hiHead;
                    ////如果低位首节点不为空，说明原来的红黑树已经被拆分成两个链表了
                    if (loHead != null)
                        //那么就需要构建新的红黑树了
                        hiHead.treeify(tab);
                }
            }
        }

```

### untreeify()方法

```java
final Node<K,V> untreeify(HashMap<K,V> map) {
    Node<K,V> hd = null, tl = null;
    for (Node<K,V> q = this; q != null; q = q.next) {
        Node<K,V> p = map.replacementNode(q, null);
        if (tl == null)
            hd = p;
        else
            tl.next = p;
        tl = p;
    }
    return hd;
}

Node<K,V> replacementNode(Node<K,V> p, Node<K,V> next) {
    return new Node<>(p.hash, p.key, p.value, next);
}

```



**转载自：**

* [https://gitee.com/SnailClimb/JavaGuide/blob/master/docs/java/collection/HashMap.md](https://gitee.com/SnailClimb/JavaGuide/blob/master/docs/java/collection/HashMap.md)
* [https://zhuanlan.zhihu.com/p/21673805](https://zhuanlan.zhihu.com/p/21673805)
* [https://blog.csdn.net/seasonLai/article/details/84623078](https://blog.csdn.net/seasonLai/article/details/84623078)
* https://blog.csdn.net/weixin_38106322/article/details/104422422

