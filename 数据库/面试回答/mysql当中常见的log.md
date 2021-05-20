# Mysql当中常见的log

## 一、binlog

### 1.什么是binlog

binlog记录了数据库表结构和表数据的变更，比如：`update、delete、insert`。但是它不会记录`select`(因为没有对表的结构进行变更)。

### 2.binlong的内容

binlog主要存储着每条变更的SQl语句

### 3.binlog的作用

binlong主要有两个作用：复制和恢复数据

* MySQL的主从复制，主要使用binlog进行实现
* 数据库的数据消失，也主要是使用binlog进行恢复



## 二、redo log

**redo log是innodb自带的log**。引入的原因如下：

在Mysql当中，我们查找或者修改数据，都会把Mysql这条记录所在的页找到，然后把页加载到内存当中，再进行对应的修改，并且修改完之后并不会立即存到磁盘之上(因为如果每个请求都修改后，立即罗马到磁盘上，速度会非常慢，mysql页顶不住)。所以mysql引入了redo log日志，解决此问题。

mysql在内存写完之后，会写一份`redo log`,这个`redo log`记载着这次在这个页上做了什么修改。不过其实写`redo log`的时候，也会有`buffer`，是先写`buffer`，再真正落到磁盘中的。至于从`buffer`什么时候落磁盘，会有配置供我们配置。

所以写`redo log`也是需要写磁盘的，但它的好处就是`顺序IO`（我们都知道顺序IO比随机IO快非常多）。

简单的说`redo log`的存在是未了我们写完内存了，但是数据未写道磁盘上时，数据库挂了，我们剋根据`redo log`进行恢复。写`redo log`也是需要写磁盘的，但它的好处就是`顺序IO`（我们都知道顺序IO比随机IO快非常多）。

## 三、binlog和redo log的区别

`binlog`和`redo log`看起来都是起到恢复作用，但是还是有些许不同

### 1.存储内容

`binlog`记载的是`update/delete/insert`这样的SQL语句，而`redo log`记载的是物理修改的内容（xxxx页修改了xxx）。所以在搜索资料的时候会有这样的说法：`redo log` 记录的是数据的**物理变化**，`binlog` 记录的是数据的**逻辑变化**

### 2.功能上

redo log作用是未持久化，如果数据库挂掉，可以通过redo log恢复内存以及还没有来得及疏导磁盘当中的数据，将redo log加载到内存里面，那内存就能够恢复到挂掉之前的数据

binlog的作用是复制和恢复而生

- 主从服务器需要保持数据的一致性，通过`binlog`来同步数据。
- 如果整个数据库的数据都被删除了，`binlog`存储着所有的数据变更情况，那么可以通过`binlog`来对数据进行恢复。

也就是说如果整个数据库的数据都被删除，那我们不能使用redo log的记录对数据进行恢复。因为功能的不同，`redo log` 存储的是物理数据的变更，如果我们内存的数据已经刷到了磁盘了，那`redo log`的数据就无效了。所以`redo log`不会存储着**历史**所有数据的变更，**文件的内容会被覆盖的**。

### 3.写入细节

`redo log`是MySQL的InnoDB引擎所产生的。

`binlog`无论MySQL用什么引擎，都会有的。

InnoDB是有事务的，事务的四大特性之一：持久性就是靠`redo log`来实现的（如果写入内存成功，但数据还没真正刷到磁盘，如果此时的数据库挂了，我们可以靠`redo log`来恢复内存的数据，这就实现了持久性）。

`binloh`和`redo log`也有一个写入顺序。 `redo log`**事务开始**的时候，就开始记录每次的变更信息，而`binlog`是在**事务提交**的时候才记录。

于是会有新的问题出现：我们写log的时候失败了怎么办。

* 如果写`redo log`失败了，我们认为此次事务存在问题，会直接进行回滚，不再写`binlog`
* 如果写 `redo log`成功了，写`binlog`,然后写`binlog`失败了，我们也会对这次事务进行回滚，将无效`binlog`进行删除（因为`binlog`会影响从库的数据，所以需要做删除操作）
* 如果写`redo log`和`binlog`都成功了，那这次算是事务才会真正成功。

简而言之就是只有有失败就进行回滚。MySQL通过**两阶段提交**来保证`redo log`和`binlog`的数据是一致的。

过程：

* 阶段1：MySQL通过**两阶段提交**来保证`redo log`和`binlog`的数据是一致的。
* 阶段2：`binlog` 写盘，InooDB 事务进入 `commit` 状态
* 每个事务`binlog`的末尾，会记录一个 `XID event`，标志着事务是否提交成功，也就是说，恢复过程中，`binlog` 最后一个 XID event 之后的内容都应该被 purge。



## 四、undo log

`undo log`主要用于回滚和多版本控制(MVCC)

`undo log`和`redo log`类似，在数据修改的时候会进行记录，然后事务失败的时候，可以使用`undo log`进行回滚。

`undo log`主要存储的是逻辑日志，比如我们要`insert`一条数据了，那`undo log`会记录的一条对应的`delete`日志。我们要`update`一条记录时，它会记录一条对应**相反**的update记录。





