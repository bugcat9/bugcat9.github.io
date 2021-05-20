# mysql当中的mvvc

# 一、MVVC介绍

MVVC全称为Multiversion Concurrency Control，翻译过来是多版本控制，指的是一种提高并发的计数，使用于mysql当中，作用是使得读读、读写、写读都不需要阻塞，只有**写写**进行阻塞。这样大幅度提高了InnoDB的并发能力。在内部实现中，InnoDB通过undo log保存每条数据的多个版本，并且能够找回数据历史版本提供给用户读，每个事务读到的数据版本可能是不一样的。在同一个事务中，用户只能看到该事务创建快照之前已经提交的修改和该事务本身做的修改。

MVCC在Read Committed 和 Repeatable Read两个隔离级别下工作。MySQL的InnoDB存储引擎默认事务隔离级别是RR(可重复读)，是通过 "行级锁+MVCC"一起实现的，正常读的时候不加锁，写的时候加锁。而 MVCC 的实现依赖：**隐藏字段、Read View、Undo log**。

1. 隐藏字段

   1. DB_TRX_ID(db_trx_id):表示最近一次对本记录行进行修改(insert|update)的事务id。
   2. DB_ROLL_PTR(db_roll_ptr):回滚指针，指向当前记录行的`undo log`信息
   3. DB_ROW_ID(db_row_id):随着新行插入而单调递增的行id。理解：当表没有主键或唯一非空索引时，innodb就会使用这个行ID自动产生聚簇索引。如果表有主键或唯一非空索引，聚簇索引就不会包含这个行ID了。**这个DB_ROW_ID跟MVCC关系不大**。

2. read view结构

   其实Read View(读试图)，跟快照、snapshot是一个概念。 Read View主要是用来做可见性判断的, 里面保存了“对本事务不可见的其他活跃事务”。

   * **low_limit_id**：目前出现过的最大事务id+1，即下一个将被分配的事务id。
   * **up_limit_id**：活跃事务列表trx_ids中最小的事务ID，如果trx_ids为空，则up_limit_id 为 low_limit_id。
   * trx_ids：Read View创建时其他未提交的活跃事务ID列表。意思就是创建Read View时，将当前未提交事务ID记录下来，后续即使它们修改了记录行的值，对于当前事务也是不可见的。
   * creator_trx_id：当前创建事务的ID，是一个递增的编号。

3. Undo log

## 二