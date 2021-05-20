# yaml语法介绍

# 一、基本语法

key:(空格)value，表示一个键值对（空格不能省略）

以空格的缩进来控制层级关系（有的类似python）；只要是左对齐的一列数据，都是同一个层级的，其中属性和值也是大小写敏感；

```yaml
server:
	port: 8081
	path: /hello
```

其中`port: 8081`就表示一个键值对，而`port、path`就是同一级

## 二、值的写法

### 1.普通类型（数字、字符串、布尔）

直接使用k: v就行

```yaml
name: "张三"
age: 20
isMarried: false
```

需要主要的地方：

字符串默认不用加上单引号或者双引号，也可以加上，但是单引号和双引号会有一些小区别，

 ""：双引号；不会转义字符串里面的特殊字符；特殊字符会作为本身想表示的意思 name: "zhangsan \n lisi"：输出；zhangsan 换行 lisi ''

：单引号；会转义特殊字符，特殊字符最终只是一个普通的字符串数据 name: ‘zhangsan \n lisi’：输出；zhangsan \n lisi



### 2.对象、Map类型（键值对）

k: v：在下一行来写对象的属性和值的关系；注意缩进 对象还是k: v的方式。

```yaml
friends:
	lastName: zhangsan
	age: 20
```

行内写法

```yaml
friends: {lastName: zhangsan,age: 18}
```



### 3.数组（List，Set）

用 "- 值" 表示数组中的一个元素

```yaml
pets:
 ‐ cat
 ‐ dog
 ‐ pig
```

行内写法

```yaml
pets: [cat,dog,pig]
```

### 4.占位符

当yml做springboot中配置文件的时候还可以使用一些随机数和占位符

**随机数：**

```yaml
${random.value}、${random.int}、${random.long}
${random.int(10)}、${random.int[1024,65536]}
```

**占位符：**

```yml
person:
  lastName: 张三${random.uuid}
  age: ${random.int}
  birth: 2020/5/1
  boss: false
  maps: {k1: v1,k2: v2}
  lists:
    - lisi
    - zhaoliu

  dog:
    name: ${person.lastName:hello}小狗
    age: 2
```

`${person.lastName:hello}`表示使用前面person的lastName值，如果lastName没有默认为hello，当然其实：hello也可以不写。当properties文件做springboot的配置文件时也可以使用这些

## 总结

yaml是以数据为中心来代替xml的，在springboot中主要用yaml来进行配置，学习一下。

