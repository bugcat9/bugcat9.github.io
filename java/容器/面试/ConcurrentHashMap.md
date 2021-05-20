1. ConcurrentHashMap底层的实现原理，为什么能支持高并发
   * 在jdk1.7当中，ConcurrentHashMap采用Segment 数组、HashEntry 组成，Segment 数组中存储的是HashEntry 数组，HashEntry 和HashMap中table差不多，但是使用volatile去修饰了他的数据Value还有下一个节点next，保证了数据的可见性。
   * 在1.7当中高并发的原因是ConcurrentHashMap 采用了分段锁技术，其中Segment 继承于 ReentrantLock。不会像HashTable 那样不管是 put 还是 get 操作都需要做同步处理，理论上 ConcurrentHashMap 支持 CurrencyLevel (Segment 数组数量)的线程并发。HashTable 那样不管是 put 还是 get 操作都需要做同步处理，理论上 ConcurrentHashMap 支持 CurrencyLevel (Segment 数组数量)的线程并发。
   * 在jdk1.8中，放弃了原来的Segment 分段锁，而采用了`CAS + synchronized` 来保证并发安全性。总体来说跟HashMap很像，也把之前的HashEntry改成了Node，但是作用不变，把值和next采用了volatile去修饰，保证了可见性，并且也引入了红黑树，在链表大于一定值的时候会转换（默认是8）
2. 

